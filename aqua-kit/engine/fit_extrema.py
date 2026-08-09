"""Fit a contour with anchors only at the extremes (dx/dt=0 or dy/dt=0),
joined by cubic beziers with axis-aligned, kappa-scaled symmetric handles.
Few points, on-curve at the extremes: clean type-design curves."""
import numpy as np
from scipy.interpolate import splprep, splev
K = 0.5523

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
    x,y=splev(t,tck); dx,dy=splev(t,tck,der=1)
    ex=[]
    for arr,tan in [(dx,'v'),(dy,'h')]:
        sgn=np.sign(arr)
        for i in range(N):
            if sgn[i]==0 or sgn[i]!=sgn[(i+1)%N]:
                ex.append((t[i],tan))
    ex.sort()
    # dedupe close-in-t
    keep=[]
    for tt,tan in ex:
        if not keep or (tt-keep[-1][0])>min_sep_t: keep.append((tt,tan))
    if len(keep)>1 and (1-keep[-1][0]+keep[0][0])<min_sep_t: keep.pop()
    A=[]
    for tt,tan in keep:
        px,py=splev(tt,tck); ddx,ddy=splev(tt,tck,der=1)
        A.append((np.array([float(px),float(py)]), tan, np.array([float(ddx),float(ddy)])))
    # build beziers
    def unit(v):
        n=np.hypot(*v); return v/n if n>1e-9 else v
    out=[['m',round(float(A[0][0][0]),2),round(float(A[0][0][1]),2)]]
    n=len(A)
    for i in range(n):
        p0,t0,d0=A[i]; p1,t1,d1=A[(i+1)%n]
        u0=unit(np.array([d0[0],0.0]) if t0=='h' else np.array([0.0,d0[1]]))
        u1=unit(np.array([d1[0],0.0]) if t1=='h' else np.array([0.0,d1[1]]))
        delta=p1-p0
        l0=K*abs(np.dot(delta,u0)); l1=K*abs(np.dot(delta,u1))
        c1=p0+u0*l0; c2=p1-u1*l1
        out.append(['c',round(float(c1[0]),2),round(float(c1[1]),2),
                    round(float(c2[0]),2),round(float(c2[1]),2),
                    round(float(p1[0]),2),round(float(p1[1]),2)])
    return out, len(A)
