// Aqua — the typeface as a plain module.
//
// Everything that draws a glyph lives here: the contrast law, the shared primitives, one
// buildX(s) per parametric glyph, the anisotropic offset for the g, the drawn masters and
// their interpolation, the spacing tables, the SVG export and the reimport diff.
// Aqua.dc.html and the Studio both load this file; neither owns any geometry of its own.
//
// Loads as a classic <script> (window.AquaEngine) and as a CommonJS module (require).
// No dependencies. Only samplePath() touches the DOM, and only when called.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AquaEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
'use strict';
const SRC = "M254 -174Q214 -173 176.0 -161.5Q138 -150 108.0 -131.0Q78 -112 62.5 -88.0Q47 -64 53 -39Q60 -10 95 15Q108 25 121.5 33.5Q135 42 134 50Q134 58 122.5 64.5Q111 71 99 79Q75 93 59.0 110.0Q43 127 42 145Q41 163 55.5 181.5Q70 200 92 215Q105 224 117.0 232.0Q129 240 129 249Q130 258 120.0 268.0Q110 278 100 289Q66 325 63 362Q61 391 76.0 420.0Q91 449 118.0 473.5Q145 498 179.0 512.5Q213 527 249 528Q285 529 319.5 515.0Q354 501 381.0 477.0Q408 453 423.0 423.5Q438 394 436 363Q434 327 409.0 294.0Q384 261 347.0 239.5Q310 218 273 217Q264 216 255.0 217.0Q246 218 237 220Q228 221 219.0 222.5Q210 224 201 223Q185 220 169.0 209.5Q153 199 142.5 184.0Q132 169 133 155Q133 138 148.0 124.0Q163 110 185.0 101.5Q207 93 227 91Q239 90 249.5 91.5Q260 93 271 94Q282 96 293.5 97.0Q305 98 316 97Q351 95 385.5 74.5Q420 54 443.5 24.5Q467 -5 470 -36Q473 -74 442.5 -106.0Q412 -138 361.5 -157.0Q311 -176 254 -174ZM250 465Q215 465 190.5 438.5Q166 412 166 375Q166 338 190.5 311.5Q215 285 250 285Q285 285 309.5 311.5Q334 338 334 375Q334 412 309.5 438.5Q285 465 250 465ZM261 28Q218 28 187.5 6.0Q157 -16 157 -47Q157 -78 187.5 -100.0Q218 -122 261 -122Q304 -122 334.5 -100.0Q365 -78 365 -47Q365 -16 334.5 6.0Q304 28 261 28Z";

const REF22 = "M132.9 49.1C132.9 95 42.5 93.5 42.5 147.8C42.5 201.2 128.2 203.3 128.2 251.7C128.2 298.4 63.1 319.9 63.1 370.4C63.1 462.6 171.1 527.9 254.3 527.9C337.4 527.9 436 460 436 370.5C436 263.1 326 219.7 237.6 219.7C197.7 219.7 133.5 213.4 133.5 157.6C133.5 110.7 198.2 90.8 236 90.8C258.8 90.8 281.1 97.3 304 97.3C376.9 97.3 470 36.7 470 -42.9C470 -137.7 340.3 -174.1 264.7 -174.1C195.5 -174.1 51.8 -146 51.8 -54.3C51.8 -2 132.9 4.6 132.9 49.1ZM250 465C202.1 465 166 421.2 166 375C166 328.8 202.1 285 250 285C297.9 285 334 328.8 334 375C334 421.2 297.9 465 250 465ZM261 28C217.4 28 157 4.5 157 -47C157 -98.5 217.4 -122 261 -122C304.6 -122 365 -98.5 365 -47C365 4.5 304.6 28 261 28Z";

const REF28 = "M82.5 -111.6C66.3 -96.3 51.3 -76.4 51.3 -53.1C51.3 -19.3 78.7 3.5 103.8 21.6C112.5 27.8 134.1 36.7 134.1 49.2C134.1 61.8 116.7 67.6 107.9 73.2C81.9 89.7 41.9 111.7 41.9 147.3C41.9 179.6 74.9 202.9 98.4 219.4C109.2 227 129.1 235 129.1 250.4C129.1 265.7 108.4 279.4 99.1 289.9C79.5 312.3 62.8 337.8 62.8 368.7C62.8 460.4 171.4 528.1 254.1 528.1C336.1 528.1 436.2 459 436.2 370.3C436.2 285.4 343.2 216.5 263.6 216.5C244.9 216.5 226.9 223.4 208.3 223.4C177.3 223.4 132.9 191.2 132.9 157.9C132.9 112.3 198.6 90.6 236 90.6C259.1 90.6 281.7 97.5 304.8 97.5C375.2 97.5 470.3 34.6 470.3 -42.7C470.3 -73.3 452.5 -98.3 430.2 -117.7C385.7 -156.3 323.5 -174.2 265.4 -174.2C202 -174.2 129.8 -156.2 82.5 -111.6ZM250 465C201.6 465 166 421.6 166 375C166 328.4 201.6 285 250 285C298.4 285 334 328.4 334 375C334 421.6 298.4 465 250 465ZM261 28C217.8 28 157 4.5 157 -47C157 -98.5 217.8 -122 261 -122C304.2 -122 365 -98.5 365 -47C365 4.5 304.2 28 261 28Z";

// Contrast is a function of weight, not a constant. As the stem thins the horizontals thin
// FASTER than the verticals, so the light cuts keep the drawn, watery character instead of
// flattening into a geometric sans. thin/stem runs 0.49 at Black to 0.35 at Regular
// (the curve is defined down to 0.28 so the axis can be extended later without a refit).
const thinRatio = s => 0.28 + 0.21 * (Math.max(26, Math.min(106, s)) - 26) / 80;
const contrastK = s => thinRatio(s) / 0.49;
const CONTRAST = 0.50;
// One angle for the whole family: every cut terminal climbs 0.34 to the right across its
// own stem, so the h, the exclam and anything derived from them share a single slope.
const SLANT = 0.34;
const SL = (() => { const L = Math.hypot(1, SLANT); return [1 / L, SLANT / L]; })();
// shallow down-left tangent used where the a's sole hands over to the bowl's underside
const TUCK = (() => { const L = Math.hypot(1, 0.30); return [-1 / L, -0.30 / L]; })();

// Solved against the polished outline so the neck holds its 0.65 ratio to the stem.
const NECK_TABLE = [[0, 1], [11, 0.573], [19, 0.571], [26, 0.575], [33, 0.574], [39, 0.576]];
function neckComp(d) {
  if (d <= 0) return 1;
  for (let i = 1; i < NECK_TABLE.length; i++) {
    const [x0, y0] = NECK_TABLE[i-1], [x1, y1] = NECK_TABLE[i];
    if (d <= x1) return y0 + (y1 - y0) * (d - x0) / (x1 - x0);
  }
  return NECK_TABLE[NECK_TABLE.length - 1][1];
}
const inNeck = p => p[0] < 250 && p[1] > 20 && p[1] < 280;

function offsetPath(d0, amount, fixNeck) {
  const tk = d0.match(/[MCZ]|-?[\d.]+/g);
  const cs = []; let cur = null, c = null, i = 0;
  while (i < tk.length) {
    const t = tk[i];
    if (t === 'M') { cur = [+tk[i+1], +tk[i+2]]; c = { segs: [] }; cs.push(c); i += 3; }
    else if (t === 'C') {
      c.segs.push([cur, [+tk[i+1], +tk[i+2]], [+tk[i+3], +tk[i+4]], [+tk[i+5], +tk[i+6]]]);
      cur = [+tk[i+5], +tk[i+6]]; i += 7;
    } else i++;
  }
  const sub = (a, b) => [a[0]-b[0], a[1]-b[1]], add = (a, b) => [a[0]+b[0], a[1]+b[1]];
  const mul = (a, s) => [a[0]*s, a[1]*s], len = a => Math.hypot(a[0], a[1]);
  const unit = a => { const l = len(a) || 1; return [a[0]/l, a[1]/l]; };
  const f = v => Math.round(v*10)/10;
  let out = '';
  cs.forEach(cc => {
    const segs = cc.segs, n = segs.length;
    const tan = segs.map(S => { let t = sub(S[1], S[0]); if (len(t) < 1e-6) t = sub(S[3], S[0]); return unit(t); });
    const comp = fixNeck === false ? 1 : neckComp(amount);
    // horizontals thin faster than verticals, and the gap widens as the weight drops. The
    // neck band keeps the flat 0.50 it was solved against, so its 0.65 ratio still holds.
    const CH = Math.max(0.5, 0.80 - 0.0058 * amount);
    const A = segs.map((S, k) => {
      const t = tan[k], nk = inNeck(S[0]);
      const c = nk ? CONTRAST : CH;
      let fac = c + (1 - c) * Math.abs(t[1]);
      if (nk) fac *= comp;
      return add(S[0], mul([t[1], -t[0]], amount * fac));
    });
    const nu = segs.map((S, k) => {
      const a = A[k], b = A[(k+1) % n];
      const ratio = len(sub(b, a)) / (len(sub(S[3], S[0])) || 1);
      const t1 = unit(sub(S[1], S[0])), t2 = unit(sub(S[2], S[3]));
      return [a, add(a, mul(t1, len(sub(S[1], S[0])) * ratio)), add(b, mul(t2, len(sub(S[2], S[3])) * ratio)), b];
    });
    out += `M${f(nu[0][0][0])} ${f(nu[0][0][1])}`;
    nu.forEach(S => { out += `C${f(S[1][0])} ${f(S[1][1])} ${f(S[2][0])} ${f(S[2][1])} ${f(S[3][0])} ${f(S[3][1])}`; });
    out += 'Z';
  });
  return out;
}

const H_PATH = "M106 698C106 652.1 106 606.1 106 560.2C106 510.5 120.3 470.1 138 470.1C204.3 470.1 204.3 528 258.5 528C325.1 528 379 474.1 379 407.5C379 289.3 379 171.2 379 53C379 23.7 355.3 0 326 0C296.7 0 273 23.7 273 53C273 158.1 273 263.1 273 368.2C273 414.3 235.6 451.7 189.5 451.7C143.4 451.7 106 414.3 106 368.2C106 263.1 106 158.1 106 53C106 23.7 82.3 0 53 0C23.7 0 0 23.7 0 53C0 268 0 483 0 698C0 727.3 23.7 751 53 751C82.3 751 106 727.3 106 698Z";

const A_PATH = "M192 528C290.3 528 370 480.5 370 422C370 321.3 370 220.7 370 120C370 49.9 273.9 -7 155.4 -7C69.6 -7 0 59.7 0 142C0 223.7 86.6 289.8 193.4 289.8C230.7 289.8 261 341.9 261 406.1C261 430.2 190.9 443.2 104.4 443.2C81 443.2 62 462.2 62 485.6C62 509 81 528 104.4 528C133.6 528 162.8 528 192 528ZM109 141.4C109 95.7 146.8 58.7 193.4 58.7C240 58.7 277.8 96.5 277.8 143.1C277.8 150.8 277.8 158.5 277.8 166.2C277.8 198.2 240 224.1 193.4 224.1C146.8 224.1 109 187.1 109 141.4Z";

const EXCL_PATH = "M4 698C4 727.3 27.7 751 57 751C86.3 751 110 727.3 110 698C110 551.3 110 404.7 110 258C110 228.7 86.3 205 57 205C27.7 205 4 228.7 4 258C4 404.7 4 551.3 4 698ZM0.8 56.2C0.8 87.2 26 112.4 57 112.4C88 112.4 113.2 87.2 113.2 56.2C113.2 25.2 88 0 57 0C26 0 0.8 25.2 0.8 56.2Z";

// ink width and left edge shrink predictably: every horizontal extreme has a vertical
// tangent, so it moves by exactly the offset — except the g's left edge, which is inside
// the compensated neck band.
const WORD = [
  { key: 'h', p: H_PATH, w0: 379.1, minX0: 0, neck: false, extra: 0 },
  { key: 'a', p: A_PATH, w0: 370.4, minX0: 0, neck: false, extra: 0 },
  { key: 'g', p: null,   w0: 427.5, minX0: 42.5, neck: true, extra: 0 },
  { key: '!', p: EXCL_PATH, w0: 112, minX0: 0, neck: false, extra: 10 }
];

// Glyphs are CONSTRUCTED at each weight, not offset from the Black master. Terminals are
// true semicircular caps of radius s/2, so they stay round all the way down instead of
// shrinking to spikes. Every point sits on an extremum; every handle is the circle
// constant on quarter turns, so a lump cannot occur.
const KC = 0.5523, fx = v => Math.round(v * 10) / 10;
const TV = [0, 1], TVd = [0, -1], THr = [1, 0], THl = [-1, 0];
function contour(P) {
  let out = `M${fx(P[0].p[0])} ${fx(P[0].p[1])}`;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    // a point may carry a separate INCOMING tangent (tin) — that is the only way to put a
    // real corner in the outline (the slant-cut terminal needs one)
    const bt = b.tin || b.t;
    const t0 = a.t, t1 = [-bt[0], -bt[1]];
    const dx = b.p[0] - a.p[0], dy = b.p[1] - a.p[1];
    const collinear = Math.abs(t0[0] * (-t1[0]) + t0[1] * (-t1[1]) - 1) < 1e-6;
    const chordPar = Math.abs(t0[0] * dy - t0[1] * dx) < 0.01;
    const perp = Math.abs(t0[0] * t1[0] + t0[1] * t1[1]) < 0.5;
    let h0, h1;
    if (collinear && chordPar) { h0 = h1 = Math.hypot(dx, dy) / 3; }
    else if (perp) { h0 = KC * Math.abs(t0[0] ? dx : dy); h1 = KC * Math.abs(t1[0] ? dx : dy); }
    // (floor applied below — a zero-length handle has an undefined tangent and breaks
    //  interpolation, so no handle may fall under 15% of its own chord)
    else {
      // S-curve. Scale off the tangent axis, but never below half the chord — otherwise a
      // chord running perpendicular to its own tangents collapses the handles to a cusp.
      const sp = Math.max(Math.abs(t0[0] ? dx : dy), Math.hypot(dx, dy) * 0.5);
      h0 = (a.k0 ?? 0.55) * sp; h1 = (b.k1 ?? 0.45) * sp;
    }
    const floor = Math.hypot(dx, dy) * 0.15;
    h0 = Math.max(h0, floor); h1 = Math.max(h1, floor);
    // an explicit handle length wins over the solver — that is how a true circular fillet
    // on a diagonal join is expressed (see corner())
    if (a.hx != null) h0 = a.hx;
    if (b.hn != null) h1 = b.hn;
    out += `C${fx(a.p[0] + t0[0] * h0)} ${fx(a.p[1] + t0[1] * h0)} ${fx(b.p[0] + t1[0] * h1)} ${fx(b.p[1] + t1[1] * h1)} ${fx(b.p[0])} ${fx(b.p[1])}`;
  }
  return out + 'Z';
}
// A stem, top and bottom, shared by h/n/b/u/m/w so every one of them ends the same way:
// the ascender is an angled cut on SLANT with softened corners, the foot is a rounded
// square — a flat sole with generous corners, not a semicircular cap.
function cutTop(x0, s, asc) {
  const fr = 0.34 * s, fr2 = 0.28 * s, ascL = asc - SLANT * s;
  return [
    { p: [x0, ascL - fr], t: TV },
    { p: [x0 + fr * SL[0], ascL + fr * SL[1]], t: SL },
    { p: [x0 + s - fr2 * SL[0], asc - fr2 * SL[1]], t: SL }];
}
function foot(x0, s) {
  const rb = 0.30 * s;
  return [
    { p: [x0 + s, rb], t: TVd }, { p: [x0 + s - rb, 0], t: THl },
    { p: [x0 + rb, 0], t: THl }, { p: [x0, rb], t: TV }];
}
// the arch that carries h, n, m and (mirrored) u. armX/armY set where it leaves the stem,
// oaX/oaY its crown; the crown is a horizontal, so it takes the weight's contrast.
function arch(x0, s, W, k, xh, ov) {
  const armY = xh - 0.48 * s, armX = x0 + s + 32;
  const oaY = xh + ov, oaX = (armX + x0 + W) / 2, iaY = oaY - 0.72 * s * k, iaX = x0 + W / 2;
  const spring = iaY - (W - 2 * s) / 2;
  return { armY, armX, oaY, oaX, iaY, iaX, spring };
}
function buildH(s) {
  const asc = 751, xh = 521, ov = 7, W = 379, k = contrastK(s), fr2 = 0.28 * s;
  const A = arch(0, s, W, k, xh, ov), rise = 0.85 * s;
  return contour([
    { p: [s, asc - fr2], t: TVd }, { p: [s, Math.min(A.armY + rise, asc - fr2 - 1)], t: TVd },
    { p: [A.armX, A.armY], t: THr, k0: 0.55 }, { p: [A.oaX, A.oaY], t: THr, k1: 0.45 },
    { p: [W, A.oaY - (W - A.oaX)], t: TVd },
    ...foot(W - s, s),
    { p: [W - s, A.spring], t: TV },
    { p: [A.iaX, A.iaY], t: THl }, { p: [s, A.spring], t: TVd },
    ...foot(0, s),
    ...cutTop(0, s, asc)]);
}
function buildA(s) {
  const xh = 521, ov = 7, W = 370, top = xh + ov, bot = -ov;
  // The outer silhouette is FIXED — no term below depends on s. Only the inner edges move,
  // each one offset from its own outer edge by the stroke it carries, so every weight is the
  // same shape eroded by ink and the masters interpolate without any compensation table.
  const bowlTop = 285, ltx = 118, tx = 62, lean = 106 - s;
  // The shoulder's turn eases wider than the stroke as the weight drops, and the arm's top
  // edge runs all the way to where that turn begins — so the shoulder is a TRUE quarter
  // circle. Holding the apex at a fixed x made it a flattened ellipse that broke into a
  // visible corner where it met the stem.
  const shR = s + 0.45 * lean, shX = W - shR;
  // the stem stops short of the baseline in a small squared foot and the bowl tucks under it
  // — the flick the artwork ends on. Outer geometry, so it is identical at every weight.
  const tipY = 44, tipR = 40, k = contrastK(s);
  const armTt = 0.62 * s * k;        // arm at the terminal = the thin stroke
  const rise = 0.24 * s;             // arm top climbs from terminal to shoulder, so the arm
  const underY = top - rise - armTt; // tapers by its top edge while the underside stays flat
  // the arm narrows toward the terminal, then stops in a true semicircle:
  // no cut, no corner anywhere on the a
  const capR = armTt / 2;  // the arm's top edge leaves the terminal on the chord to the shoulder, so the climb is one
  // monotone arc — leaving it horizontal made it run flat and then hump into the shoulder
  const TOPT = (() => { const L = Math.hypot(shX - tx - capR, rise); return [(shX - tx - capR) / L, rise / L]; })();
  const inX = W - s;                 // stem inner edge = aperture's right wall
  // Aperture is a parallel slot, not a lens: a straight run of inner edge with a rounded
  // corner at each end. The old single tangency point pinched it shut as the stroke thinned.
  const slot = underY - bowlTop;
  // The arm does not turn a corner into the stem, it pours into it: the aperture's top turn
  // is a large sweep taken off the slot's own height, so the inside answers the outer
  // shoulder instead of reading as a right angle with a small fillet on it.
  const cr = Math.min(0.62 * slot, 0.45 * (inX - tx - capR));
  // the aperture's floor is one continuous arch from the bowl's left shoulder up into the
  // stem — a flat run across the top of the bowl is what made the light weights read squared
  const cr2 = Math.min(0.30 * s + 26, 0.45 * slot);
  // Counter = the bowl inset by its own walls. It is a TRUE ELLIPSE (four points, circle
  // constant on every quarter) so it can never read squared — a circle at Black, opening
  // toward the lower left as the stroke thins, exactly as the artwork does.
  // The side walls ease off the stroke as the weight drops, which keeps the counter close
  // to round instead of letting the fixed outer width stretch it wide.
  const cl = s + 0.10 * lean, crF = W - 0.87 * s - 0.18 * lean;
  // a touch of lift on the bottom wall at the light end keeps the bowl from pinching
  // where the counter passes the tuck
  const cb = bot + 0.62 * s * k + 0.06 * lean, ct = bowlTop - 0.54 * s * k;
  const cmx = (cl + crF) / 2, cmy = (cb + ct) / 2;

  return contour([
    { p: [tx + capR, top - rise], t: TOPT },
    { p: [shX, top], t: THr },
    { p: [W, top - shR], t: TVd },
    { p: [W, tipY + tipR], t: TVd },
    { p: [W - tipR, tipY], t: THl },
    { p: [286, 6], t: TUCK, k0: 0.34 },
    { p: [0.42 * W, bot], t: THl },
    { p: [0, 150], t: TV },
    { p: [ltx, bowlTop], t: THr },
    { p: [inX, bowlTop + cr2], t: TV },
    { p: [inX, underY - cr], t: TV },
    { p: [inX - cr, underY], t: THl },
    { p: [tx + capR, underY], t: THl },
    { p: [tx, underY + capR], t: TV }])
    + contour([
    { p: [cl, cmy], t: TVd }, { p: [cmx, cb], t: THr },
    { p: [crF, cmy], t: TV }, { p: [cmx, ct], t: THl }]);
}
function buildExcl(s) {
  const asc = 751, w = s / 2, cx = w + 4, yB = 205, r = 0.53 * s;
  const x0 = cx - w, rb = 0.30 * s, fr2 = 0.28 * s;
  // same cut top and rounded-square sole as the h, lifted to the bar's baseline
  const sole = foot(x0, s).map(p => ({ ...p, p: [p.p[0], p.p[1] + yB] }));
  return contour([
    { p: [x0 + s, asc - fr2], t: TVd }, ...sole, ...cutTop(x0, s, asc)])
    + contour([{ p: [cx - r, r], t: TV }, { p: [cx, 2 * r], t: THr },
               { p: [cx + r, r], t: TVd }, { p: [cx, 0], t: THl }]);
}

// ── Derived from the h ────────────────────────────────────────────────────────
// Everything below reuses the h's three parts: cutTop for the terminal, foot for the
// sole, arch for the shoulder. No new proportions are invented — only where those
// parts are placed.

// n: the h with the ascender taken off. The stem's cut terminal now sits on the
// x-height and the shoulder springs straight off it.
function buildN(s) {
  const xh = 521, ov = 7, W = 379, k = contrastK(s);
  const A = arch(0, s, W, k, xh, ov);
  return contour([
    { p: [A.oaX, A.oaY], t: THr, k1: 0.45 },
    { p: [W, A.oaY - (W - A.oaX)], t: TVd },
    ...foot(W - s, s),
    { p: [W - s, A.spring], t: TV },
    { p: [A.iaX, A.iaY], t: THl },
    { p: [s, A.spring], t: TVd },
    ...foot(0, s),
    ...cutTop(0, s, xh).map((p, i) => i === 2 ? { ...p, k0: 0.30 } : p)]);
}

// b: the h's ascender and shoulder, with the shoulder's joint mirrored at the
// baseline to close the bowl. Counter is an ellipse, like the a's.
function buildB(s) {
  const asc = 751, xh = 521, ov = 7, W = 379, k = contrastK(s), fr2 = 0.28 * s;
  const top = xh + ov, bot = -ov, th = 0.72 * s * k;
  const rB = Math.min(0.48 * (W - s), 0.44 * (top - bot));
  const jf = 0.34 * s, rb = 0.30 * s;
  const cl = s, cr = W - s, cb = bot + th, ct = top - th;
  const rc = Math.min((cr - cl) / 2, (ct - cb) / 2);
  return contour([
    { p: [s, asc - fr2], t: TVd },
    { p: [s, top + 1.05 * jf], t: TVd },
    // the flick: the bowl leaves the stem on a small ledge before it settles onto its own
    // top edge, which is the droplet the artwork hangs on every joint
    { p: [s + jf, top + 0.16 * s], t: THr },
    { p: [s + 2.1 * jf, top], t: THr },
    { p: [W - rB, top], t: THr },
    { p: [W, top - rB], t: TVd },
    { p: [W, bot + rB], t: TVd },
    { p: [W - rB, bot], t: THl },
    { p: [s + jf, bot], t: THl },
    { p: [s, bot + jf], t: THl },
    { p: [s - jf, bot], t: THl },
    { p: [rb, bot], t: THl },
    { p: [0, bot + rb], t: TV },
    ...cutTop(0, s, asc)])
    + contour([
      { p: [cl, cb + rc], t: TVd }, { p: [cl + rc, cb], t: THr },
      { p: [cr - rc, cb], t: THr }, { p: [cr, cb + rc], t: TV },
      { p: [cr, ct - rc], t: TV }, { p: [cr - rc, ct], t: THl },
      { p: [cl + rc, ct], t: THl }, { p: [cl, ct - rc], t: TVd }]);
}
function buildD(s) { return flipPath(buildB(s), 379, null); }

// u: the n's bowl, righted. Symmetric rather than a flipped n — the shoulder's spur
// only makes sense hanging off a stem, not holding one up — so both stems take the
// cut terminal and the bowl is a true half-round.
function buildU(s) {
  const xh = 521, ov = 7, W = 379, k = contrastK(s), fr2 = 0.28 * s;
  const cx = W / 2, ro = -ov + cx, ib = -ov + 0.72 * s * k, ri = ib + (cx - s);
  return contour([
    ...cutTop(0, s, xh),
    { p: [s, xh - fr2], t: TVd }, { p: [s, ri], t: TVd },
    { p: [cx, ib], t: THr },
    { p: [W - s, ri], t: TV },
    ...cutTop(W - s, s, xh),
    { p: [W, xh - fr2], t: TVd }, { p: [W, ro], t: TVd },
    { p: [cx, -ov], t: THl }, { p: [0, ro], t: TV }]);
}

// m: two of the n's arches on a compressed width, meeting in a valley the same depth
// as the n's own shoulder joint.
function buildM(s) {
  const xh = 521, ov = 7, Wa = 330, k = contrastK(s), oaY = xh + ov;
  const x1 = Wa - s, Wm = 2 * Wa - s;
  const A1 = arch(0, s, Wa, k, xh, ov), A2 = arch(x1, s, Wa, k, xh, ov);
  return contour([
    { p: [A1.oaX, oaY], t: THr, k1: 0.45 },
    { p: [(x1 + s + A2.armX) / 2, A1.armY], t: THr, k0: 0.5, k1: 0.5 },
    { p: [A2.oaX, oaY], t: THr, k1: 0.45 },
    { p: [Wm, oaY - (Wm - A2.oaX)], t: TVd },
    ...foot(Wm - s, s),
    { p: [Wm - s, A2.spring], t: TV },
    { p: [A2.iaX, A2.iaY], t: THl },
    { p: [x1 + s, A2.spring], t: TVd },
    ...foot(x1, s),
    { p: [x1, A1.spring], t: TV },
    { p: [A1.iaX, A1.iaY], t: THl },
    { p: [s, A1.spring], t: TVd },
    ...foot(0, s),
    ...cutTop(0, s, xh).map((p, i) => i === 2 ? { ...p, k0: 0.30 } : p)]);
}

// w: the m turned over — two of the u's bowls on the m's width, meeting under a
// middle stem. Three cut terminals across the top, no feet.
function buildW(s) {
  const xh = 521, ov = 7, Wu = 330, k = contrastK(s), fr2 = 0.28 * s;
  const Wm = 2 * Wu - s, c1 = Wu / 2, c2 = Wm - Wu / 2, xp = Wu - s / 2;
  // The two bowls are circles of one radius, and the middle stem stands where they would
  // cross: the peak is that crossing height, so the junction carries the bowls' own weight.
  // Landing them on the stem's edges instead made the wall taper to nothing as it rose.
  // Each bowl is the u's bowl, whole: same radius, same counter. They overlap under the
  // middle stem and the letter's vertex is exactly where the two circles cross, so the wall
  // keeps the u's thickness right through the junction instead of tapering into it.
  const R = Wu / 2, ro = -ov + R, ib = -ov + 0.72 * s * k, ri = ib + (R - s);
  const dxj = (Wu - s) / 2, hy = Math.sqrt(R * R - dxj * dxj), yj = ro - hy;
  const TJa = [-hy / R, -dxj / R], TJb = [-hy / R, dxj / R], kj = 0.39;
  return contour([
    ...cutTop(0, s, xh),
    { p: [s, xh - fr2], t: TVd }, { p: [s, ri], t: TVd },
    { p: [c1, ib], t: THr },
    { p: [Wu - s, ri], t: TV },
    ...cutTop(Wu - s, s, xh),
    { p: [Wu, xh - fr2], t: TVd }, { p: [Wu, ri], t: TVd },
    { p: [c2, ib], t: THr },
    { p: [Wm - s, ri], t: TV },
    ...cutTop(Wm - s, s, xh),
    { p: [Wm, xh - fr2], t: TVd }, { p: [Wm, ro], t: TVd },
    { p: [c2, -ov], t: THl, k0: kj },
    { p: [xp, yj], t: TJa, tin: TJb, k0: kj, k1: kj },
    { p: [c1, -ov], t: THl, k1: kj }, { p: [0, ro], t: TV }]);
}

