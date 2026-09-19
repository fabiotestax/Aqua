# Aqua Studio — how to use it

Aqua Studio is the workbench around the Aqua typeface. It runs in your browser, needs no
account and no internet, and every change you make is yours until you decide it is final.

## The rooms

**Glyphs** is where you work on a letter. Pick one in the grid on the left. The colour bar
under each letter is its health: green looks good, amber needs a look, red is not Aqua yet.
The big letter in the middle sits on its guides: Tall letters, Capitals, Small letters, the
Baseline and the Tails. The dotted lines either side are the letter's box, the room it takes
in a word.

- Click a point on the letter to select it. Drag it and it moves with its curve. It snaps to
  the guides and to the other points; hold Shift to move it freely.
- With a point selected, the arrow keys move it one unit. Hold Shift for ten. Tab picks the
  next point. Esc lets go.
- The right-hand column shows what you moved and lets you reset it, and a Roundness slider
  that opens or tightens the curve through that point.
- Light and Black move together unless you untick that. Untick it to change one weight only,
  then "Apply to all weights" carries the change across.
- The tools at the bottom of the canvas: Select is the normal mode. Move drags the whole
  letter. Nudge shows arrow buttons. Compare draws the letter before your changes in red.
- Scroll to zoom in, drag the empty background to look around, double-click it to reset.
- The three small boxes bottom right show the letter plain, squinted, and in negative. The
  strip along the bottom shows it in Light, Regular and Black.
- "Save as a variation" keeps a copy of the letter as it is now, under a name, so you can try
  something else. The one marked "in text" is what the Test room and the export use.
- "Start this letter over" clears every change to it.

**Weights** scrubs the whole alphabet from Light to Black and shows whether every letter
blends cleanly between the two drawn weights.

**Spacing** is the room each letter keeps on its left and right and the pairs that pull
closer. It is on hold until the letters are reshaped, but it is live to try: "Room from ink"
takes each letter's box from where its ink actually is; the edges and the pairs can be
changed in the tables.

**Test** lets you type anything and see it at five sizes, in negative, squinted, upside down,
mirrored, or as a darkness map that shows where the ink piles up. "Show the built font"
switches to the real font file from the last build.

**Import** takes a sheet back from Illustrator. Drop the file on the page: the Studio lists
every letter, shows which ones you changed and by how much, and refuses a drawing where
points were added or removed. Tick the ones to bring in.

**Export** downloads a sheet for Illustrator at Black, Light or the current weight, with all
your changes in it, and the last built font.

**Health** is the report card for the whole set: the score of every letter, the six optical
checks, and whether the gate to a font build is open.

**Guide** is this page and the project's own notes.

## Keeping your work

Everything autosaves in the browser as you go. The download arrow in the top bar (or Cmd+S)
saves a file called `aqua-studio-edits.json`; the upload arrow opens one. Send that file over
when you want changes made permanent in the typeface. Undo is Cmd+Z, redo is Shift+Cmd+Z.

## The round trip with Illustrator

1. In Export, download the Black sheet and the Light sheet.
2. Open a sheet in Illustrator. Move points. Never add or delete a point, and keep each
   letter in its own cell. Ignore the guides layer.
3. Save as plain SVG.
4. Drop the file on the Import room and tick the letters to bring in.

Bring in both weights if you want a change to hold across the whole range. Bring in one and
the other weight stays as it is.

## The six optical checks

The Health room and the inspector run six checks that a trained eye would make:

1. **Overshoot** — round and pointed shapes must go past the line to look level with flat ones.
2. **Weight illusion** — a horizontal as thick as a vertical looks heavier, so horizontals
   are drawn thinner.
3. **Gravity** — the upper part of a two-storey letter must be smaller than the lower.
4. **Irradiation** — white on black spreads; holes must stay open at small sizes.
5. **Crowding at joins** — where strokes meet, ink piles up; joins are thinned on purpose.
6. **Rhythm** — the gaps between letters should feel even, in the 70–85 band.

They never change a drawing. They say where to look.
