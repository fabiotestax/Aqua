# Handoff: the logotype variable font

## Overview

Build a variable font from the the source logotype logotype. The typeface is a soft, rounded, high-x-height sans with real stroke modulation — vertical stems around 105 units against horizontal thins around 60, at 1000 UPM.

Target: **basic Latin lowercase + uppercase (52 glyphs)**, **Glyphs.app source format**, output as **WOFF2**, with axes for **weight, width, optical size, slant, and one custom axis**.

## Read this first: what actually exists

Four glyphs. That is the honest starting position.

| Asset | State |
|---|---|
| `sources/g-refit-22pt.svg` | Lowercase **g**, production-ready. 21 cubic points, every point on an extremum, tangents axis-locked. |
| `sources/h-refit.svg` | Lowercase **h**, 16 points. **Constructed**, not traced — see below. Stem 106, semicircular terminals. |
| `sources/a-refit.svg` | Lowercase **a**, 12 points. **Constructed**. Stem 106. |
| `sources/exclam.svg` | **Exclam**, 10 points. Constructed. Bar width 106, dot radius 56. |
| `sources/g-original-trace.svg` | The same g before refitting — 65 quadratic points from an image trace. Kept for reference only; do not build from it. |
| `sources/logotype-logotype-reference.jpg` | 4652 × 792 raster of the full lockup. Contains **B D a e g h l o p u** and ®. This is the only reference for any letter other than g, and it is a raster. |
| `measurements.json` | Every metric extracted from the above, in font units. |
| `sources/outline-audit.dc.html` | The audit that produced the refit. Open in a browser to see point structure and silhouette drift. |

**42 of the 52 required glyphs do not exist in any form.** Seven more exist only as pixels in the logotype. A variable font cannot be generated from this; it has to be drawn. The sections below define the skeleton precisely enough that drawing it is a bounded job rather than an interpretation.

Worth noting: the h and a traced from the artwork landed on stems of 105 and 108 against the g's 105, with no adjustment, and their widths came within 1% of the same letters measured off the logotype raster. The source drawing is internally consistent, which means the metrics below can be trusted for the remaining glyphs.

## Handle discipline — why these outlines are smooth

**Do not trace the artwork. Construct against it.** This was learned the hard way on the h and a.

Fitting a curve to a traced outline reproduces the artwork's hand wobble as faceting. Tightening the tolerance makes it worse — the fitter chases the wobble and lands 25–38 points on a letter that needs 16, with lumps at every terminal and junction. Loosening the tolerance smooths the wobble but also smooths the design away. There is no setting that gives a clean letter, because the defect is in the source.

The h, a and exclam here are therefore **constructed**: a list of points, each on an extremum, each with an explicit axis-aligned tangent, and handles set to the circle constant (0.5523) on quarter turns and one third of the chord on straight runs. Sixteen points for the h, twelve for the a. The artwork sets the proportions; the geometry sets the curves. A lump is not possible, because no control point is ever placed by a solver.

The same rule covers fitted outlines like the g, where tracing is unavoidable: clamp each handle to a fraction of the chord's extent along its own direction, roughly **0.20 – 0.90**.

```
handle_1 = P0 + t1 × clamp(a, 0.20·s1, 0.90·s1)
handle_2 = P3 + t2 × clamp(b, 0.20·s2, 0.90·s2)
s = |t · (P3 − P0)|
```

Because the tangents at extrema are axis-aligned, this makes every segment provably monotone in both x and y. A bulge becomes geometrically impossible rather than merely unlikely.

Also floor every handle at **15% of its own chord**. A handle that resolves to zero has an undefined tangent at that node — `fonttools varLib.interpolatable` flags it, and interpolating masters through a degenerate handle is unstable. Ours hit zero once, when two landmarks happened to land at the same y and the quarter-turn formula multiplied by a zero delta. The floor catches that class of accident before it reaches a build.

### Terminals must be parametric

A second failure, and a subtle one. The first weight axis offset the Black outline inward. That collapses terminals: a flat terminal with a 30-unit corner radius, offset inward by 39, has a negative radius — it renders as a spike. Every stem end on the h grew a point at Light and Thin.

Two things fix it, and both are needed:

- Make terminals **semicircular caps of radius s/2** rather than flat cuts with small corners. Offsetting then reduces the radius in step with the stem and the cap stays a cap.
- Better, **generate each weight from the parameters** rather than offsetting a master. The h, a and exclam here are functions of the stem width; every landmark that depends on stroke thickness scales with it.

