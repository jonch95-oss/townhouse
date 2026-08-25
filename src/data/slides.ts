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
 * Six slides: the hero, four floors, and contact — the shape sections.md
 * describes, one floor short because the building is four storeys and theirs
 * was four floors of a tower.
 *
 * Every image here is a placeholder pending the real renderings. None of it is
 * reference material: the imagery is StudioSC's own work for this building.
 */
export const slides: Slide[] = [
  {
    label: 'Home',
    src: '/slides/00-hero.jpg',
    alt: '223 Waverly Avenue seen from the southeast — a new brick townhouse on a Clinton Hill street.',
    placeholder:
      'Low resolution (735×633), from the Landmarks deck. High-res original requested from StudioSC.',
  },
  {
    label: 'First Floor',
    src: '/slides/01-first-floor.jpg',
    alt: 'The entrance foyer, with a curved plaster wall, upholstered bench and oak library shelving beyond.',
  },
  {
    label: 'Second Floor',
    src: '/slides/02-second-floor.jpg',
    alt: 'The kitchen, in rift oak with fluted glass uppers and green-veined marble counters.',
    placeholder:
      'Kitchen is on the first floor per the LPC plans; no living-room rendering exists yet for the second.',
  },
  {
    label: 'Third Floor',
    src: '/slides/03-third-floor.jpg',
    alt: 'A bathroom in oak, stone and mosaic tile.',
    placeholder: 'Stand-in — no bedroom renderings exist yet for the third floor.',
  },
  {
    label: 'Fourth Floor & Roof',
    src: '/slides/04-fourth-floor.jpg',
    alt: 'The primary bathroom, in oak, stone and mosaic tile.',
    placeholder: 'Primary bath is on this floor; no roof-terrace rendering exists yet.',
  },
  {
    label: 'Contact',
    placeholder: 'The card and its clip-path reveal are Phase 3. Phase 1 lands on the ground colour.',
  },
];
