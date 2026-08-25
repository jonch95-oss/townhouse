# Prompt for Claude Cowork — capture quadplex80.com

Paste everything in the block below into a Claude Cowork session that has
browser and network access. Output comes back to this repo on the branch
`claude/quadplex80-capture`.

---

I need you to reverse-engineer the **experience** of a website in enough depth that
another developer could rebuild it from your notes alone, without ever loading it.

**Target:** https://quadplex80.com/

**Context:** it's a single-property microsite for one luxury residence. I'm building
the same *kind* of experience for a different property — 223 Waverly Avenue,
Brooklyn, a 4-storey new-build townhouse. All content, imagery and branding on my
site will be my own; what I'm reproducing is the structure, motion and interaction
design. So capture their assets only as reference material for layout and timing —
don't package their photography, copy or logos as something to ship.

The site is built on landing.love, so a literal copy isn't possible or wanted.
I need a **specification**, not a scrape.

Work through all six parts.

---

## 1. Raw material

- Save the fully-rendered DOM (`document.documentElement.outerHTML` after scrolling
  the whole page, so lazy-loaded sections are present) → `capture/dom.html`
- Save every stylesheet, concatenated → `capture/styles.css`
- List every JS library and version you can identify (check `window` globals,
  script `src` URLs, source maps, bundle contents). Specifically determine whether
  they use **GSAP / ScrollTrigger, Lenis, Locomotive Scroll, Framer Motion, Swiper,
  Three.js, or native APIs**. → `capture/stack.md`
- Network asset manifest: every image and video — URL, format (WebP/AVIF/JPEG/mp4),
  dimensions, file size, and whether it's `srcset`/responsive. Note total page
  weight and how much is above the fold. → `capture/assets.md`

## 2. Motion and interaction — the most important part

Be forensic here. Numbers, not adjectives. I want durations in ms, easing curves as
`cubic-bezier()` values or named GSAP eases, distances in px or %, and the trigger
point for each.

Document:

- **Scroll mechanics.** Native scroll, or hijacked/smoothed? If smoothed, which
  library and what lerp/duration setting? Is there scroll-snap? Are any sections
  pinned while content moves inside them?
- **Preloader / first paint.** Is there a loading screen? What's the entrance
  sequence — order, delay between elements, duration of each?
- **Reveal-on-scroll.** For each type of element (headline, paragraph, image,
  number): what property animates (opacity, translateY, clip-path, scale), from what
  value to what value, over how long, with what easing, and at what viewport
  threshold does it fire? Does text reveal by line, word, or character?
- **Parallax.** Which elements, at what rate relative to scroll.
- **Image transitions.** Crossfades, clip-path wipes, scale-on-scroll (from what
  scale to what scale)?
- **Navigation.** Is it visible at rest? Does it hide on scroll-down and return on
  scroll-up? Is there a full-screen menu overlay — and if so, what's its open/close
  animation?
- **Cursor.** Custom cursor? What does it do on hover over images and links?
- **Hover states.** Links, buttons, gallery items — the exact transform and timing.
- **Gallery / lightbox.** How does it open, navigate, close? Keyboard support?
- **Video.** Any background video? Autoplay, muted, looped, poster frame?
- **Reduced motion.** Does `prefers-reduced-motion` change anything?

→ `capture/motion-spec.md`

Practical method: use the DevTools **Animations** panel and **Performance** recording
to read real durations rather than guessing, and read the actual easing values out of
the CSS and JS rather than eyeballing them.

## 3. Design tokens

Pull the real computed values, not approximations:

- Every colour used, as hex, with what it's used for. Note if there's a dark mode.
- Every font family, with weights and the exact source (Google Fonts, self-hosted,
  Adobe). Include the `@font-face` or `<link>` declarations.
- The complete type scale: for each text role (hero headline, section heading,
  body, caption, nav, small-caps label) give `font-size`, `line-height`,
  `letter-spacing`, `font-weight`, and `text-transform` — **at both desktop and
  mobile**. Note any `clamp()` or fluid sizing.
- The spacing scale — section padding, gaps, container `max-width`, grid columns.
- Border radii, borders, shadows.

→ `capture/tokens.md` plus a ready-to-use `capture/tokens.css` of CSS custom properties.

## 4. Section-by-section teardown

Walk the page top to bottom. For each section in order:

1. What it's called / what job it does
2. Its layout (full-bleed? centred? asymmetric grid? what proportions?)
3. Its exact copy, verbatim — including any small-print labels
4. Its media (how many images, what aspect ratio, how arranged)
5. Its behaviour on scroll
6. A screenshot of just that section

Pay attention to **how much empty space** sits between sections and **how little
text** each one carries — that restraint is usually the whole effect.

→ `capture/sections.md`

## 5. Responsive behaviour

- Screenshots at 1920, 1440, 1024, 768 and 390px wide
- Every breakpoint value in the CSS
- What structurally changes at each — and specifically **which animations are
  disabled or simplified on mobile**
- How the nav and gallery change on touch

→ `capture/responsive.md` + `capture/screenshots/`

## 6. Deliverables

Also produce:

- `capture/full-page-desktop.png` and `capture/full-page-mobile.png` — full-height
  screenshots of the entire page
- A screen recording (or a numbered frame sequence, ~1 frame per 300ms) of a slow
  scroll through the whole page at 1440px, so the motion is legible → `capture/scroll/`
- `capture/REBUILD.md` — your own summary: if you had to rebuild this experience
  from scratch, what would you use, in what order, and what are the three details
  that most make it feel expensive?

**Hand back:** push everything to `github.com/jonch95-oss/townhouse` on a new branch
called `claude/quadplex80-capture`. If you don't have push access to that repo, put
it all in one folder and zip it instead, and tell me where the zip is.
