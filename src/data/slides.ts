export interface Slide {
  /** Menu label. Deliberately NOT rendered over the image — REBUILD.md §4. */
  label: string;
  src: string;
  alt: string;
  /** Set when the image is a stand-in, so the gap stays visible in review. */
  placeholder?: string;
}

/**
 * Five slides: the hero plus the four floors, per REBUILD.md §4. Contact
 * arrives as slide 5 in a later phase — it has its own clip-path reveal
 * (motion-spec.md §3.3) and does not belong in the pacing test.
 */
export const slides: Slide[] = [
  {
    label: 'Home',
    src: '/slides/00-hero.jpg',
    alt: '221–223 Waverly Avenue seen from the southeast, a pair of sculpted brick townhouses on a Clinton Hill street.',
    placeholder:
      'Low resolution (735×633) — the only exterior we have. High-res originals requested from StudioSC.',
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
      'Kitchen is on the first floor per the LPC plans. No living-room rendering exists yet for the second.',
  },
  {
    label: 'Third Floor',
    src: '/slides/03-third-floor.jpg',
    alt: 'A bathroom in oak, stone and mosaic tile.',
    placeholder: 'Stand-in — no bedroom renderings exist yet for the third floor.',
  },
  {
    label: 'Fourth Floor',
    src: '/slides/04-fourth-floor.jpg',
    alt: 'The primary bathroom, in oak, stone and mosaic tile.',
  },
];
