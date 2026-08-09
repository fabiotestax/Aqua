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

    # --- g : DOUBLE-STOREY per reference. Small top bowl on the x-height,
    #         ear flicking off its shoulder, and the lower loop separated
    #         by a crack where the link used to be (the liquid move:
    #         "link eliminated, loop emerges via baseline offset")
    g["g"] = [
        sub([("m", (200, XH - H)),
             ("c", (272, XH - H), (325, 438), (325, 367)),
             ("c", (325, 296), (272, 242), (200, 242)),
             ("c", (128, 242), (75, 296), (75, 367)),
             ("c", (75, 438), (128, XH - H), (200, XH - H)),
             ("z",)]),
        # ear — small flick off the top-right shoulder, cracked free
        sub([("m", (412, 490)),
             ("c", (452, 478), (466, 446), (458, 408))],
            cap="round"),
        # lower loop — open sweep where the link was, droplet terminal
        sub([("m", (332, 138)),
             ("c", (348, -20), (300, -150), (190, -155)),
             ("c", (95, -158), (40, -108), (40, -30)),
             ("c", (40, 30), (90, 64), (158, 56))],
            drops=[(158, 56, H + 6)]),
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
