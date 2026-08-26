# 223 Waverly Avenue — handoff

Written for someone picking this up cold. It assumes no prior context.

---

## What this is

A single-property marketing microsite for **223 Waverly Avenue, Brooklyn NY 11205** — a
new four-storey townhouse in the Clinton Hill Historic District, architecture by StudioSC.
The site's job is to show the house and produce enquiries. One page, six full-screen
slides, no scrollbar.

It is modelled on a reference site, **quadplex80.com** (a single-property microsite for a
penthouse at 111 West 57th Street). `spec/` holds a forensic teardown of that site:
motion timings, design tokens, section-by-section layout, stack, asset manifest,
responsive behaviour, screenshots at five breakpoints and the decoded CMS payload.

**`spec/` is a specification, not code to copy.** No imagery, copy or branding from the
reference ships here. `spec/NOTICE.md` states the terms. The copy in `src/data/copy.ts`
was written for this building and takes nothing from `spec/sections.md`'s verbatim
quotes, which are another building's words about another building.

The build order and the reasoning behind each phase are in **`spec/REBUILD.md` §2**. Read
that before adding anything.

---

## What is built

### Phase 1 — the fluid root and the slide machine

- **The fluid root.** `1rem` = 10px at the design width, scaling with the viewport,
  capped at 12px and floored at 8px. Design widths are 390 / 834 / 1500. Everything
  downstream is in `rem`, so the page scales as a single object and there is not one
  font-size media query in the codebase.
- **The slide machine** (`src/lib/slides.ts`). Five full-screen slides — hero, three
  rooms, contact. See "Rooms, not floors" below for why it is rooms. `body { overflow: hidden }`, document exactly one viewport tall.
  `wheel`, `touchstart`/`touchmove` and `keydown` are captured and normalised, then gated
  through a vendored `Lethargy(8, 50)` plus a 50ms debounce so trackpad inertia cannot
  skip ahead. One gesture advances exactly one slide, input locks for the whole
  transition, and the clamp at both ends is hard — no wrap, no rubber-band.
- **Timings**, measured in Chromium rather than estimated: **2750ms** leaving the hero
  (0.5s hold + 2.25s tween), **1516ms** every transition after.
- **Plain `<img>` crossfades.** `SlideRenderer` in `src/lib/renderer.ts` is the seam a
  shader drops into later; `slides.ts` does not change when it does.

### Phase 2 — type, reveals and chrome

- **One reveal**, registered as a GSAP effect (`src/lib/reveal.ts`): masked lines from
  `yPercent: 100`, 1.5s, 0.1 stagger, on the `unmask` CustomEase. Everything on the site
  reveals this way. Splitting is by line, never by character.
- **Hero copy** on the reference's entrance timeline — four elements 0.35s apart, each
  1.5s, overlapping so they read as one gesture. Eyebrow and paragraph settle at
  `alpha: 0.7`, not 1.
- **Pip rail**, menu toggle, section-label box, looping "Scroll to explore" hint.
- **`.uline` / `.uline-double`** underlines.
- **Copy** for the whole experience — 78 words, zero on the room slides.

### What is not built

| | Status |
|---|---|
| **Phase 3** — menu overlay, lightbox | **Built.** |
| Panels — overview, credits, legal, floorplans | **Built.** One `Panel` component, four bodies. |
| Image pipeline | **Built.** `npm run images`. |
| Intro gate component | Not started. |
| Lead capture | **Out of scope**, by instruction. The privacy policy is blocked behind it. |
| **Phase 4** — transition shader | **Built, and off.** See below. |
| **Phase 4** — clamped orbit | Not started. It needs a glTF model that does not exist. |
| Intro gate / preloader | Not started. The type rule (`.intro__title`) and the image (`gateImage`) exist; no gate component does. |
| 4th-floor and roof slides | **Out of scope**, by instruction — and no render exists of either. |

**On WebGL**, `spec/REBUILD.md` §3 splits it into three layers with a separate
build/don't-build call on each.

