/**
 * Proves the transition shader runs when flagged on.
 * Shipping default is OFF (crossfade) — mobile WebGL was painting black
 * while the photographs sat hidden underneath.
 */
import { launchChromium } from './lib/browser.mjs';
import { dismissIntro } from './lib/enter.mjs';
import { mkdirSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = process.env.OUT ?? '/tmp/shader-frames';
mkdirSync(OUT, { recursive: true });
const r = []; const ok = (n, p, d) => { r.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d ? ` — ${d}` : ''}`); };

const b = await launchChromium({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

const off = await b.newPage({ viewport: { width: 1200, height: 750 } });
const offChunks = [];
off.on('request', (q) => { if (/shader-renderer/.test(q.url())) offChunks.push(q.url()); });
await off.goto(URL, { waitUntil: 'networkidle' });
await dismissIntro(off);
ok('shader is OFF by default', (await off.evaluate(() => !document.querySelector('.gl-slides'))) === true);
ok('shader chunk is not fetched by default', offChunks.length === 0, `${offChunks.length} requests`);
const hasPhoto = await off.evaluate(() => {
  const img = document.querySelector('.slide .picture__img');
  return !!img && getComputedStyle(document.querySelector('.slide')).display !== 'none';
});
ok('photographs remain visible (not a black canvas)', hasPhoto === true);
await off.close();

const p = await b.newPage({ viewport: { width: 1200, height: 750 } });
await p.goto(`${URL}?shader=1`, { waitUntil: 'networkidle' });
await dismissIntro(p);
const info = await p.evaluate(() => {
  const c = document.querySelector('.gl-slides');
  const gl = c?.getContext('webgl2') || c?.getContext('webgl');
  return {
    canvas: !!c,
    ctx: !!gl,
    vendor: gl ? gl.getParameter(gl.VERSION) : null,
    domImagesHidden: [...document.querySelectorAll('.slide')].every((s) => getComputedStyle(s).display === 'none'),
  };
});
console.log(' ', JSON.stringify(info));
ok('canvas present when flagged on', info.canvas === true);
ok('WebGL context created', info.ctx === true, info.vendor ?? '');
ok('DOM crossfade layers stood down when flagged', info.domImagesHidden === true);

await p.evaluate(() => {
  window.__log = [];
  const m = window.waverly;
  const r = m.options.renderer;
  const oc = r.change.bind(r);
  r.change = (f, t) => { window.__started = performance.now(); oc(f, t); };
  const oo = m.options.onChange;
  m.options.onChange = (c, prev) => {
    window.__log.push({ c, ms: performance.now() - window.__started });
    oo?.(c, prev);
  };
});
await p.keyboard.press('ArrowDown');
await p.waitForTimeout(900);
await p.screenshot({ path: `${OUT}/shader-mid-wipe.png` });
const log = await p.evaluate(() => window.__log);
ok('shader-driven transition advanced one slide', log?.[0]?.c === 1, JSON.stringify(log?.[0]));

await p.close();
await b.close();
const f = r.filter((x) => !x).length;
console.log(`\n${r.length - f}/${r.length} checks passed`);
process.exit(f ? 1 : 0);
