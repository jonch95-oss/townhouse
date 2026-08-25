import { gsap } from 'gsap';
import { duration } from '../lib/motion';

/**
 * The section-label box — sections.md, Persistent chrome. The one piece of
 * persistent wayfinding: which floor you are on, and the door to that floor's
 * full description.
 *
 * The index is set in tabular figures so the digits do not jitter as the
 * number changes, and both index and title swap through their own enter/leave
 * so the box updates in place rather than re-rendering.
 *
 * The [+] opens the floor panel, which is Phase 3.
 */
export class SectionLabel {
  readonly el: HTMLElement;
  private readonly index: HTMLElement;
  private readonly title: HTMLElement;

  constructor(private readonly labels: readonly string[], onExpand?: () => void) {
    this.el = document.createElement('div');
    this.el.className = 'section-label';
    this.el.innerHTML = `
      <span class="section-label__index" aria-hidden="true"></span>
      <span class="section-label__rule" aria-hidden="true"></span>
      <span class="section-label__title label"></span>
      <button class="section-label__expand" type="button" aria-label="Show details">
        <span class="plus" aria-hidden="true"></span>
      </button>`;
    this.index = this.el.querySelector('.section-label__index') as HTMLElement;
    this.title = this.el.querySelector('.section-label__title') as HTMLElement;
    this.el.querySelector('.section-label__expand')?.addEventListener('click', () => onExpand?.());
    this.set(0, false);
  }

  set(i: number, animate = true): void {
    const nextIndex = `0${i + 1}`;
    const nextTitle = this.labels[i] ?? '';
    if (!animate) {
      this.index.textContent = nextIndex;
      this.title.textContent = nextTitle;
      return;
    }
    // Swap in place: each half leaves, changes, and returns on `unmask`.
    for (const [el, value] of [
      [this.index, nextIndex],
      [this.title, nextTitle],
    ] as const) {
      gsap
        .timeline()
        .to(el, { yPercent: -100, alpha: 0, duration: duration(0.5), ease: 'power2.in' })
        .add(() => {
          el.textContent = value;
        })
        .fromTo(
          el,
          { yPercent: 100, alpha: 0 },
          { yPercent: 0, alpha: 1, duration: duration(1.5), ease: 'unmask' },
        );
    }
  }
}
