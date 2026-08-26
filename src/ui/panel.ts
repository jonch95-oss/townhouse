import { gsap } from 'gsap';
import { Overlay } from '../lib/overlay';
import { duration } from '../lib/motion';

/**
 * A slide-in panel. sections.md Overlay C — the reference uses one panel for
 * three different bodies of text, and so do we: overview, credits, legal and
 * floorplans are the same component with different contents.
 *
 * Keyboard comes from Overlay, like every other full-screen thing here.
 */
export class Panel {
  readonly el: HTMLElement;
  private readonly overlay: Overlay;
  private readonly bodyEl: HTMLElement;
  private open = false;

  constructor(title: string, private readonly onClose?: () => void) {
    this.el = document.createElement('section');
    this.el.className = 'panel';
    this.el.setAttribute('inert', '');
    this.el.innerHTML = `
      <button class="panel__scrim" type="button" aria-label="Close"></button>
      <div class="panel__sheet">
        <header class="panel__head">
          <h2 class="panel__title">${title}</h2>
          <button class="panel__close x-trig" type="button" aria-label="Close">
            <span class="x" aria-hidden="true"><span class="x__line"></span><span class="x__line"></span></span>
          </button>
        </header>
        <div class="panel__body"></div>
      </div>`;
    this.bodyEl = this.el.querySelector('.panel__body') as HTMLElement;
    this.el.querySelector('.panel__scrim')?.addEventListener('click', () => this.hide());
    this.el.querySelector('.panel__close')?.addEventListener('click', () => this.hide());
    this.overlay = new Overlay(this.el, { onClose: () => this.hide() });
  }

  setContent(nodes: (Node | string)[]): void {
    this.bodyEl.replaceChildren(...nodes);
  }

  show(): void {
    if (this.open) return;
    this.open = true;
    this.el.classList.add('is-open');
    gsap.fromTo(this.el, { opacity: 0 }, { opacity: 1, duration: duration(0.5), ease: 'power1.out' });
    gsap.fromTo(
      this.el.querySelector('.panel__sheet'),
      { xPercent: 100 },
      { xPercent: 0, duration: duration(1.125), ease: 'expo.inOut' },
    );
    this.overlay.open();
  }

  hide(): void {
    if (!this.open) return;
    this.open = false;
    this.overlay.close();
    gsap.to(this.el, {
      opacity: 0,
      duration: duration(0.5),
      ease: 'power1.out',
      onComplete: () => this.el.classList.remove('is-open'),
    });
    this.onClose?.();
  }

  get isOpen(): boolean {
    return this.open;
  }
}
