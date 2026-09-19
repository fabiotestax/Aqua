# Aqua

A variable typeface grown from an existing logotype: one weight axis from Light to
Black, thirty characters so far, every letter built from the same few parts so the family
holds together at every weight.

**Aqua Studio**, the workbench around it, runs in the browser:
**https://fabiotestax.github.io/Aqua/studio/**

Glyphs · Weights · Spacing · Test · Import · Export · Guide · Health. Move points, compare
weights, type anything, send a sheet to Illustrator and bring it back, read the health of
the whole set at a glance. Nothing to install; your edits save in the browser and to a file.

## In this repository

| | |
|---|---|
| `aqua/engine.js` | the typeface: rules, drawn weights, spacing, export |
| `aqua/Aqua.dc.html` | the proof page |
| `studio/` | Aqua Studio |
| `tools/` | the workshop: export, health score, screenshots, tests, baking edits |
| `refs/` | screenshots from the design sessions |
| `AQUA-STATUS.md` | where the project stands |
| `CLAUDE.md` | how to work in the repository |
| `studio/SPEC.md` | the Studio's build plan |

To run it locally instead: `python3 -m http.server 8000` from this folder, then open
`http://localhost:8000/studio/`.

