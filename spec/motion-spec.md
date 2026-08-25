# motion-spec.md — the interaction and motion system, forensically

Every number below is read out of the site's own source — the GSAP calls in
`/_nuxt/2_41x0yF.js` and the transition declarations in the stylesheet — not estimated
from watching. Where a value is inferred rather than read, it says so.

GSAP durations are in seconds because that is how they are written; the millisecond
equivalent is given where it helps.

---

## 0. The one-paragraph version

There is no scroll. The page is exactly one viewport tall, `body { overflow: hidden }`,
and the wheel is captured entirely. The site is **six full-screen slides** advanced one
at a time by a deliberate wheel gesture, filtered through **Lethargy** so trackpad
inertia can't skip ahead. Slide imagery lives in a **Three.js full-screen shader quad**
and transitions with a hard horizontal wipe plus a counter-parallax, over **1.5 s** on a
custom ease called `snappy` (2.25 s with a 0.5 s hold when leaving the hero). Text
reveals are all the same move — masked lines sliding up from `yPercent: 100` on a custom
ease called `unmask`. Every CSS hover in the building uses one curve,
`cubic-bezier(.19, 1, .22, 1)`, at one of six durations. That restraint is the whole
effect.

---

## 1. Scroll mechanics

### 1.1 There is no document scroll

```
document.documentElement.scrollHeight === window.innerHeight
html { overflow: visible }
body { overflow: hidden; overscroll-behavior: none; width: 100% }
```

No scrollbar, no `scroll-snap`, no ScrollTrigger pins, no scrubs. `ScrollTrigger` is
imported into the bundle but `ScrollTrigger.getAll()` is empty at runtime — nothing uses
it. **Nothing on this site is pinned and nothing is scrubbed**, because there is no
scroll position to scrub against.

### 1.2 The hand-rolled virtual scroll

A Nuxt plugin installs these listeners and emits a synthetic `vs` event on an internal
event bus:

```js
window.addEventListener('wheel',      onWheel, { passive: true })
window.addEventListener('touchstart', onDown,  { passive: true })
window.addEventListener('touchmove',  onMove,  { passive: true })
document.addEventListener('keydown',  onKey)
```

Normalisation, verbatim:

| Input | Formula | Notes |
|---|---|---|
| wheel | `y = (e.wheelDeltaY \|\| e.deltaY * -1) * MULT` | `MULT = 0.9` on Windows, **`0.4` everywhere else** |
| touch | `y = (currentPageY - lastPageY) * 3` | touch multiplier **3** |
| `ArrowUp` (38) | `y = 120` | |
| `ArrowDown` (40) | `y = -120` | |
| `Space` (32) | `y = (viewportHeight - 40) * (shiftKey ? 1 : -1)` | ignored when an `<input>` has focus |

A GSAP `ticker` callback runs every frame and emits `tick` carrying
`gsap.ticker.deltaRatio(60)`, so every lerp in the app is frame-rate independent. This
is the correct way to do it and worth copying verbatim.

### 1.3 One gesture = one slide

The `vs` handler is wrapped in **`lodash.debounce(fn, 50)`** and gated by
**`new Lethargy(8, 50)`** (stability 8, sensitivity 50). Lethargy's job is to tell a
deliberate flick from the long inertial tail a trackpad produces; without it a single
two-finger swipe would fire twenty slide changes.

```js
const config = { duration: 1.5, ease: 'snappy' }

onVirtualScroll(({ y, oe }) => {
  if (!lethargy.check(oe) && hasMouse) return          // inertia — ignore
  if (isTransitioning) return                          // locked during a transition
  if (!flags.entered) return                           // intro not dismissed yet
  if (flags.content || gallery.active || plans.active || info.active) return  // an overlay owns the wheel

  const dir  = -Math.sign(y)                           // wheel down => forward
  const next = current + dir
  if (next < 0 || next > total) return                 // hard clamp, no wrap, no rubber-band
  last = current; current = next
  run()
})
```

Guard conditions to reproduce exactly: **transitions are not interruptible**, there is
**no wrap-around** at either end, and any open overlay (menu, lightbox, floorplans,
legal) takes the wheel entirely.

### 1.4 The slide transition

```js
timeline
  .clear()
  .add(() => { images.change(last, current); maybePlayWebGL() })
  .fromTo(images, { progress: 0 }, {
      progress: 1,
      duration: last === 0 ? 2.25 : 1.5,       // 2250 ms leaving the hero, else 1500 ms
      ease: 'snappy',
    },
    last === 0 ? 0.5 : 0                        // 500 ms hold before leaving the hero
  )
  .add(() => { isTransitioning = false; maybePauseWebGL() })
  .restart()
```

So: **1500 ms** normally; **500 ms delay then 2250 ms** on the very first move off the
hero, i.e. 2750 ms total. That one longer, delayed first transition is a deliberate
"the building is letting you in" beat — a small thing that reads as expensive.

WebGL is `play()`ed when entering slide 0 or the last slide (the animated sky is only
visible there) and `pause()`d in between, which is why the interiors stay at a rock-solid
frame rate.

