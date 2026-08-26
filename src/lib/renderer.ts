/**
 * The seam between the slide machine and whatever draws the slides.
 *
 * Crossfade with a short counter-travel — enough to feel like a wipe without
 * the WebGL path that painted black on phones.
 */
export interface SlideRenderer {
  change(from: number, to: number): void;
  render(progress: number): void;
}

export class CrossfadeRenderer implements SlideRenderer {
  private from = 0;
  private to = 0;
  private dir = 1;

  constructor(private readonly layers: HTMLElement[]) {
    this.layers.forEach((layer, i) => {
      layer.style.opacity = i === 0 ? '1' : '0';
      layer.style.zIndex = i === 0 ? '1' : '0';
      layer.style.willChange = 'opacity, transform';
      layer.style.transform = 'translate3d(0,0,0)';
    });
  }

  change(from: number, to: number): void {
    this.from = from;
    this.to = to;
    this.dir = to > from ? 1 : -1;
    this.layers.forEach((layer, i) => {
      layer.style.zIndex = i === to ? '2' : i === from ? '1' : '0';
    });
  }

  render(progress: number): void {
    const fromLayer = this.layers[this.from];
    const toLayer = this.layers[this.to];
    // Counter-travel: outgoing drifts one way, incoming the other — reads
    // sharper than a flat opacity blend without needing WebGL.
    const travel = 4; // percent of viewport height
    if (fromLayer) {
      fromLayer.style.opacity = String(1 - progress);
      fromLayer.style.transform = `translate3d(0, ${-this.dir * travel * progress}%, 0)`;
    }
    if (toLayer) {
      toLayer.style.opacity = String(progress);
      toLayer.style.transform = `translate3d(0, ${this.dir * travel * (1 - progress)}%, 0)`;
    }
  }
}
