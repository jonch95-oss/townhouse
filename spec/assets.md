# assets.md — network and media manifest

Measured on a cold load at 1440 × 900, desktop UA, plus a full walk of the CMS payload so
that lazily-loaded slide media is included. Byte counts are **transfer sizes from the
`content-length` header** (i.e. what actually crosses the wire — DatoCMS and the origin
both serve compressed).

---

## 1. Page weight at a glance

| Group | Requests | Transfer |
|---|---:|---:|
| **WebGL scene textures** (`/gl/images/*`, first-party) | 16 | **6.92 MB** |
| **glTF model of the tower** (`/gl/sothebys_111w57_04.glb`) | 1 | **6.03 MB** |
| DatoCMS slide imagery (AVIF, first four slides) | 4 | 1.53 MB |
| Audio (`background.mp3`, `ambient.mp3`, ranged) | 2 | 1.28 MB |
| First-party JS (7 chunks) | 6 | 0.36 MB |
| Fonts (3 × woff2) | 3 | 0.09 MB |
| CSS (3 external files; the rest is inlined in the HTML) | 3 | 2.2 KB |
| HTML document (includes ~113 KB inlined CMS payload + ~26 KB inlined CSS) | 1 | 32.7 KB |
| Third party (GTM + CookieYes) | 10 | 0.12 MB |
| **Total for a cold load, before you press Enter** | **59** | **≈ 22.1 MB** |

Plus, walking every slide and opening every gallery, the full media library referenced by
the CMS comes to **55 unique assets ≈ 26.9 MB**, of which **18.8 MB is two Mux MP4
timelapses**.

Combined, a visitor who enters the experience, walks all six slides and opens both
timelapses transfers **roughly 40 MB**.

### Where the weight actually is

There is no meaningful "above the fold" split, because the page is exactly one viewport
tall and never scrolls — everything is above the fold, always. The useful division is
**what must arrive before the visitor can press "Enter experience"**, and the answer is
almost all of it: the preloader counts to 100 % against the WebGL asset set, so the
**6.9 MB of scene textures and the 6.0 MB tower model are both blocking** — about 13 MB
before the "Enter experience" button can be pressed. The first paint (white ground + `0%` + LOADING)
needs only the 32.7 KB HTML and the 350 KB main bundle.

That is the trade this design makes: a fast, quiet first paint, an honest progress
counter, and a deliberately long wait behind it. On a good connection it is a few
seconds; on a poor one it is a minute of white screen with a number on it. Whether that
is acceptable depends on how confident you are that people will wait — for a $98 M
listing they evidently decided yes.

---

## 2. The WebGL scene — 6.9 MB of PNG

This is the single largest thing on the site and it is **not photography**. The sky, the
clouds and the city are a layered, procedurally-animated Three.js scene built from sprite
sheets.

| File | Bytes | Format | Role (inferred from use) |
|---|---:|---|---|
| `HDR_AboveTheClouds.test.jpg` | 1,967,497 | JPEG | environment map for reflections |
| `layer2.png` | 938,418 | PNG | cloud layer |
| `layer4.png` | 809,555 | PNG | cloud layer |
| `layer3.png` | 696,372 | PNG | cloud layer |
| `layer1.png` | 620,347 | PNG | cloud layer |
| `layer0.png` | 402,272 | PNG | cloud layer (nearest) |
| `intro-cloud.png` | 382,107 | PNG | the cloud deck seen during the intro |
| `building1.png` | 338,550 | PNG | city silhouette plate |
| `building2.png` | 318,638 | PNG | city silhouette plate |
| `Cloud-tint-8.png` | 305,585 | PNG | cloud colour/tint ramp |
| `building0.png` | 265,896 | PNG | city silhouette plate |
| `cnoise.png` | 104,200 | PNG | curl/simplex noise, drives cloud drift |
| `building3new.png` | 78,152 | PNG | city silhouette plate |
| `sothebys_111w57_reflection_Blurred.jpg` | 22,505 | JPEG | blurred reflection detail |
| `flare/flare-1.jpg` | 2,332 | JPEG | lens flare sprite |
| `flare/flare-2.jpg` | 1,921 | JPEG | lens flare sprite |

And separately, the building itself:

