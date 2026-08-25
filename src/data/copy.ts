/**
 * Every word in the experience.
 *
 * Written for 223 Waverly Avenue from the four StudioSC PDFs. Nothing here is
 * adapted from spec/sections.md — those are another building's words, and the
 * reference is useful as evidence of how little text this format needs, not as
 * a source of phrases.
 *
 * Budget check, excluding the menu panels: 67 words total. The reference runs
 * about 90. The floor slides carry zero, which is the whole discipline.
 *
 * TK markers are facts not yet established. They render visibly on purpose.
 */

export const copy = {
  /** Likely to be dropped — REBUILD.md §3: a preloader with nothing to preload is theatre. */
  preloader: 'Loading',

  /**
   * Intro gate. "BRICK AND TERRACOTTA" is the material palette from p13 of the
   * Landmarks deck, which lists SK1N Terra PG terracotta cladding first and
   * Glen Gery Potenza Raw brick veneer second. Both are true of the building,
   * and p12 cites brick ornamentation at 185 and 226 Waverly as the site
   * "fabric" the design answers to.
   */
  intro: {
    headline: ['BRICK', 'AND', 'TERRACOTTA'],
    paragraph:
      '223 Waverly Avenue is a new house in the Clinton Hill Historic District, in the materials of the street around it.',
    primary: 'Step inside',
    secondary: 'Continue in silence',
  },

  hero: {
    eyebrow: '223 Waverly Avenue',
    headline: ['Built For', 'This Street'],
    paragraph:
      'Four floors and a roof terrace, on a street of nineteenth-century houses in the Clinton Hill Historic District.',
    price: 'TK — price',
  },

  /** Floors 1–4 carry no words at all. This is deliberate and is not an omission. */
  floors: null,

  contact: {
    eyebrow: 'Inquiries',
    headline: ['COME', 'AND', 'SEE'],
    line: 'To arrange a viewing, write or call.',
    emailLabel: 'Email',
    email: 'TK — email',
    phoneLabel: 'Phone',
    phone: 'TK — phone',
  },
} as const;

/**
 * Outstanding facts. Not estimated, not inferred.
 *   - price
 *   - interior square footage as it should be marketed (the ~3,907 SF in the
 *     GC set is gross and above grade only, and excludes the cellar)
 *   - bedroom count and bathroom count as marketed
 *   - completion date
 *   - contact email and phone
 */
export const TK = ['price', 'interior sq ft', 'bed/bath count', 'completion date', 'email', 'phone'] as const;
