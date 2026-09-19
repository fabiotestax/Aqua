"""
Provenance / regeneration for the g outline.

The g is Fabio's own drawing from the source logotype's master art
(../refs/logotype.eps, removed from the repository). This script lifts the g's outline out of that
EPS and writes g_real_outline.json (contours in AquaScript font units), which
aquascript.py embeds directly as the g glyph.

Requires ghostscript (EPS->PDF) and pymupdf. Run from the engine/ dir.
"""
import subprocess
import json
import pymupdf

EPS = "../refs/logotype.eps"
PDF = "logotype.pdf"

# EPS -> PDF (vector preserved)
subprocess.run(["gs", "-dSAFER", "-dBATCH", "-dNOPAUSE", "-sDEVICE=pdfwrite",
                "-dEPSCrop", f"-sOutputFile={PDF}", EPS], check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

doc = pymupdf.open(PDF)
page = doc[0]

# pick the drawing whose bbox matches the g (7th glyph of the source word),
# identified by x-range and the deepest descender
draws = page.get_drawings()
g = min(draws, key=lambda dr: abs(dr["rect"].x0 - 740.7))

# font metrics read off the master: baseline y=217, x-height top y=63.4
BASE, S, SIDE, X0 = 217.0, 540.0 / 153.6, 30.0, 740.73
fx = lambda x: round((x - X0) * S + SIDE, 2)
fy = lambda y: round((BASE - y) * S, 2)

contours, cur, last = [], [], None
for it in g["items"]:
    op = it[0]
    if op == "l":
        p1, p2 = it[1], it[2]
        if last is None or abs(last[0] - p1.x) > 0.05 or abs(last[1] - p1.y) > 0.05:
            if cur:
                contours.append(cur)
            cur = [["m", fx(p1.x), fy(p1.y)]]
        cur.append(["l", fx(p2.x), fy(p2.y)])
        last = (p2.x, p2.y)
    elif op == "c":
        p1, p2, p3, p4 = it[1], it[2], it[3], it[4]
        if last is None or abs(last[0] - p1.x) > 0.05 or abs(last[1] - p1.y) > 0.05:
            if cur:
                contours.append(cur)
            cur = [["m", fx(p1.x), fy(p1.y)]]
        cur.append(["c", fx(p2.x), fy(p2.y), fx(p3.x), fy(p3.y), fx(p4.x), fy(p4.y)])
        last = (p4.x, p4.y)
if cur:
    contours.append(cur)

json.dump(contours, open("g_real_outline.json", "w"))
print(f"wrote g_real_outline.json ({len(contours)} contours)")
