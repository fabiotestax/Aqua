"""
AquaScript v1.1 — "Liquid Sans" engine, recalibrated to the reference anatomy.

Base = crisp semi-condensed humanist sans: flat (butt) terminal cuts, tall
x-height, tight fit. Liquidity is now an ACCENT, not the substance:
  * default caps are flat cuts (like the reference)
  * droplet pooling happens only where explicitly stamped ("drop" ops)
  * disconnections remain, but tightened to read as cracks, not floaters
"""

import os
import pathops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen

PARAMS = dict(
    upm=1000,
    stroke=96,
    x_height=540,
    cap_height=700,
    ascender=720,
    descender=-220,
    gap=34,            # disconnection: a visible crack, not a floating node
    side=30,           # tight fit
)

W = PARAMS["stroke"]
XH, CAP, ASC, DSC = (PARAMS[k] for k in ("x_height", "cap_height", "ascender", "descender"))
H = W / 2
KAPPA = 0.5523


# Each sub-path: dict(ops=[...], cap="butt"|"round", drops=[(x, y, r), ...])
def sub(ops, cap="butt", drops=()):
    return dict(ops=ops, cap=cap, drops=list(drops))


def skeletons():
    g = {}

    # --- B : crisp cap, two condensed bowls
    g["B"] = [
        sub([("m", (84, H)), ("l", (84, CAP - H))]),
        sub([("m", (84, CAP - H)),
             ("c", (232, CAP - H), (290, 610), (290, 532)),
             ("c", (290, 458), (232, 420), (84, 420))]),
        sub([("m", (84, 420)),
             ("c", (250, 420), (312, 372), (312, 258)),
             ("c", (312, 140), (242, H), (84, H))]),
    ]

    # --- l : straight stem, SHORT fluid hook, one droplet at the tip
    g["l"] = [
        sub([("m", (84, ASC - H)), ("l", (84, 150)),
             ("c", (84, 86), (122, 52), (184, 50))],
            drops=[(184, 50, H + 8)]),
    ]

    # --- e : condensed bowl, horizontal bar, flat-cut aperture
    g["e"] = [
        sub([("m", (52, 306)), ("l", (372, 306))]),
        sub([("m", (372, 306)),
             ("c", (372, 398), (304, XH - H), (208, XH - H)),
             ("c", (108, XH - H), (42, 402), (42, 264)),
             ("c", (42, 122), (112, H), (214, H)),
             ("c", (288, H), (340, 76), (366, 118))]),
    ]

    # --- p : flat-bottomed descender stem + condensed bowl
    g["p"] = [
        sub([("m", (84, XH - H)), ("l", (84, DSC + H))]),
        sub([("m", (84, 436)),
             ("c", (248, 486), (352, 400), (352, 266)),
             ("c", (352, 132), (248, 44), (84, 94))]),
    ]

    # --- h : stem + condensed humanist arch
    g["h"] = [
        sub([("m", (84, ASC - H)), ("l", (84, H))]),
        sub([("m", (84, 342)),
             ("c", (84, 452), (140, XH - H), (216, XH - H)),
             ("c", (298, XH - H), (346, 448), (346, 336)),
             ("l", (346, H))]),
    ]

    # --- a : DOUBLE-STOREY, per reference. Arch flows into the stem;
    #         bowl hangs off the stem's lower half. One liquid accent:
    #         the arch's left terminal gets a subtle droplet.
    g["a"] = [
        sub([("m", (98, 466)),
             ("c", (162, 498), (244, 496), (292, 460)),
             ("c", (322, 436), (330, 398), (330, 330)),
             ("l", (330, H))],
            drops=[(98, 466, H + 6)]),
        sub([("m", (330, 258)),
             ("c", (168, 286), (62, 238), (62, 150)),
             ("c", (62, 70), (128, 42), (204, 42)),
             ("c", (262, 42), (308, 58), (330, 96))]),
    ]

    # --- g : DOUBLE-STOREY, matched to the reference. The key is ASYMMETRY:
    #         the two bowls share a RIGHT edge and overlap there, so the right
    #         reads as one continuous rounded contour (like a mirrored B), while
    #         the LEFT gets a deep notch with a small spur. Eye is smaller and
    #         shifted right; the lower loop is larger. Counters sit left of the
    #         weight — exactly the the logotype g. No open tail, no droplet.
    g["g"] = [
        # eye — smaller upper bowl, centre (176, 372), right edge at x=266
        sub([("m", (176, 494)),
             ("c", (225.7, 494), (266, 439.4), (266, 372)),
             ("c", (266, 304.6), (225.7, 250), (176, 250)),
             ("c", (126.3, 250), (86, 304.6), (86, 372)),
             ("c", (86, 439.4), (126.3, 494), (176, 494)),
             ("z",)]),
        # lower loop — larger bowl, centre (150, 50), right edge also at x=266
        # so the two bowls fuse into a continuous right contour
        sub([("m", (150, 202)),
             ("c", (214.1, 202), (266, 133.9), (266, 50)),
             ("c", (266, -33.9), (214.1, -102), (150, -102)),
             ("c", (85.9, -102), (34, -33.9), (34, 50)),
             ("c", (34, 133.9), (85.9, 202), (150, 202)),
             ("z",)]),
        # spur — small beak off the LEFT of the waist, pointing down-left
        sub([("m", (80, 246)),
             ("c", (50, 238), (36, 218), (42, 198))],
            cap="round"),
    ]

    g["space"] = []
    return g


