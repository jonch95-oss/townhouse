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

Some of this is now resolved. What remains is not a CSS problem.

### Resolved: floors 1–3 are on real renders

27 renders were extracted from the StudioSC decks at full embedded resolution and are
committed under `public/renders/source/` with provenance in the README there. Three slides
are wired to them, at or near the 2440px target the reference uses:

| Slide | Render | Resolution |
|---|---|---|
| 1st floor | `ENT-003-000` — entrance / foyer / library | 2400 × 1350 |
| 2nd floor | `INT-008-009` — kitchen, terrace beyond | 2400 × 1350 |
| 3rd floor | `INT-020-033` — primary bathroom | 3200 × 1800 |
| intro gate | `INT-022-034` — powder room | 1440 × 1762 |

The gate image is deliberately a room that **does not show the building**, so the gate no
longer spends the reveal the entrance sequence and hero are meant to pay off. The gate
component itself is Phase 4; the asset is wired in `src/data/slides.ts` as `gateImage` so
it is not lost.

Gallery sets for floors 1–3 are recorded in the same file as `galleries`. They are not
wired because no lightbox exists yet — there is nothing to stub.

### Sharper, and worse than previously recorded: the hero

735 × 633 **is** the resolution of the image inside the Landmarks PDF, which was exported
at 72ppi. Re-exporting the PDF at any DPI cannot recover detail that is not in the file.

This was previously written up as though a better export would help. It will not. The fix
is **StudioSC's source render, or a re-render** — an email, not a build step. It is the
single longest-lead item in the project and nothing in this repo can shorten it.

### Still blocked

| What | Status |
|---|---|
| **Hero / exterior** | No usable asset. See above. |
| **4th floor / roof terrace** | Never rendered. A bathroom stands in, marked `PLACEHOLDER` in `src/data/slides.ts`. |
| **Menu panel image** | The Phase 3 menu takes a portrait image at `aspect-ratio: .75` above 1100px. Nothing suitable exists. |
| **Every portrait frame** | **No separately framed portrait asset exists for any slide.** This blocks the mobile-hero decision. |

**Do not generate portrait frames by cropping the landscapes.** `spec/REBUILD.md` §4 is
explicit that the reference shoots them separately, and that is precisely why its phone
experience can carry zero words. A centre-crop would let the mobile-hero decision be
closed on false evidence — the same failure mode as measuring type against a fallback
font, which already cost this project a round.

### Chrome legibility is an art-direction dependency, not a styling backlog

Measured against the real renders, white chrome fails on two of the three interiors. The
numbers and the recommendation are in `docs/review/` and were reported separately; the
short version is that **no single chrome colour clears all three slides**, because the
renders are high-key on average but contain dark regions exactly where some chrome sits.
Switching chrome to the warm neutral inverts which slides fail rather than fixing them.

This resolves when the renders are regraded or replaced. The requirement to hand to
whoever does that: **a darkened band at the right edge and along the bottom**, which is
what the reference art-directs and why its identical chrome survives.

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

### Required for Phase 4: the gate needs a height-aware rule

**This is not a consequence of choosing 8rem — it is true at every size in the band, and
it is the reason the gate cannot simply be built to the width table.**

On short landscape viewports the gate composition (three-line headline, paragraph, button,
and the secondary link pinned at `bottom: 4rem`) does not fit vertically. Measured against
the mock:

| Viewport | 8rem | 6.5rem |
|---|---|---|
| 650 × 400 | button overlaps the link by 14px; 33px of air above a 67px line | no overlap, but 52px of air above a 55px line |
| 844 × 390 — phone landscape | overlaps by 19px | **still overlaps**, 0px clearance |
| 926 × 428 — phone landscape | 0px clearance | clears, 19px |

Reverting to 6.5rem does not solve this; it only moves which viewports fail. The cause is
the viewport height, not the type size.

The reference solves it and the mechanism is already in the spec: `spec/tokens.md` §6
documents aspect-ratio queries stepping the intro headline down on short, wide windows
(`aspect-tight`), and `spec/responsive.md` §2 lists
`(orientation: landscape) and (max-width: 1099px)` as a dedicated phone-landscape query.
Build the gate with a height or aspect-ratio guard from the start rather than discovering
this again.

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
