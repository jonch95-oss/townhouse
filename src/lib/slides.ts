import { gsap } from 'gsap';
import { Lethargy } from './lethargy';
import { debounceDir } from './debounce';
import { createVirtualScroll } from './virtual-scroll';
import type { SlideRenderer } from './renderer';

export interface SlideMachineOptions {
  count: number;
  renderer: SlideRenderer;
  onChange?: (current: number, previous: number) => void;
  /** Fires the moment a transition begins — use for copy that must leave with the plate. */
  onTransitionStart?: (current: number, previous: number) => void;
}

/** motion-spec.md §1.4 — tightened for a crisper feel on a stills-based site. */
const DURATION = 1.15;
const DURATION_OFF_HERO = 1.75;
const HOLD_OFF_HERO = 0.2;
const DEBOUNCE_MS = 50;

const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class SlideMachine {
  current = 0;
  private previous = 0;

  /** Set false to hand the wheel to an overlay (menu, lightbox) in Phase 3. */
  entered = false;
  overlayOpen = false;

  private locked = false;
  private readonly state = { progress: 0 };
  private readonly timeline: gsap.core.Timeline;
  private readonly lethargy = new Lethargy(8, 50);
  private readonly teardown: () => void;

  constructor(private readonly options: SlideMachineOptions) {
    this.timeline = gsap.timeline({ paused: true });

    // Direction is locked to the first deliberate delta in the debounce window
    // so a bounce at the end of a flick cannot reverse the slide.
    const advance = debounceDir((y: number) => {
      this.tryAdvance(y);
    }, DEBOUNCE_MS);

    this.teardown = createVirtualScroll(({ y, oe }) => {
      if (y === 0) return;
      // Touch already commits once on touchend with total travel — do not
      // debounce it, or a bounce can no longer reverse it and the swipe feels
      // immediate.
      if (oe instanceof TouchEvent) {
        this.tryAdvance(y);
        return;
      }
      // Feed Lethargy every wheel tick — it needs the full stream, not the
      // debounced tail — then only queue a slide change on a deliberate flick.
      if (oe instanceof WheelEvent && hasFinePointer && !this.lethargy.check(oe)) return;
      advance(y);
    });
  }

  private tryAdvance(y: number): void {
    if (this.locked || this.overlayOpen || !this.entered) return;
    const next = this.current + -Math.sign(y);
    if (next < 0 || next >= this.options.count || next === this.current) return;
    this.go(next);
  }

  /** Animated move to a neighbouring slide. */
  private go(next: number): void {
    this.previous = this.current;
    this.current = next;
    this.locked = true;

    const leavingHero = this.previous === 0;
    const duration = prefersReducedMotion
      ? 0.01
      : leavingHero
        ? DURATION_OFF_HERO
        : DURATION;
    const delay = prefersReducedMotion ? 0 : leavingHero ? HOLD_OFF_HERO : 0;

    this.timeline
      .clear()
      .add(() => {
        this.options.onTransitionStart?.(this.current, this.previous);
        this.options.renderer.change(this.previous, this.current);
      })
      .fromTo(
        this.state,
        { progress: 0 },
        {
          progress: 1,
          duration,
          ease: 'snappy',
          onUpdate: () => this.options.renderer.render(this.state.progress),
        },
        delay,
      )
      .add(() => {
        this.locked = false;
        this.options.onChange?.(this.current, this.previous);
      })
      .restart();
  }

  /** Hard cut, no tween — what the menu will call in Phase 3. */
  instant(index: number): void {
    if (index === this.current || index < 0 || index >= this.options.count) return;
    this.timeline.clear();
    this.previous = this.current;
    this.current = index;
    this.options.onTransitionStart?.(this.current, this.previous);
    this.options.renderer.change(this.previous, this.current);
    this.options.renderer.render(1);
    this.locked = false;
    this.options.onChange?.(this.current, this.previous);
  }

  next(): void {
    if (!this.locked && this.current < this.options.count - 1) this.go(this.current + 1);
  }

  prev(): void {
    if (!this.locked && this.current > 0) this.go(this.current - 1);
  }

  destroy(): void {
    this.timeline.kill();
    this.teardown();
  }
}
