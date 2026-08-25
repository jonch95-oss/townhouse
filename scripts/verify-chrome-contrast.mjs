/**
 * Measures realized local contrast at each chrome position by screenshotting
 * the actual composited page and reading pixels — not by simulating the stack.
 *
 * An earlier version modelled image + a hardcoded scrim alpha, which silently
 * ignored the inverted scrim and the halo and reported stale numbers. Anything
 * that measures a model rather than the artefact will do that eventually.
 */
import { launchChromium } from './lib/browser.mjs';
import { mkdirSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = process.env.OUT ?? '/tmp/chrome-clips';
mkdirSync(OUT, { recursive: true });

const b = await launchChromium();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForSelector('body.is-ready');
await p.evaluate(() => document.fonts.ready);

const POSITIONS = [
  ['menu-toggle', '.menu-toggle'],
  ['pip-rail', '.pip'],
  ['scroll-hint', '.scroll-hint'],
  ['section-label', '.section-label__title'],
];
const SLIDES = [[0, 'hero-placeholder'], [1, 'entrance'], [2, 'kitchen'], [3, 'primary-bath'], [4, 'fourth-placeholder']];

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
console.log(JSON.stringify(clips));
