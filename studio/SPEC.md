# Aqua Studio — build spec

The handoff for building the Studio in a fresh session. Everything below is decided; do not
re-derive it. Read `CLAUDE.md` and `AQUA-STATUS.md` first, then this.

## What it is

A local, offline, browser app (no server beyond `python3 -m http.server`) that is the studio
around the Aqua typeface: view, edit, test, space, build, export — with the typographic
optical laws built in as rules and audits. Fabio (creative director, not a type designer, does
not read code) is the only user. Plain language everywhere; Apple-grade UI; light and dark.

## What already exists — use it, do not rebuild it

- `aqua/Aqua.dc.html` — the canonical typeface: builders (`buildX(s)`), primitives (`contour`,
  `cutTop`, `foot`, `arch`, `corner`, `buildRing`, `strokePath`, `offsetPath`), contrast law
  (`thinRatio`, `contrastK`), spacing (`SHAPE`, `SBK`, `KERN`, `glyphWidth`, `layout`),
  drawn masters (`MASTERS`, `makeMaster`), SVG export/reimport. One `<script type="text/x-dc">`
  block. **First move: lift that script into `aqua/engine.js` as a plain module** (its own
  notes recommend exactly this); the page keeps working; the Studio imports the module.
- `aqua/masters/` — drawn masters + returned SVGs. `aqua/exports/` — round-trip exports.
- `tools/export_glyphs.mjs` — pulls every glyph at any stems from the page (Playwright).
- `tools/health.py` + `tools/render_health.py` — the health score and the colour sheet.
  Calibrated to the constructed doctrine (caps/fillets scale with the stem; only big-curve
  lumps, cusps, off-extreme points, density, bearings, master compatibility count).
- `tools/hand.json` — Fabio's verdicts; a glyph he marks is red regardless of geometry.
- `studio/blueprints/aqua-studio-v2.html` + PNGs — the approved screen designs (Glyphs room,
  New-glyph room). Build these, not something else.
- `tools/requirements.txt`; Node + Playwright preinstalled; React/Babel for the page come from
  a local npm pack (`npm pack react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0`).

## Decisions (do not reopen)

- `Aqua.dc.html` + `MASTERS` is canonical. aqua-kit is retired (`archive/`).
- Metrics: UPM 1000, x-height 521 (round overshoot 528), cap 715, ascender 751,
  **descender −230**, stem axis 53 → 106.
- Family: **Light / Regular / Black**. Existing masters are 53 and 106. Open question for
  Fabio only: is 53 the Light (recommended) with a new Regular master near stem 78?
- Every glyph keeps an interpolation-clean spine (identical point structure across masters).
- Health score gates the build. Fabio's hand verdicts override geometry.
- Spacing stays on hold until the reshape lands. Order: reshape → B → reimport →
  advances from ink → then kern.
- Reshape list (Fabio, 2026-09-19): k l s v w x y B comma. l and B constructed since;
  not yet approved by Fabio.
- The logotype (`refs/logotype/`) is a reference, not a target.

## Rooms (top-level areas)

Glyphs · Weights · Spacing · Test · Import · Export · Guide · Health

- **Glyphs** — per blueprint: matrix (colour = health), bones-and-skin canvas on the
  construction grid with plain-named guides (Tall letters / Capitals / Small letters /
  Baseline / Tails), tools Select · Add drop · Connect · Move · Nudge · Compare, preview card
  (Final · Squint · Negative), inspector (Weight; Thickness / Drop size / Roundness / Liquid;
  selected node: End Flat/Drop, Size, Position with "nudged … · reset to grid" — that IS the
  optical correction, no Δ sliders), Apply to all weights / Save as a variation / Start over,
  health lines in plain words. Family strip at the bottom.
- **New glyph** — per blueprint: tile grid, tap to add drops, faint reference image, height
  snaps Small/Capitals/Tall, "Trace the image for me", Add to Aqua.
- **Weights** — masters and instances; axis scrub; "works in every weight" audit.
- **Spacing** — advances from ink, bearing classes, kern editor, rhythm strip, `nnonon`
  control strings.
- **Test** — type anything, size ladder, invert, squint, flip, mirror, density heat-map.
- **Import** — SVG/EPS/image → grid-fitted glyph (smooth → skeletonize → snap).
- **Export** — SVG round-trip (keep the existing one); variable TTF + WOFF2 via fontmake +
  `varLib.interpolatable`; versioned.
- **Guide** — CLAUDE.md / AQUA-STATUS.md / this spec, rendered in-app, plain language.
- **Health** — the sheet, per-glyph flags, build gate, performance, broken-thing list.

## Optical laws — implemented as rules + audits, not previews

1. Overshoot: extremes declared flat/round/pointed; engine applies +7 round / pointed apex
   drop; audit flags a round extreme sitting on a guide.
2. Weight illusion: horizontals derived from the contrast curve, never drawn at stem width;
   audit measures every horizontal vs vertical.
3. Gravity: visual-middle guide at ~0.515; audit flags two-storey glyphs whose upper part
   is not smaller than the lower.
4. Irradiation: Negative preview always one click; optional inverse-compensated instance;
   audit: counter size at target px in negative.
5. Crowding at joins: junction detector + darkness measure; parametric compensation (the
   g's neck table, generalised); squint + heat-map.
6. Rhythm: counter-aware bearings; rhythm strip; auto-kern proposals; gap band 70–85 u.
Plus: optical size (later axis) and round-terminal weight compensation.

## Milestones (each a clickable local build)

M1 Shell (hours): engine lifted; app with all rooms navigable; light/dark; Glyphs matrix with
   health colours; canvas renders live glyph at any weight (view only); Test room; SVG export.
M2 Editing (2–3 days): landmark dragging with snap; nudge; alternates; undo; save/load;
   drawn-master editing with both weights linked; Import SVG.
M3 Font (1–2 days): Light/Regular/Black masters; fontmake build; interpolatable check;
   Spacing room; Health gate.
M4 Optical + polish (2–3 days): the six audits; image→glyph; Guide; Health room; finish.

## Working rules for the session

- Present everything as rendered PNG (Playwright screenshots of the running app).
- Stop only for real decisions (taste, naming). Do not wait per milestone.
- Commit small, push often; the branch is `claude/aqua-kit-setup-stage-1-26lpix` until Fabio
  says otherwise.
- Keep the thread light: read files once, avoid re-rendering the same proofs.
