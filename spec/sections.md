# sections.md — section-by-section teardown

The site is not a page with sections stacked down it. It is **six full-screen slides plus
three overlays**, all living inside a single viewport-height document. "Top to bottom" is
therefore "slide 0 to slide 5, then the things that open on top".

Screenshots referenced below are in `capture/screenshots/` (prefixed by viewport width)
and the slow walk-through frames are in `capture/scroll/`.

Verbatim copy is quoted exactly, including the curly quotes, the ligature characters the
CMS stores (`ﬁ`, `ﬂ`) and the trailing spaces where they exist. It was read out of the
decoded CMS payload (`capture/raw/payload-decoded.json`), not transcribed from a picture.

---

## S0 — Preloader

`capture/screenshots/1440-00-intro.png` (preloader) · `1440-C-intro-gate.png` (the gate)

**Job:** hold the visitor on a white screen while ~7 MB of WebGL textures load, and make
the wait feel intentional.

**Layout:** full-bleed white. Three elements, all centred horizontally:

- the percentage, vertically centred, Teodor 2.6 rem, gold;
- immediately below it a full-width `<hr>` in `gold/40` — the progress bar, scaled with
  `transform: scaleX()` from a left origin;
- `LOADING` at the bottom of the screen, 1.4 rem, weight 500, uppercase, gold.

The bar runs the **entire width of the viewport**, edge to edge, with no gutter. That is
the only element on the site that ignores the 2 rem gutter, and it is why the loading
screen reads as an architectural drawing rather than a spinner.

**Copy:** `0%` … `100%` · `Loading`

**Media:** none. **Motion:** §2.1 of `motion-spec.md`.

**Empty space:** roughly 92 % of the screen. Two lines of text on a white field.

---

## S1 — Intro gate ("Above The Clouds")

**Job:** the threshold. Establish the concept and force a deliberate click before the
experience starts.

**Layout:** full-bleed. The live WebGL cloud scene, with `bg-black/10` over it. Copy is a
single centred column, vertically centred, `max-width: 27.5rem` mobile / `47.5rem`
desktop.

**Copy, verbatim:**

> ABOVE
> THE
> CLOUDS
>
> Rise above the hustle and bustle of the city and escape to your private sanctuary in the clouds. Experience a world of endless horizons.
>
> **ENTER EXPERIENCE**
>
> Enter without sound

The headline is three words on three lines, uppercase Teodor, `letter-spacing: .375em`,
`line-height: 1.05`, `perspective: 100vw` on the element (so the scale-up on exit reads
as depth). Sizes: 5 rem mobile / 8 rem tablet portrait / 10 rem desktop.

"Enter without sound" sits at `bottom: 4rem`, centred, as a `.uline-double` text button —
deliberately quieter than the framed primary button above it.

**Media:** the live cloud scene (procedural WebGL — see `assets.md` §2). No images.

**Behaviour:** the two white half-screen curtains that split apart to reveal this are
still in the DOM behind it. Clicking either button runs the exit and the 8-second camera
descent.

**Empty space:** the copy occupies a band across the middle third; sky above and below.

---

## S2 — Slide 0: Hero / Overview

`capture/screenshots/1920-D-hero.png`, `1440-D-hero.png`, `1024-D-hero.png`, `768-D-hero.png`, `390-D-hero.png`

**Job:** the address, the proposition, the price. One screen.

**Layout:** full-bleed WebGL city-from-above. Copy sits in a `.site-max .site-grid`
(24 columns desktop / 6 mobile):

- **Desktop:** `col-start-2 / col-span-7` — the left third — vertically centred,
  left-aligned, with `padding-bottom: 20rem`.
- **Tablet portrait:** `col-start-2 / col-span-10`.
- **Mobile:** full 6 columns, **bottom**-aligned, **centre**-aligned text,
  `padding-bottom: 11rem`.