- **The transition shader is built and is OFF.** Enable it with `?shader=1`. It implements
  the same `SlideRenderer` interface as the crossfade, so the slide machine drives it with
  exactly the timeline that drives the crossfade — same `snappy` ease, same 1.5s and 2.25s.
  It is deliberately **not tuned**: four of seven screens are still placeholders, and
  tuning a wipe against stand-in imagery is wasted work. The crossfade is the shipping
  path. Vite code-splits it, so the 466 KB chunk is not fetched unless the flag is set.
- **The clamped orbit is not built.** It needs a glTF model of the building that does not
  exist. `spec/motion-spec.md` §7.1 has the full specification for when one does.
- **The procedural sky should not be built.** It does not transfer to a Brooklyn
  townhouse; see `spec/REBUILD.md` §3.

---

## Where we deliberately diverged from the reference

Each of these is a considered departure, not an oversight. If you are tempted to "fix"
one back toward the spec, read the reason first.

### 1. An 8px floor on the fluid root

`spec/responsive.md` §1 measures the reference at a **6.83px root on a 1024-wide laptop** —
smaller type and a tighter gutter than a phone gets at 10px — because the rule divides by
a fixed 1500 design width at every landscape size.

We add `--rem-floor: 8px` to the clamp. It binds below 1200px and hands over to the fluid
rule exactly at 1200, where `10 × 1200 / 1500` is also 8, so there is no discontinuity
(measured: largest step across the handoff is **0.027px**).

A second `--size` step was the alternative and cannot be made continuous — two curves of
the form `10w/size` meet only where the sizes are equal, so any boundary puts a visible
jump in the type.

**Consequence:** four of the five breakpoints in `spec/responsive.md` §1 match exactly;
1024 reads 8.00px where the reference reads 6.83px. That is the intended difference.

### 2. The mobile hero keeps its copy

`spec/responsive.md` §3 documents that the reference renders **no hero copy at all below
650px** — the component is gated on `!small`, so eyebrow, headline, paragraph and price
are never in the DOM. Price included. It is the most radical decision on that site.

We render the copy at 390 instead, because their silence is carried by a separately shot
**786 × 1364 portrait asset per floor**. Ours is a 735 × 633 landscape crop from the
Landmarks deck, centre-cropped to portrait. Theirs earns silence; ours would be a soft
photograph of a building with no name on it and no price.

**Revisit when art-directed portrait renderings exist per floor at ~786 × 1364 or
better.** Not when renderings arrive generally — when the portrait ones do.

The rest of §3 is applied: pip rail absent below 650, section-label index and rule hidden,
bar full width.

### 3. Scrims, not a blend mode

An earlier pass used `mix-blend-mode: difference` to keep white chrome legible over a
blown-out sky. That is gone. Difference blending inverts warm hues toward cyan, which
fights the sampled palette, and it does so worst over exactly the bright areas it is
compensating for.

Legibility is handled by scrims at the spec values — 17rem at 0–30% desktop, 40rem at
0–60% mobile. A `.u-difference` utility remains in `chrome.css`, available and unused.

### 4. The top vignette runs on every slide

The reference applies its 25% black top/bottom vignette only to the interior slides
(`spec/tokens.md` §2). We run the top vignette on all of them, because our top-left chrome
sits over imagery nobody has art-directed yet.

### 5. Intro headline sizing

`spec/tokens.md` §3 gives the intro headline 5rem mobile / 8rem tablet portrait / 10rem
desktop at `.375em` tracking. That works for a reference whose longest word is `CLOUDS`,
at six characters. Ours is `TERRACOTTA`, at ten.

- **Below 650:** 4rem / `.2em`.
- **650–1100, both orientations:** 6.5rem / `.375em`. The spec steps 8rem here and only
  for portrait, which leaves landscape on the 10rem rule while the root is pinned to the
  floor — 822px of type into 618px of space at 650.
- **Above 1100:** 10rem / `.375em`, as specified.

