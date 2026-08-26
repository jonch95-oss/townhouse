# 223 Waverly Avenue

A single-property marketing microsite for a new four-storey townhouse in the Clinton Hill
Historic District, Brooklyn, by StudioSC Architecture.

One page, six full-screen slides, no scrollbar. A wheel gesture, swipe or arrow key
advances exactly one slide.

**New here?** Read [`HANDOFF.md`](HANDOFF.md) — what is built, what isn't, every place we
deliberately diverged from the reference, and what is blocked on assets.

---

## Prerequisites

- **Node.js 20.19+ or 22.12+** (Vite 5 requires it; developed on 22.22)
- **npm 10+** (ships with Node)

Nothing else. No database, no API keys, no environment variables.

## Get it running

```bash
git clone https://github.com/jonch95-oss/townhouse.git
cd townhouse
npm install
npm run dev
```

Then open the URL it prints — <http://localhost:5173> by default.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload on :5173 |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the production build on :4173 |
| `npm run typecheck` | TypeScript only, no build |

## Verifying it

The checks drive a real browser and read computed styles, so they catch things review
does not. They need a production build served on :4173, and Playwright's Chromium:

```bash
npx playwright install chromium   # once
npm run build
npm run preview &

node scripts/verify-root.mjs            # root font-size at all five breakpoints
node scripts/verify-pacing.mjs          # one gesture = one slide, transition timings
node scripts/verify-phase2.mjs          # reveals, chrome, intro headline fit
node scripts/verify-overlay.mjs         # Escape, arrows, focus trap, no key leakage
node scripts/verify-palette.mjs         # three colours, no reference hues
node scripts/verify-reduced-motion.mjs  # hard cut, not a scaled tween
node scripts/verify-phase3.mjs          # menu + lightbox, incl. no key leakage
node scripts/verify-shader.mjs          # the flagged transition shader (OUT= to save frames)
node scripts/verify-gate.mjs            # the gate stack, vertically and by width
node scripts/verify-chrome-contrast.mjs # writes clips; pair with the reader in HANDOFF
```

The transition shader is off by default. `?shader=1` enables it — see
[`HANDOFF.md`](HANDOFF.md).

`verify-overlay.mjs` needs the dev server rather than the preview build, because it
imports a TypeScript module directly:

```bash
npm run dev &
node scripts/verify-overlay.mjs
```

If your environment already has a Chromium that Playwright did not install — some CI
images and sandboxes do — point the scripts at it instead:

```bash
CHROME=/path/to/chrome node scripts/verify-root.mjs
```

## Layout

```
src/
  lib/          the machine — slide state, virtual scroll, Lethargy, reveals, overlay
  ui/           the chrome — hero, pip rail, menu toggle, section label, scroll hint
  data/         slide manifest and every word of copy
  styles/       tokens, fonts, type, stage, chrome
spec/           teardown of the reference site — a specification, NOT code to copy
docs/           verified project facts, review screenshots, capture prompt
assets/         renderings, materials and drawing sheets extracted from the StudioSC PDFs
scripts/        browser-driven verification
public/slides/  the images the slides actually load
```

## The spec

`spec/` is a forensic teardown of **quadplex80.com**, the reference this site's structure
and motion are modelled on. Start with `spec/REBUILD.md` — it carries the build order and
an explicit list of what not to build. `spec/motion-spec.md` has every timing;
`spec/tokens.md` has the type and colour system; `spec/responsive.md` has the breakpoint
behaviour.

**No imagery, copy or branding from the reference ships here.** See `spec/NOTICE.md`.

## A note on fonts

Fonts are **self-hosted** — three woff2 files under `src/styles/fonts/`, 65 KB, declared
in `src/styles/fonts.css`. The page makes no external font requests.

Instrument Serif and Inter Tight are stand-ins for the licensed faces the design calls
for. Swapping in the real files means replacing three `src:` urls and nothing else. See
the fonts section of [`HANDOFF.md`](HANDOFF.md).
