import { images } from '../data/images.generated';
import type { ImageEntry } from '../data/images.generated';

/**
 * Builds a <picture> from the generated manifest — spec/assets.md §3.
 *
 * AVIF first, then WebP, then JPEG. Width-based `srcset` with an honest
 * `sizes`, rather than the reference's DPR multipliers: fewer variants, and
 * the browser gets to make the decision it is actually good at.
 *
 * The wrapper is painted with the image's dominant colour and its LQIP before
 * anything arrives, which is why there is never a white flash between slides.
 * The reference gets both free from its CDN; ours are generated at build time.
 */
export interface PictureOptions {
  /** Manifest key, e.g. '00-hero' or 'panel/menu-panel'. */
  image: string;
  alt: string;
  /** A second manifest key used below 650px. Usually the portrait crop. */
  narrow?: string;
  sizes?: string;
  className?: string;
  eager?: boolean;
}

/**
 * Manifest keys carry their source directory (`landscape/00-hero`), but the
 * slide manifest names bare keys (`00-hero`). Resolve one to the other here so
 * every consumer — <picture>, the shader's texture list — reads the same way.
 */
export const resolveImage = (key: string): ImageEntry | undefined =>
  images[key] ?? images[`landscape/${key}`] ?? images[`gallery/${key}`] ?? images[`portrait/${key}`];

const entry = resolveImage;

const srcsetOf = (e: ImageEntry, fmt: 'avif' | 'webp' | 'jpg') =>
  e.srcset[fmt].map((v: { w: number; url: string }) => `${v.url} ${v.w}w`).join(', ');

export function buildPicture(opts: PictureOptions): HTMLElement {
  const wide = entry(opts.image);
  if (!wide) throw new Error(`No image manifest entry for "${opts.image}"`);
  const narrow = opts.narrow ? entry(opts.narrow) : undefined;

  const figure = document.createElement('div');
  figure.className = ['picture', opts.className].filter(Boolean).join(' ');
  // Paint before the image lands.
  figure.style.setProperty('--dominant', wide.dominant);
  figure.style.setProperty('--lqip', `url("${wide.lqip}")`);

  const picture = document.createElement('picture');
  const sizes = opts.sizes ?? '100vw';

  // Narrow sources first: the browser takes the first matching <source>.
  for (const [fmt, type] of [['avif', 'image/avif'], ['webp', 'image/webp'], ['jpg', 'image/jpeg']] as const) {
    if (narrow) {
      const s = document.createElement('source');
      s.type = type;
      s.media = '(max-width: 649px)';
      s.srcset = srcsetOf(narrow, fmt);
      s.sizes = sizes;
      picture.appendChild(s);
    }
    const s = document.createElement('source');
    s.type = type;
    s.srcset = srcsetOf(wide, fmt);
    s.sizes = sizes;
    picture.appendChild(s);
  }

  const img = document.createElement('img');
  img.className = 'picture__img';
  const fallback = wide.srcset.jpg;
  img.src = (fallback[fallback.length - 1] ?? fallback[0])!.url;
  img.alt = opts.alt;
  img.width = wide.width;
  img.height = wide.height;
  img.draggable = false;
  img.decoding = 'async';
  img.loading = opts.eager ? 'eager' : 'lazy';
  if (opts.eager) img.fetchPriority = 'high';
  img.addEventListener('load', () => figure.classList.add('is-loaded'), { once: true });
  if (img.complete && img.naturalWidth > 0) figure.classList.add('is-loaded');
  picture.appendChild(img);

  figure.appendChild(picture);
  return figure;
}
