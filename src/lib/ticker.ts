import { gsap } from 'gsap';

export type TickHandler = (ratio: number) => void;

const handlers = new Set<TickHandler>();
let started = false;

/**
 * One shared GSAP ticker for the whole app, carrying `deltaRatio(60)` so every
 * lerp downstream is frame-rate independent. motion-spec.md §1.2 calls this out
 * as worth copying verbatim; Phase 2's cursor lerp will hang off it.
 */
export function onTick(fn: TickHandler): () => void {
  handlers.add(fn);
  if (!started) {
    started = true;
    gsap.ticker.add(() => {
      const ratio = gsap.ticker.deltaRatio(60);
      for (const handler of handlers) handler(ratio);
    });
  }
  return () => handlers.delete(fn);
}
