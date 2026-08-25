import { gsap } from 'gsap';

/**
 * prefers-reduced-motion, honoured — REBUILD.md §2 Phase 5. The reference
 * evaluates this query on boot, stores it on a feature object and never reads
 * it again (motion-spec.md §11); there is no reduced-motion CSS in its 31.9 KB.
 *
 * Four things happen when it is set:
 *   1. every reveal duration collapses to ~0 through duration() below;
 *   2. staggers collapse to 0, so nothing arrives in sequence;
 *   3. the slide machine hard-cuts instead of tweening (see slides.ts);
 *   4. anything that loops forever is never started (see scroll-hint.ts).
 *
 * The global timeScale is a backstop for anything that forgets to call
 * duration() — belt and braces, because a missed reveal is the failure mode
 * this preference exists to prevent.
 */
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function applyMotionPreference(): void {
  if (reducedMotion) {
    gsap.globalTimeline.timeScale(20);
    document.documentElement.classList.add('is-reduced-motion');
  }
}

/** A tween duration, collapsed to effectively zero under reduced motion. */
export function duration(seconds: number): number {
  return reducedMotion ? 0.01 : seconds;
}

/** A stagger, collapsed to zero under reduced motion. */
export function stagger(seconds: number): number {
  return reducedMotion ? 0 : seconds;
}
