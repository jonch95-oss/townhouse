# Source renders

26 renders extracted from the StudioSC design decks at **full embedded resolution**.
Nothing here has been resized, cropped or re-encoded — each file is the raw image stream
lifted out of the PDF, except where noted, so these are the largest versions that exist
short of asking StudioSC for the originals.

## Provenance

| Deck | File |
|---|---|
| Entrance Design, 10 May 2025 | `223_Waverly_St_ENTRANCE_DESIGN_050525.pdf` |
| Interior Design, 20 Mar 2025 | `223_Waverly_St_INTERIOR_DESIGN_032025.pdf` |

## Naming

`{DECK}-{page}-{index}` — the deck prefix, the 1-based PDF page, and a running
image index across that deck. `INT-020-033` is the 34th image in the Interior deck and
sits on page 20.

Images below 1 megapixel are material and fixture swatches rather than renders, and are
not included here — 21 of the 48 images the two decks contain.

`INT-010-014` is also dropped. It survived the size filter at 1113 × 1391 but is a
lower-resolution duplicate of `INT-010-010`: the same shower room at a tighter crop, which
is why a dedupe on dimensions missed it.

## These are the archive, not what the site loads

The slides load from `public/renders/slides/` and the galleries from
`public/renders/gallery/`. This directory is the provenance record — the largest version
of each render that exists, kept so any future crop or regrade starts from source rather
than from something already resampled.

## What is here

| ID | File | Resolution | Size | Source |
|---|---|---|---|---|
| `ENT-003-000` | ENT-003-000.jpeg | 2400 × 1350 | 462 KB | Entrance Design p3 |
| `ENT-004-001` | ENT-004-001.jpeg | 2400 × 1350 | 496 KB | Entrance Design p4 |
| `ENT-005-002` | ENT-005-002.jpeg | 2400 × 1350 | 360 KB | Entrance Design p5 |
| `ENT-006-003` | ENT-006-003.jpeg | 2400 × 1350 | 370 KB | Entrance Design p6 |
| `ENT-007-004` | ENT-007-004.jpeg | 2072 × 1350 | 421 KB | Entrance Design p7 |
| `ENT-008-008` | ENT-008-008.jpeg | 2400 × 1350 | 459 KB | Entrance Design p8 |
| `ENT-009-009` | ENT-009-009.jpeg | 2400 × 1350 | 240 KB | Entrance Design p9 |
| `INT-003-000` | INT-003-000.jpeg | 2400 × 1350 | 387 KB | Interior Design p3 |
| `INT-004-001` | INT-004-001.jpeg | 2400 × 1350 | 316 KB | Interior Design p4 |
| `INT-005-002` | INT-005-002.jpeg | 2400 × 1350 | 380 KB | Interior Design p5 |
| `INT-006-003` | INT-006-003.jpeg | 2400 × 1350 | 321 KB | Interior Design p6 |
| `INT-007-008` | INT-007-008.jpeg | 2400 × 1350 | 366 KB | Interior Design p7 |
| `INT-008-009` | INT-008-009.jpeg | 2400 × 1350 | 419 KB | Interior Design p8 |
| `INT-010-010` | INT-010-010.jpeg | 1440 × 1800 | 207 KB | Interior Design p10 |
| `INT-012-015` | INT-012-015.jpeg | 2400 × 1800 | 454 KB | Interior Design p12 |
| `INT-013-016` | INT-013-016.jpeg | 1440 × 1800 | 325 KB | Interior Design p13 |
| `INT-014-021` | INT-014-021.jpeg | 2400 × 1800 | 361 KB | Interior Design p14 |
| `INT-015-022` | INT-015-022.jpeg | 1440 × 1800 | 320 KB | Interior Design p15 |
| `INT-017-027` | INT-017-027.jpeg | 2400 × 1800 | 419 KB | Interior Design p17 |
| `INT-018-028` | INT-018-028.jpeg | 2400 × 1800 | 363 KB | Interior Design p18 |
| `INT-019-032` | INT-019-032.jpeg | 2400 × 1800 | 381 KB | Interior Design p19 |
| `INT-020-033` | INT-020-033.jpeg | 3200 × 1800 | 597 KB | Interior Design p20 |
| `INT-022-034` | INT-022-034.jpeg | 1440 × 1762 | 281 KB | Interior Design p22 |
| `INT-022-035` | INT-022-035.jpeg | 1440 × 1799 | 265 KB | Interior Design p22 |
| `INT-023-036` | INT-023-036.jpeg | 1440 × 1762 | 424 KB | Interior Design p23 |
| `INT-023-037` | INT-023-037.jpeg | 1440 × 1765 | 398 KB | Interior Design p23 |

## What is not here

- **No exterior render.** The only one in existence is in the Landmarks deck at 735 × 633
  and is unusable — see `HANDOFF.md`.
- **No portrait frames.** Every render above is landscape or near-square. Portrait assets
  have to be framed separately; cropping these would not substitute. See `HANDOFF.md`.
- **No roof terrace, no living room, no bedrooms.** Those rooms were never rendered.
