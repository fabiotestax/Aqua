# Aqua — working notes for Claude Code

A variable typeface built from an existing logotype. One weight axis, 30 characters.
Everything — generator, proofs, SVG export, SVG reimport — lives in a single HTML file.

**Read `AQUA-STATUS.md` first.** It is the full project state: metrics, the weight law, the
construction rules, a glyph-by-glyph inventory, the spacing system, the round-trip workflow,
and open questions. This file only covers how to work in the repo.

---

## Running it

```
cd aqua && python3 -m http.server     # then open http://localhost:8000/Aqua.dc.html
```

`aqua/Aqua.dc.html` is a plain static page. It loads `engine.js` (the typeface) and
`support.js` (the component runtime) from the same folder, `masters/edited-paths.json` for
section 08, and pulls IBM Plex Sans + IBM Plex Mono from Google Fonts. No build step, no
package manager. Serve it over HTTP — `file://` blocks the `fetch` that section 08 needs.
(The runtime also loads React + Babel from unpkg; in a sandbox without CDN access,
`tools/export_glyphs.mjs` and `tools/shoot_page.mjs` serve them from a local npm pack:
`npm pack react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0`, unpack, and point
`AQUA_VENDOR` at a folder holding `umd/react*.production.min.js` and `babel.min.js`.)

**The geometry is `aqua/engine.js`** (lifted out of the page 2026-09-19, byte-identical
export before and after). It is a plain script with no dependencies: `window.AquaEngine` in a
browser, `require('./aqua/engine.js')` in Node. The page's own script block is now only the
`Component` class; the Studio (`studio/`) imports the same file. Edit glyphs in the engine,
never in the page.

**This file is canonical.** Decided 2026-09-19: `Aqua.dc.html` + `MASTERS` is the single
source of truth for the typeface. The earlier skeleton-stroking engine (`archive/aqua-kit/`)
is retired; only its verification tools and the Studio blueprints carry forward.

### Aqua Studio

**Live:** https://fabiotestax.github.io/Aqua/studio/ — GitHub Pages, served from this
branch's root (repository made public and Pages switched on by Fabio, 2026-09-19). Every push
to the branch redeploys it within a minute or two. `.nojekyll` at the root keeps Pages from
processing the files. When the branch is merged, switch the Pages branch to `main`.

```
python3 -m http.server 8000        # locally: from the repo root, then open http://localhost:8000/studio/
```

`studio/` is the app around the typeface (spec: `studio/SPEC.md`; blueprints:
`studio/blueprints/`). Plain HTML + CSS + JS, no framework, no build: `index.html` loads
`../aqua/engine.js`, `health.js` (the health score, ported from `tools/health.py` and
validated against it) and `studio.js` (the rooms). It reads `../tools/hand.json` for Fabio's
verdicts and `../aqua/masters/edited-paths.json` for the Import room's diff. Serve the repo
root, not `aqua/`, so those relative paths resolve. `node tools/shoot_studio.mjs` screenshots
every room in light and dark into `studio/shots/` — that is how the app is shown to Fabio.

All four milestones of `studio/SPEC.md` are built: 1 shell, 2 editing, 3 font build /
Spacing / health gate, 4 the six optical audits, the New-glyph room with image tracing, and
the manual (`studio/GUIDE.md`, first tab of the Guide room).

**The six optical audits** live in `studio/audit.js` (`audit(ch, s)` → findings per law:
overshoot, weight illusion, gravity, irradiation, crowding at joins, rhythm; ~100 ms for the
whole set). They are advisory only: the Health room's "Six optical checks" table, the
inspector's "Optical" lines, and red haloes on the canvas for dark joins. The canvas also
shows the Middle guide at 0.515 of the x-height (of the cap height for B).

