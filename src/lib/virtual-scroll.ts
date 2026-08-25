/**
 * The hand-rolled virtual scroll, normalised exactly as motion-spec.md §1.2
 * documents it. Emits a synthetic event carrying the normalised delta `y` and
 * the original event `oe` — Lethargy needs the raw wheel event, not our
 * normalised number.
 */
export interface VirtualScrollEvent {
  y: number;
  oe: WheelEvent | TouchEvent | KeyboardEvent;
}

export type VirtualScrollHandler = (e: VirtualScrollEvent) => void;

const KEY_DELTA = 120;
const TOUCH_MULT = 3;

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
  let lastTouchY = 0;

  const onWheel = (e: WheelEvent) => {
    const raw = e as WheelEvent & { wheelDeltaY?: number };
    const y = (raw.wheelDeltaY || e.deltaY * -1) * WHEEL_MULT;
    handler({ y, oe: e });
  };

  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch) lastTouchY = touch.pageY;
  };

  const onTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const y = (touch.pageY - lastTouchY) * TOUCH_MULT;
    lastTouchY = touch.pageY;
    handler({ y, oe: e });
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
  document.addEventListener('keydown', onKeyDown);

  return () => {
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('keydown', onKeyDown);
  };
}