| File | Bytes | Format | Role |
|---|---:|---|---|
| `/gl/sothebys_111w57_04.glb` | **6,025,928** | glTF binary | **The tower.** A real 3D model, not a sprite — this is what the press-and-hold interaction orbits (`motion-spec.md` §7.1). Uncompressed: no Draco, no meshopt, no KTX2, despite the bundle shipping loaders for all three. |

The two environment maps are **UltraHDR** JPEGs — `HDR_AboveTheClouds.test.jpg` as the
scene background (rotated `-3.04 rad`) and `sothebys_111w57_reflection_Blurred.jpg` as the
environment map (rotated `-2.112 rad`). The second is what puts a believable sky reflection
in the tower's glass; it is 22 KB and does more for the realism of the model than anything
else in the list.

Five cloud layers + four building plates + a noise texture is the whole trick: the layers
are drifted against each other by the noise map at different rates and tinted by the ramp,
which is why the sky reads as volumetric and never repeats. The generator is seeded — the
console logs `current cloud seed: 7059401` on boot.

**They are PNGs.** Nine of the sixteen are PNG, unoptimised, first-party, and blocking the
preloader. Converting the cloud layers to WebP/AVIF (or, better, to compressed GPU
textures — KTX2/Basis, which Three.js r173 supports out of the box and the bundle already
includes the loader for) would cut several megabytes without touching the design. This is
the most obvious performance win available on the site and it is left on the table.

---

## 3. Slide imagery — DatoCMS

Served from `www.datocms-assets.com/143478/…` through DatoCMS's Imgix-backed pipeline.

**Format:** `auto=format` — the CDN negotiates per browser, and Chrome is served **AVIF**.
Originals are JPEG. Quality is pinned at `q=85` and fit at `fit=max`.

**Variants generated per asset** (four named sizes, all constrained by the longest edge):

| Name | URL params | Used for |
|---|---|---|
| `src` | `?auto=format&fit=max&h=2440&q=85&w=2440` | desktop hero / slide texture |
| `srcMobile` | `?auto=format&fit=max&h=1440&q=85&w=1440` | mobile slide texture |
| `medium` | `?auto=format&fit=max&h=1500&q=85&w=1500` | gallery |
| `thumbnail` | `?auto=format&fit=max&h=800&q=85&w=1000` | menu and floorplan previews |

**Responsive:** yes — every image also ships a real `srcset` built on **DPR multipliers**
rather than width breakpoints:

```
…&dpr=0.25&fit=max&h=2440&q=85&w=2440  610w,
…&dpr=0.5 &fit=max&h=2440&q=85&w=2440 1220w,
…&dpr=0.75&fit=max&h=2440&q=85&w=2440 1830w,
…        &fit=max&h=2440&q=85&w=2440 2440w
sizes="(max-width: 2440px) 100vw, 2440px"
```

Each image record also carries a **base64 LQIP** (a ~600-byte inline JPEG data URI), a
**dominant colour** hex (e.g. `#6d9eca`, `#896a3a`) and a `focalPoint` — all three come
free from DatoCMS and all three are used. The dominant colour paints the box before the
image lands, which is why you never see a white flash between slides.

Actual transfers on a cold load, at 2440 px, as AVIF:

| Asset | AVIF bytes | Original JPEG bytes | Native size |
|---|---:|---:|---|
| `quadplex-8.jpg` (Entertaining Suite) | 348,868 | 138,864 | 3000 × 1900 |
| `quadplex-9.jpg` | 406,824 | 144,795 | — |
| `quadplex-10.jpg` | 253,306 | 116,663 | — |
| `quadplex-12.jpg` | 593,497 | 153,904 | — |

Worth noting: at `q=85` and 2440 px the **AVIF is 2–4× larger than the source JPEG**.
`auto=format` is picking AVIF because the browser accepts it, not because it is smaller
here. If you copy this setup, measure — don't assume `auto=format` is a win at large
sizes and high quality.

The `map` (depth-map) field exists on every interior record and is **`null` in all four
cases**, so no depth textures are ever fetched.

---

## 4. Video — Mux

| Slide | Playback ID | MP4 | Poster | Bytes |
|---|---|---|---|---:|
| Entertaining Suite (80th) | `02m02xcpw102SbsAq402lDR02VvougICRYSA5` | `stream.mux.com/<id>/high.mp4` | `image.mux.com/<id>/thumbnail.jpg` | 11,036,098 |
| Primary Suite (82nd) | `7ANZVAlrGoXAceb71s8U01B5FUQPt5Rx3` | `stream.mux.com/<id>/high.mp4` | `image.mux.com/<id>/thumbnail.jpg` | 7,787,727 |