// ── Three more parts ──────────────────────────────────────────────────────────
// cutBot is cutTop turned over: the same 0.34 slope, so a stroke that ends pointing DOWN
// (the r's arm) is cut on the family angle rather than rounded off.
function cutBot(x0, s, base) {
  const fr = 0.34 * s, fr2 = 0.28 * s, hi = base + SLANT * s, nSL = [-SL[0], -SL[1]];
  return [
    { p: [x0 + s, hi + fr], t: TVd },
    { p: [x0 + s - fr * SL[0], hi - fr * SL[1]], t: nSL },
    { p: [x0 + fr2 * SL[0], base + fr2 * SL[1]], t: nSL }];
}
// A true circular fillet between two straight edges: trim each by r/tan(θ/2) and hand
// contour() the exact handle length. The generic solver assumes axis-aligned tangents, so
// on a diagonal join — the v's vertex, the s has none, the t's bar does — it would guess a
// quarter ellipse and put a visible flat on the inside of the turn.
function corner(V, d1, d2, r) {
  const dot = -(d1[0] * d2[0] + d1[1] * d2[1]);
  const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
  const L = r / Math.tan(ang / 2), h = (4 / 3) * Math.tan((Math.PI - ang) / 4) * r;
  return [
    { p: [V[0] - d1[0] * L, V[1] - d1[1] * L], t: d1, hx: h },
    { p: [V[0] + d2[0] * L, V[1] + d2[1] * L], t: d2, tin: d2, hn: h }];
}
function isect(p, d, q, e) {
  const rx = q[0] - p[0], ry = q[1] - p[1], det = -d[0] * e[1] + e[0] * d[1];
  const a = (-rx * e[1] + e[0] * ry) / det;
  return [p[0] + d[0] * a, p[1] + d[1] * a];
}
const nrm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

// The s is the one letter with no straight edge and no extremum to hang a corner on, so it
// is drawn as a CENTRELINE with a width rule rather than as an outline. Width follows the
// normal: s where the stroke stands up, thin where it lies down — the same contrast law the
// rest of the family gets from contrastK, applied continuously instead of at four points.
function strokePath(nodes, wFn) {
  const B = (p0,p1,p2,p3,t) => { const u=1-t; return [u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0], u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]]; };
  const D = (p0,p1,p2,p3,t) => { const u=1-t; return [3*u*u*(p1[0]-p0[0])+6*u*t*(p2[0]-p1[0])+3*t*t*(p3[0]-p2[0]), 3*u*u*(p1[1]-p0[1])+6*u*t*(p2[1]-p1[1])+3*t*t*(p3[1]-p2[1])]; };
  const S = [], N = 22, segs = nodes.length - 1;
  for (let i = 0; i < segs; i++) {
    const a = nodes[i], b = nodes[i + 1];
    const ch = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1]);
    const h0 = (a.h0 ?? 0.40) * ch, h1 = (b.h1 ?? 0.40) * ch;
    const p1 = [a.p[0] + a.t[0] * h0, a.p[1] + a.t[1] * h0];
    const p2 = [b.p[0] - b.t[0] * h1, b.p[1] - b.t[1] * h1];
    for (let j = i ? 1 : 0; j <= N; j++) {
      const t = j / N;
      S.push({ p: B(a.p, p1, p2, b.p, t), d: D(a.p, p1, p2, b.p, t), u: (i + t) / segs });
    }
  }
  const L = [], R = [];
  S.forEach(sm => {
    const l = Math.hypot(sm.d[0], sm.d[1]) || 1, n = [-sm.d[1] / l, sm.d[0] / l];
    const w = wFn(sm.u, n) / 2;
    L.push([sm.p[0] + n[0] * w, sm.p[1] + n[1] * w]);
    R.push([sm.p[0] - n[0] * w, sm.p[1] - n[1] * w]);
  });
  // the ends are cut square, with both corners softened on the family's 0.34 — the same
  // corner every cut terminal in the set carries
  const K = 4;   // samples that give way to the corner at each end — the same number at every weight
  const cap = (pe, u, n, h, back) => {
    const r = Math.min(0.68 * h, 0.9 * back, 0.9 * h), pts = [];   // 0.34 of the stroke: the family's corner
    const CL = [pe[0] + n[0] * h, pe[1] + n[1] * h], CR = [pe[0] - n[0] * h, pe[1] - n[1] * h];
    const c1 = [CL[0] - u[0] * r - n[0] * r, CL[1] - u[1] * r - n[1] * r], c2 = [CR[0] - u[0] * r + n[0] * r, CR[1] - u[1] * r + n[1] * r];
    for (let i = 0; i <= 4; i++) { const a = i / 4 * Math.PI / 2; pts.push([c1[0] + (n[0] * Math.cos(a) + u[0] * Math.sin(a)) * r, c1[1] + (n[1] * Math.cos(a) + u[1] * Math.sin(a)) * r]); }
    for (let i = 0; i <= 4; i++) { const a = i / 4 * Math.PI / 2; pts.push([c2[0] + (u[0] * Math.cos(a) - n[0] * Math.sin(a)) * r, c2[1] + (u[1] * Math.cos(a) - n[1] * Math.sin(a)) * r]); }
    return { pts, r };
  };
  const first = S[0], last = S[S.length - 1];
  const uE = (() => { const l = Math.hypot(last.d[0], last.d[1]) || 1; return [last.d[0] / l, last.d[1] / l]; })(), nE = [-uE[1], uE[0]];
  const uS = (() => { const l = Math.hypot(first.d[0], first.d[1]) || 1; return [-first.d[0] / l, -first.d[1] / l]; })(), nS = [-uS[1], uS[0]];
  const hE = Math.hypot(L[L.length - 1][0] - last.p[0], L[L.length - 1][1] - last.p[1]), hS = Math.hypot(L[0][0] - first.p[0], L[0][1] - first.p[1]);
  const along = (P, pe, u) => -((P[0] - pe[0]) * u[0] + (P[1] - pe[1]) * u[1]);
  const backE = Math.min(along(L[L.length - 1 - K], last.p, uE), along(R[R.length - 1 - K], last.p, uE));
  const backS = Math.min(along(L[K], first.p, uS), along(R[K], first.p, uS));
  const capE = cap(last.p, uE, nE, hE, backE), capS = cap(first.p, uS, nS, hS, backS);
  const Lk = L.slice(K, L.length - K), Rk = R.slice(K, R.length - K);
  const ring = [...Lk, ...capE.pts, ...Rk.slice().reverse(), ...capS.pts];
  const f = v => Math.round(v * 10) / 10;
  let d = `M${f(ring[0][0])} ${f(ring[0][1])}`;
  for (let i = 1; i < ring.length; i++) d += `L${f(ring[i][0])} ${f(ring[i][1])}`;
  return d + 'Z';
}

// The ring, from your artwork: NOT an ellipse. The outer walls run dead straight for the
// middle 36% of the height and the caps are elliptical quarters onto them; the counter is a
// rounded rectangle — straight sides, straight top and bottom, one radius on all four
// corners. That pairing is what makes it read as water held in a shape rather than a circle.
function buildRing(W, bot, top, s, th, thT) {
  const cx = W / 2, cy = (top + bot) / 2, hs = 0.18 * (top - bot);
  const xl = s, xr = W - s, yb = bot + th, yt = top - (thT ?? th);
  const cr = Math.min(0.40 * (xr - xl), 0.34 * (yt - yb));
  return contour([
    { p: [0, cy + hs], t: TVd }, { p: [0, cy - hs], t: TVd }, { p: [cx, bot], t: THr },
    { p: [W, cy - hs], t: TV }, { p: [W, cy + hs], t: TV }, { p: [cx, top], t: THl }])
    + contour([
    { p: [xl, yb + cr], t: TVd }, { p: [xl + cr, yb], t: THr }, { p: [xr - cr, yb], t: THr },
    { p: [xr, yb + cr], t: TV }, { p: [xr, yt - cr], t: TV }, { p: [xr - cr, yt], t: THl },
    { p: [xl + cr, yt], t: THl }, { p: [xl, yt - cr], t: TVd }]);
}
function buildO(s) { return buildRing(379, -7, 528, s, 0.72 * s * contrastK(s)); }
function buildZero(s) { return buildRing(330, -7, 700, s, 0.72 * s * contrastK(s)); }

// 1: the stem, with a flag cut off the top-left corner. The flag runs on its own 0.71 slope
// — steeper than the family's 0.34 terminal cut, which it meets at the stem's top-left — and
// ends on a vertical cut, because a slanted cut on a stroke already this steep reads as a rip.
function buildOne(s) {
  const fig = 700, k = contrastK(s), th = 0.72 * s * k, thF = 0.86 * th;
  const x0 = 118, W = x0 + s + 46, fr2 = 0.28 * s;
  const d = nrm([-0.815, -0.579]), dU = [-d[0], -d[1]], sl = 0.579 / 0.815;
  const yTL = fig - SLANT * s, drop = thF / 0.815;
  const Tt = [0, yTL - sl * x0], Tb = [0, Tt[1] - drop];
  const J1 = [x0, Tb[1] + sl * x0];
  return contour([
    { p: [x0 + s, fig - fr2], t: TVd },
    ...foot(x0, s),
    ...corner(J1, TV, d, 0.26 * s),
    ...corner(Tb, d, TV, 0.32 * thF),
    ...corner(Tt, TV, dU, 0.32 * thF),
    ...corner([x0, yTL], dU, SL, 0.30 * s),
    { p: [x0 + s - fr2 * SL[0], fig - fr2 * SL[1]], t: SL }]);
}

// e: the o with a bar laid across the middle and the ring cut open below it. The bar's top
// edge is the counter's floor; its underside is the aperture's ceiling and belongs to the
// outer contour, which is why the e is one loop and one counter rather than two counters.
function buildE(s) {
  const xh = 521, ov = 7, W = 379, k = contrastK(s);
  const top = xh + ov, bot = -ov, cx = W / 2, cy = (top + bot) / 2;
  const hs = 0.18 * (top - bot), th = 0.72 * s * k;
  const xl = s, xr = W - s, yb = bot + th, yt = top - th;
  const barT = cy + 46, barB = barT - th, fr = 0.20 * s, nSL = [-SL[0], -SL[1]];
  // the counter's top corners are radiused off its WIDTH, not its height. Off the height
  // they went square at the light end and drove into the cap, leaving a wall of ten units
  // where the shoulder should be thickest.
  const cr = Math.min(0.42 * (xr - xl), 0.85 * (yt - barT));
  const cr2 = Math.min(0.42 * (xr - xl), 0.85 * (barB - yb));
  const crR = Math.max(0.10 * s, Math.min(cr2, (cy - hs - SLANT * s - yb) - 0.28 * s));
  // the terminal lands exactly where the outer wall stops running straight, so the cap arc
  // ends on it and the cut is the family's 0.34 with nothing else to reconcile
  return contour([
    ...corner([W, barB], THr, TV, fr),
    { p: [W, cy + hs], t: TV }, { p: [cx, top], t: THl },
    { p: [0, cy + hs], t: TVd }, { p: [0, cy - hs], t: TVd }, { p: [cx, bot], t: THr },
    ...corner([W, cy - hs], TV, nSL, 0.26 * s),
    ...corner([xr, cy - hs - SLANT * s], nSL, TVd, 0.26 * s),
    { p: [xr, yb + crR], t: TVd }, { p: [xr - crR, yb], t: THl },
    { p: [xl + cr2, yb], t: THl }, { p: [xl, yb + cr2], t: TV },
    { p: [xl, barB - fr], t: TV }, { p: [xl + fr, barB], t: THr }])
    + contour([
      { p: [xl, barT + fr], t: TV }, { p: [xl, yt - cr], t: TV }, { p: [xl + cr, yt], t: THr },
      { p: [xr - cr, yt], t: THr }, { p: [xr, yt - cr], t: TVd }, { p: [xr, barT + fr], t: TVd },
      { p: [xr - fr, barT], t: THl }, { p: [xl + fr, barT], t: THl }]);
}

// s: two bowls of one radius joined by a spine, drawn as a single centreline. The bowls'
// outer edges are pinned to 0 and to W at every weight, so the silhouette holds while the
// ink erodes inward — the same rule the a follows.
function buildS(s) {
  const top = 528, bot = -7, k = contrastK(s), th = 0.72 * s * k;
  const cxU = 168, yU = 385, cxL = 172, yL = 120;
  const a = 168 - s / 2, bU = 143 - th / 2, bL = 127 - th / 2;
  const E = (cx, cy, ra, rb, deg) => { const t = deg * Math.PI / 180; return { p: [cx + ra * Math.cos(t), cy + rb * Math.sin(t)], d: [-ra * Math.sin(t), rb * Math.cos(t)] }; };
  const up = d => nrm(d), dn = d => nrm([-d[0], -d[1]]);
  const n1 = E(cxU, yU, a, bU, -16), n2 = E(cxU, yU, a, bU, 90), n3 = E(cxU, yU, a, bU, 180), n4 = E(cxU, yU, a, bU, 228);
  const n6 = E(cxL, yL, a, bL, 44), n7 = E(cxL, yL, a, bL, 0), n8 = E(cxL, yL, a, bL, -90), n9 = E(cxL, yL, a, bL, -195);
  const nodes = [
    { p: n1.p, t: up(n1.d) }, { p: n2.p, t: up(n2.d) }, { p: n3.p, t: up(n3.d) }, { p: n4.p, t: up(n4.d) },
    { p: [(n4.p[0] + n6.p[0]) / 2, (n4.p[1] + n6.p[1]) / 2], t: nrm([n6.p[0] - n4.p[0], n6.p[1] - n4.p[1]]) },
    { p: n6.p, t: dn(n6.d) }, { p: n7.p, t: dn(n7.d) }, { p: n8.p, t: dn(n8.d) }, { p: n9.p, t: dn(n9.d) }];
  return strokePath(nodes, (u, n) => {
    const taper = 0.74 + 0.26 * Math.min(1, Math.min(u, 1 - u) / 0.13);
    return (th + (s - th) * Math.abs(n[0])) * taper;
  });
}

// r: the n's shoulder, stopped. The arm ends in a cutBot terminal, so the r's only new
// decision is where to stop it — 0.72 of a stem below the shoulder's own joint.
function buildR(s) {
  const xh = 521, ov = 7, W = 300, k = contrastK(s);
  const A = arch(0, s, W, k, xh, ov), base = A.spring - 0.72 * s;
  return contour([
    { p: [A.oaX, A.oaY], t: THr, k1: 0.45 },
    { p: [W, A.oaY - (W - A.oaX)], t: TVd },
    ...cutBot(W - s, s, base),
    { p: [W - s, base + 0.28 * s], t: TV },
    { p: [W - s, A.spring], t: TV },
    { p: [A.iaX, A.iaY], t: THl },
    { p: [s, A.spring], t: TVd },
    ...foot(0, s),
    ...cutTop(0, s, xh).map((p, i) => i === 2 ? { ...p, k0: 0.30 } : p)]);
}

// t: the stem with a bar. Every junction is filleted rather than mitred — the inside of the
// cross is where a rounded family gives itself away if it uses a corner.
function buildT(s) {
  const xh = 521, k = contrastK(s), th = 0.72 * s * k, ascT = 646;
  const x0 = 62, W = 158 + s, barT = xh, barB = xh - th;
  const fr3 = 0.22 * s, rb2 = 0.32 * th, fr2 = 0.28 * s;
  // your skeleton turns the t's foot out to the right instead of sitting it flat; the tail
  // is one quarter in, one quarter out, and a vertical cut across the thin stroke
  const xT = W - 22, rr = 0.30 * th;
  const Ri = xT - rr - (x0 + s), Ro = xT - rr - x0;
  const tail = [
    { p: [x0 + s, th + 0.85 * Ri], t: TVd },
    { p: [xT - rr, th], t: THr },
    { p: [xT, th - rr], t: TVd }, { p: [xT, rr], t: TVd },
    { p: [xT - rr, 0], t: THl },
    { p: [x0, 0.85 * Ro], t: TV }];
  return contour([
    ...cutTop(x0, s, ascT),
    { p: [x0 + s, ascT - fr2], t: TVd },
    { p: [x0 + s, barT + fr3], t: TVd },
    { p: [x0 + s + fr3, barT], t: THr },
    { p: [W - rb2, barT], t: THr },
    { p: [W, barT - rb2], t: TVd },
    { p: [W, barB + rb2], t: TVd },
    { p: [W - rb2, barB], t: THl },
    { p: [x0 + s + fr3, barB], t: THl },
    { p: [x0 + s, barB - fr3], t: TVd },
    ...tail,
    { p: [x0, barB - fr3], t: TV },
    { p: [x0 - fr3, barB], t: THl },
    { p: [rb2, barB], t: THl },
    { p: [0, barB + rb2], t: TV },
    { p: [0, barT - rb2], t: TV },
    { p: [rb2, barT], t: THr },
    { p: [x0 - fr3, barT], t: THr },
    { p: [x0, barT + fr3], t: TV }]);
}

// f: the t's bar under a hook. The hook's terminal is cut square to the stroke instead of on
// the family slant — the stroke is horizontal there, so a 0.34 cut would read as a droop.
function buildF(s) {
  const asc = 751, xh = 521, k = contrastK(s), th = 0.72 * s * k;
  const x0 = 62, Ro = 150 + 0.24 * s, W = Math.max(158 + s, x0 + Ro + 9);
  const barT = xh, barB = xh - th, fr3 = 0.22 * s, rb2 = 0.32 * th, rb3 = 0.30 * th;
  return contour([
    { p: [x0, asc - Ro], t: TV },
    { p: [x0 + Ro - rb3, asc], t: THr },
    { p: [x0 + Ro, asc - rb3], t: TVd },
    { p: [x0 + Ro, asc - th + rb3], t: TVd },
    { p: [x0 + Ro - rb3, asc - th], t: THl },
    { p: [x0 + s, asc - Ro + 26], t: TVd },
    { p: [x0 + s, barT + fr3], t: TVd },
    { p: [x0 + s + fr3, barT], t: THr },
    { p: [W - rb2, barT], t: THr },
    { p: [W, barT - rb2], t: TVd },
    { p: [W, barB + rb2], t: TVd },
    { p: [W - rb2, barB], t: THl },
    { p: [x0 + s + fr3, barB], t: THl },
    { p: [x0 + s, barB - fr3], t: TVd },
    ...foot(x0, s),
    { p: [x0, barB - fr3], t: TV },
    { p: [x0 - fr3, barB], t: THl },
    { p: [rb2, barB], t: THl },
    { p: [0, barB + rb2], t: TV },
    { p: [0, barT - rb2], t: TV },
    { p: [rb2, barT], t: THr },
    { p: [x0 - fr3, barT], t: THr },
    { p: [x0, barT + fr3], t: TV }]);
}

// i: the exclam's stem at x-height, with the same dot.
function buildI(s) {
  const xh = 521, r = 0.53 * s, cy = xh + 66 + r, fr2 = 0.28 * s;
  return contour([{ p: [s, xh - fr2], t: TVd }, ...foot(0, s), ...cutTop(0, s, xh)])
    + contour([{ p: [s / 2 - r, cy], t: TV }, { p: [s / 2, cy + r], t: THr },
               { p: [s / 2 + r, cy], t: TVd }, { p: [s / 2, cy - r], t: THl }]);
}

// l: constructed against the logotype's own l (the source logotype's vector, path 10; artwork no longer in the repo).
// A straight stem of width s with the family foot and the family shoulder — but the top is
// not a chisel cut. Measured off the artwork: the cut rises from the left shoulder, CRESTS
// at ~0.72 s across, then rounds down to the right corner ~0.20 s below the crest. A drop
// settling, not a plane. The crest is an explicit horizontal-tangent point so the extreme
// sits on-curve, and every landmark is a function of s so the shape survives the axis.
function buildL(s) {
  const asc = 751, ascL = asc - SLANT * s;
  // shoulder radius 0.22 s (the family's 0.34 s cut-shoulder is for a plane; a dome wants
  // the left edge to climb almost to the top and turn over short and full)
  const frL = 0.22 * s, crestX = 0.72 * s, dropR = 0.18 * s;
  return contour([
    { p: [s, asc - dropR], t: TVd },                        // top-right corner, softened
    ...foot(0, s),
    { p: [0, ascL - frL], t: TV },                           // left edge, up to the shoulder
    { p: [frL * SL[0], ascL + frL * SL[1]], t: SL },         // shoulder onto the family slant
    { p: [crestX, asc], t: THr, k0: 0.50 },                  // the crest
  ]);
}

// v: the only letter in the set built from straight edges. Four cut terminals' worth of
// geometry reduces to two: both tops take the family's 0.34 cut, and both vertices are true
// circular fillets. The apex is dropped by the fillet's own set-back so the rounded point
// still lands on the baseline overshoot rather than floating above it.
function buildV(s) {
  const xh = 521, k = contrastK(s), W = 340;
  const wL = s, wR = s * (0.52 + 0.28 * k);
  const rOut = 0.20 * s, rIn = 0.30 * s, rT = 0.24 * s;
  const Vo = [0.46 * W, -7 - 2.6 * rOut];
  const dLo = nrm([Vo[0], Vo[1] - xh]), dRo = nrm([W - Vo[0], xh - Vo[1]]);
  const dLu = [-dLo[0], -dLo[1]], dRd = [-dRo[0], -dRo[1]];
  const B = [wL, xh], D = [W, xh];
  const A = isect([0, xh], dLo, B, SL);
  const C = isect([W - wR, xh], dRd, D, SL);
  const Vi = isect(B, dLo, [W - wR, xh], dRd);
  return contour([
    ...corner(A, dLu, SL, rT),
    ...corner(B, SL, dLo, rT),
    ...corner(Vi, dLo, dRo, rIn),
    ...corner(C, dRo, SL, rT),
    ...corner(D, SL, dRd, rT),
    ...corner(Vo, dRd, dLu, rOut)]);
}

// ── From your skeleton ────────────────────────────────────────────────────────
const DESC = -230;
// A p is a b turned over and a q is that turned again — same points, same order, same
// count, so nothing new has to hold across the axis.
function flipPath(d, kx, ky) {
  const tk = d.match(/[MCLZ]|-?[\d.]+/g);
  let out = '', i = 0;
  const X = v => kx == null ? +v : kx - +v, Y = v => ky == null ? +v : ky - +v;
  while (i < tk.length) {
    if (tk[i] === 'M') { out += `M${fx(X(tk[i+1]))} ${fx(Y(tk[i+2]))}`; i += 3; }
    else if (tk[i] === 'L') { out += `L${fx(X(tk[i+1]))} ${fx(Y(tk[i+2]))}`; i += 3; }
    else if (tk[i] === 'C') {
      out += `C${fx(X(tk[i+1]))} ${fx(Y(tk[i+2]))} ${fx(X(tk[i+3]))} ${fx(Y(tk[i+4]))} ${fx(X(tk[i+5]))} ${fx(Y(tk[i+6]))}`;
      i += 7;
    } else { out += 'Z'; i++; }
  }
  return out;
}

// ── Round trip ────────────────────────────────────────────────────────────────
// Every glyph goes out as a plain path on a font grid — y already flipped into SVG's
// downward axis so no transform is attached and nothing is baked when it comes back.
// Cell origin is the baseline at the left sidebearing: x = X − ox, y = oy − Y.
const GNAME = { '!':'exclam', '.':'period', ',':'comma', '0':'zero', '1':'one', '2':'two',
                '3':'three', '4':'four', '5':'five', '6':'six', '7':'seven', '8':'eight',
                '9':'nine', B:'B.cap' };
function mapPath(d, ox, oy) {
  const tk = d.match(/[MCLZ]|-?[\d.]+/g);
  let out = '', i = 0;
  const X = v => fx(ox + +v), Y = v => fx(oy - +v);
  while (i < tk.length) {
    if (tk[i] === 'M') { out += `M${X(tk[i+1])} ${Y(tk[i+2])}`; i += 3; }
    else if (tk[i] === 'L') { out += `L${X(tk[i+1])} ${Y(tk[i+2])}`; i += 3; }
    else if (tk[i] === 'C') { out += `C${X(tk[i+1])} ${Y(tk[i+2])} ${X(tk[i+3])} ${Y(tk[i+4])} ${X(tk[i+5])} ${Y(tk[i+6])}`; i += 7; }
    else { out += 'Z'; i++; }
  }
  return out;
}
function exportSVG(stem) {
  const cols = 6, cw = 1150, chh = 1300, chars = allChars();
  const rows = Math.ceil(chars.length / cols);
  let glyphs = '', guides = '';
  chars.forEach((ch, i) => {
    const c = i % cols, r = (i / cols) | 0;
    const ox = c * cw + 90, oy = r * chh + 1000;
    const g = glyph(ch, stem), dd = g.d, w = g.w, minX = g.minX, lsb = g.lsb, rsb = g.rsb;
    const name = GNAME[ch] || ch;
    glyphs += `  <path id="glyph.${name}"${g.fill === 'nonzero' ? ' fill-rule="nonzero"' : ''} d="${mapPath(dd, ox - minX, oy)}"/>\n`;
    const L = ox - lsb, R = ox + w + rsb;
    guides +=
      `  <g opacity="0.5"><rect x="${fx(L)}" y="${fx(oy - 751)}" width="${fx(R - L)}" height="981" fill="none" stroke="#c8c8c8"/>` +
      `<path d="M${fx(L - 30)} ${fx(oy)}H${fx(R + 30)}M${fx(L - 30)} ${fx(oy - 521)}H${fx(R + 30)}M${fx(L - 30)} ${fx(oy + 230)}H${fx(R + 30)}" stroke="#e0a08c" fill="none"/>` +
      `<text x="${fx(L)}" y="${fx(oy + 300)}" font-family="monospace" font-size="46" fill="#b0aca2">${name}</text></g>\n`;
  });
  const W = cols * cw + 120, H = rows * chh + 200;
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n` +
    `<!-- Aqua · stem ${Math.round(stem)}u · upm 1000 · x-height 521 · ascender 751 · descender -230\n` +
    `     One path per glyph, id="glyph.<name>". Coordinates are already in SVG axis (y down);\n` +
    `     the baseline of each cell sits on the middle pink rule. Edit the outlines freely, but:\n` +
    `     keep the ids, keep each glyph inside its own cell, and flatten/expand any transform\n` +
    `     before saving so the path data is absolute. Delete nothing from #guides - it is ignored. -->\n` +
    `<rect width="${W}" height="${H}" fill="#ffffff"/>\n<g id="guides" stroke-width="2">\n${guides}</g>\n` +
    `<g id="outlines" fill="#111111" fill-rule="evenodd">\n${glyphs}</g>\n</svg>\n`;
}
function buildP(s) { return flipPath(buildB(s), null, 521); }
function buildQ(s) { return flipPath(buildP(s), 379, null); }

// c: the ring opened across the whole straight run of its right wall. Both terminals take
// the family's 0.34 cut — the wall is vertical where they land, so nothing is reconciled.
function buildC(s) {
  const xh = 521, ov = 7, W = 379, k = contrastK(s);
  const top = xh + ov, bot = -ov, cx = W / 2, cy = (top + bot) / 2;
  const hs = 0.18 * (top - bot), th = 0.72 * s * k, nSL = [-SL[0], -SL[1]];
  const xl = s, xr = W - s, yb = bot + th, yt = top - th, rt = 0.26 * s;
  const yTi = cy - hs - SLANT * s, yTo = cy + hs - SLANT * s;
  const crT = Math.min(0.42 * (xr - xl), 0.85 * (yt - yb));
  const crB = Math.max(0.10 * s, Math.min(crT, (yTi - yb) - 0.28 * s));
  return contour([
    ...corner([W, cy + hs], SL, TV, rt),
    { p: [cx, top], t: THl }, { p: [0, cy + hs], t: TVd },
    { p: [0, cy - hs], t: TVd }, { p: [cx, bot], t: THr },
    ...corner([W, cy - hs], TV, nSL, rt),
    ...corner([xr, yTi], nSL, TVd, rt),
    { p: [xr, yb + crB], t: TVd }, { p: [xr - crB, yb], t: THl },
    { p: [xl + crB, yb], t: THl }, { p: [xl, yb + crB], t: TV },
    { p: [xl, yt - crT], t: TV }, { p: [xl + crT, yt], t: THr },
    { p: [xr - crT, yt], t: THr }, { p: [xr, yt - crT], t: TVd },
    ...corner([xr, yTo], TVd, SL, rt)]);
}

// k: the stem, plus an arm and a leg that are pure straight strokes. Both terminals are cut
// vertically — a 0.34 cut on a stroke already climbing at 45° reads as a slip — and the
// crotch is a circular fillet solved from the two edge directions, not a guessed quarter.
function buildK(s) {
  const asc = 751, xh = 521, W = 350, fr2 = 0.28 * s;
  const vA = 1.02 * s, vL = 1.10 * s, aTop = 0.52 * xh, lBot = 0.44 * xh;
  const dA = nrm([W - s, xh - aTop]), dL = nrm([W - s, -lBot]);
  const nA = [-dA[0], -dA[1]], nL = [-dL[0], -dL[1]];
  const crotch = isect([s, aTop - vA], dA, [s, lBot + vL], dL);
  const r1 = 0.22 * s, r2 = 0.20 * s;
  return contour([
    { p: [s, asc - fr2], t: TVd },
    ...corner([s, aTop], TVd, dA, r1),
    ...corner([W, xh], dA, TVd, r2),
    ...corner([W, xh - vA], TVd, nA, r2),
    ...corner(crotch, nA, dL, r1),
    ...corner([W, vL], dL, TVd, r2),
    ...corner([W, 0], TVd, nL, r2),
    ...corner([s, lBot], nL, TVd, r1),
    ...foot(0, s),
    ...cutTop(0, s, asc)]);
}

