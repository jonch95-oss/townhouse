/**
 * Inquire — jumps to the Contact slide. No invented phone or form.
 */
export class Inquire {
  readonly el: HTMLButtonElement;

  constructor(onInquire: () => void) {
    this.el = document.createElement('button');
    this.el.className = 'inquire label';
    this.el.type = 'button';
    this.el.textContent = 'Inquire';
    this.el.addEventListener('click', onInquire);
  }
}
