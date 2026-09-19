"""
Polish the traced g with type-design principles.

The g outline was image-traced from a low-res source, so it carried trace
noise — a crooked left flank, wandering spur, irregular counters.

  * OUTER  -> refit with anchors ONLY at the true extremes (dx/dt=0, dy/dt=0),
              joined by cubic beziers with axis-aligned, symmetric handles at
              ~55.3% (kappa). Few points, on-curve at the extremes: smooth.
  * COUNTERS -> redrawn as clean kappa ovals at the measured centres/radii,
                wound opposite the outer so they stay holes.

Silhouette, link, right-notch, left spur and weight preserved; curves clean.
Writes g_polished_outline.json, which aquascript.py embeds as the g.
"""
import json
import numpy as np
from fit_extrema import fit, fit_smooth

K = 0.5523


def oval(cx, cy, rx, ry, ccw):
    """Clean kappa oval. ccw=True: top->left->bottom->right, else clockwise."""
    kx, ky = K * rx, K * ry
    r = lambda a, b: [round(a, 2), round(b, 2)]
    if ccw:
        return [["m", *r(cx, cy + ry)],
                ["c", *r(cx - kx, cy + ry), *r(cx - rx, cy + ky), *r(cx - rx, cy)],
                ["c", *r(cx - rx, cy - ky), *r(cx - kx, cy - ry), *r(cx, cy - ry)],
                ["c", *r(cx + kx, cy - ry), *r(cx + rx, cy - ky), *r(cx + rx, cy)],
                ["c", *r(cx + rx, cy + ky), *r(cx + kx, cy + ry), *r(cx, cy + ry)]]
    return [["m", *r(cx, cy + ry)],
            ["c", *r(cx + kx, cy + ry), *r(cx + rx, cy + ky), *r(cx + rx, cy)],
            ["c", *r(cx + rx, cy - ky), *r(cx + kx, cy - ry), *r(cx, cy - ry)],
            ["c", *r(cx - kx, cy - ry), *r(cx - rx, cy - ky), *r(cx - rx, cy)],
            ["c", *r(cx - rx, cy + ky), *r(cx - kx, cy + ry), *r(cx, cy + ry)]]


def signed_area(A):
    x, y = A[:, 0], A[:, 1]
    return 0.5 * np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)


contours = json.load(open("g_real_outline.json"))
outer = max(contours, key=len)

outer_c, n_anchors = fit_smooth(outer, s=900.0)
A = np.array([[s[-2], s[-1]] for s in outer_c])
cc = not (signed_area(A) > 0)                  # counters wind opposite outer

eye = oval(249, 375, 84, 90, cc)               # measured centre / radii
loop = oval(260, -47, 104, 75, cc)

json.dump([outer_c, eye, loop], open("g_polished_outline.json", "w"))
print(f"wrote g_polished_outline.json  outer anchors={n_anchors}")