The wide `.375em` tracking is kept everywhere above 650 on purpose: it is what makes the
gate read as a threshold rather than a heading. Only the sub-650 override gives it up.

### 6. Two things the reference gets wrong, fixed here

- **`prefers-reduced-motion` is honoured.** The reference evaluates the query on boot,
  stores it, and never reads it again (`spec/motion-spec.md` §11); there is no
  reduced-motion CSS in its 31.9 KB. Here it collapses every reveal duration and stagger,
  hard-cuts slide transitions, and stops the looping hint from ever starting.
- **The keyboard works.** Arrow keys, Page Up/Down and Space drive the slide machine, and
  are ignored while a text field has focus. There is also a `<noscript>` block, where the
  reference's page is empty without JS.

---

## Rooms, not floors — a factual correction

**The slides are organised by room, and that is a correction, not a preference.**

An earlier pass placed the kitchen on the second floor. The filed plan sheets (GC set
A-100.01 / A-101.01) say otherwise:

```
1st floor  foyer · library · courtyard · hallway · KITCHEN · DINING ROOM · bath
2nd floor  bedroom 1 · bath · hallway · living room · terrace (93.32 sf)
3rd floor  primary bedroom · primary bathroom · W.I.C. · dressing room · terrace
4th floor  bedroom · bath · hallway · terrace · mechanical
roof       two roof terraces (164.38 sf, 220.97 sf) · vestibule · mechanical
```

The kitchen is on the ground floor. Anything labelled "2nd floor kitchen" was wrong about
a real building, which is a different class of error from a copy tweak.

Organising the deck by floor would need imagery for four floors. Renders exist for three
rooms, and two of those share the first floor. So the slides are rooms:

| # | Label | Image | Actually on |
|---|---|---|---|
| 0 | Home | `landscape/00-hero` | the street |
| 1 | Entrance & Library | `landscape/01-first-floor` | 1st floor |
| 2 | Living | `landscape/02-second-floor` | 1st floor — kitchen and dining |
| 3 | Primary Suite | `landscape/03-third-floor` | 3rd floor |
| 4 | Contact | — | — |

Every slide has a real image and a truthful label, and no slide claims a floor it is not
on. **The image *filenames* still carry the old floor numbering** — renaming 28 source
files and their 300-odd generated variants to fix a name nobody sees was not worth the
churn, but it is a trap for the next person and it is why this table exists.

Floor labels live in the floorplans panel, where the plan itself is the evidence.

**No render exists** of the 2nd-floor living room, the 4th floor, or the roof terraces.

---

## The image pipeline

`npm run images` runs `scripts/build-images.mjs` over `public/renders/`, writing variants
to `public/img/` and a manifest to `src/data/images.generated.ts`. Neither is edited by
hand.

Per source it emits AVIF (q50), WebP (q72) and JPEG (q76, mozjpeg) at a width ladder that
depends on the kind — landscape `640…2440`, portrait `390…1080`, gallery `640…1600`,
floorplan `1024…2400`, panel `512/1012` — plus a base64 LQIP and a dominant colour.

28 images, 10.8 MB of sources, 12.1 MB of variants.

`src/lib/picture.ts` builds the `<picture>`: AVIF then WebP then JPEG, width-based
`srcset` with an honest `sizes`, narrow `(max-width: 649px)` sources first. The wrapper is
painted with the dominant colour and the LQIP before anything arrives, which is why there
is no white flash between slides. The reference gets both free from its CDN; ours are
generated at build time.

**Transfer weight, first paint:**

| | before | after |
|---|---:|---:|
| desktop 1440 | 2264 KB | **176 KB** |
| mobile 390 | 866 KB | **53 KB** |

Both all-AVIF. 92% and 94%.

**`public/img/` is committed.** It is derived, which normally argues against it, but the
sources in `public/renders/` are already tracked and `npm run build` does not run the
pipeline — so committing the variants is what makes a deploy reproducible without sharp
in the build environment. Run `npm run images` after touching anything in
`public/renders/` and commit both the variants and the manifest.

