import { gsap } from 'gsap';
import { copy } from '../data/copy';
import { duration, stagger } from '../lib/motion';

/**
 * The contact card — closing CTA with phone and email.
 */
export class Contact {
  readonly el: HTMLElement;
  private timeline?: gsap.core.Timeline;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'contact';
    this.el.innerHTML = `
      <div class="contact__card">
        <div class="contact__header">
          <p class="contact__eyebrow label js-fade-up">${copy.contact.eyebrow}</p>
          <h2 class="contact__title js-fade-up">${copy.contact.headline.map((line) => `<span class="contact__title-line">${line}</span>`).join('')}</h2>
          <span class="contact__rule js-scale" aria-hidden="true"></span>
        </div>
        <p class="contact__lead js-fade-up">${copy.contact.lead}</p>
        <p class="contact__subtitle js-fade-up">${copy.contact.disclaimer}</p>
        <div class="contact__action js-fade-up">
          <div class="contact__channel">
            <p class="contact__channel-label label">${copy.contact.phoneLabel}</p>
            <a class="contact__link uline-double" href="tel:+17187027500">${copy.contact.phone}</a>
          </div>
          <div class="contact__channel">
            <p class="contact__channel-label label">${copy.contact.emailLabel}</p>
            <a class="contact__link uline-double" href="mailto:${copy.contact.email}">${copy.contact.email}</a>
          </div>
        </div>
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
