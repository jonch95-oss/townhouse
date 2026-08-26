/**
 * Every word in the experience. Source: docs/source/COPY.md.
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

export interface OverviewSection {
  label: string;
  body: readonly string[];
}

export const copy = {
  preloader: 'Loading',

  intro: {
    title: 'THE WAVERLY',
    tagline: 'Historic Brooklyn. Designed for You.',
    location: '221–223 Waverly Avenue · Clinton Hill',
    primary: 'Enter',
    secondary: 'Enter without sound',
    holdHint: 'Or hold anywhere',
  },

  logo: {
    name: 'THE WAVERLY',
    address: '221–223 Waverly Avenue · Clinton Hill',
  },

  hero: {
    eyebrow: '221–223 Waverly Avenue · Brooklyn',
    headline: ['Historic on the Outside.', 'Seductively Modern Within.'],
    paragraph:
      'Two mirror-image four-storey townhouses in the Clinton Hill Historic District — Landmarks approved, StudioSC designed, drawn to belong among their nineteenth-century neighbours.',
    pricePrefix: 'Each offered at',
    price: '$7.2M',
  },

  /** Slides 1–3 carry nothing. The story lives in the overview panel. */
  rooms: null,

  model: {
    hint: 'Drag to explore',
  },

  contact: {
    eyebrow: 'Contact',
    headline: ['Some Homes Are Shown.', 'This One Should Be Experienced.'],
    lead: 'Request a private introduction.',
    disclaimer:
      'Both townhouses are in development, with completion anticipated in Spring 2027. To review the plans in person, please be in touch.',
    phoneLabel: 'Phone',
    phone: '718-702-7500',
    emailLabel: 'Email',
    email: 'info@waverlylth.com',
  },

  menuFooter: {
    credits: 'Credits',
    legal: 'Legal',
    phone: '718-702-7500',
  },

  overview: {
    title: ['Quiet Luxury,', 'Designed for Living'],
    figure: {
      image: 'panel/overview-axon',
      alt: 'Axonometric view of 221 and 223 Waverly Avenue — two mirror-image brick townhouses with terraces, rear yards and material swatches for limestone courtyard walls, wood screening and walnut entrance doors.',
      caption: '221 and 223 — two houses, one street presence.',
    },
    sections: [
      {
        label: '221 & 223 Waverly',
        body: [
          'Two separate four-storey townhouses on a landmarked block in Clinton Hill — mirror images designed by StudioSC and approved by the Landmarks Preservation Commission in December 2024. Each facade borrows its rhythm from the ornament at 185 and 226 Waverly: Glen Gery brick and terra-toned cladding, a sculpted profile, walnut at the door, a round window catching the afternoon.',
          'Four storeys each, two private terraces and a roof terrace, a foyer and library opening to an inner courtyard, kitchen and dining to a rear yard. Historic on the outside. Seductively modern at the heart.',
        ],
      },
      {
        label: 'Interior Design',
        body: [
          'The interiors are conceived as a modern sanctuary — warm, refined, and deeply personal. Every room combines timeless materials with contemporary simplicity: light oak cabinetry, richly veined stone, pale wide-plank floors, fluted glass and carefully integrated lighting.',
          'Clean architectural lines let each material speak. Generous windows draw natural light deep into the plan — a home that feels luxurious without ever feeling overstated.',
        ],
      },
      {
        label: 'A Beautiful Arrival',
        body: [
          'From the moment the door opens, each house welcomes you into quiet sophistication. A foyer of soft natural plaster, pale oak and patterned stone, composed under sculptural light.',
          'A custom library transforms the entrance into more than a passageway — a private salon to pause, read, and feel immediately at home. Curved walls, bespoke millwork, integrated storage and an elegant stair. Mirrors expand the space; warm textures make it calm, sensual, and deeply personal. Not a lobby — the opening chapter of the residence.',
        ],
      },
      {
        label: 'The Kitchen',
        body: [
          'Elegant, inviting, and made for intimate mornings and long evenings. Custom light-oak cabinetry with recessed pulls, fluted-glass uppers and dramatic natural-stone surfaces create a sophisticated yet relaxed atmosphere.',
          'A generous centre island becomes the social heart — cooking, conversation, celebration. High-end appliances disappear into the millwork, preserving the kitchen\'s calm and beautifully composed appearance.',
        ],
      },
      {
        label: 'Private Retreats',
        body: [
          'Each bathroom is designed as a peaceful escape from the city. Oak vanities, stone counters, textured wall tiles, mosaic flooring and softly illuminated mirrors — spa-like, with warmth and character.',
          'The primary bath offers a sculptural freestanding tub, a spacious glass shower, custom millwork and book-matched stone under slanted skylights. Serene in the morning, intimate in the evening. Even the powder room carries its own drama: darker tones, atmospheric light, richly veined stone — a jewel box at the threshold.',
        ],
      },
      {
        label: 'Design Philosophy',
        body: [
          'This is not simply a beautifully finished residence. It is a home shaped around emotion — how light enters a room, how natural materials feel to the touch, and how every space supports the rituals of daily life.',
          'Historic Brooklyn character meets modern refinement, creating interiors that feel distinctive, sensual, and completely at home in one of the city\'s most treasured landmark neighbourhoods.',
        ],
      },
    ] satisfies OverviewSection[],
    highlightsLabel: 'Highlights — each house',
    highlights: [
      'Four storeys and a private roof terrace',
      'Ground-floor foyer, library and inner courtyard',
      'Kitchen and dining opening to the rear yard',
      'Full-floor primary suite with dressing room and double-aspect bathroom',
      'Two private terraces and 385 SF of roof terrace',
      'Landmarks-approved terracotta-and-brick facade',
      '4 bedrooms, 4.5 bathrooms',
      '3,620 SF interior',
    ],
    stats: [
      ['Interior Sq Ft (each)', '3,620'],
      ['Exterior Sq Ft (each)', '479'],
      ['Bedrooms / Bathrooms (each)', '4 / 4.5'],
      ['Floors', '4 + roof'],
      ['Houses', '2 · 221 & 223'],
      ['District', 'Clinton Hill Historic'],
    ],
  },

  credits: {
    heading: ['The people who', 'made these houses'],
    entries: [
      ['Ariel Development Group', 'Developer'],
      ['StudioSC', 'Architecture'],
      ['M C Structural Engineering', 'Structural'],
      ['All City Engineering', 'Mechanical'],
      ['BMB Building Consultants', 'DOB consultant'],
      ['Arulo — Deep House (Mixkit)', 'Music'],
    ],
  },
} as const;
