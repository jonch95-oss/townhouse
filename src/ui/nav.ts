/**
 * The persistent nav — motion-spec.md §6.1. It fades in once, and then never
 * hides: there is no scroll direction for it to respond to. The layer is
 * pointer-events: none with the controls opting back in, so it never steals a
 * press from the slide beneath it.
 *
 * The toggle's icon is two bars that rotate to 17.5 degrees, not 45, over a
 * full second. The shallow cross reads as considered where a burger-to-X reads
 * as a component someone installed.
 *
 * The overlay it opens is Phase 3. The toggle here animates, swaps its label
 * and reports its state; it has nothing to open yet.
 */
export class MenuToggle {
  readonly el: HTMLButtonElement;
  private open = false;

  constructor(private readonly onToggle?: (open: boolean) => void) {
    this.el = document.createElement('button');
    this.el.className = 'menu-toggle';
    this.el.type = 'button';
    this.el.setAttribute('aria-expanded', 'false');
    this.el.innerHTML = `
      <span class="menu-toggle__icon" aria-hidden="true"></span>
      <span class="menu-toggle__label label">Menu</span>`;
    this.el.addEventListener('click', () => this.toggle());
  }

  toggle(): void {
    this.open = !this.open;
    this.el.classList.toggle('is-active', this.open);
    this.el.setAttribute('aria-expanded', String(this.open));
    const label = this.el.querySelector('.menu-toggle__label');
    if (label) label.textContent = this.open ? 'Close' : 'Menu';
    this.onToggle?.(this.open);
  }
}