// x: two straight strokes and four crotches, every one of them found by intersecting the
// edge lines rather than placed by hand, so the junctions hold as the strokes thicken.
function buildX(s) {
  const xh = 521, W = 340, w = 0.92 * s, r = 0.22 * s;
  const dA = nrm([W - w, -xh]), dB = [-dA[0], dA[1]];
  const nA = [-dA[0], -dA[1]], nB = [-dB[0], -dB[1]];
  const A2 = [w, xh], B2 = [W - w, xh], A1 = [0, xh], B1 = [W, xh];
  return contour([
    ...corner([0, xh], nA, THr, r), ...corner(A2, THr, dA, r),
    ...corner(isect(A2, dA, B2, dB), dA, nB, r),
    ...corner(B2, nB, THr, r), ...corner(B1, THr, dB, r),
    ...corner(isect(A2, dA, B1, dB), dB, dA, r),
    ...corner([W, 0], dA, THl, r), ...corner([W - w, 0], THl, nA, r),
    ...corner(isect(A1, dA, B1, dB), nA, dB, r),
    ...corner([w, 0], dB, THl, r), ...corner([0, 0], THl, nB, r),
    ...corner(isect(A1, dA, B2, dB), nB, nA, r)]);
}

// y: the u, with its right stem carried through the baseline into a tail. The bowl's outer
// underside runs into the tail's own left edge, so the two are one curve and the junction
// never has to be drawn.
function buildY(s) {
  const xh = 521, ov = 7, W = 379, k = contrastK(s), fr2 = 0.28 * s;
  const th = 0.72 * s * k, desc = DESC;
  const ibY = -ov + th, cxi = W / 2, cxb = 0.44 * W;
  const riL = ibY + (cxi - s), riR = ibY + (W - s - cxi);
  const yJ = -ov - 0.55 * s, ro = -ov + cxb;
  const Rt = 175, rr = 0.30 * th, xT = 0.42 * W;
  return contour([
    { p: [s, xh - fr2], t: TVd }, { p: [s, riL], t: TVd },
    { p: [cxi, ibY], t: THr }, { p: [W - s, riR], t: TV },
    ...cutTop(W - s, s, xh),
    { p: [W, xh - fr2], t: TVd }, { p: [W, desc + Rt], t: TVd },
    { p: [xT + rr, desc], t: THl },
    { p: [xT, desc + rr], t: TV }, { p: [xT, desc + th - rr], t: TV },
    { p: [xT + rr, desc + th], t: THr },
    { p: [W - s, desc + 0.80 * Rt], t: TV }, { p: [W - s, yJ], t: TV },
    { p: [cxb, -ov], t: THl }, { p: [0, ro], t: TV },
    ...cutTop(0, s, xh)]);
}

// j: the i's stem and dot, carried down into the same tail the y uses.
function buildJ(s) {
  const xh = 521, k = contrastK(s), th = 0.72 * s * k, desc = DESC;
  const x0 = 96, fr2 = 0.28 * s, r = 0.53 * s, cy = xh + 66 + r;
  const Rt = 190, rr = 0.30 * th;
  return contour([
    { p: [x0 + s, xh - fr2], t: TVd }, { p: [x0 + s, desc + Rt], t: TVd },
    { p: [rr, desc], t: THl },
    { p: [0, desc + rr], t: TV }, { p: [0, desc + th - rr], t: TV },
    { p: [rr, desc + th], t: THr },
    { p: [x0, desc + 0.78 * Rt], t: TV },
    ...cutTop(x0, s, xh)])
    + contour([{ p: [x0 + s / 2 - r, cy], t: TV }, { p: [x0 + s / 2, cy + r], t: THr },
               { p: [x0 + s / 2 + r, cy], t: TVd }, { p: [x0 + s / 2, cy - r], t: THl }]);
}

// z: two bars and a diagonal. The bar ends are rounded on the horizontal stroke's own
// thickness; the two diagonal joints are fillets solved from the diagonal's real angle.
function buildZ(s) {
  const xh = 521, k = contrastK(s), th = 0.72 * s * k, W = 340;
  const hz = 1.06 * s, r = 0.30 * th, rc = 0.24 * s;
  const d = nrm([-(W - hz), -(xh - 2 * th)]), dU = [-d[0], -d[1]];
  return contour([
    ...corner([0, xh], TV, THr, r), ...corner([W, xh], THr, TVd, r),
    ...corner([W, xh - th], TVd, d, rc), ...corner([hz, th], d, THr, rc),
    ...corner([W, th], THr, TVd, r), ...corner([W, 0], TVd, THl, r),
    ...corner([0, 0], THl, TV, r), ...corner([0, th], TV, dU, rc),
    ...corner([W - hz, xh - th], dU, THl, rc), ...corner([0, xh - th], THl, TV, rc)]);
}

// ── Punctuation: water, not dots ──────────────────────────────────────────────
// The full stop is a droplet rather than a disc — the mass sits low and right and the crown
// pulls left, which is what a drop does when it lands. The comma is the same drop with the
// tail it leaves behind.
function buildPeriod(s) {
  const r = 0.56 * s, cx = r, cy = r;
  return contour([
    { p: [cx - r, cy + 0.10 * r], t: TV },
    { p: [cx - 0.24 * r, cy + 1.32 * r], t: THr, k0: 0.62, k1: 0.52 },
    { p: [cx + r, cy], t: TVd },
    { p: [cx, cy - r], t: THl }]);
}
function buildComma(s) {
  const r = 0.56 * s, cx = r, cy = 1.16 * r;
  return contour([
    { p: [cx - r, cy + 0.08 * r], t: TV },
    { p: [cx - 0.22 * r, cy + 1.28 * r], t: THr, k0: 0.62, k1: 0.52 },
    { p: [cx + r, cy], t: TVd },
    { p: [cx - 0.12 * r, cy - 2.5 * r], tin: nrm([-0.5, -1]), t: nrm([-0.14, 1]) }]);
}

// ── Capital B ─────────────────────────────────────────────────────────────────
// Two rounded-rectangle counters on one stem, the lower one wider, with the waist pinched
// rather than mitred — the outer wall runs in and back out across the bar in one curve.
// Constructed against the logotype's B (the source logotype's vector, path 0; artwork no longer in the repo). Measured at
// s = 106: ink width 453, cap 715, stem 129 (a capital carries ~1.2 s), bar 72 thick centred
// at 0.515 cap, upper bowl out to 427 and lower to the full 453, waist pinched to 312,
// counters 189×236 over 213×249, top-left corner ~0.2 s and bottom-left ~0.47 s.
// Widths are fixed to the artwork; every stroke thickness is a function of s and contrast.
function buildCapB(s) {
  const cap = 715, bot = 0, W = 453, k = contrastK(s);
  const bs = 1.20 * s;                                   // the B's stem
  const th = 0.68 * s * k;                               // the bar (horizontal: takes contrast)
  const tTop = 0.75 * s * k, tBot = 0.77 * s * k;        // top and bottom walls
  const yM = 0.515 * cap, yBT = yM + th / 2, yBB = yM - th / 2;
  const W1 = 0.943 * W, Wn = 0.69 * W;                   // upper bowl reach, waist
  const wr1 = 1.02 * s, wr2 = 1.04 * s;                  // right walls, upper / lower
  const rcT = 0.20 * s, rcB = 0.47 * s;                  // outer stem corners, top / bottom
  const r1 = Math.min(0.45 * (W1 - bs), 0.45 * (cap - yBT));
  const r3 = Math.min(0.45 * (W - bs), 0.45 * (yBB - bot));
  const cu = [bs, W1 - wr1, yBT, cap - tTop], cd = [bs, W - wr2, bot + tBot, yBB];
  const box = ([xl, xr, yb, yt]) => {
    const r = Math.min(0.38 * (xr - xl), 0.38 * (yt - yb));
    return contour([
      { p: [xl, yb + r], t: TVd }, { p: [xl + r, yb], t: THr },
      { p: [xr - r, yb], t: THr }, { p: [xr, yb + r], t: TV },
      { p: [xr, yt - r], t: TV }, { p: [xr - r, yt], t: THl },
      { p: [xl + r, yt], t: THl }, { p: [xl, yt - r], t: TVd }]);
  };
  return contour([
    { p: [0, cap - rcT], t: TV }, { p: [rcT, cap], t: THr },
    { p: [W1 - r1, cap], t: THr }, { p: [W1, cap - r1], t: TVd },
    { p: [W1, yBT + 0.62 * r1], t: TVd },
    { p: [Wn, yM], t: TVd },                               // the waist, one smooth S in and out
    { p: [W, yBB - 0.62 * r3], t: TVd },
    { p: [W, bot + r3], t: TVd }, { p: [W - r3, bot], t: THl },
    { p: [rcB, bot], t: THl }, { p: [0, bot + rcB], t: TV }])
    + box(cu) + box(cd);
}

// ── Figures ───────────────────────────────────────────────────────────────────
const FIG = 700;
function figW(s, th) {
  return (u, n) => (th + (s - th) * Math.abs(n[0])) * (0.80 + 0.20 * Math.min(1, Math.min(u, 1 - u) / 0.09));
}
function ell(cx, cy, a, b) {
  return deg => {
    const t = deg * Math.PI / 180;
    return { p: [cx + a * Math.cos(t), cy + b * Math.sin(t)],
             cw: nrm([a * Math.sin(t), -b * Math.cos(t)]),
             ccw: nrm([-a * Math.sin(t), b * Math.cos(t)]) };
  };
}
function build2(s) {
  const W = 330, k = contrastK(s), th = 0.72 * s * k, cx = W / 2;
  const a = cx - s / 2, yT = FIG - 195, b = FIG - th / 2 - yT, E = ell(cx, yT, a, b);
  const p1 = E(198), p2 = E(90), p3 = E(-8), by = th / 2, xL = s / 2 + 6, xR = W - s / 2;
  return strokePath([
    { p: p1.p, t: p1.cw }, { p: p2.p, t: p2.cw }, { p: p3.p, t: p3.cw },
    { p: [cx + 4, 0.40 * FIG], t: nrm([-0.62, -1]) },
    { p: [xL + 40, by], t: THr, h1: 0.30 },
    { p: [xR, by], t: THr }], figW(s, th));
}
function build3(s) {
  const W = 330, k = contrastK(s), th = 0.72 * s * k, cx = W / 2;
  const yU = FIG - 178, yL = 178, a = cx - s / 2 - 6;
  const EU = ell(cx, yU, a, FIG - th / 2 - yU), EL = ell(cx, yL, a, yL - th / 2);
  const u1 = EU(192), u2 = EU(90), u3 = EU(-34), l1 = EL(34), l2 = EL(-90), l3 = EL(188);
  return strokePath([
    { p: u1.p, t: u1.cw }, { p: u2.p, t: u2.cw }, { p: u3.p, t: u3.cw },
    { p: [cx - 14, 0.50 * FIG], t: TVd, h0: 0.34, h1: 0.34 },
    { p: l1.p, t: l1.cw }, { p: l2.p, t: l2.cw }, { p: l3.p, t: l3.cw }], figW(s, th));
}
function build4(s) {
  const W = 360, k = contrastK(s), th = 0.72 * s * k;
  const xs = 0.60 * W, yb = 0.25 * FIG, dW = 0.82 * s;
  const fr3 = 0.22 * s, rb = 0.30 * th, r = 0.22 * s;
  const dO = nrm([xs, FIG - (yb + th)]), dN = [-dO[0], -dO[1]];
  const yStar = yb + th + ((xs - dW) / xs) * (FIG - yb - th);
  return contour([
    ...corner([xs + s, FIG], THr, TVd, rb),
    { p: [xs + s, yb + th + fr3], t: TVd },
    { p: [xs + s + fr3, yb + th], t: THr },
    { p: [W - rb, yb + th], t: THr },
    { p: [W, yb + th - rb], t: TVd },
    { p: [W, yb + rb], t: TVd },
    { p: [W - rb, yb], t: THl },
    { p: [xs + s + fr3, yb], t: THl },
    { p: [xs + s, yb - fr3], t: TVd },
    ...foot(xs, s),
    { p: [xs, yb - fr3], t: TV },
    { p: [xs - fr3, yb], t: THl },
    { p: [rb, yb], t: THl },
    { p: [0, yb + rb], t: TV },
    ...corner([0, yb + th], TV, dO, r),
    ...corner([xs, FIG], dO, THr, rb)])
    + contour([
      ...corner([dW, yb + th], dN, THr, r),
      ...corner([xs, yb + th], THr, TV, r),
      ...corner([xs, yStar], TV, dN, r)]);
}
function build5(s) {
  const W = 330, k = contrastK(s), th = 0.72 * s * k, cx = W / 2;
  const xL = s / 2 + 8, xR = W - s / 2, topY = FIG - th / 2, yB = 186;
  const E = ell(cx - 4, yB, cx - s / 2 - 4, yB - th / 2);
  const b1 = E(24), b2 = E(-90), b3 = E(190);
  return strokePath([
    { p: [xR, topY], t: THl },
    { p: [xL, topY], t: THl, h0: 0.20, h1: 0.14 },
    { p: [xL + 6, 0.54 * FIG], t: TVd, h0: 0.30 },
    { p: [cx - 26, yB + (yB - th / 2)], t: THr },
    { p: b1.p, t: b1.cw }, { p: b2.p, t: b2.cw }, { p: b3.p, t: b3.cw }], figW(s, th));
}
// 6: the ring with its top-left corner drawn up into a stem. One outer contour, one
// counter — the stem grows out of the bowl instead of being laid over it, so nothing
// overlaps and nothing has to be unioned.
function build6(s) {
  const W = 330, k = contrastK(s), th = 0.72 * s * k, bot = -7;
  const bT = 0.62 * FIG, xl = s, xr = W - s, yb = bot + th, yt = bT - th;
  const cr = Math.min(0.42 * (xr - xl), 0.85 * (yt - yb));
  const c2 = Math.min(0.42 * W, 0.42 * (bT - bot));
  const xT = 0.92 * W, fr2 = 0.28 * s;
  return contour([
    ...cutTop(xT - s, s, FIG),
    { p: [xT, FIG - fr2], t: TVd },
    { p: [0.62 * W, bT + 0.34 * (FIG - bT)], t: nrm([-0.5, -0.87]) },
    ...corner([0.46 * W, bT], nrm([-0.5, -0.87]), THr, 0.26 * s),
    { p: [W - c2, bT], t: THr },
    { p: [W, bT - c2], t: TVd }, { p: [W, bot + c2], t: TVd },
    { p: [W - c2, bot], t: THl }, { p: [c2, bot], t: THl },
    { p: [0, bot + c2], t: TV }, { p: [0, 0.40 * FIG], t: TV }])
    + contour([
      { p: [xl, yb + cr], t: TVd }, { p: [xl + cr, yb], t: THr },
      { p: [xr - cr, yb], t: THr }, { p: [xr, yb + cr], t: TV },
      { p: [xr, yt - cr], t: TV }, { p: [xr - cr, yt], t: THl },
      { p: [xl + cr, yt], t: THl }, { p: [xl, yt - cr], t: TVd }]);
}
function build9(s) { return flipPath(build6(s), 330, 693); }
function build7(s) {
  const W = 330, k = contrastK(s), th = 0.72 * s * k;
  const rb = 0.30 * th, xb = 0.30 * W, wd = 1.02 * s;
  const dD = nrm([xb + wd - W, -FIG]), dU = [-dD[0], -dD[1]];
  const lTop = isect([xb, 0], dU, [0, FIG - th], THr);
  return contour([
    { p: [0, FIG - rb], t: TV }, { p: [rb, FIG], t: THr },
    { p: [W - rb, FIG], t: THr }, { p: [W, FIG - rb], t: TVd },
    ...corner([xb + wd, 0], dD, THl, 0.26 * s),
    ...corner([xb, 0], THl, dU, 0.26 * s),
    ...corner(lTop, dU, THl, 0.26 * s),
    { p: [rb, FIG - th], t: THl },
    { p: [0, FIG - th - rb], t: TVd }]);
}
// 8: one silhouette with a pinched waist rather than two rings stacked — stacking them
// makes the waist twice as heavy and leaves a seam where the two outlines meet.
function build8(s) {
  const W = 330, k = contrastK(s), th = 0.72 * s * k, bot = -7, cx = W / 2;
  const au = 0.365 * W, al = 0.44 * W, an = 0.255 * W;
  const yU = FIG - 0.235 * FIG, yM = 0.48 * FIG, yL = 0.185 * FIG;
  const box = (xl, xr, yb, yt) => {
    const r = Math.min(0.46 * (xr - xl), 0.46 * (yt - yb));
    return contour([
      { p: [xl, yb + r], t: TVd }, { p: [xl + r, yb], t: THr },
      { p: [xr - r, yb], t: THr }, { p: [xr, yb + r], t: TV },
      { p: [xr, yt - r], t: TV }, { p: [xr - r, yt], t: THl },
      { p: [xl + r, yt], t: THl }, { p: [xl, yt - r], t: TVd }]);
  };
  return contour([
    { p: [cx, FIG], t: THr },
    { p: [cx + au, yU], t: TVd }, { p: [cx + an, yM], t: TVd }, { p: [cx + al, yL], t: TVd },
    { p: [cx, bot], t: THl },
    { p: [cx - al, yL], t: TV }, { p: [cx - an, yM], t: TV }, { p: [cx - au, yU], t: TV }])
    + box(cx - au + s, cx + au - s, yM + th / 2, FIG - th)
    + box(cx - al + s, cx + al - s, bot + th, yM - th / 2);
}

// ── Spacing ───────────────────────────────────────────────────────────────────
// Sidebearings are set by what the edge DOES, not by the letter: a flat edge takes the full
// bearing, a round one 0.80 of it, an open or diagonal one 0.62. That alone fixes most of
// the colour; the kern table below only handles pairs where the two shapes lean apart.
const SHAPE = { h:'ff', a:'rf', n:'ff', b:'fr', u:'ff', m:'ff', w:'oo', o:'rr', e:'rr',
                s:'rr', v:'oo', r:'fo', t:'ff', f:'ff', i:'ff', g:'rr', '!':'ff',
                '0':'rr', '1':'of', c:'ro', j:'of', k:'fo', p:'fr', q:'rf', d:'rf',
                l:'ff', x:'oo', y:'oo', z:'ff', B:'ff', '.':'oo', ',':'oo',
                '2':'rf', '3':'rr', '4':'or', '5':'fr', '6':'rr', '7':'or', '8':'rr', '9':'rr' };
// The three classes were spread too far apart: flat|flat opened to 94u while open|open
// closed to 59u, so the same word held two different rhythms. Narrowed to 64–85u at the
// same average colour, which lets the kern table shrink correspondingly (see kS).
const SBK = { f: 0.90, r: 0.82, o: 0.68 };
const KERN = {
  ma:-24, na:-18, ua:-16, ha:-14, ba:-10, oa:-10, ea:-12, ra:-26, va:-30, wa:-30, ta:-14, ga:-10, sa:-10,
  av:-24, aw:-24, an:-4, ab:-4,
  ro:-18, rs:-14, rt:-20, rv:-30, rg:-14, rn:-8, ru:-8, re:-16, rm:-8, rf:-14,
  fo:-14, fi:-8, ft:-20, fs:-10, fe:-12, fa:-14, fu:-8,
  ov:-16, ow:-16, of:-10, os:-8, on:-4,
  to:-12, ts:-8, te:-10, tv:-14, tw:-14,
  si:-6, se:-6, so:-6, st:-6, iv:-12, ib:-4,
  ge:-8, be:-10, ee:-6, eo:-4, ef:-6, es:-6, nt:-6, ur:-6, mb:-4, br:-6, bu:-4, hu:-2, um:-2, we:-14, wo:-14,
  ya:-30, yo:-16, ye:-16, ys:-12, xa:-10, xe:-8, za:-14, ze:-8, ka:-16, ke:-14, ko:-12, ky:-20,
  ca:-4, ce:-4, ck:-6, co:-4, ct:-8, pa:-8, pe:-6, po:-4, py:-16, qu:-6, jo:-6, ju:-6,
  ax:-8, ay:-20, ey:-14, oy:-14, ny:-14, my:-14, ty:-14, ry:-24, iy:-8, uy:-8, gy:-10, by:-14,
  ap:-6, aq:-6, oc:-4, ec:-4, sc:-6, tc:-6,
  // pairs the shape classes can't see: a diagonal or a stem set deep inside its own advance
  vc:-16, vo:-14, ve:-14, vs:-10, et:-14, st:-14, gl:-12, gt:-10, da:-14, de:-8, do:-8,
  tz:-16, az:-10, oz:-10, ez:-10, ol:-10, al:-10, ul:-8, il:-6,
  oj:-8, aj:-8, ej:-8, uj:-6, ja:-6
};
function glyphWidth(ch, s) {
  if (ch === 'f') return Math.max(158 + s, 62 + (150 + 0.24 * s) + 9);
  const W = { h:379, a:370, n:379, b:379, u:379, m:2*330-s, w:2*330-s, o:379, e:379,
              s:340, v:340, r:300, t:158+s, i:s, '0':330, '1':164+s,
              l:s, c:379, j:100+s, k:380, p:379, q:379, d:379, x:340, y:379, z:340,
              B:400, '.':1.12*s, ',':1.12*s,
              '2':330, '3':330, '4':360, '5':330, '6':330, '7':330, '8':330, '9':330 };
  if (W[ch] != null) return W[ch];
  if (EXT_BASE[ch]) return glyphWidth(EXT_BASE[ch], s);
  return EXT_W[ch];
}
const BUILD = { h: buildH, a: buildA, n: buildN, b: buildB, u: buildU, m: buildM, w: buildW,
                o: buildO, e: buildE, s: buildS, v: buildV, r: buildR, t: buildT, f: buildF,
                i: buildI, l: buildL, '!': buildExcl, '0': buildZero, '1': buildOne,
                c: buildC, j: buildJ, k: buildK, p: buildP, q: buildQ, d: buildD,
                x: buildX, y: buildY, z: buildZ, B: buildCapB,
                '.': buildPeriod, ',': buildComma,
                '2': build2, '3': build3, '4': build4, '5': build5,
                '6': build6, '7': build7, '8': build8, '9': build9 };

// ── The construction, extended ────────────────────────────────────────────────
// Capitals, punctuation, signs, accents and the composed letters, built from the parts the
// thirty already use: stems with the family's corners, bars on the bar's own radius,
// diagonals joined with true circular fillets, rings and bowls on the ring's rule, curved
// strokes drawn as centrelines under the contrast law. A new glyph therefore carries the
// family's weight, contrast and terminals at every stem width, and interpolates by
// construction. It is a start for Fabio to edit, drawn the way the set is drawn.
//
// The capital's rules come from the B, the one capital in the artwork: a capital stem is
// 1.20 s, a bar 0.68 s·k, a bowl's walls 1.03 s and its top and bottom 0.76 s·k. Tops are
// cornered at 0.20 s and feet at 0.30 s (the family foot), the inside of a junction at
// 0.22 s (the t's rule), a bar end on 0.30 of its own thickness (the z's rule).
const CAP = 715, CAPOV = 722;
const capStem = s => 1.20 * s, capBar = s => 0.68 * s * contrastK(s);
const capWall = s => 1.03 * s, capTop = s => 0.76 * s * contrastK(s);
const CAPR = s => ({ t: 0.20 * s, f: 0.30 * s, j: 0.22 * s });
// a closed polygon with a circular fillet at every vertex (r: one radius, or one per vertex;
// 0 = sharp). Radii are clamped to what the two edges at a vertex can carry.
function poly(V, r) {
  const n = V.length, pts = [];
  for (let i = 0; i < n; i++) {
    const a = V[(i - 1 + n) % n], b = V[i], c = V[(i + 1) % n];
    const d1 = nrm([b[0] - a[0], b[1] - a[1]]), d2 = nrm([c[0] - b[0], c[1] - b[1]]);
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const cross = d1[0] * d2[1] - d1[1] * d2[0];
    if (Math.abs(cross) < 1e-6) { pts.push({ p: b, t: d2, tin: d1 }); continue; }
    const dot = -(d1[0] * d2[0] + d1[1] * d2[1]), ang = Math.acos(Math.max(-1, Math.min(1, dot)));
    let ri = Array.isArray(r) ? r[i] : r;
    ri = Math.min(ri, 0.48 * l1 * Math.tan(ang / 2), 0.48 * l2 * Math.tan(ang / 2));
    if (ri < 0.5) { pts.push({ p: b, t: d2, tin: d1 }); continue; }
    pts.push(...corner(b, d1, d2, ri));
  }
  return contour(pts);
}
const rrect = (x0, y0, x1, y1, r) => poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], r);
// a straight stroke from a to b, w wide, with its ends rounded on r
function bar(a, b, w, r) {
  const d = nrm([b[0] - a[0], b[1] - a[1]]), n = [-d[1] * w / 2, d[0] * w / 2];
  return poly([[a[0] + n[0], a[1] + n[1]], [a[0] - n[0], a[1] - n[1]], [b[0] - n[0], b[1] - n[1]], [b[0] + n[0], b[1] + n[1]]], r);
}
// lines as [point, direction]; a line moved w to its left; where two lines cross
const line = (p, d) => [p, d];
const offL = (L, w) => [[L[0][0] - L[1][1] * w, L[0][1] + L[1][0] * w], L[1]];
const X = (A, B) => isect(A[0], A[1], B[0], B[1]);
const hline = y => [[0, y], THr], vline = x => [[x, 0], TV];
// a rounded box — every counter of a capital bowl is one (the B's rule)
function box(xl, xr, yb, yt, r) {
  const rc = Math.min(r, 0.49 * (xr - xl), 0.49 * (yt - yb));
  return contour([
    { p: [xl, yb + rc], t: TVd }, { p: [xl + rc, yb], t: THr },
    { p: [xr - rc, yb], t: THr }, { p: [xr, yb + rc], t: TV },
    { p: [xr, yt - rc], t: TV }, { p: [xr - rc, yt], t: THl },
    { p: [xl + rc, yt], t: THl }, { p: [xl, yt - rc], t: TVd }]);
}
const boxR = (xl, xr, yb, yt) => Math.min(0.38 * (xr - xl), 0.38 * (yt - yb));
// move or scale a path
function scalePath(d, k) { const tk = d.match(/[MCLZ]|-?[\d.]+/g); return tk.map(t => /^[MCLZ]$/.test(t) ? (t === 'M' ? '\nM' : t === 'Z' ? 'Z' : t) : fx(+t * k)).join(' ').replace(/\n/g, '').replace(/([MCLZ]) /g, '$1').replace(/ Z/g, 'Z').trim(); }
function shiftPath(d, dx, dy) {
  const tk = d.match(/[MCLZ]|-?[\d.]+/g); let out = '', i = 0;
  while (i < tk.length) {
    const t = tk[i];
    if (t === 'M' || t === 'L') { out += `${t}${fx(+tk[i + 1] + dx)} ${fx(+tk[i + 2] + dy)}`; i += 3; }
    else if (t === 'C') { out += `C${fx(+tk[i + 1] + dx)} ${fx(+tk[i + 2] + dy)} ${fx(+tk[i + 3] + dx)} ${fx(+tk[i + 4] + dy)} ${fx(+tk[i + 5] + dx)} ${fx(+tk[i + 6] + dy)}`; i += 7; }
    else { out += 'Z'; i++; }
  }
  return out;
}

// ── capitals: the straight ones, as polygons ──
function buildCapI(s) { const r = CAPR(s); return poly([[0, 0], [capStem(s), 0], [capStem(s), CAP], [0, CAP]], [r.f, r.f, r.t, r.t]); }
function buildCapL(s) { const bs = capStem(s), th = capBar(s), W = 400, r = CAPR(s), rb = 0.30 * th;
  return poly([[0, 0], [W, 0], [W, th], [bs, th], [bs, CAP], [0, CAP]], [r.f, rb, rb, r.j, r.t, r.t]); }
function buildCapE(s) { const bs = capStem(s), th = capBar(s), W = 410, Wm = 372, r = CAPR(s), rb = 0.30 * th, yB = 0.515 * CAP - th / 2;
  return poly([[0, 0], [W, 0], [W, th], [bs, th], [bs, yB], [Wm, yB], [Wm, yB + th], [bs, yB + th], [bs, CAP - th], [W, CAP - th], [W, CAP], [0, CAP]],
              [r.f, rb, rb, r.j, r.j, rb, rb, r.j, r.j, rb, rb, r.t]); }
function buildCapF(s) { const bs = capStem(s), th = capBar(s), W = 400, Wm = 362, r = CAPR(s), rb = 0.30 * th, yB = 0.515 * CAP - th / 2;
  return poly([[0, 0], [bs, 0], [bs, yB], [Wm, yB], [Wm, yB + th], [bs, yB + th], [bs, CAP - th], [W, CAP - th], [W, CAP], [0, CAP]],
              [r.f, r.f, r.j, rb, rb, r.j, r.j, rb, rb, r.t]); }
function buildCapH(s) { const bs = capStem(s), th = capBar(s), W = 480, r = CAPR(s), yB = 0.515 * CAP - th / 2;
  return poly([[0, 0], [bs, 0], [bs, yB], [W - bs, yB], [W - bs, 0], [W, 0], [W, CAP], [W - bs, CAP], [W - bs, yB + th], [bs, yB + th], [bs, CAP], [0, CAP]],
              [r.f, r.f, r.j, r.j, r.f, r.f, r.t, r.t, r.j, r.j, r.t, r.t]); }
function buildCapT(s) { const bs = capStem(s), th = capBar(s), W = 440, cx = W / 2, r = CAPR(s), rb = 0.30 * th;
  return poly([[cx - bs / 2, 0], [cx + bs / 2, 0], [cx + bs / 2, CAP - th], [W, CAP - th], [W, CAP], [0, CAP], [0, CAP - th], [cx - bs / 2, CAP - th]],
              [r.f, r.f, r.j, rb, rb, rb, rb, r.j]); }

