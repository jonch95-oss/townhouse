# tokens.md — design tokens, real computed values

Source: the six inline `<style>` blocks in the document head plus the three
`/_nuxt/*.css` files — 31.9 KB of CSS in total for the entire site. Everything below is
read out of that CSS, not eyeballed from screenshots. A ready-to-use custom-property
sheet sits beside this file at `capture/tokens.css`.

---

## 1. The fluid root — read this first

Almost nothing else about the type or spacing makes sense until you understand this rule:

```css
:root { --size: 390 }
@media (min-width: 650px)  { :root { --size: 1500 } }
@media (orientation: portrait) and (min-width: 650px) and (max-width: 1100px) {
  :root { --size: 834 }
}

html { font-size: clamp(1px, 10 * 100vw / var(--size), 12px); }
```

`1rem` equals **10 px at the design width** and scales linearly with viewport width,
capped at 12 px. Design widths are **390** (mobile), **834** (tablet portrait) and
**1500** (desktop).

Consequences worth internalising:

- Every size on the site is in `rem`. There is **no `clamp()` on any individual
  font-size**, no fluid type formula per element, no breakpoint-by-breakpoint font
  overrides except where the design genuinely changes.
- The whole page scales as a single object. At 1200 px wide, `1rem` = 8 px and every
  headline, gap and hairline shrinks by the same 20 %. This is why the layout looks
  identically composed at any desktop width and why it never feels "responsive" in the
  awkward sense.
- Above 1800 px the cap kicks in (12 px) and the design stops growing, so it doesn't
  turn into a billboard on a 4K monitor.
- `text-50` in their Tailwind config means `font-size: 5rem` = **50 px at the design
  width**. The utility numbers are design-width pixels. That naming is worth stealing.

---

## 2. Colour

The entire site is **three colours**. No dark mode exists — there is no
`prefers-color-scheme` rule and no theme attribute anywhere in the CSS.

| Token | Hex | rgb | Where it is used |
|---|---|---|---|
| **gold** | `#7c7262` | `124 114 98` | The only brand colour. Preloader %, "LOADING", contact card text and border, gallery caption, button borders and fill, floorplan chrome, menu index numbers. A warm taupe/bronze — reads as brass, not yellow. |
| **white** | `#ffffff` | `255 255 255` | Page ground, preloader ground, the two curtain masks, the contact card, gallery arrow buttons, all copy set over imagery. |
| **black** | `#000000` | `0 0 0` | **Never used solid.** Only at 10 % (intro scrim) and 50 % (lightbox backdrop), plus the interiors' top/bottom vignette at 25 % opacity. |

Alpha steps that actually appear in the stylesheet — there are no others:

```
gold  @ 20%  #7c726233   hairline borders (contact card, section rules)
gold  @ 40%  #7c726266   preloader rule, button border, gallery arrow border
black @ 10%  #0000001a   scrim over the cloud scene behind the intro copy
black @ 50%  #00000080   lightbox backdrop
white @ 10%  #ffffff1a
white @ 40%  #ffffff66
```

One accent exists, used **only** in the bottom scrim that lifts white copy off the sky:

```css
--scrim: #3c6278;  /* slate blue */
.bottom-gradient::after {                        /* mobile */
  background: linear-gradient(180deg, #3c627800, #3c627899);   /* 0% → 60% */
  height: 40rem;
}
@media (min-width: 650px) {                      /* desktop */
  .bottom-gradient::after {
    background: linear-gradient(180deg, #3c627800, #3c62784d); /* 0% → 30% */
    height: 17rem;
  }
}
```

The interiors get a different treatment — a symmetrical vignette at only 25 % opacity:

```css
.interiors-gradient::before { background: linear-gradient(180deg,#000 0,transparent); top: 0;    height: 12.5rem; opacity: .25 }
.interiors-gradient::after  { background: linear-gradient(0deg,  #000 0,transparent); bottom: 0; height: 12.5rem; opacity: .25 }
```

Two Tailwind defaults leak into the build and are **not** design tokens: `#9ca3af`
(placeholder text) and `#3b82f680` (focus ring). Ignore them.

---

## 3. Typography

Two families, both **self-hosted** as woff2 + woff. No Google Fonts, no Adobe/Typekit,
no external font requests at all.

