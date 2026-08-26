/** Transfer weight of the images the page actually fetches, per viewport. */
import { launchChromium } from './lib/browser.mjs';
const b = await launchChromium();
for (const [w, h, label] of [[1440, 900, 'desktop 1440'], [390, 844, 'mobile 390']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const seen = new Map();
  p.on('response', async (r) => {
    const u = r.url();
    if (!/\.(avif|webp|jpe?g|png)(\?|$)/i.test(u)) return;
    try { seen.set(u, (await r.body()).length); } catch { /* ignore */ }
  });
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await p.waitForSelector('body.is-ready');
  await p.waitForTimeout(1500);
  if (process.env.VERBOSE) for (const [u, n] of seen) console.log(`    ${(n/1024).toFixed(0).padStart(5)}KB  ${u.replace('http://localhost:4173','')}`);
  const total = [...seen.values()].reduce((a, n) => a + n, 0);
  const byFmt = {};
  for (const [u, n] of seen) { const f = u.match(/\.(avif|webp|jpe?g|png)/i)[1].toLowerCase(); byFmt[f] = (byFmt[f] ?? 0) + n; }
  console.log(`${label.padEnd(14)} ${String(seen.size).padStart(2)} images  ${(total / 1024).toFixed(0).padStart(5)} KB   ${Object.entries(byFmt).map(([f, n]) => `${f} ${(n / 1024).toFixed(0)}KB`).join('  ')}`);
  await p.close();
}
await b.close();
