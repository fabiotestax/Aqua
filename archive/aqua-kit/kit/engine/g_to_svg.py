"""Export the compiled AquaScript 'g' outline as a clean, standalone SVG.
The path is the real glyph outline (crisp vector), not a trace of the photo."""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

PAD = 40
INK = "#141414"

f = TTFont("AquaScript-Regular.ttf")
gs = f.getGlyphSet()
glyph = gs["g"]

bp = BoundsPen(gs)
glyph.draw(bp)
xMin, yMin, xMax, yMax = bp.bounds

spen = SVGPathPen(gs)
glyph.draw(spen)
d = spen.getCommands()

vb_x = xMin - PAD
vb_y = -(yMax + PAD)
vb_w = (xMax - xMin) + 2 * PAD
vb_h = (yMax - yMin) + 2 * PAD

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb_x:.0f} {vb_y:.0f} {vb_w:.0f} {vb_h:.0f}" width="{vb_w:.0f}" height="{vb_h:.0f}">
  <title>AquaScript g</title>
  <g transform="scale(1,-1)">
    <path d="{d}" fill="{INK}" fill-rule="evenodd"/>
  </g>
</svg>
'''

with open("g.svg", "w") as fh:
    fh.write(svg)
print(f"saved g.svg  (glyph bounds x[{xMin:.0f},{xMax:.0f}] y[{yMin:.0f},{yMax:.0f}])")
