import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { copy } from '../data/copy';
import { gateImage } from '../data/slides';
import { buildPicture } from '../lib/picture';
import { splitLines } from '../lib/reveal';
import { duration, stagger, reducedMotion } from '../lib/motion';
import { onTick } from '../lib/ticker';

gsap.registerPlugin(SplitText);

const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
/** Hold threshold — motion-spec.md §7.1: 100ms mouse, 500ms touch. */
const HOLD_DELAY = hasFinePointer ? 0.1 : 0.5;
/** How long a completed hold takes to push into the house. */
const HOLD_PUSH = 1.6;

export type IntroEnterOptions = { withSound: boolean };

/**
 * The threshold — adapted for these houses from decks only.
 *
 * Copy and imagery from StudioSC materials (terracotta/brick, powder room).
 * No clouds, no invented features. Audio preference is chosen here.
 */
export class Intro {
  readonly el: HTMLElement;
  private readonly media: HTMLElement;
  private readonly mediaInner: HTMLElement;
  private readonly title: HTMLElement;
  private readonly body: HTMLElement;
  private readonly enterBtn: HTMLButtonElement;
  private readonly silentBtn: HTMLButtonElement;
  private readonly hint: HTMLElement;
  private readonly progress: HTMLElement;
  private chars: HTMLElement[] = [];
  private bodyLines: HTMLElement[] = [];
  private built = false;
  private exiting = false;
  private holdTween?: gsap.core.Tween;
  private holdDelay?: gsap.core.Tween;
  private offTick?: () => void;
  private readonly parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  private readonly zoom = { scale: 1.08 };

