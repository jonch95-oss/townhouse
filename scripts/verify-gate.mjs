/**
 * The gate stack, vertically. Measures the real intro component against the
 * type and layout rules — no mock markup.
 */
import { launchChromium } from './lib/browser.mjs';

const r = [];
const ok = (n, p, d) => {
  r.push(p);
  console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d ? ` — ${d}` : ''}`);
};

const b = await launchChromium();
console.log('viewport        headline   air above   btn air below   verdict');

for (const [w, h, label] of [
  [650, 400, '650x400'],
  [844, 390, '844x390 phone LS'],
  [926, 428, '926x428 phone LS'],
  [650, 900, '650x900'],
  [768, 1024, '768x1024'],
  [1440, 900, '1440x900'],
]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(process.env.URL ?? 'http://localhost:4173/', { waitUntil: 'networkidle' });
  await p.waitForSelector('body.is-ready');
  await p.waitForSelector('.intro__enter', { timeout: 10000 });
  // Let the entrance settle so opacity/layout are final.
  await p.waitForTimeout(3500);
  await p.evaluate(() => document.fonts.ready);

  const m = await p.evaluate(() => {
    const title = document.querySelector('.intro__title');
    const body = document.querySelector('.intro__body');
    const btn = document.querySelector('.intro__enter');
    if (!title || !body || !btn) return null;
    const t = title.getBoundingClientRect();
    const bRect = body.getBoundingClientRect();
    const btnR = btn.getBoundingClientRect();
    const line = parseFloat(getComputedStyle(title).lineHeight);
    const words = ['TERRACOTTA', 'AND', 'BRICK'];
    const original = title.innerHTML;
    let widest = 0;
    for (const word of words) {
      title.textContent = word;
      widest = Math.max(widest, title.getBoundingClientRect().width);
    }
    title.innerHTML = original;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return {
      size: Math.round(parseFloat(getComputedStyle(title).fontSize)),
      line: Math.round(line),
      airAbove: Math.round(t.top),
      gapBody: Math.round(bRect.top - t.bottom),
      gapBtn: Math.round(btnR.top - bRect.bottom),
      airBelow: Math.round(window.innerHeight - btnR.bottom),
      overlap: btnR.bottom > window.innerHeight || t.top < 0 || btnR.top < bRect.bottom - 1,
      widest,
      avail: window.innerWidth - rem * 4,
      hasMedia: !!document.querySelector('.intro__media'),
      noSoundCta: !document.body.innerText.toLowerCase().includes('without sound'),
    };
  });

  if (!m) {
    ok(`${label}: intro present`, false);
    await p.close();
    continue;
  }

  const tight = m.airAbove < m.line;
  const verdict = m.overlap ? 'OVERLAP' : tight ? 'tight' : 'ok';
  console.log(
    `${label.padEnd(16)} ${String(m.size).padStart(4)}px ${String(m.airAbove).padStart(9)}px ${String(m.airBelow).padStart(15)}px   ${verdict}`,
  );
  ok(`${label}: no overlap`, !m.overlap);
  ok(
    `${label}: headline fits the width`,
    m.widest <= m.avail,
    `${Math.round(m.widest)}px into ${Math.round(m.avail)}px`,
  );
  if (label === '1440x900') {
    ok('gate uses a still, not a cloud canvas', m.hasMedia);
    ok('no "enter without sound" CTA', m.noSoundCta);
  }
  await p.close();
}

await b.close();
const f = r.filter((x) => !x).length;
console.log(`\n${r.length - f}/${r.length} checks passed`);
process.exit(f ? 1 : 0);
