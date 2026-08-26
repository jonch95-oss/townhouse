import './styles/tokens.css';
import './styles/fonts.css';
import './styles/type.css';
import './styles/app.css';
import './styles/chrome.css';

import { gsap } from 'gsap';
import { registerEases } from './lib/eases';
import { registerReveal } from './lib/reveal';
import { applyMotionPreference, duration, reducedMotion } from './lib/motion';
import { CrossfadeRenderer } from './lib/renderer';
import type { SlideRenderer } from './lib/renderer';
import { SlideMachine } from './lib/slides';
import { slides, galleries, menuEntries } from './data/slides';
import { buildPicture, resolveImage } from './lib/picture';
import { overviewPanel, creditsPanel, legalPanel, floorplansPanel } from './ui/panels';
import { Hero } from './ui/hero';
import { Contact } from './ui/contact';
import { PipRail } from './ui/pips';
import { MenuToggle } from './ui/nav';
import { SectionLabel } from './ui/section-label';
import { ScrollHint } from './ui/scroll-hint';
import { Menu } from './ui/menu';
import { Lightbox } from './ui/lightbox';
import { Intro } from './ui/intro';

registerEases();
registerReveal();
applyMotionPreference();

const stage = document.getElementById('stage');
if (!stage) throw new Error('Stage markup is missing — check index.html');

/** Build the layers from the manifest so the slide list has one source of truth. */
const layers = slides.map((slide, i) => {
  const layer = document.createElement('div');
  layer.className = 'slide';

  if (slide.image) {
    layer.appendChild(
      buildPicture({
        image: slide.image,
        narrow: `portrait/${slide.image}`,
        alt: slide.alt ?? '',
        eager: i < 2,
      }),
    );
  } else {
    // Contact lands on the warm ground; its card arrives with the copy below.
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

const contact = new Contact();
stage.appendChild(contact.el);

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
  // The shader takes the largest JPEG of each slide — it samples textures
  // directly and has no use for the responsive ladder. Keys go through the
  // same resolver as <picture>: the manifest prefixes them by source directory.
  const shader = new ShaderRenderer(
    slides.map((slide) => {
      if (!slide.image) return undefined;
      const set = resolveImage(slide.image)?.srcset.jpg ?? [];
      return set[set.length - 1]?.url;
    }),
  );
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
    if (current === slides.length - 1) contact.enter();
    else if (previous === slides.length - 1) contact.leave();
  },
});

const pips = new PipRail(slides.length, labels, (i) => machine.instant(i));

/**
 * Overlays own the wheel while they are open — motion-spec.md §1.3 lists this
 * among the guards. Without it the slide behind an open menu still advances.
 */
const setOverlayOpen = (open: boolean) => { machine.overlayOpen = open; };

const lightbox = new Lightbox(() => setOverlayOpen(false));

/** One panel component, four bodies — sections.md Overlay C. */
const panels = {
  overview: overviewPanel(),
  credits: creditsPanel(),
  legal: legalPanel(),
  floorplans: floorplansPanel(),
} as const;
for (const panel of Object.values(panels)) {
  document.body.appendChild(panel.el);
  panel.el.addEventListener('transitionend', () => undefined);
}
const openPanel = (name: string) => {
  const panel = panels[name as keyof typeof panels];
  if (!panel) return;
  setOverlayOpen(true);
  panel.show();
};
const menu = new Menu(
  menuEntries,
  (i) => machine.instant(i),
  () => {
    setOverlayOpen(false);
    menuToggle.setOpen(false);
    document.body.classList.remove('menu-open');
  },
  openPanel,
);
document.body.append(menu.el, lightbox.el);

const menuToggle = new MenuToggle((open) => {
  setOverlayOpen(open);
  document.body.classList.toggle('menu-open', open);
  if (open) menu.show();
  else menu.close();
});

/** Clicking an interior slide opens that floor's gallery, where one exists. */
stage.addEventListener('click', () => {
  if (menu.isOpen || lightbox.isOpen || !machine.entered) return;
  const ids = galleries[machine.current];
  if (!ids?.length) return;
  setOverlayOpen(true);
  lightbox.show(
    ids.map((id, n) => ({
      image: id,
      alt: `${labels[machine.current]} — view ${n + 1} of ${ids.length}.`,
      caption: `${labels[machine.current]} — ${n + 1} / ${ids.length}`,
    })),
  );
});
const sectionLabel = new SectionLabel(labels, () => openPanel('overview'));
const scrollHint = new ScrollHint('Scroll to explore', () => machine.next());

chrome.append(pips.el, scrollHint.el, sectionLabel.el);
// Above the menu overlay, so it can still be clicked to close — see chrome.css.
document.body.appendChild(menuToggle.el);

/** Open the slide machine and the chrome after the visitor dismisses the gate. */
function enterExperience(): void {
  document.body.classList.add('is-entered');
  machine.entered = true;
  setChromeForSlide(machine.current);
  hero.enter();
  pips.enter(0);
  scrollHint.start();
}

/**
 * Split the white curtains, then show the intro gate.
 * REBUILD.md §3: keep the shape, change the content — no percentage theatre,
 * no cloud descent. One still, a considered wait, a deliberate Enter.
 */
function openGate(): void {
  const top = document.querySelector('.gate__half.--top');
  const bottom = document.querySelector('.gate__half.--bottom');
  const gate = document.querySelector('.gate');

  const intro = new Intro(enterExperience);
  document.body.appendChild(intro.el);

  const finish = () => {
    gate?.remove();
    intro.show();
  };

  if (!top || !bottom || reducedMotion) {
    finish();
    return;
  }

  gsap
    .timeline({ onComplete: finish })
    .to(top, { yPercent: -100, duration: duration(2), ease: 'power3.inOut' }, 0)
    .to(bottom, { yPercent: 100, duration: duration(2), ease: 'power3.inOut' }, 0);
}

/**
 * Preload the first two slides + the gate still, then open the threshold.
 * No percentage counter: without megabytes of WebGL textures it would be
 * theatre, and people can tell (REBUILD.md §3).
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
  openGate();
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
