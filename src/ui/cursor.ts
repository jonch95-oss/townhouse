import { gsap } from 'gsap';
import { onTick } from '../lib/ticker';
import { reducedMotion } from '../lib/motion';

const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export type CursorMode = 'default' | 'hold' | 'view' | 'active' | 'zoomed';

/**
 * Custom cursor — motion-spec.md §7. Desktop / fine pointer only.
 * Labels only describe interactions that exist on this site.
 */
export class Cursor {
  readonly el: HTMLElement;
  private readonly label: HTMLElement;
  private readonly setX: (v: number) => void;
  private readonly setY: (v: number) => void;
  private cx = 0;
  private cy = 0;
  private tx = 0;
  private ty = 0;
  private mode: CursorMode = 'default';
  private enabled = false;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'fc';
    this.el.setAttribute('aria-hidden', 'true');
    this.el.innerHTML = `
      <svg class="fc__ring" viewBox="0 0 64 64" width="60" height="60">
        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" stroke-width="1.5"
                vector-effect="non-scaling-stroke"/>
      </svg>
      <span class="fc__dot"></span>
      <span class="fc__label label"></span>
      <span class="fc__arrows" aria-hidden="true"><i></i><i></i></span>`;
    this.label = this.el.querySelector('.fc__label') as HTMLElement;
    this.setX = gsap.quickSetter(this.el, 'x', 'px') as (v: number) => void;
    this.setY = gsap.quickSetter(this.el, 'y', 'px') as (v: number) => void;

    if (!hasFinePointer || reducedMotion) return;
    this.enabled = true;
    document.documentElement.classList.add('has-fc');
    window.addEventListener('pointermove', (e) => {
      this.tx = e.clientX;
      this.ty = e.clientY;
      if (!this.el.classList.contains('is-visible')) {
        this.cx = this.tx;
        this.cy = this.ty;
        this.setX(this.cx);
        this.setY(this.cy);
        this.el.classList.add('is-visible');
      }
    });
    document.addEventListener('mouseover', (e) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('button, a, .js-fc-dot, input, textarea')) {
        this.el.classList.add('is-hot');
      }
    });
    document.addEventListener('mouseout', (e) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('button, a, .js-fc-dot, input, textarea')) {
        this.el.classList.remove('is-hot');
      }
    });
    onTick((ratio) => {
      const f = 0.1 * ratio;
      this.cx += (this.tx - this.cx) * f;
      this.cy += (this.ty - this.cy) * f;
      this.setX(this.cx);
      this.setY(this.cy);
    });
  }

  setMode(mode: CursorMode): void {
    if (!this.enabled || mode === this.mode) return;
    this.mode = mode;
    this.el.classList.remove('is-first', 'is-timelapse', 'is-zoomed', 'is-active');
    if (mode === 'hold') {
      this.el.classList.add('is-first');
      this.label.textContent = 'Press & Hold';
    } else if (mode === 'view') {
      this.el.classList.add('is-timelapse');
      this.label.textContent = 'See the view';
    } else if (mode === 'zoomed') {
      this.el.classList.add('is-zoomed');
      this.label.textContent = '';
    } else if (mode === 'active') {
      this.el.classList.add('is-active');
      this.label.textContent = '';
    } else {
      this.label.textContent = '';
    }
  }
}