**New letters from drops** (`studio/newglyph.js`, engine `strokeDrops` / `dropsOutline`).
A new letter is `doc.newGlyphs[key] = { ch, name, height, thick, ends, round, strokes, use,
category, liquid }`: strokes of drop centres on the 40-unit tile grid. The engine draws a
spine through each stroke (bisector tangents clamped to the shorter chord), thickens it with
the family's contrast (full stem standing up, thinner lying down, eased along the stroke),
ends it in a round cap or a flat cut, and gathers any self-crossing loop at a sharp corner
onto the crossing point so the outline never crosses itself and keeps the same point count
at every weight. A stroke whose end meets its own start is gathered too, so a closed ring is
always two overlapping open arcs. Strokes overlap where they meet, so a drops letter fills
**nonzero** (`fillRule(ch)`); the Studio's renderers and the export sheet honour that, and
the font build keeps the overlaps (TrueType fills by winding) with every stroke oriented as
an outer contour. **Liquid joins** (`junctions` / `webs`, on unless `liquid: false`): every
junction is found on the spines (a stroke's end within 1.6 tiles of another stroke, or two
spines crossing), the ending stroke is stretched so its cap just touches the other stroke's
far edge from inside, and each notch between two adjacent arms (angle 20°–160°) gets a web:
a 3-point patch bounded by the two edges and a fillet tangent to both, radius 0.9 of the
thinner arm's half-width at that weight. Junctions do not depend on the weight, so the webs
keep the point count matched. The tracer (`traceImage`) thresholds a reference image, thins
it (Zhang–Suen), walks the skeleton into polylines, simplifies, snaps to tiles and joins the
pieces end to end — a first pass to edit, not a drawing. The density rule of the health
score does not apply to drops letters.

**The new-letter dialog** (`startNew()` / `openDialog()` in `newglyph.js`, Cmd/Ctrl+N or the
+ tile): typed-as (one character or `U+XXXX`, with the keys Aqua does not use laid out),
name, category, height, and where to start — an empty grid, a suggested structure, a traced
image, or Aqua's rules. **The skeleton library** (`studio/skeletons.js`, `AquaSkeletons`)
holds 110 structures — a–z, A–Z, 0–9, punctuation and signs, a few pictos — as drop strokes
in font units with a plain-language `describe(ch)`; `strokes(ch, height)` scales one to a
height. It is a codified library of the usual construction of each character, not learned
from other fonts, and the dialog says so. `node tools/shoot_skeletons.mjs` renders the whole
library through the engine to `studio/shots/skeletons-light.png`.

**The digits and the set.** The rules have always drawn 0–9; `spareChars()` lists what the
rules can draw beyond `ORDER`, `doc.extra` switches them on one by one (`D.addExtra` /
`removeExtra`, the Health room's chips, the dialog's "Aqua's rules"), `extraChars()` reads
that, and `allChars()` is `ORDER` + extras + the drops letters in use. Every room, the
export sheet, the health, the audits and the font build go through `allChars()`. Categories:
`doc.categories` (editable list, `DEFAULT_CATEGORIES`) and `doc.category[ch]`; `categoryOf`
guesses from the character; a new letter carries its own `category`. The Health room's
"The set" panel shows the counts.

**Simplify** (`simplifyPath` / `simplifyPair`, `D.simplify(ch)`, "Redraw with fewer points"
in the inspector for any letter over 40 points): the outline is flattened (8 samples per
curve), corners (turning over 50° within 12 units either side) and extremes (x or y
direction changing sign) become the points, one cubic is fitted per run (least squares for
the handle lengths, four Newton reparameterisations), and a run that misses by more than
1.5 units is split at its worst point. The splits are found on the Black and replayed index
for index on the Light, so both weights come out with the same structure; the result is a
master pair with `source: 'simplified'` that `forgetMaster` undoes. The s goes from 354
points to 24 within about 2 units of the original.

**Not offered, and why** (also in the Guide): booleans change the point count and can do so
differently per weight, which breaks the blend; a freehand pencil would trace, and Aqua is
constructed. Drops letters keep their overlaps instead.

