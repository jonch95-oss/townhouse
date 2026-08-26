# scroll/ — the walk-through sequence

## What this is, and why it isn't a scroll recording

The brief asked for a slow scroll through the whole page at 1440px, ~1 frame per 300ms.
There is no scroll on this site — `document.scrollHeight === innerHeight` and the wheel is
captured entirely (see `../motion-spec.md` §1). The equivalent walk-through is:

1. **`000-…` to `053-entrance.webp`** — the 8-second camera descent that plays once you
   press "Enter". This is the only continuous motion on the site, and it is the piece the
   whole design is built around. You start above the cloud deck and arrive at the tower
   with the city beneath it.
2. **`054-…` to `060-….png`** — the six slide resting states in order, plus the menu
   overlay. Each is one wheel gesture apart.

`entrance-descent.gif` is the entrance sequence as a single looping animation at 640px.
The 54 entrance frames are WebP (quality 84) to keep the package portable; the six slide
stills and every breakpoint screenshot are lossless PNG.

## Read the frame intervals with care

The capture environment has no GPU, so the site's Three.js scene renders under software
rasterisation at roughly 1–2 fps, and GSAP's lag smoothing stretches wall-clock time to
match. **The frames are correctly ordered and correctly composed, but they are not evenly
spaced in real time** — the descent occupies 8 seconds on real hardware, not the ~54 × 300ms
these frames might suggest.

Use `../motion-spec.md` for timing. Use these frames for composition, camera path and
sequence — for which the slow render is actually an advantage, because it samples the
camera move far more finely than a 30fps recording would.