// ── capitals: the diagonal ones. Outer edges are placed, inner edges are the outer ones
// moved in by the stroke, and every junction is where two edges cross. ──
function buildCapA(s) {
  const W = 520, th = capBar(s), dw = 1.08 * s, r = CAPR(s), cx = W / 2, apex = 0.62 * capStem(s);
  const oL = line([0, 0], nrm([cx - apex, CAP])), oR = line([W, 0], nrm([-(W - cx - apex), CAP]));
  const iL = offL(oL, -dw), iR = offL(oR, dw);
  const yB = 0.24 * CAP, base = hline(0), b0 = hline(yB), b1 = hline(yB + th), top = hline(CAP);
  return poly([[0, 0], X(iL, base), X(iL, b0), X(iR, b0), X(iR, base), [W, 0], X(oR, top), X(oL, top)], [r.f, r.j, r.j, r.j, r.j, r.f, r.t, r.t])
       + poly([X(iL, b1), X(iR, b1), X(iL, iR)], r.j);
}
function buildCapV(s) {
  const W = 500, k = contrastK(s), dwL = 1.08 * s, dwR = s * (0.62 + 0.30 * k), r = CAPR(s), Vo = [0.5 * W, -7];
  const oL = line([0, CAP], nrm([Vo[0], Vo[1] - CAP])), oR = line([W, CAP], nrm([Vo[0] - W, Vo[1] - CAP]));
  const iL = offL(oL, dwL), iR = offL(oR, -dwR), top = hline(CAP);
  return poly([X(oL, top), Vo, X(oR, top), X(iR, top), X(iL, iR), X(iL, top)], [r.t, r.f, r.t, r.t, r.j, r.t]);
}
function buildCapW(s) {
  const W = 720, k = contrastK(s), dw = 1.0 * s, dwT = s * (0.62 + 0.30 * k), r = CAPR(s);
  const V1 = [0.27 * W, -7], V2 = [0.73 * W, -7], M = [0.5 * W, 0.94 * CAP];
  // e1 and e4 are the outer edges of the outside strokes, e2 and e3 the outer edges of the
  // middle pair (they meet at the peak M); every inner edge is its outer edge moved in
  const e1 = line([0, CAP], nrm([V1[0], V1[1] - CAP])), e2 = line(V1, nrm([M[0] - V1[0], M[1] - V1[1]]));
  const e3 = line(M, nrm([V2[0] - M[0], V2[1] - M[1]])), e4 = line(V2, nrm([W - V2[0], CAP - V2[1]]));
  const R1 = offL(e1, dw), L2 = offL(e2, dwT), R3 = offL(e3, dw), L4 = offL(e4, dwT), top = hline(CAP);
  return poly([[0, CAP], V1, M, V2, [W, CAP], X(L4, top), X(L4, R3), X(R3, top), X(L2, top), X(L2, R1), X(R1, top)],
              [r.t, r.f, r.j, r.f, r.t, r.t, r.j, r.t, r.t, r.j, r.t]);
}
function buildCapX(s) {
  const W = 470, k = contrastK(s), dwA = 1.06 * s, dwB = s * (0.66 + 0.30 * k), r = CAPR(s);
  // A rises to the right, B to the left; A2 and B2 are their second edges, moved in by the stroke
  const A = line([0, 0], nrm([W - 1.1 * dwA, CAP])), B = line([W, 0], nrm([-(W - 1.1 * dwB), CAP]));
  const A2 = offL(A, -dwA), B2 = offL(B, dwB), base = hline(0), top = hline(CAP);
  return poly([X(A, base), X(A2, base), X(A2, B2), X(B2, base), X(B, base), X(B, A2), X(A2, top), X(A, top), X(A, B), X(B, top), X(B2, top), X(B2, A)],
              [r.f, r.f, r.j, r.f, r.f, r.j, r.t, r.t, r.j, r.t, r.t, r.j]);
}
function buildCapY(s) {
  const W = 470, k = contrastK(s), bs = capStem(s), dwL = 1.04 * s, dwR = s * (0.66 + 0.30 * k), r = CAPR(s), cx = W / 2, yJ = 0.44 * CAP;
  const oL = line([0, CAP], nrm([cx - bs / 2, yJ - CAP])), oR = line([W, CAP], nrm([cx + bs / 2 - W, yJ - CAP]));
  const iL = offL(oL, dwL), iR = offL(oR, -dwR), top = hline(CAP), sL = vline(cx - bs / 2), sR = vline(cx + bs / 2);
  return poly([[cx - bs / 2, 0], [cx + bs / 2, 0], X(sR, oR), X(oR, top), X(iR, top), X(iL, iR), X(iL, top), X(oL, top), X(sL, oL)],
              [r.f, r.f, r.j, r.t, r.t, r.j, r.t, r.t, r.j]);
}
function buildCapZ(s) {
  const W = 440, th = capBar(s), dw = 1.02 * s, r = CAPR(s), rb = 0.30 * th;
  const D = line([W, CAP - th], nrm([-(W - dw), -(CAP - 2 * th)])), D2 = offL(D, -dw);
  const b0 = hline(0), b1 = hline(th), t0 = hline(CAP - th), t1 = hline(CAP);
  return poly([[0, 0], [W, 0], [W, th], X(D, b1), [W, CAP - th], [W, CAP], [0, CAP], [0, CAP - th], X(D2, t0), [0, th]],
              [rb, rb, rb, r.j, rb, rb, rb, rb, r.j, rb]);
}
function buildCapN(s) {
  const W = 490, bs = capStem(s), dwv = 1.30 * s, r = CAPR(s);
  const D = line([bs, CAP], nrm([W - 2 * bs, -(CAP - dwv)])), D2 = offL(D, -dwv * (W - 2 * bs) / Math.hypot(W - 2 * bs, CAP - dwv));
  const L1 = vline(bs), L2 = vline(W - bs), top = hline(CAP), base = hline(0);
  return poly([[0, 0], [bs, 0], X(L1, D2), X(D2, base), [W, 0], [W, CAP], [W - bs, CAP], X(L2, D), [bs, CAP], [0, CAP]],
              [r.f, r.f, r.j, r.j, r.f, r.t, r.t, r.j, r.t, r.t]);
}
function buildCapM(s) {
  const W = 590, bs = capStem(s), dwv = 1.24 * s, r = CAPR(s), cx = W / 2, Vo = [cx, 0.10 * CAP];
  const oL = line([bs, CAP - dwv], nrm([Vo[0] - bs, Vo[1] - CAP + dwv])), oR = line([W - bs, CAP - dwv], nrm([Vo[0] - W + bs, Vo[1] - CAP + dwv]));
  const uL = line([bs, CAP], oL[1]), uR = line([W - bs, CAP], oR[1]);
  return poly([[0, 0], [bs, 0], [bs, CAP - dwv], Vo, [W - bs, CAP - dwv], [W - bs, 0], [W, 0], [W, CAP], [W - bs, CAP], X(uL, uR), [bs, CAP], [0, CAP]],
              [r.f, r.f, r.j, r.f, r.j, r.f, r.f, r.t, r.t, r.j, r.t, r.t]);
}
function buildCapK(s) {
  const W = 470, bs = capStem(s), r = CAPR(s), vA = 1.12 * s, vL = 1.22 * s, aTop = 0.53 * CAP, lBot = 0.42 * CAP;
  const dA = nrm([W - bs, CAP - aTop]), dL = nrm([W - bs, -lBot]), nA = [-dA[0], -dA[1]], nL = [-dL[0], -dL[1]];
  const crotch = isect([bs, aTop - vA], dA, [bs, lBot + vL], dL);
  return contour([
    { p: [bs, CAP - r.t], t: TVd },
    ...corner([bs, aTop], TVd, dA, r.j), ...corner([W, CAP], dA, TVd, r.t), ...corner([W, CAP - vA], TVd, nA, r.t),
    ...corner(crotch, nA, dL, r.j), ...corner([W, vL], dL, TVd, r.f), ...corner([W, 0], TVd, nL, r.f),
    ...corner([bs, lBot], nL, TVd, r.j), ...corner([bs, 0], TVd, THl, r.f), ...corner([0, 0], THl, TV, r.f),
    ...corner([0, CAP], TV, THr, r.t), { p: [bs - r.t, CAP], t: THr }]);
}

// ── capitals: the round ones, on the ring's and the bowl's rules ──
// the ring opened on the right with the family's cut terminals (the c's construction)
function ringOpen(W, bot, top, wall, th, s) {
  const cx = W / 2, cy = (top + bot) / 2, hs = 0.18 * (top - bot), nSL = [-SL[0], -SL[1]];
  const xl = wall, xr = W - wall, yb = bot + th, yt = top - th, rt = 0.26 * s;
  const yTi = cy - hs - SLANT * wall, yTo = cy + hs - SLANT * wall;
  const crT = Math.min(0.42 * (xr - xl), 0.85 * (yt - yb));
  const crB = Math.max(0.10 * s, Math.min(crT, (yTi - yb) - 0.28 * s));
  return contour([
    ...corner([W, cy + hs], SL, TV, rt),
    { p: [cx, top], t: THl }, { p: [0, cy + hs], t: TVd },
    { p: [0, cy - hs], t: TVd }, { p: [cx, bot], t: THr },
    ...corner([W, cy - hs], TV, nSL, rt),
    ...corner([xr, yTi], nSL, TVd, rt),
    { p: [xr, yb + crB], t: TVd }, { p: [xr - crB, yb], t: THl },
    { p: [xl + crB, yb], t: THl }, { p: [xl, yb + crB], t: TV },
    { p: [xl, yt - crT], t: TV }, { p: [xl + crT, yt], t: THr },
    { p: [xr - crT, yt], t: THr }, { p: [xr, yt - crT], t: TVd },
    ...corner([xr, yTo], TVd, SL, rt)]);
}
function buildCapC(s) { return ringOpen(470, -7, CAPOV, capWall(s), capTop(s), s); }
function buildCapO(s) { return buildRing(500, -7, CAPOV, capWall(s), capTop(s)); }
function buildCapQ(s) { return buildCapO(s) + bar([0.58 * 500, 0.16 * CAP], [0.88 * 500, -0.16 * CAP], 1.02 * s, 0.30 * s); }
function buildCapG(s) {
  const W = 500, wall = capWall(s), th = capTop(s), r = CAPR(s), bot = -7, top = CAPOV;
  const cx = W / 2, cy = (top + bot) / 2, hs = 0.18 * (top - bot), xl = wall, xr = W - wall, yb = bot + th, yt = top - th, rt = 0.26 * s;
  const crT = Math.min(0.42 * (xr - xl), 0.85 * (yt - yb)), crB = Math.min(crT, 0.85 * (0.44 * CAP - yb));
  const thB = capBar(s), yBT = 0.47 * CAP, yBB = yBT - thB, xBar = 0.52 * W, rb = 0.30 * thB, yTo = cy + hs - SLANT * wall;
  return contour([
    ...corner([W, cy + hs], SL, TV, rt),
    { p: [cx, top], t: THl }, { p: [0, cy + hs], t: TVd }, { p: [0, cy - hs], t: TVd }, { p: [cx, bot], t: THr },
    { p: [W, cy - hs], t: TV }, { p: [W, yBT - rb], t: TV }, { p: [W - rb, yBT], t: THl },
    { p: [xBar + rb, yBT], t: THl }, { p: [xBar, yBT - rb], t: TVd }, { p: [xBar, yBB + rb], t: TVd }, { p: [xBar + rb, yBB], t: THr },
    { p: [xr - r.j, yBB], t: THr }, { p: [xr, yBB - r.j], t: TVd },
    { p: [xr, yb + crB], t: TVd }, { p: [xr - crB, yb], t: THl },
    { p: [xl + crB, yb], t: THl }, { p: [xl, yb + crB], t: TV },
    { p: [xl, yt - crT], t: TV }, { p: [xl + crT, yt], t: THr },
    { p: [xr - crT, yt], t: THr }, { p: [xr, yt - crT], t: TVd },
    ...corner([xr, yTo], TVd, SL, rt)]);
}
function buildCapD(s) {
  const bs = capStem(s), W = 480, wall = capWall(s), tt = capTop(s), r = CAPR(s);
  const R = Math.min(0.48 * (W - bs), 0.42 * CAP);
  const cl = bs, cr = W - wall, cb = tt, ct = CAP - tt;
  return contour([
    { p: [0, CAP - r.t], t: TV }, { p: [r.t, CAP], t: THr }, { p: [W - R, CAP], t: THr }, { p: [W, CAP - R], t: TVd },
    { p: [W, R], t: TVd }, { p: [W - R, 0], t: THl }, { p: [r.f, 0], t: THl }, { p: [0, r.f], t: TV }])
    + box(cl, cr, cb, ct, Math.min(0.49 * (cr - cl), 0.42 * (ct - cb)));
}
function buildCapU(s) {
  const W = 470, bs = capStem(s), tt = capTop(s), r = CAPR(s), cx = W / 2, ro = -7 + cx, ib = -7 + tt, ri = ib + (cx - bs);
  return contour([
    { p: [0, CAP - r.t], t: TV }, { p: [r.t, CAP], t: THr }, { p: [bs - r.t, CAP], t: THr }, { p: [bs, CAP - r.t], t: TVd },
    { p: [bs, ri], t: TVd }, { p: [cx, ib], t: THr }, { p: [W - bs, ri], t: TV },
    { p: [W - bs, CAP - r.t], t: TV }, { p: [W - bs + r.t, CAP], t: THr }, { p: [W - r.t, CAP], t: THr }, { p: [W, CAP - r.t], t: TVd },
    { p: [W, ro], t: TVd }, { p: [cx, -7], t: THl }, { p: [0, ro], t: TV }]);
}
function buildCapJ(s) {
  const W = 320, bs = capStem(s), tt = capTop(s), r = CAPR(s), x0 = W - bs, bot = -7, Rt = 0.36 * CAP, rr = 0.30 * tt;
  return contour([
    { p: [W, CAP - r.t], t: TVd }, { p: [W, bot + Rt], t: TVd },
    { p: [rr, bot], t: THl }, { p: [0, bot + rr], t: TV }, { p: [0, bot + tt - rr], t: TV }, { p: [rr, bot + tt], t: THr },
    { p: [x0, bot + 0.78 * Rt], t: TV }, { p: [x0, CAP - r.t], t: TV }, { p: [x0 + r.t, CAP], t: THr }, { p: [W - r.t, CAP], t: THr }]);
}
function buildCapP(s) {
  const bs = capStem(s), W = 440, wall = capWall(s), tt = capTop(s), r = CAPR(s), yBB = 0.42 * CAP;
  const R = Math.min(0.45 * (W - bs), 0.45 * (CAP - yBB));
  const cl = bs, cr = W - wall, cb = yBB + tt, ct = CAP - tt;
  return contour([
    { p: [0, CAP - r.t], t: TV }, { p: [r.t, CAP], t: THr }, { p: [W - R, CAP], t: THr }, { p: [W, CAP - R], t: TVd },
    { p: [W, yBB + R], t: TVd }, { p: [W - R, yBB], t: THl }, { p: [bs + r.j, yBB], t: THl }, { p: [bs, yBB - r.j], t: TVd },
    { p: [bs, r.f], t: TVd }, { p: [bs - r.f, 0], t: THl }, { p: [r.f, 0], t: THl }, { p: [0, r.f], t: TV }])
    + box(cl, cr, cb, ct, boxR(cl, cr, cb, ct));
}
function buildCapR(s) {
  const bs = capStem(s), W = 510, W1 = 420, wall = capWall(s), tt = capTop(s), r = CAPR(s), yBB = 0.44 * CAP, legw = 1.10 * s;
  const R = Math.min(0.45 * (W1 - bs), 0.45 * (CAP - yBB));
  const cl = bs, cr = W1 - wall, cb = yBB + tt, ct = CAP - tt;
  // the leg leaves the bowl's right wall just above the underside and lands on the far right;
  // its inner edge is the outer one moved in by the stroke
  const Lo = line([W1, yBB + 0.12 * R], nrm([W - W1, -(yBB + 0.12 * R)])), dLeg = Lo[1], nLeg = [-dLeg[0], -dLeg[1]];
  const Li = offL(Lo, -legw), base = hline(0), under = hline(yBB);
  return contour([
    { p: [0, CAP - r.t], t: TV }, { p: [r.t, CAP], t: THr }, { p: [W1 - R, CAP], t: THr }, { p: [W1, CAP - R], t: TVd },
    ...corner(Lo[0], TVd, dLeg, r.j),
    ...corner([W, 0], dLeg, THl, r.f), ...corner(X(Li, base), THl, nLeg, r.f),
    ...corner(X(Li, under), nLeg, THl, r.j),
    { p: [bs + r.j, yBB], t: THl }, { p: [bs, yBB - r.j], t: TVd },
    { p: [bs, r.f], t: TVd }, { p: [bs - r.f, 0], t: THl }, { p: [r.f, 0], t: THl }, { p: [0, r.f], t: TV }])
    + box(cl, cr, cb, ct, boxR(cl, cr, cb, ct));
}
// the s's construction at any size: two bowls of one radius joined by a spine, as a
// centreline under the contrast law (the s itself keeps its own numbers)
function sCurve(W, top, bot, wall, th, taperK) {
  const span = top - bot, cxU = 0.494 * W, yU = bot + 0.733 * span, cxL = 0.506 * W, yL = bot + 0.237 * span;
  const a = 0.494 * W - wall / 2, bU = 0.267 * span - th / 2, bL = 0.237 * span - th / 2;
  const E = (cx, cy, ra, rb, deg) => { const t = deg * Math.PI / 180; return { p: [cx + ra * Math.cos(t), cy + rb * Math.sin(t)], d: [-ra * Math.sin(t), rb * Math.cos(t)] }; };
  const up = d => nrm(d), dn = d => nrm([-d[0], -d[1]]);
  const n1 = E(cxU, yU, a, bU, -16), n2 = E(cxU, yU, a, bU, 90), n3 = E(cxU, yU, a, bU, 180), n4 = E(cxU, yU, a, bU, 228);
  const n6 = E(cxL, yL, a, bL, 44), n7 = E(cxL, yL, a, bL, 0), n8 = E(cxL, yL, a, bL, -90), n9 = E(cxL, yL, a, bL, -195);
  const nodes = [
    { p: n1.p, t: up(n1.d) }, { p: n2.p, t: up(n2.d) }, { p: n3.p, t: up(n3.d) }, { p: n4.p, t: up(n4.d) },
    { p: [(n4.p[0] + n6.p[0]) / 2, (n4.p[1] + n6.p[1]) / 2], t: nrm([n6.p[0] - n4.p[0], n6.p[1] - n4.p[1]]) },
    { p: n6.p, t: dn(n6.d) }, { p: n7.p, t: dn(n7.d) }, { p: n8.p, t: dn(n8.d) }, { p: n9.p, t: dn(n9.d) }];
  return strokePath(nodes, (u, n) => (th + (wall - th) * Math.abs(n[0])) * (0.74 + 0.26 * Math.min(1, Math.min(u, 1 - u) / (taperK || 0.13))));
}
function buildCapS(s) { return sCurve(430, CAPOV, -7, 1.08 * s, capTop(s)); }

// ── punctuation and signs ──
// the family's own width law for a centreline stroke, tapered toward its ends like the s
const lawW = (s, th, taper) => (u, n) => (th + (s - th) * Math.abs(n[0])) * (taper ? (0.80 + 0.20 * Math.min(1, Math.min(u, 1 - u) / taper)) : 1);
const drop = (s, x, y) => shiftPath(buildPeriod(s), x, y);
function buildQuestion(s) {
  const k = contrastK(s), th = 0.72 * s * k, W = 330, cx = W / 2, R = 0.26 * CAP, yc = CAP - R;
  const E = ell(cx, yc, cx - s / 2 - 4, R - th / 2);
  const a = E(180), b = E(90), c = E(0);
  const stroke = strokePath([
    { p: a.p, t: a.cw }, { p: b.p, t: b.cw }, { p: c.p, t: c.cw },
    { p: [cx + 8, 0.40 * CAP], t: nrm([-0.45, -1]), h0: 0.36 }, { p: [cx, 0.30 * CAP], t: TVd, h1: 0.40 }, { p: [cx, 0.22 * CAP], t: TVd }], lawW(s, th, 0.10));
  return stroke + drop(s, cx - 0.56 * s, 0);
}
function buildQuestionDown(s) { return flipPath(buildQuestion(s), 330, 521); }
function buildExclamDown(s) { return flipPath(buildExcl(s), null, 521); }
function buildColon(s) { const r = 0.56 * s; return buildPeriod(s) + drop(s, 0, 521 - 2.3 * r); }
function buildSemicolon(s) { const r = 0.56 * s; return buildComma(s) + drop(s, 0, 521 - 2.3 * r); }
function buildEllipsis(s) { const w = 1.12 * s; return buildPeriod(s) + drop(s, w + 0.8 * s, 0) + drop(s, 2 * (w + 0.8 * s), 0); }
function buildMiddot(s) { const r = 0.56 * s; return drop(s, 0, 0.5 * 521 - r); }
function buildBullet(s) { const r = 0.42 * 521 / 2 + 0.2 * s, cx = r, cy = 0.5 * 521; return contour([{ p: [cx - r, cy], t: TV }, { p: [cx, cy + r], t: THr }, { p: [cx + r, cy], t: TVd }, { p: [cx, cy - r], t: THl }]); }
function buildQuoteSingle(s) { const w = 0.92 * s, h = 0.30 * CAP; return rrect(0, CAP - h, w, CAP, [0.34 * w, 0.34 * w, 0.20 * s, 0.20 * s]); }
function buildQuoteDbl(s) { const w = 0.92 * s, gap = 0.72 * s; return buildQuoteSingle(s) + shiftPath(buildQuoteSingle(s), w + gap, 0); }
// the comma raised to the cap line is the closing quote; turned round it is the opening one
function buildQuoteRight(s) { const r = 0.56 * s; return shiftPath(buildComma(s), 0, CAP - 2.44 * r); }
function buildQuoteLeft(s) { const r = 0.56 * s; return shiftPath(flipPath(buildComma(s), 2 * r, 1.10 * r), 0, CAP - 2.44 * r); }
function buildQuoteDblRight(s) { return buildQuoteRight(s) + shiftPath(buildQuoteRight(s), 1.72 * s, 0); }
function buildQuoteDblLeft(s) { return buildQuoteLeft(s) + shiftPath(buildQuoteLeft(s), 1.72 * s, 0); }
function dash(W, s) { const k = contrastK(s), th = 0.72 * s * k, y = 0.53 * 521; return rrect(0, y - th / 2, W, y + th / 2, 0.30 * th); }
function buildHyphen(s) { return dash(210, s); }
function buildEndash(s) { return dash(480, s); }
function buildEmdash(s) { return dash(920, s); }
function buildMinus(s) { return dash(360, s); }
function buildUnderscore(s) { const k = contrastK(s), th = 0.72 * s * k; return rrect(0, -0.62 * th - 60, 460, 0.38 * th - 60, 0.30 * th); }
function buildParenLeft(s) {
  const k = contrastK(s), th = 0.72 * s * k, w = 0.86 * s, top = CAP + 40, bot = DESC - 20, W = 230;
  const E = ell(W - w / 2, (top + bot) / 2, W - w, (top - bot) / 2 - th / 2 + 18);
  const a = E(112), b = E(180), c = E(248);
  return strokePath([{ p: a.p, t: a.ccw }, { p: b.p, t: b.ccw }, { p: c.p, t: c.ccw }], lawW(s * 0.9, th, 0));
}
function buildParenRight(s) { return flipPath(buildParenLeft(s), 230, null); }
function buildBracketLeft(s) { const w = 0.88 * s, k = contrastK(s), th = 0.72 * s * k, W = 220, r = CAPR(s), rb = 0.30 * th, top = CAP + 40, bot = DESC - 20;
  return poly([[0, bot], [W, bot], [W, bot + th], [w, bot + th], [w, top - th], [W, top - th], [W, top], [0, top]], [r.t, rb, rb, r.j, r.j, rb, rb, r.t]); }
function buildBracketRight(s) { return flipPath(buildBracketLeft(s), 220, null); }
function buildBraceLeft(s) {
  const k = contrastK(s), th = 0.72 * s * k, W = 260, top = CAP + 40, bot = DESC - 20, yM = (top + bot) / 2, cx = W - 0.44 * W, rr = 0.20 * (top - bot);
  return strokePath([
    { p: [W, top - th / 2], t: THl, h0: 0.55 }, { p: [cx, top - rr], t: TVd, h0: 0.40, h1: 0.40 }, { p: [cx, yM + 0.6 * rr], t: TVd, h0: 0.30 },
    { p: [0.36 * cx, yM], t: nrm([-1, -0.35]), h0: 0.30, h1: 0.30 }, { p: [cx, yM - 0.6 * rr], t: TVd, h1: 0.30, h0: 0.40 },
    { p: [cx, bot + rr], t: TVd, h1: 0.40 }, { p: [W, bot + th / 2], t: THr, h1: 0.55 }], lawW(0.9 * s, th, 0));
}
function buildBraceRight(s) { return flipPath(buildBraceLeft(s), 260, null); }
function buildSlash(s) { const dw = 1.0 * s, W = 360, top = CAP + 20, bot = DESC + 30; const d = nrm([W - dw, top - bot]); const dwh = dw / d[1]; return poly([[0, bot], [dwh, bot], [W, top], [W - dwh, top]], 0.26 * s); }
function buildBackslash(s) { return flipPath(buildSlash(s), 360, null); }
function buildBarV(s) { const w = 0.9 * s; return rrect(0, DESC - 20, w, CAP + 40, 0.20 * s); }
function chevron(W, yM, h, th, s, open) {
  // two bars meeting at a point on the left (open = 'left') or right
  const r = CAPR(s), tip = [0, yM], top = [W, yM + h], bot = [W, yM - h];
  const eT = line(tip, nrm([W, h])), eB = line(tip, nrm([W, -h]));
  const iT = offL(eT, -th), iB = offL(eB, th), right = vline(W);
  const d = poly([tip, X(eB, right), X(iB, right), X(iT, iB), X(iT, right), X(eT, right)], [r.j, 0.30 * th, 0.30 * th, r.j, 0.30 * th, 0.30 * th]);
  return open === 'right' ? flipPath(d, W, null) : d;
}
function buildLess(s) { const k = contrastK(s), th = 0.78 * s * k; return chevron(360, 0.53 * 521, 0.42 * 521, th, s, 'left'); }
function buildGreater(s) { const k = contrastK(s), th = 0.78 * s * k; return chevron(360, 0.53 * 521, 0.42 * 521, th, s, 'right'); }
function rotateChevronUp(s) {
  const k = contrastK(s), th = 0.66 * s * k, r = CAPR(s), W = 300, h = 0.30 * CAP, cx = W / 2, apexY = CAP;
  const eL = line([0, apexY - h], nrm([cx, h])), eR = line([cx, apexY], nrm([cx, -h]));
  const iL = offL(eL, -th), iR = offL(eR, -th), base = hline(apexY - h);
  return poly([[0, apexY - h], X(iL, base), X(iL, iR), X(iR, base), [W, apexY - h], [cx, apexY]], [0.30 * th, 0.30 * th, r.j, 0.30 * th, 0.30 * th, r.j]);
}
function buildPlus(s) { const k = contrastK(s), th = 0.78 * s * k, W = 360, cy = 0.53 * 521, r = 0.30 * th, j = 0.22 * s, cx = W / 2, h = 0.78 * s;
  return poly([[cx - h / 2, cy - W / 2], [cx + h / 2, cy - W / 2], [cx + h / 2, cy - th / 2], [W, cy - th / 2], [W, cy + th / 2], [cx + h / 2, cy + th / 2], [cx + h / 2, cy + W / 2], [cx - h / 2, cy + W / 2], [cx - h / 2, cy + th / 2], [0, cy + th / 2], [0, cy - th / 2], [cx - h / 2, cy - th / 2]],
              [r, r, j, r, r, j, r, r, j, r, r, j]); }
function buildEqual(s) { const k = contrastK(s), th = 0.78 * s * k, W = 360, cy = 0.53 * 521, g = 0.42 * 521 / 2;
  return rrect(0, cy - g - th / 2, W, cy - g + th / 2, 0.30 * th) + rrect(0, cy + g - th / 2, W, cy + g + th / 2, 0.30 * th); }
function buildMultiply(s) { const k = contrastK(s), th = 0.78 * s * k, W = 330, cy = 0.53 * 521, h = W / 2;
  return bar([0, cy - h], [W, cy + h], th, 0.30 * th) + bar([0, cy + h], [W, cy - h], th, 0.30 * th); }
function buildDivide(s) { const k = contrastK(s), th = 0.72 * s * k, r = 0.56 * s, cy = 0.53 * 521; return buildMinus(s) + drop(s, 180 - r, cy + th / 2 + 0.36 * s) + drop(s, 180 - r, cy - th / 2 - 0.36 * s - 2.32 * r); }
function buildNumberSign(s) { const k = contrastK(s), th = 0.78 * s * k, W = 470, r = 0.30 * th, y1 = 0.30 * CAP, y2 = 0.66 * CAP;
  const dw = 0.94 * s, lean = 0.18 * CAP;
  return rrect(0, y1 - th / 2, W, y1 + th / 2, r) + rrect(0, y2 - th / 2, W, y2 + th / 2, r)
       + bar([0.28 * W, 0], [0.28 * W + lean, CAP], dw, 0.30 * dw) + bar([0.66 * W, 0], [0.66 * W + lean, CAP], dw, 0.30 * dw); }
function buildAsterisk(s) { const k = contrastK(s), th = 0.80 * s * k, W = 330, cx = W / 2, cy = CAP - W / 2, R = W / 2;
  let d = ''; for (let i = 0; i < 3; i++) { const a = (90 + i * 60) * Math.PI / 180; d += bar([cx - R * Math.cos(a), cy - R * Math.sin(a)], [cx + R * Math.cos(a), cy + R * Math.sin(a)], th, 0.36 * th); } return d; }
