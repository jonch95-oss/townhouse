/**
 * Touch swipe direction — swipe up must go forward, swipe down must go back.
 * Also checks that a bounce at the end of a swipe cannot reverse the direction.
 */
import { launchChromium } from './lib/browser.mjs';
import { dismissIntro } from './lib/enter.mjs';

const URL = process.env.URL ?? 'http://127.0.0.1:4173/';
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

async function swipe(page, { fromY, toY }) {
  const midX = 200;
  await page.evaluate(
    async ({ midX, fromY, toY }) => {
      const target = document.body;
      const mk = (y) =>
        new Touch({ identifier: 1, target, clientX: midX, clientY: y, pageX: midX, pageY: y });

      target.dispatchEvent(
        new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [mk(fromY)],
          changedTouches: [mk(fromY)],
        }),
      );

      const steps = 8;
      for (let i = 1; i <= steps; i++) {
        const y = fromY + ((toY - fromY) * i) / steps;
        target.dispatchEvent(
          new TouchEvent('touchmove', {
            bubbles: true,
            cancelable: true,
            touches: [mk(y)],
            changedTouches: [mk(y)],
          }),
        );
        await new Promise((r) => setTimeout(r, 16));
      }
      // Bounce 12px back toward start — the old bug used this as the direction.
      const bounceY = toY + Math.sign(fromY - toY) * 12;
      target.dispatchEvent(
        new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [mk(bounceY)],
          changedTouches: [mk(bounceY)],
        }),
      );
      await new Promise((r) => setTimeout(r, 16));
      target.dispatchEvent(
        new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          touches: [],
          changedTouches: [mk(bounceY)],
        }),
      );
    },
    { midX, fromY, toY },
  );
}

const browser = await launchChromium();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await page.goto(URL, { waitUntil: 'networkidle' });
await dismissIntro(page);

await page.evaluate(() => {
  window.__log = [];
  const m = window.waverly;
  const orig = m.options.onChange;
  m.options.onChange = (cur, prev) => {
    window.__log.push({ cur, prev });
    orig?.(cur, prev);
  };
});

console.log('\n--- swipe up (finger up) => next ---');
await page.evaluate(() => {
  window.waverly.instant(0);
  window.__log = [];
});
await page.waitForTimeout(200);
await swipe(page, { fromY: 600, toY: 200 });
await page.waitForTimeout(2200);
let log = await page.evaluate(() => window.__log);
check('swipe up advances to next', log.length === 1 && log[0].cur === 1, JSON.stringify(log));

console.log('\n--- swipe down (finger down) => previous ---');
await page.evaluate(() => {
  window.waverly.instant(1);
  window.__log = [];
});
await page.waitForTimeout(200);
await swipe(page, { fromY: 200, toY: 600 });
await page.waitForTimeout(2200);
log = await page.evaluate(() => window.__log);
check('swipe down goes to previous', log.length === 1 && log[0].cur === 0, JSON.stringify(log));

console.log('\n--- second swipe up still forward after bounce ---');
await page.evaluate(() => {
  window.waverly.instant(1);
  window.__log = [];
});
await page.waitForTimeout(200);
await swipe(page, { fromY: 650, toY: 180 });
await page.waitForTimeout(2200);
log = await page.evaluate(() => window.__log);
check('swipe up from slide 1 goes to slide 2', log.length === 1 && log[0].cur === 2, JSON.stringify(log));

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
