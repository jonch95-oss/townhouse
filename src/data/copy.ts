/**
 * Every word in the experience. Source: docs/source/COPY.md.
 *
 * 78 words across the whole thing, against the reference's ~90. The rooms
 * carry no copy at all, which is the single most transferable decision in the
 * capture and is free.
 *
 * TK marks a fact nobody has. They render as a loud inline marker that is
 * impossible to miss in review, and `npm run check:tk` fails while any remain.
 * Do not estimate one. Do not let one ship.
 */

/** Wrap a missing fact. The renderer turns this into a visible marker. */
export const TK = (what: string) => ({ tk: what }) as const;
export type Tk = ReturnType<typeof TK>;
export const isTk = (v: unknown): v is Tk =>
  typeof v === 'object' && v !== null && 'tk' in v;

export const copy = {
  preloader: 'Loading',

  intro: {
    headline: ['TERRACOTTA', 'AND', 'BRICK'],
    paragraph:
      'A new house on a landmarked street in Clinton Hill. Four floors, built in brick and terracotta, designed to belong where it stands.',
    // "ENTER", not "ENTER EXPERIENCE" — theirs is an experience because it is
    // one. Ours is a house, and the shorter word is less pleased with itself.
    primary: 'Enter',
    secondary: 'Enter without sound',
  },

  hero: {
    eyebrow: '223 Waverly Avenue · Brooklyn',
    headline: ['Built For', 'This Street'],
    paragraph:
      'A new four-storey house in the Clinton Hill Historic District, drawn to sit among its nineteenth-century neighbours rather than against them.',
    pricePrefix: 'Offered at',
    price: TK('price'),
  },

  /** Slides 1–3 carry nothing. Deliberate, and not an omission. */
  rooms: null,

  contact: {
    eyebrow: 'Contact',
    headline: ['COME', 'AND', 'SEE'],
    // This sentence is doing real work: the building does not exist, and
    // saying so plainly where a buyer is about to act is both honest and
    // disarming. It also pairs with the disclaimer in the Legal panel.
    subtitle: 'The house is not yet built. To arrange a viewing of the plans, get in touch.',
    emailLabel: 'Email',
    email: TK('email'),
    phoneLabel: 'Phone',
    phone: TK('phone'),
  },

  menuFooter: {
    credits: 'Credits',
    legal: 'Legal',
    phone: TK('phone'),
  },

  overview: {
    title: ['Clinton Hill,', 'Rebuilt'],
    body: [
      '223 Waverly Avenue is a new four-storey house in the Clinton Hill Historic District, designed by StudioSC and approved by the Landmarks Preservation Commission in December 2024.',
      'The facade is terracotta and brick, drawn from the ornamentation of its neighbours at 185 and 226 Waverly. Inside, four floors open onto two private terraces and a roof with views across the district.',
    ],
    highlightsLabel: 'Highlights',
    highlights: [
      'Four storeys plus a roof terrace',
      'Foyer, library and courtyard at ground level',
      'Kitchen and dining opening to a rear yard',
      'Full-floor primary suite with dressing room and double-aspect bathroom',
      ['Two private terraces plus ', TK('roof terrace sq ft'), ' of roof terrace'],
      'Landmarks-approved terracotta and brick facade',
      [TK('bedroom count'), ' bedrooms, ', TK('bathroom count'), ' bathrooms'],
      [TK('interior sq ft'), ' interior'],
    ],
    stats: [
      ['Interior Sq Ft', TK('interior sq ft')],
      ['Exterior Sq Ft', TK('exterior sq ft')],
      ['Bedrooms / Bathrooms', TK('bed/bath count')],
      ['Floors', '4 + roof'],
      ['District', 'Clinton Hill Historic'],
    ],
  },

  credits: {
    heading: ['The people who', 'made this house'],
    // All five are named on the GC title sheet. Confirm each wants to be
    // credited before this ships — some consultants do not.
    entries: [
      ['StudioSC', 'Architecture'],
      [TK('developer name'), 'Developer'],
      ['M C Structural Engineering', 'Structural'],
      ['All City Engineering', 'Mechanical'],
      ['BMB Building Consultants', 'DOB consultant'],
    ],
  },
} as const;