function buildPercent(s) { const k = contrastK(s), th = 0.66 * s * k, W = 560, rw = 0.66 * s, D = 0.40 * CAP;
  const ring = (x, y) => circleRing(x + D / 2, y + D / 2, D / 2, rw, th);
  return ring(0, CAP - D) + ring(W - D, 0) + bar([0.22 * W, -7], [0.78 * W, CAP + 7], 0.84 * s, 0.30 * s); }
function buildAmpersand(s) {
  const k = contrastK(s), th = 0.72 * s * k, W = 580;
  const EU = ell(0.40 * W, 0.735 * CAP, 0.24 * W, 0.235 * CAP), EL = ell(0.42 * W, 0.315 * CAP, 0.36 * W, 0.315 * CAP);
  const u1 = EU(-30), u2 = EU(90), u3 = EU(180), l1 = EL(-12), l2 = EL(-90), l3 = EL(180), l4 = EL(120);
  return strokePath([
    { p: u1.p, t: u1.ccw }, { p: u2.p, t: u2.ccw }, { p: u3.p, t: u3.ccw },
    { p: [0.52 * W, 0.47 * CAP], t: nrm([1, -0.85]), h0: 0.36, h1: 0.36 },
    { p: l1.p, t: l1.cw }, { p: l2.p, t: l2.cw }, { p: l3.p, t: l3.cw }, { p: l4.p, t: l4.cw },
    { p: [W, 0.34 * CAP], t: nrm([1, 0.25]), h1: 0.40 }], lawW(s, th, 0.06));
}
function buildAt(s) {
  const k = contrastK(s), th = 0.66 * s * k, W = 640, cx = W / 2, cy = 0.42 * CAP, ry = 0.58 * CAP, rx = cx - 0.45 * s;
  const E = ell(cx, cy, rx, ry), o = [E(-55), E(-90), E(180), E(90), E(0), E(-30)];
  const outer = strokePath(o.map(q => ({ p: q.p, t: q.cw })), lawW(0.82 * s, 0.9 * th, 0.05));
  // the a inside is Aqua's own a, at three quarters, sitting on the curl's middle
  const a = basePath('a', s), kk = 0.74, ab = bbox(a);
  return outer + shiftPath(scalePath(a, kk), cx + 0.04 * W - kk * (ab.xmin + ab.xmax) / 2, cy - kk * (ab.ymin + ab.ymax) / 2);
}
function buildDollar(s) { const W = 400, k = contrastK(s); return sCurve(W, CAP + 4, -7, 0.94 * s, 0.72 * s * k) + rrect(W / 2 - 0.30 * s, -0.11 * CAP, W / 2 + 0.30 * s, CAP + 0.11 * CAP, 0.30 * s); }
function buildEuro(s) { const k = contrastK(s), th = 0.66 * s * k, W = 470, top = CAPOV, y1 = 0.42 * CAP, y2 = 0.58 * CAP;
  return ringOpen(W, -7, top, capWall(s), capTop(s), s) + rrect(-40, y1 - th / 2, 0.62 * W, y1 + th / 2, 0.30 * th) + rrect(-40, y2 - th / 2, 0.62 * W, y2 + th / 2, 0.30 * th); }
function buildSterling(s) {
  const k = contrastK(s), th = 0.72 * s * k, W = 420, xs = 0.34 * W, R = 0.22 * CAP;
  const E = ell(xs + R, CAP - R, R, R - th / 2);
  const a = E(0), b = E(90), c = E(180);
  return strokePath([{ p: a.p, t: a.ccw }, { p: b.p, t: b.ccw }, { p: c.p, t: c.ccw },
    { p: [xs, 0.30 * CAP], t: TVd, h0: 0.40 }, { p: [0.10 * W, th / 2 + 10], t: nrm([-0.9, -1]), h0: 0.30, h1: 0.40 }, { p: [W, th / 2], t: THr, h1: 0.40 }], lawW(s, th, 0.06))
    + rrect(0.06 * W, 0.44 * CAP - th / 2, 0.66 * W, 0.44 * CAP + th / 2, 0.30 * th);
}
// the wave: two bends of one radius, wide enough for the stroke at Black to turn inside them
function buildTilde(s) { const k = contrastK(s), th = 0.66 * s * k, W = 440, y = 0.53 * 521, h = 0.16 * 521;
  return strokePath([{ p: [0, y - 0.55 * h], t: nrm([1, 0.75]), h0: 0.42 }, { p: [0.29 * W, y + h], t: THr, h0: 0.42, h1: 0.42 }, { p: [0.71 * W, y - h], t: THr, h0: 0.42, h1: 0.42 }, { p: [W, y + 0.55 * h], t: nrm([1, 0.75]), h1: 0.42 }], lawW(0.86 * s, th, 0.08)); }
function buildDegree(s) { const D = 0.30 * CAP, k = contrastK(s), th = 0.56 * s * k; return circleRing(D / 2, CAP - D / 2, D / 2, 0.60 * s, th); }
function buildGuillemetLeft(s) { const k = contrastK(s), th = 0.66 * s * k, one = chevron(190, 0.5 * 521, 0.26 * 521, th, s, 'left'); return one + shiftPath(one, 200, 0); }
function buildGuillemetRight(s) { return flipPath(buildGuillemetLeft(s), 390, null); }

// ── accents: the marks, placed on a base ──
// A mark is drawn at x = 0 with its bottom at y = 0 and placed by placeMark: centred on the
// base's ink (on the stem for i and j) and lifted above it by the i's own dot gap.
const MARK_GAP = 66;
function markAcute(s) { const k = contrastK(s), w = 0.78 * s; return bar([-0.05 * s, 0], [0.62 * s + 20, 0.72 * (0.30 * 521)], w, 0.42 * w); }
function markGrave(s) { return flipPath(markAcute(s), 0, null); }
function markCircumflex(s) { const k = contrastK(s), th = 0.62 * s * k, r = CAPR(s), hw = 0.26 * 521, h = 0.30 * 521 * 0.72;
  const eL = line([-hw, 0], nrm([hw, h])), eR = line([0, h], nrm([hw, -h])), iL = offL(eL, -th), iR = offL(eR, -th), base = hline(0);
  return poly([[-hw, 0], X(iL, base), X(iL, iR), X(iR, base), [hw, 0], [0, h]], [0.30 * th, 0.30 * th, r.j, 0.30 * th, 0.30 * th, r.j]); }
function markCaron(s) { return flipPath(markCircumflex(s), null, 0.30 * 521 * 0.72); }
function markDot(s) { const r = 0.53 * s; return contour([{ p: [-r, r], t: TV }, { p: [0, 2 * r], t: THr }, { p: [r, r], t: TVd }, { p: [0, 0], t: THl }]); }
function markDieresis(s) { const r = 0.50 * s, g = r + 0.22 * s; return shiftPath(markDot(s), -g, 0) + shiftPath(markDot(s), g, 0); }
function markTilde(s) { const k = contrastK(s), th = 0.60 * s * k, W = 0.52 * 521, h = 0.07 * 521;
  return strokePath([{ p: [-W / 2, 0 + h * 0.2], t: nrm([1, 1.2]), h0: 0.40 }, { p: [-0.20 * W, 2 * h + h * 0.2], t: THr, h0: 0.36, h1: 0.36 }, { p: [0.20 * W, 0 + h * 0.2], t: THr, h0: 0.36, h1: 0.36 }, { p: [W / 2, 2 * h + h * 0.2], t: nrm([1, 1.2]), h1: 0.40 }], lawW(0.86 * s, th, 0.08)); }
// a small true ring: outer circle and inner circle, the wall carrying the contrast
function circleRing(cx, cy, R, wall, th) {
  const ring = (r, rx, ry) => contour([{ p: [cx - rx, cy], t: TV }, { p: [cx, cy + ry], t: THr }, { p: [cx + rx, cy], t: TVd }, { p: [cx, cy - ry], t: THl }]);
  return ring(R, R, R) + ring(0, R - wall, R - th);
}
function markRing(s) { const D = 0.36 * 521, k = contrastK(s), th = 0.56 * s * k; return circleRing(0, D / 2, D / 2, 0.60 * s, th); }
function markMacron(s) { const k = contrastK(s), th = 0.60 * s * k, W = 0.50 * 521; return rrect(-W / 2, 0, W / 2, th, 0.30 * th); }
function markCedilla(s) { const k = contrastK(s), th = 0.62 * s * k, R = 0.13 * 521;
  return strokePath([{ p: [0, 8], t: TVd, h0: 0.30 }, { p: [R * 0.9, -R], t: TVd, h0: 0.40, h1: 0.40 }, { p: [0, -2 * R], t: THl, h1: 0.40 }, { p: [-R * 0.8, -1.6 * R], t: TV, h1: 0.40 }], lawW(0.8 * s, th, 0.10)); }
const MARKS = { acute: markAcute, grave: markGrave, circumflex: markCircumflex, caron: markCaron, dot: markDot, dieresis: markDieresis, tilde: markTilde, ring: markRing, macron: markMacron, cedilla: markCedilla };
// the base glyph's outline as it is now (edits included), dot dropped for i and j
function baseFor(ch, s) {
  const d = outline(ch, s); if (!d) return null;
  if (ch === 'i' || ch === 'j') { const subs = parsePath(d); return serializePath([subs[0]]); }
  return d;
}
function compose(base, mark, opts = {}) {
  return s => {
    const d = baseFor(base, s); if (!d) return null;
    const b = bbox(d), caps = /[A-Z]/.test(base);
    let cx = (b.xmin + b.xmax) / 2;
    if (base === 'i' || base === 'j') cx = base === 'i' ? s / 2 : 96 + s / 2;
    if (opts.cx) cx = opts.cx(s, b);
    let m = MARKS[mark](s);
    if (mark === 'tilde' || mark === 'cedilla') m = polishPath('mark:' + mark, m, () => MARKS[mark](106));
    if (mark === 'cedilla') return d + shiftPath(m, cx + (opts.dx || 0), 0);
    const y = (caps ? CAP : 521) + MARK_GAP * (caps ? 0.55 : 1) + (opts.dy || 0);
    return d + shiftPath(m, cx + (opts.dx || 0), y);
  };
}
function buildFi(s) { const f = glyph('f', s); return outline('f', s) + shiftPath(baseFor('i', s), f.w - 0.1 * s, 0) + shiftPath(markDot(s), f.w - 0.1 * s + s / 2, 521 + MARK_GAP); }
function buildFl(s) { const f = glyph('f', s); return outline('f', s) + shiftPath(outline('l', s), f.w - 0.1 * s, 0); }

