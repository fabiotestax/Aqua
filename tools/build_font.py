"""
Build the variable font from the engine's masters.

    node tools/export_masters.mjs [edits.json]      # → build/masters.json
    python3 tools/build_font.py [--draft] [--no-gate]

Reads build/masters.json, writes three UFO masters (Light 53, Regular 78, Black 106) and a
designspace under build/, runs fontTools' interpolatable check on them, then fontmake →
build/Aqua-VF.ttf, → build/Aqua-VF.woff2, and glyphsLib → build/Aqua.glyphs so the design
stays editable. The WOFF2 and a build-info.json are copied to studio/fonts/ for the Studio.

The health gate: a red glyph (geometry or Fabio's verdict) closes the gate and the build
stops, listing the letters. --draft builds anyway and names the font "Aqua Draft".
"""
import json, re, shutil, subprocess, sys, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
FONTS = ROOT / "studio" / "fonts"
draft = "--draft" in sys.argv
no_gate = "--no-gate" in sys.argv

src = json.loads((BUILD / "masters.json").read_text())
stems = src["stems"]
weights = {w["stem"]: w["name"] for w in src["weights"]}
USER = {"Light": 300, "Regular": 400, "Black": 900}

# ── the gate ──
reds = sorted(n for n, h in src["health"].items() if h["colour"] == "red")
ambers = sorted(n for n, h in src["health"].items() if h["colour"] == "amber")
if reds and not draft and not no_gate:
    print("Build gate closed — not Aqua yet: " + ", ".join(reds))
    print("Run with --draft to build a draft anyway.")
    sys.exit(3)
if ambers:
    print("Note — needs a look: " + ", ".join(ambers))

# ── outlines ──
NUM = r"[-+]?(?:\d+\.\d*|\.\d+|\d+)"
def parse(d):
    """engine path (M/C/L/Z absolute) → list of contours; each a list of ('line', p) / ('curve', c1, c2, p)"""
    toks = re.findall(r"[MCLZ]|" + NUM, d)
    subs, cur, start, i = [], None, None, 0
    seg = []
    while i < len(toks):
        t = toks[i]
        if t == "M":
            if seg: subs.append(seg)
            start = (float(toks[i+1]), float(toks[i+2])); seg = [("move", start)]; cur = start; i += 3
        elif t == "C":
            c1 = (float(toks[i+1]), float(toks[i+2])); c2 = (float(toks[i+3]), float(toks[i+4])); p = (float(toks[i+5]), float(toks[i+6]))
            seg.append(("curve", c1, c2, p)); cur = p; i += 7
        elif t == "L":
            p = (float(toks[i+1]), float(toks[i+2])); seg.append(("line", p)); cur = p; i += 3
        elif t == "Z":
            if seg: subs.append(seg)
            seg = []; i += 1
        else:
            i += 1
    if seg: subs.append(seg)
    return subs

def flatten(sub, n=8):
    pts = []
    cur = sub[0][1]
    for s in sub[1:]:
        if s[0] == "line":
            pts.append(s[1]); cur = s[1]
        else:
            c1, c2, p = s[1], s[2], s[3]
            for k in range(1, n + 1):
                t = k / n; m = 1 - t
                pts.append((m*m*m*cur[0] + 3*m*m*t*c1[0] + 3*m*t*t*c2[0] + t*t*t*p[0],
                            m*m*m*cur[1] + 3*m*m*t*c1[1] + 3*m*t*t*c2[1] + t*t*t*p[1]))
            cur = p
    return pts

def area(poly):
    a = 0.0
    for i in range(len(poly)):
        x0, y0 = poly[i]; x1, y1 = poly[(i + 1) % len(poly)]
        a += x0 * y1 - x1 * y0
    return a / 2

def inside(pt, poly):
    x, y = pt; n = len(poly); c = False
    for i in range(n):
        x0, y0 = poly[i]; x1, y1 = poly[(i + 1) % n]
        if (y0 > y) != (y1 > y):
            xi = x0 + (y - y0) * (x1 - x0) / (y1 - y0)
            if x < xi: c = not c
    return c