```css
/* Display serif — Teodor Regular */
@font-face {
  font-display: swap;
  font-family: teodor;
  font-style: normal;
  font-weight: 400;
  src: url(/_nuxt/Teodor-Regular.DWUeTY31.woff2) format("woff2"),
       url(/_nuxt/Teodor-Regular.DcYbcpVO.woff)  format("woff");
}

/* Text sans — Neue Haas Grotesk Text Pro, two weights */
@font-face {
  font-display: swap;
  font-family: sans;
  font-style: normal;
  font-weight: 400;                       /* 55 Roman */
  src: url(/_nuxt/NHaasGroteskTXPro-55Rg.DjjIn3vU.woff2) format("woff2"),
       url(/_nuxt/NHaasGroteskTXPro-55Rg.B19SsRDk.woff)  format("woff");
}
@font-face {
  font-display: swap;
  font-family: sans;
  font-style: normal;
  font-weight: 500;                       /* 65 Medium */
  src: url(/_nuxt/NHaasGroteskTXPro-65Md.obxsJaSp.woff2) format("woff2"),
       url(/_nuxt/NHaasGroteskTXPro-65Md.DyUo2QC_.woff)  format("woff");
}
```

**Three font files, total.** One serif weight and two sans weights carry the whole site.
Both are licensed commercial faces — Teodor is Pangram Pangram, Neue Haas Grotesk is
Monotype/Linotype. Budget for licences or substitute (suggestions in `REBUILD.md`).

`font-family: sans` is literally the family name they chose — it shadows nothing, but do
rename it in your own build.

Base: `-webkit-font-smoothing: antialiased`, `font-optical-sizing: auto`,
`-webkit-text-size-adjust: none`, `-webkit-tap-highlight-color: transparent`.

### The complete type scale

Sizes are in rem; the px column is the value **at the design width** (390 / 834 / 1500),
which is the number the designer actually drew.

| Role | Family | Desktop (≥650px) | Mobile (<650px) | line-height | letter-spacing | weight | transform |
|---|---|---|---|---|---|---|---|
| **Intro headline** ("ABOVE THE CLOUDS") | teodor | `10rem` (100px) | `5rem` (50px) — `8rem` tablet portrait | `1.05` | `.375em` | 400 | uppercase |
| **Hero headline** ("Your Sanctuary / In The Clouds") | teodor | `4.5rem` (45px) | `3.5rem` (35px) | `1.05` | `-.02em` | 400 | none |
| **Hero eyebrow** ("111 WEST 57ᵗʰ STREET") | sans | `1.2rem` (12px) | `1.2rem` | inherit `1.4` | normal | 500 | uppercase |
| **Hero body / price** | sans | `1.6rem` (16px) | `1.4rem` (14px) | `1.4` | normal | 400 | none |
| **Section heading `.h3`** | teodor | `6rem` @≥1100px, `4rem` @650–1099 | `4rem` | `1` | `-.025em` | 400 | none |
| **Menu link `.h3.--menu`** | teodor | `5rem` @≥1100px, `3.5rem` @650–1099 | `4rem` | `1.1` (override) | `-.025em` | 400 | none |
| **Panel title `.h4`** | teodor | `5rem` | `4rem` | `1` | `-.025em` | 400 | none |
| **Sub-heading `.h5`** | teodor | `2.6rem` (26px) | `2.6rem` | `1.3` | `-.025em` | 400 | none |
| **Overview panel title** | teodor | `9rem` (90px) | `4rem` (40px) | `1` (leading-none) | `-.025em` | 400 | none |
| **Contact headline** ("Endless horizons await") | teodor | `4rem` (40px) | `2.6rem` (26px) | `1.4` | `.2em` | 400 | **uppercase** |
| **Contact eyebrow** ("Contact us") | sans | `1.2rem` | `1.2rem` | `1` | `.1em` | 500 | uppercase |
| **Contact subtitle** | sans | `1.8rem` | `1.5rem` | `1.4` | normal | 400 | none |
| **Contact link** (email/phone) | sans | `1.8rem` | `1.6rem` | `1` | normal | 400 | none |
| **Body copy** (default) | sans | `1.8rem` | `1.8rem` | `1.4` | normal | 400 | none |
| **Small-caps label `.label`** | sans | `1.4rem` | `1.4rem` | inherit | normal | **500** | uppercase |
| **Menu index ("01")** | sans | `1.4rem` | `1.4rem` | inherit | normal | 500 | uppercase, `opacity: .4` |
| **Menu footer links** | sans | `1.2rem` | `1.2rem` | `1` | normal | 500 | uppercase |
| **Gallery caption** | sans | `1.4rem` | `1.4rem` | inherit | normal | 500 | uppercase, gold |
| **Cursor label** | sans | `1.4rem` | `1.4rem` | inherit | normal | 400 | none |
| **Preloader `%` (`.h5`)** | teodor | `2.6rem` | `2.6rem` | `1` (leading-none) | `-.025em` | 400 | none |
| **Preloader "LOADING" (`.label`)** | sans | `1.4rem` | `1.4rem` | inherit | normal | 500 | uppercase |
| **Button label** | sans | `1.4em` of `1rem` = `1.4rem` | same | `1` | normal | 500 | uppercase |

