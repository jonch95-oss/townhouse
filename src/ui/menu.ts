import { gsap } from 'gsap';
import { Overlay } from '../lib/overlay';
import { duration, stagger, reducedMotion } from '../lib/motion';
import { menuImage } from '../data/slides';
import type { MenuEntry } from '../data/slides';

/**
 * The full-screen menu — motion-spec.md §6.2.
 *
 * The panel image is supplied at 3:4 and needs no reframing here.
 *
 * The overlay grows up from the bottom edge and outward from a 10% inset on
 * each side at the same time, which is why it reads as a room arriving rather
 * than a panel sliding. The image counter-slides inside its own mask, so the
 * frame travels up while the picture travels down inside it.
 *
 * The close is a plain reverse of the clip with no stagger. That asymmetry is
 * deliberate: staggering on the way out reads as fussy where the same stagger
 * on the way in reads as considered.
 */
export class Menu {
  readonly el: HTMLElement;
  private readonly overlay: Overlay;
  private readonly links: HTMLElement[] = [];
  private timeline?: gsap.core.Timeline;
  private open = false;

  constructor(
    entries: readonly MenuEntry[],
    private readonly onSelect: (i: number) => void,
    private readonly onClose: () => void,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'menu';
    this.el.setAttribute('inert', '');
    this.el.innerHTML = `
      <div class="menu__inner site-max">
        <div class="menu__image-mask" aria-hidden="true">
          <div class="menu__image-inner">
            <img class="menu__image" src="${menuImage.src}" alt="${menuImage.alt}" />
          </div>
        </div>
        <nav class="menu__links" aria-label="Slides">
          ${entries
            .map(
              (entry, i) => `
            <button class="menu-link js-slide${entry.slide === undefined ? ' is-pending' : ''}"
                    type="button"
                    ${entry.slide === undefined ? 'aria-disabled="true"' : `data-index="${entry.slide}"`}>
              <span class="menu-link__index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
              <span class="menu-link__label h3 --menu">${entry.label}</span>
            </button>`,
            )
            .join('')}
        </nav>
      </div>`;

    this.links = [...this.el.querySelectorAll<HTMLElement>('.js-slide')];
    for (const link of this.links) {
      link.addEventListener('click', () => {
        // Floorplans has no slide: it opens the floor panel, which is not
        // built. Until it is, the entry is present and inert rather than
        // silently missing from the list.
        if (link.dataset.index === undefined) return;
        // An instant jump, never a wipe — a 1.5s transition across the whole
        // deck would look broken.
        this.onSelect(Number(link.dataset.index));
        this.close();
      });
    }

    this.overlay = new Overlay(this.el, { onClose: () => this.close() });
  }

  show(): void {
    if (this.open) return;
    this.open = true;
    this.el.classList.add('is-open');
    this.timeline?.kill();

    const mask = this.el.querySelector('.menu__image-mask');
    const inner = this.el.querySelector('.menu__image-inner');

    this.timeline = gsap.timeline({
      defaults: { duration: duration(1.125), ease: 'expo.inOut' },
    });
    this.timeline
      .from(this.el, { clipPath: 'inset(0 10% 100% 10%)' }, 0)
      .from([mask, inner], { yPercent: gsap.utils.wrap([100, -100]) }, reducedMotion ? 0 : 0.35)
      .add(
        gsap.effects.textMasks(this.links, {
          duration: duration(1.5),
          stagger: stagger(0.05),
        }),
        reducedMotion ? 0 : 0.5,
      );

    this.overlay.open();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.timeline?.kill();
    this.overlay.close();
    gsap.to(this.el, {
      clipPath: 'inset(0 10% 100% 10%)',
      duration: duration(1.125),
      ease: 'expo.inOut',
      onComplete: () => {
        this.el.classList.remove('is-open');
        gsap.set(this.el, { clearProps: 'clipPath' });
      },
    });
    this.onClose();
  }

  get isOpen(): boolean {
    return this.open;
  }
}
