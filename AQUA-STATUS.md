# Aqua — full project export

Variable typeface derived from an existing logotype. One weight axis, 30 characters
drawn, built and proofed live in a single HTML file.

Exported 19 September 2026.

---

## 1. Where the project stands

**Working:** a one-axis variable typeface with 30 characters that interpolates continuously
from stem 53 (Regular) to stem 106 (Black). Every glyph renders live in the browser, can be
typed into freely, and exports to SVG on a correct font grid.

**Half of it is yours now.** 15 glyphs stopped being code-generated and became *drawn
masters* — outlines you redrew in Illustrator, reimported, and which the axis now
interpolates point-for-point between your two weights. The other 14 are still parametric:
functions of stem width that generate any weight on demand.

**Blocked:** the capital B. Your Black has 39 segments, your Regular 34. There is no
point-for-point correspondence, so it cannot interpolate. It needs redrawing from one
skeleton in both weights — move points, never add or delete.

**Current phase:** you are about to reshape a significant number of glyphs. Spacing work
is on hold until that lands, because bearings are measured off outlines and every contour
you move invalidates them.

### Not done

| | |
|---|---|
| Capital letters | Only B exists, and it does not interpolate |
| Numbers 0–9 | Builders exist in the file, pulled out of the active set |
| Ampersand | Never drawn |
| Punctuation | Only `!` `.` `,` |
| Axes beyond weight | Width, optical size, slant, custom — none started |
| Font binary | No `.glyphs`, no UFO, no WOFF2. Everything is SVG + live code |

---

## 2. Files

```
Aqua.dc.html                       the typeface — generator, proofs, export, reimport
para.json                          early parametric h / a / exclam paths at two stems
20260809_g_refit-22pt.svg          the production g, 22 cubic points
github.md                          repo association + sync record
AQUA-STATUS.md                     this document

edits/
  masters.json                     the drawn weights, as ingested
  edited-paths.json                raw paths parsed out of your two returned SVGs
  edited-summary.json              bbox, segment count, subpath count per glyph per weight
  aqua-black-106.txt               the returned Black SVG, as text
  aqua-regular-53.txt              the returned Regular SVG, as text

design_handoff_variable_font/
  README.md                        the original brief — metrics, weight law, drawing order
  measurements.json                every metric extracted from the logotype, machine-readable
  sources/
    g-refit-22pt.svg               production g, 21 points
    g-original-trace.svg           the same g pre-refit, 65 quadratic points, reference only
    h-refit.svg                    constructed h, 16 points, stem 106
    a-refit.svg                    constructed a, 12 points, stem 106
    exclam.svg                     constructed exclam, 10 points
    (logotype raster — removed from the repository 2026-09-19)
    outline-audit.dc.html          the audit that produced the refit
    support.js

uploads/                           screenshots and reference images from the sessions
```

GitHub: `fabiotestax/Aqua`, branch `main`, path `aqua my files`. Last sync
2026-08-10. Exported SVGs live in `aqua my files/exported svgs/`.

---

## 3. Metrics — settled, do not re-derive

```
UPM               1000
baseline             0
x-height           521      round letters overshoot to 528
cap height         715
ascender           751
descender         −230      (the brief said −178; the drawn y and j tails go to −230)
overshoot            7
```

Stem axis runs **53 → 106**. 106 is Black, 53 is Light (settled 2026-09-19; it was called
Regular before). A Regular master near 78 is planned.

The raster-to-units scale is **1.439**, fixed by the g: the logotype g's
descender-to-bowl-top ratio is 0.330 and the vector g's is also 0.330. Every other metric
follows from that with no slack.

Three cautions when measuring further letters off the logotype raster:

- The logotype baseline rises about 0.46° left to right. Measure each letter against its
  own local baseline.
- `u` is the only flat-topped lowercase, so it is the only true x-height reading.
- Cap height reads 499 on B and 495 on D. That is scan noise. Use 715.

Ink widths measured off the raster, in units: B 453, D 453, a 373, e 389, g 440, h 381,
l 111, o 407, p 406, u 381.

---

## 4. The weight law

The source is not monolinear. Measured by scanline across the refit g:

```
vertical stems     105.7  105.1  106.2  106.9
horizontal thins    52.2   63.1   67.5
contrast ratio      0.57
stem / x-height     0.202
```

A uniform outline offset thickens horizontals and verticals equally and flattens 105:60
into 1:1 — the face stops looking like itself at the first interpolation step. So the
offset is **anisotropic**:

```
offset(θ) = base_offset × (k + (1 − k) × |sin θ|)
k = 0.50
```

θ is the *tangent's* angle from horizontal, so |sin θ| = 1 on a stem and 0 on a horizontal.

In the file this is expressed as a contrast curve rather than a constant:

