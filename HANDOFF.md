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
| **Phase 3** — menu overlay, floor panel, lightbox | Not started. The menu toggle and the section-label `[+]` animate and report state but have nothing to open. |
| **Phase 4** — WebGL | Not started, deliberately. See below. |
| Intro gate / preloader | Not started. The type rule for its headline exists (`.intro__title`) but no gate component does. |

**On WebGL**, `spec/REBUILD.md` §3 splits it into three layers with a separate
build/don't-build call on each. Summarised: the transition shader is worth building; the
orbitable building (a fixed-distance, angle-clamped `OrbitControls` orbit — `spec/motion-spec.md`
§7.1) is worth building and less work than it looks; the procedural sky is not, and does
not transfer to a Brooklyn townhouse. Read that section before spending anything.

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

## `src/lib/overlay.ts` — read this before building Phase 3

**Nothing imports it. That is intentional.**

`spec/motion-spec.md` §9 calls the reference gallery's total absence of keyboard support
"the clearest defect in an otherwise meticulous build": no Escape, no arrow keys, no focus
trap, and its global arrow-key handler stays live behind the open lightbox, so pressing
ArrowDown inside the gallery quietly drives the slide machine underneath.

`Overlay` provides Escape, arrow paging and a focus trap that wraps at both ends, and it
listens in the **capture phase** so those keys never reach the slide machine. It is
verified by `scripts/verify-overlay.mjs`, including that specific defect.

It exists so that the Phase 3 menu overlay and lightbox cannot be built without keyboard
support. Use it.

---

## Blocked on assets

None of these is a CSS problem. They are all waiting on photography.

| What | Status |
|---|---|
| **Hero / exterior rendering** | The only exterior that exists is a **735 × 633** crop from the Landmarks deck (`assets/exterior/`). It is visibly soft upscaled to a 1440px stage. High-resolution originals have been requested from StudioSC. Longest-lead item in the project. |
| **Per-floor portrait renderings** | None exist. Needed at **~786 × 1364** to revisit the mobile-hero decision above. A centre-crop of the landscape frame is not a substitute — the reference art-directs these separately and it shows. |
| **Second floor** | No living-room rendering. The kitchen image currently stands in, and the kitchen is on the *first* floor per the LPC plans. |
| **Third floor** | No bedroom renderings. A bathroom currently stands in. |
| **Fourth floor / roof** | No roof-terrace rendering. The primary bathroom stands in — it is genuinely on this floor. |

Every stand-in is marked with a `placeholder` note in `src/data/slides.ts` explaining
what is actually missing.

**Two open legibility issues are part of this, not separate:**

1. **Chrome over the hero.** White chrome sits on a blown-out sky in the lower right of
   the only exterior image we have.
2. **The pip rail** sits at mid-right, where neither scrim reaches, so white rings vanish
   over a bright sky.

Both were attempted in CSS and both attempts were reverted — a blend mode in the first
case, a radial scrim in the second, which read as a grey panel at 1024 and 390. The
reference has exactly the same exposure and survives it because its imagery is
art-directed dark at the edges. **These resolve when the photography does. Treat them as
blocked on renderings, not as a styling backlog.**

---

## Copy status

All copy lives in `src/data/copy.ts`. 68 words across the whole experience against a
100-word ceiling, with **zero on the floor slides** — that restraint is the design, not a
flourish on top of it (`spec/sections.md`, "The word count").

| | Status |
|---|---|
| Hero headline — `Built For / This Street` | **Chosen.** |
| Contact headline — `COME / AND / SEE` | **Chosen.** |
| Intro headline — `BRICK / AND / TERRACOTTA` | **Chosen, ordering still open.** Two variants rendered at 390 in `docs/review/intro-390-a-brick-first.png` and `-b-terracotta-first.png`. (a) is in the code. |
| Paragraphs | **Draft.** Written to the word budget and factually grounded, but not signed off. |
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

## Fonts — a real caveat

`src/styles/fonts.css` pulls **Instrument Serif** and **Inter Tight** from Google Fonts as
stand-ins. The reference uses Teodor (Pangram Pangram) and Neue Haas Grotesk Text Pro
(Monotype), both licensed, both self-hosted, 95 KB for all typography
(`spec/assets.md` §6).

Two things to know:

1. **Self-host before launch.** It matches the reference, removes a third-party network
   dependency from the critical path, and is one file to change.
2. **The webfonts do not load in the sandbox this was developed in** — the egress proxy
   resets connections to `fonts.googleapis.com`. Everything renders in the fallback serif
   there. **All type measurements and screenshots in `docs/review/` were taken against
   the fallback stack, not the real faces.** The intro headline fit in particular has only
   ~2.5% margin at 390 and must be re-measured once the real faces are in place.
   `scripts/verify-phase2.mjs` re-runs that measurement.

---

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
Two defects were found this way that were invisible at normal zoom: every pip rendering as
a clipped half-diamond (an SVG `transform` attribute compounding with a CSS
`transform-origin`), and the mobile display rules being silently undone by source order at
equal specificity.
