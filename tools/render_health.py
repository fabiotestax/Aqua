"""
Render the health sheet: every glyph in the set, colour-coded by its health score,
with the score and the top flag under it. This is the "state of the set at a glance"
Fabio asked for. Reads tools/out/glyphs.json + tools/out/health.json, writes
tools/out/health-sheet.png.
"""
import json, sys
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.path import Path as MP
from matplotlib.patches import PathPatch, Rectangle
import pathops

sys.path.insert(0, str(Path(__file__).resolve().parent))
from health import parse_path

ROOT = Path(__file__).resolve().parent
glyphs = json.loads((ROOT / "out" / "glyphs.json").read_text())
health = json.loads((ROOT / "out" / "health.json").read_text())

STEM = "106"
PAPER, INK = "#f2f1ec", "#16150f"
COL = {"green": "#2f8f5b", "amber": "#d99a1e", "red": "#c8362e"}
names = glyphs[STEM]["order"]
cols = 6
rows = (len(names) + cols - 1) // cols

fig, axs = plt.subplots(rows, cols, figsize=(cols * 2.6, rows * 3.05), dpi=110)
fig.patch.set_facecolor(PAPER)
for ax in axs.flat:
    ax.axis("off")

for i, name in enumerate(names):
    ax = axs[i // cols][i % cols]
    g = glyphs[STEM]["glyphs"][name]
    subs = parse_path(g["d"], g["ox"], g["oy"])
    # The page fills with fill-rule="evenodd"; matplotlib fills nonzero. Resolve the
    # even-odd outline with skia first so counters stay counters whatever their winding.
    sk = pathops.Path()
    sk.fillType = pathops.FillType.EVEN_ODD
    for sub in subs:
        sk.moveTo(*sub[0][0])
        for (p0, c1, c2, p3, k) in sub:
            sk.cubicTo(*c1, *c2, *p3)
        sk.close()
    sk.simplify()
    verts, codes = [], []
    for verb, pts in sk.segments:
        if verb == "moveTo":
            verts.append(pts[0]); codes.append(MP.MOVETO)
        elif verb == "lineTo":
            verts.append(pts[0]); codes.append(MP.LINETO)
        elif verb == "qCurveTo":
            # skia may emit quads; lift to cubic
            p0 = verts[-1]
            for j in range(len(pts) - 1):
                q = pts[j]; e = pts[j + 1]
                verts += [(p0[0] + 2 / 3 * (q[0] - p0[0]), p0[1] + 2 / 3 * (q[1] - p0[1])),
                          (e[0] + 2 / 3 * (q[0] - e[0]), e[1] + 2 / 3 * (q[1] - e[1])), e]
                codes += [MP.CURVE4] * 3; p0 = e
        elif verb == "curveTo":
            verts += list(pts); codes += [MP.CURVE4] * 3
        elif verb == "closePath":
            verts.append(verts[0]); codes.append(MP.CLOSEPOLY)
    ax.add_patch(PathPatch(MP(verts, codes), facecolor=INK, edgecolor="none"))
    h = health[name]
    c = COL[h["colour"]]
    # colour tag + baseline
    ax.add_patch(Rectangle((-120, -330), 800, 1130, facecolor="none", edgecolor=c, lw=2.2))
    ax.plot([-100, 660], [0, 0], color="#c9c5bb", lw=0.8)
    ax.plot([-100, 660], [521, 521], color="#c9c5bb", lw=0.8, ls="--")
    ax.set_xlim(-120, 680); ax.set_ylim(-330, 800); ax.set_aspect("equal")
    label = "B" if name == "B.cap" else {"exclam": "!", "period": ".", "comma": ","}.get(name, name)
    ax.text(-100, 740, f"{label}", fontsize=13, fontweight="bold", color=INK, va="top")
    ax.text(660, 740, f"{h['score']}", fontsize=13, fontweight="bold", color=c, va="top", ha="right")
    flag = h["flags"][0] if h["flags"] else "clean"
    flag = flag.split(" at stem")[0]
    if len(flag) > 34:
        flag = flag[:33] + "…"
    ax.text(-100, -300, flag, fontsize=7.2, color="#6e695f", va="bottom")

n = {k: sum(1 for r in health.values() if r["colour"] == k) for k in COL}
fig.suptitle(f"Aqua · glyph health at Black · {len(names)} glyphs — "
             f"green {n['green']} · amber {n['amber']} · red {n['red']}",
             fontsize=12, color=INK, x=0.02, ha="left", y=0.995)
plt.tight_layout(rect=(0, 0, 1, 0.975))
out = ROOT / "out" / "health-sheet.png"
plt.savefig(out, facecolor=PAPER)
print("saved", out)