**`resolveImage()` in `picture.ts` is load-bearing.** Manifest keys carry their source
directory (`landscape/00-hero`) while the slide manifest names bare keys (`00-hero`).
Everything that reads the manifest must go through that resolver. The shader did not, and
rendered a black canvas — a full-screen quad with no texture bound looks exactly like a
canvas that failed to initialise, so the bug reads as WebGL trouble and is not.

---

## The panels

One component (`src/ui/panel.ts`) built on `Overlay`, four bodies (`src/ui/panels.ts`):
**Overview** behind the section-label `[+]`, **Floorplans** from the menu, **Credits** and
**Legal** from the menu footer. They inherit the keyboard contract below — Escape, focus
trap, no key leakage to the slide machine — because they are `Overlay`s.

### Floorplans is a known quality gap

The five sheets are **construction drawings from the filed GC set, not marketing plans**.
Dimension strings, north arrows, wall-assembly callouts, zoning notes and sheet
annotations are all present, because they are on the drawing. They are legible and they
are honest, and against the rest of the site they look like what they are: a contractor's
document in a room designed for photographs.

The panel says so in its own first line rather than hoping nobody notices. The fix is
redrawn marketing plans from StudioSC — a simplified single-line plan per floor, room
names and areas only, no dimension strings. That is a drafting commission, not a code
change.

### Legal is drafted and gated

`src/data/legal.ts` holds five drafts: disclaimer, standardized operating procedures, fair
housing, privacy, terms. **`LEGAL_REVIEWED` is `false`**, and while it is false the panel
opens with an unmissable notice that none of it has been through counsel, and each
document shows its own status line.

Nobody here is a lawyer and this is a regulated transaction. Three of the five contain
statements of fact about the business that cannot be known from the drawings and must not
be invented — they are `TK`, and they are the reason a professional pass is needed rather
than a proofread.

The **disclaimer** is the urgent one, and not because it is the longest. The building does
not exist and every image on the site is a rendering; the gap between what a visitor sees
and what exists is the largest exposure on the site. Counsel also needs to answer whether
this offering triggers New York offering-plan requirements (GBL Article 23-A). A
single-family house sold whole generally does not, but that determination is not ours.

The **privacy policy is blocked behind the lead capture**, which is out of scope by
instruction: the policy has to describe what the site actually collects and who receives
it, and that is not decided. Worth noting the cheap option — with no form, no analytics
and no cookies, just a `mailto:`, the compliance surface is nearly nil. The reference
loads GTM and a cookie banner. Nothing obliges us to.

Also outstanding, and not a legal question: **check the StudioSC agreement covers
marketing use of the renderings and drawings** before publishing. Everything on the site
came out of their PDFs.

### `TK` is a launch gate, not a convention

`scripts/check-tk.mjs` exits non-zero while any `TK` remains. Run it before any deploy.
`TK`s render on the page in `#ff0055` — a colour deliberately outside the palette, so a
missed one is impossible to mistake for a design decision in a screenshot.

**16 markers, 11 distinct facts:** price · interior sq ft (×2) · exterior sq ft · bedroom
count · bathroom count · bed/bath count · roof terrace sq ft · developer name · email ·
phone (×2) · **production origin** (×4).

The last one is not copy. `og:url`, `og:image` and `canonical` need an absolute origin and
no domain has been supplied, so `index.html` carries the literal `TK-ORIGIN` and the gate
covers it. Inventing a plausible domain would put a URL that resolves to somebody else's
site into every Slack and iMessage preview of this page.

Every other one is a fact about a real property or a real business. Supply them from the
client or the drawings. **Do not estimate.**

---

## `src/lib/overlay.ts` — the keyboard contract

Both the menu and the lightbox are built on it. It was written in Phase 2 with nothing
importing it, precisely so neither could be built without keyboard support.

`spec/motion-spec.md` §9 calls the reference gallery's total absence of keyboard support
"the clearest defect in an otherwise meticulous build": no Escape, no arrow keys, no focus
trap, and its global arrow-key handler stays live behind the open lightbox, so pressing
ArrowDown inside the gallery quietly drives the slide machine underneath.

