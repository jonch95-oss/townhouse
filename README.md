# 223 Waverly Avenue

A single-property microsite for a four-storey new-build townhouse in the Clinton
Hill Historic District, Brooklyn, by StudioSC Architecture.

`docs/capture/` holds a forensic teardown of a reference site, quadplex80.com.
It is a **specification, not code to copy**. The structure, scale and motion
system are modelled on it; the palette is ours and no imagery, copy or branding
from the reference ships here.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve the build on :4173
```

Verification (needs a build served on :4173):

```bash
npm run preview &
node scripts/verify-pacing.mjs          # 8 checks, writes scripts/shots/
node scripts/verify-reduced-motion.mjs
```

## Phase 1 — what is built

The fluid rem root and the slide machine. Per `docs/capture/REBUILD.md` §2, this
ships deliberately without WebGL so the pacing can be judged before anyone
spends a day on the shader.

**The fluid root** (`src/styles/tokens.css`, unmodified from the capture).
`1rem` = 10px at the design width, scaling linearly with the viewport, capped at
12px. Design widths 390 / 834 / 1500. Everything downstream is in `rem`, so the
page scales as one object and there is not a single font-size media query. At
1440px wide the root computes to 9.6px, as it should.

**The palette** (`src/styles/tokens.css`). Re-skinned to three colours, per
`REBUILD.md` §4 "steal the structure, not the hue":

| Token | Value | Note |
|---|---|---|
| `--c-warm` | `#715f47` | Sampled from the StudioSC renderings — the plaster and oak cluster at hue 34–36°, 22–25% saturation. This is that hue, dark enough to set type in: **6.12:1 on white**, where the reference's own gold managed 4.73:1. |
| `--c-white` | `#ffffff` | Ground. |
| `--c-black` | `#000000` | Low alpha only, never solid. |

The reference's slate-blue scrim `#3c6278` is gone — it was chosen to sit under
a sky, reads cold against warm brick, and was a fourth colour in a
three-colour system. The scrim is now black at low alpha.

**The slide machine** (`src/lib/slides.ts`). Six full-screen slides — the hero,
four floors, and contact. `body { overflow: hidden }`, document exactly one
viewport tall, no document scroll. `wheel`, `touchstart`/`touchmove` and
`keydown` are captured and normalised per `motion-spec.md` §1.2, then gated
through `Lethargy(8, 50)` plus a 50ms trailing debounce. One gesture advances
exactly one slide, input is locked for the duration of the transition, and the
clamp at either end is hard: no wrap, no rubber-band.

**Not used, deliberately:** ScrollTrigger, Lenis, Locomotive, Swiper. There is
no scroll to trigger on, and `stack.md` confirms the reference uses none of
them either. GSAP core plus CustomEase is the whole animation dependency.

Measured in Chromium, not estimated:

| Behaviour | Spec | Measured |
|---|---|---|
| Leaving the hero | 0.5s hold + 2.25s tween | **2750ms** |
| Every subsequent transition | 1.5s | **1516ms** |
| One trackpad flick (21 wheel events) | 1 slide | **1 slide** |
| Two overlapping gestures | 1 slide | **1 slide** |
| Wheel past the last slide | no movement | **no movement** |
| Reduced motion | hard cut | **17ms** |

Palette checks (`node scripts/verify-palette.mjs`) confirm `#7c7262` and
`#3c6278` appear nowhere in the served CSS.

## Architecture

```
src/
  lib/
    lethargy.ts        vendored MIT port — the piece most rebuilds miss
    virtual-scroll.ts  wheel/touch/keyboard normalised per motion-spec §1.2
    debounce.ts        50ms trailing edge
    eases.ts           the `snappy` and `unmask` CustomEases
    ticker.ts          one shared GSAP ticker carrying deltaRatio(60)
    renderer.ts        SlideRenderer interface + CrossfadeRenderer
    slides.ts          the machine
  data/slides.ts       the slide manifest
  styles/
    tokens.css         verbatim from the capture — do not edit, override
    fonts.css          free stand-ins for Teodor / Neue Haas
    app.css            stage and layers
```

`SlideRenderer` is the seam. Phase 4 drops in a Three.js implementation of the
same two methods — a hard-edged `step()` wipe with counter-parallax — and
`slides.ts` does not change. The timeline driving `render()` is already final.

## Deliberate departures from the reference

- **Reduced motion is honoured.** Theirs evaluates the media query on boot and
  never reads it again (`motion-spec.md` §11). Transitions collapse to a hard
  cut here.
- **Keyboard works.** Arrow keys, Page Up/Down and Space, ignored while a text
  field has focus.
- **No preloader percentage.** `REBUILD.md` §3 is right that a counter is
  theatre without 6.9MB of textures behind it. We gate on the first two images
  and open.
- **A `<noscript>` block**, so the page is not empty without JS.

## Known gaps, carried forward

1. **All imagery is placeholder**, pulled from the StudioSC decks pending the
   real renderings. `src/data/slides.ts` marks each stand-in with a
   `placeholder` note explaining what is actually missing — there is no
   living-room rendering for the second floor, no bedroom renderings for the
   third, and no roof-terrace rendering at all.
2. **The hero is 735×633.** It is the only exterior rendering in existence and
   it is visibly soft upscaled to a 1440px stage. High-resolution originals have
   been requested from StudioSC — the longest-lead item in the project.
3. **The imagery is not art-directed.** The reference sets its chrome in plain
   white and gets away with it because its images are dark at the edges; our
   hero has a blown-out sky exactly where the counter sits. The scaffolding
   counter uses `mix-blend-mode: difference` to stay legible over any frame
   without adding a fourth colour or the shadow this design system does not
   have. Real slides want a portrait mobile crop and a considered dark edge,
   per `REBUILD.md` §4.
4. **Chrome is scaffolding.** The slide counter and "Scroll" hint stand in for
   the pip rail and slide-down button in Phase 2.
5. **The contact slide lands on the ground colour.** Its card and the
   `clip-path` reveal are Phase 3.
6. **Fonts are substitutes.** Instrument Serif + Inter Tight until Teodor and
   Neue Haas Grotesk are licensed. One file to swap: `src/styles/fonts.css`.

## Next

Phase 2 — type, reveals, chrome: the `unmask` reveal registered as a GSAP
effect, split by line and never by character; the persistent nav; the pip rail;
the `.uline` / `.uline-double` underline pair.

Copy has to be written, not lifted — `sections.md`'s verbatim quotes are the
reference's own words about a different building. What transfers is the
discipline behind them: **about ninety words across the whole experience, and
nothing at all on the floor slides.**