**The font build.** `node tools/export_masters.mjs [edits.json]` writes `build/masters.json`
straight from the engine (no browser): every glyph at the three master stems 53 / 78 / 106,
placed at its sidebearing with its advance, plus kerning per master, the word space, the
metrics and the health of the set. `python3 tools/build_font.py [--draft]` (venv) turns that
into three UFOs + a designspace (wght 300 Light · 400 Regular · 900 Black, mapped to the
stems), runs `fontTools.varLib.interpolatable`, then fontmake → `build/Aqua-VF.ttf`,
WOFF2, and glyphsLib → `build/Aqua.glyphs`. Contour direction is set by nesting parity (outer
counter-clockwise in the UFO; ufo2ft flips for TrueType). `build/` is ignored; the WOFF2 and
`build-info.json` (version, date, gate, interpolatable) are copied to `studio/fonts/`, which
is committed, so the Test room can show the real font ("Show the built font") and the Export
room offers the download. The gate: a red glyph stops the build; `--draft` builds anyway as
"Aqua Draft". The Regular master at 78 is the engine's own output (true for the parametric
glyphs, the blend for drawn ones) and is what keeps the variable font faithful between the
drawn weights.

**Spacing.** Still on hold by decision, but the room is live to try: "Room from ink" (advance
from the drawing's bounds instead of the hardcoded table), edge classes per letter, the kern
pairs (edit, remove, add). All of it goes through `doc.spacing` and the engine's `spacing()`
/ `shapeOf()` / `kernOf()` / `kernPairs()`, so it lands in every room, the export sheet and
the font build; `bake_edits.mjs` bakes it into `BAKED.spacing`.

**How editing works.** The Studio never writes to `engine.js`. Its changes live in a
document (`studio/doc.js`): per glyph, one or more *variations*, each holding point edits
per master weight — `{ [nodeIndex]: { d: [dx, dy], r: roundness } }` for `light` and
`black` — plus any drawings brought in from an SVG sheet as replacement masters. The engine
applies the document at draw time (`setDoc` → `outline(ch, s, variant)`): a node edit moves
the on-curve point and its two handles, `r` scales those handles, and any weight between the
masters blends Light and Black. With no document the engine's output is byte-identical to
before. The document autosaves in the browser (`localStorage`), saves to and opens from
`aqua-studio-edits.json` (top bar, or Cmd/Ctrl+S), and has undo/redo (Cmd/Ctrl+Z, Shift for
redo, 80 steps). `node tools/bake_edits.mjs <file.json>` makes a document permanent: imported
drawings become `MASTERS` lines, and the used variation's point edits go into the engine's
`BAKED` table. Clear the Studio's document after baking.

**Import.** Drop an exported sheet on the Import room. Each `glyph.<name>` path is read
through `normalizeSVGPath` (any SVG commands, relative or absolute) into font units from its
cell, the export's left-ink shift is undone, and it is compared with the letter *as it is
now* (edits included). A drawing whose point structure differs is refused with the reason.
Bringing one in replaces that weight's master, freezes the other weight as it looks now, and
clears that letter's point edits, so the axis always has two matching outlines.

**The editor** (`studio/editor.js`): selection is a Set — click, Shift-click, a marquee on
empty canvas (Shift adds), Cmd/Ctrl+A, Tab; a drag on any selected point moves them all
through `D.nudgeMany`; arrows nudge; Backspace removes points (`D.deleteNodes`, an
`op` in the variation, applied by the engine's `applyOps` before the nudges, identically at
every weight); Add point inserts on the outline (`E.nearestOnPath` → `D.insertNode`, a de
Casteljau split); Measure draws a ruler; rotate / scale / flip act about the selection's
centre. Space or the middle button pans, scroll / + / − zoom, 0 fits. The health module's
`marks(ch, s)` puts amber haloes on overlapping points and bumps, the audit's crowding
finding puts red ones on dark joins; the neighbours draw as ghosts from `E.layout`; a line
of the set runs under the canvas; "Aqua's rules at this weight" lists the derived numbers.
The Save button gets `attn` while the document has unsaved changes and the inspector carries
a savebar. `?` opens the cheat sheet (`CHEAT` in `studio.js`).

`node tools/test_studio.mjs` drives the running app end to end (drag, undo, nudge, snap,
multi-select, marquee, pan, add / remove point, measure, cheat sheet, one-weight editing,
variations, save/open, autosave, import, forget, spacing, the built font, the digits, the
Health counts and categories, the new-letter dialog, drops letters, the tracer, the skeleton
library, liquid joins, simplify — 75 checks) and must stay green.

### One thing that will look strange

The file is written in a component format (`<x-dc>` template + a `Component` logic class),
and `support.js` is that format's runtime. It works as-is offline. But it is not React, not
Vue, and not a format you will recognise.

**Do not port it to a framework as a first move.** The value here is the geometry — the
builder functions, the metrics, the contrast curve, the spacing tables — and all of that is
plain JavaScript sitting in one `<script>` block. If the format gets in the way, lift the
script out into a `.js` module and drive it from whatever you like. The typeface does not
care.

---

## Where things are

```
CLAUDE.md                     this file — how to work in the repo
AQUA-STATUS.md                the full state of the project — read this first

aqua/                         THE TYPEFACE (canonical)
  engine.js                   the typeface: builders, masters, spacing, export, reimport
  Aqua.dc.html                the proof page — loads engine.js, adds only its own UI
  support.js                  the component runtime the page needs
  masters/masters.json        the drawn weights as ingested
  masters/edited-paths.json   raw paths parsed from the returned SVGs (section 08 reads this)
  masters/edited-summary.json bbox / segment count / subpath count per glyph per weight
  masters/aqua-*.txt          the two returned SVGs as text
  exports/aqua-*.svg          the round-trip exports (what goes out to Illustrator)
  sources/g_refit-22pt.svg    the production g, 22 cubic points
  sources/para.json           early parametric h/a/exclam paths, historical

brief/                        the original handoff: README.md, measurements.json, sources/
refs/logotype/                (removed 2026-09-19 — the source artwork is no longer kept here)
refs/sessions/                screenshots from the design sessions
tools/                        the workshop: build, verify, health score (Python + Playwright)
studio/blueprints/            Aqua Studio screen designs (HTML + PNG)
archive/aqua-kit/             the retired skeleton engine and its proofs, kept as history
archive/design-sync/          the old Claude Design ↔ GitHub sync record
```

### Decisions taken 2026-09-19 (with Fabio)

- Descender is **−230**. The drawn y and j tails are the design; the brief's −178 is retired.
- Target family: **three weights — Light, Regular, Black** — with the spine (point structure)
  kept interpolation-clean on every glyph so further instances can be added later.
  Weight naming settled by Fabio 2026-09-19: **53 is the Light**, 106 the Black; Regular is a
  new master to be drawn near 78.
- The g gets rebuilt on the same parametric parts as the rest, and must still look like the g.
- Every glyph carries a **health score** (curvature, interpolation compatibility, point
  discipline, spacing sanity, hand-checked) shown as a colour code, so the state of the set
  can be read at a glance. The same score gates any font build.
- The reshape phase from AQUA-STATUS §13 never happened; many glyphs are half-baked. Spacing
  stays on hold until the set is reshaped, per the existing rule.

Inside `engine.js`, in order: constants and the contrast curve → shared primitives
(`contour`, `cutTop`, `foot`, `arch`, `corner`, `buildRing`, `strokePath`, `offsetPath`) →
one `buildX(s)` per parametric glyph → SVG export + reimport → the spacing block (`SHAPE`,
`SBK`, `KERN`, `glyphWidth`, `layout`) → `MASTERS` and `makeMaster` → `layout` → the reimport diff. The `Component` class stays in the page.

---

## How a glyph actually gets drawn

Three different mechanisms, and you need to know which one you are touching:

1. **Parametric** (14 glyphs: `l m n o s t u v w x z B ! .`) — a `buildX(s)` function of stem
   width. Change the function, every weight changes.
2. **Drawn masters** (15 glyphs: `a b c d e f h i j k p q r y ,`) — two hand-drawn outlines in
   the `MASTERS` object. `makeMaster` lerps every coordinate between them. Editing the builder
   for one of these does nothing; `MASTERS` overwrites `BUILD` at load.
3. **Offset** (`g`) — the original refit outline, thickened by anisotropic offset with a
   compensation table for the neck.

`MASTERS` wins. That assignment is the last thing that touches `BUILD`:

```js
Object.keys(MASTERS).forEach(n => { BUILD[MASTERS[n].ch] = makeMaster(...); });
```

Since the Studio, every outline goes through `outline(ch, s)`: the base from `BUILD` (or the
g's offset, or a document's imported master), with the document's or `BAKED` point edits
laid on. `RULES` keeps the parametric builders as written, before `MASTERS` overwrote them.

---

## Rules that are not negotiable

These were each learned by breaking something. `AQUA-STATUS.md` has the reasoning.

- **Never trace. Construct.** Points on extrema, axis-aligned tangents, handles at 0.5523 on
  quarter turns. No solver places a control point.
- **Both masters of a drawn glyph must have identical point counts, order, and start points
  per contour.** `makeMaster` splits both path strings on their numbers and lerps
  index-by-index. Mismatched counts produce garbage, not an error. This is exactly what
  blocks the capital B today (39 segments vs 34).
- **Any coordinate describing where two strokes meet is a function of stroke width.** Fixed
  landmarks cross moving ones at the light end and the contour self-intersects.
- **The offset is anisotropic.** `k = 0.50`. A uniform offset flattens the 105:60 contrast
  into 1:1 and the face stops looking like itself at the first interpolation step.
- **Terminals are parametric caps, not flat cuts with corner radii.** A 30-unit radius offset
  inward by 39 is a negative radius and renders as a spike.

---

## Known debt

- **Capital B does not interpolate.** Two weights, different segment counts. Needs redrawing
  from one skeleton in both weights.
- **`glyphWidth()` advances are hardcoded** from when every glyph was parametric. When a
  glyph became a drawn master its ink moved and the table did not follow — that is the whole
  cause of the `j` and `k` spacing bugs. Derive advances from measured ink at the next
  reimport and this class of bug goes away.
- **Descender is ambiguous.** The brief says −178; the drawn `y` and `j` tails reach −230 and
  the file uses −230. Settle this before any font build.
- **Kern table is fitted to current outlines.** ~150 pairs. Any significant reshape
  invalidates it. Bearing *ratios* and the word space survive; the pairs do not.
- **Numbers 0–9** have working builders but are out of `CHARSET` / `ORDER`.
- **No capitals but B, no ampersand, no font binary.** Nothing has been through
  glyphsLib/fontmake yet.

---

## The workflow this project runs on

Export SVG → edit in Illustrator → push → reimport as drawn masters. It works; keep it.

1. Section 07 of the page exports every glyph as one plain path on a ruled font grid, at
   both masters or at the live weight.
2. Edit in Illustrator. Save as **plain SVG**. Ignore the `#guides` layer. **Move points,
   never add or delete them.**
3. Section 08 diffs the returned files against the generator and reports what changed.
4. Changed glyphs get promoted into `MASTERS`.

Edit both weights. Editing one and mirroring it onto the other is a stopgap that has already
been used four times (`c e h` Black→Regular, `y` Regular→Black) and those masters no longer
match the SVG they came back in.

---

## Current phase

The designer is about to reshape a significant number of glyphs. **Spacing work is on hold
until that lands** — bearings are measured off outlines and every contour that moves
invalidates them. Do not re-kern preemptively.

Order of operations: reshape → redraw B → reimport → switch advances to measured-from-ink →
*then* re-kern.

---

## If you take it toward a real font

Glyphs.app cannot be scripted headlessly, but `.glyphs` is a plain-text plist and
`glyphsLib` reads and writes it:

```
glyphsLib (GSFont) → .glyphs → designspace + UFO masters → fontmake → variable TTF → woff2
verify with: fonttools varLib.interpolatable, fontbakery
```

Run `varLib.interpolatable` after every master-generation change. It catches topology drift
before it reaches a build — the B problem, found automatically.

Ship the `.glyphs` alongside the WOFF2 so the design stays editable.
