import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

/**
 * The one text reveal, registered as a GSAP effect exactly as the reference
 * does it (motion-spec.md §3.1): masked lines sliding up from yPercent 100,
 * 1.5s, 0.1 stagger, on `unmask`. Everything on the site reveals this way.
 */
export function registerReveal(): void {
  gsap.registerEffect({
    name: 'textMasks',
    effect: (targets: gsap.TweenTarget, config: Record<string, number | string>) =>
      gsap.from(targets, {
        duration: config.duration as number,
        yPercent: 100,
        stagger: config.stagger as number,
        delay: config.delay as number,
        ease: config.ease as string,
      }),
    defaults: { duration: 1.5, stagger: 0.1, delay: 0, ease: 'unmask' },
    extendTimeline: true,
  });
}

/**
 * Split into masked lines. Never into characters — motion-spec.md §3.1 is
 * explicit that character-level animation is spent in exactly two places on
 * the whole site, and a left-to-right character stagger is the single most
 * common way this genre tips into pastiche.
 */
export function splitLines(el: HTMLElement): HTMLElement[] {
  const split = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
  return split.lines as HTMLElement[];
}

/** Split into characters. Only for the looping hint — see scroll-hint.ts. */
export function splitChars(el: HTMLElement): HTMLElement[] {
  const split = new SplitText(el, { type: 'words,chars', charsClass: 'char' });
  return split.chars as HTMLElement[];
}

/**
 * Wrap an unsplit element in an overflow-hidden mask so a yPercent: 100 move
 * reads as the line rising out of nothing rather than sliding down the page.
 * The reference gets this free from SplitText's line wrappers; the eyebrow and
 * the price are not split, so they need it explicitly.
 */
export function mask(el: HTMLElement): HTMLElement {
  const wrapper = document.createElement('span');
  wrapper.className = 'mask';
  el.parentNode?.insertBefore(wrapper, el);
  wrapper.appendChild(el);
  return el;
}
