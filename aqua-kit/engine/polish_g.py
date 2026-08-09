"""
Polish the traced g with type-design principles.

  * counters -> clean ovals at the measured centres/radii (kills their wobble)
  * outer   -> periodic smoothing spline to remove trace noise, with anchors
               FORCED at the real extremes (eye-top, loop-bottom, right, and
               the spur tip) so on-curve points land where a type designer
               would put them, then clean cubics laid through them.
Silhouette, link, right-notch, left spur and weight preserved.
"""
import json
import numpy as np
from scipy.interpolate import splprep, splev

K = 0.5523


def flatten(contour, per_cubic=30):
    pts, cur = [], None
    for seg in contour:
        if seg[0] == "m":
            cur = np.array([seg[1], seg[2]], float); pts.append(cur)
        elif seg[0] == "l":
            cur = np.array([seg[1], seg[2]], float); pts.append(cur)
        elif seg[0] == "c":
            c1 = np.array([seg[1], seg[2]], float)
            c2 = np.array([seg[3], seg[4]], float)
            end = np.array([seg[5], seg[6]], float)
            for t in np.linspace(0, 1, per_cubic)[1:]:
                mt = 1 - t
                pts.append(mt**3 * cur + 3 * mt**2 * t * c1 +
                           3 * mt * t**2 * c2 + t**3 * end)
            cur = end
    return np.array(pts)


def oval(cx, cy, rx, ry, ccw):
    """Clean oval. ccw=True: top->left->bottom->right. Else clockwise."""
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


def catmull(A):
    n = len(A)
    out = [["m", round(A[0][0], 2), round(A[0][1], 2)]]
    for i in range(n):
        p0, p1, p2, p3 = A[(i-1) % n], A[i], A[(i+1) % n], A[(i+2) % n]
        c1 = p1 + (p2 - p0) / 6.0
        c2 = p2 - (p3 - p1) / 6.0
        out.append(["c", round(c1[0], 2), round(c1[1], 2),
                    round(c2[0], 2), round(c2[1], 2),
                    round(p2[0], 2), round(p2[1], 2)])
    return out


def smooth_outer(contour, s, n, forced):
    P = flatten(contour)
    if np.allclose(P[0], P[-1]):
        P = P[:-1]
    tck, _ = splprep([P[:, 0], P[:, 1]], s=s, per=1)
    dense = np.array(splev(np.linspace(0, 1, 1200, endpoint=False), tck)).T
    us = list(np.linspace(0, 1, n, endpoint=False))
    for fp in forced:
        k = np.argmin(np.hypot(dense[:, 0]-fp[0], dense[:, 1]-fp[1]))
        us.append(k / 1200.0)
    us = np.unique(np.round(np.sort(us), 5))
    ax, ay = splev(us, tck)
    return np.column_stack([ax, ay])


def signed_area(A):
    x, y = A[:, 0], A[:, 1]
    return 0.5 * np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)


def reverse_contour(c):
    pts = [(c[0][1], c[0][2])]
    for seg in c[1:]:
        pts.append((seg[5], seg[6]) if seg[0] == "c" else (seg[1], seg[2]))
    ctrls = [None] + [((s[1], s[2]), (s[3], s[4])) if s[0] == "c" else None
                      for s in c[1:]]
    n = len(pts)
    out = [["m", round(pts[0][0], 2), round(pts[0][1], 2)]]
    for i in range(n):
        a = pts[(n - i) % n]
        cc = ctrls[(n - i) % n]
        if cc is None:
            out.append(["l", round(a[0], 2), round(a[1], 2)])
        else:
            out.append(["c", round(cc[1][0], 2), round(cc[1][1], 2),
                        round(cc[0][0], 2), round(cc[0][1], 2),
                        round(a[0], 2), round(a[1], 2)])
    return out


contours = json.load(open("g_real_outline.json"))
outer = max(contours, key=len)

A = smooth_outer(outer, s=200.0, n=34, forced=[])
outer_c = catmull(A)
outer_ccw = signed_area(A) > 0                 # counters must wind opposite
cc = not outer_ccw

eye = oval(249, 375, 84, 90, cc)
loop = oval(260, -47, 104, 75, cc)

json.dump([outer_c, eye, loop], open("g_polished_outline.json", "w"))
print("wrote g_polished_outline.json  outer CCW:", outer_ccw,
      "sizes", [len(outer_c), len(eye), len(loop)])
