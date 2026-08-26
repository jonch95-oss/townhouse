/**
 * Trailing-edge debounce that locks the first non-zero sign of `y` for the
 * window. The slide machine used to pass the *last* delta into the callback —
 * on a trackpad or touch bounce that last tick often reversed, so a deliberate
 * forward flick could advance backward.
 *
 * First argument must be a number (the normalised scroll delta).
 */
export function debounceDir(
  fn: (y: number, ...rest: unknown[]) => void,
  wait: number,
): (y: number, ...rest: unknown[]) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let locked = 0;
  let restArgs: unknown[] = [];

  return (y: number, ...rest: unknown[]) => {
    if (y !== 0 && locked === 0) locked = Math.sign(y);
    if (locked === 0) return;
    restArgs = rest;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      const dir = locked;
      locked = 0;
      fn(dir, ...restArgs);
    }, wait);
  };
}

/** Plain trailing debounce — for non-directional callbacks (resize, etc.). */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, wait);
  };
}
