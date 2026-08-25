/**
 * responsive.md §1 — the root font-size at five viewports. If these numbers are
 * wrong the fluid root is wrong and nothing downstream can be trusted.
 */
import { launchChromium } from './lib/browser.mjs';
const REF = [
  { w: 1920, h: 1080, size: 1500, expect: 12.0,  label: '1920x1080' },
  { w: 1440, h: 900,  size: 1500, expect: 9.60,  label: '1440x900' },
  { w: 1024, h: 768,  size: 1500, expect: 6.83,  label: '1024x768' },
  { w: 768,  h: 1024, size: 834,  expect: 9.21,  label: '768x1024 portrait' },
  { w: 390,  h: 844,  size: 390,  expect: 10.00, label: '390x844' },
];
const browser = await launchChromium();
const page = await browser.newPage();
console.log('viewport              --size   reference     ours    gutter  status');
let bad = 0;
for (const r of REF) {
  await page.setViewportSize({ width: r.w, height: r.h });
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  const m = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return { fs: parseFloat(cs.fontSize), size: cs.getPropertyValue('--design-width').trim() };
  });
  const delta = Math.abs(m.fs - r.expect);
  const status = delta < 0.06 ? 'match' : `DIFFERS (${delta > 0 ? '+' : ''}${(m.fs - r.expect).toFixed(2)})`;
  if (delta >= 0.06) bad++;
  console.log(
    `${r.label.padEnd(20)} ${String(m.size).padStart(5)}  ${r.expect.toFixed(2).padStart(8)}px ${m.fs.toFixed(2).padStart(8)}px ${(m.fs*2).toFixed(1).padStart(8)}px  ${status}`,
  );
}
await browser.close();
console.log(bad === 0 ? '\nAll five match the reference.' : `\n${bad} viewport(s) differ from the reference.`);
