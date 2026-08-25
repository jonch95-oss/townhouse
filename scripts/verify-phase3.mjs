import { launchChromium } from './lib/browser.mjs';
const URL = process.env.URL ?? 'http://localhost:4173/';
const r = []; const ok = (n, p, d) => { r.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d ? ` — ${d}` : ''}`); };
const b = await launchChromium();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForSelector('body.is-ready');
await p.evaluate(() => document.fonts.ready);

console.log('--- menu overlay ---');
await p.click('.menu-toggle');
await p.waitForTimeout(2200);
const m = await p.evaluate(() => {
  const el = document.querySelector('.menu');
  const cs = getComputedStyle(el);
  const link = document.querySelector('.menu-link__label');
  const idx = document.querySelector('.menu-link__index');
  return {
    open: el.classList.contains('is-open'),
    ground: cs.backgroundColor,
    clip: cs.clipPath,
    linkColor: getComputedStyle(link).color,
    indexColor: getComputedStyle(idx).color,
    imageVisible: getComputedStyle(document.querySelector('.menu__image-mask')).display,
    links: document.querySelectorAll('.menu-link').length,
    modal: el.getAttribute('aria-modal'),
    focusInside: el.contains(document.activeElement),
    wheelOwned: window.waverly.overlayOpen,
  };
});
console.log(' ', JSON.stringify(m));
ok('menu ground is the warm neutral', m.ground === 'rgb(113, 95, 71)', m.ground);
ok('links are white', m.linkColor === 'rgb(255, 255, 255)', m.linkColor);
ok('indices are the warm tint', m.indexColor === 'rgb(160, 136, 104)', m.indexColor);
ok('menu image shown at 1440 (desktop-only)', m.imageVisible === 'block', m.imageVisible);
ok('one link per slide', m.links === 6, `${m.links}`);
ok('clip fully open after the timeline', m.clip === 'none' || m.clip.includes('0%'), m.clip);
ok('overlay owns the wheel', m.wheelOwned === true);
ok('focus moved into the overlay', m.focusInside === true);
ok('aria-modal set', m.modal === 'true');

// hover dims siblings
const dim = await p.evaluate(async () => {
  const links = [...document.querySelectorAll('.menu-link')];
  links[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  document.querySelector('.menu__links').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 500));
  return getComputedStyle(links[1]).transitionDuration;
});
ok('sibling dim transition is 0.35s', dim.startsWith('0.35'), dim);

console.log('\n--- escape closes the menu, and does not reach the slide machine ---');
const before = await p.evaluate(() => window.waverly.current);
await p.keyboard.press('Escape');
await p.waitForTimeout(1600);
const after = await p.evaluate(() => ({
  open: document.querySelector('.menu').classList.contains('is-open'),
  slide: window.waverly.current,
  toggle: document.querySelector('.menu-toggle').getAttribute('aria-expanded'),
  wheel: window.waverly.overlayOpen,
}));
ok('Escape closes the menu', after.open === false);
ok('slide machine untouched', after.slide === before, `${before} -> ${after.slide}`);
ok('toggle resyncs to closed', after.toggle === 'false', after.toggle);
ok('wheel handed back', after.wheel === false);

console.log('\n--- menu selection is an instant jump ---');
await p.click('.menu-toggle'); await p.waitForTimeout(1600);
await p.evaluate(() => document.querySelectorAll('.menu-link')[3].click());
await p.waitForTimeout(1600);
ok('selecting a link jumps straight to that slide', (await p.evaluate(() => window.waverly.current)) === 3);

console.log('\n--- lightbox ---');
await p.evaluate(() => window.waverly.instant(1));
await p.waitForTimeout(1200);
await p.click('.stage');
await p.waitForTimeout(900);
const lb = await p.evaluate(() => ({
  open: document.querySelector('.lightbox').classList.contains('is-open'),
  caption: document.querySelector('.lightbox__caption').textContent,
  live: document.querySelector('.lightbox__caption').getAttribute('aria-live'),
  nav: document.querySelector('.lightbox').classList.contains('has-nav'),
  focusInside: document.querySelector('.lightbox').contains(document.activeElement),
  src: document.querySelector('.lightbox__img').getAttribute('src'),
}));
console.log(' ', JSON.stringify(lb));
ok('lightbox opens on an interior slide', lb.open === true);
ok('caption is aria-live', lb.live === 'polite', lb.live);
ok('nav shown for a multi-image set', lb.nav === true);
ok('focus trapped inside', lb.focusInside === true);

const slideBefore = await p.evaluate(() => window.waverly.current);
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(700);
const paged = await p.evaluate(() => document.querySelector('.lightbox__caption').textContent);
ok('arrow pages the gallery', paged !== lb.caption, `${lb.caption} -> ${paged}`);
ok('arrow did NOT drive the slide machine', (await p.evaluate(() => window.waverly.current)) === slideBefore);
await p.keyboard.press('Escape'); await p.waitForTimeout(800);
ok('Escape closes the lightbox', (await p.evaluate(() => document.querySelector('.lightbox').classList.contains('is-open'))) === false);
ok('wheel handed back after close', (await p.evaluate(() => window.waverly.overlayOpen)) === false);

await b.close();
const f = r.filter((x) => !x).length;
console.log(`\n${r.length - f}/${r.length} checks passed`);
process.exit(f ? 1 : 0);