A `.bottom-gradient` scrim (`#3c6278` at 0 → 30 % desktop, 17 rem tall; 0 → 60 %, 40 rem
on mobile) lifts the white type off the sky.

**Copy, verbatim:**

> 111 WEST 57ᵗʰ STREET
>
> Your Sanctuary
> In The Clouds
>
> The most iconic of all Manhattan addresses will now be the location of the grandest residence of all.
>
> Offered at $98,000,000

Mobile substitutes a longer paragraph that adds the instruction:

> The most iconic of all Manhattan addresses will now be the location of the grandest residence of all. Scroll to explore this extraordinary residence.

The eyebrow's "th" is `.ordinal` — 0.6 em, not raised.

**Media:** none in the DOM. Everything visible is the WebGL scene.

**Behaviour on scroll:** one wheel gesture advances to slide 1, with the special 0.5 s
hold + 2.25 s transition.

**Other interaction:** **press and hold anywhere** (100 ms with a mouse) pushes the
camera in on the city; the copy fades out while held. The custom cursor advertises this
with "Press & Hold" as soon as you arrive.

**Chrome visible:** logo "111 / W / 57" top centre; `MENU` top left; `INQUIRE` button top
right; `SOUND` toggle bottom left; six slide pips on the right rail (the active one drawn
as a full ring, the rest as small diamonds); `SCROLL TO EXPLORE` bottom centre; and the
`01 │ OVERVIEW  [+]` section-label box bottom right. See "Persistent chrome" at the end of
this document.

**Empty space:** ~25 words in the lower-left eighth of the screen. Everything else is sky.
This is the restraint that carries the whole site.

---

## S3–S6 — Slides 1–4: the four floors

`capture/screenshots/1440-E-slide1-entertaining.png` … `1440-H-slide4-crown.png`

**Job:** show the residence, one floor per screen, and say almost nothing.

**Layout:** the image is not a DOM image — it is a **full-screen WebGL shader quad**
(`canvas.gl-slides`, `position: absolute; inset: 0`) rendering the slide texture with
`object-fit: cover` computed in the shader. Over it sits `.interiors-gradient`: matching
top and bottom black gradients, 12.5 rem tall, at **25 % opacity**.

**Copy on screen: none.** No title, no floor number, no caption, no counter — nothing.
The floor labels below live in the CMS and are used by the menu and the floorplan panel,
not on the slide itself. Four screens of photography with zero text on them is the boldest
decision on the site.

| Slide | `slug` | Title | Floor | Timelapse | Gallery images |
|---|---|---|---|---|---|
| 1 | `great-room` | **Entertaining Suite** | 80th Floor | ✅ 11.0 MB Mux MP4 | 13 |
| 2 | `guest-suite` | **Guest Suite** | 81st Floor | — | 3 |
| 3 | `sunset-lounge` | **Primary Suite** | 82nd Floor | ✅ 7.8 MB Mux MP4 | 4 |
| 4 | `crown-suite` | **Crown Suite** | 83rd Floor | — | 0 |

Note the slugs don't match the titles — `great-room` is labelled "Entertaining Suite" and
`sunset-lounge` is labelled "Primary Suite". The rooms were renamed for the campaign after
the URLs were set.

**Media per slide:** one desktop image (3000 × 1900 native, served at 2440 px as AVIF), one
portrait mobile image (786 × 1364), one thumbnail, one optional timelapse video, and a
gallery set. Each carries a base64 LQIP, a dominant colour and a focal point. The
depth-map slot exists and is empty on all four.

**Behaviour on scroll:** each gesture wipes to the next floor — hard-edged horizontal
wipe, 1.5 s, `snappy`, with the two images counter-parallaxing at half rate behind it.
Going back runs the wipe in reverse.

**Other interaction:** the whole screen is clickable on slides 1–4; clicking opens the
lightbox with that floor's timelapse. The cursor reads "See the view" on slides 1–3 to
advertise it. Cursor parallax drifts the image ±0.4 % of UV continuously.

