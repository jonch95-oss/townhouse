import { gsap } from 'gsap';
import { splitChars } from '../lib/reveal';
import { reducedMotion } from '../lib/motion';

/**
 * "Scroll to explore" — sections.md, Persistent chrome.
 *
 * This carries the site's only looping animation and its second (and last) use
 * of character splitting: each character dims to 12.5% and back on a 3s loop,
 * 0.05s apart, so a slow wave travels left to right forever. On a site with no
 * scrollbar it is the only thing that moves when the visitor does nothing, and
 * it is what tells them the page responds at all.
 *
 * Under prefers-reduced-motion the loop is never started. An animation that
 * repeats indefinitely is precisely what that preference exists to stop.
 */
export class ScrollHint {
  readonly el: HTMLButtonElement;
  private timeline?: gsap.core.Timeline;
  private chars: HTMLElement[] | null = null;

  constructor(label: string, onClick: () => void) {
    this.el = document.createElement('button');
    this.el.className = 'scroll-hint label';
    this.el.type = 'button';
    this.el.textContent = label;
    this.el.addEventListener('click', onClick);
  }

  start(): void {
    if (reducedMotion) return;
    if (!this.chars) this.chars = splitChars(this.el);
    this.timeline?.kill();
    this.timeline = gsap
      .timeline({ repeat: -1 })
      .fromTo(
        this.chars,
        { alpha: 1 },
        { alpha: 0.125, duration: 1.5, stagger: 0.05, ease: 'linear' },
      )
      .to(this.chars, { alpha: 1, duration: 1.5, stagger: 0.05, ease: 'linear' }, 1.5);
  }

  /** Hero only — contrast fails on the warm interiors (HANDOFF measured matrix). */
  setSlide(index: number): void {
    const onHero = index === 0;
    this.el.classList.toggle('is-hidden', !onHero);
    this.el.hidden = !onHero;
    this.el.tabIndex = onHero ? 0 : -1;
    if (!onHero) this.timeline?.pause(0);
    else if (this.timeline) this.timeline.play();
    else this.start();
  }

  destroy(): void {
    this.timeline?.kill();
  }
}
