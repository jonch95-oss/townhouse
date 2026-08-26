import { gsap } from 'gsap';
import { duration, reducedMotion } from '../lib/motion';
import type { BuildingViewer } from '../lib/building-viewer';

const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const HOLD_DELAY = hasFinePointer ? 0.1 : 0.5;

type ViewerFactory = () => Promise<BuildingViewer>;

/**
 * Hero press-and-hold — motion-spec.md §7.1.
 * Loads the Waverly GLB on demand and hands off to OrbitControls after the hold threshold.
 */
export class HeroHold {
  private delay?: gsap.core.Tween;
  private tween?: gsap.core.Tween;
  private zoomed = false;
  private viewer?: BuildingViewer;
  private viewerReady?: Promise<BuildingViewer>;
  private readonly target = { scale: 1 };
  private pendingEvent?: PointerEvent;

  constructor(
    private readonly stage: HTMLElement,
    private readonly heroEl: HTMLElement,
    private readonly getActive: () => boolean,
    private readonly onZoom: (zoomed: boolean) => void,
    private readonly getViewer: ViewerFactory,
  ) {
    if (reducedMotion) return;
    this.stage.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointerup', () => void this.up());
    window.addEventListener('pointercancel', () => void this.up());
  }

  /** Warm the GLB after the intro so the first hold is not waiting on the network. */
  warm(): void {
    if (reducedMotion) return;
    this.viewerReady ??= this.getViewer();
    void this.viewerReady.then((viewer) => viewer.preload()).catch(() => undefined);
  }

  private media(): HTMLElement | null {
    return this.stage.querySelector('.slide:first-child .picture') as HTMLElement | null;
  }

  private down(e: PointerEvent): void {
    if (!this.getActive()) return;
    if ((e.target as HTMLElement).closest('button, a, .chrome, .menu-toggle, .inquire, .logo, .sound-toggle')) {
      return;
    }
    this.pendingEvent = e;
    this.delay?.kill();
    this.delay = gsap.delayedCall(HOLD_DELAY, () => void this.enter());
  }

  private async enter(): Promise<void> {
    if (this.zoomed || !this.pendingEvent) return;

    try {
      this.viewerReady ??= this.getViewer();
      this.viewer = await this.viewerReady;
      await this.viewer.enter(this.pendingEvent, hasFinePointer);
    } catch {
      this.fallbackZoom();
      return;
    }

    this.zoomed = true;
    this.onZoom(true);
    gsap.to(this.heroEl, { autoAlpha: 0, duration: duration(0.5), ease: 'power1.in' });
    const media = this.media();
    if (media) gsap.set(media, { autoAlpha: 0 });
  }

  private fallbackZoom(): void {
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
  }

  private async up(): Promise<void> {
    this.delay?.kill();
    this.pendingEvent = undefined;
    if (!this.zoomed) return;

    this.zoomed = false;
    this.onZoom(false);
    this.tween?.kill();

    if (this.viewer) {
      await this.viewer.exit();
    }

    gsap.to(this.heroEl, { autoAlpha: 1, duration: duration(0.5), ease: 'power1.out' });
    const media = this.media();
    if (media) {
      gsap.set(media, { autoAlpha: 1 });
      gsap.to(this.target, {
        scale: 1,
        duration: duration(0.85),
        ease: 'power3.out',
        onUpdate: () => gsap.set(media, { scale: this.target.scale }),
      });
    }
  }
}