### 1.5 Slide model

`content = [overview, ...interiors, contact]` → **6 slides**, indices 0–5:

| # | Slide | WebGL world state |
|---|---|---|
| 0 | Overview / hero (over the city) | `CITY` (forced) |
| 1 | Entertaining Suite — 80th Floor | `INTERIOR` |
| 2 | Guest Suite — 81st Floor | `INTERIOR` |
| 3 | Primary Suite — 82nd Floor | `INTERIOR` |
| 4 | Crown Suite — 83rd Floor | `INTERIOR` |
| 5 | Contact | `CLOUDS` (forced) |

Menu navigation calls `slides.instant(i)` — a **hard cut with no tween**, which is the
right call: a 1.5 s wipe from slide 0 to slide 5 would look broken.

---

## 2. Preloader and first paint

### 2.1 The loading state

White ground. Centred, in gold (`#7c7262`):

- The percentage, `.h5` (Teodor 2.6 rem, `leading-none`), reading `0%` → `100%`.
- Directly beneath it a full-width `<hr class="intro__line border-gold/40">` that is the
  progress bar:

```css
.intro__line { --scale: 0; transform: scaleX(var(--scale));
               transform-origin: left; transition: transform .25s ease-out; }
```

  JS sets `--scale` to `percent / 100` via `gsap.set()`; the 250 ms CSS transition does
  the smoothing. Cheap, and it feels better than tweening the number.
- At the bottom of the screen, `LOADING` in `.label` (1.4 rem, 500, uppercase).

Percent comes from the WebGL world's own texture-preload counter, polled on every `tick`
and unsubscribed at 100.

### 2.2 The entrance sequence

Fires when the world reports loaded **and** fonts + audio have preloaded. Built with
`SplitText` on the headline (`words, chars`) and on the paragraph (`lines`, with a second
pass adding an `overflow-hidden` line wrapper).

Timeline, with a label `start` placed at **t = 1.0 s**:

| Time (s) | Target | From → To | Duration | Ease |
|---|---|---|---|---|
| 0 | content layer | `alpha: 1` (set) | — | — |
| `start+0.25` = 1.25 | progress `<hr>` | `alpha: 0` (set) | — | — |
| `start` = 1.00 | `100%` and `LOADING` | `yPercent: wrap([-100, 100])` — one flies up, one flies down | **0.75** | `power2.in` |
| — | preloader block | removed from the DOM | — | — |
| `start` = 1.00 | two white half-screen masks (`top-0 h-1/2`, `bottom-0 h-1/2`) | `yPercent: wrap([-100, 100])` — the white curtain splits and slides apart | **2.0** | `power3.inOut` |
| `start+1` = 2.00 | headline `<h1>` | `scale: .85 → 1` | **3.0** | `power3` |
| `start+1` = 2.00 | headline **characters** | `alpha: 0 → 1`, `stagger: { each: 0.05, from: 'random' }` | **3.0** | `linear` |
| `start+1.25` = 2.25 | paragraph **lines** | `yPercent: 100 → 0` | **3.0**, stagger **0.14** | `unmask` |
| `start+1.5` = 2.50 | both buttons | `y: 1.5rem → 0`, `alpha: 0 → 1`, stagger **0.2** | **2.0** | `power3` |

Total ≈ 5.5 s. Two details make it: the **random-order character fade** (not
left-to-right — it reads as the words condensing out of the air) and the fact that the
headline is *simultaneously* scaling from 0.85 over 3 s, so the type settles rather than
appears.

Copy, verbatim:

> **ABOVE THE CLOUDS** *(uppercase, Teodor, `letter-spacing: .375em`, `line-height: 1.05`, `text-50` mobile / `text-80` tablet portrait / `text-100` desktop, `perspective: 100vw`)*
>
> Rise above the hustle and bustle of the city and escape to your private sanctuary in the clouds. Experience a world of endless horizons.
>
> `[ ENTER EXPERIENCE ]`   ·   Enter without sound

Behind it: `bg-black/10` over the live WebGL cloud scene.

### 2.3 The gate, and the exit

The experience does not start until the visitor clicks. Two choices — **Enter
experience** (with audio) and **Enter without sound** (a plain `.uline-double` text
button, bottom centre). Both run the same exit:

| Time (s) | Target | To | Duration | Ease |
|---|---|---|---|---|
| 0 | paragraph, both buttons, scrim | `alpha: 0` | **0.75** | `power1.in` |
| 0 | headline | `scale: 2.5`, `alpha: 0` | **1.5** | `power1.in` |
| ~1.5 | intro layer | removed from the DOM | — | — |
| 0 | WebGL world | `scroll: 0 → 1` | **8.0** | `power2.inOut` |
| 7.0 | ambient audio | `/sound/ambient.mp3` starts | — | — |
| end | `flags.entered = true` | wheel input unlocks | — | — |

