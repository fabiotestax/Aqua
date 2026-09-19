"""
Aqua glyph health — a score and a colour for every glyph, so the state of the set
can be read at a glance and a font build can be gated on it.

Input : tools/out/glyphs.json   (from tools/export_glyphs.mjs — the live page's own export)
Output: tools/out/health.json   (per glyph: score, colour, worst weight, plain-language flags)
        and a table on stdout.

What is measured, per glyph, at every exported stem (worst weight governs the score):
  smooth     curvature continuity at every join (the lump detector) and the tightest radius
  discipline every curve segment monotone in x and y (on-curve points sit on the extremes),
             no squashed handles (< 5% of chord)
  density    total segment count (an s made of 354 pieces is a trace, not a drawing)
  spacing    both sidebearings non-negative against the page's own advance box
  masters    Light and Black have the same contour structure (subpaths, segment counts,
             command sequence) — the varLib.interpolatable test, done early
"""
import json, math, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "out" / "glyphs.json"
DST = ROOT / "out" / "health.json"

NUM = re.compile(r"[-+]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?")


# ----------------------------------------------------------------- path parsing
def parse_path(d, ox, oy):
    """SVG d -> list of subpaths; each a list of segments (p0,c1,c2,p3,kind).
    kind is 'C' for a real curve, 'L' for a straight run. Font units: x-ox, oy-y."""
    toks = re.findall(r"[MmLlHhVvCcSsQqTtZzAa]|" + NUM.pattern, d)
    subs, cur, start, i, cmd, prev_c = [], None, None, 0, None, None
    seg = []

    def F(x, y):
        return (x - ox, oy - y)

    def nums(n):
        nonlocal i
        v = [float(toks[i + k]) for k in range(n)]
        i += n
        return v

    def add(p0, c1, c2, p3, kind):
        seg.append((p0, c1, c2, p3, kind))

    def line(p0, p3):
        c1 = (p0[0] + (p3[0] - p0[0]) / 3, p0[1] + (p3[1] - p0[1]) / 3)
        c2 = (p0[0] + 2 * (p3[0] - p0[0]) / 3, p0[1] + 2 * (p3[1] - p0[1]) / 3)
        add(p0, c1, c2, p3, "L")

    while i < len(toks):
        t = toks[i]
        if re.match(r"[A-Za-z]", t):
            cmd = t
            i += 1
            if cmd in "Zz":
                if cur is not None and start is not None and (abs(cur[0] - start[0]) > 1e-6 or abs(cur[1] - start[1]) > 1e-6):
                    line(cur, start)
                if seg:
                    subs.append(seg)
                seg, cur, prev_c = [], start, None
                continue
        rel = cmd.islower()
        c = cmd.upper()
        if c == "M":
            x, y = nums(2)
            if rel and cur is not None:
                x, y = cur[0] + x, cur[1] + y
            if seg:
                subs.append(seg)
                seg = []
            cur = start = (x, y)
            cmd = "l" if rel else "L"
            prev_c = None
        elif c == "L":
            x, y = nums(2)
            if rel:
                x, y = cur[0] + x, cur[1] + y
            line(cur, (x, y)); cur = (x, y); prev_c = None
        elif c == "H":
            (x,) = nums(1)
            if rel:
                x = cur[0] + x
            line(cur, (x, cur[1])); cur = (x, cur[1]); prev_c = None
        elif c == "V":
            (y,) = nums(1)
            if rel:
                y = cur[1] + y
            line(cur, (cur[0], y)); cur = (cur[0], y); prev_c = None
        elif c == "C":
            x1, y1, x2, y2, x, y = nums(6)
            if rel:
                x1, y1, x2, y2, x, y = cur[0] + x1, cur[1] + y1, cur[0] + x2, cur[1] + y2, cur[0] + x, cur[1] + y
            add(cur, (x1, y1), (x2, y2), (x, y), "C"); prev_c = (x2, y2); cur = (x, y)
        elif c == "S":
            x2, y2, x, y = nums(4)
            if rel:
                x2, y2, x, y = cur[0] + x2, cur[1] + y2, cur[0] + x, cur[1] + y
            x1, y1 = (2 * cur[0] - prev_c[0], 2 * cur[1] - prev_c[1]) if prev_c else cur
            add(cur, (x1, y1), (x2, y2), (x, y), "C"); prev_c = (x2, y2); cur = (x, y)
        elif c == "Q":
            qx, qy, x, y = nums(4)
            if rel:
                qx, qy, x, y = cur[0] + qx, cur[1] + qy, cur[0] + x, cur[1] + y
            c1 = (cur[0] + 2 / 3 * (qx - cur[0]), cur[1] + 2 / 3 * (qy - cur[1]))
            c2 = (x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y))
            add(cur, c1, c2, (x, y), "C"); prev_c = (qx, qy); cur = (x, y)
        elif c == "T":
            x, y = nums(2)
            if rel:
                x, y = cur[0] + x, cur[1] + y
            qx, qy = (2 * cur[0] - prev_c[0], 2 * cur[1] - prev_c[1]) if prev_c else cur
            c1 = (cur[0] + 2 / 3 * (qx - cur[0]), cur[1] + 2 / 3 * (qy - cur[1]))
            c2 = (x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y))
            add(cur, c1, c2, (x, y), "C"); prev_c = (qx, qy); cur = (x, y)
        elif c == "A":
            nums(7)  # arcs are not expected in this project; skip rather than guess
        else:
            i += 1
    if seg:
        subs.append(seg)
    # to font units
    out = []
    for s in subs:
        out.append([(F(*p0), F(*c1), F(*c2), F(*p3), k) for (p0, c1, c2, p3, k) in s])
    return out


