/**
 * Centre logo mark — brand name with address beneath.
 */
import { copy } from '../data/copy';

export class Logo {
  readonly el: HTMLButtonElement;

  constructor(onHome: () => void) {
    this.el = document.createElement('button');
    this.el.className = 'logo';
    this.el.type = 'button';
    this.el.setAttribute(
      'aria-label',
      `${copy.logo.name} — ${copy.logo.address.replace(' · ', ', ')} — Home`,
    );
    this.el.innerHTML = `
      <span class="logo__stack" aria-hidden="true">
        <span class="logo__name">${copy.logo.name}</span>
        <span class="logo__address label">${copy.logo.address}</span>
      </span>`;
    this.el.addEventListener('click', onHome);
  }
}
