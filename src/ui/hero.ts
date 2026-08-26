import { gsap } from 'gsap';
import { splitLines, mask } from '../lib/reveal';
import { duration, stagger } from '../lib/motion';
import { copy } from '../data/copy';
import { renderCopy } from './tk';

/**
 * The hero copy block — sections.md S2, with the entrance timeline from
 * motion-spec.md §3.2.
 *
 * Four elements 0.35s apart, each running 1.5s, so they overlap heavily and
 * read as one gesture rather than four. The address settles at full opacity —
 * thin caps at 0.7 over brick looked soft and blurry. Body copy stays slightly
 * under so the headline still leads.
 */
export class Hero {
  readonly el: HTMLElement;
  private timeline?: gsap.core.Timeline;
  private lines: { title: HTMLElement[]; body: HTMLElement[] } = { title: [], body: [] };
  private eyebrow!: HTMLElement;
  private price!: HTMLElement;
  private built = false;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'hero site-max';
    this.el.innerHTML = `
      <div class="site-grid">
        <div class="hero__col">
          <p class="hero__eyebrow label">${copy.hero.eyebrow}</p>
          <h1 class="hero__title">${copy.hero.headline.join('<br />')}</h1>
          <p class="hero__body">${copy.hero.paragraph}</p>
          <p class="hero__price"><span data-price></span></p>
        </div>
      </div>`;
  }

  /** Fill the price, which carries a TK until somebody supplies one. */
  private fillPrice(): void {
    const slot = this.el.querySelector('[data-price]');
    slot?.replaceChildren(`${copy.hero.pricePrefix} `, ...renderCopy(copy.hero.price));
  }

  /** Split once the fonts have settled, or the line boxes are measured wrong. */
  private build(): void {
    if (this.built) return;
    this.built = true;
    this.fillPrice();
    this.eyebrow = mask(this.el.querySelector('.hero__eyebrow') as HTMLElement);
    this.price = mask(this.el.querySelector('.hero__price') as HTMLElement);
    this.lines = {
      title: splitLines(this.el.querySelector('.hero__title') as HTMLElement),
      body: splitLines(this.el.querySelector('.hero__body') as HTMLElement),
    };
  }

  enter(): void {
    this.build();
    this.timeline?.kill();
    gsap.set(this.el, { autoAlpha: 1 });
    this.timeline = gsap
      .timeline({ defaults: { duration: duration(1.5), stagger: stagger(0.1), ease: 'unmask' } })
      .fromTo(this.eyebrow, { yPercent: 100, alpha: 0 }, { yPercent: 0, alpha: 1 }, 0.35)
      .from(this.lines.title, { y: '3rem', alpha: 0 }, 0.5)
      .fromTo(this.lines.body, { yPercent: 100, alpha: 0 }, { yPercent: 0, alpha: 0.85 }, 0.7)
      .from(this.price, { yPercent: 100, alpha: 0 }, 0.9);
  }

  leave(): void {
    this.timeline?.kill();
    gsap.killTweensOf(this.el);
    gsap.set(this.el, { autoAlpha: 0 });
  }
}