Guest Suite and Crown Suite have the field but no asset.

Only `high.mp4` is requested — **no HLS, no adaptive bitrate**, despite Mux offering it.
An 11 MB progressive download on a phone is a real cost, and the code does check for
`mp4medium` / `mp4low` variants that the CMS never populates.

Attributes: `muted`, `loop`, `playsinline`, no `controls`, play/pause bound to an
`IntersectionObserver` directive. Poster frame comes from Mux's thumbnail endpoint.

---

## 5. Audio

| File | Bytes | When |
|---|---:|---|
| `/sound/background.mp3` | 573,759 | on "Enter experience" |
| `/sound/ambient.mp3` | 769,412 | 1 s before the entrance descent ends |

Both are **preloaded during the intro** (howler.js `preload()`), so they are part of the
blocking weight even for visitors who choose "Enter without sound".

---

## 6. Fonts

Three files, self-hosted, `font-display: swap`. No external font host.

| File | Bytes | Family / weight |
|---|---:|---|
| `Teodor-Regular.DWUeTY31.woff2` | 39,252 | `teodor` 400 |
| `NHaasGroteskTXPro-65Md.obxsJaSp.woff2` | 28,900 | `sans` 500 |
| `NHaasGroteskTXPro-55Rg.DjjIn3vU.woff2` | 27,168 | `sans` 400 |

**95 KB for all typography.** woff fallbacks are declared but never fetched by a modern
browser. Not subset — worth doing if you copy the approach.

---

## 7. JavaScript and CSS

| File | Transfer | Role |
|---|---:|---|
| `_nuxt/2_41x0yF.js` | 350,202 | everything: Vue, Nuxt, Pinia, GSAP + 3 plugins, Three.js r173, howler, Lethargy, the WebGL world |
| `_nuxt/TftDpBEz.js` | 13,704 | menu overlay, gallery, floorplans, credits, custom cursor |
| `_nuxt/DSAvPL-S.js` | 10,515 | intro/preloader, hero, interiors, contact, pip rail |
| `_nuxt/c5CUzFO6.js` | 3,045 | buttons, sound toggle |
| `_nuxt/DCH3qWrV.js`, `BUBAsu-Y.js` | 886 | glue |
| **Total first-party JS** | **≈ 378 KB** | (1.34 MB uncompressed) |
| 3 × `_nuxt/*.css` | 2,219 | component CSS |
| inlined `<style>` in `<head>` | ≈ 25.6 KB | Tailwind critical + `@font-face` + scoped styles |
| **Total CSS** | **≈ 31.9 KB uncompressed** | |

Third party: GTM `gtm.js` 130,883 bytes and CookieYes (8 requests). Together they are
about a third of the site's own JavaScript.

---

## 8. Static assets not in the critical path

| Asset | Bytes | Note |
|---|---:|---|
| 4 × floorplan PDFs | 631 KB / 619 KB / 590 KB / (one more) | downloadable per floor |
| `quadplex-plans.pdf` | 372,323 | combined set |
| 4 × floorplan JPEGs (`f1-gr`, `f3-ps`, `f4-cs`, …) | ~100 KB each | on-screen plan views |
| `og-image.jpg` | 418,844 | 1200 × 630 social card |
| `favicon.png` | 20,801 | served at 16/32/96/192 via `?w=&h=` |
| ~20 gallery images | 100–286 KB each | 8192 × 5464 originals, resized by the CDN |

---

## 9. Machine-readable manifests

- `capture/raw/assets.json` — every unique asset: URL, content-type, byte size, the
  widths requested, and the full set of transform parameters observed.
- `capture/raw/recon.json` — the complete request log from a cold load (58 entries with
  type, status, content-type, content-length).
- `capture/raw/payload-decoded.json` — the decoded Nuxt/DatoCMS payload, which is where
  every image record, its variants, its LQIP, its dominant colour and its focal point can
  be read directly.

**Reference-only note:** the imagery, copy and marks belonging to 111 West 57th Street are
captured here solely as layout and timing reference, as you asked. Nothing in this folder
is packaged for reuse, and none of it should ship on 223 Waverly Avenue.
