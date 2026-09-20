# Aqua Studio — how to use it

Aqua Studio is the workbench around the Aqua typeface. It runs in your browser, needs no
account and no internet, and every change you make is yours until you decide it is final.
Press **?** anywhere for the cheat sheet of shortcuts.

## The rooms

**Glyphs** is where you work on a letter. Pick one in the grid on the left. The colour bar
under each letter is its health: green looks good, amber needs a look, red is not Aqua yet.
The big letter in the middle sits on its guides: Tall letters, Capitals, Small letters, the
Middle, the Baseline and the Tails. The dotted lines either side are the letter's box, the
room it takes in a word. The grey letters either side are its neighbours (n and o unless you
type others under "On the canvas"), and the line under the canvas is the whole set at this
weight: the letter has to belong to it.

- Click a point to select it. Shift-click adds or removes points. Drag on empty canvas to
  select everything inside the rectangle (Shift adds). Cmd/Ctrl+A takes every point.
- Drag any selected point and the whole selection moves. It snaps to the guides and to other
  points; hold Shift to move it freely. Arrows nudge one unit, Shift for ten. Tab picks the
  next point. Esc lets go. Backspace removes the selected points (the curve is joined across
  the gap, in both weights).
- With several points selected, the inspector offers Rotate, Scale and Flip about their
  centre, and a Roundness slider for all of them.
- The tools under the canvas: **Select** is the normal mode. **Add point** puts a point on
  the outline where you click. **Move** drags the whole letter. **Nudge** shows arrow
  buttons. **Measure** draws a ruler between two places. **Compare** draws the letter before
  your changes in red. V · A · M · N · R · C on the keyboard.
- Hold **Space** and drag to look around. Scroll, + and − zoom; 0 or a double-click fits the
  letter again.
- Amber haloes on the canvas mark the points the health score complains about: two points
  on top of each other, or a bump where two pieces meet. Red haloes mark a join that goes
  dark. Click a halo to select that point. Tick them off under "On the canvas".
- "Aqua's rules at this weight" in the inspector lists the numbers every letter is built
  from at the current weight: the stem, the horizontals, the cut, the foot, the shoulder,
  the overshoot, the room. They are what make the letters a set.
- Light and Black move together unless you untick that. Untick it to change one weight only,
  then "Apply to all weights" carries the change across.
- **Redraw with fewer points** appears on a letter made of hundreds of tiny pieces (the s by
  rules has 354). It redraws the letter with a point at every corner and every extreme and
  one curve between them, the same in both weights, so you can edit it by hand. "Forget the
  redraw" brings the old drawing back.
- "Save as a variation" keeps a copy of the letter as it is now, under a name, so you can try
  something else. The one marked "in text" is what the Test room and the export use.
- "Start this letter over" clears every change to it. Every letter has a category (Letters,
  Capitals, Numbers, Punctuation, Diacritics, Ligatures, Pictos, Other, or ones you add in
  the Health room).

**A new letter.** The + tile in the grid, or Cmd/Ctrl+N, opens the new-letter dialog:

- *Typed as*: the key that shows it when you type. One character, or a code like U+2764.
  The keys Aqua does not use yet are laid out to pick from; a picto can sit on any of them.
- *Name*, *Category* and *Height* (guessed from the key; change them if you like).
- *Start from*: an empty grid; **a suggested structure** from the Studio's library (it knows
  the usual construction of every letter, digit, sign and a few pictos: a stem and an arch
  for the n, a bowl and a stem for the a, a diagonal into a small loop then the big loop and
  the arm for the ampersand; it is a codified library, not something learned from other
  fonts, and always a start rather than a drawing); **a traced image** (pick a picture, the
  Studio thins it to a skeleton and turns that into drops); or **Aqua's rules**, for the
  characters the rules already draw (the digits 0–9): those come in as they are and open
  in the editor like any other letter.

A letter from drops is made on a tile grid: tap tiles to place drops, drops that follow each
other become one stroke, Esc starts a new stroke, touching another stroke's end joins it.
The engine draws each stroke with Aqua's own thickness and contrast at every weight, and
where strokes meet, **the joins flow like water**: a stroke that ends on another is
stretched into it, and every corner between two strokes is webbed, like the meniscus water
makes in a corner. The webs grow with the weight. Untick "Joins flow like water" in the
inspector for plain overlapping strokes. "Suggest a structure" in the inspector places the
library's drops for that character; "Add to Aqua" puts the letter in the set.

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
checks, and whether the gate to a font build is open. "The set" counts the glyphs Aqua has
and where they come from, counts them by category (add or remove categories there), and
offers the characters Aqua's rules can draw but that are not in the set yet: one click
brings a digit in, and the × takes it out again.

**Guide** is this page and the project's own notes.

## Keeping your work

Everything autosaves in the browser as you go. When something has changed that is not yet
in a file, the Save button in the top bar turns blue and the inspector says so. The download
arrow (or Cmd/Ctrl+S) saves a file called `aqua-studio-edits.json`; the upload arrow (or
Cmd/Ctrl+O) opens one. Send that file over when you want changes made permanent in the
typeface. Undo is Cmd/Ctrl+Z, redo is Shift+Cmd/Ctrl+Z.

## What the Studio does not offer, and why

- **Boolean operations** (union, subtract, intersect) on an outline. They change the number
  of points, and the number can differ between Light and Black, which breaks the blend
  between weights. A drops letter keeps its strokes overlapping instead, and the font build
  keeps the overlaps; the webs of the water joins are small extra pieces with the same count
  at every weight.
- **A pencil** for drawing outlines freehand. Aqua is constructed, not traced: points sit on
  extremes and corners, handles are axis-aligned. Draw a stroke with drops instead, or trace
  an image and then edit the drops.

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