**Hidden content per floor** (reachable through the menu → Floorplans, not from the slide):
each floor carries a `desc` rich-text block, a floorplan JPEG, a floorplan PDF, and a
`hotspot` coordinate (e.g. `{posX: 30, posY: 50}`).

Descriptions, verbatim — 80th Floor:

> The residence features direct elevator entry to a grand receiving hall with white macauba stone ﬂooring leading to the expansive Great Room with custom smoke-gray solid oak ﬂoors in an intricate pattern. An ideal place for dining and entertaining, this space is complemented by a sophisticated library area to the South, offering expansive views of the Manhattan skyline.
>
> The corner south-facing kitchen offers stunning city skyline views, custom cabinetry designed by Studio Soﬁeld, crystallo white quartzite countertops and backsplash, and a full suite of Gaggenau appliances, including a gas cooktop with a fully vented hood, steam oven, and wine refrigerator. This kitchen seamlessly connects to the private Sunset Lounge and outdoor terrace, facilitating effortless indoor-outdoor living at an extraordinary elevation.

81st Floor:

> Each of the four private bedrooms offer striking views in all directions. Every suite is generously proportioned with ample closet space and en-suite bathrooms ﬁnished in distinctive crystallo gold quartzite and custom Studio Soﬁeld-designed ﬁxtures. This level includes a private Sunset Lounge and wet bar and a full laundry room for ultimate convenience.

82nd Floor:

> The magniﬁcent, luxuriously appointed private Primary Suite offers an entire floor of private programming, a respite above exciting city life. The approximately 2,947 square-foot full ﬂoor suite offers northern, perfectly centered Central Park views and double primary bathrooms facing north with views of the park.
>
> One primary bath is fully clad in hand-selected white onyx, while the other is clad in veined gray onyx. Both feature custom freestanding polished nickel bathtubs by William Holland, and beautiful custom-designed ﬁxtures hand-cast by P.E. Guerin. The primary suite also features two large dressing halls with spacious closets. Added conveniences include a full custom wet bar and coffee station, an intimate Sunset Lounge to enjoy the views, and a serene private office space.

83rd Floor:

> The residence's pinnacle floor offers an expansive, meticulously curated private entertainment space, ideal for memorable events and gatherings. The crown suite boasts a magnificent bar, billiards table, screening room, service kitchen, private indoor Sunset Lounge, powder room, and a private terrace, ensuring a complete and luxurious entertainment experience.

**Empty space:** total. Four consecutive full-screen images with no text at all.

---

## S7 — Slide 5: Contact

`capture/screenshots/1440-I-slide5-contact.png`

**Job:** the close. One card, one gesture away from the end.

**Layout:** the WebGL scene returns to `CLOUDS`. A single white card floats centred
(bottom-aligned on mobile): `padding: 5rem 4rem` mobile / `5rem 7.5rem` desktop,
`border-radius: .4rem`, `border: 1px solid gold/20`, all type gold, centred.

**Copy, verbatim:**

> CONTACT US
>
> ENDLESS
> HORIZONS
> AWAIT
>
> ─────
>
> For more information or to arrange a viewing please get in touch.
>
> EMAIL
> info@111w57.com
>
> PHONE
> 212-935-5757

The headline is the only uppercase display type on the site: Teodor, 2.6 rem mobile /
4 rem desktop, `letter-spacing: .2em`, `line-height: 1.4`. The rule between headline and
subtitle is `max-width: 5.5rem` — a 55 px gold line, animated in with `scaleX: 0 → 1`.

Bottom-right (desktop only): `Site by [Outpost logotype]`, 1.2 rem white with a `.uline`.

**Media:** none. Cloud scene behind.

**Behaviour on scroll:** this is the last slide; further gestures are clamped and do
nothing. Card entrance is the `clip-path` wipe in `motion-spec.md` §3.3.

