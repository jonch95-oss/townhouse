export interface Slide {
  /** Menu label. Deliberately NOT rendered over the image — sections.md S3–S6. */
  label: string;
  /** Omitted on the contact slide, which lands on a flat warm ground. */
  src?: string;
  alt?: string;
  /** Set when the image is a stand-in, so the gap stays visible in review. */
  placeholder?: string;
}

/**
 * Six slides: the hero, four floors, and contact.
 *
 * Floors 1-3 are on real StudioSC renders at full embedded resolution, in
 * public/renders/source/ — see the README there for provenance. The hero and
 * the fourth floor are still placeholders because no render exists for either.
 */

/**
 * The intro gate image. A powder room: dark, warm and material, and — the
 * point — it does not show the building, so the gate does not spend the
 * reveal that the entrance sequence and the hero are meant to pay off.
 * The gate itself is Phase 4; this is here so it is wired when it is built.
 */
export const gateImage = {
  src: '/renders/source/INT-022-034.jpeg',
  alt: 'A powder room in dark stone and warm timber.',
} as const;

/**
 * Gallery sets per floor, for the Phase 3 lightbox. Recorded now rather than
 * wired, because no lightbox exists yet — there is nothing to stub.
 */
export const galleries: Record<number, readonly string[]> = {
  1: ['ENT-004-001', 'ENT-005-002', 'ENT-006-003', 'ENT-007-004', 'ENT-008-008', 'ENT-009-009'],
  2: ['INT-003-000', 'INT-004-001', 'INT-005-002', 'INT-006-003', 'INT-007-008'],
  3: ['INT-017-027', 'INT-019-032'],
};
export const slides: Slide[] = [
  {
    label: 'Home',
    src: '/slides/00-hero.jpg',
    alt: '223 Waverly Avenue seen from the southeast — a new brick townhouse on a Clinton Hill street.',
    placeholder:
      'PLACEHOLDER — 735x633 is the resolution inside the Landmarks PDF, which was exported ' +
      'at 72ppi, so re-exporting cannot help. Needs StudioSC source renders or a re-render.',
  },
  {
    label: 'First Floor',
    src: '/renders/source/ENT-003-000.jpeg',
    alt: 'The entrance foyer, with a curved plaster wall, upholstered bench and oak library shelving beyond.',
  },
  {
    label: 'Second Floor',
    src: '/renders/source/INT-008-009.jpeg',
    alt: 'The kitchen in rift oak, with green-veined marble counters and the terrace beyond.',
  },
  {
    label: 'Third Floor',
    src: '/renders/source/INT-020-033.jpeg',
    alt: 'The primary bathroom, in oak, stone and mosaic tile.',
  },
  {
    label: 'Fourth Floor & Roof',
    src: '/slides/04-fourth-floor.jpg',
    alt: 'A bathroom in oak, stone and mosaic tile.',
    placeholder: 'PLACEHOLDER — no roof-terrace render exists. Blocked on StudioSC.',
  },
  {
    label: 'Contact',
    placeholder: 'The card and its clip-path reveal are Phase 3. Phase 1 lands on the ground colour.',
  },
];