```js
thinRatio(s) = 0.28 + 0.21 × (clamp(s, 26, 106) − 26) / 80
contrastK(s) = thinRatio(s) / 0.49
```

thin/stem runs 0.49 at Black down to 0.35 at Regular. The curve is defined down to 0.28 so
the axis can be extended below Regular later without a refit. Lighter weights trend *more*
monolinear, which is the correct direction.

### Neck compensation

The g's neck — the diagonal link joining upper bowl to lower loop — is eaten from both
sides at once by an offset. Uncompensated it measures 70 units at Black and 2 at Light: the
glyph comes apart.

The fix backs the offset off on the six points forming the neck, selected by
`x < 250 && 20 < y < 280` in the refit's coordinates. Both counters fall outside the band.

| offset | 0 | 11 | 19 | 26 | 33 | 39 |
|---|---|---|---|---|---|---|
| comp | 1.00 | 0.573 | 0.571 | 0.575 | 0.574 | 0.576 |
| resulting neck | 70 | 55 | 44 | 35 | 25 | 17 |
| without it | 70 | 44 | 25 | 8 | 2 | 2 |

Interpolate linearly between rows. The correction is near-constant at 0.574 from Bold down,
but that does not generalise — re-solve per glyph. Expect the same problem on every diagonal
join: **a e g s** and the **K R** junctions.

---

## 5. Construction rules

**Do not trace. Construct against the artwork.** This was learned the hard way. Fitting a
curve to a traced outline reproduces the hand wobble as faceting. Tightening tolerance makes
it worse — the fitter chases the wobble and lands 25–38 points on a letter needing 16, with
lumps at every terminal. Loosening it smooths the design away. No setting gives a clean
letter, because the defect is in the source.

So every glyph is a list of points, each on an extremum, each with an explicit axis-aligned
tangent, handles at the circle constant (0.5523) on quarter turns and one third of the chord
on straight runs. A lump is not possible, because no control point is ever placed by a
solver.

Where tracing is unavoidable (the g), clamp each handle to 0.20–0.90 of the chord's extent
along its own direction, and floor every handle at 15% of its chord. A handle resolving to
zero has an undefined tangent — `varLib.interpolatable` flags it and interpolating through
it is unstable. Ours hit zero once, when two landmarks landed on the same y.

**Terminals must be parametric.** A flat terminal with a 30-unit corner radius, offset
inward by 39, has a negative radius and renders as a spike. Two things fix it, both needed:
make terminals semicircular caps of radius s/2 rather than flat cuts with small corners; and
generate each weight from parameters rather than offsetting a master.

The second point goes further than terminals. Any landmark left fixed while the stroke thins
will eventually cross one that moves — on the a, a fixed shoulder height meant the arm's
underside rose above its own top edge at Thin and the contour self-intersected. **If a
coordinate describes where two strokes meet, it is a function of stroke width.**

### The shared vocabulary

Every parametric glyph draws from a small set of shared primitives, so decisions propagate:

| Primitive | What it is |
|---|---|
| `contour(P)` | Points-with-tangents → cubic path. Handles set geometrically, never solved |
| `cutTop` / `cutBot` | The family terminal: an angled cut on slope **0.34** with softened corners |
| `foot` | A rounded square — flat sole, generous corners, not a semicircular cap |
| `arch` | The shoulder carrying h, n, m and (mirrored) u |
| `corner(V, d1, d2, r)` | A true circular fillet solved from two edge directions |
| `isect` | Edge-line intersection — used for every crotch, so junctions hold as strokes thicken |
| `buildRing` | An ellipse outside, a rounded rectangle inside. This pairing is what makes the o read as water held in a shape rather than a circle |
| `strokePath` | Variable-width stroke along a spine, thickness by tangent angle. Used only by the s, which has no straight edge and no extremum to hang a corner on |
| `offsetPath` | The anisotropic offset, with optional neck compensation |
| `flipPath` | Mirrors a path. d = flipped b, p = b flipped vertically, q = flipped p |

`SLANT = 0.34` is one angle for the whole family. Every cut terminal climbs 0.34 to the
right across its own stem, so the h, the exclam and everything derived from them share a
single slope.

---

## 6. Glyph inventory — 30 characters

### Drawn masters (15)

These interpolate point-for-point between two outlines you drew. They are no longer
parametric and no longer respond to the construction rules above.

```
a  b  c  d  e  f  h  i  j  k  p  q  r  y  ,
```

Six of these were edited in one weight only. The edit was mirrored onto the other master so
the axis does not drift mid-weight:

| Glyph | You edited | Mirrored onto |
|---|---|---|
| c | Black | Regular |
| e | Black | Regular |
| h | Black | Regular |
| y | Regular | Black |

