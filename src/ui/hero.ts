import { gsap } from 'gsap';
import { splitLines, mask } from '../lib/reveal';
import { duration, stagger } from '../lib/motion';
import { copy } from '../data/copy';

/**
 * The hero copy block — sections.md S2, with the entrance timeline from
 * motion-spec.md §3.2.
 *
 * Four elements 0.35s apart, each running 1.5s, so they overlap heavily and
 * read as one gesture rather than four. Note the eyebrow and the paragraph
 * animate to alpha 0.7, not 1 — secondary copy never reaches full white. It
 * costs one character in the tween and it is the difference between a
 * hierarchy and a list.
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
          <p class="hero__price">${copy.hero.price}</p>
        </div>
      </div>`;
  }

  /** Split once the fonts have settled, or the line boxes are measured wrong. */
  private build(): void {
    if (this.built) return;
    this.built = true;
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
      .fromTo(this.eyebrow, { yPercent: 100, alpha: 0 }, { yPercent: 0, alpha: 0.7 }, 0.35)
      .from(this.lines.title, { y: '3rem', alpha: 0 }, 0.5)
      .fromTo(this.lines.body, { yPercent: 100, alpha: 0 }, { yPercent: 0, alpha: 0.7 }, 0.7)
      .from(this.price, { yPercent: 100, alpha: 0 }, 0.9);
  }

  leave(): void {
    this.timeline?.kill();
    gsap.to(this.el, { autoAlpha: 0, duration: duration(0.5), ease: 'power1.in' });
  }
}
