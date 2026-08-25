# REBUILD.md — how I'd build this for 223 Waverly Avenue

My own summary, written after taking their site apart. Opinionated on purpose.

---

## 1. The three details that make it feel expensive

If you only take three things from this whole capture, take these. None of them is the
WebGL.

### 1. One flick, one floor — and the transition is not interruptible

The site is not scrolled, it is **advanced**. A deliberate wheel gesture moves you exactly
one floor, the input locks for the 1.5 s of the transition, and nothing you do during
those 1.5 s has any effect. There is no rubber-banding, no momentum, no wrap-around, no
skipping two slides because your trackpad was still coasting.

That last part is doing more work than it looks. They run every wheel event through
**Lethargy(8, 50)** plus a 50 ms debounce specifically to throw away the inertial tail a
trackpad emits after your fingers leave it. Without it, one swipe fires a dozen slide
changes and the whole thing feels cheap and twitchy. With it, the building responds once,
completely, per gesture — like a lift, not a scrollbar.

The tell that they thought about this: the **first** transition off the hero is different.
A 0.5 s hold, then 2.25 s instead of 1.5 s. You ask to leave, and the building takes a
beat before it lets you. It's a single conditional in the code and it's the most
expensive-feeling half-second on the site.

### 2. One curve, six durations, everywhere

Every CSS hover on the site — every underline, every icon rotation, every image scale, the
gallery arrows, the close X — uses `cubic-bezier(.19, 1, .22, 1)`. Every one. And there
are exactly **six** durations in the whole stylesheet: `.25s .35s .5s .75s 1s 1.5s`.

On the GSAP side it is nearly as tight: three custom eases, of which one (`unmask`) does
every single text reveal and another (`snappy`) does every slide, card and pip.

This is why the site feels like one object rather than a collection of components. It is
also the single cheapest thing on this list to copy — it costs nothing but discipline, and
it will do more for your site than any shader.

The corollary: **1.5 s for a text reveal, 0.75 s for a hover.** Those are slow numbers.
Most sites run text reveals at 0.6 s and hovers at 0.2 s and read as brisk and ordinary.
Doubling the duration is most of the difference between "nice" and "expensive".

### 3. Ninety words, and four screens with none at all

Excluding overlays the visitor has to go and find, the entire experience is about **90
words**. The preloader has two. The hero has twenty-seven and a price. **The four floor
slides have zero.** No title, no floor number, no caption, no counter — four consecutive
full-screen photographs with nothing on them.

Everything else — the descriptions, the square footages, the highlights, the credits, the
legal — is real, well-written, and hidden one click away behind the menu. They were
disciplined enough to write it all and then keep it off the screen.

Honourable mention, because it's free: the hero eyebrow and paragraph animate to
`opacity: 0.7`, not `1`. Secondary copy never reaches full white. It costs one character
in the tween and it is the difference between a hierarchy and a list.

---

## 2. What I would use, in what order

Assume a small team and a real deadline.

### Phase 1 — the shell (day 1–2)

**Stack:** whatever you already know. Their choice of Nuxt is incidental; nothing about
this design needs Vue. Astro or SvelteKit or plain Vite + TypeScript will all do it. What
you actually need is:

