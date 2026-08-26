import { gsap } from 'gsap';
import { copy } from '../data/copy';
import { duration, stagger } from '../lib/motion';

/**
 * Minimal copy overlay for the dedicated 3D slide.
 */
export class ModelSlide {
  readonly el: HTMLElement;
  private timeline?: gsap.core.Timeline;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'model-slide';
    this.el.innerHTML = `
      <p class="model-slide__hint label js-fade-up">${copy.model.hint}</p>`;
  }

  enter(): void {
    this.timeline?.kill();
    gsap.set(this.el, { autoAlpha: 1 });
    this.timeline = gsap
      .timeline({ defaults: { duration: duration(1.5), ease: 'unmask' } })
      .from(this.el.querySelectorAll('.js-fade-up'), { alpha: 0, y: '1.2rem', stagger: stagger(0.1) }, 0.35);
  }

  leave(): void {
    this.timeline?.kill();
    gsap.to(this.el, { autoAlpha: 0, duration: duration(0.5), ease: 'linear' });
  }
}
