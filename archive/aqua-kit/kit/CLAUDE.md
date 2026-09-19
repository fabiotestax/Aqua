# AQUA — Project Constitution

Aqua is a generative **variable typeface** directed by Fabio (Creative Director).
Fabio does not design or code. Agents do the work; Fabio briefs and reviews.
Every agent working in this repo follows this file.

## The design language (locked — do not relitigate)

- **Base anatomy:** crisp, semi-condensed humanist sans. Tall x-height,
  tight fit, flat (butt-cut) terminals by default. Reference: the source
  wordmark anatomy (artwork removed from the repo). Double-storey **a** and double-storey **g**.
- **Liquidity is an accent, not the substance.** This was hard-won direction:
  an early build went too soft and was rejected. Liquid moves are deliberate,
  placed details: drip disconnections (the g's ear and link rendered as clean
  cracks), droplet-pooled terminals only where stamped, short fluid tails on
  l/t. The word must read crisp first, liquid second.
- **Aqua is an original typeface.** The reference informs anatomy and
  proportion; we never trace or clone its outlines.

## Architecture (inherited, working)

- Glyphs are **skeletons** (centreline curves), not outlines. `aquascript.py`
  inflates skeletons via Skia stroking (per-stream caps, droplet stamps) and
  compiles a real TTF with fontTools. `liquid.py` renders the same skeletons
  as a smooth-min distance field (the "molten" display state).
- All new glyph work extends the skeleton format. The skeleton is the single
  source of truth; weight and liquidity are rendering decisions.

## Variable font — the engineering crux

Variable fonts interpolate between masters with **identical point structures**.
The marching-squares liquid engine breaks compatibility; therefore masters
must be generated from the same skeletons with **fixed, identical
segmentation** across all masters. Target axes:

- `wght` — stroke weight (skeleton radius).
- `LIQD` (custom, 0–100) — dry to liquid: terminal pooling grows, cracks
  widen, waists deepen, corners soften. Same skeletons, same point counts.

Masters are built parametrically, then combined with fontTools `varLib`.

## Working rules (non-negotiable)

1. **Fabio never reads code.** Every piece of work is presented as rendered
   specimen PNGs: the wordmark test (the source word + new strings), a glyph
   sheet, and — for variable work — an axis sweep strip. If it isn't
   rendered, it doesn't exist.
2. **Small reviewable steps.** One concern per PR/handover: a glyph group,
   an axis, a page section. Never a mixed dump.
3. **Notes come in design language.** Fabio will say "the ear floats,"
   "too bubbly," "close the loop." The Producer translates into tickets;
   engineers never ask Fabio for parameter values.
4. **Proof against reference.** Every specimen ships alongside the reference
   comparison layout (see /refs) so drift is caught before Fabio sees it.
5. **Crit gate.** The Crit agent reviews all work against this file before
   it reaches Fabio. Work that violates the design language goes back.

## Repo layout

- `/refs` — reference imagery, approved specimens, rejected directions
- `/skeletons` — glyph skeleton data (source of truth)
- `/engine` — aquascript.py, liquid.py, master + varLib build scripts
- `/proofs` — rendered specimens per iteration, dated
- `/site` — testa.studio implementation (final stage)