`MIRRORED = { c: 'regular', e: 'regular', h: 'regular', y: 'black' }` — those weights no
longer match the SVG file they came back in, by design.

### Offset-interpolated (1)

```
g
```

The original refit. 22 cubic points, every point on an extremum. Generated at any weight by
anisotropic offset from the Black master with neck compensation. Needs no scaling or
repositioning — its coordinates already sit correctly on the metrics.

### Parametric (14)

Still generated from stem width by the builders described in §5.

```
l  m  n  o  s  t  u  v  w  x  z  B  !  .
```

Notes on the ones with a decision in them:

- **l** — the i's stem carried to the ascender, no dot. Added this session.
- **o** — `buildRing(379, −7, 528, s, …)`. Ellipse out, rounded rect in.
- **s** — the only letter with no straight edge, built by `strokePath` with continuous
  contrast rather than four sampled points. Outer edges pinned to 0 and W at every weight.
- **v** — the only letter built from straight edges. Apex dropped by the fillet's own
  set-back so the rounded point lands on the baseline overshoot.
- **x** — four crotches, every one found by intersecting edge lines.
- **t / f** — every junction filleted rather than mitred. The f's hook terminal is cut square
  to the stroke, not on the family slant: the stroke is horizontal there and a 0.34 cut would
  read as a droop.
- **B** — two rounded-rectangle counters on one stem, lower one wider, waist pinched rather
  than mitred. **This is the blocked glyph.**
- **. / ,** — the period leans: its top pulls left, which is what a drop does when it lands.
  The comma is the same drop with the tail it leaves behind. (The comma is now a drawn
  master; the period is still parametric.)

### Built but inactive

Numbers **0–9** have working builders in `BUILD` but are out of `CHARSET` and `ORDER`. The
1's flag runs on its own 0.71 slope, steeper than the family cut, ending on a vertical —
a slanted cut on a stroke that steep reads as a rip.

`ORDER_V1` preserves the 39-cell grid the returned SVGs were drawn on, so section 08 can
still map their cells.

---

## 7. Spacing and kerning

Rebuilt this session, then deliberately parked.

### Sidebearings by edge behaviour

Bearings are set by what the edge *does*, not by which letter it is. Each glyph declares a
two-letter shape class — left edge, right edge:

```
f = flat      0.90
r = round     0.82
o = open or diagonal   0.68
```

```js
d  = max(0, (107.4 − s) / 2.09)     // how far from Black
sb = 47 + 0.28 × d                  // base bearing, opens as weight lightens
lsb = sb × SBK[class[0]]
rsb = sb × SBK[class[1]]
```

The base bearing opens as the weight lightens because ink width drops 428 → 350 across the
ladder; without it the colour goes patchy.

**What changed this session.** The three classes were originally 1.00 / 0.80 / 0.62, which
spread gaps from 59u to 94u — the same word held two different rhythms. Narrowed to
0.90 / 0.82 / 0.68, holding gaps in a 70–85u band at the same average colour.

A **word space is 4 bearings** (was 2). At 2 it was 94u against letter gaps of 85u, so word
boundaries did not read.

### Kerning

~150 pairs in `KERN`, in units at Black, scaled along the axis:

```js
kS = 0.40 + 0.32 × s / 106
```

Kerns shrink toward the light end, where the letters need the room back. The scale dropped
from `0.55 + 0.45×` because the narrowed bearing classes were already doing more of the work.

A block was added for pairs the shape classes cannot see — a diagonal or a stem set deep
inside its own advance: `vc ve vo vs et st gl gt da de do tz az oz ez ol al ul il oj aj ej
uj ja`.

### Two bugs found and fixed

- **k** had a right bearing of 0.3u — it nearly collided with whatever followed. Its advance
  was 350 against an ink width of ~380. Now 380.
- **j** overhung its own advance on the left. `x0` was 96 with an advance of `122+s`; the
  stem sat so deep that everything before it read as a hole, and the first fix over-corrected
  into a negative bearing. Settled at `x0 = 96`, advance `100+s`, which measures L32 / R35.

All 30 glyphs now audit with non-negative bearings on both sides.

### What survives a reshape

| | |
|---|---|
| Word space = 4 bearings | Global. Survives anything |
| Class ratios 0.90 / 0.82 / 0.68 | A ratio, not a measurement. Survives |
| The ~150 kern pairs | Fitted to the current outlines. **Expect to redo these** |

### The advance-width problem

`glyphWidth()` still carries hardcoded advances from the parametric era — `h:379, a:370,
o:379, k:380, j:100+s`. Those were correct when the outlines were generated from the same
numbers. The j and k bugs are both this: a glyph became a drawn master, its ink moved, and
the table did not follow.