`Overlay` provides Escape, arrow paging and a focus trap that wraps at both ends, and it
listens in the **capture phase** so those keys never reach the slide machine. It is
verified by `scripts/verify-overlay.mjs`, including that specific defect.

`scripts/verify-phase3.mjs` checks that specific defect on the real lightbox: arrow keys
inside the open gallery page the gallery and leave the slide machine where it was.

Anything else full-screen — the floor panel, the intro gate — goes through it too.

---

## Blocked on assets

Some of this is now resolved. What remains is not a CSS problem.

### Every slide has both frames

`public/renders/slides/` holds a landscape and a portrait frame for each slide, plus the
3:4 menu panel. `public/renders/gallery/` holds the twelve gallery images.
`public/renders/source/` is the provenance archive — 26 renders at full embedded
resolution from the StudioSC decks, kept so any future crop or regrade starts from source
rather than from something already resampled.

| Slide | Landscape | Portrait |
|---|---|---|
| hero | 2440 × 1626 | 824 × 1430 |
| Entrance & Library | 2400 × 1350 | 777 × 1350 |
| Living | 2400 × 1350 | 777 × 1350 |
| Primary Suite | 3200 × 1800 | 1037 × 1800 |
| intro gate | 1440 × 1762 | 1015 × 1762 |
| menu panel | 1012 × 1350 (3:4) | — |

The slides use `<picture>` with a `(max-width: 649px)` source, so a narrow viewport fetches
the portrait frame and never the landscape one.

### The portrait frames are crops, and that is deliberate

**They are not separately framed photography.** An earlier version of this document said
portrait frames must never be manufactured from landscape renders — that rule assumed a
shoot was possible. It is not, and there is no third party to commission one from, so a
considered crop is the only path and the honest one.

The crops are chosen per image rather than centred: Living keeps the island and the yard
doors, the Primary Suite keeps the tub centred between its windows, and the hero sits
entirely above the street furniture.

**This does not reopen the mobile-hero decision.** The reference renders no hero copy at
all below 650px, and that silence is carried by frames shot for the purpose. A crop of a
landscape render is not the same asset and does not license the same restraint. The copy
stays on mobile until frames exist that were composed as portraits.

### Chrome polarity is a property of each image

**This supersedes an instruction to switch chrome by slide range**, and the reason is
worth keeping. The brief was "chrome goes dark on interior slides 1–4". Measured, that
fails: `INT-008-009` — the kitchen, which is on the *ground* floor — is a light image
overall but **dark exactly where the pip rail sits**, so warm ink measures 1.13:1 over it where white
measures 5.60:1. A range rule fixes the pale images and breaks that one.

Polarity is therefore declared per image as `chrome: 'light' | 'dark'` in
`src/data/slides.ts`. It belongs to the picture, not to the slide index.

The same reasoning applies to the scrims, which invert with the ink. A black scrim under
dark ink darkens exactly the ground the ink needs. **The reference only ever needed one
polarity because its photography is uniformly dark at the edges; ours is not**, which is
the whole reason any of this is a decision here and not there.

Floating chrome also carries a halo in the opposite value, so it does not depend entirely
on what is behind it.

### The measured matrix

`scripts/verify-chrome-contrast.mjs` screenshots the composited page and reads pixels
rather than modelling the stack — an earlier version modelled image-plus-scrim and
silently ignored both the inverted scrim and the halo.

| Slide | ink | menu toggle | pip rail | scroll hint | section label |
|---|---|---:|---:|---:|---:|
| hero | white | 4.90:1 | 5.14:1 | 3.73:1 | 6.12:1 |
| Entrance & Library | warm | **2.38:1** | 4.61:1 | **1.71:1** | 6.12:1 |
| Living | white | 4.00:1 | 5.93:1 | 5.12:1 | 6.12:1 |
| Primary Suite | warm | **2.86:1** | **2.56:1** | **1.34:1** | 6.12:1 |

