/**
 * Proves the transition shader runs and is driven by the same tween as the
 * crossfade. It is not tuned and it is not the shipping path.
 */
import { launchChromium } from './lib/browser.mjs';
import { dismissIntro } from './lib/enter.mjs';
import { mkdirSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:4173/';
/**
 * Scratch by default. This used to write straight into docs/review/, so every
 * run left a tracked file modified with a frame captured a few milliseconds
 * differently — a dirty tree that says nothing changed. Set OUT to refresh the
 * committed screenshot deliberately.
 */
const OUT = process.env.OUT ?? '/tmp/shader-frames';
mkdirSync(OUT, { recursive: true });
const r = []; const ok = (n, p, d) => { r.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d ? ` — ${d}` : ''}`); };

const b = await launchChromium({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

// default: off
const off = await b.newPage({ viewport: { width: 1200, height: 750 } });
const offChunks = [];
off.on('request', (q) => { if (/shader-renderer/.test(q.url())) offChunks.push(q.url()); });
await off.goto(URL, { waitUntil: 'networkidle' });
await dismissIntro(off);
ok('shader is OFF by default', (await off.evaluate(() => !document.querySelector('.gl-slides'))) === true);
ok('shader chunk is not even fetched by default', offChunks.length === 0, `${offChunks.length} requests`);
await off.close();

// flagged on
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

// a real transition, sampled mid-wipe
const frames = [];
await p.evaluate(() => {
  window.__samples = [];
  const m = window.waverly;
  const rend = m.options.renderer;
  const orig = rend.render.bind(rend);
  rend.render = (v) => { window.__samples.push(v); orig(v); };
});
await p.evaluate(() => window.waverly.next());
await p.waitForTimeout(900);
await p.screenshot({ path: `${OUT}/shader-mid-wipe.png` });
await p.waitForTimeout(2600);
const samples = await p.evaluate(() => window.__samples);
ok('u_progress driven across the transition', samples.length > 30 && Math.max(...samples) > 0.99,
   `${samples.length} frames, 0 -> ${Math.max(...samples).toFixed(3)}`);
ok('landed on the next slide', (await p.evaluate(() => window.waverly.current)) === 1);

/**
 * The canvas renders. Proven by comparing a frame mid-wipe against the settled
 * frame rather than by readPixels — without preserveDrawingBuffer the back
 * buffer is gone by the time a separate JS call can read it, so readPixels
 * reports transparent black on a canvas that is drawing perfectly well.
 */
const settled = await p.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 200 } });
await p.evaluate(() => window.waverly.prev());
await p.waitForTimeout(1000);
const mid = await p.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 200 } });
ok('canvas is drawing — mid-wipe frame differs from the settled frame',
   Buffer.compare(settled, mid) !== 0, `${settled.length}B vs ${mid.length}B`);
await p.waitForTimeout(2600);

await b.close();
const f = r.filter((x) => !x).length;
console.log(`\n${r.length - f}/${r.length} checks passed`);
process.exit(f ? 1 : 0);