**Empty space:** the card occupies maybe a fifth of the screen; the rest is sky.

---

## Overlay A — Menu

`capture/screenshots/1440-J-menu-open.png`

Full-screen, opened from the toggle, on a **solid gold (`#7c7262`) ground** — the only
place on the site where gold is the field rather than the ink. Links are white Teodor;
the `01`–`07` indices are a lighter tint of the same gold. Logo at top (centre on desktop,
left on mobile); the toggle's two bars have rotated into their shallow 17.5° cross.

**Left half (≥1100 px only):** a portrait image, `aspect-ratio: .75`,
`max-height: calc(100svh - 20rem)`, in a mask that counter-slides on open.

**Right half:** the link list, each row a two-digit index at `opacity: .4` (offset −8 rem
on desktop) plus a Teodor link at `.h3.--menu` (3.5 rem @650 / 5 rem @1100),
`line-height: 1.1`:

> 01 Home
> 02 Entertaining Suite
> 03 Guest Suite
> 04 Primary Suite
> 05 Crown Suite
> 06 Floorplans
> 07 Contact

**Bottom row:** `Visit main site` · `Credits` · `Legal` (1.2 rem uppercase, weight 500,
`.uline`), and the phone number right-aligned in Teodor 2.6 rem with `.uline`.

Hover dims every sibling to `opacity: .3` rather than highlighting the target.

---

## Overlay B — Floorplans

Reached from menu → Floorplans. Contains a floor `Select`, a `Features` list, a `Desktop`
plan viewer with a `Download` button, and a "Rotate your phone" block on portrait phones.
Each floor supplies a plan JPEG, a plan PDF and a hotspot coordinate. The combined PDF is
`quadplex-plans.pdf`.

The panel is scrollable internally (its own wheel handler), which is why the global slide
wheel is disabled whenever it is open.

---

## Overlay C — Overview / Legal / Credits panel

A slide-in panel used for three different bodies of text, all set the same way: a Teodor
title at 4 rem mobile / 9 rem desktop with `leading-none`, a `-mx-20` rule in `gold/20`,
then numbered sections at `padding-top: 4.5rem` with an `01`-style index, an `.h5`
sub-heading with `margin-bottom: 4rem`, and `.txt` rich text with `2.5rem` between
paragraphs and custom round bullets at `.25em`.

**Overview**, verbatim (title "Manhattan's / Newest Landmark"):

> Manhattan's most extraordinary residential offering at the crown of 111 West 57th Street, an architectural masterpiece by SHoP Architects with interior architecture by Studio Sofield. Across four floors, Quadplex 80 offers over 11,480 square feet of meticulously designed interior space and 618 square feet of breathtaking south-facing exterior terraces. The grand residence offers ﬁve bedrooms, six full bathrooms, and two powder rooms, providing plentiful space for refined living and entertaining.
>
> A private internal elevator and custom circular staircase offers access to a world of reﬁned elegance, where 360° open views reveal the splendor of the perfectly centered views of Central Park, dazzling city skyline, and river to river experience. Towering ceiling heights of up to 14 feet, coupled with ﬂoor-to-ceiling windows, ﬂood the space with natural light, showcasing the exquisite custom design details throughout. This is a once-in-a-lifetime purchasing opportunity.
>
> Quadplex 80 Residence Highlights:
>
> - 360-degree views overlooking Central Park, Manhattan skyline, and river to river
> - Full ﬂoor 2,947 square-foot Primary Suite
> - Crown Suite ﬂoor complete with billiards, full bar, screening room and sunset lounge
> - 2 Private Terraces
> - Floor-to-ceiling windows
> - Ceiling heights up to 14'
> - Custom spiral staircase
> - White macauba stone ﬂoor at entry
> - Custom smoke gray solid oak ﬂoors with intricate patterns in the Great Room
> - 9' custom doors and transoms throughout with custom bronze door handles and hinges
> - Zoned year-round fan coil HVAC system
> - Private internal elevator

