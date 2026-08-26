/**
 * Proves the transition shader runs and is driven by the same tween as the
 * crossfade. Shipping default is ON; opt out with ?shader=0.
 */
import { launchChromium } from './lib/browser.mjs';
import { dismissIntro } from './lib/enter.mjs';
import { mkdirSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = process.env.OUT ?? '/tmp/shader-frames';
mkdirSync(OUT, { recursive: true });
const r = []; const ok = (n, p, d) => { r.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d ? ` — ${d}` : ''}`); };

const b = await launchChromium({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

// default: on
const on = await b.newPage({ viewport: { width: 1200, height: 750 } });
const onChunks = [];
on.on('request', (q) => { if (/shader-renderer/.test(q.url())) onChunks.push(q.url()); });
await on.goto(URL, { waitUntil: 'networkidle' });
await dismissIntro(on);
ok('shader is ON by default', (await on.evaluate(() => !!document.querySelector('.gl-slides'))) === true);
ok('shader chunk is fetched by default', onChunks.length > 0, `${onChunks.length} requests`);
await on.close();

// flagged off
const off = await b.newPage({ viewport: { width: 1200, height: 750 } });
await off.goto(`${URL}?shader=0`, { waitUntil: 'networkidle' });
await dismissIntro(off);
ok('shader opts out with ?shader=0', (await off.evaluate(() => !document.querySelector('.gl-slides'))) === true);
await off.close();

// flagged on (explicit)
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
ok('DOM crossfade layers stood down', info.domImagesHidden === true);

// Drive one transition and capture a mid-frame if possible
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
ok('transition roughly matches the long hero exit', (log?.[0]?.ms ?? 0) > 2000, `${Math.round(log?.[0]?.ms ?? 0)}ms`);

await p.close();
await b.close();
const f = r.filter((x) => !x).length;
console.log(`\n${r.length - f}/${r.length} checks passed`);
process.exit(f ? 1 : 0);