11 of 16 marks clear 3:1 against their own ground. The section-label figure is 6.12:1 on
every slide because that mark sits in a solid white card — it is the one piece of chrome
that does not depend on the picture, which is exactly why it is the one that never fails.

**The metric changed this pass and the numbers are not comparable to the previous table.**
The analysis half of the suite had been living in a scratch file that did not survive; it
is now inside `verify-chrome-contrast.mjs` and committed. Two attempts were needed:
ordering pixels by distance-from-ink misreads sparse ink — a four-character label in a
wide box reported 1.00:1, because the nearest tenth of its pixels are still white card.
What it measures now is the **median ground of the clip** against the **median of the
pixels that depart from that ground towards the declared ink**. Both halves of that
condition matter: distance alone picks up a bright window in the photograph behind a warm
ring and calls it the ring.

**Five marks are below 3:1, all warm ink on the two interior slides, and none of them is a
code fix:**

- **The pip rail on the Primary Suite fails both polarities** — 2.56:1 warm, and white is
  no better — because the image is mid-tone exactly where the rail sits. Every other
  position on every other slide clears one of the two. This is a regrade. The requirement
  to hand whoever does it: a darkened band at the right edge.
- **The scroll hint is the worst of them** (1.71:1 and 1.34:1) and it is a *placement*
  problem rather than a grading one. It sits bottom-centre, which on the Entrance slide is
  busy terracotta floor tile — warm ink on warm tile at similar value, and the halo has
  nothing to separate against. The hint also persists on every slide, not just the hero.
  Showing it only on the hero would delete both failures and arguably reads better anyway;
  that is a behaviour change and was not in scope for this pass, so it is written down
  rather than done.

The halo (`--chrome-halo`, inverted with the ink) and the inverted scrims are already
doing the work they can. Both failures are the picture, not the CSS.

## Copy status

