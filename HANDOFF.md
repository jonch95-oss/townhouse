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
- **The slide machine** (`src/lib/slides.ts`). Six full-screen slides — hero, four
  floors, contact. `body { overflow: hidden }`, document exactly one viewport tall.
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
- **Copy** for the whole experience — 68 words, zero on the floor slides.

### What is not built

| | Status |
|---|---|
| **Phase 3** — menu overlay, lightbox | **Built.** The floor panel behind the section-label `[+]` is not. |
| **Phase 4** — transition shader | **Built, and off.** See below. |
| **Phase 4** — clamped orbit | Not started. It needs a glTF model that does not exist. |
| Intro gate / preloader | Not started. The type rule (`.intro__title`) and the image (`gateImage`) exist; no gate component does. |

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
| 1st floor | 2400 × 1350 | 777 × 1350 |
| 2nd floor | 2400 × 1350 | 777 × 1350 |
| 3rd floor | 3200 × 1800 | 1037 × 1800 |
| intro gate | 1440 × 1762 | 1015 × 1762 |
| menu panel | 1012 × 1350 (3:4) | — |

The slides use `<picture>` with a `(max-width: 649px)` source, so a narrow viewport fetches
the portrait frame and never the landscape one.

### The portrait frames are crops, and that is deliberate

**They are not separately framed photography.** An earlier version of this document said
portrait frames must never be manufactured from landscape renders — that rule assumed a
shoot was possible. It is not, and there is no third party to commission one from, so a
considered crop is the only path and the honest one.

The crops are chosen per image rather than centred: the 2nd floor keeps the island and the
terrace doors, the 3rd keeps the tub centred between its windows, and the hero sits
entirely above the street furniture.

**This does not reopen the mobile-hero decision.** The reference renders no hero copy at
all below 650px, and that silence is carried by frames shot for the purpose. A crop of a
landscape render is not the same asset and does not license the same restraint. The copy
stays on mobile until frames exist that were composed as portraits.

### Chrome polarity is a property of each image

**This supersedes an instruction to switch chrome by slide range**, and the reason is
worth keeping. The brief was "chrome goes dark on interior slides 1–4". Measured, that
fails: `INT-008-009` — the second-floor kitchen — is a light image overall but **dark
exactly where the pip rail sits**, so warm ink measures 1.13:1 over it where white
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
| hero | white | 8.35:1 | 5.56:1 | 6.21:1 | 6.12:1 |
| 1st entrance | warm | **2.42:1** | 4.61:1 | 3.61:1 | 6.12:1 |
| 2nd kitchen | white | 4.09:1 | 5.95:1 | 6.27:1 | 6.12:1 |
| 3rd primary bath | warm | **2.99:1** | **2.48:1** | 4.17:1 | 6.12:1 |

The hero passes everywhere on the real frame — the plane-tree foliage across the top is
dark where the toggle and pips sit. On the placeholder it measured 1.53:1 at the pip rail.

**The primary bath fails both polarities** at the pip rail — 2.48:1 warm, 2.58:1 white —
and the two polarities simply trade which of the other positions works. It is left as
shipped. That one is a regrade, not a code fix.

## Copy status

All copy lives in `src/data/copy.ts`. 68 words across the whole experience against a
100-word ceiling, with **zero on the floor slides** — that restraint is the design, not a
flourish on top of it (`spec/sections.md`, "The word count").

| | Status |
|---|---|
| Hero headline — `Built For / This Street` | **Chosen.** |
| Contact headline — `COME / AND / SEE` | **Chosen.** |
| Intro headline — `TERRACOTTA / AND / BRICK` | **Chosen.** Both orderings were rendered at 390 first (`docs/review/intro-390-a-brick-first.png` and `-b-terracotta-first.png`); (b) won. At 10, 3 and 5 characters the stack narrows as it descends and resolves on a hard monosyllable, where the reverse keeps opening. It also matches the order the Landmarks deck lists the materials in. |
| Paragraphs | **Draft.** Written to the word budget and factually grounded, but not signed off. |
| Menu | Six entries against five slides: Home, First, Second, Third, Floorplans, Contact. Floorplans has no slide — it opens the floor panel, which is not built, so the entry is present and inert rather than silently missing. |
| Facts marked `TK` | price, interior square footage as marketed, bed/bath count as marketed, completion date, contact email, contact phone. They render visibly on purpose. See the `TK` export at the bottom of `copy.ts`. |

Everything longer — floor descriptions, specification, credits, the Landmarks story —
is meant to live behind the menu, where a serious buyer will find it. None of it is
written yet.

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
```

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
(half of Phase 4). Five slides, all on real imagery, landscape and portrait.

**Deliberately out of scope:** a fourth-floor slide; the procedural sky; the clamped
orbit, which needs a glTF model that does not exist. The floor panel behind the menu's
Floorplans entry and the `[+]` is not built, and neither is the gate component.

**Two things still open, both about pictures rather than code:**

1. **The hero is an upscale** — roughly 4x from a 669 × 633 source. It composites well and
   sits behind type without embarrassment, but it carries no real detail. Needs StudioSC's
   source render or a re-render.
2. **The primary bath may want a regrade.** Its pip rail fails both chrome polarities
   (2.48:1 warm, 2.58:1 white) because the image is mid-tone exactly where the rail sits.
   Every other position on every other slide clears. The requirement to hand whoever
   regrades: a darkened band at the right edge.

Everything else — price, square footage, bed and bath counts, completion date, contact
details — is marked `TK` in `src/data/copy.ts` and renders visibly on purpose.
