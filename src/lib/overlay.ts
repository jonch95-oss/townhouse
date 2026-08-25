/**
 * Keyboard and focus handling for any full-screen overlay.
 *
 * The reference's gallery has none of this: no Escape, no arrow keys, no focus
 * trap, and its global arrow-key scroll handler stays live behind the open
 * lightbox, so ArrowDown inside the gallery does nothing useful while quietly
 * driving the slide machine underneath. motion-spec.md §9 calls it the clearest
 * defect in an otherwise meticulous build.
 *
 * Nothing uses this yet — the menu overlay and the lightbox are Phase 3. It
 * exists now so neither can be built without it.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface OverlayOptions {
  /** Escape, and the close button. */
  onClose: () => void;
  /** Left/Right arrows. Omit for an overlay with nothing to page through. */
  onPrevious?: () => void;
  onNext?: () => void;
}

export class Overlay {
  private previouslyFocused: HTMLElement | null = null;
  private bound = false;

  constructor(
    private readonly el: HTMLElement,
    private readonly options: OverlayOptions,
  ) {}

  private focusable(): HTMLElement[] {
    return [...this.el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (node) => node.offsetParent !== null || node === document.activeElement,
    );
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        // Stop the global slide handler seeing this too.
        e.stopPropagation();
        this.options.onClose();
        return;

      case 'ArrowLeft':
      case 'ArrowUp':
        if (!this.options.onPrevious) return;
        e.preventDefault();
        e.stopPropagation();
        this.options.onPrevious();
        return;

      case 'ArrowRight':
      case 'ArrowDown':
        if (!this.options.onNext) return;
        e.preventDefault();
        e.stopPropagation();
        this.options.onNext();
        return;

      case 'Tab': {
        // The trap. Wrap at both ends rather than escaping to the page behind.
        const nodes = this.focusable();
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const first = nodes[0] as HTMLElement;
        const last = nodes[nodes.length - 1] as HTMLElement;
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !this.el.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      default:
    }
  };

  open(): void {
    if (this.bound) return;
    this.bound = true;
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    this.el.removeAttribute('inert');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('role', 'dialog');
    // Capture phase, so the global slide keydown handler never sees these.
    document.addEventListener('keydown', this.onKeyDown, true);
    this.focusable()[0]?.focus();
  }

  close(): void {
    if (!this.bound) return;
    this.bound = false;
    document.removeEventListener('keydown', this.onKeyDown, true);
    this.el.removeAttribute('aria-modal');
    this.el.setAttribute('inert', '');
    this.previouslyFocused?.focus();
  }

  get isOpen(): boolean {
    return this.bound;
  }
}