- **GSAP 3.15** — non-negotiable if you want to match this. You need **CustomEase**
  (free), and you'll want **SplitText** (Club) for line splitting.
  *Cheaper substitute:* CSS `cubic-bezier` approximations of the custom eases plus
  [`splitting.js`](https://splitting.js.org/) or a 30-line line-splitter of your own.
  Honestly, `SplitText` handles re-splitting on resize correctly and rolling that yourself
  is a bad afternoon. Buy the licence.
- **DrawSVG** (Club) only if you want the pip rail exactly. `stroke-dasharray` +
  `stroke-dashoffset` gets you 90 % of it for free.
- **No** ScrollTrigger, **no** Lenis, **no** Locomotive, **no** Swiper. They aren't used
  here and you don't need them.
- **Lethargy** (MIT, tiny) — copy it in. This is the piece most rebuilds miss.

**Build the fluid root first, before any layout:**

```css
:root { --size: 390 }
@media (min-width: 650px) { :root { --size: 1500 } }
@media (orientation: portrait) and (min-width: 650px) and (max-width: 1100px) { :root { --size: 834 } }
html { font-size: clamp(1px, 10 * 100vw / var(--size), 12px) }
```

Then use `rem` for *everything* and never write a media query for a font size again. Set
your `--size` to whatever width your designer actually draws at. This one rule is the
highest-leverage thing in the entire capture and it takes five minutes.

**Then the slide machine.** Roughly 80 lines:

```js
const slides = [...]           // 5 for you: entry, parlour, bedrooms, top floor, roof
let current = 0, last = 0, locked = false
const lethargy = new Lethargy(8, 50)

const advance = debounce((e, y) => {
  if (!lethargy.check(e) && hasFinePointer) return
  if (locked || overlayOpen) return
  const next = current + -Math.sign(y)
  if (next < 0 || next >= slides.length) return
  last = current; current = next
  transition()
}, 50)

function transition() {
  locked = true
  gsap.timeline()
    .fromTo(state, { progress: 0 },
      { progress: 1,
        duration: last === 0 ? 2.25 : 1.5,
        ease: 'snappy',
        onUpdate: render },
      last === 0 ? 0.5 : 0)
    .add(() => { locked = false })
}
```

Ship this with plain `<img>` crossfades and no WebGL. **Look at it.** If the pacing is
right, it will already feel most of the way there, and you'll know what the shader is
actually buying you before you pay for it.

### Phase 2 — type, reveals, chrome (day 3–4)

- The `unmask` CustomEase: `CustomEase.create('unmask', 'M0,0 C0.16,1 0.3,1 1,1')`.
- One reusable reveal, registered as a GSAP effect exactly as they do it — masked lines
  from `yPercent: 100`, 1.5 s, 0.1 stagger. Use it for everything.
- **Split by line. Never by character**, except possibly once, on the intro headline, and
  even then use `from: 'random'`. Character staggers left-to-right are the single most
  common way a luxury site tips over into a template.
- Persistent nav that never hides. Menu toggle top-left on desktop, top-right on mobile,
  with the 17.5° bar rotation over a full second.
- The pip rail. It's small and it's the nicest thing on their site.
- The `.uline` / `.uline-double` underline pair — twenty lines of CSS, enormous return.

### Phase 3 — the menu overlay and the lightbox (day 5)

The menu open is one line of interest: `clip-path: inset(0 10% 100% 10%) → inset(0 0 0 0)`
over 1.125 s on `expo.inOut`, with the image counter-mask at +0.35 s and the links
`textMasks`-ing in at +0.5 s. The close is a plain reverse with no stagger.

Do the lightbox properly, which means **doing what they didn't**: `Escape` to close, left
and right arrows to navigate, a focus trap, and `aria-live` on the caption. Their gallery
has no keyboard support at all and their global arrow-key handler is still live behind it.
It's the one clear defect in an otherwise meticulous build and it takes an hour to beat.

### Phase 4 — decide about WebGL (day 6+, or never)

Now that you have a working site, decide honestly. See §3.

### Phase 5 — the thing they skipped

```css
@media (prefers-reduced-motion: reduce) { … }
```

They evaluate the media query on boot, store it on a feature object, and **never read it
again**. There is no reduced-motion CSS anywhere in their 31.9 KB.

Half a day's work for you:

- `gsap.globalTimeline.timeScale(4)` or set every duration to ~0.1 s.
- Cut the entrance descent to a hard cut. Nobody who set that preference wants an
  eight-second camera move.
- Replace the wipe with a plain opacity crossfade.
- Keep the custom cursor off entirely.

Also worth doing, and also missing from theirs: give the slide machine real keyboard
support (Arrow keys and Page Up/Down already work by accident; `Home`/`End` and a visible
focus ring do not), and put a `<noscript>` with the real content in it for anyone whose
JS fails — right now their page is empty without it.

---

## 3. The WebGL question — read this before you spend money

Their site has two Three.js layers and they are very different propositions.

**Layer A — the transition shader.** A single full-screen quad. The whole thing is about
40 lines of GLSL and it does: `object-fit: cover` in-shader, a hard-edged horizontal wipe
via `step(progress, vUv.y)`, and a counter-parallax where the outgoing image travels
−50 % of UV height while the incoming travels +50 % → 0.

**Worth it. Build it.** It is a day's work for someone comfortable with a fragment shader,
it is the actual signature of the site, and there is no good DOM equivalent — you can fake
the wipe with `clip-path` but you cannot easily make the two images counter-parallax
behind a moving hard edge. Budget one day and take it.

**Layer B — the procedural sky.** Five layered cloud sprites drifted against each other by
a curl-noise map, four city silhouette plates, a tinting ramp, an HDR environment map, two
lens flares, and a seeded generator. **6.9 MB of textures, all of it blocking the
preloader.**

**Not worth it. Don't build it.** It is weeks of work, it is the reason their loading
screen exists at all, and — this is the important part — **it doesn't transfer to your
project.** Their whole concept is *altitude*: 111 West 57th is the skinniest supertall in
the world and the residence is 80 floors up, so "above the clouds" is literally the
product. Waverly Avenue is a four-storey townhouse in the Clinton Hill Historic District.
A cloud descent onto a Brooklyn brownstone block would be borrowed drama, and borrowed
drama is the thing that makes a site look like it's imitating a more expensive one.

**What to do with the entrance instead.** Keep the *shape* — a gate, a considered wait, a
deliberate arrival — and change the *content*. Options, best first:

1. **A slow push on one still.** Your best exterior rendering, `scale: 1.08 → 1` over
   8–10 s on `power2.inOut`, with the headline over it. Costs one image. This is what I'd
   do.
2. **A short silent video loop** of the street elevation — Clinton Hill has beautiful
   light. 3–4 MB, `muted loop playsinline`, poster frame first.
3. **A vertical reveal up the facade** — pan from the stoop to the roofline over 6 s. It
   is the townhouse equivalent of their descent, it's honest to a four-storey building,
   and it's a CSS `transform` on a tall image.

And **cut the preloader to match**. Their loading screen is only defensible because 6.9 MB
of textures genuinely has to arrive. If your entrance is one image, you don't get to make
people watch a percentage counter — that would be theatre without a reason, and people can
tell. Preload your first two slides, show the gate, let them in.

---

## 4. Mapping this onto 223 Waverly Avenue

From your drawings: a new-build in the Clinton Hill Historic District, StudioSC
Architecture, four storeys plus roof (812 SF roof area), with the entrance/foyer/library
sequence, kitchen, primary bath, powder room and typical baths all specified in the
interior deck.

Their six slides map onto yours almost exactly, which is lucky:

| Their slide | Yours | Source in your files |
|---|---|---|
| 0 · Hero over the city | **Hero — the facade on Waverly Avenue** | Landmarks deck: "Rendered views in site context" (pp. 20–24) and "Proposed street elevation along Waverly Avenue" (p. 19) |
| 1 · Entertaining Suite, 80th | **1st Floor — entrance, foyer, library** | Entrance Design deck — it's nine pages on exactly this sequence |
| 2 · Guest Suite, 81st | **2nd Floor** | Interior Design deck: kitchen, living |
| 3 · Primary Suite, 82nd | **3rd Floor — primary suite and bath** | Interior Design deck: "Primary Bathroom", oak vanity, stone counter |
| 4 · Crown Suite, 83rd | **4th Floor / roof terrace** | GC set: 4th floor and proposed roof |
| 5 · Contact | **Contact** | — |

A few notes on the translation:

- **Five slides, not six, is fine.** Four floors plus a contact card, with the hero as
  slide 0, gives you exactly their structure. Don't pad it.
- **Keep the floor labels off the slides**, like they do. Put "1st Floor" in the menu and
  in the floorplan panel, not over the photograph.
- **Your menu list writes itself:** Home · 1st Floor · 2nd Floor · 3rd Floor · Roof ·
  Floorplans · Contact. Seven items, same as theirs, same `01`–`07` indices.
- **You have something they don't: a landmarked historic context.** Their credits panel
  leans on SHoP and Studio Sofield. Yours can lean on the Clinton Hill Historic District,
  the Landmarks approval, and StudioSC — and a "Historic Photos" slide (p. 4 of the
  landmarks deck) would be a genuinely better use of a screen than a cloud.
- **Depth maps: don't bother.** I said earlier they'd be worth exporting. Having decoded
  the payload, their `map` field is `null` on all four slides — the depth machinery is
  built and unused, and the effect degrades to a flat ±0.4 % drift. Plain renderings are
  enough to match them. If you *do* have depth passes lying around, wiring them in would
  put you ahead of the reference, but it is not on the critical path.

### Assets you'll need per slide

- One landscape image, ~2440 px on the long edge (theirs are 3000 × 1900 natives).
- One **portrait** image for mobile (theirs are 786 × 1364) — do not just crop the
  landscape one; they art-direct this properly and it shows.
- A thumbnail (~1000 px) for the menu.
- A dominant colour and an LQIP. If you're on a CDN that gives you these free (DatoCMS,
  Imgix, Cloudinary, Vercel), use them — painting the dominant colour behind the slide
  before the image lands is why you never see a white flash between their floors.