def _circle(path, cx, cy, r):
    k = KAPPA * r
    path.moveTo(cx + r, cy)
    path.cubicTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r)
    path.cubicTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy)
    path.cubicTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r)
    path.cubicTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy)
    path.close()


_CAPS = {"butt": pathops.LineCap.BUTT_CAP, "round": pathops.LineCap.ROUND_CAP}


def skeleton_to_outline(subpaths):
    streams = []
    for sp in subpaths:
        p = pathops.Path()
        for op in sp["ops"]:
            if op[0] == "m":
                p.moveTo(*op[1])
            elif op[0] == "l":
                p.lineTo(*op[1])
            elif op[0] == "c":
                p.cubicTo(*op[1], *op[2], *op[3])
            elif op[0] == "z":
                p.close()
        p.stroke(W, _CAPS[sp["cap"]], pathops.LineJoin.ROUND_JOIN, 4)
        p.convertConicsToQuads(0.25)
        streams.append(p)
        for (cx, cy, r) in sp["drops"]:
            c = pathops.Path()
            _circle(c, cx, cy, r)
            c.convertConicsToQuads(0.25)
            streams.append(c)
    out = pathops.Path()
    pathops.union(streams, out.getPen())
    out.convertConicsToQuads(0.25)
    return out


def draw_real_g(pen):
    """The g is Fabio's own the source logotype drawing. Its outline was lifted from
    the source EPS (g_real_outline.json) then POLISHED with type-design
    principles (polish_g.py -> g_polished_outline.json): trace wobble removed,
    counters redrawn as clean ovals, curves re-laid at the extremes, spur kept.
    Drawn directly rather than stroked from a skeleton. Returns (xmin, xmax)."""
    import json
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "g_polished_outline.json")
    contours = json.load(open(path))
    xs = []
    for c in contours:
        for seg in c:
            if seg[0] == "m":
                pen.moveTo((seg[1], seg[2]))
            elif seg[0] == "l":
                pen.lineTo((seg[1], seg[2]))
            elif seg[0] == "c":
                pen.curveTo((seg[1], seg[2]), (seg[3], seg[4]), (seg[5], seg[6]))
            xs.append(seg[-2])
        pen.closePath()
    return min(xs), max(xs)


def build(path_out="AquaScript-Regular.ttf"):
    skels = skeletons()
    glyph_order = [".notdef", "space"] + list("Belphag")
    cmap = {ord(" "): "space", **{ord(c): c for c in "Belphag"}}

    glyphs, widths = {}, {}
    pen0 = TTGlyphPen(None)
    glyphs[".notdef"] = pen0.glyph()
    widths[".notdef"] = (500, 0)

    for name in glyph_order[1:]:
        pen = TTGlyphPen(None)
        if name == "g":
            xmin, xmax = draw_real_g(Cu2QuPen(pen, max_err=1.0))
            adv = int(xmax + PARAMS["side"])
            lsb = int(xmin)
        elif skels[name]:
            outline = skeleton_to_outline(skels[name])
            outline.draw(Cu2QuPen(pen, max_err=1.0))
            xmin, _, xmax, _ = outline.bounds
            adv = int(xmax + PARAMS["side"])
            lsb = int(xmin)
        else:
            adv, lsb = 200, 0
        glyphs[name] = pen.glyph()
        widths[name] = (adv, lsb)

    fb = FontBuilder(PARAMS["upm"], isTTF=True)
    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(widths)
    fb.setupHorizontalHeader(ascent=int(ASC + 60), descent=int(DSC - 60))
    fb.setupOS2(sTypoAscender=int(ASC + 60), sTypoDescender=int(DSC - 60),
                usWinAscent=int(ASC + 120), usWinDescent=int(-DSC + 120),
                sxHeight=XH, sCapHeight=CAP)
    fb.setupNameTable({"familyName": "AquaScript", "styleName": "Regular",
                       "fullName": "AquaScript Regular",
                       "psName": "AquaScript-Regular",
                       "version": "Version 1.1"})
    fb.setupPost()
    fb.save(path_out)
    print("saved", path_out)


if __name__ == "__main__":
    build()