The second point matters for more than terminals. Any landmark you leave fixed while the stroke thins will eventually cross one that moves — on the a, a fixed shoulder height meant the arm's underside rose above its own top edge at Thin and the contour self-intersected. If a coordinate describes where two strokes meet, it is a function of the stroke width.

## Metrics — these are settled, do not re-derive

```
UPM             1000
baseline           0
x-height         521   (round letters overshoot to 528)
cap height       715
ascender         751
descender       -178
```

The refit g **needs no scaling or repositioning**. Its coordinates already sit correctly on these metrics — drop it into the default master as-is.

These numbers are trustworthy because two independent sources agree. The logotype g's descender-to-bowl-top ratio is 0.330; the vector g's is 0.330. That fixes the raster-to-units scale at **1.439** with no slack, and every other metric follows from it.

Watch for three things when measuring further letters off the raster:

- The logotype baseline rises about 0.46° left to right. Measure each letter against its own local baseline.
- `u` is the only flat-topped lowercase, so it is the only true x-height reading. Round letters read 3–4% taller because they overshoot.
- Cap height reads 499 on B and 495 on D. That is scan noise. Use 715 units for both.

## Weight — the constraint that governs everything

Measured by scanline across the refit g:

```
vertical stems      105.7  105.1  106.2  106.9
horizontal thins     52.2   63.1   67.5
contrast ratio       0.57
stem / x-height      0.202
```

This is a **Bold or Black master with genuine modulation**. It is not monolinear, and that has a direct consequence for how you generate other weights:

> A uniform outline offset — `booleanOperations`, a stroke-expand, or any constant-distance dilation — will thicken horizontals and verticals equally and flatten the 105:60 ratio into 1:1. The result stops looking like this typeface at the first interpolation step.

Use an **anisotropic offset** instead: scale the offset distance by the tangent's angle, so a stem moves at full rate and a horizontal moves at half.

```
offset(θ) = base_offset × (k + (1 − k) × |sin θ|)
k = 0.50
```

where θ is the **tangent's** angle from horizontal — so |sin θ| = 1 on a vertical stem and 0 on a horizontal.

`k` must equal the thin-to-stem ratio you want to preserve, which here is 0.49. Set it higher and the face goes monolinear as it lightens; set it lower and contrast climbs, which is backwards — lighter weights should trend *more* monolinear, not less.

This has been tested on the g. Six weights generated this way hold the ratio at 0.49–0.53 from stem 106 down to stem 24. Section 05 of `sources/outline-audit.dc.html` shows the ladder with the measured figures under each glyph, and a live slider on the axis.

Two things the offset alone does not solve, both visible at the light end:

- **The neck breaks.** This is the one that matters. The link joining the upper bowl to the lower loop runs diagonally, so an offset eats it from both sides at once and it thins far faster than a stem does. Measured: 70 units at Black, 25 at Medium, 8 at Regular, **2 at Light and Thin** — the glyph comes apart. See below.
- Ink width drops 428 → 350 across the ladder, so sidebearings must open as the weight lightens or the colour goes patchy.

### Neck compensation

Back the offset off on the six points that form the neck — the three on the outer left spine and the three on its inner edge. In the refit's coordinates those are the anchors satisfying `x < 250 && 20 < y < 280`, which selects exactly those six and nothing else. Both counters fall outside the band.

Multiply the anisotropy factor by `comp` on those points only:

| offset | 0 | 11 | 19 | 26 | 33 | 39 |
|---|---|---|---|---|---|---|
| comp | 1.00 | 0.573 | 0.571 | 0.575 | 0.574 | 0.576 |
| resulting neck | 70 | 55 | 44 | 35 | 25 | 17 |
| without it | 70 | 44 | 25 | 8 | 2 | 2 |

Interpolate linearly between rows. These values were solved to hold the neck at its source ratio to the stem (0.65) at every step. On this outline the correction is essentially constant at 0.574 from Bold down — but do not assume that generalises; re-solve it per glyph rather than reusing the number.

Below Light the patch runs out and the neck wants redrawing rather than offsetting.

Section 05 of `sources/outline-audit.dc.html` shows the uncompensated and compensated ladders side by side, with a zoomed crop of the neck at Light and a toggle for the compensation.

Expect the same problem in every glyph with a diagonal join — **a e g s** and the **K R** junctions. The band test will differ per glyph; the principle will not. Apply it point-wise.

## Master generation — the topology rule

Every master must have **identical point counts, identical point order, and identical start points**, per contour. Interpolation is point-to-point; the moment two masters disagree structurally, the build fails or produces garbage.

