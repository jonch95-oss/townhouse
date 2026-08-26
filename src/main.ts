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
import { Sound } from './lib/sound';
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
import type { IntroEnterOptions } from './ui/intro';
import { Logo } from './ui/logo';
import { Inquire } from './ui/inquire';
import { SoundToggle } from './ui/sound-toggle';
import { Cursor } from './ui/cursor';
import { HeroHold } from './ui/hero-hold';

registerEases();
registerReveal();
applyMotionPreference();

const stage = document.getElementById('stage');
if (!stage) throw new Error('Stage markup is missing — check index.html');

/** Build the layers from the manifest so the slide list has one source of truth. */
const layers = slides.map((slide, i) => {
  const layer = document.createElement('div');
  layer.className = 'slide';
  if (i === 0) layer.classList.add('slide--hero');
  if (i === 3) layer.classList.add('slide--primary');

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
    layer.classList.add('slide--ground');
  }

  stage.appendChild(layer);
  return layer;
});

const labels = slides.map((s) => s.label);

const setChromeForSlide = (i: number) =>
  document.body.classList.toggle('is-interior', slides[i]?.chrome === 'dark');

const hero = new Hero();
stage.appendChild(hero.el);

const contact = new Contact();
stage.appendChild(contact.el);

const chrome = document.createElement('div');
chrome.className = 'chrome';
document.body.appendChild(chrome);

const sound = new Sound();
sound.preload();

/**
 * Transition shader is OFF by default — crossfade is the shipping path.
 * On phones the WebGL path was painting a black canvas while the real
 * photographs sat hidden underneath. Enable with ?shader=1 to preview.
 */
const params = new URLSearchParams(location.search);
const SHADER_ENABLED = params.get('shader') === '1';

let renderer: SlideRenderer;
if (SHADER_ENABLED) {
  try {
    const { ShaderRenderer } = await import('./lib/shader-renderer');
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
  } catch {
    renderer = new CrossfadeRenderer(layers);
  }
} else {
  renderer = new CrossfadeRenderer(layers);
}

const cursor = new Cursor();
document.body.appendChild(cursor.el);

const updateCursorForSlide = (i: number) => {
  if (i === 0) cursor.setMode('hold');
  else if (galleries[i]?.length) cursor.setMode('view');
  else cursor.setMode('active');
};

const machine = new SlideMachine({
  count: slides.length,
  renderer,
  onTransitionStart: (current, previous) => {
    // Copy must leave with the plate — waiting until onChange left hero
    // headlines sitting over the incoming interior for the whole wipe.
    if (previous === 0 && current !== 0) hero.leave();
    if (previous === slides.length - 1 && current !== slides.length - 1) contact.leave();
  },
  onChange: (current, previous) => {
    pips.change(current, previous);
    sectionLabel.set(current);
    scrollHint.setSlide(current);
    setChromeForSlide(current);
    updateCursorForSlide(current);
    if (current === 0) hero.enter();
    else gsap.set(hero.el, { autoAlpha: 0 });
    if (current === slides.length - 1) contact.enter();
    else gsap.set(contact.el, { autoAlpha: 0 });
  },
});

const pips = new PipRail(slides.length, labels, (i) => machine.instant(i));

const setOverlayOpen = (open: boolean) => {
  machine.overlayOpen = open;
};
const onPanelClose = () => setOverlayOpen(false);

const lightbox = new Lightbox(() => {
  setOverlayOpen(false);
  updateCursorForSlide(machine.current);
});

const panels = {
  overview: overviewPanel(onPanelClose),
  credits: creditsPanel(onPanelClose),
  legal: legalPanel(onPanelClose),
  floorplans: floorplansPanel(onPanelClose),
} as const;
for (const panel of Object.values(panels)) {
  document.body.appendChild(panel.el);
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

const logo = new Logo(() => {
  if (!machine.entered) return;
  machine.instant(0);
});
const inquire = new Inquire(() => {
  if (!machine.entered) return;
  machine.instant(slides.length - 1);
});
const soundToggle = new SoundToggle(sound);

stage.addEventListener('click', () => {
  if (menu.isOpen || lightbox.isOpen || !machine.entered) return;
  const ids = galleries[machine.current];
  if (!ids?.length) return;
  setOverlayOpen(true);
  cursor.setMode('zoomed');
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

chrome.append(
  logo.el,
  inquire.el,
  pips.el,
  scrollHint.el,
  sectionLabel.el,
  soundToggle.el,
);
document.body.appendChild(menuToggle.el);

new HeroHold(
  stage,
  hero.el,
  () => machine.entered && machine.current === 0 && !menu.isOpen && !lightbox.isOpen,
  (zoomed) => cursor.setMode(zoomed ? 'zoomed' : 'hold'),
);

async function enterExperience(opts: IntroEnterOptions): Promise<void> {
  document.body.classList.add('is-entered');
  machine.entered = true;
  setChromeForSlide(machine.current);
  updateCursorForSlide(machine.current);
  hero.enter();
  pips.enter(0);
  scrollHint.start();
  scrollHint.setSlide(0);
  soundToggle.sync();
  await sound.enter(opts.withSound);
  soundToggle.sync();
}

function openGate(): void {
  const top = document.querySelector('.gate__half.--top');
  const bottom = document.querySelector('.gate__half.--bottom');
  const gate = document.querySelector('.gate');

  const intro = new Intro((opts) => void enterExperience(opts));
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

async function ready(): Promise<void> {
  const first = layers
    .slice(0, 2)
    .map((layer) => layer.querySelector('img'))
    .filter((img): img is HTMLImageElement => img !== null)
    .map((img) => (img.complete ? img.decode().catch(() => undefined) : loaded(img)));

  await Promise.all(first);
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

Object.assign(window, { waverly: machine });
