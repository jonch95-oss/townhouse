import './styles/tokens.css';
import './styles/fonts.css';
import './styles/type.css';
import './styles/app.css';
import './styles/chrome.css';

import { registerEases } from './lib/eases';
import { registerReveal } from './lib/reveal';
import { applyMotionPreference } from './lib/motion';
import { CrossfadeRenderer } from './lib/renderer';
import { SlideMachine } from './lib/slides';
import { slides } from './data/slides';
import { Hero } from './ui/hero';
import { PipRail } from './ui/pips';
import { MenuToggle } from './ui/nav';
import { SectionLabel } from './ui/section-label';
import { ScrollHint } from './ui/scroll-hint';

registerEases();
registerReveal();
applyMotionPreference();

const stage = document.getElementById('stage');
if (!stage) throw new Error('Stage markup is missing — check index.html');

/** Build the layers from the manifest so the slide list has one source of truth. */
const layers = slides.map((slide, i) => {
  const layer = document.createElement('div');
  layer.className = 'slide';

  if (slide.src) {
    const img = document.createElement('img');
    img.className = 'slide__img';
    img.src = slide.src;
    img.alt = slide.alt ?? '';
    img.draggable = false;
    // The first two are the gate; the rest can arrive while you look at the hero.
    img.loading = i < 2 ? 'eager' : 'lazy';
    img.decoding = 'async';
    if (i < 2) img.fetchPriority = 'high';
    layer.appendChild(img);
  } else {
    // Contact lands on the warm ground; its card arrives in Phase 3.
    layer.classList.add('slide--ground');
  }

  stage.appendChild(layer);
  return layer;
});

const labels = slides.map((s) => s.label);

const hero = new Hero();
stage.appendChild(hero.el);

const chrome = document.createElement('div');
chrome.className = 'chrome';
document.body.appendChild(chrome);

const machine = new SlideMachine({
  count: slides.length,
  renderer: new CrossfadeRenderer(layers),
  onChange: (current, previous) => {
    pips.change(current, previous);
    sectionLabel.set(current);
    if (current === 0) hero.enter();
    else if (previous === 0) hero.leave();
  },
});

const pips = new PipRail(slides.length, labels, (i) => machine.instant(i));
const menuToggle = new MenuToggle();
const sectionLabel = new SectionLabel(labels);
const scrollHint = new ScrollHint('Scroll to explore', () => machine.next());

chrome.append(menuToggle.el, pips.el, scrollHint.el, sectionLabel.el);

/**
 * Preload the first two slides, then open the gate. No percentage counter:
 * REBUILD.md §3 is right that a progress readout is theatre without megabytes
 * of textures genuinely behind it.
 */
async function ready(): Promise<void> {
  const first = layers
    .slice(0, 2)
    .map((layer) => layer.querySelector('img'))
    .filter((img): img is HTMLImageElement => img !== null)
    .map((img) => (img.complete ? img.decode().catch(() => undefined) : loaded(img)));

  await Promise.all(first);
  // Fonts must be settled before splitting, or the line boxes measure wrong.
  await document.fonts.ready.catch(() => undefined);

  document.body.classList.add('is-ready');
  machine.entered = true;

  hero.enter();
  pips.enter(0);
  scrollHint.start();
}

function loaded(img: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

void ready();

// Handy while tuning; harmless in production.
Object.assign(window, { waverly: machine });
