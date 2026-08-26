/**
 * Ambient audio for the experience.
 *
 * Background: "Terrace Afterglow" by FreeVibeVault (CC BY 4.0) — a free
 * sundown / terrace lounge bed. See public/sound/README.md. Not Gin & Tonic's
 * "Sundown" (that track is not free to license here).
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
    // One clear bed + a soft filtered underlayer. Keep low so it sits under
    // the rooms without competing with them.
    this.background.volume = 0.22;
    this.ambient.volume = 0.08;

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