That `scroll: 0 → 1` over **8 seconds** is the signature move: the headline blows past
the camera at 2.5× while the camera descends through the cloud deck for eight seconds
and arrives at the tower with the city beneath it. The wheel is dead for the whole eight
seconds — you are made to watch it.

Audio: **howler.js 2.2.4**, `/sound/background.mp3` on enter, `/sound/ambient.mp3`
cross-started one second before the descent ends. A `SOUND` toggle with a small animated
equaliser sits bottom-left for the rest of the session.

---

## 3. Reveal-on-scroll

There is no scroll, so nothing is triggered by viewport thresholds. Reveals are driven by
**Vue `<Transition>` enter/leave hooks** as slides mount and unmount. Functionally the
same, but there is **no `IntersectionObserver` threshold to copy** — the trigger is
"this slide became current".

(`IntersectionObserver` appears exactly once in the bundle, on an `observe-vid` directive
that plays/pauses `<video>` elements. Nothing else uses it.)

### 3.1 `textMasks` — the reusable text reveal

Registered as a GSAP effect at boot; used by the menu and available everywhere:

```js
gsap.registerEffect({
  name: 'textMasks',
  effect: (targets, c) => gsap.from(targets, {
    duration: c.duration, yPercent: 100, stagger: c.stagger, delay: c.delay, ease: c.ease
  }),
  defaults: { duration: 1.5, stagger: 0.1, delay: 0, ease: 'unmask' },
  extendTimeline: true,
})
```

**Reveal granularity by element:**

| Element | Split by | Property | From → To | Duration | Stagger | Ease |
|---|---|---|---|---|---|---|
| Intro headline | **characters** (SplitText `words, chars`) | `opacity` | 0 → 1 | 3.0 s | 0.05, `from: 'random'` | `linear` |
| Intro paragraph | **lines** | `yPercent` | 100 → 0 | 3.0 s | 0.14 | `unmask` |
| Hero eyebrow | not split | `yPercent` + `alpha` | 100 → 0, 0 → **0.7** | 1.5 s | — | `unmask` |
| Hero headline | **lines** | `y` + `alpha` | `3rem` → 0, 0 → 1 | 1.5 s | 0.1 | `unmask` |
| Hero paragraph | **lines** | `yPercent` + `alpha` | 100 → 0, 0 → **0.7** | 1.5 s | 0.1 | `unmask` |
| Hero price | not split | `yPercent` + `alpha` | 100 → 0, 0 → 1 | 1.5 s | — | `unmask` |
| Menu links | whole elements (`.js-slide`) | `yPercent` | 100 → 0 | 1.5 s | 0.05 | `unmask` |
| Contact card contents (`.js-fade-up`) | not split | `y` + `alpha` | `3rem` → 0, 0 → 1 | 1.5 s | 0.1 | `unmask` |

**Character-level animation is used exactly twice on the whole site**, and never for a
reveal after the first screen: once on the three words of the intro headline (random
order), and once on the looping "Scroll to explore" hint, where each character dims to
`alpha: .125` and back on a 3 s infinite loop, `stagger: .05`, `linear` — the only thing
on the site that moves when the visitor does nothing. Everything else reveals by line or
by whole element. That discipline is what keeps it from feeling like a template.

Note the alpha targets of **0.7** on the hero eyebrow and paragraph — the secondary copy
never reaches full white. Small, and it does a lot of the work.

### 3.2 Hero copy entrance (slide 0)

```js
gsap.timeline({ defaults: { duration: 1.5, stagger: 0.1, ease: 'unmask' } })
  .fromTo(eyebrow,   { yPercent: 100, alpha: 0 }, { yPercent: 0, alpha: 0.7 }, 0.35)
  .from(titleLines,  { y: '3rem', alpha: 0 },                                  0.50)
  .fromTo(textLines, { yPercent: 100, alpha: 0 }, { yPercent: 0, alpha: 0.7 }, 0.70)
  .from(price,       { yPercent: 100, alpha: 0 },                              0.90)
```

Four elements, 0.35 s apart, each 1.5 s long — so they overlap heavily and read as one
gesture rather than four.

### 3.3 Contact card entrance (slide 5)

```js
gsap.timeline({ paused: true, defaults: { duration: 1.5, ease: 'snappy' } })
  .fromTo(box, { clipPath: 'inset(0 0 100% 0 round .4rem)' },
               { clipPath: 'inset(0 0 0% 0 round .4rem)' },        0.50)
  .from('.js-fade-up', { alpha: 0, y: '3rem', stagger: 0.1, ease: 'unmask' }, 0.75)
  .from('.js-scale',   { scaleX: 0, ease: 'snappy' },                          0.85)
```

Leave: `to(box, { alpha: 0, duration: 0.75, ease: 'linear' })`.

The card wipes up from its own bottom edge with the corner radius carried inside the
`clip-path` (`round .4rem`), so the rounded corners are correct throughout the reveal
rather than appearing at the end. That's the detail most rebuilds get wrong.

### 3.4 Numbers

