/**
 * Chrome polarity over a slide.
 *
 * The principle is that chrome contrasts with imagery, not that chrome is
 * white. The reference is white throughout because its photography is
 * uniformly dark at the edges; ours is not, so this is declared per image.
 * See HANDOFF.md for why it is not a slide range.
 */
export type ChromePolarity = 'light' | 'dark';

export interface Slide {
  /** Menu and section-label name. Never rendered over the image. */
  label: string;
  /** Landscape frame. Omitted on the contact slide, which is a flat ground. */
  src?: string;
  /**
   * Portrait frame for narrow viewports. These are deliberate per-image crops,
   * not separately framed photography — see HANDOFF.md.
   */
  portrait?: string;
  alt?: string;
  /** Set when the image is a stand-in, so the gap stays visible in review. */
  placeholder?: string;
  /** 'dark' means warm ink on a light-veiled ground. Defaults to 'light'. */
  chrome?: ChromePolarity;
}

/** The intro gate image. Phase 4 builds the gate; the asset is wired here. */
export const gateImage = {
  src: '/renders/slides/landscape/gate.jpg',
  portrait: '/renders/slides/portrait/gate.jpg',
  alt: 'A powder room in dark stone and warm timber.',
} as const;

/** The menu overlay's panel image, shown only above 1100px. Supplied at 3:4. */
export const menuImage = {
  src: '/renders/slides/menu-panel.jpg',
  alt: 'The library wall, in oak.',
} as const;

/**
 * Five slides, and five is final: hero, three floors, contact.
 *
 * The fourth floor and roof terrace are deliberately out of scope — no render
 * exists and none is being commissioned. HANDOFF.md records what adding a
 * sixth would take, so it stays a decision rather than a gap.
 */
export const slides: Slide[] = [
  {
    label: 'Home',
    src: '/renders/slides/landscape/00-hero.jpg',
    portrait: '/renders/slides/portrait/00-hero.jpg',
    alt: '223 Waverly Avenue seen from the street — a new brick and terracotta townhouse under plane trees.',
    placeholder:
      'Upscaled from a 669x633 source in the Landmarks PDF. Sharp enough to sit on, but it ' +
      'carries no real detail. Needs StudioSC source renders or a re-render.',
  },
  {
    label: 'First Floor',
    chrome: 'dark',
    src: '/renders/slides/landscape/01-first-floor.jpg',
    portrait: '/renders/slides/portrait/01-first-floor.jpg',
    alt: 'The entrance foyer, with a curved plaster wall, upholstered bench and oak library shelving beyond.',
  },
  {
    label: 'Second Floor',
    // The one dark interior. White measures 5.60:1 at the pip rail here where
    // warm measures 1.13:1 — which is why polarity is per image.
    chrome: 'light',
    src: '/renders/slides/landscape/02-second-floor.jpg',
    portrait: '/renders/slides/portrait/02-second-floor.jpg',
    alt: 'The kitchen in rift oak, with green-veined marble counters and the terrace doors beyond.',
  },
  {
    label: 'Third Floor',
    chrome: 'dark',
    src: '/renders/slides/landscape/03-third-floor.jpg',
    portrait: '/renders/slides/portrait/03-third-floor.jpg',
    alt: 'The primary bathroom, the tub centred between its windows.',
  },
  {
    label: 'Contact',
  },
];

/** Gallery sets by slide index. */
export const galleries: Record<number, readonly string[]> = {
  1: ['ENT-004-001', 'ENT-005-002', 'ENT-006-003', 'ENT-007-004', 'ENT-008-008', 'ENT-009-009'],
  2: ['INT-003-000', 'INT-004-001', 'INT-005-002', 'INT-007-008'],
  3: ['INT-017-027', 'INT-019-032'],
};

/**
 * The menu carries six entries against five slides. Floorplans has no slide —
 * it opens the floor panel, which is not built.
 */
export interface MenuEntry {
  label: string;
  slide?: number;
}

export const menuEntries: MenuEntry[] = [
  { label: 'Home', slide: 0 },
  { label: 'First Floor', slide: 1 },
  { label: 'Second Floor', slide: 2 },
  { label: 'Third Floor', slide: 3 },
  { label: 'Floorplans' },
  { label: 'Contact', slide: 4 },
];
