/**
 * Centre logo mark — address only, from the filed project identity.
 * 221–223 Waverly Avenue. Two townhouses. Nothing invented.
 */
export class Logo {
  readonly el: HTMLButtonElement;

  constructor(onHome: () => void) {
    this.el = document.createElement('button');
    this.el.className = 'logo';
    this.el.type = 'button';
    this.el.setAttribute('aria-label', '221–223 Waverly Avenue — Home');
    this.el.innerHTML = `
      <span class="logo__stack" aria-hidden="true">
        <span class="logo__line">221–223</span>
        <span class="logo__line">Waverly</span>
      </span>`;
    this.el.addEventListener('click', onHome);
  }
}