Nothing counts up. The stat block (11,480 sq ft / 618 sq ft / N,E,S,W / 5-6 / 2) is
static text revealed with `.js-fade-up` like everything else. **There is no odometer
anywhere on this site**, which for a nine-figure listing is a choice — counters read as
startup-y.

---

## 4. Parallax

Two mechanisms, both subtle.

### 4.1 In-shader slide parallax (during a transition only)

Inside the transition fragment shader:

```glsl
float parallax = -0.5;
float directedProgress = u_direction == 1 ? u_progress : 1.0 - u_progress;
vec2 offset1 = vec2(0.0,  directedProgress        * parallax);   // outgoing image
vec2 offset2 = vec2(0.0, (directedProgress - 1.0) * parallax);   // incoming image
```

The outgoing image travels **0 → −50 % of its own UV height** while the incoming travels
**+50 % → 0**. Because the wipe edge moves at 100 % over the same period, the two images
slide past each other at **half** the rate of the wipe — a true parallax between the two
plates. This is the single biggest contributor to the "expensive" feel of the transition.

### 4.2 Cursor parallax (continuous)

```glsl
float depth = ((texture2D(u_map, uv + offset).r) - 0.5) * 2.0;
vec2  d     = u_mouse * depth * 0.01 * (0.4 * u_strength);
```

`u_mouse` is the cursor in −1…1 NDC, taken from the **smoothed** cursor position (see
§7), not the raw one. Maximum displacement is **±0.4 % of UV** — around ±6 px on a
1440 px-wide image. It is deliberately almost imperceptible.

> **Important finding:** the depth-map field (`map`) is **`null` on every slide** in the
> live CMS payload. The shader falls back to a 1×1 white texture, so `depth` evaluates to
> a uniform `1.0` and the effect degrades to a flat ±0.4 % drift of the whole image. The
> depth-parallax machinery is built and wired but **not in use**. If you supply real
> depth maps you will exceed the reference, not match it.

There is **no other parallax** — no differing-rate layers, no background/foreground
offsets, no `translateY` tied to progress.

---

## 5. Image transitions — the shader

Every slide change is one full-screen `THREE.ShaderMaterial` quad (`canvas.gl-slides`,
`position: absolute; inset: 0`), rendered on the same GSAP ticker as everything else.

**Renderer:** `antialias: true`, `alpha: true`, `depth: false`, `stencil: false`,
`premultipliedAlpha: true`, `setClearColor(0, 0)`,
`setPixelRatio(Math.min(2, devicePixelRatio))`. Geometry is a single oversized triangle
(3 verts, not a quad) — a small, correct optimisation.

**Uniforms:** `u_texture1`, `u_texture2`, `u_map1`, `u_map2`, `u_progress`, `u_size`,
`u_res`, `u_direction`, `u_mouse`, `u_strength`.

**The transition itself:**

```glsl
float mask = step(directedProgress, vUv.y);
gl_FragColor = mix(texture2, texture1, mask);
```

`step()` — so it is a **hard-edged horizontal wipe**, not a crossfade. There is no
feather, no blur, no dissolve. The edge sweeps vertically across the screen while the two
images counter-parallax behind it. Direction flips with `u_direction` so scrolling back
runs the wipe the other way.

Cover-fit is done in the shader with a `uvCover(screenSize, imageSize, uv)` helper
replicating `object-fit: cover`, so the image never distorts and the aspect logic lives
in one place.

**Timing** is entirely §1.4: `u_progress` 0 → 1 over 1.5 s (2.25 s off the hero) on
`snappy`.

**No scale-on-scroll.** Images are never scaled by progress. The only scale moves on the
site are the intro headline (0.85 → 1, then → 2.5 on exit) and the 1.025 image hover.

---

## 6. Navigation

### 6.1 Persistent chrome — always visible, never hides

The nav layer is `position: fixed; inset: 0; pointer-events: none; z-index: 10`, with
`pointer-events: auto` on the controls. **It never hides on scroll-down and never
reappears on scroll-up** — there is no scroll direction to respond to. It fades in once
`flags.entered` is true (`<Transition name="fade">`, 0.5 s `ease-out`) and hides only
while a full-screen content overlay is open on mobile.

| Control | Desktop | Mobile |
|---|---|---|
| Menu toggle | `top: 3rem; left: 2rem` | `top: 3rem; right: 2rem` |
| "Inquire" button | `top: 2rem; right: 2rem` | hidden |
| Sound toggle | — | `top: 6rem; right: 2rem` |
| Slide pips | `right: 2rem`, vertically centred | same |
| Slide-down button | `left: 2rem`, vertically centred | same |
| Logo | centred, inside the menu overlay | left, inside the menu overlay |

**Menu toggle icon** — two 1px bars in a `w-32 h-[.1rem]` box:

```css
.menu-toggle__icon::before { transform: translateY(-.4rem); transition: transform 1s cubic-bezier(.19,1,.22,1) }
.menu-toggle__icon::after  { transform: translateY( .4rem); transition: transform 1s cubic-bezier(.19,1,.22,1) }
.menu-toggle.is-active .menu-toggle__icon::before { transform: translateY(0) rotate( 17.5deg) }
.menu-toggle.is-active .menu-toggle__icon::after  { transform: translateY(0) rotate(-17.5deg) }
```

