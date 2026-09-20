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
  The keys not yet in the set are laid out to pick from; the underlined ones Aqua can build
  itself. Every accented letter and most signs can be typed straight in.
- *Name*, *Category* and *Height* (guessed from the key; change them if you like).
- *Start from*: **Aqua's construction**, offered first whenever Aqua can build the character.
  Aqua knows its own parts — the stem with the family foot and cut, the bar on its own
  radius, the arch, the bowl, the ring, the diagonal joined with a true fillet, the
  centreline stroke under the contrast law — and builds capitals, punctuation, signs,
  accents and the composed letters from them, at every weight, the way the thirty are built.
  The dialog says what it will make ("two stems and a bar") and the letter comes in drawn,
  ready to edit point by point, with its health score. The alternatives are an empty grid
  of drops, a rough structure from the drops library (it knows the usual shape of a
  character, not other fonts), or a traced image.

The Health room's "The set" panel lists everything Aqua can build, grouped (Capitals,
Numbers, Punctuation, Diacritics, Ligatures), one click each or "add all" for a group. A
letter brought in this way can be taken out again from its inspector.

A letter from drops is made on a tile grid with the **Blob** tool: tap a tile and a round
blob appears; tap next to a stroke and the blob joins it; tap between two strokes and it
bridges them into one; tap beside the middle of a stroke and a branch starts there. Blobs
that touch merge like water, and where strokes meet, **the joins flow like water**: a
stroke that ends on another is stretched into it, and every corner between two strokes is
webbed, like the meniscus water makes in a corner. The webs grow with the weight. The
**Stroke** tool (S) is for drawing a stroke tap by tap however far apart the drops are.
The engine draws each stroke with Aqua's own thickness and contrast at every weight and
polishes it into clean curves. Untick "Joins flow like water" for plain overlapping
strokes; "Add to Aqua" puts the letter in the set.

**Copy and paste.** In a letter, Cmd/Ctrl+C copies the contours under the selected points
(all of them with nothing selected), at both weights; Cmd/Ctrl+V pastes them into any other
letter, selected and ready to move. In a drops letter the same keys copy and paste strokes.

**Smart guides.** While you drag a point, a guide appears when it lines up with a guide
line or with another point's x or y, and a dashed ray with its angle when it sits at 45° to
its neighbours or to where the drag started; the point follows the angle. Hold Shift to move
it freely.

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