# ----------------------------------------------------------------- geometry
def curv(p0, c1, c2, p3, t):
    mt = 1 - t
    d1 = (3 * mt * mt * (c1[0] - p0[0]) + 6 * mt * t * (c2[0] - c1[0]) + 3 * t * t * (p3[0] - c2[0]),
          3 * mt * mt * (c1[1] - p0[1]) + 6 * mt * t * (c2[1] - c1[1]) + 3 * t * t * (p3[1] - c2[1]))
    d2 = (6 * mt * (c2[0] - 2 * c1[0] + p0[0]) + 6 * t * (p3[0] - 2 * c2[0] + c1[0]),
          6 * mt * (c2[1] - 2 * c1[1] + p0[1]) + 6 * t * (p3[1] - 2 * c2[1] + c1[1]))
    n = (d1[0] ** 2 + d1[1] ** 2) ** 1.5
    return (d1[0] * d2[1] - d1[1] * d2[0]) / n if n > 1e-9 else 0.0


def monotone(p0, c1, c2, p3):
    """True if the cubic is monotone in both x and y (no interior extremum)."""
    for ax in (0, 1):
        a, b, c, d = p0[ax], c1[ax], c2[ax], p3[ax]
        # derivative of cubic bezier: quadratic in t
        A = 3 * (-a + 3 * b - 3 * c + d)
        B = 6 * (a - 2 * b + c)
        C = 3 * (b - a)
        roots = []
        if abs(A) < 1e-9:
            if abs(B) > 1e-9:
                roots = [-C / B]
        else:
            disc = B * B - 4 * A * C
            if disc >= 0:
                sq = math.sqrt(disc)
                roots = [(-B + sq) / (2 * A), (-B - sq) / (2 * A)]
        for r in roots:
            if 0.02 < r < 0.98:
                # a genuine turning point (not a flat inflection): derivative changes sign
                return False
    return True


def extremum_depth(p0, c1, c2, p3):
    """How far (units) the curve overshoots its endpoints' range in x or y — the size
    of the extreme point that has no on-curve node."""
    depth = 0.0
    for ax in (0, 1):
        lo, hi = min(p0[ax], p3[ax]), max(p0[ax], p3[ax])
        for i in range(1, 24):
            t = i / 24
            mt = 1 - t
            v = mt**3 * p0[ax] + 3 * mt * mt * t * c1[ax] + 3 * mt * t * t * c2[ax] + t**3 * p3[ax]
            depth = max(depth, lo - v, v - hi)
    return depth


def analyse(subs, stem):
    segs = [s for sub in subs for s in sub]
    n_segs = len(segs)
    max_jump, max_k = 0.0, 0.0
    # caps are s/2 and fillets ~0.26 s: anything tighter than 0.6 s is a constructed corner,
    # so the lump test only looks at the big curves — bowls, arches, spines
    FILLET_R = 0.6 * stem
    for sub in subs:
        n = len(sub)
        for i in range(n):
            p0, c1, c2, p3, k = sub[i]
            for t in (0.0, 0.25, 0.5, 0.75, 1.0):
                max_k = max(max_k, abs(curv(p0, c1, c2, p3, t)))
            q0, q1, q2, q3, kk = sub[(i + 1) % n]
            if k == "L" or kk == "L":
                continue  # straight-to-curve is a constructed junction (fillet onto a run)
            ke = curv(p0, c1, c2, p3, 1.0)
            ks = curv(q0, q1, q2, q3, 0.0)
            if max(abs(ke), abs(ks)) > 1.0 / FILLET_R:
                continue  # one side is a fillet or cap: a deliberate corner, not a lump
            max_jump = max(max_jump, abs(ke - ks))
    nonmono = sum(1 for (p0, c1, c2, p3, k) in segs
                  if k == "C" and not monotone(p0, c1, c2, p3) and extremum_depth(p0, c1, c2, p3) > 2.0)
    squashed = 0
    for (p0, c1, c2, p3, k) in segs:
        if k != "C":
            continue
        chord = math.hypot(p3[0] - p0[0], p3[1] - p0[1])
        if chord < 1e-6:
            continue
        h1 = math.hypot(c1[0] - p0[0], c1[1] - p0[1])
        h2 = math.hypot(c2[0] - p3[0], c2[1] - p3[1])
        if min(h1, h2) < 0.05 * chord:
            squashed += 1
    xs = [pt[0] for s in segs for pt in (s[0], s[3])]
    ys = [pt[1] for s in segs for pt in (s[0], s[3])]
    signature = ["".join(s[4] for s in sub) for sub in subs]
    return dict(subpaths=len(subs), segs=n_segs, segs_per_sub=[len(s) for s in subs],
                signature=signature, max_jump=round(max_jump, 5),
                min_radius=round(1 / max_k, 1) if max_k > 1e-9 else 9999.0,
                nonmono=nonmono, squashed=squashed,
                xmin=round(min(xs), 1), xmax=round(max(xs), 1), ymin=round(min(ys), 1), ymax=round(max(ys), 1))


