/**
 * Slides are organised BY ROOM, not by floor — see docs/source/SLIDES.md.
 *
 * The GC plan sheets (A-100.01 / A-101.01) give the real programme:
 *
 *   1st  foyer · library · courtyard · hallway · KITCHEN · DINING ROOM · bath
 *   2nd  bedroom 1 · bath · hallway · living room · terrace
 *   3rd  primary bedroom · primary bathroom · W.I.C. · dressing room · terrace
 *   4th  bedroom · bath · hallway · terrace · mechanical
 *   roof two roof terraces · vestibule · mechanical
 *
 * The kitchen is on the GROUND floor. An earlier version of this file labelled
 * the kitchen render "Second Floor", which was factually wrong about the
 * building — docs/PROJECT-FACTS.md had it right the whole time.
 *
 * Organising by floor would need imagery for four floors. Renders exist for
 * three rooms and two of those share a floor, so the slides are rooms. Every
 * slide has a real image and a truthful label, and none claims a floor it is
 * not on. Floor labels live in the floorplans panel, where the plan is the
 * evidence.
 *
 * The image FILENAMES keep their old numbering; only the labels changed.
 */
export type ChromePolarity = 'light' | 'dark';

export interface Slide {
  label: string;
  /** Key into the generated image manifest. Absent on the contact slide. */
  image?: string;
  alt?: string;
  placeholder?: string;
  chrome?: ChromePolarity;
}

export const gateImage = {
  image: 'gate',
  alt: 'A powder room in dark stone and warm timber.',
} as const;

export const menuImage = {
  image: 'panel/menu-panel',
  alt: 'The library wall, in oak.',
} as const;

export const slides: Slide[] = [
  {
    label: 'Home',
    image: '00-hero',
    alt: '223 Waverly Avenue seen from the street — a new brick and terracotta house under plane trees.',
    placeholder:
      'Upscaled roughly 4x from a 669x633 source in the Landmarks PDF. It composites well ' +
      'but carries no real detail. Needs StudioSC source renders or a re-render.',
  },
  {
    label: 'Entrance & Library',
    chrome: 'dark',
    image: '01-first-floor',
    alt: 'The entrance foyer, with a curved plaster wall, upholstered bench and oak library shelving beyond.',
  },
  {
    label: 'Living',
    // The one dark interior: white measures 5.60:1 at the pip rail here where
    // warm measures 1.13:1, which is why polarity is per image.
    chrome: 'light',
    image: '02-second-floor',
    alt: 'The kitchen and dining room in rift oak, with green-veined marble counters and the rear yard beyond.',
  },
  {
    label: 'Primary Suite',
    // Vanity + skylights are mid-bright plaster; warm chrome + white scrim was
    // veiling the plate. Light chrome (white ink, black scrim) reads cleaner.
    chrome: 'light',
    image: '03-third-floor',
    alt: 'The primary bathroom vanity under the slanted skylight wall, marble and oak with a cognac leather stool.',
  },
  {
    label: 'Contact',
  },
];

export const galleries: Record<number, readonly string[]> = {
  1: ['ENT-004-001', 'ENT-005-002', 'ENT-006-003', 'ENT-008-008', 'ENT-009-009'],
  2: ['INT-003-000', 'INT-004-001', 'INT-005-002', 'INT-007-008'],
  // Tub hero (former main) + shower/toilet view — vanity is now the main plate.
  3: ['INT-020-033', 'INT-019-032'],
};

export interface MenuEntry {
  label: string;
  slide?: number;
  panel?: 'floorplans';
}

export const menuEntries: MenuEntry[] = [
  { label: 'Home', slide: 0 },
  { label: 'Entrance & Library', slide: 1 },
  { label: 'Living', slide: 2 },
  { label: 'Primary Suite', slide: 3 },
  { label: 'Floorplans', panel: 'floorplans' },
  { label: 'Contact', slide: 4 },
];

/**
 * The floorplans panel. These are CONSTRUCTION drawings, not marketing plans —
 * dimension strings, annotations and sheet furniture included. Noted as a
 * quality gap in HANDOFF.md.
 */
export interface FloorPlan {
  label: string;
  image: string;
  download: string;
}

export const floorplans: FloorPlan[] = [
  { label: 'First Floor', image: 'floorplan/01-first-floor', download: '/renders/floorplans/01-first-floor.png' },
  { label: 'Second Floor', image: 'floorplan/02-second-floor', download: '/renders/floorplans/02-second-floor.png' },
  { label: 'Third Floor', image: 'floorplan/03-third-floor', download: '/renders/floorplans/03-third-floor.png' },
  { label: 'Fourth Floor', image: 'floorplan/04-fourth-floor', download: '/renders/floorplans/04-fourth-floor.png' },
  { label: 'Roof', image: 'floorplan/05-roof', download: '/renders/floorplans/05-roof.png' },
];