**The stat block** — five pairs, static, no count-up:

| Label | Value |
|---|---|
| Interior Sq Ft / Sq M | 11,480 sq ft |
| Exterior Sq Ft / Sq M | 618 sq ft |
| Exposure | N,E,S,W |
| Bedroom/Bathroom | 5/6 |
| Powder Room | 2 |

**Credits**, under the heading:

> A world-class team of experts,
>  visionaries, designers & artists

with eight entries, each a name, a paragraph and an outbound link: JDS Development Group ·
Property Markets Group · SHoP · Studio Sofield · Apollo Commercial Real Estate Finance,
Inc ("ARI") · Sotheby's International Realty · Outpost · Hayes Davidson.

**Legal** carries four documents: `Terms & conditions`, `Disclaimer`,
`Standardized Operating Procedures`, `Privacy policy`. The disclaimer, verbatim:

> Current pricing, renderings and related copy depict fully integrated and built out Quadplex 80. Sponsor to customize Quadplex 80 per owner's request. Pricing is subject to change based on the owner's floorplan specifications.

---

## The word count

This is the observation worth carrying into your own build. Excluding the overlays, which
a visitor has to go looking for, **the entire experience is about 90 words**:

| Screen | Words |
|---|---:|
| Preloader | 2 |
| Intro gate | 30 |
| Hero | 27 |
| Four floor slides | **0** |
| Contact | 24 |

Ninety words, six screens, one price. Everything else is picture and air. The restraint
is not a stylistic flourish on top of the design — it *is* the design, and it is the
cheapest part of it to copy.

---

## Persistent chrome (present on every slide once entered)

Two elements I want to call out because they carry more weight than their size suggests.

### The section-label box (bottom right)

A white card pinned to the bottom-right corner — `35.5rem × 9rem` desktop, full-width ×
`7rem` mobile — `border-radius: .5rem`, `border: 1px solid gold/20`, `transform-origin:
bottom right`. It reads:

> `01`  │  `OVERVIEW`  `[+]`

- The index is Teodor 3 rem, gold, `leading-none`, `letter-spacing: -.02em`, with
  **`font-variant-numeric: tabular-nums`** so the digits don't jitter as the number
  changes. Prefixed by a literal `0`.
- A `2.5rem` vertical gold rule separates index from title.
- The title is the current slide's name in the small-caps label style.
- Both the index and the title swap through their own JS enter/leave transitions on every
  slide change, so the box updates in place rather than re-rendering.
- The `[+]` button is `2.8rem` square, `border-radius: .3rem`, gold hairline at 40 %, and
  **inverts on hover** — `transition: colors 500ms ease-out` to white-on-gold. It is the
  only element on the site that fills on hover with a colour transition rather than a
  transform.

This is the one piece of persistent wayfinding: it tells you which floor you are on and
is the door to that floor's full description.

### "Scroll to explore" (bottom centre)

`text-12`, uppercase, weight 500, white, at `bottom: 2.5rem`, horizontally centred. It is
a button — clicking it calls `slides.next()`.

It also carries the site's only **looping** animation, and its second use of
character-level splitting:

```js
const split = new SplitText(el, { type: 'words, chars' })
gsap.timeline({ repeat: -1 })
  .fromTo(split.chars, { alpha: 1 }, { alpha: .125, duration: 1.5, stagger: .05, ease: 'linear' })
  .to(split.chars, { alpha: 1, duration: 1.5, stagger: .05, ease: 'linear' }, 1.5)
```

A 3-second loop in which each character dims to **12.5 %** and back, 0.05 s apart — a slow
wave travelling left to right, forever. It is the only thing on the screen that moves when
the visitor does nothing, and it is doing the job of telling them the page responds at all
— which matters a great deal on a site with no scrollbar.
