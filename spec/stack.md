# stack.md — what quadplex80.com is actually built with

> Captured 25 Aug 2026. Build id `47bc8daf-8e76-46df-aa01-99dee24ca061`.
> Method: fully-rendered DOM, all `_nuxt/*` bundles downloaded and beautified, `window`
> globals enumerated at runtime, version strings read out of the bundle source.

---

## Headline correction

**This site is not built on landing.love.** There is no page-builder involved.
It is a hand-written **Nuxt 3** application, server-rendered and pre-rendered to static
HTML, with content from **DatoCMS**, video from **Mux**, and a **Three.js** WebGL layer
doing the image transitions. The credits panel on the site names **Outpost**
(outpost.design) as the design/build studio.

This matters for your rebuild: there is no template to buy, and no "export" path. Every
number in `motion-spec.md` is something a developer wrote by hand, which is exactly why
it can be reproduced by hand.

---

## Framework and delivery

| Layer | What they use | Version | Evidence |
|---|---|---|---|
| Framework | **Nuxt 3** (Vue 3) | `3.15.4` | `versions:{get nuxt(){return"3.15.4"}}` in main bundle |
| View layer | **Vue 3** | 3.5.x (bundled) | `__VUE__`, `__VUE_INSTANCE_SETTERS__` globals |
| State | **Pinia** | bundled | `defineStore("main", …)` — store named `main` |
| Rendering mode | SSR → **pre-rendered static** | — | `data-ssr="true"`, `prerenderedAt` in payload, `_payload.json` |
| CSS | **Tailwind CSS** (v3, JIT) | 3.x | `--tw-*` custom properties, arbitrary-value classes |
| CMS | **DatoCMS** | — | all media on `www.datocms-assets.com/143478/…` |
| Video | **Mux** | — | `stream.mux.com/<id>/high.mp4`, `image.mux.com/<id>/thumbnail.jpg` |
| Analytics | Google Tag Manager | `GTM-NS77TXS8` | script tag |
| Consent | CookieYes | client `237fcdc817a96717c3ef5a9d` | `cdn-cookieyes.com` |

Entry bundle is a single 1.23 MB (uncompressed) JS file, `/_nuxt/2_41x0yF.js`, plus six
small route/component chunks. Total JS ≈ 1.34 MB uncompressed.

---

## Animation and interaction libraries — the direct answers

| Library you asked about | Present? | Detail |
|---|---|---|
| **GSAP** | ✅ **yes — core `3.15.0`** | The entire motion system. Not exposed on `window` (ESM import). |
| **ScrollTrigger** | ⚠️ **imported, effectively unused** | The string exists in the bundle but there are **no** `scrub`/`pin`/`start`/`end` configs and `ScrollTrigger.getAll()` is empty at runtime. Nothing is pinned, nothing is scrubbed. |
| **Lenis** | ❌ no | |
| **Locomotive Scroll** | ❌ no | |
| **Framer Motion** | ❌ no | |
| **Swiper** | ❌ no | The gallery is hand-rolled. |
| **Three.js** | ✅ **yes — r173** | Two canvases: a procedural sky/cloud/city scene, and a full-screen shader quad that performs every image transition. |
| Native APIs | partly | `IntersectionObserver` (video play/pause only), `ResizeObserver` (viewport store), `matchMedia`. **No** `scroll-snap`, **no** `ScrollTimeline`, **no** `element.animate()`. |

### GSAP plugins actually registered

Read straight out of the `gsap` Nuxt plugin:

```js
gsap.registerPlugin(CustomEase, SplitText, DrawSVGPlugin)
```

- **CustomEase** `3.15.0` — three project eases are created at boot (see `motion-spec.md`).
- **SplitText** `3.15.0` — used for line / word / character splitting on every headline.
- **DrawSVGPlugin** `3.12.7` — used only for the six circular slide "pips" on the right rail.
- One registered **GSAP effect**, `textMasks`, is the site's reusable text reveal.

Club GreenSock plugins (SplitText, DrawSVG, CustomEase) means they hold a paid GSAP
licence. Budget for that, or substitute (notes in `REBUILD.md`).

### Other runtime libraries found in the bundle

| Library | Version | Used for |
|---|---|---|
| **howler.js** | `2.2.4` | Ambient audio — `/sound/background.mp3` and `/sound/ambient.mp3`. |
| **Lethargy** | bundled | Distinguishes a deliberate wheel gesture from trackpad inertia. Configured `new Lethargy(8, 50)`. This is the thing that makes one flick = exactly one slide. |
| **lodash.debounce** | `4.x` | 50 ms debounce on the wheel handler; 50 ms on resize. |
| **`@unhead`** | bundled | head/meta management (Nuxt default). |

---

## Scroll: there is no scroll

The single most important structural fact:

```
document.documentElement.scrollHeight === window.innerHeight   // 900 === 900
body { overflow: hidden; overscroll-behavior: none }
```

The page is exactly one viewport tall and never scrolls. They register their own
listeners —

```js
window.addEventListener('wheel',      onWheel,  { passive: true })
window.addEventListener('touchstart', onTouch,  { passive: true })
window.addEventListener('touchmove',  onMove,   { passive: true })
document.addEventListener('keydown',  onKey)
```

— normalise the delta (`wheelDeltaY || -deltaY`, then × `0.9` on Windows / × `0.4`
elsewhere; touch delta × `3`), and emit a synthetic `vs` event on an internal bus. A
GSAP `ticker` callback emits a `tick` event carrying `gsap.ticker.deltaRatio(60)` so
every lerp in the app is frame-rate independent.

Keyboard: `ArrowUp` (38) → +120, `ArrowDown` (40) → −120, `Space` (32) → ±(viewportHeight − 40),
shift-space reverses. Ignored while an `<input>` has focus.

---

## Files captured alongside this document

| File | What it is |
|---|---|
| `capture/dom.html` | `document.documentElement.outerHTML` after the experience is entered and driven to the end |
| `capture/styles.css` | Every stylesheet concatenated — 6 inline `<style>` blocks + 3 `_nuxt/*.css` files, 31.9 KB total |
| `capture/assets.md` | Network/media manifest |
| `capture/raw/nuxt/` | The original un-beautified bundles, for reference |
| `capture/raw/nuxt-data.json` | The full Nuxt/DatoCMS payload — where all the verbatim copy came from |

Note on `styles.css` size: **31.9 KB uncompressed for the entire site.** Tailwind's JIT
output plus about 8 KB of hand-written component CSS. There is no CSS framework bloat
here, and that restraint is part of why it feels fast.