def oriented(subs):
    """PostScript convention for the UFO: outer contours counter-clockwise (positive area),
    holes clockwise. Depth by ray casting from a point midway along the contour; ufo2ft flips
    everything for TrueType. The same decision falls out for every master because the
    nesting is the same drawing."""
    polys = [flatten(s) for s in subs]
    out = []
    for i, s in enumerate(subs):
        probe = polys[i][len(polys[i]) // 3]
        depth = sum(1 for j, p in enumerate(polys) if j != i and inside(probe, p))
        want_ccw = depth % 2 == 0
        is_ccw = area(polys[i]) > 0
        out.append(s if want_ccw == is_ccw else reverse(s))
    return out

def reverse(sub):
    """reverse a contour keeping the same start point"""
    pts = []  # on-curve points and the curve control points that lead INTO each
    cur = sub[0][1]
    segs = sub[1:]
    # closing segment back to start if the path does not end there
    last = segs[-1][-1] if segs else cur
    if abs(last[0] - cur[0]) > 1e-6 or abs(last[1] - cur[1]) > 1e-6:
        segs = segs + [("line", cur)]
    # walk backwards
    on = [cur] + [s[-1] for s in segs]          # on-curve points, len = n+1, on[-1] == on[0]
    rev = [("move", on[0])]
    for k in range(len(segs) - 1, -1, -1):
        s = segs[k]
        target = on[k]
        if s[0] == "line":
            rev.append(("line", target))
        else:
            rev.append(("curve", s[2], s[1], target))
    return rev

def union(subs):
    """A letter from drops is overlapping strokes filled nonzero: merge them into one clean
    outline with skia-pathops before it goes into the font."""
    import pathops
    path = pathops.Path()
    path.fillType = pathops.FillType.WINDING
    for sub in subs:
        path.moveTo(*sub[0][1])
        for s_ in sub[1:]:
            if s_[0] == "line": path.lineTo(*s_[1])
            else: path.cubicTo(*s_[1], *s_[2], *s_[3])
        path.close()
    path.simplify()
    out, cur = [], None
    for verb, pts in path.segments:
        if verb == "moveTo": cur = [("move", tuple(pts[0]))]; out.append(cur)
        elif verb == "lineTo": cur.append(("line", tuple(pts[0])))
        elif verb == "curveTo": cur.append(("curve", tuple(pts[0]), tuple(pts[1]), tuple(pts[2])))
        elif verb == "qCurveTo":
            p0 = cur[-1][-1]
            for j in range(len(pts) - 1):
                q, e = pts[j], pts[j + 1]
                cur.append(("curve", (p0[0] + 2/3*(q[0]-p0[0]), p0[1] + 2/3*(q[1]-p0[1])), (e[0] + 2/3*(q[0]-e[0]), e[1] + 2/3*(q[1]-e[1])), tuple(e))); p0 = e
        elif verb == "closePath": pass
    return out

def structure(subs):
    return [len(s_) for s_ in subs]

def draw(glyph, subs, overlapping=False):
    pen = glyph.getPen()
    # overlapping strokes: every contour is an outer one (counter-clockwise in the UFO)
    subs = [s_ if area(flatten(s_)) > 0 else reverse(s_) for s_ in subs] if overlapping else oriented(subs)
    for sub in subs:
        pen.moveTo(sub[0][1])
        for s in sub[1:]:
            if s[0] == "line": pen.lineTo(s[1])
            else: pen.curveTo(s[1], s[2], s[3])
        pen.closePath()

# ── UFOs ──
import ufoLib2
from fontTools.designspaceLib import DesignSpaceDocument, AxisDescriptor, SourceDescriptor, InstanceDescriptor

BUILD.mkdir(exist_ok=True)
family = "Aqua Draft" if draft else "Aqua"
m = src["metrics"]
order = ["space"] + list(src["glyphs"].keys())
# letters from drops are overlapping strokes: TrueType fills them by winding, so they go in
# as they are (fontmake keeps overlaps in a variable font); each stroke is an outer contour.
prepared, skipped = {}, []
for name, gd in src["glyphs"].items():
    if gd.get("fill") != "nonzero": continue
    per = {s: parse(gd["masters"][str(s)]["d"]) for s in stems}
    shapes = {s: structure(per[s]) for s in stems}
    if len({str(v) for v in shapes.values()}) > 1:
        skipped.append(name); continue
    prepared[name] = per
for n in skipped: del src["glyphs"][n]
if skipped: print("left out (drops letters whose strokes differ per weight): " + ", ".join(skipped))
ufos = {}
for s in stems:
    style = weights[s]
    f = ufoLib2.Font()
    f.info.familyName = family; f.info.styleName = style
    f.info.unitsPerEm = m["upm"]; f.info.ascender = m["ascender"]; f.info.descender = m["descender"]
    f.info.xHeight = m["xHeight"]; f.info.capHeight = m["capHeight"]
    f.info.openTypeOS2WeightClass = USER[style]
    # line metrics: the em box is ascender to descender, no extra gap, the same in every table
    f.info.openTypeHheaAscender = m["ascender"]; f.info.openTypeHheaDescender = m["descender"]; f.info.openTypeHheaLineGap = 0
    f.info.openTypeOS2TypoAscender = m["ascender"]; f.info.openTypeOS2TypoDescender = m["descender"]; f.info.openTypeOS2TypoLineGap = 0
    f.info.openTypeOS2WinAscent = m["ascender"] + 30; f.info.openTypeOS2WinDescent = -m["descender"] + 30
    f.info.openTypeOS2Selection = [7]        # use typo metrics
    f.info.versionMajor = 0
    g = f.newGlyph("space"); g.width = round(src["space"][str(s)]); g.unicodes = [0x20]
    nd = f.newGlyph(".notdef"); nd.width = 500
    pen = nd.getPen(); pen.moveTo((50, 0)); pen.lineTo((450, 0)); pen.lineTo((450, 700)); pen.lineTo((50, 700)); pen.closePath()
    pen.moveTo((100, 50)); pen.lineTo((100, 650)); pen.lineTo((400, 650)); pen.lineTo((400, 50)); pen.closePath()
    for name, gd in src["glyphs"].items():
        mm = gd["masters"][str(s)]
        g = f.newGlyph(name); g.width = round(mm["adv"]); g.unicodes = [gd["unicode"]]
        draw(g, prepared[name][s], True) if name in prepared else draw(g, parse(mm["d"]))
    for pair, v in src["kern"][str(s)].items():
        a, b = pair.split(","); f.kerning[(a, b)] = v
    f.lib["public.glyphOrder"] = [".notdef"] + order
    path = BUILD / f"Aqua-{style}.ufo"
    if path.exists(): shutil.rmtree(path)
    f.save(path)
    ufos[s] = path
    print(f"master {style} (stem {s}): {len(f)} glyphs, {len(f.kerning)} kern pairs → {path.name}")

# ── designspace ──
ds = DesignSpaceDocument()
ax = AxisDescriptor(); ax.name = "Weight"; ax.tag = "wght"
ax.minimum, ax.default, ax.maximum = 300, 400, 900
ax.map = [(USER[weights[s]], s) for s in stems]
ds.addAxis(ax)
for s in stems:
    sd = SourceDescriptor(); sd.path = str(ufos[s]); sd.name = f"Aqua {weights[s]}"
    sd.familyName = family; sd.styleName = weights[s]; sd.location = {"Weight": s}
    ds.addSource(sd)
for s in stems:
    ins = InstanceDescriptor(); ins.familyName = family; ins.styleName = weights[s]
    ins.location = {"Weight": s}; ins.name = f"Aqua {weights[s]}"
    ds.addInstance(ins)
dspath = BUILD / "Aqua.designspace"; ds.write(dspath)

# ── interpolatable ──
chk = subprocess.run([sys.executable, "-m", "fontTools.varLib.interpolatable", *[str(ufos[s]) for s in stems]],
                     capture_output=True, text=True)
problems = [l for l in (chk.stdout + chk.stderr).splitlines() if l.strip() and not l.startswith("Running")]
interp_ok = chk.returncode == 0 and not any("incompatible" in l.lower() or "problem" in l.lower() or "mismatch" in l.lower() for l in problems)
print("interpolatable: " + ("every glyph interpolates" if interp_ok else "PROBLEMS"))
if not interp_ok:
    for l in problems[:40]: print("  " + l)
    if not draft: sys.exit(4)

# ── fontmake ──
ttf = BUILD / "Aqua-VF.ttf"
r = subprocess.run(["fontmake", "-m", str(dspath), "-o", "variable", "--output-path", str(ttf), "--verbose", "WARNING"],
                   capture_output=True, text=True)
if r.returncode != 0:
    print(r.stdout[-3000:]); print(r.stderr[-3000:]); sys.exit(5)
from fontTools.ttLib import TTFont
tt = TTFont(ttf)
tt.flavor = "woff2"; woff2 = BUILD / "Aqua-VF.woff2"; tt.save(woff2)
axes = [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in tt["fvar"].axes]
print(f"fontmake: {ttf.name} ({ttf.stat().st_size // 1024} KB), {len(tt.getGlyphOrder())} glyphs, axes {axes}; {woff2.name} {woff2.stat().st_size // 1024} KB")

# ── .glyphs for editing ──
try:
    import glyphsLib
    gf = glyphsLib.to_glyphs(DesignSpaceDocument.fromfile(dspath))
    gf.save(str(BUILD / "Aqua.glyphs"))
    print("glyphsLib: Aqua.glyphs written")
except Exception as e:
    print("glyphsLib: could not write .glyphs —", e)

# ── hand over to the Studio ──
FONTS.mkdir(exist_ok=True)
info_path = FONTS / "build-info.json"
prev = json.loads(info_path.read_text()) if info_path.exists() else {"build": 0}
info = {
    "build": prev.get("build", 0) + 1,
    "version": f"0.{prev.get('build', 0) + 1}",
    "family": family, "draft": draft,
    "date": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    "commit": src.get("commit"), "edits": src.get("edits"),
    "masters": [{"name": weights[s], "stem": s, "wght": USER[weights[s]]} for s in stems],
    "glyphs": len(src["glyphs"]) + 1,
    "gate": {"open": not reds, "red": reds, "amber": ambers},
    "interpolatable": interp_ok,
    "left_out": skipped,
    "file": "Aqua-VF.woff2", "size_kb": woff2.stat().st_size // 1024,
}
shutil.copy(woff2, FONTS / "Aqua-VF.woff2")
info_path.write_text(json.dumps(info, indent=1))
print(f"→ studio/fonts/Aqua-VF.woff2 · build {info['version']} ({'draft' if draft else 'release'}) · gate {'open' if not reds else 'closed'}")
