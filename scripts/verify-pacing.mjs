/**
 * Drives the built site in a real browser and checks the three things Phase 1
 * has to get right: one gesture advances exactly one slide, the transition is
 * locked while it runs, and the first move off the hero is the long one.
 */
import { chromium } from 'playwright';

const URL = process.env.URL ?? 'http://localhost:4173/';
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('body.is-ready', { timeout: 15000 });

/**
 * Instrument both ends of a transition. `renderer.change()` runs at timeline
 * position 0, `onChange` at the end — so the span between them is exactly the
 * hold plus the tween, with the gesture and debounce excluded.
 */
await page.evaluate(() => {
  window.__log = [];
  window.__started = 0;
  const m = window.waverly;
  const renderer = m.options.renderer;
  const origChange = renderer.change.bind(renderer);
  renderer.change = (from, to) => {
    window.__started = performance.now();
    origChange(from, to);
  };
  const origOnChange = m.options.onChange;
  m.options.onChange = (cur, prev) => {
    window.__log.push({ cur, prev, ms: performance.now() - window.__started });
    origOnChange?.(cur, prev);
  };
});

console.log('\n--- pointer / media state ---');
console.log(await page.evaluate(() => ({
  finePointer: matchMedia('(hover: hover) and (pointer: fine)').matches,
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  rootFontSize: getComputedStyle(document.documentElement).fontSize,
  bodyOverflow: getComputedStyle(document.body).overflow,
  scrollable: document.documentElement.scrollHeight - window.innerHeight,
})));

/** A trackpad flick: deltas ramp up, then a long decaying inertial tail. */
async function flick(dir = 1) {
  const ramp = [4, 12, 30, 64, 96, 120, 128];
  const tail = [110, 88, 64, 46, 32, 22, 15, 10, 7, 5, 3, 2, 1, 1];
  const start = await page.evaluate(() => performance.now());
  for (const d of [...ramp, ...tail]) {
    await page.mouse.wheel(0, d * dir);
    await page.waitForTimeout(16);
  }
  return start;
}

console.log('\n--- gesture 1: hero -> slide 2 ---');
await flick(1);
await page.waitForTimeout(3600);
let log = await page.evaluate(() => window.__log);
check('one flick advances exactly one slide', log.length === 1, `${log.length} change(s), landed on index ${log.at(-1)?.cur}`);
const firstDur = log[0]?.ms ?? 0;
check(
  'first transition off the hero is 0.5s hold + 2.25s tween = 2750ms',
  firstDur > 2650 && firstDur < 2900,
  `${Math.round(firstDur)}ms`,
);

console.log('\n--- gesture 2: slide 2 -> slide 3 ---');
await page.evaluate(() => { window.__log = []; });
await flick(1);
await page.waitForTimeout(2600);
log = await page.evaluate(() => window.__log);
check('second flick advances exactly one slide', log.length === 1, `${log.length} change(s)`);
const secondDur = log[0]?.ms ?? 0;
check(
  'subsequent transitions are 1500ms',
  secondDur > 1400 && secondDur < 1650,
  `${Math.round(secondDur)}ms`,
);
check('second transition is shorter than the first', secondDur < firstDur, `${Math.round(secondDur)}ms vs ${Math.round(firstDur)}ms`);

console.log('\n--- input lock during a transition ---');
await page.evaluate(() => { window.__log = []; });
flick(1); // do not await — fire a second gesture mid-transition
await page.waitForTimeout(700);
await flick(1);
await page.waitForTimeout(3000);
log = await page.evaluate(() => window.__log);
check('input locked during transition (2 overlapping gestures = 1 slide)', log.length === 1, `${log.length} change(s)`);

console.log('\n--- clamp at the end ---');
await page.evaluate(() => window.waverly.instant(5));
await page.evaluate(() => { window.__log = []; });
await flick(1);
await page.waitForTimeout(2600);
log = await page.evaluate(() => window.__log);
check('hard clamp at the last slide, no wrap', log.length === 0 && (await page.evaluate(() => window.waverly.current)) === 5, `index ${await page.evaluate(() => window.waverly.current)}`);

console.log('\n--- keyboard ---');
await page.evaluate(() => window.waverly.instant(0));
await page.evaluate(() => { window.__log = []; });
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(3400);
log = await page.evaluate(() => window.__log);
check('ArrowDown advances one slide', log.length === 1 && log[0].cur === 1, `index ${log.at(-1)?.cur}`);

// Screenshots at each slide for review.
for (const i of [0, 1, 2, 3, 4, 5]) {
  await page.evaluate((n) => window.waverly.instant(n), i);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `scripts/shots/slide-${i}.png` });
}
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.waverly.instant(0));
await page.waitForTimeout(300);
await page.screenshot({ path: 'scripts/shots/mobile-hero.png' });

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