Note **17.5°, not 45°** — the bars form a shallow cross, not an X. Over a full **1 s**.
Slower and less literal than the usual burger-to-X, and it reads as more considered.
The label beside it swaps `Menu` ⇄ `Close` through a `fade` transition in `out-in` mode.

### 6.2 The full-screen menu overlay

Open (`onEnter`), timeline defaults `{ duration: 1.125, ease: 'expo.inOut' }`:

| Time (s) | Target | From | Notes |
|---|---|---|---|
| 0 | overlay | `clipPath: inset(0 10% 100% 10%)` → `inset(0 0 0 0)` | grows **up from the bottom edge and outward from 10 % inset on each side** simultaneously |
| 0.35 | menu image + its inner wrapper | `yPercent: wrap([100, -100])` | classic counter-mask: the frame slides up, the image slides down inside it |
| 0.50 | every `.js-slide` | `.textMasks(..., { stagger: 0.05 })` → `yPercent: 100 → 0`, 1.5 s, `unmask` | the seven links and their index numbers |

Close (`onLeave`): `to(overlay, { clipPath: 'inset(0 10% 100% 10%)' })`, 1.125 s
`expo.inOut`, then unmount. The close is a plain reverse of the clip — **no stagger on
the way out**, which is why it feels decisive rather than fussy.

**Menu items:** Home · Entertaining Suite · Guest Suite · Primary Suite · Crown Suite ·
Floorplans · Contact. Each with a two-digit index (`01`…`07`) at `opacity: .4`, offset
`-8rem` to the left on desktop.

**Hover** — dim the siblings, not brighten the target:

```css
.menu-link { transition: opacity .35s ease-out }
.menu-links:hover .menu-link { opacity: .3 }
.menu-link:hover { opacity: 1 !important }
```

Bottom row: `Visit main site` · `Credits` · `Legal` (1.2 rem uppercase, `.uline`) with the
phone number right-aligned in Teodor at 2.6 rem.

Selecting a slide calls `slides.instant(i)` — an immediate jump, no wipe.

### 6.3 Slide pips (right rail) — the nicest small thing on the site

Six pips, `right: 2rem`, `gap: 2rem`, each a 22 × 22 SVG: a `r=10` circle with
`stroke-width: 1`, plus a 4 × 5 rotated square (a diamond) at the centre.

The ring is animated with **DrawSVGPlugin**, per-pip, on a paused timeline:

```js
gsap.timeline({ paused: true, defaults: { duration: 1, ease: 'snappy' } })
  .fromTo(circle, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', ease: 'expo.inOut' })
  .addLabel('active')
  .to(circle, { drawSVG: '100% 100%' })
  .addLabel('inactive')
  .progress(1).progress(0)          // pre-render both states, then reset
```

On a slide change: `pips[current].tweenFromTo(0, 'active')` and
`pips[last].tweenTo('inactive')`. The ring **draws itself on** clockwise over 1 s, and
when it deactivates it **unwinds from the start point** rather than fading — the stroke
chases its own tail off the circle.

Entrance: `from(pips, { xPercent: -150, alpha: 0, duration: 1.5, stagger: 0.1, ease: 'unmask' })`,
then pip 0 activates at t = 0.25.

### 6.4 Slide-down button

Left edge, vertically centred. `size-28` mobile / `size-30` desktop, `border-radius: .3rem`,
with the border drawn as a `::before` at `opacity: .4`. A 10 × 10 chevron-plus-stem icon.
Click calls `slides.next()`.

---

## 7. Custom cursor

Present only under `(hover: hover) and (pointer: fine)`. Element `.fc`, offset
`-3rem/-3rem` so a 6 rem ring centres on the pointer, `z-index: 9999`,
`will-change: transform`, `pointer-events: none`.

**Positioning** — a lerp on the shared ticker, not a CSS transition:

```js
setX = gsap.quickSetter(el, 'x', 'px')
setY = gsap.quickSetter(el, 'y', 'px')

onTick(({ ratio }) => {                 // ratio = gsap.ticker.deltaRatio(60)
  const f = 0.1 * ratio                 // lerp factor 0.1 per 60fps frame
  cy = lerp(cy, y, f)
  cx = lerp(cx, x, f)
  setX(cx); setY(cy)
  emit('cursor:tick', { x: cx, y: cy }) // <- feeds the shader's u_mouse
})
```

`quickSetter` skips GSAP's tween machinery entirely — the correct tool. The **smoothed**
position is what drives the shader parallax, so image and cursor share one inertia.

**Parts:** a 60 px ring (`circle r=31`, `stroke-width: 2`, `vector-effect: non-scaling-stroke`),
a 7 px diamond dot, a text stack to the right (`left: 100%`, `padding-left: 1.5rem`,
`overflow: hidden`, 1.4 rem), and a `‹ ›` arrow pair.

