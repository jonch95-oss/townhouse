import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { duration, reducedMotion } from '../lib/motion';

gsap.registerPlugin(DrawSVGPlugin);

/**
 * The slide pip rail — motion-spec.md §6.3, "the nicest small thing on the
 * site". Each pip is a 22x22 SVG: an r=10 ring plus a small rotated square.
 *
 * The two-phase draw is the part that matters. The ring draws itself on
 * clockwise from a fixed start point, and when it deactivates the *start*
 * point chases the end round the circle — the stroke unwinds off itself
 * rather than fading. Both phases live on one paused timeline per pip, with
 * labels at the boundary, so a slide change just tweens to the right label.
 */
export class PipRail {
  readonly el: HTMLElement;
  private readonly pips: HTMLElement[] = [];
  private readonly timelines: gsap.core.Timeline[] = [];

  constructor(count: number, labels: readonly string[], onSelect: (i: number) => void) {
    this.el = document.createElement('nav');
    this.el.className = 'pips';
    this.el.setAttribute('aria-label', 'Slides');

    for (let i = 0; i < count; i += 1) {
      const button = document.createElement('button');
      button.className = 'pip';
      button.type = 'button';
      button.setAttribute('aria-label', labels[i] ?? `Slide ${i + 1}`);
      button.innerHTML = `
        <svg class="pip__svg" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
          <circle class="pip__ring" cx="11" cy="11" r="10" fill="none"
                  stroke="currentColor" stroke-width="1" />
          <rect class="pip__dot" x="9" y="8.5" width="4" height="5"
                transform="rotate(45 11 11)" fill="currentColor" />
        </svg>`;
      button.addEventListener('click', () => onSelect(i));
      this.el.appendChild(button);
      this.pips.push(button);

      const ring = button.querySelector('.pip__ring');
      const timeline = gsap
        .timeline({ paused: true, defaults: { duration: duration(1), ease: 'snappy' } })
        .fromTo(ring, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', ease: 'expo.inOut' })
        .addLabel('active')
        .to(ring, { drawSVG: '100% 100%' })
        .addLabel('inactive');
      // Pre-render both states so the first activation is not a cold start,
      // then pin the ring back to empty. The pre-render alone leaves every
      // ring fully drawn — measured, not assumed.
      timeline.progress(1).progress(0);
      gsap.set(ring, { drawSVG: '0% 0%' });
      this.timelines.push(timeline);
    }
  }

  /** Entrance — motion-spec.md §6.3: pips fly in from the left, pip 0 lights at t=0.25. */
  enter(current = 0): void {
    gsap
      .timeline()
      .from(this.pips, {
        xPercent: -150,
        alpha: 0,
        duration: duration(1.5),
        stagger: reducedMotion ? 0 : 0.1,
        ease: 'unmask',
      })
      .add(() => this.activate(current), 0.25);
  }

  change(current: number, previous: number): void {
    this.timelines[previous]?.tweenTo('inactive');
    this.activate(current);
    this.pips.forEach((pip, i) =>
      pip.setAttribute('aria-current', i === current ? 'true' : 'false'),
    );
  }

  private activate(i: number): void {
    this.timelines[i]?.tweenFromTo(0, 'active');
    this.pips[i]?.setAttribute('aria-current', 'true');
  }
}
