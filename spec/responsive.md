# responsive.md — breakpoints and what actually changes

Screenshots at every width are in `capture/screenshots/`, prefixed by viewport width.
Computed values below were read out of the live page at each size
(`capture/raw/probe-desktop.json`, `probe-mobile.json`), not derived from the stylesheet.

---

## 1. The headline: almost nothing changes, because everything scales

Before the breakpoint table, the rule that makes this site behave the way it does:

```css
:root { --size: 390 }
@media (min-width: 650px) { :root { --size: 1500 } }
@media (orientation: portrait) and (min-width: 650px) and (max-width: 1100px) { :root { --size: 834 } }

html { font-size: clamp(1px, 10 * 100vw / var(--size), 12px) }
```

Every dimension on the site is in `rem`, so the entire design is a single object that
scales with viewport width. There are only **two** genuine layout breakpoints (650 px and
1100 px) and a handful of aspect-ratio rules. Everything else that looks like responsive
behaviour is just the root font-size moving.

### Measured, live

| Viewport | `--size` | root font-size | 1 gutter (`2rem`) | Hero headline (`4.5rem` / `3.5rem`) | Logo | Grid columns | Text align |
|---|---:|---:|---:|---:|---:|---:|---|
| **1920 × 1080** | 1500 | **12px** (capped) | 24.0 px | 54.0 px | 72 px | 24 | left |
| **1440 × 900** | 1500 | 9.60 px | 19.2 px | 43.2 px | 67 px | 24 | left |
| **1024 × 768** | 1500 | **6.83 px** | 13.7 px | 30.7 px | 48 px | 24 | left |
| **768 × 1024** | 834 | 9.21 px | 18.4 px | 41.4 px | 64 px | 24 | left |
| **390 × 844** | 390 | 10.00 px | 20.0 px | *(not rendered — see §3)* | 70 px | *(no grid)* | — |

Measured live at each size; the 390 row is blank in three columns because the hero copy
block and its grid are **not in the DOM at all** on mobile (§3).

Two things fall out of that table that are worth pausing on.

**A 1024-wide laptop gets the smallest type on the site** — 6.83 px root, a 30.7 px hero
headline, a 13.7 px gutter. That is *smaller than the phone*, which sits at a 10 px root
and a 35 px headline. It's a direct consequence of dividing by a fixed 1500 design width
at every landscape size: the further below 1500 px you are, the more everything shrinks.
At 1024 the site is legible but visibly miniature, and 13.7 px of page padding is tight.
If you copy this rule — and you should — consider a second `--size` step for the 650–1200
band, or raise the `clamp()` floor.

**Above 1600 px the design stops growing.** `10 × 100vw / 1500` reaches the 12 px cap at
exactly 1800 px, so 1920, 2560 and 3840 all render identically at 12 px root. The page
simply centres more air around itself. This is the right behaviour and it is one line.

---

## 2. Every breakpoint in the CSS

| Query | Occurrences | Tailwind prefix | What it governs |
|---|---:|---|---|
| `(min-width: 650px)` | 12 | `s:` | **The** breakpoint. Mobile ⇄ desktop layout. |
| `(min-width: 1100px)` | 7 | `l:` | Large desktop: display type steps up, menu image appears |
| `(hover: hover) and (pointer: fine)` | 5 | `has-hover:` | Gates **every** hover effect and the custom cursor |
| `(orientation: portrait) and (min-width: 650px) and (max-width: 1100px)` | 2 | — | Tablet portrait → `--size: 834` |
| `(min-aspect-ratio: 16/9)` | 2 | `aspect-tight:` | Logo `7rem → 6rem`, intro headline steps down |
| `(min-aspect-ratio: 2/1)` | 2 | — | Logo `→ 4rem` |
| `(min-aspect-ratio: 9/5)` | 1 | — | further short-window trim |
| `(min-width: 649px) and (max-width: 1099px)` | 2 | `sml:` | Tablet-only gallery sizing |
| `(orientation: landscape) and (max-width: 1099px)` | 1 | — | Phone landscape: slide image fills height |
| `(max-width: 649px)` | 1 | `max-s:` | Mobile-only overrides |

And the parallel set in JavaScript, kept in a store and debounced at 50 ms:

```js
small          : (max-width: 649px)
medium         : (max-width: 1025px)
mouse          : (hover: hover) and (pointer: fine)
portrait       : (orientation: portrait)
landscape      : (orientation: landscape)
portraitSmall  : (orientation: portrait) and (max-width: 649px)
portraitMedium : (orientation: portrait) and (min-width: 650px) and (max-width: 1100px)
```

Note the deliberate mismatch: CSS switches layout at **650 px**, JS switches its `medium`
behaviour at **1025 px**. They do different jobs — CSS for layout, JS for deciding whether
the WebGL camera gets a horizontal view offset.