// ── the table: builder, advance width, spacing class, production name, what it is ──
// nz: contours overlap and the glyph fills by winding; stroke: drawn as a centreline and
// polished into cubics (see polished()).
const EXT = {
  A: [buildCapA, 520, 'oo', 'A', 'two diagonals meeting at a flat apex, and a bar'],
  C: [buildCapC, 470, 'ro', 'C', 'the ring opened on the right, cut on the family angle'],
  D: [buildCapD, 480, 'fr', 'D', 'a stem and one big bowl'],
  E: [buildCapE, 410, 'ff', 'E', 'a stem and three bars'],
  F: [buildCapF, 400, 'ff', 'F', 'a stem and two bars'],
  G: [buildCapG, 500, 'rf', 'G', 'the open ring with a bar into it'],
  H: [buildCapH, 480, 'ff', 'H', 'two stems and a bar'],
  I: [buildCapI, 127, 'ff', 'I', 'one stem'],
  J: [buildCapJ, 320, 'of', 'J', 'a stem that turns into a tail'],
  K: [buildCapK, 470, 'fo', 'K', 'a stem, an arm up and a leg down'],
  L: [buildCapL, 400, 'ff', 'L', 'a stem and a bar'],
  M: [buildCapM, 590, 'ff', 'M', 'two stems and a V between them'],
  N: [buildCapN, 490, 'ff', 'N', 'two stems and a diagonal'],
  O: [buildCapO, 500, 'rr', 'O', 'the ring at capital height'],
  P: [buildCapP, 440, 'fr', 'P', 'a stem and a bowl at the top'],
  Q: [buildCapQ, 500, 'rr', 'Q', 'the ring with a tail', true],
  R: [buildCapR, 510, 'fo', 'R', 'a stem, a bowl at the top and a leg'],
  S: [buildCapS, 430, 'rr', 'S', 'the s at capital height', false, true],
  T: [buildCapT, 440, 'oo', 'T', 'a bar and a stem'],
  U: [buildCapU, 470, 'ff', 'U', 'two stems joined by a round bottom'],
  V: [buildCapV, 500, 'oo', 'V', 'two diagonals meeting at the bottom'],
  W: [buildCapW, 720, 'oo', 'W', 'four diagonals'],
  X: [buildCapX, 470, 'oo', 'X', 'two diagonals that cross'],
  Y: [buildCapY, 470, 'oo', 'Y', 'two diagonals meeting on a stem'],
  Z: [buildCapZ, 440, 'ff', 'Z', 'a bar, a diagonal and a bar'],
  '?': [buildQuestion, 'ink', 'ro', 'question', 'a hook over a short stem, and the drop', false, true],
  '¿': [buildQuestionDown, 'ink', 'or', 'questiondown', 'the question mark turned over', false, true],
  '¡': [buildExclamDown, 112, 'ff', 'exclamdown', 'the exclamation mark turned over'],
  ':': [buildColon, 1.12 * 106, 'oo', 'colon', 'two drops'],
  ';': [buildSemicolon, 1.12 * 106, 'oo', 'semicolon', 'a drop over a comma'],
  '…': [buildEllipsis, 3 * 1.12 * 106 + 2 * 0.8 * 106, 'oo', 'ellipsis', 'three drops'],
  '·': [buildMiddot, 1.12 * 106, 'oo', 'periodcentered', 'a drop at the middle'],
  '•': [buildBullet, 0.42 * 521 + 0.4 * 106, 'rr', 'bullet', 'a full round'],
  "'": [buildQuoteSingle, 0.92 * 106, 'ff', 'quotesingle', 'a short stem at the top'],
  '"': [buildQuoteDbl, 2 * 0.92 * 106 + 0.72 * 106, 'ff', 'quotedbl', 'two short stems at the top'],
  '’': [buildQuoteRight, 1.12 * 106, 'oo', 'quoteright', 'the comma, raised'],
  '‘': [buildQuoteLeft, 1.12 * 106, 'oo', 'quoteleft', 'the comma, raised and turned'],
  '”': [buildQuoteDblRight, 2 * 1.12 * 106 + 0.6 * 106, 'oo', 'quotedblright', 'two raised commas'],
  '“': [buildQuoteDblLeft, 2 * 1.12 * 106 + 0.6 * 106, 'oo', 'quotedblleft', 'two raised commas, turned'],
  '-': [buildHyphen, 210, 'ff', 'hyphen', 'a short bar'],
  '–': [buildEndash, 480, 'ff', 'endash', 'a bar'],
  '—': [buildEmdash, 920, 'ff', 'emdash', 'a long bar'],
  '−': [buildMinus, 360, 'ff', 'minus', 'a bar'],
  '_': [buildUnderscore, 460, 'ff', 'underscore', 'a bar under the line'],
  '(': [buildParenLeft, 'ink', 'or', 'parenleft', 'one curve, open to the right', false, true],
  ')': [buildParenRight, 'ink', 'ro', 'parenright', 'one curve, open to the left', false, true],
  '[': [buildBracketLeft, 220, 'ff', 'bracketleft', 'a stem with two short bars'],
  ']': [buildBracketRight, 220, 'ff', 'bracketright', 'a stem with two short bars'],
  '{': [buildBraceLeft, 'ink', 'or', 'braceleft', 'a stem that pinches in the middle', false, true],
  '}': [buildBraceRight, 'ink', 'ro', 'braceright', 'a stem that pinches in the middle', false, true],
  '/': [buildSlash, 360, 'oo', 'slash', 'one diagonal'],
  '\\': [buildBackslash, 360, 'oo', 'backslash', 'one diagonal'],
  '|': [buildBarV, 0.9 * 106, 'ff', 'bar', 'one tall stem'],
  '<': [buildLess, 360, 'of', 'less', 'two bars meeting on the left'],
  '>': [buildGreater, 360, 'fo', 'greater', 'two bars meeting on the right'],
  '^': [rotateChevronUp, 300, 'oo', 'asciicircum', 'two bars meeting at the top'],
  '+': [buildPlus, 360, 'ff', 'plus', 'a bar and a stem crossing'],
  '=': [buildEqual, 360, 'ff', 'equal', 'two bars'],
  '×': [buildMultiply, 330, 'oo', 'multiply', 'two bars crossing', true],
  '÷': [buildDivide, 360, 'ff', 'divide', 'a bar between two drops'],
  '#': [buildNumberSign, 470, 'ff', 'numbersign', 'two bars and two slanted stems', true],
  '*': [buildAsterisk, 330, 'oo', 'asterisk', 'three bars through one point', true],
  '%': [buildPercent, 560, 'ro', 'percent', 'two small rings and a diagonal'],
  '&': [buildAmpersand, 'ink', 'ro', 'ampersand', 'a loop over a loop, and the arm out to the right', true, true],
  '@': [buildAt, 'ink', 'rr', 'at', 'the a inside a big open curve', false, true],
  '$': [buildDollar, 400, 'rr', 'dollar', 'the S with a stem through it', true, true],
  '€': [buildEuro, 'ink', 'ro', 'Euro', 'the open ring with two bars', true],
  '£': [buildSterling, 'ink', 'ro', 'sterling', 'a hooked stem, a foot and a bar', true, true],
  '~': [buildTilde, 'ink', 'oo', 'asciitilde', 'one wave', false, true],
  '°': [buildDegree, 0.30 * CAP, 'rr', 'degree', 'a small ring at the top'],
  '«': [buildGuillemetLeft, 390, 'oo', 'guillemotleft', 'two small chevrons'],
  '»': [buildGuillemetRight, 390, 'oo', 'guillemotright', 'two small chevrons'],
  '´': [s => shiftPath(markAcute(s), 0.3 * s, 521 + MARK_GAP), 'ink', 'oo', 'acute', 'the acute accent alone'],
  '`': [s => shiftPath(markGrave(s), 0.6 * s, 521 + MARK_GAP), 'ink', 'oo', 'grave', 'the grave accent alone'],
  'ˆ': [s => shiftPath(markCircumflex(s), 0.26 * 521, 521 + MARK_GAP), 0.52 * 521, 'oo', 'circumflex', 'the circumflex alone'],
  '¨': [s => shiftPath(markDieresis(s), 0.5 * 106 + 0.22 * 106, 521 + MARK_GAP), 'ink', 'oo', 'dieresis', 'the dieresis alone'],
  '˜': [s => shiftPath(markTilde(s), 0.26 * 521, 521 + MARK_GAP), 0.52 * 521, 'oo', 'tilde', 'the tilde alone', false, true],
  '˚': [s => shiftPath(markRing(s), 0.18 * 521, 521 + MARK_GAP), 0.36 * 521, 'oo', 'ring', 'the ring alone'],
  '¸': [s => shiftPath(markCedilla(s), 0.13 * 521, 0), 'ink', 'oo', 'cedilla', 'the cedilla alone', false, true],
  '¯': [s => shiftPath(markMacron(s), 0.25 * 521, 521 + MARK_GAP), 0.50 * 521, 'oo', 'macron', 'the macron alone'],
  'ˇ': [s => shiftPath(markCaron(s), 0.26 * 521, 521 + MARK_GAP), 0.52 * 521, 'oo', 'caron', 'the caron alone'],
  'ﬁ': [buildFi, 158 + 106 + 106 - 0.1 * 106 + 0, 'ff', 'fi', 'the f and the i, joined', true],
  'ﬂ': [buildFl, 158 + 106 + 106 - 0.1 * 106, 'ff', 'fl', 'the f and the l, joined', true]
};
// the composed letters: base + mark, named the standard way
const COMPOSED = {
  à: ['a', 'grave', 'agrave'], á: ['a', 'acute', 'aacute'], â: ['a', 'circumflex', 'acircumflex'], ä: ['a', 'dieresis', 'adieresis'], ã: ['a', 'tilde', 'atilde'], å: ['a', 'ring', 'aring'],
  ç: ['c', 'cedilla', 'ccedilla'],
  è: ['e', 'grave', 'egrave'], é: ['e', 'acute', 'eacute'], ê: ['e', 'circumflex', 'ecircumflex'], ë: ['e', 'dieresis', 'edieresis'],
  ì: ['i', 'grave', 'igrave'], í: ['i', 'acute', 'iacute'], î: ['i', 'circumflex', 'icircumflex'], ï: ['i', 'dieresis', 'idieresis'],
  ñ: ['n', 'tilde', 'ntilde'],
  ò: ['o', 'grave', 'ograve'], ó: ['o', 'acute', 'oacute'], ô: ['o', 'circumflex', 'ocircumflex'], ö: ['o', 'dieresis', 'odieresis'], õ: ['o', 'tilde', 'otilde'],
  ù: ['u', 'grave', 'ugrave'], ú: ['u', 'acute', 'uacute'], û: ['u', 'circumflex', 'ucircumflex'], ü: ['u', 'dieresis', 'udieresis'],
  ý: ['y', 'acute', 'yacute'], ÿ: ['y', 'dieresis', 'ydieresis'],
  À: ['A', 'grave', 'Agrave'], Á: ['A', 'acute', 'Aacute'], Â: ['A', 'circumflex', 'Acircumflex'], Ä: ['A', 'dieresis', 'Adieresis'], Ã: ['A', 'tilde', 'Atilde'], Å: ['A', 'ring', 'Aring'],
  Ç: ['C', 'cedilla', 'Ccedilla'],
  È: ['E', 'grave', 'Egrave'], É: ['E', 'acute', 'Eacute'], Ê: ['E', 'circumflex', 'Ecircumflex'], Ë: ['E', 'dieresis', 'Edieresis'],
  Ì: ['I', 'grave', 'Igrave'], Í: ['I', 'acute', 'Iacute'], Î: ['I', 'circumflex', 'Icircumflex'], Ï: ['I', 'dieresis', 'Idieresis'],
  Ñ: ['N', 'tilde', 'Ntilde'],
  Ò: ['O', 'grave', 'Ograve'], Ó: ['O', 'acute', 'Oacute'], Ô: ['O', 'circumflex', 'Ocircumflex'], Ö: ['O', 'dieresis', 'Odieresis'], Õ: ['O', 'tilde', 'Otilde'],
  Ù: ['U', 'grave', 'Ugrave'], Ú: ['U', 'acute', 'Uacute'], Û: ['U', 'circumflex', 'Ucircumflex'], Ü: ['U', 'dieresis', 'Udieresis'],
  Ý: ['Y', 'acute', 'Yacute']
};
const MARK_WORDS = { grave: 'a grave accent', acute: 'an acute accent', circumflex: 'a circumflex', dieresis: 'a dieresis', tilde: 'a tilde', ring: 'a ring', cedilla: 'a cedilla', caron: 'a caron', macron: 'a macron', dot: 'a dot' };
for (const ch in COMPOSED) { const [base, mark, name] = COMPOSED[ch]; EXT[ch] = [compose(base, mark), null, null, name, `the ${base} with ${MARK_WORDS[mark]}`, false, false, base]; }
const EXT_W = {}, EXT_SHAPE = {}, EXT_NAME = {}, EXT_DESC = {}, NONZERO = new Set(), POLISH = new Set(['s', '2', '3', '5']), EXT_BASE = {};
for (const ch in EXT) {
  const [fn, w, shape, name, desc, nz, stroke, base] = EXT[ch];
  BUILD[ch] = nz ? (f => x => windNonzero(f(x)))(fn) : fn; EXT_W[ch] = w; EXT_SHAPE[ch] = shape; EXT_NAME[ch] = name; EXT_DESC[ch] = desc; GNAME[ch] = name;
  if (nz) NONZERO.add(ch); if (stroke) POLISH.add(ch); if (base) EXT_BASE[ch] = base;
}
// A glyph that fills by winding must run every hole the other way round from the contour
// that holds it: even depth one way, odd depth the other.
function windNonzero(d) {
  const subs = parsePath(d); if (subs.length < 2) return d;
  const flat = subs.map(sub => sub.flatMap(sg => sg[4] === 'L' ? [sg[0]] : [0, 0.25, 0.5, 0.75].map(t => bezAt([sg[0], sg[1], sg[2], sg[3]], t))));
  const area = P => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  const inside = (pt, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const out = subs.map((sub, i) => {
    let depth = 0; for (let j = 0; j < subs.length; j++) if (j !== i && inside(flat[i][0], flat[j])) depth++;
    const ccw = area(flat[i]) > 0, want = depth % 2 === 0;
    if (ccw === want) return sub;
    return sub.slice().reverse().map(sg => [sg[3], sg[2], sg[1], sg[0], sg[4]]);
  });
  return serializePath(out);
}
function describeGlyph(ch) { return EXT_DESC[ch] || null; }
// Every centreline stroke (the s, the 2 3 5, the ?, the &, ...) comes out of strokePath as
// a polyline of hundreds of pieces. It is polished into cubics with a point at every corner
// and extreme, with the splits found once at Black and replayed at every other weight, so
// the outline is a drawing and still blends. See simplifyPath.
const POLISH_OPTS = { tol: 1.2, corner: 60, span: 6, K: 8, onlyLines: true }, PLAN = {};
function polishPath(key, d, at106) {
  if (!d) return d;
  if (!PLAN[key]) PLAN[key] = simplifyPath(at106(), POLISH_OPTS).plan;
  return simplifyPath(d, POLISH_OPTS, PLAN[key]).d;
}
// ── Drawn masters ────────────────────────────────────────────────────────────
// Outlines that came back redrawn from Illustrator. These glyphs stop being parametric:
// the axis interpolates them point-for-point between the two drawn weights, the way the
// g already interpolates by offset. Everything else is still built from parameters.
const MASTERS = {
  'c': { ch: 'c', black: "M360.3 350.4C371.5 354.2 379 364.7 379 376.5C379 460.2 294.2 528 189.5 528C84.8 528 0 451.4 0 356.8C0 292.6 0 228.4 0 164.2C0 69.6 84.8 -7 189.5 -7C294.2 -7 379 52.4 379 125.7C379 144.6 360.4 157.9 342.6 151.8C325.6 146 308.6 140.3 291.7 134.5C280.5 130.7 273 120.2 273 108.4C273 108.4 273 108.4 273 108.4C273 86.8 255.5 69.3 233.9 69.3C215.5 69.3 197 69.3 178.6 69.3C138.5 69.3 106 101.8 106 141.9C106 221.8 106 301.6 106 381.5C106 420.3 137.4 451.7 176.1 451.7C185 451.7 194 451.7 202.9 451.7C241.6 451.7 273 420.3 273 381.5C273 374.1 273 366.7 273 359.2C273 340.4 291.6 327.1 309.4 333.1C326.4 338.9 343.4 344.7 360.3 350.4Z", regular: "M369.7 353.6C375.2 355.5 379 360.8 379 366.7C379 455.8 294.2 528 189.5 528C84.8 528 0 451.4 0 356.8C0 292.6 0 228.4 0 164.2C0 69.6 84.8 -7 189.5 -7C294.2 -7 379 61 379 145C379 154.4 369.7 161 360.8 158C352.3 155.1 343.8 152.2 335.3 149.4C329.8 147.5 326 142.2 326 136.3C326 138 326 139.6 326 141.2C326 74.4 271.9 20.3 205.1 20.3C205.9 20.3 206.6 20.3 207.4 20.3C122.1 20.3 53 89.4 53 174.7C53 245.2 53 315.5 53 386C53 449.3 104.3 500.7 167.7 500.7C182.2 500.7 196.8 500.7 211.3 500.7C274.7 500.7 326 449.3 326 386C326 376.7 326 367.4 326 358C326 348.6 335.3 341.9 344.2 345C352.7 347.9 361.2 350.7 369.7 353.6Z" },
  'e': { ch: 'e', black: "M357.8 230.2C369.5 230.2 379 239.7 379 251.4C379 286.5 379 321.7 379 356.8C379 451.4 294.2 528 189.5 528C84.8 528 0 451.4 0 356.8C0 292.6 0 228.4 0 164.2C0 69.6 84.8 -7 189.5 -7C294.2 -7 379 52.4 379 125.7C379 144.6 360.4 157.9 342.6 151.8C325.6 146 308.6 140.3 291.7 134.5C280.5 130.7 273 120.2 273 108.4C273 108.4 273 108.4 273 108.4C273 86.8 255.5 69.3 233.9 69.3C214.6 69.3 195.4 69.3 176.1 69.3C137.4 69.3 106 100.7 106 139.5C106 162.7 106 185.8 106 209C106 220.7 115.5 230.2 127.2 230.2C204.1 230.2 280.9 230.2 357.8 230.2ZM106 327.7C106 345.6 106 363.6 106 381.5C106 420.3 137.4 451.7 176.1 451.7C185 451.7 194 451.7 202.9 451.7C241.6 451.7 273 420.3 273 381.5C273 363.6 273 345.6 273 327.7C273 316 263.5 306.5 251.8 306.5C210.3 306.5 168.7 306.5 127.2 306.5C115.5 306.5 106 316 106 327.7Z", regular: "M368.4 279.2C374.3 279.2 379 283.9 379 289.8C379 312.1 379 334.5 379 356.8C379 451.4 294.2 528 189.5 528C84.8 528 0 451.4 0 356.8C0 292.6 0 228.4 0 164.2C0 69.6 84.8 -7 189.5 -7C294.2 -7 379 61 379 145C379 154.4 369.7 161 360.8 158C352.3 155.1 343.8 152.2 335.3 149.4C329.8 147.5 326 142.2 326 136.3C326 138 326 139.6 326 141.2C326 74.4 271.9 20.3 205.1 20.3C192.5 20.3 180.1 20.3 167.7 20.3C104.3 20.3 53 71.7 53 135C53 179.6 53 224 53 268.6C53 274.4 57.7 279.2 63.6 279.2C165.2 279.2 266.8 279.2 368.4 279.2ZM53 317.1C53 340.1 53 363 53 386C53 449.3 104.3 500.7 167.7 500.7C182.2 500.7 196.8 500.7 211.3 500.7C274.7 500.7 326 449.3 326 386C326 363 326 340.1 326 317.1C326 311.2 321.3 306.5 315.4 306.5C231.5 306.5 147.5 306.5 63.6 306.5C57.7 306.5 53 311.2 53 317.1Z" },
  'y': { ch: 'y', black: "M106 491.3C106 378.5 106 265.7 106 152.8C106 106.7 143.4 69.3 189.5 69.3C235.6 69.3 273 106.7 273 152.8C273 251.5 273 350.2 273 448.9C273 475.2 289.3 490.5 307.1 496.6C321.7 501.5 336.3 506.5 350.9 511.4C365.6 516.4 379 502.4 379 491.3C379 309.2 379 127.1 379 -55C379 -151.7 290.8 -230 182.1 -230C169.4 -230 159.2 -219.7 159.2 -207.1C159.2 -196.9 159.2 -186.8 159.2 -176.6C159.2 -163.9 169.4 -153.7 182.1 -153.7C232.3 -153.7 273 -125.2 273 -90C273 -81.8 273 -37.3 273 -29.1C273 37.2 225.4 -7 166.8 -7C74.7 -7 0 67.7 0 159.8C0 256.1 0 352.5 0 448.9C0 475.2 16.3 490.5 34.1 496.6C48.7 501.5 63.3 506.5 77.9 511.4C92.6 516.4 106 502.4 106 491.3Z", regular: "M53 506.2C53 389.7 53 273.3 53 156.8C53 81.4 114.1 20.3 189.5 20.3C264.9 20.3 326 81.4 326 156.8C326 266.2 326 375.6 326 485C326 498.1 334.1 505.7 343.1 508.8C350.4 511.3 357.7 513.7 364.9 516.2C372.3 518.7 379 511.7 379 506.2C379 319.1 379 132.1 379 -55C379 -151.7 284.3 -230 167.4 -230C162.9 -230 159.2 -226.3 159.2 -221.8C159.2 -218.2 159.2 -214.5 159.2 -210.9C159.2 -206.3 162.9 -202.7 167.4 -202.7C255 -202.7 326 -152.2 326 -90C326 -72 326 -17.9 326 0C326 58.4 254.7 -7 166.8 -7C74.7 -7 0 67.7 0 159.8C0 268.2 0 376.6 0 485C0 498.1 8.1 505.7 17.1 508.8C24.4 511.3 31.7 513.7 38.9 516.2C46.3 518.7 53 511.7 53 506.2Z" },
  'k': { ch: 'k', black: "M106 721.3C106 590.3 106 459.2 106 328.2C106 307.3 131.4 297 146 311.9C201.9 369.2 257.8 426.5 313.6 483.7C326.9 497.3 350 487.9 350 468.9C350 453.1 350 437.3 350 421.5C350 416 347.8 410.7 344 406.7C301.2 362.9 258.5 319.1 215.8 275.3C206.7 266 207 251 216.5 242C258.8 202.3 329.5 134.1 371.8 94.4C376.1 90.4 378.5 84.8 378.5 78.9C378.5 59.5 378.5 40 378.5 20.5C378.5 1.9 356.3 -7.7 342.8 5.1C286.5 58 201.6 139.4 145.3 192.3C130.4 206.3 106 195.8 106 175.3C106 127.5 106 79.6 106 31.8C106 14.2 91.8 0 74.2 0C60.1 0 45.9 0 31.8 0C14.2 0 0 14.2 0 31.8C0 247.5 0 463.2 0 678.9C0 705.2 16.3 720.5 34.1 726.6C48.7 731.5 63.3 736.5 77.9 741.4C92.6 746.4 106 732.4 106 721.3Z", regular: "M53 736.2C53 589.4 53 442.7 53 296C53 286.1 64.6 280.7 72.2 287.1C159 360.1 245.8 433.2 332.6 506.3C339.5 512.1 350 507.2 350 498.2C350 489.4 350 480.7 350 471.9C350 468.7 348.6 465.8 346.2 463.8C266.8 396.9 187.3 330 107.9 263.1C102.2 258.3 102.4 249.4 108.2 244.9C187.5 183.8 280.8 108.5 360 47.4C362.6 45.4 364.1 42.3 364.1 39C364.1 28.5 364.1 18 364.1 7.5C364.1 -1.3 354 -6.3 347 -0.9C260 66.3 158.8 147.6 71.8 214.7C64.1 220.7 53 215.2 53 205.5C53 142.3 53 79.1 53 15.9C53 7.1 45.9 0 37.1 0C30 0 23 0 15.9 0C7.1 0 0 7.1 0 15.9C0 248.9 0 481.9 0 715C0 728.1 8.1 735.7 17.1 738.8C24.4 741.3 31.7 743.7 38.9 746.2C46.3 748.7 53 741.7 53 736.2Z" },
  'comma': { ch: ',', black: "M0 73.6C0 112.9 20.7 144.8 46.3 144.8C86.3 144.8 118.7 110.8 118.7 68.9C118.7 -12.8 100.3 -79.5 52.2 -79.5C3.4 -67.4 0 37.2 0 73.6Z", regular: "M0 36.8C0 56.5 10.4 72.4 23.2 72.4C43.1 72.4 59.4 55.4 59.4 34.4C59.4 -6.4 43.4 -40.5 26.1 -39.8C8.9 -37.9 0 18.6 0 36.8Z" },
  'r': { ch: 'r', black: "M219 528C263.7 528 300 491.7 300 447C300 432.5 300 418 300 403.4C300 377.1 283.7 361.9 265.9 355.8C251.3 350.8 236.7 345.9 222.1 340.9C207.4 335.9 194 349.9 194 361C194 376.6 194 392.1 194 407.7C194 432 174.3 451.7 150 451.7C125.7 451.7 106 432 106 407.7C106 282.4 106 157.1 106 31.8C106 14.2 91.8 0 74.2 0C60.1 0 45.9 0 31.8 0C14.2 0 0 14.2 0 31.8C0 170.8 0 338.9 0 477.9C0 504.2 28.5 489 46.3 495.1C60.9 500 63.3 506.5 77.9 511.4C118 525.1 155.5 528 219 528Z", regular: "M192.5 528C251.9 528 300 479.9 300 420.5C300 414.2 300 407.9 300 401.6C300 388.4 291.9 380.8 282.9 377.7C275.6 375.3 268.3 372.8 261.1 370.3C253.7 367.8 247 374.8 247 380.4C247 388.1 247 395.9 247 403.7C247 457.2 203.6 500.7 150 500.7C96.4 500.7 53 457.2 53 403.7C53 274.4 53 145.2 53 15.9C53 7.1 45.9 0 37.1 0C30 0 23 0 15.9 0C7.1 0 0 7.1 0 15.9C0 172.3 0 341.1 0 497.5C0 510.6 13.7 504.1 22.7 507.2C30 509.7 31.7 513.7 38.9 516.2C82.6 531.1 123.4 528 192.5 528Z" },
  'a': { ch: 'a', black: "M84.4 486.7C168.2 527.1 187.9 528 264 528C322.5 528 370 480.5 370 422C370 309.3 370 196.7 370 84C370 61.9 352.1 44 330 44C305.8 44 305 11.7 286 6C243.5 -6.8 214.2 -7 155.4 -7C69.6 -7 0 63.3 0 150C0 224.6 52.8 285 118 285C198.6 285 264 310.9 264 342.8C264 348.8 264 354.8 264 360.7C264 402.8 229.9 436.8 187.9 436.8C156.9 436.8 133.5 433 103.9 423.8C86.5 418.4 68.1 428.2 62.7 445.5C57.4 462.8 68 478.8 84.4 486.7ZM106 143.2C106 96.6 144.5 58.7 191.9 58.7C239.3 58.7 277.8 96.6 277.8 143.2C277.8 189.9 239.3 227.8 191.9 227.8C144.5 227.8 106 189.9 106 143.2Z", regular: "M70.9 498.5C186.5 532.9 194.4 528 293.2 528C335.6 528 370 493.6 370 451.2C370 328.8 370 206.4 370 84C370 61.9 352.1 44 330 44C305.8 44 305 11.7 286 6C243.5 -6.8 214.2 -7 155.4 -7C69.6 -7 0 63.3 0 150C0 224.6 52.8 285 118 285C227.9 285 317 296.4 317 326.9C317 345.4 317 363.8 317 382.3C317 442.7 268 491.7 207.5 491.7C163 491.7 119.8 485.7 76.3 475.5C70 474 63.6 477.9 62.2 484.3C60.7 490.6 64.7 496.6 70.9 498.5ZM58.3 142.1C58.3 74.5 115.6 19.7 186.3 19.7C257 19.7 314.3 74.5 314.3 142.1C314.3 209.7 257 264.5 186.3 264.5C115.6 264.5 58.3 209.7 58.3 142.1Z" },
  'b': { ch: 'b', black: "M106 721.3C106 669.5 106 617.7 106 565.8C106 528.3 163.8 528 181.7 528C203.8 528 225.9 528 248 528C320.3 528 379 469.3 379 397C379 306 379 215 379 124C379 51.7 320.3 -7 248 -7C212.7 -7 227.3 -7 192 -7C139.7 -7 122.2 29 106 29C86.2 29 86.2 -7 70 -7C57.2 -7 44.5 -7 31.8 -7C14.2 -7 0 7.2 0 24.8C0 242.8 0 460.9 0 678.9C0 705.2 16.3 720.5 34.1 726.6C48.7 731.5 63.3 736.5 77.9 741.4C92.6 746.4 106 732.4 106 721.3ZM106 152.8C106 106.7 143.4 69.3 189.5 69.3C189.5 69.3 189.5 69.3 189.5 69.3C235.6 69.3 273 106.7 273 152.8C273 224.6 273 296.4 273 368.2C273 414.3 235.6 451.7 189.5 451.7C189.5 451.7 189.5 451.7 189.5 451.7C143.4 451.7 106 414.3 106 368.2C106 296.4 106 224.6 106 152.8Z", regular: "M53 736.2C53 673.1 53 610 53 546.9C53 524.3 81.9 528 90.8 528C134.7 528 178.6 528 222.5 528C308.9 528 379 457.9 379 371.5C379 297.5 379 223.5 379 149.5C379 63.1 308.9 -7 222.5 -7C172 -7 171.5 -7 121 -7C80.2 -7 61.1 11 53 11C43.1 11 43.1 -7 35 -7C28.6 -7 22.3 -7 15.9 -7C7.1 -7 0 0.1 0 8.9C0 244.3 0 479.6 0 715C0 728.1 8.1 735.7 17.1 738.8C24.4 741.3 31.7 743.7 38.9 746.2C46.3 748.7 53 741.7 53 736.2ZM53 156.8C53 81.4 114.1 20.3 189.5 20.3C189.5 20.3 189.5 20.3 189.5 20.3C264.9 20.3 326 81.4 326 156.8C326 225.9 326 295.1 326 364.2C326 439.6 264.9 500.7 189.5 500.7C189.5 500.7 189.5 500.7 189.5 500.7C114.1 500.7 53 439.6 53 364.2C53 295.1 53 225.9 53 156.8Z" },
  'h': { ch: 'h', black: "M106 721.3C106 667.6 106 613.9 106 560.2C106 510.5 120.3 470.1 138 470.1C173.9 470.1 178.4 528 258.5 528C325.1 528 379 474.1 379 407.5C379 282.3 379 157 379 31.8C379 14.2 364.8 0 347.2 0C333.1 0 318.9 0 304.8 0C287.2 0 273 14.2 273 31.8C273 143.9 273 256.1 273 368.2C273 414.3 235.6 451.7 189.5 451.7C143.4 451.7 106 414.3 106 368.2C106 256.1 106 143.9 106 31.8C106 14.2 91.8 0 74.2 0C60.1 0 45.9 0 31.8 0C14.2 0 0 14.2 0 31.8C0 247.5 0 463.2 0 678.9C0 705.2 16.3 720.5 34.1 726.6C48.7 731.5 63.3 736.5 77.9 741.4C92.6 746.4 106 732.4 106 721.3Z", regular: "M53 736.2C53 671 53 605.8 53 540.6C53 515.7 67.3 495.6 85 495.6C135.5 495.6 140 528 232 528C313.2 528 379 462.2 379 381C379 259.3 379 137.6 379 15.9C379 7.1 371.9 0 363.1 0C356 0 349 0 341.9 0C333.1 0 326 7.1 326 15.9C326 132 326 248.1 326 364.2C326 439.6 264.9 500.7 189.5 500.7C114.1 500.7 53 439.6 53 364.2C53 248.1 53 132 53 15.9C53 7.1 45.9 0 37.1 0C30 0 23 0 15.9 0C7.1 0 0 7.1 0 15.9C0 248.9 0 481.9 0 715C0 728.1 8.1 735.7 17.1 738.8C24.4 741.3 31.7 743.7 38.9 746.2C46.3 748.7 53 741.7 53 736.2Z" },
  'p': { ch: 'p', black: "M106 -200.3C106 -148.5 106 -96.7 106 -44.8C106 -3.5 163.8 -7 181.7 -7C203.8 -7 225.9 -7 248 -7C320.3 -7 379 51.7 379 124C379 215 379 306 379 397C379 469.3 320.3 528 248 528C212.7 528 227.3 528 192 528C128.6 528 122.2 492 106 492C86.2 492 86.2 528 70 528C57.2 528 44.5 528 31.8 528C14.2 528 0 513.8 0 496.2C0 278.2 0 60.1 0 -157.9C0 -184.2 16.3 -199.5 34.1 -205.6C48.7 -210.5 63.3 -215.5 77.9 -220.4C92.6 -225.4 106 -211.4 106 -200.3ZM106 368.2C106 414.3 143.4 451.7 189.5 451.7C189.5 451.7 189.5 451.7 189.5 451.7C235.6 451.7 273 414.3 273 368.2C273 296.4 273 224.6 273 152.8C273 106.7 235.6 69.3 189.5 69.3C189.5 69.3 189.5 69.3 189.5 69.3C143.4 69.3 106 106.7 106 152.8C106 224.6 106 296.4 106 368.2Z", regular: "M53 -215.2C53 -152.1 53 -89 53 -25.9C53 -7.6 81.9 -7 90.8 -7C134.7 -7 178.6 -7 222.5 -7C308.9 -7 379 63.1 379 149.5C379 223.5 379 297.5 379 371.5C379 457.9 308.9 528 222.5 528C172 528 171.5 528 121 528C81.1 528 61.1 510 53 510C43.1 510 43.1 528 35 528C28.6 528 22.3 528 15.9 528C7.1 528 0 520.9 0 512.1C0 276.7 0 41.4 0 -194C0 -207.1 8.1 -214.7 17.1 -217.8C24.4 -220.3 31.7 -222.7 38.9 -225.2C46.3 -227.7 53 -220.7 53 -215.2ZM53 364.2C53 439.6 114.1 500.7 189.5 500.7C189.5 500.7 189.5 500.7 189.5 500.7C264.9 500.7 326 439.6 326 364.2C326 295.1 326 225.9 326 156.8C326 81.4 264.9 20.3 189.5 20.3C189.5 20.3 189.5 20.3 189.5 20.3C114.1 20.3 53 81.4 53 156.8C53 225.9 53 295.1 53 364.2Z" },
  'd': { ch: 'd', black: "M273 721.3C273 669.5 273 617.7 273 565.8C273 528 215.2 528 197.3 528C175.2 528 153.1 528 131 528C58.7 528 0 469.3 0 397C0 306 0 215 0 124C0 51.7 58.7 -7 131 -7C166.3 -7 151.7 -7 187 -7C241.4 -7 256.8 29 273 29C292.8 29 292.8 -7 309 -7C321.8 -7 334.5 -7 347.2 -7C364.8 -7 379 7.2 379 24.8C379 242.8 379 460.9 379 678.9C379 705.2 362.7 720.5 344.9 726.6C330.3 731.5 315.7 736.5 301.1 741.4C286.4 746.4 273 732.4 273 721.3ZM273 152.8C273 106.7 235.6 69.3 189.5 69.3C189.5 69.3 189.5 69.3 189.5 69.3C143.4 69.3 106 106.7 106 152.8C106 224.6 106 296.4 106 368.2C106 414.3 143.4 451.7 189.5 451.7C189.5 451.7 189.5 451.7 189.5 451.7C235.6 451.7 273 414.3 273 368.2C273 296.4 273 224.6 273 152.8Z", regular: "M326 736.2C326 673.1 326 610 326 546.9C326 541.2 319.2 528 288.2 528C244.3 528 200.4 528 156.5 528C70.1 528 0 457.9 0 371.5C0 297.5 0 223.5 0 149.5C0 63.1 70.1 -7 156.5 -7C207 -7 207.5 -7 258 -7C304 -7 317.9 11 326 11C335.9 11 335.9 -7 344 -7C350.4 -7 356.7 -7 363.1 -7C371.9 -7 379 0.1 379 8.9C379 244.3 379 479.6 379 715C379 728.1 370.9 735.7 361.9 738.8C354.6 741.3 347.3 743.7 340.1 746.2C332.7 748.7 326 741.7 326 736.2ZM326 156.8C326 81.4 264.9 20.3 189.5 20.3C189.5 20.3 189.5 20.3 189.5 20.3C114.1 20.3 53 81.4 53 156.8C53 225.9 53 295.1 53 364.2C53 439.6 114.1 500.7 189.5 500.7C189.5 500.7 189.5 500.7 189.5 500.7C264.9 500.7 326 439.6 326 364.2C326 295.1 326 225.9 326 156.8Z" },
  'q': { ch: 'q', black: "M273 -200.3C273 -148.5 273 -96.7 273 -44.8C273 -9.8 215.2 -7 197.3 -7C175.2 -7 153.1 -7 131 -7C58.7 -7 0 51.7 0 124C0 215 0 306 0 397C0 469.3 58.7 528 131 528C166.3 528 151.7 528 187 528C241.4 528 256.8 492 273 492C292.8 492 292.8 528 309 528C321.8 528 334.5 528 347.2 528C364.8 528 379 513.8 379 496.2C379 278.2 379 60.1 379 -157.9C379 -184.2 362.7 -199.5 344.9 -205.6C330.3 -210.5 315.7 -215.5 301.1 -220.4C286.4 -225.4 273 -211.4 273 -200.3ZM273 368.2C273 414.3 235.6 451.7 189.5 451.7C189.5 451.7 189.5 451.7 189.5 451.7C143.4 451.7 106 414.3 106 368.2C106 296.4 106 224.6 106 152.8C106 106.7 143.4 69.3 189.5 69.3C189.5 69.3 189.5 69.3 189.5 69.3C235.6 69.3 273 106.7 273 152.8C273 224.6 273 296.4 273 368.2Z", regular: "M326 -215.2C326 -152.1 326 -89 326 -25.9C326 -5.9 297.1 -7 288.2 -7C244.3 -7 200.4 -7 156.5 -7C70.1 -7 0 63.1 0 149.5C0 223.5 0 297.5 0 371.5C0 457.9 70.1 528 156.5 528C207 528 207.5 528 258 528C301.7 528 317.9 510 326 510C335.9 510 335.9 528 344 528C350.4 528 356.7 528 363.1 528C371.9 528 379 520.9 379 512.1C379 276.7 379 41.4 379 -194C379 -207.1 370.9 -214.7 361.9 -217.8C354.6 -220.3 347.3 -222.7 340.1 -225.2C332.7 -227.7 326 -220.7 326 -215.2ZM326 364.2C326 439.6 264.9 500.7 189.5 500.7C189.5 500.7 189.5 500.7 189.5 500.7C114.1 500.7 53 439.6 53 364.2C53 295.1 53 225.9 53 156.8C53 81.4 114.1 20.3 189.5 20.3C189.5 20.3 189.5 20.3 189.5 20.3C264.9 20.3 326 81.4 326 156.8C326 225.9 326 295.1 326 364.2Z" },
  'f': { ch: 'f', black: "M62 575.6C62 672.5 130.3 751 214.5 751C227.2 751 237.4 740.7 237.4 728.1C237.4 717.9 237.4 707.8 237.4 697.6C237.4 684.9 227.2 674.7 214.5 674.7C188.8 674.7 168 641.9 168 601.6C168 582.5 168 563.4 168 544.3C168 531.4 178.4 521 191.3 521C207.4 521 213.5 521 229.6 521C243.1 521 254 510.1 254 496.6C254 487.4 254 478.3 254 469.1C254 455.6 243.1 444.7 229.6 444.7C213.5 444.7 207.4 444.7 191.3 444.7C178.4 444.7 168 434.2 168 421.4C168 291.5 168 161.7 168 31.8C168 14.2 153.8 0 136.2 0C122.1 0 107.9 0 93.8 0C76.2 0 62 14.2 62 31.8C62 161.7 62 291.5 62 421.4C62 434.2 51.6 444.7 38.7 444.7C33.9 444.7 29.2 444.7 24.4 444.7C10.9 444.7 0 455.6 0 469.1C0 478.3 0 487.4 0 496.6C0 510.1 10.9 521 24.4 521C29.2 521 33.9 521 38.7 521C51.6 521 62 531.4 62 544.3C62 554.7 62 565.1 62 575.6Z", regular: "M62 588.3C62 678.2 131.2 751 216.5 751C221 751 224.7 747.3 224.7 742.8C224.7 739.2 224.7 735.5 224.7 731.9C224.7 727.3 221 723.7 216.5 723.7C160.5 723.7 115 674.7 115 614.3C115 587.1 115 559.9 115 532.7C115 526.2 120.2 521 126.7 521C159.4 521 182.2 521 215 521C219.8 521 223.7 517.1 223.7 512.3C223.7 509 223.7 505.7 223.7 502.4C223.7 497.6 219.8 493.7 215 493.7C182.2 493.7 159.4 493.7 126.7 493.7C120.2 493.7 115 488.5 115 482C115 326.6 115 171.3 115 15.9C115 7.1 107.9 0 99.1 0C92 0 85 0 77.9 0C69.1 0 62 7.1 62 15.9C62 171.3 62 326.6 62 482C62 488.5 56.8 493.7 50.3 493.7C36.5 493.7 22.6 493.7 8.7 493.7C3.9 493.7 0 497.6 0 502.4C0 505.7 0 509 0 512.3C0 517.1 3.9 521 8.7 521C22.6 521 36.5 521 50.3 521C56.8 521 62 526.2 62 532.7C62 551.2 62 569.7 62 588.3Z" },
  'i': { ch: 'i', black: "M106 491.3C106 338.1 106 185 106 31.8C106 14.2 91.8 0 74.2 0C60.1 0 45.9 0 31.8 0C14.2 0 0 14.2 0 31.8C0 170.8 0 309.9 0 448.9C0 475.2 16.3 490.5 34.1 496.6C48.7 501.5 63.3 506.5 77.9 511.4C92.6 516.4 106 502.4 106 491.3ZM-11.6 643.2C-11.6 678.9 17.3 707.8 53 707.8C88.7 707.8 117.6 678.8 117.6 643.2C117.6 607.5 88.7 578.6 53 578.6C17.3 578.6 -11.6 607.6 -11.6 643.2Z", regular: "M53 506.2C53 342.7 53 179.3 53 15.9C53 7.1 45.9 0 37.1 0C30 0 23 0 15.9 0C7.1 0 0 7.1 0 15.9C0 172.3 0 328.6 0 485C0 498.1 8.1 505.7 17.1 508.8C24.4 511.3 31.7 513.7 38.9 516.2C46.3 518.7 53 511.7 53 506.2ZM-5.8 615.1C-5.8 632.9 8.7 647.4 26.5 647.4C44.3 647.4 58.8 632.9 58.8 615.1C58.8 597.3 44.3 582.8 26.5 582.8C8.7 582.8 -5.8 597.3 -5.8 615.1Z" },
  'j': { ch: 'j', black: "M202 491.3C202 314.2 202 137.1 202 -40C202 -144.9 121.8 -230 22.9 -230C10.3 -230 0 -219.7 0 -207.1C0 -196.9 0 -186.8 0 -176.6C0 -163.9 10.3 -153.7 22.9 -153.7C63.3 -153.7 96 -121.5 96 -81.8C96 95.1 96 272 96 448.9C96 475.2 112.3 490.5 130.1 496.6C144.7 501.5 159.3 506.5 173.9 511.4C188.6 516.4 202 502.4 202 491.3ZM84.4 643.2C84.4 678.9 113.3 707.8 149 707.8C184.7 707.8 213.6 678.8 213.6 643.2C213.6 607.5 184.7 578.6 149 578.6C113.3 578.6 84.4 607.6 84.4 643.2Z", regular: "M149 506.2C149 324.1 149 142.1 149 -40C149 -144.9 86 -230 8.2 -230C3.7 -230 0 -226.3 0 -221.8C0 -218.2 0 -214.5 0 -210.9C0 -206.3 3.7 -202.7 8.2 -202.7C56.7 -202.7 96 -148.6 96 -81.8C96 107.1 96 296 96 485C96 498.1 104.1 505.7 113.1 508.8C120.4 511.3 127.7 513.7 134.9 516.2C142.3 518.7 149 511.7 149 506.2ZM90.2 615.1C90.2 632.9 104.7 647.4 122.5 647.4C140.3 647.4 154.8 632.9 154.8 615.1C154.8 597.3 140.3 582.8 122.5 582.8C104.7 582.8 90.2 597.3 90.2 615.1Z" }
};
function makeMaster(bd, rd) {
  const lit = bd.split(/-?[\d.]+/), bn = bd.match(/-?[\d.]+/g).map(Number), rn = rd.match(/-?[\d.]+/g).map(Number);
  return s => {
    const t = Math.max(0, Math.min(1, (s - 53) / 53));
    let out = lit[0];
    for (let i = 0; i < bn.length; i++) out += fx(rn[i] + (bn[i] - rn[i]) * t) + lit[i + 1];
    return out;
  };
}
// The rules as written, kept before the drawn masters overwrite them: the Studio's Compare
// tool shows them, and an import in one weight builds the other master from them.
const RULES = { ...BUILD };
Object.keys(MASTERS).forEach(n => { BUILD[MASTERS[n].ch] = makeMaster(MASTERS[n].black, MASTERS[n].regular); });
const CHARSET = 'a b c d e f g h i j k l m n o p q r s t u v w x y z · B · ! . ,';
const ORDER = 'abcdefghijklmnopqrstuvwxyzB!.,';
// the grid the returned SVGs were drawn on — section 08 still maps their cells
const ORDER_V1 = 'abcdefghijkmnopqrstuvwxyzB0123456789!.,';
function layout(str, s, noKern) {
  const sb = bearing(s), kS = 0.40 + 0.32 * s / 106;
  let cur = 0, prev = null;
  const glyphs = [], pairs = [];
  for (const ch of str) {
    if (ch === ' ') { cur += 4.0 * sb; prev = null; continue; }
    const g = glyph(ch, s);
    if (!g) continue;
    const kv = prev && !noKern ? kernOf(prev + ch) * kS : 0;
    if (prev) { cur += kv; pairs.push({ p: prev + ch, k: Math.round(kv) }); }
    glyphs.push({ key: ch, d: g.d, tf: `translate(${(cur + g.lsb - g.minX).toFixed(1)},0)` });
    cur += g.lsb + g.w + g.rsb;
    prev = ch;
  }
  return { glyphs, w: Math.round(cur), pairs };
}


// ── Comparing a returned SVG against the generator ───────────────────────────
// Flattens both outlines to point sets and measures the largest distance from either
// curve to the other, so a glyph Illustrator merely re-serialised reads as unchanged.
function flatPath(d) {
  const tk = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, px = 0, py = 0, cmd = '';
  const P = [], num = () => parseFloat(tk[i++]), push = (x, y) => P.push([x, y]);
  const cub = (x1, y1, x2, y2, x, y) => {
    for (let t = 1; t <= 10; t++) {
      const u = t / 10, m = 1 - u;
      push(m*m*m*cx + 3*m*m*u*x1 + 3*m*u*u*x2 + u*u*u*x,
           m*m*m*cy + 3*m*m*u*y1 + 3*m*u*u*y2 + u*u*u*y);
    }
    px = x2; py = y2; cx = x; cy = y;
  };
  while (i < tk.length) {
    if (/[a-zA-Z]/.test(tk[i])) cmd = tk[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    if (C === 'M') { const x = num(), y = num(); cx = rel ? cx + x : x; cy = rel ? cy + y : y; sx = cx; sy = cy; px = cx; py = cy; push(cx, cy); cmd = rel ? 'l' : 'L'; }
    else if (C === 'L') { const x = num(), y = num(); cx = rel ? cx + x : x; cy = rel ? cy + y : y; px = cx; py = cy; push(cx, cy); }
    else if (C === 'H') { const x = num(); cx = rel ? cx + x : x; px = cx; py = cy; push(cx, cy); }
    else if (C === 'V') { const y = num(); cy = rel ? cy + y : y; px = cx; py = cy; push(cx, cy); }
    else if (C === 'C') { const a = num(), b = num(), c = num(), e = num(), f = num(), g = num();
      cub(rel ? cx + a : a, rel ? cy + b : b, rel ? cx + c : c, rel ? cy + e : e, rel ? cx + f : f, rel ? cy + g : g); }
    else if (C === 'S') { const c = num(), e = num(), f = num(), g = num();
      cub(2*cx - px, 2*cy - py, rel ? cx + c : c, rel ? cy + e : e, rel ? cx + f : f, rel ? cy + g : g); }
    else if (C === 'Q') { const a = num(), b = num(), c = num(), e = num();
      const qx = rel ? cx + a : a, qy = rel ? cy + b : b, ex = rel ? cx + c : c, ey = rel ? cy + e : e;
      cub(cx + 2/3*(qx - cx), cy + 2/3*(qy - cy), ex + 2/3*(qx - ex), ey + 2/3*(qy - ey), ex, ey); }
    else if (C === 'Z') { cx = sx; cy = sy; px = cx; py = cy; }
    else i++;
  }
  return P;
}
// Sampling through the browser's own path engine rather than a hand-rolled flattener:
// the returned files are Illustrator's relative-command output and the engine reads them exactly.
function samplePath(d, dx, dy) {
  const ns = 'http://www.w3.org/2000/svg';
  let host = document.getElementById('aqua-measure');
  if (!host) {
    host = document.createElementNS(ns, 'svg');
    host.id = 'aqua-measure';
    host.setAttribute('width', '0'); host.setAttribute('height', '0');
    host.style.position = 'absolute'; host.style.opacity = '0'; host.style.pointerEvents = 'none';
    document.body.appendChild(host);
  }
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', d); host.appendChild(p);
  const L = p.getTotalLength(), N = 320, out = [];
  for (let i = 0; i < N; i++) { const pt = p.getPointAtLength(L * i / N); out.push([pt.x + dx, pt.y + dy]); }
  p.remove();
  return out;
}
function devOneWay(A, B) {
  let mx = 0;
  for (let i = 0; i < A.length; i += 2) {
    const a = A[i]; let best = Infinity;
    for (let j = 0; j < B.length; j++) {
      const dx = a[0] - B[j][0], dy = a[1] - B[j][1], d2 = dx*dx + dy*dy;
      if (d2 < best) best = d2;
    }
    if (best > mx) mx = best;
  }
  return Math.sqrt(mx);
}
function parseExport(stem) {
  const re = /<path id="glyph\.([A-Za-z.]+)" d="([^"]*)"/g, svg = exportSVG(stem), o = {};
  let m; while ((m = re.exec(svg))) o[m[1]] = m[2];
  return o;
}
function cellOrigins(order) {
  const cols = 6, cw = 1150, chh = 1300, o = {};
  order.split('').forEach((ch, i) => {
    o[GNAME[ch] || ch] = { ox: (i % cols) * cw + 90, oy: ((i / cols) | 0) * chh + 1000 };
  });
  return o;
}
// Glyphs you drew in one weight only: the same point-for-point move was carried onto the
// other master, so that weight no longer matches the file it came back in — by design.
const MIRRORED = { c: 'regular', e: 'regular', h: 'regular', y: 'black' };
function buildDiffs(ed) {
  const gen = { black: parseExport(106), regular: parseExport(53) };
  const cells = cellOrigins(ORDER), was = cellOrigins(ORDER_V1), out = [];
  for (const name of Object.keys(ed.black.glyphs)) {
    const cl = cells[name];
    if (!cl) continue; // dropped from the set since that export — the digits
    const w0 = was[name], dx = cl.ox - w0.ox, dy = cl.oy - w0.oy;
    const it = { name, shift: 'translate(' + dx + ',' + dy + ')' };
    let worst = 0;
    for (const k of ['black', 'regular']) {
      const mine = gen[k][name], theirs = ed[k].glyphs[name].d;
      if (!mine) { it[k + 'Mine'] = ''; it[k + 'Theirs'] = theirs; it[k + 'DevLabel'] = 'new glyph'; worst = 999; continue; }
      const A = samplePath(mine, 0, 0), B = samplePath(theirs, dx, dy);
      const dv = Math.max(devOneWay(A, B), devOneWay(B, A));
      it[k + 'Mine'] = mine; it[k + 'Theirs'] = theirs;
      if (MIRRORED[name] === k) { it[k + 'DevLabel'] = 'carried over from the weight you drew'; continue; }
      it[k + 'DevLabel'] = dv < 2 ? 'unchanged' : Math.round(dv) + 'u moved';
      worst = Math.max(worst, dv);
    }
    it.dev = Math.round(worst);
    it.devLabel = worst < 2 ? 'identical' : Math.round(worst) + 'u';
    it.vb = (cl.ox - 150) + ' ' + (cl.oy - 830) + ' 780 1130';
    if (worst >= 2 || MIRRORED[name]) out.push(it);
  }
  out.sort((a, b) => b.dev - a.dev);
  return out;
}