**States** (all CSS, all on the shared curve):

| Class | When | Effect |
|---|---|---|
| *(rest)* | — | ring at `opacity: .5`, dot solid |
| `.is-active` | over a `button`, `a` or `.js-fc-dot`, **or** on any slide past index 4 | ring → `opacity: 0; transform: scale(.5)` — `transform .75s cubic-bezier(.19,1,.22,1)`, `opacity .5s ease-out`. The ring collapses into the dot. |
| `.is-first` | slide 0, entered, menu closed | shows **"Press & Hold"** — `opacity .5s ease-out` with a **0.5 s delay** in, 0 s out |
| `.is-timelapse` | slides 1–3, gallery closed | shows **"See the view"** |
| `.is-zoomed` | press-and-hold active, or lightbox open with >1 image | dot → `scale(0)`; the `‹ ›` arrows fade in and go `scale(.95) → scale(1)`, `.75s` expo-out with a **0.5 s delay** |

Also: any slide index > 0 forces `.is-active`, so the ring is only at full size on the
hero.

### 7.1 Press and hold — and the orbitable 3D model behind it

This is the most substantial interaction on the site and the easiest to miss, because
nothing labels it beyond the two words on the cursor.

**The DOM half.** On `mousedown` over the canvas, on slide 0, when entered:

```js
gsap.delayedCall(hasMouse ? 0.1 : 0.5, () => {
  flags.entered = false; flags.zoomed = true    // wheel locked, cursor switches to arrows
  gl.setState(ZOOM)
})
// mouseup:
gl.setState(CITY); flags.entered = true; flags.zoomed = false
```

**100 ms** hold threshold with a mouse, **500 ms** on touch. The hero copy fades out
(`fade`, 0.5 s) while zoomed, and the cursor swaps its dot for a `‹ ›` pair.

**The WebGL half.** `setState(ZOOM)` is only reachable from `CITY` — it is explicitly
refused from any other state. It pushes the camera in on a **real glTF model of the
tower**, `/gl/sothebys_111w57_04.glb` (**6.03 MB**), and then hands you
**`THREE.OrbitControls`**:

```js
await transitionToZoom()
zoomControls = new OrbitControls(camera, domElement)
zoomControls.enabled = false
zoomControls.target.copy(currentLookAt)
zoomControls.enabled = true
zoomControls.enableDamping = true
zoomControls.rotateSpeed   = isTouch ? 1 : 2
zoomControls.minPolarAngle = Math.PI * 0.62      // 111.6 degrees
zoomControls.maxPolarAngle = Math.PI * 0.75      // 135 degrees
zoomControls.enableZoom    = false
zoomControls.update()
storeControlsCoordinates(zoomControls)

// replay the ORIGINAL mousedown into the controls so press-and-hold flows
// straight into a drag with no discontinuity:
zoomControls._onPointerDown(originalMouseEvent)
originalMouseEvent.constructor.name === 'Touch'
  ? zoomControls._onTouchStart(originalMouseEvent)
  : zoomControls._onMouseDown(originalMouseEvent)
zoomControls.update()
```

So: **you can orbit the building.** Azimuth is unconstrained; the polar angle is clamped
to a **23.4-degree band between 111.6° and 135°**, so you can only ever look *up* at the
tower from below, and never over the top of it or level with it. Zoom is disabled —
distance is fixed. Damping is on.

Three details worth stealing:

1. **The event replay.** They pass the original `mousedown` straight into OrbitControls'
   private handlers. Without it, the visitor would press, wait 100 ms for the zoom, and
   then have to *release and press again* to start rotating. With it, the same continuous
   press becomes the drag. This is the difference between the interaction feeling like one
   gesture and feeling like two.
2. **The polar clamp is the art direction.** A free orbit would let you find every bad
   angle on the model. A 23-degree band means every frame you can reach is a hero shot.
3. **The exit duration is proportional to how far you rotated.** Releasing tweens the
   spherical coordinates back to the stored ones:

```js
const t = { theta: getAzimuthalAngle(), phi: getPolarAngle(), radius: getRadius() }
const duration = Math.min(Math.abs(t.theta - theta0) + Math.abs(t.phi - phi0), 1)
gsap.to(t, { theta: theta0, phi: phi0, radius: radius0, duration, ease: 'power3.inOut',
             onUpdate: () => { setAzimuthAngle(t.theta); setPolarAngle(t.phi);
                               setRadius(t.radius); update() } })
```

   Duration is `min(Δazimuth + Δpolar, 1)` seconds — a small nudge snaps back instantly, a
   full swing takes the whole second. Nothing feels laggy and nothing feels abrupt.

The model also carries **two hotspot meshes**, positioned in normalised model space at
`{x: .05, y: -.3}` and `{x: -1.06, y: -.33}`, on a holder at `y: 2` that is re-oriented to
face the camera every frame (`hotspotsHolder.lookAt(camera.position)`). The model itself
sits at `{x: -0.21, y: -9.5, z: 8.21}`, `rotation: -0.4916 rad`, `scalarScale: 7.66`.

