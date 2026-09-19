repo: fabiotestax/Aqua
branch: main
path: aqua my files

## Last sync
date: 2026-08-10T17:05:00Z

### Updated in this project
- Read back both round-trip exports (`exported svgs/aqua-black-106.svg`, `aqua-regular-53.svg`) and diffed all 39 glyphs against the generator.
- Ingested 15 edited glyphs as drawn masters: c, e, y, k, comma, r, a, b, h, p, d, q, f, i, j.
- Edits made in one weight only (c, e, h in Black; y in Regular) were carried point-for-point onto the other master.
- Numbers 0–9 pulled out of the character set; B skipped — its two weights have different point counts.

## Screen map
| Screen | Built from |
| --- | --- |
| Aqua.dc.html 01–06 | parametric code in-project + MASTERS block |
| Aqua.dc.html 07 · round trip | exports to `aqua my files/exported svgs/` |
| Aqua.dc.html 08 · what came back | `edits/edited-paths.json`, parsed from the two returned SVGs |