// ── The document: edits laid over the typeface ────────────────────────────────
// The Studio edits without touching this file. Its document is:
//   { glyphs: { [ch]: { use: 0, variants: [{ name, light: { [node]: { d: [dx, dy], r } },
//                                                     black: { ... } }] } },
//     masters: { [ch]: { black, regular } } }          // drawings brought in from SVG
// A node edit moves the on-curve point and its two handles by d, and scales those handles
// about the point by r (roundness). Light and Black each hold their own; any weight in
// between blends them, so an edit made "in both weights" holds across the axis.
// tools/bake_edits.mjs writes a document into this file for good.
const BAKED = { glyphs: {}, masters: {}, spacing: {} };
let DOC = { glyphs: {}, masters: {}, spacing: null, newGlyphs: null, extra: null };
function setDoc(doc) { DOC = { glyphs: (doc && doc.glyphs) || {}, masters: (doc && doc.masters) || {}, spacing: (doc && doc.spacing) || null, newGlyphs: (doc && doc.newGlyphs) || null, extra: (doc && doc.extra) || null }; }
function getDoc() { return DOC; }
const fxp = v => fx(v);
function serializePath(subs) {
  let out = '';
  for (const sub of subs) {
    if (!sub.length) continue;
    out += `M${fxp(sub[0][0][0])} ${fxp(sub[0][0][1])}`;
    for (const [, c1, c2, p3, kind] of sub) {
      out += kind === 'L' ? `L${fxp(p3[0])} ${fxp(p3[1])}`
        : `C${fxp(c1[0])} ${fxp(c1[1])} ${fxp(c2[0])} ${fxp(c2[1])} ${fxp(p3[0])} ${fxp(p3[1])}`;
    }
    out += 'Z';
  }
  return out;
}
// The two drawn weights of a glyph as the axis sees them now: an imported drawing, the
// MASTERS entry, or the rules built at 53 and 106. Both come back through one serializer,
// so makeMaster can pair them.
function masterPair(ch) {
  const m = DOC.masters[ch] || BAKED.masters[ch];
  if (m) return { black: m.black, regular: m.regular, source: m.source || 'imported' };
  for (const n in MASTERS) if (MASTERS[n].ch === ch) return { black: MASTERS[n].black, regular: MASTERS[n].regular, source: 'drawn' };
  const at = s => ch === 'g' ? offsetPath(REF22, Math.max(0, (107.4 - s) / 2.09), true) : RULES[ch] ? (POLISH.has(ch) ? polishPath(ch, RULES[ch](s), () => RULES[ch](106)) : RULES[ch](s)) : null;
  const b = at(106), r = at(53);
  return b && r ? { black: serializePath(parsePath(b)), regular: serializePath(parsePath(r)), source: ch === 'g' ? 'offset' : 'rules' } : null;
}
const masterFns = {};
function basePath(ch, s) {
  const ng = newGlyphFor(ch); if (ng) return dropsOutline(ng, s);
  const m = DOC.masters[ch] || BAKED.masters[ch];
  if (m) {
    const key = m.black + '\u0000' + m.regular;
    if (!masterFns[key]) masterFns[key] = makeMaster(m.black, m.regular);
    return masterFns[key](s);
  }
  if (ch === 'g') return offsetPath(REF22, Math.max(0, (107.4 - s) / 2.09), true);
  if (!BUILD[ch]) return null;
  const d = BUILD[ch](s);
  return POLISH.has(ch) ? polishPath(ch, d, () => BUILD[ch](106)) : d;
}
function nodeEdits(ch, variant) {
  const g = DOC.glyphs[ch] || BAKED.glyphs[ch];
  if (!g || !g.variants || !g.variants.length) return null;
  const v = g.variants[variant == null ? (g.use || 0) : variant] || g.variants[0];
  const has = o => o && Object.keys(o).length;
  return has(v.light) || has(v.black) || (v.ops && v.ops.length) ? v : null;
}
// Structural edits shared by both weights: insert a point on a segment (the curve keeps its
// shape — de Casteljau split) or remove a point (its two segments become one). Applied
// before the nudges, identically at every weight, so the point counts stay matched.
function applyOps(subs, ops, t) {
  for (const op of ops || []) {
    if (op.op === 'addsub') {
      // a contour pasted in, given at both weights; here it is blended to this one
      const L = parsePath(op.light), B = parsePath(op.black), tt = t == null ? 1 : t;
      L.forEach((sub, si) => { const bsub = B[si] || sub; subs.push(sub.map((sg, j) => { const bg = bsub[j] || sg; return [0, 1, 2, 3].map(k => [sg[k][0] + (bg[k][0] - sg[k][0]) * tt, sg[k][1] + (bg[k][1] - sg[k][1]) * tt]).concat([sg[4]]); })); });
      continue;
    }
    if (op.op === 'insert') {
      const sub = subs[op.sub]; if (!sub || !sub[op.seg]) continue;
      const [p0, c1, c2, p3, k] = sub[op.seg], t = Math.max(0.05, Math.min(0.95, op.t)), u = 1 - t;
      const L = (a, b) => [a[0] * u + b[0] * t, a[1] * u + b[1] * t];
      const q0 = L(p0, c1), q1 = L(c1, c2), q2 = L(c2, p3), r0 = L(q0, q1), r1 = L(q1, q2), m = L(r0, r1);
      if (k === 'L') sub.splice(op.seg, 1, [p0, L(p0, [p0[0] + (m[0] - p0[0]) / 3, p0[1] + (m[1] - p0[1]) / 3]), [p0[0] + 2 * (m[0] - p0[0]) / 3, p0[1] + 2 * (m[1] - p0[1]) / 3], m, 'L'], [m, [m[0] + (p3[0] - m[0]) / 3, m[1] + (p3[1] - m[1]) / 3], [m[0] + 2 * (p3[0] - m[0]) / 3, m[1] + 2 * (p3[1] - m[1]) / 3], p3, 'L']);
      else sub.splice(op.seg, 1, [p0, q0, r0, m, 'C'], [m, r1, q2, p3, 'C']);
    } else if (op.op === 'delete') {
      // global node index → subpath and position
      let i = op.node, si = 0; while (si < subs.length && i >= subs[si].length) { i -= subs[si].length; si++; }
      const sub = subs[si]; if (!sub || sub.length < 3) continue;
      const prev = sub[(i + sub.length - 1) % sub.length], cur = sub[i];
      const merged = [prev[0], prev[1], cur[2], cur[3], prev[4] === 'C' || cur[4] === 'C' ? 'C' : 'L'];
      sub.splice(i, 1); sub[(i + sub.length - 1) % sub.length] = merged;
    }
  }
  return subs;
}
function applyEdits(d, light, black, t, ops) {
  const subs = applyOps(parsePath(d), ops, t);
  const L = light || {}, B = black || {};
  let i = 0;
  for (const sub of subs) {
    const n = sub.length;
    for (let j = 0; j < n; j++, i++) {
      const el = L[i], eb = B[i];
      if (!el && !eb) continue;
      const dl = (el && el.d) || [0, 0], db = (eb && eb.d) || [0, 0];
      const dx = dl[0] + (db[0] - dl[0]) * t, dy = dl[1] + (db[1] - dl[1]) * t;
      const rl = el && el.r != null ? el.r : 1, rb = eb && eb.r != null ? eb.r : 1, r = rl + (rb - rl) * t;
      const cur = sub[j], prev = sub[(j + n - 1) % n];
      const p = cur[0], np = [p[0] + dx, p[1] + dy];
      cur[0] = np; prev[3] = np;
      if (cur[4] === 'C') cur[1] = [np[0] + (cur[1][0] - p[0]) * r, np[1] + (cur[1][1] - p[1]) * r];
      else cur[1] = [np[0] + (cur[3][0] - np[0]) / 3, np[1] + (cur[3][1] - np[1]) / 3];
      if (prev[4] === 'C') prev[2] = [np[0] + (prev[2][0] - p[0]) * r, np[1] + (prev[2][1] - p[1]) * r];
      else prev[2] = [prev[0][0] + 2 * (np[0] - prev[0][0]) / 3, prev[0][1] + 2 * (np[1] - prev[0][1]) / 3];
      if (cur[4] === 'L') cur[2] = [np[0] + 2 * (cur[3][0] - np[0]) / 3, np[1] + 2 * (cur[3][1] - np[1]) / 3];
      if (prev[4] === 'L') prev[1] = [prev[0][0] + (np[0] - prev[0][0]) / 3, prev[0][1] + (np[1] - prev[0][1]) / 3];
    }
  }
  return serializePath(subs);
}
// The outline the Studio, the page and the export all draw: the base at this stem with the
// document's edits laid on. With no edits it is the base string itself, untouched.
function outline(ch, s, variant) {
  const d = basePath(ch, s);
  if (!d) return null;
  if (newGlyphFor(ch)) return d;
  const v = nodeEdits(ch, variant);
  if (!v) return d;
  return applyEdits(d, v.light, v.black, Math.max(0, Math.min(1, (s - 53) / 53)), v.ops);
}
// Where on the outline a point (font units) falls: the nearest segment and its parameter,
// plus the distance — for the Add-point tool.
function nearestOnPath(d, x, y) {
  const subs = parsePath(d); let best = null;
  subs.forEach((sub, si) => sub.forEach(([p0, c1, c2, p3], j) => {
    for (let k = 0; k <= 24; k++) { const t = k / 24, u = 1 - t;
      const px = u*u*u*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*p3[0], py = u*u*u*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*p3[1];
      const dd = Math.hypot(px - x, py - y); if (!best || dd < best.dist) best = { sub: si, seg: j, t, dist: dd, p: [px, py] }; }
  }));
  return best;
}
// Any SVG path (absolute or relative M L H V C S Q T Z; arcs are skipped) → absolute
// M / C / L / Z. Illustrator writes relative commands; this reads them exactly.
function normalizeSVGPath(d) {
  const tk = d.match(/[MmLlHhVvCcSsQqTtZzAa]|[-+]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
  const subs = []; let seg = [], cur = null, start = null, prevC = null, cmd = null, i = 0;
  const num = n => { const v = []; for (let k = 0; k < n; k++) v.push(+tk[i++]); return v; };
  const line = (a, b) => seg.push([a, [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], [a[0] + 2 * (b[0] - a[0]) / 3, a[1] + 2 * (b[1] - a[1]) / 3], b, 'L']);
  const close = () => { if (cur && start && (Math.abs(cur[0] - start[0]) > 1e-6 || Math.abs(cur[1] - start[1]) > 1e-6)) line(cur, start); if (seg.length) subs.push(seg); seg = []; cur = start; prevC = null; };
  while (i < tk.length) {
    if (/[A-Za-z]/.test(tk[i])) { cmd = tk[i++]; if (cmd === 'Z' || cmd === 'z') { close(); continue; } }
    if (cmd == null) { i++; continue; }
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    if (C === 'M') { let [x, y] = num(2); if (rel && cur) { x += cur[0]; y += cur[1]; } if (seg.length) subs.push(seg); seg = []; cur = start = [x, y]; cmd = rel ? 'l' : 'L'; prevC = null; }
    else if (C === 'L') { let [x, y] = num(2); if (rel) { x += cur[0]; y += cur[1]; } line(cur, [x, y]); cur = [x, y]; prevC = null; }
    else if (C === 'H') { let [x] = num(1); if (rel) x += cur[0]; line(cur, [x, cur[1]]); cur = [x, cur[1]]; prevC = null; }
    else if (C === 'V') { let [y] = num(1); if (rel) y += cur[1]; line(cur, [cur[0], y]); cur = [cur[0], y]; prevC = null; }
    else if (C === 'C') { let [x1, y1, x2, y2, x, y] = num(6); if (rel) { x1 += cur[0]; y1 += cur[1]; x2 += cur[0]; y2 += cur[1]; x += cur[0]; y += cur[1]; } seg.push([cur, [x1, y1], [x2, y2], [x, y], 'C']); prevC = [x2, y2]; cur = [x, y]; }
    else if (C === 'S') { let [x2, y2, x, y] = num(4); if (rel) { x2 += cur[0]; y2 += cur[1]; x += cur[0]; y += cur[1]; } const c1 = prevC ? [2 * cur[0] - prevC[0], 2 * cur[1] - prevC[1]] : cur; seg.push([cur, c1, [x2, y2], [x, y], 'C']); prevC = [x2, y2]; cur = [x, y]; }
    else if (C === 'Q' || C === 'T') {
      let qx, qy, x, y;
      if (C === 'Q') { [qx, qy, x, y] = num(4); if (rel) { qx += cur[0]; qy += cur[1]; x += cur[0]; y += cur[1]; } }
      else { [x, y] = num(2); if (rel) { x += cur[0]; y += cur[1]; } [qx, qy] = prevC ? [2 * cur[0] - prevC[0], 2 * cur[1] - prevC[1]] : cur; }
      seg.push([cur, [cur[0] + 2 / 3 * (qx - cur[0]), cur[1] + 2 / 3 * (qy - cur[1])], [x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y)], [x, y], 'C']);
      prevC = [qx, qy]; cur = [x, y];
    }
    else if (C === 'A') { const a = num(7); let x = a[5], y = a[6]; if (rel) { x += cur[0]; y += cur[1]; } line(cur, [x, y]); cur = [x, y]; prevC = null; }
    else i++;
  }
  if (seg.length) subs.push(seg);
  return serializePath(subs);
}
// A sheet path (SVG axis, cell origin ox / oy) → font units, as mapPath does in reverse.
function toFontUnits(d, ox, oy) {
  return serializePath(parsePath(d).map(sub => sub.map(([p0, c1, c2, p3, k]) => [p0, c1, c2, p3].map(p => [p[0] - ox, oy - p[1]]).concat([k]))));
}
function translatePath(d, dx, dy) {
  return serializePath(parsePath(d).map(sub => sub.map(([p0, c1, c2, p3, k]) => [p0, c1, c2, p3].map(p => [p[0] + dx, p[1] + dy]).concat([k]))));
}
// Same point structure? (outline count, pieces per outline, curve-or-line order) — what
// interpolation needs, and what "move points, never add or delete them" protects.
function sameSkeleton(a, b) {
  const A = parsePath(a), B = parsePath(b);
  if (A.length !== B.length) return { ok: false, why: `${A.length} vs ${B.length} outlines` };
  for (let i = 0; i < A.length; i++) {
    if (A[i].length !== B[i].length) return { ok: false, why: `outline ${i + 1} has ${A[i].length} points, the current one ${B[i].length}` };
    for (let j = 0; j < A[i].length; j++) if (A[i][j][4] !== B[i][j][4]) return { ok: false, why: `outline ${i + 1}, point ${j + 1}: a curve where a straight run was, or the reverse` };
  }
  return { ok: true, why: 'ok' };
}