- Optional: a gallery set per floor, and a plan JPEG + PDF.

### Typography

Theirs is Teodor (Pangram Pangram) + Neue Haas Grotesk Text Pro (Monotype), three weights
total, self-hosted, 95 KB. Both are paid.

If you want the same register without the same licences: **Editorial New** or
**PP Right Serif** for display, **Söhne** or **Neue Montreal** for text; or free —
**Instrument Serif** or **Fraunces** paired with **Inter Tight**. The specific faces matter
less than the ratio: one serif carrying every headline, one grotesk at two weights
carrying everything else, and the small-caps label at 1.4 rem/500/uppercase doing all the
labelling work.

### Colour

Steal the structure, not the hue. They have **one** colour — a warm taupe `#7c7262` — plus
white, plus black used only at 10 % and 50 %. Pick one warm neutral out of your own
material palette (the Interior Design deck's oak and stone will hand you one), use it at
100 %, 40 % and 20 %, and stop. Three colours is the brief.

---

## 5. Things I'd do differently from them

Not everything on their site is worth copying.

1. **Fix the reveal race.** Their intro reveal depends on `flags.loaded` firing *after* a
   local ready flag is set; on a fast enough load the watcher never runs and **the intro
   never appears** — you're left on a preloader reading 100 %. I hit this repeatedly while
   capturing and had to reload to get past it. Gate on both conditions with a computed, not
   on one watcher.
2. **Ship a fallback for `Enter`.** The entire site is behind a click. No JS, no site.
3. **Compress the scene textures.** Nine unoptimised PNGs, 6.9 MB, blocking. Three.js
   r173 supports KTX2/Basis and their bundle already includes the loader.
4. **Serve adaptive video.** They request Mux `high.mp4` only — an 11 MB progressive
   download — while the code checks for `mp4medium`/`mp4low` variants the CMS never fills
   in. Use HLS.
5. **Measure `auto=format`.** At 2440 px and `q=85` their AVIF transfers are 2–4× *larger*
   than the source JPEGs. Automatic format negotiation is not automatically a win.
6. **Give the lightbox a keyboard.** Escape, arrows, focus trap. One hour.
7. **Honour `prefers-reduced-motion`.** Half a day. See Phase 5.
8. **Reconsider the audio autoplay prompt.** "Enter experience" vs "Enter without sound"
   is a good pattern, but they preload 1.28 MB of MP3 during the intro *even for people who
   choose silence*. Load it after the choice.

---

## 6. The shortest possible version

If you build only this, you will have most of it:

- Fluid `rem` root, one design width, everything in `rem`.
- Six full-screen slides, `body { overflow: hidden }`, wheel captured through Lethargy,
  one gesture = one slide, input locked during a 1.5 s transition (2.25 s + 0.5 s hold off
  the hero).
- One easing curve for CSS (`cubic-bezier(.19,1,.22,1)`), one for text (`unmask`), six
  durations, nothing else.
- One text reveal: masked lines from `yPercent: 100`, 1.5 s, 0.1 stagger. By line, never
  by character.
- Three colours. Hairline borders at 20–40 % opacity. No shadows.
- Ninety words. Nothing on the floor slides.

The shader is a day on top of that. The sky is a month, and it isn't your building.