# ----------------------------------------------------------------- scoring
def score_glyph(per_stem, compatible):
    score, flags = 100, []
    if not compatible[0]:
        score = min(score, 35)
        flags.append("Weights don't match — " + compatible[1])
    worst = None
    for stem, m in per_stem.items():
        s, f = 100, []
        st = float(stem)
        if m["max_jump"] > 0.02:
            s -= 30; f.append(f"lumpy curve (jump {m['max_jump']:.3f})")
        elif m["max_jump"] > 0.008:
            s -= 15; f.append(f"slight lump (jump {m['max_jump']:.3f})")
        # a fillet's radius scales with the stem; only a radius collapsing toward zero is a cusp
        if m["min_radius"] < max(3.0, 0.06 * st):
            s -= 20; f.append(f"sharp cusp (radius {m['min_radius']})")
        elif m["min_radius"] < 0.10 * st:
            s -= 5; f.append(f"very tight corner (radius {m['min_radius']})")
        if m["nonmono"]:
            s -= min(12, 2 * m["nonmono"]); f.append(f"{m['nonmono']} curve(s) miss their extreme point")
        if m["squashed"]:
            s -= min(24, 8 * m["squashed"]); f.append(f"{m['squashed']} squashed handle(s)")
        if m["segs"] > 80:
            s -= 25; f.append(f"too many points ({m['segs']} segments — a trace, not a drawing)")
        if m["lsb"] < 0 or m["rsb"] < 0:
            s -= 20; f.append(f"ink overhangs its box (L {m['lsb']:.0f} / R {m['rsb']:.0f})")
        m["stem_score"] = s
        m["flags"] = f
        if worst is None or s < worst[1]:
            worst = (stem, s)
    stem, s = worst
    score = min(score, s)
    if s < 100:
        flags += [f"{x} at stem {stem}" for x in per_stem[stem]["flags"]]
    colour = "green" if score >= 85 else "amber" if score >= 65 else "red"
    return score, colour, stem, flags


def main():
    data = json.loads(SRC.read_text())
    stems = sorted(data, key=int)
    lo, hi = stems[0], stems[-1]
    names = data[hi]["order"]
    report = {}
    for name in names:
        per = {}
        for s in stems:
            g = data[s]["glyphs"][name]
            subs = parse_path(g["d"], g["ox"], g["oy"])
            m = analyse(subs, float(s))
            m["lsb"] = round(m["xmin"] - (g["L"] - g["ox"]), 1)
            m["rsb"] = round((g["R"] - g["ox"]) - m["xmax"], 1)
            m["advance"] = round(g["R"] - g["L"], 1)
            per[s] = m
        a, b = per[lo], per[hi]
        if a["subpaths"] != b["subpaths"]:
            comp = (False, f"{a['subpaths']} vs {b['subpaths']} contours")
        elif a["segs_per_sub"] != b["segs_per_sub"]:
            comp = (False, f"segments {a['segs_per_sub']} vs {b['segs_per_sub']}")
        elif a["signature"] != b["signature"]:
            comp = (False, "curve/line sequence differs")
        else:
            comp = (True, "ok")
        score, colour, worst, flags = score_glyph(per, comp)
        report[name] = dict(score=score, colour=colour, worst_stem=worst, compatible=comp[0],
                            flags=flags, stems=per)
    DST.write_text(json.dumps(report, indent=1))
    # table
    print(f"{'glyph':8}{'score':>6}  {'colour':7}{'segs':>6}{'jump':>8}{'r_min':>7}{'nonmono':>8}{'sq':>4}{'lsb':>6}{'rsb':>6}  flags")
    for name, r in sorted(report.items(), key=lambda kv: kv[1]["score"]):
        m = r["stems"][r["worst_stem"]]
        print(f"{name:8}{r['score']:>6}  {r['colour']:7}{m['segs']:>6}{m['max_jump']:>8.4f}{m['min_radius']:>7}{m['nonmono']:>8}{m['squashed']:>4}{m['lsb']:>6.0f}{m['rsb']:>6.0f}  {'; '.join(r['flags'])[:90]}")
    c = {k: sum(1 for r in report.values() if r["colour"] == k) for k in ("green", "amber", "red")}
    print(f"\n{len(report)} glyphs · green {c['green']} · amber {c['amber']} · red {c['red']}")


if __name__ == "__main__":
    main()
