/**
 * Lethargy — distinguishes a deliberate wheel gesture from the inertial tail
 * a trackpad emits after your fingers leave it.
 *
 * Faithful TypeScript port of https://github.com/d4nyll/lethargy (MIT).
 * Vendored rather than installed: it is 60 lines, the published package ships
 * untyped CoffeeScript output, and motion-spec.md §1.3 calls for exact
 * behavioural parity with `new Lethargy(8, 50)`.
 *
 * Quirk preserved from the original: the defaults are NOT run through the
 * `1 + Math.abs(x)` normalisation, but any value you pass IS. So the default
 * sensitivity is 100, while `new Lethargy(8, 50)` yields a sensitivity of 51.
 */
export class Lethargy {
  private readonly stability: number;
  private readonly sensitivity: number;
  private readonly tolerance: number;
  private readonly delay: number;

  private readonly lastUpDeltas: (number | null)[];
  private readonly lastDownDeltas: (number | null)[];
  private readonly deltasTimestamp: (number | null)[];

  constructor(stability?: number, sensitivity?: number, tolerance?: number, delay?: number) {
    this.stability = stability != null ? Math.abs(stability) : 8;
    this.sensitivity = sensitivity != null ? 1 + Math.abs(sensitivity) : 100;
    this.tolerance = tolerance != null ? 1 + Math.abs(tolerance) : 1.1;
    this.delay = delay != null ? delay : 150;

    const span = this.stability * 2;
    this.lastUpDeltas = new Array(span).fill(null);
    this.lastDownDeltas = new Array(span).fill(null);
    this.deltasTimestamp = new Array(span).fill(null);
  }

  /**
   * Feed it the raw wheel event. Returns the direction (1 up / -1 down) for a
   * deliberate gesture, or `false` when the event is inertia and should be
   * thrown away.
   */
  check(e: WheelEvent): 1 | -1 | false {
    const raw = e as WheelEvent & { wheelDelta?: number; detail?: number };
    let lastDelta: number;

    if (raw.wheelDelta !== undefined) lastDelta = raw.wheelDelta;
    else if (raw.deltaY !== undefined) lastDelta = raw.deltaY * -40;
    else if (raw.detail !== undefined) lastDelta = raw.detail * -40;
    else return false;

    this.deltasTimestamp.push(Date.now());
    this.deltasTimestamp.shift();

    if (lastDelta > 0) {
      this.lastUpDeltas.push(lastDelta);
      this.lastUpDeltas.shift();
      return this.isInertia(1);
    }
    this.lastDownDeltas.push(lastDelta);
    this.lastDownDeltas.shift();
    return this.isInertia(-1);
  }

  private isInertia(direction: 1 | -1): 1 | -1 | false {
    const deltas = direction === -1 ? this.lastDownDeltas : this.lastUpDeltas;
    const span = this.stability * 2;

    // Not enough history yet — trust the gesture.
    if (deltas[0] === null) return direction;

    // A dead-flat run inside the delay window is the tail of a previous flick.
    if (
      (this.deltasTimestamp[span - 2] as number) + this.delay > Date.now() &&
      deltas[0] === deltas[span - 1]
    ) {
      return false;
    }

    const older = deltas.slice(0, this.stability) as number[];
    const newer = deltas.slice(this.stability, span) as number[];
    const olderAvg = older.reduce((t, n) => t + n, 0) / older.length;
    const newerAvg = newer.reduce((t, n) => t + n, 0) / newer.length;

    // Still accelerating (or holding) AND above the noise floor => deliberate.
    const accelerating = Math.abs(olderAvg) < Math.abs(newerAvg * this.tolerance);
    const loudEnough = this.sensitivity < Math.abs(newerAvg);
    return accelerating && loudEnough ? direction : false;
  }
}