The **aspect-ratio queries are the unusual and clever part.** On a short, wide window — a
13" laptop with the browser chrome open — the logo steps down `7rem → 6rem → 4rem` at 16/9
and 2/1, and the intro headline drops a size. It solves "the design collides with itself
vertically" without touching the width breakpoints at all. Measured: at 1920 × 1080 (exactly
16:9) the logo renders at 72 px; at 1440 × 900 (16:10) it stays at 67 px.

---

## 3. What changes structurally at each step

### Below 650 px — mobile

| | Desktop | Mobile |
|---|---|---|
| Grid | **24 columns** | **6 columns** |
| Hero copy | `col-start-2 / span 7`, vertically centred, **left**-aligned | **not rendered at all** — see below |
| Hero bottom padding | `20rem` | n/a |
| Hero body copy | `1.6rem` | n/a |
| Slide pip rail | six pips, right edge | **absent** |
| "Scroll to explore" | bottom centre | replaced by a `↓` button inside the section-label bar |
| Slide imagery | landscape image, `src` at 2440 px | **separate portrait image**, 786 × 1364 native, `srcMobile` at 1440 px |
| Menu toggle | `top: 3rem; left: 2rem` | `top: 3rem; right: 2rem` |
| "Inquire" button | `top: 2rem; right: 2rem` | **hidden** |
| Sound toggle | bottom left | `top: 6rem; right: 2rem` |
| Menu link size | `3.5rem` (`.h3.--menu`) | `4rem` |
| Menu links | index sits at `-8rem` in the left margin | index moves inline, `padding-left: 4rem` on the link |
| Bottom scrim | `17rem`, 0 → **30 %** | `40rem`, 0 → **60 %** |
| Contact card padding | `5rem 7.5rem` | `5rem 4rem` |
| Contact card position | vertically centred | **bottom**-aligned |
| Contact headline | `4rem` | `2.6rem` |
| "Site by Outpost" credit | bottom right | **hidden** (`max-s:!hidden`) |
| Section-label box | `35.5rem × 9rem`, bottom right | **full width** × `7rem` |
| Section-label index (`01`) | shown | **hidden** (`hidden s:flex`) |
| Overview panel title | `9rem` | `4rem` |
| Gallery arrows | `7rem` square (tablet) | `2.8rem` square |

### The mobile hero has no copy at all

This is the most radical thing on the site and it is invisible from the desktop build.
The hero copy block is rendered by a component gated on `!small`:

```js
entered && !interiors && !content && slides.current === 0 && !small
```

So below 650 px the eyebrow, the headline, the paragraph and the price are **never put
into the DOM.** Measured at 390 × 844: `.site-grid` is absent, `h2.font-disp` is absent,
`p.js-hero-text` is absent. `capture/screenshots/390-D-hero.png` shows the whole mobile
hero — the tower, the logo, the menu toggle, the sound toggle, and a full-width bar at the
bottom reading `[↓]  OVERVIEW  [+]`. That is the entire screen.

Which means the phone experience is **zero words on every single slide, hero included**.
Everything — including the price — sits behind the `+`. A desktop visitor is told the
proposition; a phone visitor is shown the building and has to ask.

The section-label bar changes shape to carry the load: it goes full width, drops the `01`
index (`hidden s:flex`), and gains a **`↓` advance button on the left** where the index
was, so the bar becomes the primary navigation as well as the label.

One consequence worth noting: the CMS carries a separate, longer `textMobile` field on the
hero ("…Scroll to explore this extraordinary residence.") and the component that would
consume it is exactly the one that never mounts on mobile. As far as I can tell **that
field is dead** — written, stored, and never displayed.

If you copy this, copy it deliberately. It is a strong choice and it depends entirely on
the image being good enough to carry a screen alone.

The other mobile change that matters is the **art-directed portrait image**. They do not
crop the landscape photograph — every floor has a separately shot/framed 786 × 1364
portrait asset. On a phone the entire screen is that image, so a centre-crop of a
landscape frame would be obvious. This is the most expensive-to-produce responsive
decision on the site and the one most worth budgeting for.

### Above 1100 px — large desktop

- `.h3` steps `4rem → 6rem`; `.h3.--menu` steps `3.5rem → 5rem`.
- The **menu image appears** — it is `hidden l:block`, so below 1100 px the menu is links
  only, with no imagery at all.
- `.menu-image` max-height goes from `calc(100svh - 10rem)` to `calc(100svh - 20rem)`.
- `.slide-image` gains `max-height: calc(100svh - 16rem)` in the lightbox — below that, it
  is allowed to fill the full `100svh`.

### Portrait phone, in the lightbox

A full-screen white block appears: a 150 px line-drawn logo mark above the words
**"Rotate your phone"** at `3rem` (`2.2rem` inside the gallery), in gold on white,
`z-index: 9998`. Triggered by `portraitSmall`, i.e. `(orientation: portrait) and
(max-width: 649px)`. They simply refuse to show a landscape floorplan or timelapse on a
portrait phone rather than shrinking it into illegibility. Blunt, and correct.

