import { gsap } from 'gsap';
import { copy } from '../data/copy';
import { duration, stagger } from '../lib/motion';

/**
 * The contact card — closing CTA with phone only.
 */
export class Contact {
  readonly el: HTMLElement;
  private timeline?: gsap.core.Timeline;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'contact';
    this.el.innerHTML = `
      <div class="contact__card">
        <p class="contact__eyebrow label js-fade-up">${copy.contact.eyebrow}</p>
        <h2 class="contact__title js-fade-up">${copy.contact.headline.join('<br />')}</h2>
        <span class="contact__rule js-scale" aria-hidden="true"></span>
        <p class="contact__lead js-fade-up">${copy.contact.lead}</p>
        <p class="contact__subtitle js-fade-up">${copy.contact.disclaimer}</p>
        <dl class="contact__details">
          <dt class="label js-fade-up">${copy.contact.phoneLabel}</dt>
          <dd class="js-fade-up"><a class="contact__phone uline-double" href="tel:+17187027500">${copy.contact.phone}</a></dd>
        </dl>
      </div>`;
  }

  enter(): void {
    this.timeline?.kill();
    gsap.set(this.el, { autoAlpha: 1 });
    this.timeline = gsap
      .timeline({ defaults: { duration: duration(1.5), ease: 'snappy' } })
      .fromTo(
        this.el.querySelector('.contact__card'),
        { clipPath: 'inset(0 0 100% 0 round 0.4rem)' },
        { clipPath: 'inset(0 0 0% 0 round 0.4rem)' },
        0.5,
      )
      .from(
        this.el.querySelectorAll('.js-fade-up'),
        { alpha: 0, y: '3rem', stagger: stagger(0.1), ease: 'unmask' },
        0.75,
      )
      .from(this.el.querySelector('.js-scale'), { scaleX: 0 }, 0.85);
  }

  leave(): void {
    this.timeline?.kill();
    gsap.to(this.el, { autoAlpha: 0, duration: duration(0.75), ease: 'linear' });
  }
}
