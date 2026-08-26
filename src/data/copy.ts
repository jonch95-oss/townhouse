/**
 * Every word in the experience. Source: docs/source/COPY.md.
 *
 * Rooms slides carry no copy at all, which is deliberate.
 *
 * TK marks a fact nobody has. They render as a loud inline marker that is
 * impossible to miss in review, and `npm run check:tk` fails while any remain.
 * Do not estimate one. Do not let one ship.
 *
 * Identity: 221–223 Waverly Avenue — two separate, mirror-image townhouses.
 * No elevator.
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
      'Two new townhouses on a landmarked street in Clinton Hill. Four floors each, built in brick and terracotta, designed to belong where they stand.',
    primary: 'Enter',
    secondary: 'Enter without sound',
    holdHint: 'Or hold anywhere',
  },

  hero: {
    eyebrow: '221–223 Waverly Avenue · Brooklyn',
    headline: ['Built For', 'This Street'],
    paragraph:
      'A pair of new four-storey townhouses in the Clinton Hill Historic District, drawn to sit among their nineteenth-century neighbours rather than against them.',
    pricePrefix: 'Each offered at',
    price: TK('price'),
  },

  /** Slides 1–3 carry nothing. Deliberate, and not an omission. */
  rooms: null,

  contact: {
    eyebrow: 'Contact',
    headline: ['COME', 'AND', 'SEE'],
    subtitle:
      'The houses are not yet built. To arrange a viewing of the plans, get in touch.',
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
    title: ['Where Light', 'Finds Brick'],
    body: [
      '221 and 223 Waverly Avenue are two separate four-storey townhouses on a landmarked block in Clinton Hill — designed by StudioSC as mirror images, and approved by the Landmarks Preservation Commission in December 2024. They were drawn not to stand apart from their nineteenth-century neighbours, but to take a natural place among them: brick and terracotta outside, quiet rooms within.',
      'Each facade borrows its rhythm from the ornament at 185 and 226 Waverly — Glen Gery brick and terra-toned cladding, a sculpted profile, walnut at the door, a round window catching the afternoon. Inside, the mood is warmer still: limewashed plaster, pale oak millwork and green-veined marble, light held softly from floor to floor.',
      'Life moves outward as easily as inward. A foyer and library give way to an inner courtyard; the kitchen and dining room open to a rear yard; two private terraces and a roof terrace look out across the district. Four storeys each, two houses — room to live without crowding the street that holds them.',
    ],
    figure: {
      image: 'panel/overview-axon',
      alt: 'Axonometric view of 221 and 223 Waverly Avenue — two mirror-image brick townhouses with terraces, rear yards and material swatches for limestone courtyard walls, wood screening and walnut entrance doors.',
      caption: '221 and 223 — two houses, one street presence.',
    },
    highlightsLabel: 'Highlights — each house',
    highlights: [
      'Four storeys and a private roof terrace',
      'Ground-floor foyer, library and inner courtyard',
      'Kitchen and dining opening to the rear yard',
      'Full-floor primary suite with dressing room and double-aspect bathroom',
      ['Two private terraces and ', TK('roof terrace sq ft'), ' of roof terrace'],
      'Landmarks-approved terracotta-and-brick facade',
      [TK('bedroom count'), ' bedrooms, ', TK('bathroom count'), ' bathrooms'],
      [TK('interior sq ft'), ' interior'],
    ],
    stats: [
      ['Interior Sq Ft (each)', TK('interior sq ft')],
      ['Exterior Sq Ft (each)', TK('exterior sq ft')],
      ['Bedrooms / Bathrooms (each)', TK('bed/bath count')],
      ['Floors', '4 + roof'],
      ['Houses', '2 · 221 & 223'],
      ['District', 'Clinton Hill Historic'],
    ],
  },

  credits: {
    heading: ['The people who', 'made these houses'],
    entries: [
      ['StudioSC', 'Architecture'],
      [TK('developer name'), 'Developer'],
      ['M C Structural Engineering', 'Structural'],
      ['All City Engineering', 'Mechanical'],
      ['BMB Building Consultants', 'DOB consultant'],
      ['Arulo — Deep House (Mixkit)', 'Music'],
    ],
  },
} as const;
