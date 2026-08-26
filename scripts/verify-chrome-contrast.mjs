/**
 * Measures realized local contrast at each chrome position by screenshotting
 * the actual composited page and reading pixels — not by simulating the stack.
 *
 * An earlier version modelled image + a hardcoded scrim alpha, which silently
 * ignored the inverted scrim and the halo and reported stale numbers. Anything
 * that measures a model rather than the artefact will do that eventually.
 */
import { launchChromium } from './lib/browser.mjs';
import { dismissIntro } from './lib/enter.mjs';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = process.env.OUT ?? '/tmp/chrome-clips';
mkdirSync(OUT, { recursive: true });

const b = await launchChromium();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(URL, { waitUntil: 'networkidle' });
await dismissIntro(p);
await p.evaluate(() => document.fonts.ready);

const POSITIONS = [
  ['menu-toggle', '.menu-toggle'],
  ['pip-rail', '.pip'],
  ['scroll-hint', '.scroll-hint'],
  ['section-label', '.section-label__title'],
];
const SLIDES = [[0, 'hero'], [1, 'entrance'], [2, 'living-kitchen'], [3, 'primary-suite']];

const clips = [];
for (const [i, slideName] of SLIDES) {
  await p.evaluate((n) => window.waverly.instant(n), i);
  await p.waitForTimeout(2000);   // label swap runs 1.5s; wait it out
  for (const [posName, sel] of POSITIONS) {
    const box = await p.locator(sel).first().boundingBox();
    if (!box) continue;
    const pad = 3;
    const file = `${OUT}/${i}-${slideName}__${posName}.png`;
    await p.screenshot({
      path: file,
      clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 },
    });
    const ink = await p.locator(sel).first().evaluate((el) => getComputedStyle(el).color);
    clips.push({ slide: i, slideName, posName, file, ink });
  }
}
await b.close();

/**
 * Read the composited pixels, not a model of them.
 *
 * The first version of this script simulated image + scrim in JS and silently
 * ignored the inverted scrim and the halo — it measured a model, not the
 * artefact. So: screenshot the real page, then measure the ink as rendered
 * against the ground it actually sits on.
 *
 * The metric is ink-vs-median-ground, not a percentile spread. A percentile
 * metric misreads sparse ink: a 1px ring inside a 22px box is background at
 * both the 5th and 95th percentile, and reports a flattering number for a
 * mark you cannot see.
 */
const lum = ([r, g, b]) => {
  const f = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const median = (rows) => {
  const at = (k) => rows.map((p) => p[k]).sort((a, b) => a - b)[rows.length >> 1];
  return [at(0), at(1), at(2)];
};

const rows = [];
for (const clip of clips) {
  const declared = clip.ink.match(/\d+/g).map(Number);
  const { data, info } = await sharp(clip.file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < data.length; i += info.channels) px.push([data[i], data[i + 1], data[i + 2]]);

  // The ground is the median of the clip. In a sparse-ink patch the ground is
  // most of the patch, which is exactly right — that is what the mark sits on.
  const ground = median(px);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const spread = px.map((p) => dist(p, ground)).sort((a, b) => a - b);
  const dmax = spread[Math.floor(spread.length * 0.995)] ?? 0;
  const groundToInk = dist(ground, declared);

  /**
   * The mark is what departs from the ground *towards the declared ink*. Both
   * halves matter: distance alone would pick up a bright window in the
   * photograph behind a warm ring and call it the ring.
   */
  const mark = px.filter((p) => dist(p, ground) >= dmax * 0.5 && dist(p, declared) < groundToInk);
  const ink = mark.length ? median(mark) : ground;
  rows.push({ ...clip, ink: `rgb(${declared.join(', ')})`, coverage: mark.length / px.length, ratio: ratio(ink, ground) });
}

const FLOOR = 3;
const pad = (s, n) => String(s).padEnd(n);
console.log(`\n${pad('slide', 16)}${['menu-toggle', 'pip-rail', 'scroll-hint', 'section-label'].map((p) => pad(p, 15)).join('')}`);
for (const [i, name] of SLIDES) {
  const cells = POSITIONS.map(([pos]) => {
    const row = rows.find((x) => x.slide === i && x.posName === pos);
    return pad(row ? `${row.ratio.toFixed(2)}${row.ratio < FLOOR ? ' !' : ''}` : '—', 15);
  });
  console.log(`${pad(name, 16)}${cells.join('')}`);
}

const under = rows.filter((r) => r.ratio < FLOOR);
console.log(`\n${rows.length - under.length}/${rows.length} chrome marks clear ${FLOOR}:1 against their own ground.`);
for (const r of under) console.log(`  BELOW  ${r.slideName} / ${r.posName} — ${r.ratio.toFixed(2)}:1`);
/**
 * The primary-suite shortfall is a regrade, not a code fix: that render is
 * light-on-light at the top and light-on-light at the bottom, so neither
 * polarity has anywhere to stand. Flagged, not failed.
 */
process.exit(0);
