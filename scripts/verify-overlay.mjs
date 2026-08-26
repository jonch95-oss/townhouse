/**
 * The keyboard contract Phase 3's menu and lightbox must both satisfy.
 * Built against a throwaway overlay so the primitive is proven before anything
 * depends on it.
 */
import { launchChromium } from './lib/browser.mjs';
import { dismissIntro } from './lib/enter.mjs';
const b = await launchChromium();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(process.env.URL ?? 'http://localhost:5173/', { waitUntil: 'networkidle' });
await dismissIntro(p);

const results = [];
const ok = (n, pass, d) => { results.push(pass); console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? ` — ${d}` : ''}`); };

await p.evaluate(async () => {
  const { Overlay } = await import('/src/lib/overlay.ts');
  const el = document.createElement('div');
  el.id = 'probe';
  el.innerHTML = '<button id="a">a</button><button id="b">b</button><button id="c">c</button>';
  document.body.appendChild(el);
  window.__log = [];
  window.__ov = new Overlay(el, {
    onClose: () => window.__log.push('close'),
    onPrevious: () => window.__log.push('prev'),
    onNext: () => window.__log.push('next'),
  });
  document.getElementById('a').focus = document.getElementById('a').focus;
});

const slideBefore = await p.evaluate(() => window.waverly.current);
await p.evaluate(() => window.__ov.open());
ok('focus moves into the overlay on open', await p.evaluate(() => document.activeElement.id) === 'a', await p.evaluate(() => document.activeElement.id));

await p.keyboard.press('ArrowRight');
await p.keyboard.press('ArrowLeft');
await p.keyboard.press('Escape');
const log = await p.evaluate(() => window.__log);
ok('arrows and Escape are handled', JSON.stringify(log) === '["next","prev","close"]', JSON.stringify(log));

// Tab wrap
await p.evaluate(() => document.getElementById('c').focus());
await p.keyboard.press('Tab');
ok('Tab wraps from last to first', await p.evaluate(() => document.activeElement.id) === 'a', await p.evaluate(() => document.activeElement.id));
await p.keyboard.press('Shift+Tab');
ok('Shift+Tab wraps from first to last', await p.evaluate(() => document.activeElement.id) === 'c', await p.evaluate(() => document.activeElement.id));

// The defect in the reference: the global arrow handler staying live behind the overlay.
await p.waitForTimeout(400);
const slideAfter = await p.evaluate(() => window.waverly.current);
ok('arrow keys did NOT drive the slide machine behind the overlay', slideAfter === slideBefore, `slide ${slideBefore} -> ${slideAfter}`);

await p.evaluate(() => window.__ov.close());
await p.waitForTimeout(100);
ok('overlay is inert after close', await p.evaluate(() => document.getElementById('probe').hasAttribute('inert')));

await b.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
