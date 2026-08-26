import { isTk } from '../data/copy';

/**
 * Renders a missing fact as a marker nobody could miss in review.
 *
 * It is deliberately outside the three-colour palette and deliberately ugly:
 * a TK that blended in would be a TK that shipped. `npm run check:tk` fails
 * while any remain.
 */
export function tkNode(what: string): HTMLElement {
  const el = document.createElement('mark');
  el.className = 'tk';
  el.dataset.tk = what;
  el.textContent = `TK ${what}`;
  el.title = `Missing fact: ${what}. Do not ship.`;
  return el;
}

/** A copy value that may be a string, a TK, or a mix of both in sequence. */
export type CopyValue = string | { tk: string } | readonly (string | { tk: string })[];

export function renderCopy(value: CopyValue): (Node | string)[] {
  const parts = Array.isArray(value) ? value : [value];
  return (parts as readonly (string | { tk: string })[]).map((part) =>
    isTk(part) ? tkNode(part.tk) : String(part),
  );
}

/** Convenience for a single text node target. */
export function fillCopy(el: HTMLElement, value: CopyValue): void {
  el.replaceChildren(...renderCopy(value));
}
