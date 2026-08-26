/** Confirms the re-skin actually landed: three colours, no reference hues. */
import { launchChromium } from './lib/browser.mjs';
const browser = await launchChromium();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForSelector('body.is-ready');

const tokens = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return ['--c-warm', '--c-white', '--c-black', '--c-warm-20', '--c-warm-40', '--scrim-desktop', '--c-scrim', '--c-gold']
    .map((n) => [n, s.getPropertyValue(n).trim()]);
});
for (const [n, v] of tokens) console.log(`  ${n.padEnd(16)} ${v || '(unset)'}`);

const css = await page.evaluate(async () => {
  const links = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href);
  const texts = await Promise.all(links.map((h) => fetch(h).then((r) => r.text())));
  return texts.join('\n');
});
const ok = (name, pass, d) => console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${d ? ` — ${d}` : ''}`);
ok('warm neutral is #715f47', tokens.find((t) => t[0] === '--c-warm')[1] === '#715f47');
ok('reference gold #7c7262 is gone from the served CSS', !/7c7262|124 114 98/.test(css));
ok('reference slate scrim #3c6278 is gone', !/3c6278|60 98 120/.test(css));
ok('--c-scrim and --c-gold are unset', !tokens.find((t) => t[0] === '--c-scrim')[1] && !tokens.find((t) => t[0] === '--c-gold')[1]);
await browser.close();
