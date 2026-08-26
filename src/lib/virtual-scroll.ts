/**
 * The hand-rolled virtual scroll, normalised exactly as motion-spec.md §1.2
 * documents it. Emits a synthetic event carrying the normalised delta `y` and
 * the original event `oe` — Lethargy needs the raw wheel event, not our
 * normalised number.
 *
 * Touch is special: we accumulate travel across the gesture and emit once on
 * `touchend`. Firing on every `touchmove` into a trailing debounce meant the
 * last micro-bounce decided direction — swipe up for next could flip to previous.
 */
export interface VirtualScrollEvent {
  y: number;
  oe: WheelEvent | TouchEvent | KeyboardEvent;
}

export type VirtualScrollHandler = (e: VirtualScrollEvent) => void;

const KEY_DELTA = 120;
const TOUCH_MULT = 3;
/** Minimum finger travel (px, before multiplier) before a swipe counts. */
const TOUCH_THRESHOLD = 36;

/** Windows reports much smaller wheel deltas, so it gets a larger multiplier. */
const WHEEL_MULT = /Win/i.test(navigator.userAgent) ? 0.9 : 0.4;

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function createVirtualScroll(handler: VirtualScrollHandler): () => void {
  let touchStartY = 0;
  let touchAccumY = 0;
  let touching = false;

  const onWheel = (e: WheelEvent) => {
    const raw = e as WheelEvent & { wheelDeltaY?: number };
    const y = (raw.wheelDeltaY || e.deltaY * -1) * WHEEL_MULT;
    handler({ y, oe: e });
  };

  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touching = true;
    touchStartY = touch.pageY;
    touchAccumY = 0;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!touching) return;
    const touch = e.touches[0];
    if (!touch) return;
    // Total travel from gesture start — not frame-to-frame — so a bounce at
    // the end cannot reverse the intended direction.
    touchAccumY = (touch.pageY - touchStartY) * TOUCH_MULT;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!touching) return;
    touching = false;
    const y = touchAccumY;
    touchAccumY = 0;
    if (Math.abs(y) < TOUCH_THRESHOLD * TOUCH_MULT) return;
    handler({ y, oe: e });
  };

  const onTouchCancel = () => {
    touching = false;
    touchAccumY = 0;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (isTextEntry(e.target)) return;

    let y: number | null = null;
    switch (e.key) {
      case 'ArrowUp':
      case 'PageUp':
        y = KEY_DELTA;
        break;
      case 'ArrowDown':
      case 'PageDown':
        y = -KEY_DELTA;
        break;
      case ' ':
      case 'Spacebar':
        y = (window.innerHeight - 40) * (e.shiftKey ? 1 : -1);
        break;
      default:
        return;
    }
    e.preventDefault();
    handler({ y, oe: e });
  };

  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchCancel, { passive: true });
  document.addEventListener('keydown', onKeyDown);

  return () => {
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchCancel);
    document.removeEventListener('keydown', onKeyDown);
  };
}
