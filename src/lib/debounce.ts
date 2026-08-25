/**
 * Trailing-edge debounce. The slide machine runs the wheel through this at
 * 50 ms alongside Lethargy — the two do different jobs: Lethargy throws away
 * inertia, the debounce collapses whatever survives into one call.
 */
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