**Environment:** two **UltraHDR** JPEGs — `HDR_AboveTheClouds.test.jpg` as the background
(rotated `-3.04 rad`) and `sothebys_111w57_reflection_Blurred.jpg` as the environment map
(rotated `-2.112 rad`). That second one is what puts a plausible sky reflection in the
tower's glass, and it is why the model reads as a photograph rather than a render.

---

## 8. Hover states

Every hover is gated behind `@media (hover: hover) and (pointer: fine)` and every one of
them uses `cubic-bezier(.19, 1, .22, 1)`.

**Single underline** — swaps the transform origin so it wipes out the way it came:

```css
.uline::before {
  height: .05em; min-height: 1px; background: currentColor;
  transform: scaleX(0); transform-origin: right;
  transition: transform .75s cubic-bezier(.19,1,.22,1);
}
.uline:hover::before { transform: scaleX(1); transform-origin: left }
```

**Double underline** — two rules that hand off, used on email/phone and "Enter without
sound". The resting line retracts to the right while a new one draws in from the left,
200 ms behind it:

```css
.uline-double::before { transform: scaleX(1); transform-origin: left;  transition: transform .75s var(--e); transition-delay: .5s }
.uline-double::after  { transform: scaleX(0); transform-origin: right; transition: transform .75s var(--e); transition-delay: 0s }
.uline-double:hover::before { transform: scaleX(0); transform-origin: right; transition-delay: 0s }
.uline-double:hover::after  { transform: scaleX(1); transform-origin: left;  transition-delay: .2s }
```

**Image scale** — `transform: scale(1.025)` over **1.5 s**. A 2.5 % move over a second
and a half; you register it as the image breathing, not as a hover.

```css
.h-scale { transition: transform 1.5s cubic-bezier(.19,1,.22,1) }
.h-trig:hover .h-scale { transform: scale(1.025) }
```

**Icon-shape swap** (gallery arrows) — one shape leaves at 100 %, its replacement arrives
from −100 %, with 150 ms of delay on whichever is trailing:

```css
.h-shape__shape          { transition: transform .75s var(--e) }
.h-shape__shape:first-child  { transition-delay: .15s }
.h-shape__shape:nth-child(2) { transform: translateX(-100%); transition-delay: 0s }
.h-shape:hover .h-shape__shape:first-child  { transform: translateX(100%); transition-delay: 0s }
.h-shape:hover .h-shape__shape:nth-child(2) { transform: translateX(0);    transition-delay: .15s }
```

**Close "X"** — `.x-trig:hover .x { transform: rotate(90deg) }`, 0.75 s.
**Plus/minus** — the vertical bar rotates from −90° to 0°, 0.75 s.

### 8.1 The primary button (`.btn-norm`)

The most elaborate component on the site. Everything is driven from custom properties, so
it re-skins in one place:

```css
--color-primary: #7c7262;   --color-secondary: #fff;
--height: 4em;  --padding-left: 1.35em;  --padding-right: 1.35em;
--border-radius: .3em;  --border-opacity: .4;  --arrow-width: 1.2em;
--transition-duration: 1s;  --transition-timing: cubic-bezier(.785,.135,.15,.86);
```

- Rest: transparent, gold 1px border at 40 % opacity, gold uppercase label
  (1.4em of 1rem, weight 500, `padding-top: .075em` to optically centre the caps).
- Hover: the solid gold fill wipes up via
  `clip-path: inset(100% 0 0 0) → inset(0 0 0 0)` over **1 s** on `cubic-bezier(.785,.135,.15,.86)`,
  and the label turns white against it.
- Simultaneously the label slides right by half the arrow width plus gap, and the arrow
  performs a two-arrow swap: the resting arrow exits right (`translateX(100%)`, 0.75 s
  `cubic-bezier(.455,.03,.515,.955)`, no delay) while a second arrow enters from the left
  (75 ms delay). The label move uses the 1 s curve, the arrows the 0.75 s one — they
  deliberately do not finish together.

---

## 9. Gallery / lightbox

Opened by clicking anywhere on an interior slide (a full-screen `pointer-events: auto`
layer on slides > 0), which loads that floor's **timelapse video**; also from the
floorplan and "modal" image sets (13 images on the Entertaining Suite, 3 on the Guest
Suite, 4 on the Primary Suite, 0 on the Crown Suite).

- **Open/close:** `<Transition name="fade">` — `opacity` over **0.5 s `ease-out`**. That
  is all. Backdrop is `bg-black/50`.
- **Between items:** `<Transition name="fade" mode="out-in">` — the outgoing image fades
  out fully before the incoming fades in. Caption swaps the same way, keyed on index.
- **Advance:** click anywhere on the image area → next. Index wraps with
  `gsap.utils.wrap(0, n, i ± 1)`.
- **Swipe:** `touchstart`/`touchend`, threshold **50 px** of horizontal travel; left →
  next, right → previous. Ignored with a single item.
