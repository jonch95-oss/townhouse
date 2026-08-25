import './styles/tokens.css';
import './styles/fonts.css';
import './styles/type.css';
import './styles/app.css';
import './styles/chrome.css';

import { registerEases } from './lib/eases';
import { registerReveal } from './lib/reveal';
import { applyMotionPreference } from './lib/motion';
import { CrossfadeRenderer } from './lib/renderer';
import type { SlideRenderer } from './lib/renderer';
import { SlideMachine } from './lib/slides';
import { slides, galleries } from './data/slides';
import { Hero } from './ui/hero';
import { PipRail } from './ui/pips';
import { MenuToggle } from './ui/nav';
import { SectionLabel } from './ui/section-label';
import { ScrollHint } from './ui/scroll-hint';
import { Menu } from './ui/menu';
import { Lightbox } from './ui/lightbox';

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

/**
 * Chrome polarity is a property of each image, declared in the slide manifest.
 * See the note on ChromePolarity there for why it is not a slide range.
 */
const setChromeForSlide = (i: number) =>
  document.body.classList.toggle('is-interior', slides[i]?.chrome === 'dark');

const hero = new Hero();
stage.appendChild(hero.el);

const chrome = document.createElement('div');
chrome.className = 'chrome';
document.body.appendChild(chrome);

/**
 * The transition shader is built but OFF. The crossfade is the shipping path.
 *
 * Four of seven screens are still placeholders, and tuning a wipe against
 * stand-in imagery is wasted work — so the shader exists, is proven to run,
 * and is not tuned. Enable with ?shader=1 to look at it.
 */
const SHADER_ENABLED = new URLSearchParams(location.search).get('shader') === '1';

let renderer: SlideRenderer;
if (SHADER_ENABLED) {
  const { ShaderRenderer } = await import('./lib/shader-renderer');
  const shader = new ShaderRenderer(slides.map((s) => s.src));
  stage.prepend(shader.canvas);
  for (const layer of layers) layer.style.display = 'none';
  shader.show(0);
  renderer = shader;
} else {
  renderer = new CrossfadeRenderer(layers);
}

const machine = new SlideMachine({
  count: slides.length,
  renderer,
  onChange: (current, previous) => {
    pips.change(current, previous);
    sectionLabel.set(current);
    setChromeForSlide(current);
    if (current === 0) hero.enter();
    else if (previous === 0) hero.leave();
  },
});

const pips = new PipRail(slides.length, labels, (i) => machine.instant(i));

/**
 * Overlays own the wheel while they are open — motion-spec.md §1.3 lists this
 * among the guards. Without it the slide behind an open menu still advances.
 */
const setOverlayOpen = (open: boolean) => { machine.overlayOpen = open; };

const lightbox = new Lightbox(() => setOverlayOpen(false));
const menu = new Menu(
  labels,
  (i) => machine.instant(i),
  () => {
    setOverlayOpen(false);
    menuToggle.setOpen(false);
  },
);
document.body.append(menu.el, lightbox.el);

const menuToggle = new MenuToggle((open) => {
  setOverlayOpen(open);
  if (open) menu.show();
  else menu.close();
});

/** Clicking an interior slide opens that floor's gallery, where one exists. */
stage.addEventListener('click', () => {
  if (menu.isOpen || lightbox.isOpen) return;
  const ids = galleries[machine.current];
  if (!ids?.length) return;
  setOverlayOpen(true);
  lightbox.show(
    ids.map((id, n) => ({
      src: `/renders/source/${id}.jpeg`,
      alt: `${labels[machine.current]} — view ${n + 1} of ${ids.length}.`,
      caption: `${labels[machine.current]} — ${n + 1} / ${ids.length}`,
    })),
  );
});
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

  setChromeForSlide(machine.current);
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
