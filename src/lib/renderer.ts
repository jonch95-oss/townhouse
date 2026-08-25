/**
 * The seam between the slide machine and whatever draws the slides.
 *
 * Phase 1 ships `CrossfadeRenderer` — plain <img> elements and an opacity
 * blend. Phase 4 can drop in a Three.js implementation of this same interface
 * (hard-edged `step()` wipe plus counter-parallax, motion-spec.md §5) without
 * the machine in `slides.ts` changing at all. That is the whole point of
 * getting the pacing right first: the timeline driving `render()` is already
 * the final one.
 */
export interface SlideRenderer {
  /** Called once at the top of a transition, before the first `render`. */
  change(from: number, to: number): void;
  /** Called every frame with the eased transition progress, 0 → 1. */
  render(progress: number): void;
}

export class CrossfadeRenderer implements SlideRenderer {
  private from = 0;
  private to = 0;

  constructor(private readonly layers: HTMLElement[]) {
    this.layers.forEach((layer, i) => {
      layer.style.opacity = i === 0 ? '1' : '0';
      layer.style.zIndex = i === 0 ? '1' : '0';
    });
  }

  change(from: number, to: number): void {
    this.from = from;
    this.to = to;
    // Outgoing sits under incoming so the blend never shows the page ground.
    this.layers.forEach((layer, i) => {
      layer.style.zIndex = i === to ? '2' : i === from ? '1' : '0';
    });
  }

  render(progress: number): void {
    const fromLayer = this.layers[this.from];
    const toLayer = this.layers[this.to];
    if (fromLayer) fromLayer.style.opacity = String(1 - progress);
    if (toLayer) toLayer.style.opacity = String(progress);
  }
}