All copy lives in `src/data/copy.ts`, wired from `docs/source/COPY.md`. **78 words** across
the whole experience — the reference runs about 90 — with **zero on the room slides**. That
restraint is the design, not a flourish on top of it (`spec/sections.md`, "The word
count"). Room labels live in the menu and the section-label box, never over the
photograph.

| | Status |
|---|---|
| Hero headline — `Built For / This Street` | **Chosen.** |
| Contact headline — `COME / AND / SEE` | **Chosen.** |
| Intro headline — `TERRACOTTA / AND / BRICK` | **Chosen.** Both orderings were rendered at 390 first (`docs/review/intro-390-a-brick-first.png` and `-b-terracotta-first.png`); (b) won. At 10, 3 and 5 characters the stack narrows as it descends and resolves on a hard monosyllable, where the reverse keeps opening. It also matches the order the Landmarks deck lists the materials in. |
| Paragraphs | **Draft.** Written to the word budget and factually grounded, but not signed off. |
| Menu | Six entries against five slides: Home, Entrance & Library, Living, Primary Suite, Floorplans, Contact. Floorplans has no slide — it opens the floorplans panel. |
| Facts marked `TK` | Eleven, listed under "`TK` is a launch gate" above. They render visibly on purpose, and `npm run check:tk` fails while any remain. |

Everything longer — the overview, the credits, the Landmarks story — lives behind the
menu, where a serious buyer will find it. That is now built.

**Do not adapt the quotes in `spec/sections.md`.** They are another building's words and
using them, even reworded, will read as borrowed.

### On the facts

`docs/PROJECT-FACTS.md` records everything extracted from the four StudioSC PDFs with the
sheet each figure came from. Two cautions carried in it:

- The **~3,907 SF** figure is *gross* and *above grade only*. It excludes the cellar and
  is not a number any listing should use.
- The LPC set (Dec 2024) shows a **private elevator** at every level and a cellar with a
  gym and wine room. The later GC amendment (Aug 2025) stamps the elevator detail sheet
  "OMIT FROM DESIGN". That most likely means the sheet left that filing rather than the
  elevator leaving the building, but it is a headline feature and needs confirming with
  StudioSC before it appears in marketing copy.

---

## Fonts

**Self-hosted. Three woff2 files, 65 KB, committed under `src/styles/fonts/` and
fingerprinted by Vite. Zero external font requests** — verified: loading the page issues
no request to any host but localhost.

This matches what the reference does (three files, 95 KB, self-hosted, no font CDN —
`spec/assets.md` §6) and is the right call regardless: nothing third-party on the critical
path, and no FOUT that depends on someone else's uptime.

The faces are **Instrument Serif** (display) and **Inter Tight** at 400 and 500 (text),
both SIL Open Font License 1.1. They are stand-ins for the licensed faces the design calls
for — Teodor (Pangram Pangram) and Neue Haas Grotesk Text Pro (Monotype). Swapping in the
real files means replacing three `src:` urls in `src/styles/fonts.css` and nothing else;
the family names the rest of the codebase uses are declared there.

### Decided: the intro headline ladder is 4 / 8 / 10

The two size overrides were originally chosen while the webfonts were failing to load in
the development sandbox, so they were measured against a **fallback serif substantially
wider than Instrument Serif**. With the real face self-hosted, `TERRACOTTA` at 390 needs
265px where the fallback needed 341px.

Both overrides are still necessary — the unmodified spec values overflow even in the real
face, by 19.8% at mobile and 8.5% at 650. But the 650–1100 band was re-decided on that
evidence and now sits at **8rem**, not the 6.5rem an earlier pass invented:

| Band | Size / tracking | Tightest margin |
|---|---|---:|
| below 650 | 4rem / `.2em` | 24.2% at 390 |
| 650–1100, both orientations | **8rem** / `.375em` | 13.1% at 650 |
| above 1100 | 10rem / `.375em` | 37.3% at 1101 |

8rem is `spec/tokens.md` §3's own tablet step, so the ladder reads 4 / 8 / 10 against the
reference's 5 / 8 / 10. What we change is its **scope**: the spec applies 8rem to portrait
only, which leaves landscape on the ≥650 rule while the root is pinned to the 8px floor —
10rem is 80px at 650, and `TERRACOTTA` needs 671px into 618px of space. The step is right;
the scope is not.

The reasoning for spending the size rather than the margin: the gate is the one screen
where scale is the whole argument. Three words and a button, with nothing else carrying
it. Under-sizing the threshold costs more than under-sizing anything else on the site.

**On arithmetic versus looking at it.** This decision was reached from a width table, and
a width table cannot see vertical crowding. So the gate was mocked at its real type rules
and real copy and screenshotted before the change was accepted — `docs/review/gate-*.png`.
Portrait confirmed the reasoning: monumental type, comfortable air. Short landscape did
not, and that is recorded as its own requirement below.

### Built: the gate's short-viewport rule

On short landscape viewports the gate stack did not fit vertically — the button ran into
the pinned secondary link and the headline pressed against the top edge. It did that at
every size in the 650–1100 band, so it was a height problem, not a type-size one, and
reverting the headline would have relocated the failure rather than fixed it.

`spec/responsive.md` §2 records the mechanism the reference uses: aspect-ratio queries
stepping type down on short, wide windows without touching the width breakpoints. Aspect
alone is not enough of a discriminator here — an ordinary 1440 × 900 desktop is 1.6 and
would be caught — so it is paired with a height ceiling, which separates a phone in
landscape from a laptop:

```css
@media (min-aspect-ratio: 3/2) and (max-height: 600px) { … }
```

Two things happen: the headline drops a step, and the secondary link comes out of its
pinned position into the flow. The second removes the collision by construction rather
than by leaving just enough room.

`scripts/verify-gate.mjs` checks both the vertical stack and the width fit across six
viewports. The tall cases are unchanged — 64px at 650 × 900, 74px at 768 × 1024, 96px at
1440 × 900.

The layout the rule acts on (`.intro`, `.intro__body`, `.intro__secondary`) is in
`type.css`. The gate **component** is still Phase 4; this is the type and layout it will
use, put in place so the rule could be verified before anything is built on it.

## Verification

Everything is measured rather than asserted. With a build served on :4173:

```bash
npm run preview &
node scripts/verify-root.mjs           # root font-size at all five breakpoints
node scripts/verify-pacing.mjs         # one gesture = one slide, transition timings
node scripts/verify-phase2.mjs         # reveals, chrome, intro headline fit
node scripts/verify-overlay.mjs        # Escape, arrows, focus trap, no key leakage
node scripts/verify-palette.mjs        # three colours, no reference hues
node scripts/verify-reduced-motion.mjs # hard cut, not a scaled tween
node scripts/verify-phase3.mjs         # menu, lightbox, panels, floorplans
node scripts/verify-gate.mjs           # intro gate stack, short viewports
node scripts/verify-shader.mjs         # the flagged shader actually draws
node scripts/verify-chrome-contrast.mjs  # the matrix, from composited pixels
node scripts/measure-weight.mjs        # transfer weight per viewport
npm run check:tk                       # launch gate — fails while a TK remains
```

`verify-overlay.mjs` is the one that wants `npm run dev` on :5173 rather than the preview
build — it imports the module directly. Everything else reads :4173, so **rebuild before
you trust a result**: a stale `dist/` is why the shader suite reported a black canvas for
a fix that was already correct in the source.

Current: root 5/5 (1024 diverges by design), palette 4/4, gate 12/12, pacing 8/8, phase2
32/32, phase3 28/28, overlay 6/6, shader 8/8, reduced-motion pass.

They drive a real browser and read computed styles, so they catch things review does not.
Three problems were found this way that were invisible to inspection: every pip rendering
as a clipped half-diamond (an SVG `transform` attribute compounding with a CSS
`transform-origin`), the mobile display rules being silently undone by source order at
equal specificity, and the webfonts silently failing to load — which had quietly invalidated
every type measurement taken before it was caught.

---

## Resting state

**Built:** the fluid root and slide machine (Phase 1); type, reveals and chrome (Phase 2);
the menu overlay and lightbox (Phase 3); the transition shader, behind a flag and off
(half of Phase 4). Five slides, organised by room, all on real imagery, landscape and
portrait. Overview, credits, legal and floorplans panels. A build-time image pipeline.

**Deliberately out of scope:** the 4th-floor and roof slides and the lead capture, both by
instruction; the procedural sky; the clamped orbit, which needs a glTF model that does not
exist. The gate component is not built.

**Open, and none of it is code:**

1. **11 `TK` facts.** `npm run check:tk` fails while any remain. Price, square footages,
   bed and bath counts, developer name, email, phone — from the client or the drawings, not
   estimated — and the production origin, which is a DNS question rather than a copy one.
2. **Legal needs counsel.** `LEGAL_REVIEWED` is `false`. The disclaimer first; it is nearly
   ready and it is the one with real exposure. The privacy policy is blocked behind the
   lead capture.
3. **Ask StudioSC for marketing floorplans.** What ships is the filed construction set,
   annotations and all.
4. **Check the StudioSC agreement covers marketing use** of the renderings and drawings.
5. **The hero is an upscale** — roughly 4x from a 669 × 633 source. It composites well and
   sits behind type without embarrassment, but it carries no real detail. Needs StudioSC's
   source render or a re-render.
6. **The Primary Suite wants a regrade**, and the scroll hint wants a decision. See "The
   measured matrix".
7. **Confirm the elevator.** The LPC set shows one at every level; the GC amendment stamps
   its detail sheet "OMIT FROM DESIGN". Almost certainly a filing change rather than a
   building change, but it is a headline feature and it is unconfirmed.

**Repository housekeeping, which needs the owner:** the default branch is still
`claude/quadplex80-site-analysis-tl3nl6` and should be `main` (Settings → General), and
four merged branches want deleting — the git proxy here returns 403 on ref deletion.
