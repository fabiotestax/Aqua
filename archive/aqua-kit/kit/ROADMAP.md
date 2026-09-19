# AQUA — Roadmap & Review Gates

Each stage ends at a gate: a specimen pack Fabio approves, revises, or kills.
No stage starts before the previous gate clears.

## Stage 0 — Foundation (mostly done)
Seed repo with the existing engine (`aquascript.py`, `liquid.py`), the
the logotype reference imagery, approved v1.1 proofs, and the rejected
too-liquid v1.0 (kept as a boundary marker: this far, no further).
**Gate:** Fabio confirms the design language section in CLAUDE.md reads true.

## Stage 1 — Core glyph set
Glyph Designer extends skeletons to the full lowercase, then caps, then
figures. Work lands in groups of 4–6 related glyphs (round: o c b d q;
diagonal: v w x y k; etc.), each group proofed in real words.
**Gate:** per group — wordmark tests + glyph sheet + reference comparison.

## Stage 2 — Spacing & rhythm
Fit pass across the full set: sidebearings, then kerning pairs. Proofed
as text blocks at three sizes, not single words.
**Gate:** Fabio reads a paragraph and it feels even.

## Stage 3 — Variable axes
Font Engineer builds the master pipeline (fixed segmentation), then:
`wght` first (safe, proves interpolation), then `LIQD` (the signature).
**Gate:** axis sweep strips — one word rendered at 7 steps per axis —
plus a working browser slider demo.

## Stage 4 — Generative layer
Generative Engineer wires the parametric system so specimens (and later
the site) can render Aqua live: seeds, per-glyph liquidity variation,
animated axis travel. This is where Aqua becomes a system, not a file.
**Gate:** a self-running specimen page Fabio would happily screen-record.

## Stage 5 — testa.studio implementation
Web Designer implements Aqua on the portfolio: variable font served as
woff2, axis animation driven by scroll/pointer, a project case-study page
telling the Aqua story (reference → skeleton → liquid → variable).
**Gate:** live on testa.studio.

## Automation (from Stage 1 onward, once the repo is on GitHub)
One Claude Code **routine**, nightly: "Glyph Lab" — pick the next glyph
group or the weakest proof, iterate, open a PR containing only rendered
specimens in the description. Fabio reviews over coffee, merges or notes.
Trigger: weekdays. Context: this repo. Steering: CLAUDE.md.
