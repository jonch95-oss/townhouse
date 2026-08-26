/**
 * Centre logo mark — address only, from the filed project identity.
 * 223 Waverly Avenue. Nothing invented.
 */
export class Logo {
  readonly el: HTMLButtonElement;

  constructor(onHome: () => void) {
    this.el = document.createElement('button');
    this.el.className = 'logo';
    this.el.type = 'button';
    this.el.setAttribute('aria-label', '223 Waverly Avenue — Home');
    this.el.innerHTML = `
      <span class="logo__stack" aria-hidden="true">
        <span class="logo__line">223</span>
        <span class="logo__line">Waverly</span>
      </span>`;
    this.el.addEventListener('click', onHome);
  }
}