**Recommended when the next batch of SVGs comes back:** derive each advance from the drawn
ink instead of a table. Bearings then stay correct through any reshaping and only the kern
table needs a pass.

---

## 8. The round-trip workflow

This is the loop the project now runs on, and it works.

1. **Export** from section 07. Every glyph comes out as one plain path on a font grid — em
   box, baseline, x-height and descender ruled in pink, glyph named on the cell. Coordinates
   are already in SVG's downward axis.
2. **Edit** in Illustrator. Two rules, both hard:
   - Save as **plain SVG**, not Illustrator or Figma native.
   - Ignore the `#guides` layer.
   - **Move points. Do not add or delete them.** Both masters must keep identical point
     counts, identical point order, identical start points, per contour. Interpolation is
     point-to-point; the moment two masters disagree structurally, the build fails or
     produces garbage.
3. **Push** the SVGs to the repo.
4. **Reimport.** Section 08 parses both files, diffs all cells against the generator, and
   reports which glyphs changed. Changed glyphs are promoted into `MASTERS` and interpolate
   from then on.

Both weights are what the axis interpolates between — edit both if you want the change to
hold across the range. Edit one and it gets mirrored, which is a stopgap, not a design
decision.

`makeMaster(black, regular)` does the interpolation: it splits both path strings on their
numbers, checks the literal segments correspond, and lerps every coordinate with
`t = (s − 53) / 53`. This is why point counts must match — the number arrays have to be the
same length and mean the same things in the same order.

---

## 9. The B, specifically

| | Black | Regular |
|---|---|---|
| Segments | 39 | 34 |
| Subpaths | 3 | 3 |
| bbox | 1240, 5500 → 1640, 6204 | same |

Same bounding box, same subpath count, different segment counts. `makeMaster` cannot pair
them.

The fix: pick one of the two as the skeleton, rebuild the other by *moving* its points to
match — same count, same order, same start point per contour. Section 08 keeps both overlaid
so you can see where they diverge.

---

## 10. The file itself

`Aqua.dc.html`, ~1670 lines, eight sections:

| | |
|---|---|
| 01 · specimen | Hero word at the live axis position |
| 02 · size proof | The same text down a size ladder |
| 03 · word test | Real words, kerning on |
| 04 · character set | All 30, named cells |
| 05 · spacing and kerning | Bearings and the live kern table |
| 06 · type anything | Free input |
| 07 · edit the outlines yourself | Export both masters or the live weight, plus the rules |
| 08 · what came back | The diff against your returned SVGs |

Palette: `#F2F1EC` ground, `#16150F` ink, `#EAE8E1` panels, `#6E695F` labels, `#A8492B`
links. IBM Plex Sans and IBM Plex Mono for the interface chrome — the typeface being
designed never sets its own UI.

The axis is a `stem` prop, range 53–106, exposed as a tweak.

---

## 11. Open questions from the original brief

Three things the brief could not settle and still cannot:

1. **The custom axis is undefined.** "Roundness" and "bounce" were both floated. These are
   different fonts. Roundness moves terminals between blunt and circular; bounce moves
   baselines per glyph. Pick one before that stage.
2. **Licensing.** The typeface grew from an existing logotype that is not ours to publish; its
   artwork was removed from the repository on 2026-09-19. Confirm the rights position before
   distributing a font.
3. **Naming and OpenType metadata** — family name, style names, version, designer, vendor
   ID, license URL. None specified.

---

## 12. Toolchain, when it comes to that

Glyphs.app cannot be scripted headlessly, but the `.glyphs` format is plain-text ASCII plist
and `glyphsLib` reads and writes it:

```
authoring     glyphsLib (GSFont) → .glyphs source, hand-editable in Glyphs.app
conversion    glyphsLib → designspace + UFO masters
build         fontmake → variable TTF
compress      fontTools.ttLib.woff2 → .woff2
verify        fontTools varLib.interpolatable + fontbakery
```

Ship the `.glyphs` file alongside the WOFF2 so the design stays editable. Run
`varLib.interpolatable` after every master-generation change — it is the check that catches
topology drift before it reaches a build.

Full factorial across five axes is 32 masters. Staging, each stage shippable: wght only
(3 masters, full character set — this is the real work, and most of it is drawing); then
wdth; then opsz, which needs spacing and contrast tables rather than new drawings; then
slnt, generated and corrected; then the custom axis. Stage 1 alone is a usable variable
font; the other four are not.

---

## 13. Next steps

1. **Reshape the glyphs you want to change.** Export from 07, edit both weights, push.
2. **Redraw B** in both weights from one skeleton.
3. **Reimport.** At that point, switch advances from the hardcoded table to
   measured-from-ink.
4. **Then** re-kern. Not before.
5. Decide whether capitals and numbers come next, and whether the ampersand is wanted.