---

## 4. Which animations are disabled or simplified on touch

This is the part of the brief with the clearest answer, and it is not the one you'd
expect: **almost nothing is disabled — the interaction model is re-pointed rather than
reduced.**

### Genuinely gated behind `(hover: hover) and (pointer: fine)`

Everything in this list simply does not exist on a touch device:

| Effect | Behaviour on touch |
|---|---|
| **The custom cursor** (`.fc`) | Not rendered. The ring, the dot, "Press & Hold", "See the view" and the `‹ ›` arrows are all mouse-only. |
| `.uline` underline wipe | Static — the resting state only |
| `.uline-double` underline hand-off | Static |
| `.h-scale` image `scale(1.025)` | Never fires |
| `.h-shape` icon swap on gallery arrows | Never fires; the second arrow is `display: none` |
| `.btn-norm` fill wipe and arrow swap | The mask is `display: none` outside the hover query; a `--solid` modifier gives touch users a permanently filled button instead |
| Menu-link sibling dimming | Never fires |
| `.x-trig:hover .x` 90° rotation | Never fires |

Which means the **entire hover vocabulary of the site is absent on a phone**, and they did
not build touch substitutes for any of it. The resting states were designed to be complete
on their own.

### Re-pointed rather than disabled

| | Mouse | Touch |
|---|---|---|
| Slide advance | wheel, through Lethargy + 50 ms debounce | `touchstart`/`touchmove`, delta × **3**, no Lethargy check (`!lethargy.check(e) && hasMouse` — the guard is skipped entirely without a fine pointer) |
| Press-and-hold zoom | **100 ms** hold | **500 ms** hold |
| Orbit `rotateSpeed` | **2** | **1** |
| Orbit entry event | `_onMouseDown(originalEvent)` | `_onTouchStart(originalEvent)` |
| Shader cursor parallax | driven by `cursor:tick` (the smoothed cursor) | driven by the plain `tick` — the `u_mouse` uniform simply never updates, so the ±0.4 % drift is **absent** |
| Gallery navigation | click anywhere on the image | swipe, **50 px** threshold |

The touch multiplier of **3** and the raised **500 ms** hold threshold are the two numbers
to copy. The first makes a short thumb-flick equal a full wheel gesture; the second stops
a tap being misread as a press-and-hold.

### Not simplified on mobile at all

Worth stating plainly, because it is unusual:

- The **full WebGL scene** — 6.9 MB of cloud and city textures plus the **6.03 MB glTF
  tower model** — loads on a phone exactly as it does on a desktop. No mobile fallback, no
  reduced texture set, no static-image substitute.
- Both **1.28 MB MP3s** preload on a phone.
- The **8-second entrance descent** plays in full.
- The **11 MB progressive-download MP4** timelapse plays on a phone.
- Every GSAP timing is identical. There is no `matchMedia()` gate on any duration.

The only concession is `lowPowerMode`: on boot they attempt to play a tiny muted video and
check whether it stayed paused. If it did — iOS Low Power Mode — **every video on the site
is replaced by its poster frame** for that session. That is the single mobile optimisation,
and it is about battery rather than bandwidth.

### And `prefers-reduced-motion`

Nothing. The media query is evaluated on boot, stored on a feature object, and never read
again; there is no `@media (prefers-reduced-motion)` rule in any of the 31.9 KB of CSS.
See `REBUILD.md` §2 Phase 5 — this is a half-day fix and the clearest place to beat the
reference.

---

## 5. Navigation and gallery on touch, specifically

**The menu overlay is solid gold.** Worth stating because it is the one place the palette
inverts: the overlay ground is `#7c7262` at full opacity with white Teodor links and the
index numbers in a lighter tint of the same hue. Everywhere else on the site gold is type
or a hairline on white; here it is the field. See `capture/screenshots/390-J-menu-open.png`
and `1440-J-menu-open.png`.

**Navigation.** The nav never hides on either platform — there is no scroll direction to
respond to. On mobile the toggle moves to the top **right**, the "Inquire" button is
dropped entirely, and the sound toggle takes its own position below the toggle. The menu
overlay opens with the identical 1.125 s `clip-path` animation; the only difference is that
below 1100 px it carries no image, and below 650 px the links centre and the index numbers
move inline. The slide pips and the slide-down button are present and identically sized.

**Gallery.** Opens the same way (tap anywhere on an interior slide). Navigation switches
from click-to-advance to **swipe with a 50 px threshold**, left for next and right for
previous, implemented on `touchstart`/`touchend` with no momentum and no rubber-banding.
The prev/next buttons remain but shrink from `7rem` to `2.8rem`. There is **no pinch to
zoom**, no double-tap zoom, and — as on desktop — **no keyboard support of any kind**.

On a portrait phone the gallery does not attempt to display at all: it shows the "Rotate
your phone" block instead.