**No `clamp()` on any individual element.** All fluidity comes from the root rule in §1.

Two typographic details worth stealing:

- `.ordinal { font-size: .6em; vertical-align: 0 }` — the "th" in "111 WEST 57ᵗʰ STREET"
  is set at 60 % and deliberately **not** raised. It reads as a refinement, not a
  superscript.
- The contact headline is the only uppercase display type on the site, and it gets
  `line-height: 1.4` with `letter-spacing: .2em` — loose in both axes. Uppercase serif
  at tight leading would look like a monument; at 1.4 it looks like an invitation.

---

## 4. Spacing, grid, container

```css
.site-max  { width: 100%; margin-inline: auto; padding-inline: 2rem; }
.site-grid { --gap: 2rem; --cols: 6;  display: grid;
             grid-template-columns: repeat(var(--cols), minmax(0,1fr));
             column-gap: var(--gap); }
@media (min-width: 650px) { .site-grid { --cols: 24; } }
```

- **There is no `max-width` container.** `.site-max` is full-bleed with a `2rem` gutter
  (20 px at design width, and fluid with it). Content is constrained by *column spans*,
  not by a wrapper. On a 2560 px monitor the gutter is 24 px and the grid simply
  stretches — which works because everything else scaled up too.
- **6 columns on mobile, 24 on desktop.** 24 is the useful choice: it divides by 2, 3,
  4, 6, 8 and 12, so asymmetric splits stay on-grid.
- **One gutter value, `2rem`, everywhere** — page padding and column gap are the same
  number. There is no separate "section padding" scale.

Vertical rhythm is expressed as one-off rem values rather than a strict scale. The ones
that recur, in ascending order:

```
.4rem  .5rem  1rem  1.2rem  1.5rem  2rem  2.5rem  3rem  4rem
4.5rem 5rem  6rem  7rem  7.5rem  8rem  10rem  11rem  20rem
```

Named uses worth copying:
- Hero copy block: `padding-bottom: 11rem` mobile → `20rem` desktop.
- Contact card: `padding: 5rem 4rem` mobile → `5rem 7.5rem` desktop.
- Overview panel: rule at `margin-top: 3rem` mobile → `7rem` desktop; sections `padding-top: 4.5rem`; sub-heading `margin-bottom: 4rem`.
- Rich-text paragraphs: `.txt > :not(:last-child) { margin-bottom: 2.5rem }`.
- Header chrome: menu toggle `top: 3rem`, Inquire button `top: 2rem / right: 2rem`, side pip rail `right: 2rem` with `gap-y: 2rem`.

**Empty space is the design.** The hero carries one eyebrow, a two-line headline, one
sentence and a price — roughly 25 words in the lower-left eighth of the screen. The
other seven-eighths is sky.

---

## 5. Borders, radii, shadows

| Token | Value | Used on |
|---|---|---|
| radius sm | `.3rem` | small square buttons (slide-down arrow, gallery prev/next) |
| radius md | `.4rem` | contact card, inputs, and the clip-path reveal's `round .4rem` |
| radius lg | `.5rem` | floorplan preview boxes |
| border | `1px solid` current colour at **20 % or 40 %** opacity | Never a solid 1px line. Every border on the site is a tinted hairline. |
| rule | `<hr>` with `border-gold/20` or `border-gold/40` | section dividers, preloader bar |
| shadow | `0 1px 2px rgb(0 0 0 / .10)` | the **only** box-shadow in the entire stylesheet, and it is on an input |

