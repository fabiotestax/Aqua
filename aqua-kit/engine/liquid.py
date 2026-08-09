"""
AquaScript LIQUID (v2 engine) — same skeletons, new physics.

v1 inflated skeletons with a constant-width stroke (liquid in a tube).
v2 treats each skeleton as a chain of droplets with VARIABLE radius and
renders the glyph as an iso-contour of an exponential smooth-minimum
distance field — i.e. actual metaball behaviour:

  * terminals POOL (surface tension bulge)
  * mid-strokes develop a slight WAIST (the stream stretching)
  * nearby streams MELT into each other with concave fillets (necking)

Field:  f(p) = smin_i ( |p - c_i| - r_i )      via exponential smin
Glyph:  iso-contour f(p) = 0, extracted with marching squares.
"""

import numpy as np
from skimage import measure
import matplotlib.pyplot as plt
from matplotlib.path import Path as MplPath
from matplotlib.patches import PathPatch
from aquascript import skeletons, PARAMS

# ------------------------------------------------------------- liquid params
LIQ = dict(
    base_r=40.0,       # resting stream radius
    pool=0.55,         # terminal bulge strength (droplet pooling)
    pool_span=0.11,    # how far the pool reaches along the stroke (0..1 arc)
    waist=0.22,        # mid-stroke thinning (stretch)
    wobble=0.08,       # organic radius variation on closed loops
    melt=19.0,         # smin softness in font units (higher = gooier necks)
    step=6.0,          # skeleton sampling step (units)
    grid=2.5,          # field grid resolution (units per cell)
)


# --------------------------------------------------------- skeleton sampling
def _cubic(p0, p1, p2, p3, t):
    mt = 1 - t
    return (mt**3 * p0 + 3 * mt**2 * t * p1 + 3 * mt * t**2 * p2 + t**3 * p3)


def sample_subpath(sp, step):
    """Return dense points along one skeleton sub-path + closed flag."""
    pts, cur, closed = [], None, False
    for op in sp:
        if op[0] == "m":
            cur = np.array(op[1], float)
            pts.append(cur)
        elif op[0] == "l":
            end = np.array(op[1], float)
            n = max(2, int(np.linalg.norm(end - cur) / step))
            pts += [cur + (end - cur) * t for t in np.linspace(0, 1, n)[1:]]
            cur = end
        elif op[0] == "c":
            p1, p2, p3 = (np.array(q, float) for q in op[1:])
            chord = np.linalg.norm(p3 - cur)
            n = max(4, int(chord * 1.6 / step))
            pts += [_cubic(cur, p1, p2, p3, t) for t in np.linspace(0, 1, n)[1:]]
            cur = p3
        elif op[0] == "z":
            closed = True
    return np.array(pts), closed


def radii_for(pts, closed):
    """Variable radius along the stream: pooling ends, waisted middle."""
    n = len(pts)
    t = np.linspace(0, 1, n)
    r = np.full(n, LIQ["base_r"])
    if closed:
        r *= 1 + LIQ["wobble"] * np.sin(4 * np.pi * t)
    else:
        span = LIQ["pool_span"]
        r *= (1
              + LIQ["pool"] * (np.exp(-(t / span) ** 2)
                               + np.exp(-((1 - t) / span) ** 2))
              - LIQ["waist"] * np.exp(-((t - 0.5) / 0.24) ** 2))
    return r


# ------------------------------------------------------------- field render
def glyph_field(subpaths):
    centers, radii = [], []
    for sp in subpaths:
        pts, closed = sample_subpath(sp, LIQ["step"])
        if len(pts) == 0:
            continue
        centers.append(pts)
        radii.append(radii_for(pts, closed))
    C = np.vstack(centers)
    R = np.concatenate(radii)

    pad = LIQ["base_r"] * 2.4
    x0, y0 = C.min(0) - pad
    x1, y1 = C.max(0) + pad
    g = LIQ["grid"]
    xs = np.arange(x0, x1, g)
    ys = np.arange(y0, y1, g)
    X, Y = np.meshgrid(xs, ys)

    # exponential smooth-min, accumulated in chunks (associative)
    k = 1.0 / LIQ["melt"]
    acc = np.zeros_like(X)
    for i in range(0, len(C), 96):
        cx = C[i:i + 96, 0][:, None, None]
        cy = C[i:i + 96, 1][:, None, None]
        rr = R[i:i + 96][:, None, None]
        d = np.sqrt((X[None] - cx) ** 2 + (Y[None] - cy) ** 2) - rr
        acc += np.exp(-k * d).sum(0)
    F = -np.log(np.maximum(acc, 1e-30)) / k
    return F, xs, ys


def _calibrated_iso():
    """Field value at the true surface of a straight test stroke rendered
    with identical sampling — corrects smin's density inflation exactly."""
    k = 1.0 / LIQ["melt"]
    m = np.arange(-400, 401) * LIQ["step"]          # long straight skeleton
    d = np.sqrt(m ** 2 + LIQ["base_r"] ** 2) - LIQ["base_r"]
    return -np.log(np.exp(-k * d).sum()) / k


def glyph_contours(subpaths):
    """Marching-squares iso-contours in font units."""
    F, xs, ys = glyph_field(subpaths)
    iso = _calibrated_iso()
    cs = measure.find_contours(F, iso)
    out = []
    for c in cs:
        px = np.interp(c[:, 1], np.arange(len(xs)), xs)
        py = np.interp(c[:, 0], np.arange(len(ys)), ys)
        out.append(np.column_stack([px, py]))
    return out


# ------------------------------------------------------------------ specimen
def word_patch(word, ax, y_off=0, color="#141414"):
    skels = skeletons()
    pen_x = 0
    for ch in word:
        if ch == " ":
            pen_x += 240
            continue
        contours = glyph_contours(skels[ch])
        verts, codes = [], []
        xmax = 0
        for c in contours:
            xmax = max(xmax, c[:, 0].max())
            verts += list(c) + [c[0]]
            codes += [MplPath.MOVETO] + [MplPath.LINETO] * (len(c) - 1) + [MplPath.CLOSEPOLY]
        path = MplPath(np.array(verts) + [pen_x, y_off], codes)
        ax.add_patch(PathPatch(path, facecolor=color, edgecolor="none"))
        pen_x += xmax + PARAMS["side"]
    return pen_x


if __name__ == "__main__":
    fig, ax = plt.subplots(figsize=(22, 7), dpi=110)
    ax.set_facecolor("#f5f3ef"); fig.patch.set_facecolor("#f5f3ef")
    w = word_patch("the logotype", ax)
    ax.set_xlim(-80, w + 80)
    ax.set_ylim(-340, 840)
    ax.set_aspect("equal"); ax.axis("off")
    plt.tight_layout()
    plt.savefig("liquid_specimen.png", bbox_inches="tight")
    print("saved liquid_specimen.png")