This rules out any boolean or path-reconstruction operation for master generation, because those re-solve the outline and renumber points. **Generate masters by point-wise transforms of the default master only.** The refit exists precisely so this is possible: 22 points, all on extrema, so transforms land predictably.

Per axis:

- **Weight (wght)** — anisotropic offset per the formula above. Real drawing correction needed at the joins where the neck meets the bowl; those two notches on the left spine close up first.
- **Width (wdth)** — scale x, then re-thicken vertical stems back to target so they don't thin out. Horizontals stay put.
- **Slant (slnt)** — shear is correct for stems and wrong for round letters, which need reshaping rather than skewing. Treat a sheared master as a first pass to be corrected, not a finished one.
- **Optical size (opsz)** — at the small end: open the counters, reduce contrast toward monolinear, add sidebearing. At the display end: tighten spacing, increase contrast.
- **Custom axis** — undefined. See the open questions.

## Scope: five axes is a large ask

A full factorial across five axes is 2⁵ = 32 masters. The designspace format supports sparse and intermediate masters, so you will not need all 32, but you should not plan a single build that lands all five at once either.

Suggested staging, each stage shippable:

1. **wght only**, 3 masters (Light / Regular / Black), full 52 glyphs. This is the real work — most of it is drawing, not engineering.
2. **+ wdth**, adding condensed masters at the weight extremes.
3. **+ opsz**, which mostly needs spacing and contrast tables rather than new drawings.
4. **+ slnt**, generated then corrected.
5. **+ custom axis**, once it is defined.

If time is limited, stage 1 alone is a usable variable font and the other four are not.

## Drawing the missing 42

Derive rather than invent where the skeleton allows. Suggested order, each group reusing the one before it:

- **o** from the g's bowl → **c e** by opening it, **b d p q** by adding the stem
- **l** (a plain stem, present in the logotype) → **i** by shortening, **h n m** by adding shoulders, **r** from n
- **u** from n inverted → **a** from u plus the bowl, **y** from u plus the g's tail
- **f t** from the stem plus a crossbar, **j** from i plus the g's tail
- **s** and **z**, **k v w x** — these have no antecedent and must be drawn fresh
- Uppercase: **O** from a scaled o → **C D G Q**, **B P R** from D, **E F H I L T** from the stem, **A M N V W X Y Z K S U J** fresh

Ten of these have raster reference in the logotype. The rest must match the skeleton by construction: stem 105, thin 60, x-height 521, cap 715, round overshoot 7.

## Toolchain

You asked for Glyphs.app source. Glyphs is a macOS GUI application and cannot be scripted headlessly, but the `.glyphs` file format is plain-text ASCII plist and `glyphsLib` reads and writes it, so this works:

```
authoring     glyphsLib (GSFont) → .glyphs source, hand-editable in Glyphs.app
conversion    glyphsLib → designspace + UFO masters
build         fontmake → variable TTF
compress      fontTools.ttLib.woff2 → .woff2
verify        fontTools varLib.interpolatable + fontbakery
```

Ship the `.glyphs` file alongside the WOFF2 so the design stays editable.

Run `fonttools varLib.interpolatable` after every master-generation change. It is the check that catches topology drift before it reaches a build.

## Spacing

Measured letter gaps in the logotype average 65px, which is 94 units — generous, and correct for the weight. As a starting point:

```
round sidebearing    47 per side
advance width, o     501
```

Ink widths in units, measured off the raster: B 453, D 453, a 373, e 389, g 440, h 381, l 111, o 407, p 406, u 381. The refit g's own ink width is 428, against 440 measured from the raster — a 3% scan discrepancy. Trust the vector.

## Open questions

Three things the brief cannot settle:

1. **The custom axis is undefined.** "Roundness" and "bounce" were both floated. These are different fonts. Roundness would move terminals between blunt and circular; bounce would move baselines per glyph. Pick one before stage 5.
2. **Licensing.** the logotype® is a registered mark and the logotype is existing artwork. Confirm the rights position covers extending it into a distributable typeface before publishing anything.
3. **Naming and OpenType metadata** — family name, style names, version, designer, vendor ID, license URL. None of these are specified.

## Files

```
README.md                          this brief
measurements.json                  all extracted metrics, machine-readable
sources/g-refit-22pt.svg           the production g, 21 points
sources/g-original-trace.svg       pre-refit, reference only
sources/h-refit.svg                the h, 25 points
sources/a-refit.svg                the a, 21 points
sources/exclam.svg                 the exclam, 10 points
sources/logotype-logotype-reference.jpg   the raster lockup
sources/outline-audit.dc.html      point-structure audit, opens in a browser
```