There are **no drop shadows on cards, images or buttons**. Depth comes from the imagery
and from gradient scrims, never from shadow.

Hairline technique worth noting: several borders are drawn as a `::before` overlay with
`opacity: .4` rather than as a `border-color` with alpha — so the border can be faded
independently of the element.

```css
/* e.g. the slide-down button */
.btn::before { position:absolute; inset:0; border:1px solid currentColor;
               border-radius:inherit; opacity:.4; pointer-events:none; }
```

Sub-pixel hairlines are guarded: `.uline::before { height:.05em; min-height:1px }` — the
underline is optically proportional to the type size but never disappears.

---

## 6. Breakpoints

Every media query in the stylesheet, with counts:

| Query | Count | Meaning |
|---|---|---|
| `(min-width: 650px)` | 12 | **the** breakpoint — Tailwind prefix `s:` |
| `(min-width: 1100px)` | 7 | large desktop — prefix `l:` |
| `(hover: hover) and (pointer: fine)` | 5 | gate every hover effect and the custom cursor |
| `(orientation: portrait) and (min-width: 650px) and (max-width: 1100px)` | 2 | tablet portrait, `--size: 834` |
| `(min-aspect-ratio: 16/9)` / `(2/1)` / `(9/5)` | 4 | shrink the logo and headline on short/wide windows |
| `(orientation: landscape) and (max-width: 1099px)` | 1 | phone landscape — slide image fills height |
| `(min-width: 649px) and (max-width: 1099px)` | 2 | tablet-only tweaks, prefix `sml:` |
| `(max-width: 649px)` | 1 | mobile-only, prefix `max-s:` |

JS uses a parallel set through `matchMedia`, kept in a Pinia-backed viewport store and
debounced at 50 ms:

```js
small        : (max-width: 649px)
medium       : (max-width: 1025px)
mouse        : (hover: hover) and (pointer: fine)
portrait     : (orientation: portrait)
landscape    : (orientation: landscape)
portraitSmall: (orientation: portrait) and (max-width: 649px)
portraitMedium:(orientation: portrait) and (min-width: 650px) and (max-width: 1100px)
```

Note the mismatch: CSS's desktop breakpoint is **650px**, JS's `medium` cut is
**1025px**. They are used for different jobs — CSS for layout, JS for deciding whether
the WebGL view offset applies.

Aspect-ratio queries are unusual and worth copying. On a short, wide window (a laptop
with the browser chrome open) the logo steps down `7rem → 6rem → 4rem` at 16/9 and 2/1,
and the intro headline drops a step at `aspect-tight`. It stops the design colliding
with itself on a 13" screen without touching the width breakpoints.

---

## 7. Motion tokens

Full detail is in `motion-spec.md`; these are the values you'd put in a variables file.

| Token | Value | Used for |
|---|---|---|
| `--ease-expo-out` | `cubic-bezier(.19, 1, .22, 1)` | **The signature curve.** Every CSS hover, underline, icon rotation, image scale. |
| `--ease-in-out-circ` | `cubic-bezier(.785, .135, .15, .86)` | the button's fill wipe |
| `--ease-in-out-sine` | `cubic-bezier(.455, .03, .515, .955)` | the button's arrow swap |
| `snappy` (GSAP CustomEase) | `M0,0 C0.094,0.026 0.124,0.127 0.157,0.29 0.197,0.486 0.254,0.8 0.348,0.884 0.42,0.949 0.374,1 1,1` | slide transitions, contact card, pip rings |
| `expo-hard` (GSAP CustomEase) | `M0,0 C0.084,0.61 0.156,0.822 0.218,0.883 0.287,0.951 0.374,1 1,1` | defined at boot |
| `unmask` (GSAP CustomEase) | `M0,0 C0.16,1 0.3,1 1,1` | **every text reveal** |
| durations | `.25s .35s .5s .75s 1s 1.5s` (CSS) · `.75s 1s 1.125s 1.5s 2s 2.25s 3s 8s` (GSAP) | — |

There are exactly **six** CSS transition durations on the whole site. That discipline is
a token in its own right.
