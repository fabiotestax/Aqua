"""
AquaScript v1.1 — "Liquid Sans" engine, recalibrated to the reference anatomy.

Base = crisp semi-condensed humanist sans: flat (butt) terminal cuts, tall
x-height, tight fit. Liquidity is now an ACCENT, not the substance:
  * default caps are flat cuts (like the reference)
  * droplet pooling happens only where explicitly stamped ("drop" ops)
  * disconnections remain, but tightened to read as cracks, not floaters
"""

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

    # --- g : DOUBLE-STOREY, matched to the reference anatomy. Two CLOSED
    #         bowls — a smaller eye above a larger lower loop — joined into a
    #         continuous contour on the right and pinched to a narrow waist on
    #         the left, with a small spur flicking off the left of the waist.
    #         No open tail, no droplet: reads crisp, exactly like the logotype.
    g["g"] = [
        # eye — upper bowl, centre (185, 388), rounder & a touch larger
        sub([("m", (185, 502)),
             ("c", (245.77, 502), (294, 451.42), (294, 388)),
             ("c", (294, 324.58), (245.77, 274), (185, 274)),
             ("c", (124.23, 274), (76, 324.58), (76, 388)),
             ("c", (76, 451.42), (124.23, 502), (185, 502)),
             ("z",)]),
        # lower loop — larger bowl, centre (180, 55), overlaps the eye's
        # lower edge to form the connected waist
        sub([("m", (180, 200)),
             ("c", (247.38, 200), (302, 135.08), (302, 55)),
             ("c", (302, -25.08), (247.38, -90), (180, -90)),
             ("c", (112.62, -90), (58, -25.08), (58, 55)),
             ("c", (58, 135.08), (112.62, 200), (180, 200)),
             ("z",)]),
        # spur — small beak off the left of the waist, pointing down-left
        sub([("m", (104, 250)),
             ("c", (70, 244), (54, 224), (58, 200))],
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
        if skels[name]:
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
