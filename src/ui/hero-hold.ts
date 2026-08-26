import { gsap } from 'gsap';
import { duration, reducedMotion } from '../lib/motion';

const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const HOLD_DELAY = hasFinePointer ? 0.1 : 0.5;

/**
 * Hero press-and-hold — motion-spec.md §7.1, adapted for a still.
 * Pushes into the facade photograph.
 */
export class HeroHold {
  private delay?: gsap.core.Tween;
  private tween?: gsap.core.Tween;
  private zoomed = false;
  private readonly target = { scale: 1 };

  constructor(
    private readonly stage: HTMLElement,
    private readonly heroEl: HTMLElement,
    private readonly getActive: () => boolean,
    private readonly onZoom: (zoomed: boolean) => void,
  ) {
    if (reducedMotion) return;
    this.stage.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointerup', () => this.up());
    window.addEventListener('pointercancel', () => this.up());
  }

  private media(): HTMLElement | null {
    return this.stage.querySelector('.slide:first-child .picture') as HTMLElement | null;
  }

  private down(e: PointerEvent): void {
    if (!this.getActive()) return;
    if ((e.target as HTMLElement).closest('button, a, .chrome, .menu-toggle, .inquire, .logo, .sound-toggle')) {
      return;
    }
    this.delay?.kill();
    this.delay = gsap.delayedCall(HOLD_DELAY, () => {
      this.zoomed = true;
      this.onZoom(true);
      gsap.to(this.heroEl, { autoAlpha: 0, duration: duration(0.5), ease: 'power1.in' });
      const media = this.media();
      if (!media) return;
      this.tween = gsap.to(this.target, {
        scale: 1.18,
        duration: duration(1.25),
        ease: 'power2.out',
        onUpdate: () => gsap.set(media, { scale: this.target.scale }),
      });
    });
  }

  private up(): void {
    this.delay?.kill();
    if (!this.zoomed) return;
    this.zoomed = false;
    this.onZoom(false);
    this.tween?.kill();
    const media = this.media();
    gsap.to(this.heroEl, { autoAlpha: 1, duration: duration(0.5), ease: 'power1.out' });
    if (media) {
      gsap.to(this.target, {
        scale: 1,
        duration: duration(0.85),
        ease: 'power3.out',
        onUpdate: () => gsap.set(media, { scale: this.target.scale }),
      });
    }
  }
}
