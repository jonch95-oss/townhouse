import { gsap } from 'gsap';
import { Overlay } from '../lib/overlay';
import { duration } from '../lib/motion';

export interface LightboxItem {
  src: string;
  alt: string;
  caption: string;
}

/**
 * The gallery lightbox.
 *
 * Built on src/lib/overlay.ts, which is the point: motion-spec.md §9 records
 * that the reference's gallery has no keyboard support at all — no Escape, no
 * arrows, no focus trap — and that its global arrow handler stays live behind
 * the open overlay, so ArrowDown inside the gallery silently drives the slide
 * machine underneath. Overlay listens in the capture phase precisely so that
 * cannot happen here.
 *
 * The caption is aria-live, so the change is announced when paging.
 */
export class Lightbox {
  readonly el: HTMLElement;
  private readonly overlay: Overlay;
  private readonly figure: HTMLElement;
  private readonly img: HTMLImageElement;
  private readonly caption: HTMLElement;
  private items: LightboxItem[] = [];
  private index = 0;
  private open = false;
  private touchX = 0;

  /** motion-spec.md §9 — 50px of horizontal travel. */
  private static readonly SWIPE = 50;

  constructor(private readonly onClose?: () => void) {
    this.el = document.createElement('div');
    this.el.className = 'lightbox';
    this.el.setAttribute('inert', '');
    this.el.innerHTML = `
      <button class="lightbox__backdrop" type="button" aria-label="Close gallery"></button>
      <figure class="lightbox__figure">
        <img class="lightbox__img" alt="" />
        <figcaption class="lightbox__caption label" aria-live="polite"></figcaption>
      </figure>
      <button class="lightbox__nav --prev" type="button" aria-label="Previous image"></button>
      <button class="lightbox__nav --next" type="button" aria-label="Next image"></button>
      <button class="lightbox__close x-trig" type="button" aria-label="Close gallery">
        <span class="x" aria-hidden="true"><span class="x__line"></span><span class="x__line"></span></span>
      </button>`;

    this.figure = this.el.querySelector('.lightbox__figure') as HTMLElement;
    this.img = this.el.querySelector('.lightbox__img') as HTMLImageElement;
    this.caption = this.el.querySelector('.lightbox__caption') as HTMLElement;

    this.el.querySelector('.lightbox__backdrop')?.addEventListener('click', () => this.hide());
    this.el.querySelector('.lightbox__close')?.addEventListener('click', () => this.hide());
    this.el.querySelector('.--prev')?.addEventListener('click', () => this.go(-1));
    this.el.querySelector('.--next')?.addEventListener('click', () => this.go(1));
    this.figure.addEventListener('click', () => this.go(1));

    this.el.addEventListener('touchstart', (e) => { this.touchX = e.changedTouches[0]?.screenX ?? 0; }, { passive: true });
    this.el.addEventListener('touchend', (e) => {
      const dx = (e.changedTouches[0]?.screenX ?? 0) - this.touchX;
      if (Math.abs(dx) >= Lightbox.SWIPE && this.items.length > 1) this.go(dx < 0 ? 1 : -1);
    }, { passive: true });

    this.overlay = new Overlay(this.el, {
      onClose: () => this.hide(),
      onPrevious: () => this.go(-1),
      onNext: () => this.go(1),
    });
  }

  show(items: LightboxItem[], start = 0): void {
    if (this.open || items.length === 0) return;
    this.open = true;
    this.items = items;
    this.index = start;
    this.el.classList.toggle('has-nav', items.length > 1);
    this.render(false);
    this.el.classList.add('is-open');
    // opacity, not autoAlpha: autoAlpha sets visibility:hidden on the first
    // frame, which makes the element unfocusable exactly when the overlay is
    // trying to move focus into it. Visibility is the is-open class's job.
    gsap.fromTo(this.el, { opacity: 0 }, { opacity: 1, duration: duration(0.5), ease: 'power1.out' });
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

  private go(step: number): void {
    if (this.items.length < 2) return;
    this.index = gsap.utils.wrap(0, this.items.length, this.index + step);
    this.render(true);
  }

  /** Between items it is a fade in `out-in` mode: out fully, then in. */
  private render(animate: boolean): void {
    const item = this.items[this.index];
    if (!item) return;
    const apply = () => {
      this.img.src = item.src;
      this.img.alt = item.alt;
      this.caption.textContent = item.caption;
    };
    if (!animate) { apply(); return; }
    gsap
      .timeline()
      .to(this.figure, { opacity: 0, duration: duration(0.25), ease: 'power1.in' })
      .add(apply)
      .to(this.figure, { opacity: 1, duration: duration(0.25), ease: 'power1.out' });
  }

  get isOpen(): boolean {
    return this.open;
  }
}