- **Arrows:** shown only when `items.length > 1`. `size-28` mobile / `size-70` tablet,
  white ground, gold border at 40 %, `border-radius: .3rem`, with the `.h-shape` swap
  above.
- **Caption:** 1.4 rem uppercase gold, from the asset's `title` or `alt`.
- **Sizing:** `.slide-image { aspect-ratio: var(--aspect); max-height: 100svh }`, and
  `max-height: calc(100svh - 16rem)` at ≥1100 px. Aspect comes from the asset's own
  `responsiveImage.aspectRatio`, defaulting to `0.5625`.

**Keyboard support: none.** No `Escape`, no arrow keys, no focus trap, and the close
button is the only keyboard-reachable control. The only `keydown` handler on the site is
the virtual-scroll one, and it is still live while the lightbox is open — so `ArrowDown`
inside the lightbox does nothing useful. **Fix this in your rebuild**; it is the clearest
defect in an otherwise meticulous build.

---

## 10. Video

- **Source:** Mux. `https://stream.mux.com/<playbackId>/high.mp4`, poster from
  `https://image.mux.com/<playbackId>/thumbnail.jpg`. Two timelapses exist, on the
  Entertaining Suite and the Primary Suite (11.0 MB and 7.8 MB respectively) — the Guest
  and Crown suites have a `timelapse` field but no video.
- **Attributes:** `muted`, `loop`, `playsinline`; no `controls`. Playback is bound to an
  `observe-vid` directive backed by `IntersectionObserver`.
- **There is no background video.** The moving sky behind the hero and the contact slide
  is **procedurally generated WebGL**, not a video loop — there is a seeded cloud
  generator (`current cloud seed: 7059401` is logged on boot). The tower itself is a
  6.03 MB glTF model. That is why it stays sharp at any viewport size, and why you can
  orbit it (§7.1) — neither is possible with a video loop.
- **Low-power detection:** on boot the site attempts to play a tiny muted video and
  checks whether it stayed paused. If it did (iOS low-power mode), `lowPowerMode` is set
  and **every video is replaced by its poster frame** for the session. Elegant, and cheap
  to copy.

---

## 11. Reduced motion

```js
features.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
```

The query is evaluated on boot and stored on the feature object — **and never read
again.** It is not referenced anywhere else in the bundle, and there is no
`@media (prefers-reduced-motion)` rule in any of the 31.9 KB of CSS.

**`prefers-reduced-motion` changes nothing on this site.** A visitor with the OS
preference set still gets the 8-second camera descent, the character-by-character
headline, the wipes and the lerped cursor. Given the audience this is a real
accessibility gap and it is trivially fixable — see `REBUILD.md`.

---

## 12. Cheat sheet

```
EASES
  unmask       CustomEase  M0,0 C0.16,1 0.3,1 1,1                     — all text reveals
  snappy       CustomEase  M0,0 C0.094,0.026 0.124,0.127 0.157,0.29
                           0.197,0.486 0.254,0.8 0.348,0.884
                           0.42,0.949 0.374,1 1,1                     — slide + card + pips
  expo-hard    CustomEase  M0,0 C0.084,0.61 0.156,0.822 0.218,0.883
                           0.287,0.951 0.374,1 1,1                    — registered, unused
  expo.inOut   GSAP built-in                                          — menu clip, pip draw
  power1.in / power2.in / power2.inOut / power3 / power3.inOut / linear
  cubic-bezier(.19,1,.22,1)      — every CSS hover  (expo-out)
  cubic-bezier(.785,.135,.15,.86)— button fill wipe (circ-in-out)
  cubic-bezier(.455,.03,.515,.955)— button arrows   (sine-in-out)

DURATIONS
  0.25s  preloader bar step (CSS)
  0.35s  menu-link dim
  0.50s  every opacity fade (Vue `fade` transition), cursor label
  0.75s  every underline, cursor ring, icon swap, card leave
  1.00s  menu-toggle icon, pip ring draw, button fill
  1.125s menu overlay open/close
  1.50s  every text reveal · slide transition · image hover scale
  2.00s  intro curtain split · intro buttons
  2.25s  first slide transition off the hero (+0.5s delay)
  3.00s  intro headline scale + character fade + paragraph lines
  8.00s  the entrance camera descent

STAGGERS
  0.05  intro characters (random order) · menu links
  0.10  hero lines · contact card items · pip entrance
  0.14  intro paragraph lines
  0.20  intro buttons

DISTANCES
  yPercent 100      every masked line reveal
  y 3rem            hero title lines, contact card items
  y 1.5rem          intro buttons
  xPercent -150     pip entrance
  scale .85 -> 1    intro headline in
  scale 1 -> 2.5    intro headline out
  scale 1.025       image hover
  scale .5          cursor ring on active
  UV -0.5           shader counter-parallax
  UV +/-0.004       shader cursor parallax
  50px              gallery swipe threshold
  0.1 lerp          cursor follow (per 60fps frame)
```
