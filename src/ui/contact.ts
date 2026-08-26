import { gsap } from 'gsap';
import { copy } from '../data/copy';
import { duration, stagger } from '../lib/motion';
import { renderCopy } from './tk';

/**
 * The contact card — sections.md S7, with the entrance in motion-spec.md §3.3.
 *
 * The card wipes up from its own bottom edge with the corner radius carried
 * inside the clip-path (`round .4rem`), so the rounded corners are correct
 * throughout the reveal rather than appearing at the end. That is the detail
 * most rebuilds get wrong.
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
        <p class="contact__subtitle js-fade-up">${copy.contact.subtitle}</p>
        <dl class="contact__details">
          <dt class="label js-fade-up">${copy.contact.emailLabel}</dt>
          <dd class="js-fade-up" data-email></dd>
          <dt class="label js-fade-up">${copy.contact.phoneLabel}</dt>
          <dd class="js-fade-up" data-phone></dd>
        </dl>
      </div>`;

    this.el.querySelector('[data-email]')?.replaceChildren(...renderCopy(copy.contact.email));
    this.el.querySelector('[data-phone]')?.replaceChildren(...renderCopy(copy.contact.phone));
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
