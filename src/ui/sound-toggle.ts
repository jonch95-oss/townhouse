import { Sound } from '../lib/sound';

/**
 * SOUND toggle — bottom left on desktop, under the menu on mobile.
 * Animated equaliser bars while audio is playing.
 */
export class SoundToggle {
  readonly el: HTMLButtonElement;

  constructor(private readonly sound: Sound) {
    this.el = document.createElement('button');
    this.el.className = 'sound-toggle';
    this.el.type = 'button';
    this.el.innerHTML = `
      <span class="sound-toggle__eq" aria-hidden="true">
        <i></i><i></i><i></i><i></i>
      </span>
      <span class="sound-toggle__label label">Sound</span>`;
    this.sync();
    this.el.addEventListener('click', () => void this.onClick());
  }

  private async onClick(): Promise<void> {
    await this.sound.toggle();
    this.sync();
  }

  sync(): void {
    const on = this.sound.on;
    this.el.classList.toggle('is-on', on);
    this.el.setAttribute('aria-pressed', String(on));
    this.el.setAttribute('aria-label', on ? 'Mute sound' : 'Unmute sound');
    const label = this.el.querySelector('.sound-toggle__label');
    if (label) label.textContent = on ? 'Sound' : 'Sound off';
  }
}
