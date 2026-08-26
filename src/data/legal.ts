/**
 * Legal content. Source: docs/source/LEGAL.md.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THESE ARE DRAFTS. They have not been reviewed by counsel.
 *
 * Three of the four contain statements of fact about the business that nobody
 * here can know — brokerage name, operating procedures, retention periods —
 * and those are the whole reason a professional pass is required.
 *
 * `LEGAL_REVIEWED` gates the panel. While it is false the panel says plainly,
 * at the top and on every document, that what follows is a draft. Flip it only
 * when counsel has signed the content off, and expect to replace most of the
 * text when they do.
 * ────────────────────────────────────────────────────────────────────────────
 */
export const LEGAL_REVIEWED = false as boolean;

export interface LegalDoc {
  id: string;
  title: string;
  /** Shown under the title while unreviewed. */
  status: string;
  body: string[];
  /** Facts only the client can supply. Rendered as visible TK markers. */
  missing?: string[];
}

export const legalDocs: LegalDoc[] = [
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    status:
      'Nearly ready. This is the one with real exposure — the building does not exist and every image on this site is a rendering. Send it to counsel first.',
    body: [
      "All images on this site are artist's renderings. 221 and 223 Waverly Avenue are not yet constructed. Renderings, floor plans, dimensions, square footages and finishes are illustrative, are based on plans filed with the New York City Department of Buildings and approved by the Landmarks Preservation Commission, and are subject to change without notice during design development and construction.",
      'Dimensions and square footages are approximate and may vary from as-built conditions. Furniture, fixtures, appliances, landscaping and neighbouring context shown in renderings are for illustration only and are not included unless expressly stated in a contract of sale. No representation is made that the completed buildings will be identical to the images shown.',
    ],
    missing: [
      'Counsel to confirm whether this offering triggers New York offering-plan requirements (GBL Article 23-A / Attorney General filing). Two single-family townhouses sold whole generally do not, but that determination is not ours to make.',
    ],
  },
  {
    id: 'operating-procedures',
    title: 'Standardized Operating Procedures',
    status:
      'Template only. New York requires licensed brokers to publish their ACTUAL procedures. Do not publish this — get the real one from the broker.',
    body: [
      'New York State requires licensed real estate brokers to publish standardized operating procedures for prospective homebuyers and to make them available on the brokerage website.',
    ],
    missing: [
      'brokerage name',
      'whether photo identification is required, at what point, and why',
      'whether an exclusive buyer representation agreement is required before a showing',
      'whether mortgage pre-approval is required, and any circumstances in which a seller may require it',
      'effective date',
    ],
  },
  {
    id: 'fair-housing',
    title: 'Fair Housing',
    status:
      'Paraphrase only. New York publishes a required Fair Housing Notice with prescribed wording — use the official current version, not this.',
    body: [
      'The seller and its agents support the principles of the Fair Housing Act and the Equal Opportunity Act, and do not discriminate on the basis of race, colour, religion, sex, disability, familial status, national origin, sexual orientation, gender identity, age, marital status, military status, lawful source of income, or any other characteristic protected by federal, state or local law.',
    ],
    missing: ['brokerage name', 'the current official New York Fair Housing Notice and disclosure form'],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    status:
      'Blocked. A privacy policy has to describe what the site actually collects and who receives it, and that is not decided yet.',
    body: [
      'This site currently collects nothing. It runs no analytics, sets no cookies, and has no enquiry form — contact is by telephone only.',
      'If that changes, this policy has to change with it before the change ships.',
    ],
    missing: [
      'where enquiries go — an inbox, a CRM, or a third-party form service; each recipient is a disclosure',
      'how long an enquiry is retained',
      'a contact for privacy requests',
      'whether analytics or a consent mechanism will be added — a Brooklyn property is still browsed from the EU, the UK and California',
    ],
  },
  {
    id: 'terms',
    title: 'Terms',
    status: 'Boilerplate, lowest risk of the four, but one item on it is real and commonly missed.',
    body: [
      'Site content and imagery are protected. StudioSC retains rights in the drawings and renderings reproduced here.',
      'Nothing on this site is an offer or a contract, and no warranty is made as to the accuracy of any content. Governing law: New York.',
    ],
    missing: [
      "confirmation that the StudioSC agreement covers marketing use of the renderings and drawings — everything on this site came out of their PDFs",
      'a contact address for legal notices',
    ],
  },
];
