import { gsap } from 'gsap';
import { splitLines, mask } from '../lib/reveal';
import { duration, stagger } from '../lib/motion';
import { copy } from '../data/copy';

/**
 * The hero copy block — eyebrow, headline, paragraph, and price per house.
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
          <p class="hero__price">${copy.hero.pricePrefix} ${copy.hero.price}</p>
        </div>
      </div>`;
  }

  /** Split once the fonts have settled, or the line boxes are measured wrong. */
  private build(): void {
    if (this.built) return;
    this.built = true;
    this.eyebrow = this.el.querySelector('.hero__eyebrow') as HTMLElement;
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
      .fromTo(this.eyebrow, { y: '1.2rem', alpha: 0 }, { y: 0, alpha: 1 }, 0.35)
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
