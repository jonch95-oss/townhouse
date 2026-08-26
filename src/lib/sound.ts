/**
 * Ambient audio for the experience.
 *
 * Tracks in /public/sound are synthetic beds (warm drone + soft room tone) —
 * not field recordings of Waverly Avenue, and not depictions of any building
 * feature. See public/sound/README.md. Replace when the client supplies
 * licensed audio.
 *
 * Preference is remembered in sessionStorage so a "without sound" entry stays
 * quiet for the visit.
 */
const STORAGE_KEY = 'waverly-sound';

export class Sound {
  private readonly background: HTMLAudioElement;
  private readonly ambient: HTMLAudioElement;
  private enabled: boolean;
  private started = false;

  constructor() {
    this.background = new Audio('/sound/background.mp3');
    this.ambient = new Audio('/sound/ambient.mp3');
    for (const a of [this.background, this.ambient]) {
      a.loop = true;
      a.preload = 'auto';
    }
    this.background.volume = 0.32;
    this.ambient.volume = 0.18;

    const stored = sessionStorage.getItem(STORAGE_KEY);
    this.enabled = stored === null ? true : stored === '1';
  }

  get on(): boolean {
    return this.enabled;
  }

  /** Preload both beds during the intro wait. */
  preload(): void {
    void this.background.load();
    void this.ambient.load();
  }

  /** Start (or keep quiet) after the visitor enters. */
  async enter(withSound: boolean): Promise<void> {
    this.enabled = withSound;
    sessionStorage.setItem(STORAGE_KEY, withSound ? '1' : '0');
    if (!withSound) return;
    await this.play();
  }

  async toggle(): Promise<boolean> {
    this.enabled = !this.enabled;
    sessionStorage.setItem(STORAGE_KEY, this.enabled ? '1' : '0');
    if (this.enabled) await this.play();
    else this.pause();
    return this.enabled;
  }

  private async play(): Promise<void> {
    try {
      if (!this.started) {
        this.started = true;
        await this.background.play();
        // Soft second layer, slightly delayed — same shape as the reference,
        // without their cloud-descent timing.
        window.setTimeout(() => {
          if (this.enabled) void this.ambient.play().catch(() => undefined);
        }, 1200);
      } else {
        await this.background.play();
        await this.ambient.play();
      }
    } catch {
      // Autoplay blocked — the Sound toggle remains the recovery path.
      this.enabled = false;
      sessionStorage.setItem(STORAGE_KEY, '0');
    }
  }

  private pause(): void {
    this.background.pause();
    this.ambient.pause();
  }
}