// ── New letters from drops ────────────────────────────────────────────────────
// A new letter is strokes of drops: each stroke a run of points on the tile grid. The engine
// draws a smooth spine through the drops (Catmull-Rom, tension = roundness) and thickens it
// with the family's contrast — full stem where the stroke stands up, thinner where it lies
// down — ending in a round cap (a drop) or a flat cut. Strokes overlap where they meet, so a
// drops letter fills nonzero; the font build unions them.
//   doc.newGlyphs[key] = { ch, name, height: 'small'|'caps'|'tall', thick: 1, ends: 'round'|'flat',
//                          round: 0.5, strokes: [[[x, y], ...], ...], use: true }
const TILE = 40;
function spine(pts, tension) {
  // A smooth spine through the drops: at each drop the tangent runs along the bisector of
  // the two chords and is no longer than the shorter of them (scaled by the roundness), so
  // a sharp corner with unequal drop spacing turns tightly instead of curling into a hook.
  // tension 0 = straight lines, 1 = full curves.
  const n = pts.length; if (n < 2) return [];
  const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const T = pts.map((p, i) => {
    const prev = i > 0 ? pts[i - 1] : null, next = i < n - 1 ? pts[i + 1] : null;
    const lp = prev ? Math.hypot(p[0] - prev[0], p[1] - prev[1]) : 0, ln = next ? Math.hypot(next[0] - p[0], next[1] - p[1]) : 0;
    if (prev && next) { const a = unit([p[0] - prev[0], p[1] - prev[1]]), b = unit([next[0] - p[0], next[1] - p[1]]); const bis = unit([a[0] + b[0], a[1] + b[1]]); const m = 1.5 * tension * Math.min(lp, ln); return Math.hypot(a[0] + b[0], a[1] + b[1]) < 1e-6 ? [0, 0] : [bis[0] * m, bis[1] * m]; }
    if (next) { const b = unit([next[0] - p[0], next[1] - p[1]]); return [b[0] * 1.5 * tension * ln, b[1] * 1.5 * tension * ln]; }
    const a = unit([p[0] - prev[0], p[1] - prev[1]]); return [a[0] * 1.5 * tension * lp, a[1] * 1.5 * tension * lp];
  });
  const segs = [];
  for (let i = 0; i < n - 1; i++) segs.push([pts[i], [pts[i][0] + T[i][0] / 3, pts[i][1] + T[i][1] / 3], [pts[i + 1][0] - T[i + 1][0] / 3, pts[i + 1][1] - T[i + 1][1] / 3], pts[i + 1]]);
  return segs;
}
function spinePath(pts, tension) {
  const f = v => Math.round(v * 10) / 10, segs = spine(pts, tension); if (!segs.length) return '';
  return `M${f(segs[0][0][0])} ${f(segs[0][0][1])}` + segs.map(sg => `C${f(sg[1][0])} ${f(sg[1][1])} ${f(sg[2][0])} ${f(sg[2][1])} ${f(sg[3][0])} ${f(sg[3][1])}`).join('');
}
// N points per spine segment, with the tangent at each: what the stroker thickens and what
// the liquid joins measure.
function spineSamples(segs, N) {
  const B = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]; };
  const Dv = (p0, p1, p2, p3, t) => { const u = 1 - t; return [3*u*u*(p1[0]-p0[0]) + 6*u*t*(p2[0]-p1[0]) + 3*t*t*(p3[0]-p2[0]), 3*u*u*(p1[1]-p0[1]) + 6*u*t*(p2[1]-p1[1]) + 3*t*t*(p3[1]-p2[1])]; };
  const S = [];
  segs.forEach((sg, i) => { for (let j = i ? 1 : 0; j <= N; j++) { const t = j / N; let d = Dv(...sg, t); if (Math.hypot(d[0], d[1]) < 1e-6) d = [sg[3][0] - sg[0][0], sg[3][1] - sg[0][1]]; S.push({ p: B(...sg, t), d }); } });
  return S;
}
function strokeDrops(pts, s, opt) {
  const w = s * (opt.thick || 1), th = 0.72 * w * contrastK(s), N = 6;
  const segs = spine(pts, opt.round == null ? 0.5 : opt.round);
  if (!segs.length) {
    // a single drop: a circle of the stem's width
    const [cx, cy] = pts[0], r = w / 2, kc = 0.5523 * r, f = v => Math.round(v * 10) / 10;
    return `M${f(cx - r)} ${f(cy)}C${f(cx - r)} ${f(cy + kc)} ${f(cx - kc)} ${f(cy + r)} ${f(cx)} ${f(cy + r)}C${f(cx + kc)} ${f(cy + r)} ${f(cx + r)} ${f(cy + kc)} ${f(cx + r)} ${f(cy)}C${f(cx + r)} ${f(cy - kc)} ${f(cx + kc)} ${f(cy - r)} ${f(cx)} ${f(cy - r)}C${f(cx - kc)} ${f(cy - r)} ${f(cx - r)} ${f(cy - kc)} ${f(cx - r)} ${f(cy)}Z`;
  }
  const S = spineSamples(segs, N);
  const width = n => th + (w - th) * Math.abs(n[0]);
  const L = [], R = [];
  const norms = S.map(sm => { const l = Math.hypot(sm.d[0], sm.d[1]) || 1; return [-sm.d[1] / l, sm.d[0] / l]; });
  // the width follows the contrast law, eased along the stroke so a corner does not step
  // from stem to thin in one sample
  const raw = norms.map(n => width(n) / 2), half = raw.map((h, i) => { let sum = 0, k = 0; for (let j = Math.max(0, i - 6); j <= Math.min(raw.length - 1, i + 6); j++) { sum += raw[j]; k++; } return sum / k; });
  S.forEach((sm, i) => { const n = norms[i], h = half[i]; L.push([sm.p[0] + n[0] * h, sm.p[1] + n[1] * h]); R.push([sm.p[0] - n[0] * h, sm.p[1] - n[1] * h]); });
  const f = v => Math.round(v * 10) / 10;
  const cap = (centre, from, to, dir) => {
    // a half circle from `from` round to `to`, bulging in direction dir (unit, along the stroke)
    if (opt.ends === 'flat') return [];
    const r = Math.hypot(to[0] - from[0], to[1] - from[1]) / 2, out = [];
    const a0 = Math.atan2(from[1] - centre[1], from[0] - centre[0]);
    // sweep the short way that passes through centre + dir*r
    const mid = [centre[0] + dir[0] * r, centre[1] + dir[1] * r];
    const a1 = Math.atan2(to[1] - centre[1], to[0] - centre[0]), am = Math.atan2(mid[1] - centre[1], mid[0] - centre[0]);
    let sweep = a1 - a0; while (sweep <= -Math.PI) sweep += 2 * Math.PI; while (sweep > Math.PI) sweep -= 2 * Math.PI;
    let test = am - a0; while (test <= -Math.PI) test += 2 * Math.PI; while (test > Math.PI) test -= 2 * Math.PI;
    if (Math.sign(test) !== Math.sign(sweep)) sweep = sweep - Math.sign(sweep) * 2 * Math.PI;
    for (let i = 1; i < 8; i++) { const a = a0 + sweep * i / 8; out.push([centre[0] + r * Math.cos(a), centre[1] + r * Math.sin(a)]); }
    return out;
  };
  const first = S[0], last = S[S.length - 1];
  const dEnd = (() => { const l = Math.hypot(last.d[0], last.d[1]) || 1; return [last.d[0] / l, last.d[1] / l]; })();
  const dStart = (() => { const l = Math.hypot(first.d[0], first.d[1]) || 1; return [-first.d[0] / l, -first.d[1] / l]; })();
  const ring = [...L, ...cap(last.p, L[L.length - 1], R[R.length - 1], dEnd), ...R.slice().reverse(), ...cap(first.p, R[0], L[0], dStart)];
  // At a sharp turn the inner side folds over itself and the ring crosses. Where it does,
  // the smaller loop is gathered onto the crossing point — the true corner — so the outline
  // never crosses itself and every weight keeps the same number of points.
  const n = ring.length;
  for (let pass = 0; pass < 12; pass++) {
    let found = null;
    for (let i = 0; i < n && !found; i++) {
      const a = ring[i], b = ring[(i + 1) % n];
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const c = ring[j], d = ring[(j + 1) % n];
        const den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]); if (Math.abs(den) < 1e-9) continue;
        const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den, u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den;
        if (t > 1e-6 && t < 1 - 1e-6 && u > 1e-6 && u < 1 - 1e-6) { found = { i, j, x: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])] }; break; }
      }
    }
    if (!found) break;
    const { i, j, x } = found, inner = j - i, outer = n - inner;
    if (inner <= outer) { for (let k = i + 1; k <= j; k++) ring[k] = x; }
    else { for (let k = j + 1; k < n; k++) ring[k] = x; for (let k = 0; k <= i; k++) ring[k] = x; }
  }
  let d = `M${f(ring[0][0])} ${f(ring[0][1])}`;
  for (let i = 1; i < ring.length; i++) d += `L${f(ring[i][0])} ${f(ring[i][1])}`;
  return d + 'Z';
}
function newGlyphs() { return DOC.newGlyphs || {}; }
function newGlyphFor(ch) { const all = newGlyphs(); for (const k in all) if (all[k].ch === ch && all[k].use !== false) return all[k]; return null; }
// ── Liquid joins ──────────────────────────────────────────────────────────────
// Where one stroke meets another, the union of two round strokes leaves a sharp notch on
// each side. Water would not: it webs the corner. Every junction is found on the spines —
// a stroke's end lying on another stroke, or two strokes crossing — and each notch between
// two adjacent arms gets a web: a patch bounded by the two edges and a fillet tangent to
// both, its radius a share of the thinner arm's half-width at that weight, so it grows with
// the weight as a meniscus would. Junctions come from the spines, which do not depend on the
// weight, so every weight gets the same webs and the outline keeps its point count. A stroke
// that ends within reach of another is stretched onto it, so the join never opens up at Light.
const unitV = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
function junctions(g) {
  const tension = g.round == null ? 0.5 : g.round, reach = TILE * 1.6;
  const strokes = (g.strokes || []).filter(st => st.length > 1);
  const S = strokes.map(st => spineSamples(spine(st, tension), 6));
  const out = [], seen = [];
  // one junction per place per pair of strokes: the other end of an end-to-end corner, or a
  // crossing right on top of an end, is the same junction seen again
  const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < TILE * 0.75;
  const dup = (J, a, b) => seen.some(q => near(q.J, J) && q.a === Math.min(a, b) && q.b === Math.max(a, b));
  const note = (J, a, b) => seen.push({ J, a: Math.min(a, b), b: Math.max(a, b) });
  // how far a spine runs on from a point on it (segment k, fraction t), each way
  const cum = S.map(sa => { const c = [0]; for (let k = 1; k < sa.length; k++) c.push(c[k - 1] + Math.hypot(sa[k].p[0] - sa[k - 1].p[0], sa[k].p[1] - sa[k - 1].p[1])); return c; });
  const runs = (b, k, t) => { const c = cum[b], at = c[k] + (c[k + 1] - c[k]) * t; return [at, c[c.length - 1] - at]; };
  // arms around a junction point: [direction away from the point, stroke index]
  strokes.forEach((st, a) => { for (const end of [0, 1]) {
    const sa = S[a], sm = end ? sa[sa.length - 1] : sa[0];
    // the closest point of any other spine, segment by segment
    let best = null;
    strokes.forEach((sb, b) => { if (b === a) return;
      for (let k = 0; k + 1 < S[b].length; k++) {
        const p = S[b][k].p, q = S[b][k + 1].p, vx = q[0] - p[0], vy = q[1] - p[1], l2 = vx * vx + vy * vy || 1;
        const t = Math.max(0, Math.min(1, ((sm.p[0] - p[0]) * vx + (sm.p[1] - p[1]) * vy) / l2));
        const x = [p[0] + vx * t, p[1] + vy * t], dist = Math.hypot(x[0] - sm.p[0], x[1] - sm.p[1]);
        if (dist < reach && (!best || dist < best.dist)) best = { b, k, t, dist, x };
      } });
    if (!best) continue;
    const sb = S[best.b], J = best.x;
    if (dup(J, a, best.b)) continue;
    note(J, a, best.b);
    const arms = [{ d: unitV(end ? [-sm.d[0], -sm.d[1]] : sm.d), s: a }];
    const d0 = sb[best.k].d, d1 = sb[best.k + 1].d, uB = unitV([d0[0] + (d1[0] - d0[0]) * best.t, d0[1] + (d1[1] - d0[1]) * best.t]);
    // an arm of the other stroke counts only if it runs on for a while: the tail end of an
    // arc that overlaps the next arc is not an arm
    const [before, after] = runs(best.b, best.k, best.t);
    if (before > TILE * 0.75) arms.push({ d: [-uB[0], -uB[1]], s: best.b });
    if (after > TILE * 0.75) arms.push({ d: uB, s: best.b });
    if (arms.length < 2) continue;
    out.push({ J, arms, stretch: [a, end, J] });
  } });
  const ends = strokes.map((st, a) => [S[a][0].p, S[a][S[a].length - 1].p]);
  // crossings: a segment of one spine cutting a segment of another
  strokes.forEach((sa, a) => strokes.forEach((sb, b) => { if (b <= a) return;
    for (let i = 0; i + 1 < S[a].length; i++) for (let j = 0; j + 1 < S[b].length; j++) {
      const p = S[a][i].p, q = S[a][i + 1].p, r = S[b][j].p, t = S[b][j + 1].p;
      const den = (q[0] - p[0]) * (t[1] - r[1]) - (q[1] - p[1]) * (t[0] - r[0]); if (Math.abs(den) < 1e-9) continue;
      const u = ((r[0] - p[0]) * (t[1] - r[1]) - (r[1] - p[1]) * (t[0] - r[0])) / den, v = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / den;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const J = [p[0] + u * (q[0] - p[0]), p[1] + u * (q[1] - p[1])];
      if (dup(J, a, b)) continue;
      // a crossing right at a stroke's end is that end's junction, found above
      if ([...ends[a], ...ends[b]].some(e => Math.hypot(e[0] - J[0], e[1] - J[1]) < reach)) continue;
      note(J, a, b);
      const dA = unitV(S[a][i].d), dB = unitV(S[b][j].d);
      out.push({ J, arms: [{ d: dA, s: a }, { d: [-dA[0], -dA[1]], s: a }, { d: dB, s: b }, { d: [-dB[0], -dB[1]], s: b }] });
    } }));
  return out;
}
function webs(g, s) {
  const f = v => Math.round(v * 10) / 10;
  const halfAt = st => { const w = st * (g.thick || 1), th = 0.72 * w * contrastK(st); return u => (th + (w - th) * Math.abs(u[1])) / 2; };
  const half = halfAt(s), halfRef = halfAt(106);
  // the corner where the edge of P facing Q meets the edge of Q facing P
  const cornerOf = (J, P, Q, hP, hQ) => {
    const nP = [-P.d[1], P.d[0]], nQ = [Q.d[1], -Q.d[0]];
    const rx = nQ[0] * hQ - nP[0] * hP, ry = nQ[1] * hQ - nP[1] * hP;
    const den = P.d[0] * (-Q.d[1]) - P.d[1] * (-Q.d[0]); if (Math.abs(den) < 1e-9) return null;
    const t1 = (rx * (-Q.d[1]) - ry * (-Q.d[0])) / den;
    return [J[0] + P.d[0] * t1 + nP[0] * hP, J[1] + P.d[1] * t1 + nP[1] * hP];
  };
  const out = [];
  for (const jn of junctions(g)) {
    const arms = jn.arms.map(a => ({ ...a, ang: Math.atan2(a.d[1], a.d[0]) })).sort((a, b) => a.ang - b.ang);
    for (let i = 0; i < arms.length; i++) {
      const P = arms[i], Q = arms[(i + 1) % arms.length];
      let phi = Q.ang - P.ang; if (phi <= 0) phi += 2 * Math.PI;
      // no notch when the arms run straight through or nearly along each other (a tangential
      // join is already smooth), and none on the outside of a corner
      if (arms.length < 2 || phi > Math.PI - 0.35 || phi < 0.35) continue;
      // whether the notch is worth a web is judged at Black, so every weight agrees: the
      // corner must sit within three stroke widths of the junction
      const Cref = cornerOf(jn.J, P, Q, halfRef(P.d), halfRef(Q.d)); if (!Cref) continue;
      if (Math.hypot(Cref[0] - jn.J[0], Cref[1] - jn.J[1]) > 3 * Math.max(halfRef(P.d), halfRef(Q.d))) continue;
      P.h = half(P.d); Q.h = half(Q.d);
      const C = cornerOf(jn.J, P, Q, P.h, Q.h); if (!C) continue;
      const r = 0.9 * Math.min(P.h, Q.h), theta = Math.PI - phi, hh = (4 / 3) * Math.tan(theta / 4) * r;
      const Pa = [C[0] + P.d[0] * r, C[1] + P.d[1] * r], Pb = [C[0] + Q.d[0] * r, C[1] + Q.d[1] * r];
      const c1 = [Pb[0] - Q.d[0] * hh, Pb[1] - Q.d[1] * hh], c2 = [Pa[0] - P.d[0] * hh, Pa[1] - P.d[1] * hh];
      out.push(`M${f(Pa[0])} ${f(Pa[1])}L${f(C[0])} ${f(C[1])}L${f(Pb[0])} ${f(Pb[1])}C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(Pa[0])} ${f(Pa[1])}Z`);
    }
  }
  return out;
}
function dropsOutline(g, s) {
  const liquid = g.liquid !== false;
  let strokes = (g.strokes || []).filter(st => st.length);
  if (liquid) {
    // stretch every stroke that ends within reach of another onto it: its end goes to where
    // the round cap's tip lands on the other stroke's far edge, so the join closes at every
    // weight and the cap never pokes out the other side
    const w = s * (g.thick || 1), th = 0.72 * w * contrastK(s), half = u => (th + (w - th) * Math.abs(u[1])) / 2;
    strokes = strokes.map(st => st.slice());
    const live = strokes.filter(st => st.length > 1);
    for (const jn of junctions(g)) if (jn.stretch) {
      const [a, end, J] = jn.stretch, st = live[a]; if (!st) continue;
      const uA = jn.arms[0].d, other = jn.arms.find(x => x.s !== a);
      let reach = 0;
      // the cap is a circle of the stroke's half-width about the end: put the end where that
      // circle just touches the other stroke's far edge from inside
      if (other) { const nB = [-other.d[1], other.d[0]], hB = half(other.d), cos = Math.abs(uA[0] * nB[0] + uA[1] * nB[1]); reach = (hB - half(uA)) / Math.max(0.5, cos); }
      st[end ? st.length - 1 : 0] = [J[0] - uA[0] * reach, J[1] - uA[1] * reach];   // uA points back into the stroke
    }
  }
  const parts = strokes.map(st => strokeDrops(st, s, g));
  if (liquid && parts.length) parts.push(...webs(g, s));
  return parts.length ? parts.join('') : null;
}
// ── Simplify: a traced outline redrawn with few points ────────────────────────
// An outline of hundreds of tiny pieces (the s by rules, a traced drawing) is redrawn the way
// a designer would draw it: a point at every corner and every extreme (top, bottom, left,
// right of each curve), one cubic between them, and more only where one cubic cannot follow
// the shape within the tolerance. The splits are found once, on the Black, and reused index
// for index on the Light, so the two weights come out with the same points in the same order
// and the letter still blends.
function fitOne(pts, u, t1, t2) {
  // one cubic through the run, end tangents given (Schneider's least squares for the handle lengths)
  const n = pts.length, p0 = pts[0], p3 = pts[n - 1];
  let c11 = 0, c12 = 0, c22 = 0, x1 = 0, x2 = 0;
  for (let i = 0; i < n; i++) {
    const t = u[i], s = 1 - t, b1 = 3 * t * s * s, b2 = 3 * t * t * s, b0 = s * s * s, b3 = t * t * t;
    const a1 = [t1[0] * b1, t1[1] * b1], a2 = [t2[0] * b2, t2[1] * b2];
    c11 += a1[0] * a1[0] + a1[1] * a1[1]; c12 += a1[0] * a2[0] + a1[1] * a2[1]; c22 += a2[0] * a2[0] + a2[1] * a2[1];
    const tmp = [pts[i][0] - (p0[0] * (b0 + b1) + p3[0] * (b2 + b3)), pts[i][1] - (p0[1] * (b0 + b1) + p3[1] * (b2 + b3))];
    x1 += a1[0] * tmp[0] + a1[1] * tmp[1]; x2 += a2[0] * tmp[0] + a2[1] * tmp[1];
  }
  const det = c11 * c22 - c12 * c12, dist = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) / 3;
  let al1 = det ? (x1 * c22 - x2 * c12) / det : 0, al2 = det ? (c11 * x2 - c12 * x1) / det : 0;
  if (!(al1 > 1e-6) || !(al2 > 1e-6) || al1 > 4 * dist * 3 || al2 > 4 * dist * 3) { al1 = al2 = dist; }
  al1 = Math.max(al1, 0.45 * dist); al2 = Math.max(al2, 0.45 * dist);
  return [p0, [p0[0] + t1[0] * al1, p0[1] + t1[1] * al1], [p3[0] + t2[0] * al2, p3[1] + t2[1] * al2], p3];
}
const bezAt = (b, t) => { const s = 1 - t; return [s*s*s*b[0][0] + 3*s*s*t*b[1][0] + 3*s*t*t*b[2][0] + t*t*t*b[3][0], s*s*s*b[0][1] + 3*s*s*t*b[1][1] + 3*s*t*t*b[2][1] + t*t*t*b[3][1]]; };
function fitBest(pts, t1, t2, iters) {
  // one cubic through the run: least squares for the handle lengths, then a few Newton steps
  // that move each point's parameter to the nearest place on the curve, and fit again
  const n = pts.length;
  if (n === 2) { const d = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) / 3; return { b: [pts[0], [pts[0][0] + t1[0] * d, pts[0][1] + t1[1] * d], [pts[1][0] + t2[0] * d, pts[1][1] + t2[1] * d], pts[1]], err: 0, at: 1 }; }
  let u = [0]; for (let i = 1; i < n; i++) u.push(u[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = u[n - 1] || 1; u = u.map(v => v / L);
  let bez = fitOne(pts, u, t1, t2), worst = 0, at = (n / 2) | 0;
  const err = () => { worst = 0; for (let i = 1; i < n - 1; i++) { const q = bezAt(bez, u[i]), e = (q[0] - pts[i][0]) ** 2 + (q[1] - pts[i][1]) ** 2; if (e > worst) { worst = e; at = i; } } return Math.sqrt(worst); };
  let e = err();
  for (let it = 0; it < iters; it++) {
    u = u.map((t, i) => { if (i === 0 || i === n - 1) return t; const q = bezAt(bez, t), s = 1 - t;
      const d1 = [3*s*s*(bez[1][0]-bez[0][0]) + 6*s*t*(bez[2][0]-bez[1][0]) + 3*t*t*(bez[3][0]-bez[2][0]), 3*s*s*(bez[1][1]-bez[0][1]) + 6*s*t*(bez[2][1]-bez[1][1]) + 3*t*t*(bez[3][1]-bez[2][1])];
      const d2 = [6*s*(bez[2][0]-2*bez[1][0]+bez[0][0]) + 6*t*(bez[3][0]-2*bez[2][0]+bez[1][0]), 6*s*(bez[2][1]-2*bez[1][1]+bez[0][1]) + 6*t*(bez[3][1]-2*bez[2][1]+bez[1][1])];
      const num = (q[0] - pts[i][0]) * d1[0] + (q[1] - pts[i][1]) * d1[1], den = d1[0] * d1[0] + d1[1] * d1[1] + (q[0] - pts[i][0]) * d2[0] + (q[1] - pts[i][1]) * d2[1];
      const nt = den ? t - num / den : t; return Math.max(u[i - 1] + 1e-4, Math.min(u[i + 1] - 1e-4, nt)); });
    const nb = fitOne(pts, u, t1, t2), old = e, ob = bez; bez = nb; e = err(); if (e > old) { bez = ob; e = old; break; }
  }
  return { b: bez, err: e, at };
}
function fitRun(pts, t1, t2, tol, depth) {
  // fit a run of points; split at the worst point and recurse when one cubic will not do
  const n = pts.length; if (n < 2) return [];
  const f = fitBest(pts, t1, t2, 4);
  if (f.err <= tol || depth > 8 || n < 4) return [{ b: f.b, from: 0, to: n - 1 }];
  const at = Math.max(1, Math.min(n - 2, f.at));
  const tc = unitV([pts[at - 1][0] - pts[at + 1][0], pts[at - 1][1] - pts[at + 1][1]]);
  const left = fitRun(pts.slice(0, at + 1), t1, tc, tol, depth + 1), right = fitRun(pts.slice(at), [-tc[0], -tc[1]], t2, tol, depth + 1);
  return [...left, ...right.map(r => ({ b: r.b, from: r.from + at, to: r.to + at }))];
}
// flatten a subpath into a polyline, K samples per curve, so two weights of the same
// structure line up index for index
function flattenSub(sub, K) {
  const pts = [];
  for (const [p0, c1, c2, p3, k] of sub) {
    if (k === 'L') { pts.push(p0); continue; }
    for (let i = 0; i < K; i++) pts.push(bezAt([p0, c1, c2, p3], i / K));
  }
  return pts;
}
// the direction of a closed polyline over a window of `span` units either side of i
function dirAt(pts, i, span, side) {
  const n = pts.length, walk = step => { let j = i, len = 0; while (len < span) { const k = (j + step + n) % n; len += Math.hypot(pts[k][0] - pts[j][0], pts[k][1] - pts[j][1]); j = k; if (len === 0) break; } return j; };
  if (side < 0) { const a = pts[walk(-1)]; return unitV([pts[i][0] - a[0], pts[i][1] - a[1]]); }
  if (side > 0) { const b = pts[walk(1)]; return unitV([b[0] - pts[i][0], b[1] - pts[i][1]]); }
  const a = pts[walk(-1)], b = pts[walk(1)]; return unitV([b[0] - a[0], b[1] - a[1]]);
}
function isCorner(pts, i, cornerDeg, span = 12) {
  const din = dirAt(pts, i, span, -1), dout = dirAt(pts, i, span, 1);
  return din[0] * dout[0] + din[1] * dout[1] < Math.cos(cornerDeg * Math.PI / 180);
}
function splitsOf(pts, cornerDeg, span) {
  // indices of corners and extremes on a closed polyline: a corner turns sharply within a
  // few units either side; an extreme is where the direction's x or y changes sign
  const n = pts.length, out = new Set();
  for (let i = 0; i < n; i++) {
    if (isCorner(pts, i, cornerDeg, span)) { out.add(i); continue; }
    const e0 = dirAt(pts, i, 6, -1), e1 = dirAt(pts, i, 6, 1);
    if (Math.sign(e0[0]) !== Math.sign(e1[0]) && Math.abs(e0[0]) > 0.03 && Math.abs(e1[0]) > 0.03) out.add(i);   // leftmost / rightmost
    if (Math.sign(e0[1]) !== Math.sign(e1[1]) && Math.abs(e0[1]) > 0.03 && Math.abs(e1[1]) > 0.03) out.add(i);   // top / bottom
  }
  // a corner or extreme found on neighbouring samples is one point: keep the sharpest
  const list = [...out].sort((a, b) => a - b), groups = [];
  for (const i of list) { const g = groups[groups.length - 1]; if (g && i - g[g.length - 1] <= 3) g.push(i); else groups.push([i]); }
  if (groups.length > 1 && groups[0][0] + n - groups[groups.length - 1].slice(-1)[0] <= 3) { groups[0] = [...groups.pop(), ...groups[0]]; }
  const turn = i => { const a = dirAt(pts, i, span || 12, -1), b = dirAt(pts, i, span || 12, 1); return -(a[0] * b[0] + a[1] * b[1]); };
  const keep = groups.map(g => g.reduce((best, i) => turn(i) > turn(best) ? i : best, g[0])).sort((a, b) => a - b);
  return keep.length ? keep : [0];
}
// Simplify one outline (a path string). opts: { tol, corner, K }. Returns { d, plan } where
// plan records every cubic's sample range so the same plan can be replayed on another weight.
function simplifyPath(d, opts = {}, plan) {
  const tol = opts.tol || 1.5, corner = opts.corner || 50, K = opts.K || 8, span = opts.span || 12;
  const subs = parsePath(d), outSubs = [], outPlan = [];
  subs.forEach((sub, si) => {
    const pts = flattenSub(sub, K), n = pts.length;
    if (n < 3 || (opts.onlyLines && !sub.some(sg => sg[4] === 'L'))) { outSubs.push(sub); outPlan.push(null); return; }
    // the tangent of a run's end: one-sided at a corner, through the point elsewhere
    const tanAt = (i, side) => isCorner(pts, i, corner, span) ? dirAt(pts, i, 8, side) : dirAt(pts, i, 8, 0);
    let runs;
    if (plan && plan[si]) runs = plan[si];
    else {
      const sp = splitsOf(pts, corner, span); runs = [];
      for (let k = 0; k < sp.length; k++) {
        const a = sp[k], b = sp[(k + 1) % sp.length], len = ((b - a) + n) % n || n;
        const run = []; for (let i = 0; i <= len; i++) run.push(pts[(a + i) % n]);
        const t1 = tanAt(a, 1), t2 = tanAt(b, -1);
        for (const r of fitRun(run, t1, [-t2[0], -t2[1]], tol, 0)) runs.push([(a + r.from) % n, (a + r.to) % n]);
      }
    }
    // replay: exactly one cubic per run, with the tangents at the run's own ends
    const segs = runs.map(([a, b]) => {
      const len = ((b - a) + n) % n || n, run = []; for (let i = 0; i <= len; i++) run.push(pts[(a + i) % n]);
      const t1 = tanAt(a, 1), t2 = tanAt(b, -1);
      const b4 = fitBest(run, t1, [-t2[0], -t2[1]], 4).b;
      return [b4[0], b4[1], b4[2], b4[3], 'C'];
    });
    outSubs.push(segs); outPlan.push(runs);
  });
  return { d: serializePath(outSubs), plan: outPlan };
}
// Both weights of a letter, simplified to the same structure. Returns { black, regular, points }.
function simplifyPair(ch, opts) {
  const black = outline(ch, 106), light = outline(ch, 53); if (!black || !light) return null;
  const b = simplifyPath(black, opts), l = simplifyPath(light, opts, b.plan);
  const chk = sameSkeleton(b.d, l.d); if (!chk.ok) return null;
  return { black: b.d, regular: l.d, points: parsePath(b.d).reduce((k, s) => k + s.length, 0) };
}
// Characters the rules can already draw but that are not in the set: the digits. A document
// switches them on one by one (doc.extra) and they join the set like any other letter.
function spareChars() { return Object.keys(BUILD).filter(c => !ORDER.includes(c)); }
function extraChars() { const list = DOC.extra || BAKED.extra || []; return list.filter(c => BUILD[c] && !ORDER.includes(c)); }
// Every character the set can draw: the thirty, the rules switched on, then the new letters in use.
function allChars() {
  const out = ORDER.split('');
  for (const c of extraChars()) if (!out.includes(c)) out.push(c);
  for (const k in newGlyphs()) { const g = newGlyphs()[k]; if (g.use !== false && g.ch && !out.includes(g.ch)) out.push(g.ch); }
  return out;
}
function fillRule(ch) { return newGlyphFor(ch) || NONZERO.has(ch) ? 'nonzero' : 'evenodd'; }

// ── Studio-facing helpers ─────────────────────────────────────────────────────
// One entry point per question the Studio asks, so the g / exclam special cases in
// layout() and exportSVG() are stated once more here and nowhere else.
const METRICS = { upm: 1000, baseline: 0, xHeight: 521, xOvershoot: 528, capHeight: 715,
                  ascender: 751, descender: DESC, overshoot: 7, stemMin: 53, stemMax: 106 };
// The family: Light and Black are the two drawn masters (stems 53 and 106). Regular is a
// planned third master near 78; until it is drawn it is a blend of the other two.
// Settled with Fabio 2026-09-19: the thinner drawing (53) is the Light.
const WEIGHTS = [
  { name: 'Light', stem: 53, master: true },
  { name: 'Regular', stem: 78, master: false },
  { name: 'Black', stem: 106, master: true }];
function weightName(s) {
  let best = WEIGHTS[0];
  for (const w of WEIGHTS) if (Math.abs(w.stem - s) < Math.abs(best.stem - s)) best = w;
  return best.stem === s ? best.name : `${best.name}${s < best.stem ? '−' : '+'}`;
}
function bearing(s) { const d = Math.max(0, (107.4 - s) / 2.09); return 47 + 0.28 * d; }
function kindOf(ch) {
  if (newGlyphFor(ch)) return 'drops';
  if (DOC.masters[ch]) return 'drawn';
  if (ch === 'g') return 'offset';
  for (const n in MASTERS) if (MASTERS[n].ch === ch) return 'drawn';
  return BUILD[ch] ? 'parametric' : null;
}
// The glyph as the page lays it out: outline in font units, its left ink edge, its advance
// (w) and both sidebearings at this stem. adv is the full box, lsb + w + rsb.
function glyph(ch, s) {
  const ng = newGlyphFor(ch);
  if (ch !== 'g' && !BUILD[ch] && !ng) return null;
  let w, minX = 0;
  const d = outline(ch, s);
  if (!d) return null;
  if (ng || spacing().fromInk) {
    // room from ink: the box is the drawing's own bounds, whatever the old table said
    const b = bbox(d); minX = b.xmin; w = b.xmax - b.xmin;
  } else if (ch === 'g') {
    const off = Math.max(0, (107.4 - s) / 2.09), c = neckComp(off);
    minX = 42.5 + off * c; w = 427.5 - off - off * c;
  } else if (EXT_W[ch] === 'ink') {
    const b = bbox(d); minX = b.xmin; w = b.xmax - b.xmin;
  } else {
    minX = ch === '!' ? 4 - 0.03 * s : 0;
    w = ch === '!' ? 1.06 * s : glyphWidth(ch, s);
  }
  const sb = bearing(s), cl = ng ? (ng.shape || 'rr') : shapeOf(ch), lsb = sb * SBK[cl[0]], rsb = sb * SBK[cl[1]];
  return { ch, name: ng ? (ng.name || ch) : (GNAME[ch] || ch), kind: kindOf(ch), d, minX, w, lsb, rsb, adv: lsb + w + rsb, stem: s, fill: ng || NONZERO.has(ch) ? 'nonzero' : 'evenodd' };
}
// ── Spacing, with the document's say ──────────────────────────────────────────
// doc.spacing = { fromInk: bool, shape: { [ch]: 'rf' }, kern: { [pair]: units at Black } }.
// A kern override of 0 removes a pair; a pair not in the override table keeps KERN's value.
function spacing() { return DOC.spacing || BAKED.spacing || {}; }
function shapeOf(ch) { const sp = spacing(); return (sp.shape && sp.shape[ch]) || (BAKED.spacing && BAKED.spacing.shape && BAKED.spacing.shape[ch]) || SHAPE[ch] || EXT_SHAPE[ch] || (EXT_BASE[ch] ? shapeOf(EXT_BASE[ch]) : 'ff'); }
function kernOf(pair) {
  const sp = spacing();
  if (sp.kern && pair in sp.kern) return sp.kern[pair];
  if (BAKED.spacing && BAKED.spacing.kern && pair in BAKED.spacing.kern) return BAKED.spacing.kern[pair];
  return KERN[pair] || 0;
}
function kernPairs() {
  const out = {}; for (const k in KERN) out[k] = KERN[k];
  if (BAKED.spacing && BAKED.spacing.kern) for (const k in BAKED.spacing.kern) out[k] = BAKED.spacing.kern[k];
  const sp = spacing(); if (sp.kern) for (const k in sp.kern) out[k] = sp.kern[k];
  for (const k in out) if (!out[k]) delete out[k];
  return out;
}
// Parse an engine path (M / C / L / Z, absolute) into subpaths of cubic segments
// [p0, c1, c2, p3, kind] — lines are lifted to cubics with handles at thirds, kind 'L'.
function parsePath(d) {
  const tk = d.match(/[MCLZ]|-?[\d.]+(?:e[-+]?\d+)?/g) || [];
  const subs = []; let seg = [], cur = null, start = null, i = 0;
  const lift = (a, b) => [a, [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3],
                          [a[0] + 2 * (b[0] - a[0]) / 3, a[1] + 2 * (b[1] - a[1]) / 3], b, 'L'];
  while (i < tk.length) {
    const t = tk[i];
    if (t === 'M') { if (seg.length) subs.push(seg); seg = []; cur = start = [+tk[i+1], +tk[i+2]]; i += 3; }
    else if (t === 'C') { const e = [+tk[i+5], +tk[i+6]]; seg.push([cur, [+tk[i+1], +tk[i+2]], [+tk[i+3], +tk[i+4]], e, 'C']); cur = e; i += 7; }
    else if (t === 'L') { const e = [+tk[i+1], +tk[i+2]]; seg.push(lift(cur, e)); cur = e; i += 3; }
    else if (t === 'Z') {
      if (cur && start && (Math.abs(cur[0] - start[0]) > 1e-6 || Math.abs(cur[1] - start[1]) > 1e-6)) seg.push(lift(cur, start));
      if (seg.length) subs.push(seg); seg = []; cur = start; i++;
    } else i++;
  }
  if (seg.length) subs.push(seg);
  return subs;
}
// Ink bounds of a path, sampled along every curve so an extreme without a node still counts.
function bbox(d) {
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  const see = (x, y) => { if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y; };
  for (const sub of parsePath(d)) for (const [p0, c1, c2, p3] of sub) {
    for (let k = 0; k <= 12; k++) {
      const t = k / 12, m = 1 - t;
      see(m*m*m*p0[0] + 3*m*m*t*c1[0] + 3*m*t*t*c2[0] + t*t*t*p3[0],
          m*m*m*p0[1] + 3*m*m*t*c1[1] + 3*m*t*t*c2[1] + t*t*t*p3[1]);
    }
  }
  return xmin === Infinity ? null : { xmin, xmax, ymin, ymax };
}
// On-curve points of a path (the nodes a designer would drag), per subpath.
function nodes(d) {
  return parsePath(d).map(sub => sub.map(s => s[0]));
}

return {
  METRICS, WEIGHTS, weightName, bearing, kindOf, glyph, parsePath, bbox, nodes, spacing, shapeOf, kernOf, kernPairs,
  TILE, strokeDrops, dropsOutline, spinePath, junctions, webs, simplifyPath, simplifyPair, polishPath, POLISH, NONZERO, EXT_DESC, describeGlyph, CAP, newGlyphs, newGlyphFor, allChars, fillRule, spareChars, extraChars,
  BAKED, setDoc, getDoc, serializePath, masterPair, basePath, applyEdits, applyOps, outline, nearestOnPath,
  normalizeSVGPath, toFontUnits, translatePath, sameSkeleton, RULES,
  SRC, REF22, REF28, thinRatio, contrastK, CONTRAST, SLANT, SL,
  TUCK, NECK_TABLE, neckComp, inNeck, offsetPath, H_PATH, A_PATH, EXCL_PATH,
  WORD, KC, fx, TV, TVd, THr, THl, contour,
  cutTop, foot, arch, buildH, buildA, buildExcl, buildN, buildB,
  buildD, buildU, buildM, buildW, cutBot, corner, isect, nrm,
  strokePath, buildRing, buildO, buildZero, buildOne, buildE, buildS, buildR,
  buildT, buildF, buildI, buildL, buildV, DESC, flipPath, GNAME,
  mapPath, exportSVG, buildP, buildQ, buildC, buildK, buildX, buildY,
  buildJ, buildZ, buildPeriod, buildComma, buildCapB, FIG, figW, ell,
  build2, build3, build4, build5, build6, build9, build7, build8,
  SHAPE, SBK, KERN, glyphWidth, BUILD, MASTERS, makeMaster, CHARSET,
  ORDER, ORDER_V1, layout, flatPath, samplePath, devOneWay, parseExport, cellOrigins,
  MIRRORED, buildDiffs
};
});