  constructor(private readonly onEntered: (opts: IntroEnterOptions) => void) {
    this.el = document.createElement('div');
    this.el.className = 'intro';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-labelledby', 'intro-title');

    this.media = document.createElement('div');
    this.media.className = 'intro__media';
    this.media.setAttribute('aria-hidden', 'true');
    this.mediaInner = buildPicture({
      image: gateImage.image,
      narrow: `portrait/${gateImage.image}`,
      alt: gateImage.alt,
      className: 'intro__picture',
      eager: true,
    });
    this.media.appendChild(this.mediaInner);

    const scrim = document.createElement('div');
    scrim.className = 'intro__scrim';
    scrim.setAttribute('aria-hidden', 'true');

    const stack = document.createElement('div');
    stack.className = 'intro__stack';
    stack.innerHTML = `
      <h1 class="intro__title" id="intro-title">${copy.intro.headline.join('<br />')}</h1>
      <p class="intro__body">${copy.intro.paragraph}</p>
      <button class="intro__enter label" type="button">${copy.intro.primary}</button>
      <button class="intro__secondary uline-double label" type="button">${copy.intro.secondary}</button>
      <p class="intro__hint label">${copy.intro.holdHint}</p>
      <div class="intro__progress" aria-hidden="true"><span class="intro__progress-bar"></span></div>`;

    this.el.append(this.media, scrim, stack);

    this.title = stack.querySelector('.intro__title') as HTMLElement;
    this.body = stack.querySelector('.intro__body') as HTMLElement;
    this.enterBtn = stack.querySelector('.intro__enter') as HTMLButtonElement;
    this.silentBtn = stack.querySelector('.intro__secondary') as HTMLButtonElement;
    this.hint = stack.querySelector('.intro__hint') as HTMLElement;
    this.progress = stack.querySelector('.intro__progress-bar') as HTMLElement;

    this.enterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.exit('button', true);
    });
    this.silentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.exit('button', false);
    });

    this.el.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
    window.addEventListener('pointercancel', () => this.onPointerUp());
    if (hasFinePointer) {
      this.el.addEventListener('pointermove', (e) => this.onPointerMove(e));
    }

    gsap.set([this.title, this.body, this.enterBtn, this.silentBtn, this.hint], { autoAlpha: 0 });
    gsap.set(this.progress, { scaleX: 0 });
    gsap.set(this.mediaInner, { scale: this.zoom.scale });
  }

  show(): void {
    this.build();
    gsap.set(this.el, { autoAlpha: 1 });
    gsap.set(this.body, { autoAlpha: 1 });
    gsap.set(this.title, { scale: 0.85, autoAlpha: 1 });
    gsap.set([this.enterBtn, this.silentBtn], { y: '1.5rem', autoAlpha: 0 });
    gsap.set(this.hint, { autoAlpha: 0 });
    if (this.chars.length) gsap.set(this.chars, { autoAlpha: 0 });
    if (this.bodyLines.length) gsap.set(this.bodyLines, { yPercent: 100, autoAlpha: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power3' } });

    tl.to(this.title, { scale: 1, duration: duration(3), ease: 'power3' }, 0);
    if (this.chars.length) {
      tl.to(
        this.chars,
        {
          autoAlpha: 1,
          duration: duration(3),
          stagger: { each: stagger(0.05), from: 'random' },
          ease: 'none',
        },
        0,
      );
    }

    tl.to(
      this.bodyLines.length ? this.bodyLines : this.body,
      {
        yPercent: 0,
        autoAlpha: 0.7,
        duration: duration(1.5),
        stagger: stagger(0.14),
        ease: 'unmask',
      },
      duration(0.25),
    );

    tl.to(
      [this.enterBtn, this.silentBtn],
      { y: 0, autoAlpha: 1, duration: duration(2), stagger: stagger(0.2), ease: 'power3' },
      duration(0.5),
    );

    if (!reducedMotion && copy.intro.holdHint) {
      tl.to(this.hint, { autoAlpha: 0.55, duration: duration(1.5) }, duration(1.4));
    }

    if (!reducedMotion) {
      gsap.to(this.zoom, {
        scale: 1.0,
        duration: 10,
        ease: 'power2.inOut',
        onUpdate: () => this.applyMediaTransform(),
      });
      this.offTick = onTick((ratio) => {
        const k = 1 - Math.pow(0.88, ratio);
        this.parallax.x += (this.parallax.tx - this.parallax.x) * k;
        this.parallax.y += (this.parallax.ty - this.parallax.y) * k;
        this.applyMediaTransform();
      });
    }

    gsap.delayedCall(duration(1), () => this.enterBtn.focus({ preventScroll: true }));
  }

  private build(): void {
    if (this.built) return;
    this.built = true;
    const split = new SplitText(this.title, {
      type: 'chars,words',
      charsClass: 'intro__char',
    });
    this.chars = split.chars as HTMLElement[];
    this.bodyLines = splitLines(this.body);
    gsap.set(this.body, { autoAlpha: 1 });
  }

  private applyMediaTransform(): void {
    const { x, y } = this.parallax;
    gsap.set(this.mediaInner, {
      scale: this.zoom.scale,
      x,
      y,
    });
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.exiting || !hasFinePointer) return;
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    this.parallax.tx = nx * window.innerWidth * -0.025;
    this.parallax.ty = ny * window.innerHeight * -0.025;
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.exiting || reducedMotion) return;
    if ((e.target as HTMLElement).closest('.intro__enter, .intro__secondary')) return;

    this.holdDelay?.kill();
    this.holdTween?.kill();
    this.el.classList.add('is-holding');

    this.holdDelay = gsap.delayedCall(HOLD_DELAY, () => {
      gsap.to([this.title, this.body, this.enterBtn, this.silentBtn, this.hint], {
        autoAlpha: 0,
        duration: duration(0.5),
        ease: 'power1.in',
      });
      gsap.to(this.progress, {
        scaleX: 1,
        duration: duration(HOLD_PUSH),
        ease: 'none',
      });
      this.holdTween = gsap.to(this.zoom, {
        scale: 1.35,
        duration: duration(HOLD_PUSH),
        ease: 'power2.in',
        onUpdate: () => this.applyMediaTransform(),
        onComplete: () => void this.exit('hold', true),
      });
    });
  }

  private onPointerUp(): void {
    if (this.exiting) return;
    this.el.classList.remove('is-holding');
    this.holdDelay?.kill();
    if (this.holdTween && this.holdTween.progress() < 1) {
      this.holdTween.kill();
      gsap.to(this.progress, { scaleX: 0, duration: duration(0.35), ease: 'power1.out' });
      gsap.to(this.zoom, {
        scale: 1.0,
        duration: duration(0.75),
        ease: 'power3.out',
        onUpdate: () => this.applyMediaTransform(),
      });
      gsap.to([this.title, this.enterBtn, this.silentBtn], {
        autoAlpha: 1,
        duration: duration(0.5),
        ease: 'power1.out',
      });
      gsap.to(this.bodyLines.length ? this.bodyLines : this.body, {
        autoAlpha: 0.7,
        duration: duration(0.5),
      });
      gsap.to(this.hint, { autoAlpha: 0.55, duration: duration(0.5) });
    }
  }

  private exit(via: 'button' | 'hold', withSound: boolean): Promise<void> {
    if (this.exiting) return Promise.resolve();
    this.exiting = true;
    this.enterBtn.disabled = true;
    this.silentBtn.disabled = true;
    this.el.classList.remove('is-holding');
    this.holdDelay?.kill();
    this.holdTween?.kill();
    this.offTick?.();

    return new Promise((resolve) => {
      const tl = gsap.timeline({
        defaults: { ease: 'power1.in' },
        onComplete: () => {
          this.el.remove();
          this.onEntered({ withSound });
          resolve();
        },
      });

      if (via === 'button') {
        tl.to(
          [this.body, this.enterBtn, this.silentBtn, this.hint, this.progress.parentElement],
          { autoAlpha: 0, duration: duration(0.75) },
          0,
        );
        tl.to(this.title, { scale: 2.5, autoAlpha: 0, duration: duration(1.5) }, 0);
        tl.to(
          this.zoom,
          {
            scale: 1.25,
            duration: duration(1.5),
            ease: 'power2.in',
            onUpdate: () => this.applyMediaTransform(),
          },
          0,
        );
        tl.to(
          [this.media, this.el.querySelector('.intro__scrim')],
          { autoAlpha: 0, duration: duration(1.25) },
          duration(0.35),
        );
      } else {
        tl.to(
          [this.media, this.el.querySelector('.intro__scrim'), this.progress.parentElement],
          { autoAlpha: 0, duration: duration(0.9), ease: 'power2.inOut' },
          0,
        );
      }
    });
  }
}
