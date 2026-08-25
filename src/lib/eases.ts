import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

/**
 * The two custom eases the reference site runs on, transcribed from
 * motion-spec.md §12. `snappy` drives every slide transition; `unmask` drives
 * every text reveal (registered now so Phase 2 can just use it).
 */
export function registerEases(): void {
  CustomEase.create(
    'snappy',
    'M0,0 C0.094,0.026 0.124,0.127 0.157,0.29 0.197,0.486 0.254,0.8 0.348,0.884 0.42,0.949 0.374,1 1,1',
  );
  CustomEase.create('unmask', 'M0,0 C0.16,1 0.3,1 1,1');
}
