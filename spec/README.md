# quadplex80.com — experience capture

A specification of the structure, motion and interaction design of
**https://quadplex80.com**, produced as reference for rebuilding an equivalent
experience for **223 Waverly Avenue, Brooklyn**.

Captured 25 August 2026. Build id `47bc8daf-8e76-46df-aa01-99dee24ca061`.

---

## Read in this order

| File | What it is |
|---|---|
| **`REBUILD.md`** | Start here. What I'd use, in what order, the three details that make it feel expensive, and the mapping onto 223 Waverly. |
| **`motion-spec.md`** | The core reference. Every duration in ms, every easing as a real curve, every distance, every trigger. §12 is a one-page cheat sheet. |
| **`tokens.md`** + **`tokens.css`** | Design tokens. `tokens.css` is a drop-in custom-property sheet. |
| **`sections.md`** | Screen-by-screen teardown with all copy verbatim. |
| **`responsive.md`** | Breakpoints, what changes structurally at each, and what is simplified on touch. |
| **`stack.md`** | What it's built with. Includes the direct yes/no on GSAP, ScrollTrigger, Lenis, Locomotive, Framer Motion, Swiper, Three.js. |
| **`assets.md`** | Network and media manifest, page weight, formats, responsive strategy. |
| **`styles.css`** | Their complete stylesheet, concatenated — 31.9 KB for the whole site. |

## Directories

| Path | Contents |
|---|---|
| `screenshots/` | Per-screen and per-breakpoint captures, prefixed by viewport width |
| `scroll/` | Frame sequence of a full walk-through at 1440px |
| `scroll-descent/` | Frame sequence of the 8-second entrance camera descent |
| `raw/` | Machine-readable source material — see below |

### `raw/`

| File | Contents |
|---|---|
| `payload-decoded.json` | The decoded Nuxt/DatoCMS payload. **Every piece of copy, every image record with its variants, LQIP, dominant colour and focal point.** The single most useful raw file here. |
| `assets.json` | Every unique asset: URL, content-type, byte size, requested widths, transform params |
| `recon.json` | Full request log from a cold load (58 entries) |
| `probe-desktop.json` / `probe-mobile.json` | Computed styles and matched media queries at every captured viewport |
| `nuxt/` | The original un-beautified JS and CSS bundles |
| `index.ssr.html` | The server-rendered HTML as delivered |

`dom.html` at the top level is `document.documentElement.outerHTML` taken from a live,
fully-entered session.

---

## Two corrections to the brief

1. **It is not built on landing.love.** It is a bespoke Nuxt 3 application (DatoCMS +
   Mux + Three.js), credited on the site to Outpost. There is no page-builder involved.
2. **It does not scroll.** `document.scrollHeight === innerHeight`. The wheel is captured
   entirely and the site is six full-screen slides advanced one gesture at a time. Several
   questions in the brief — scroll-snap, pinned sections, scrub thresholds, hide-nav-on-
   scroll-down — have no equivalent here, and `motion-spec.md` says so explicitly rather
   than inventing an answer.

---

## On the captured material

Their photography, copy, marks and bundles are here **solely as layout and timing
reference**, as requested. Nothing in this folder is packaged for reuse and none of it
should ship on 223 Waverly Avenue. The site's imagery, text and branding belong to
111 West 57th Street and its partners; the design and build are credited to Outpost.

What transfers is the specification: proportions, durations, easing curves, interaction
model and restraint.

---

## Method, and its limits

Captured with headless Chromium (Playwright) driving the live site, plus static analysis
of the downloaded and beautified bundles.

**Where the numbers come from.** Every timing, easing and distance in `motion-spec.md` was
read out of the site's own source — the GSAP calls in the bundle and the transition
declarations in the CSS — not measured from a recording or estimated by eye. That is more
precise than a Performance trace and it is why the spec can give you
`stagger: { each: 0.05, from: 'random' }` rather than "a quick shimmer".

**One limitation worth knowing.** The capture environment has no GPU, so their Three.js
scene renders under software rasterisation at roughly 1–2 fps. GSAP's lag smoothing
stretches wall-clock time to match, so the screenshots and frame sequences show the right
*states* and the right *order*, but the frame intervals in `scroll/` and `scroll-descent/`
are **not** proportional to real time. Use the numbers in `motion-spec.md` for timing, and
the frames for composition and sequence. The frame sequences are also, incidentally, a
better record of the entrance than real-time video would be, because the slow render
samples the camera move much more finely.

**Also observed:** their intro reveal has a race condition that intermittently leaves the
visitor stranded on a preloader reading 100%. It reproduced often enough during capture
that the harness carries an explicit reload-and-retry for it. Noted in `REBUILD.md` §5.
