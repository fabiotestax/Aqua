"""Fit a contour with anchors only at the extremes (dx/dt=0 or dy/dt=0),
joined by cubic beziers with axis-aligned, kappa-scaled symmetric handles.
Few points, on-curve at the extremes: clean type-design curves."""
import numpy as np
from scipy.interpolate import splprep, splev, CubicSpline, PPoly
K = 0.5523


def fit_smooth(contour, s):
    """Smooth the contour then convert the smoothing spline DIRECTLY to beziers
    (one per knot interval) via PPoly. Preserves the spline's own gentle shape
    and C2 continuity exactly — no re-interpolation overshoot at tight turns."""
    P = flatten(contour)
    if np.allclose(P[0], P[-1]):
        P = P[:-1]
    tck, _ = splprep([P[:, 0], P[:, 1]], s=s, per=1)
    t, c, k = tck
    ppx = PPoly.from_spline((t, c[0], k))
    ppy = PPoly.from_spline((t, c[1], k))
    bps = ppx.x
    lo, hi = t[k], t[-k - 1]
    xs = np.unique(bps[(bps >= lo - 1e-9) & (bps <= hi + 1e-9)])
    p0 = np.array([float(ppx(xs[0])), float(ppy(xs[0]))])
    out = [["m", round(p0[0], 2), round(p0[1], 2)]]
    for a, b in zip(xs[:-1], xs[1:]):
        du = b - a
        if du <= 1e-9:
            continue
        pa = np.array([float(ppx(a)), float(ppy(a))])
        pb = np.array([float(ppx(b)), float(ppy(b))])
        da = np.array([float(ppx(a, 1)), float(ppy(a, 1))])
        db = np.array([float(ppx(b, 1)), float(ppy(b, 1))])
        c1 = pa + da * du / 3.0
        c2 = pb - db * du / 3.0
        out.append(["c", round(float(c1[0]), 2), round(float(c1[1]), 2),
                    round(float(c2[0]), 2), round(float(c2[1]), 2),
                    round(float(pb[0]), 2), round(float(pb[1]), 2)])
    return out, len(out) - 1

def flatten(contour, per=28):
    pts, cur = [], None
    for s in contour:
        if s[0]=='m': cur=np.array([s[1],s[2]],float); pts.append(cur)
        elif s[0]=='l': cur=np.array([s[1],s[2]],float); pts.append(cur)
        elif s[0]=='c':
            c1=np.array([s[1],s[2]],float); c2=np.array([s[3],s[4]],float); e=np.array([s[5],s[6]],float)
            for t in np.linspace(0,1,per)[1:]:
                mt=1-t; pts.append(mt**3*cur+3*mt**2*t*c1+3*mt*t**2*c2+t**3*e)
            cur=e
    return np.array(pts)

def fit(contour, s, min_sep_t=0.012):
    P=flatten(contour)
    if np.allclose(P[0],P[-1]): P=P[:-1]
    tck,_=splprep([P[:,0],P[:,1]],s=s,per=1)
    N=4000; t=np.linspace(0,1,N,endpoint=False)
    x,y=splev(t,tck); dx,dy=splev(t,tck,der=1); ddx,ddy=splev(t,tck,der=2)
    anchors=[]   # (t, kind): 'v' vertical tan, 'h' horizontal tan, 'i' inflection
    for arr,tan in [(dx,'v'),(dy,'h')]:
        sgn=np.sign(arr)
        for i in range(N):
            if sgn[i]==0 or sgn[i]!=sgn[(i+1)%N]:
                anchors.append((t[i],tan))
    curv=dx*ddy-dy*ddx                       # signed curvature (numerator)
    sgn=np.sign(curv)
    for i in range(N):
        if sgn[i]!=0 and sgn[i]!=sgn[(i+1)%N]:
            anchors.append((t[i],'i'))
    anchors.sort()
    keep=[]                                  # extrema win ties over inflections
    for tt,tan in anchors:
        if keep and (tt-keep[-1][0])<=min_sep_t:
            if tan!='i' and keep[-1][1]=='i': keep[-1]=(tt,tan)
            continue
        keep.append((tt,tan))
    if len(keep)>1 and (1-keep[-1][0]+keep[0][0])<min_sep_t: keep.pop()

    pos=np.array(splev([t for t,_ in keep], tck)).T   # anchor positions

    # Build a PERIODIC C2 cubic spline through the anchors (chord-length param)
    # and convert each segment exactly to a bezier. C2 => curvature continuous
    # => no lumps at the anchors (the failure mode of independent per-segment
    # fitting). Anchors sit on the smooth spline's extremes, so tangents there
    # stay essentially axis-aligned.
    xe=np.r_[pos[:,0],pos[0,0]]; ye=np.r_[pos[:,1],pos[0,1]]
    d=np.r_[0,np.cumsum(np.hypot(np.diff(xe),np.diff(ye)))]
    csx=CubicSpline(d,xe,bc_type='periodic'); csy=CubicSpline(d,ye,bc_type='periodic')
    out=[['m',round(float(pos[0,0]),2),round(float(pos[0,1]),2)]]
    for i in range(len(pos)):
        du=d[i+1]-d[i]
        p0=np.array([xe[i],ye[i]]); p1=np.array([xe[i+1],ye[i+1]])
        c1=p0+np.array([csx(d[i],1),csy(d[i],1)])*du/3.0
        c2=p1-np.array([csx(d[i+1],1),csy(d[i+1],1)])*du/3.0
        out.append(['c',round(float(c1[0]),2),round(float(c1[1]),2),
                    round(float(c2[0]),2),round(float(c2[1]),2),
                    round(float(p1[0]),2),round(float(p1[1]),2)])
    return out, len(pos)
