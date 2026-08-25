import './styles/tokens.css';
import './styles/fonts.css';
import './styles/app.css';

import { registerEases } from './lib/eases';
import { CrossfadeRenderer } from './lib/renderer';
import { SlideMachine } from './lib/slides';
import { slides } from './data/slides';

registerEases();

const stage = document.getElementById('stage');
const counterCurrent = document.getElementById('counter-current');
const counterTotal = document.getElementById('counter-total');
if (!stage || !counterCurrent || !counterTotal) {
  throw new Error('Stage markup is missing — check index.html');
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Build the layers from the manifest so the slide list has one source of truth. */
const layers = slides.map((slide, i) => {
  const layer = document.createElement('div');
  layer.className = 'slide';

  const img = document.createElement('img');
  img.className = 'slide__img';
  img.src = slide.src;
  img.alt = slide.alt;
  img.draggable = false;
  // The first two are the gate; the rest can arrive while you look at the hero.
  img.loading = i < 2 ? 'eager' : 'lazy';
  img.decoding = 'async';
  if (i < 2) img.fetchPriority = 'high';

  layer.appendChild(img);
  stage.appendChild(layer);
  return layer;
});

counterTotal.textContent = ` — ${pad(slides.length)}`;

const machine = new SlideMachine({
  count: slides.length,
  renderer: new CrossfadeRenderer(layers),
  onChange: (current) => {
    counterCurrent.textContent = pad(current + 1);
    document.body.classList.add('is-moved');
  },
});

/**
 * Preload the first two slides, then open the gate. No percentage counter:
 * two images do not justify making anyone watch a number climb.
 */
async function ready(): Promise<void> {
  const first = layers
    .slice(0, 2)
    .map((layer) => layer.querySelector('img') as HTMLImageElement)
    .map((img) => (img.complete ? img.decode().catch(() => undefined) : loaded(img)));

  await Promise.all(first);
  document.body.classList.add('is-ready');
  machine.entered = true;
}

function loaded(img: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

void ready();

// Handy while tuning the pacing; harmless in production.
Object.assign(window, { waverly: machine });
