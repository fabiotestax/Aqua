// The six optical laws, as audits. Each looks at a letter's outline at a weight and says in
// plain words what a trained eye would notice — overshoot, the weight illusion, gravity,
// irradiation, crowding at the joins, rhythm. Findings are advisory: they never change a
// drawing, they tell Fabio where to look.
//
// Loads as a classic <script> (window.AquaAudit) and as CommonJS (require). Needs the engine.
(function (root, factory) {
  const E = typeof module === 'object' && module.exports ? require('../aqua/engine.js') : root.AquaEngine;
  const api = factory(E);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AquaAudit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
'use strict';

const LAWS = [
  ['overshoot', 'Overshoot', 'Round and pointed shapes must go past the line to look level with flat ones.'],
  ['weight', 'Weight illusion', 'A horizontal stroke as thick as a vertical one looks heavier; horizontals are drawn thinner.'],
  ['gravity', 'Gravity', 'The upper part of a two-storey letter must be smaller than the lower, or it looks top-heavy.'],
  ['irradiation', 'Irradiation', 'White on black spreads; holes close up at small sizes unless they are big enough.'],
  ['crowding', 'Crowding at joins', 'Where strokes meet, ink piles up and looks darker; joins are thinned on purpose.'],
  ['rhythm', 'Rhythm', 'The gaps between letters should feel even; the target band is 70–85 units.']
];
const XH = 521, ASC = 751, CAP = 715, OV = 7;

// ── geometry helpers ──
function polys(subs, n = 10) {
  return subs.map(sub => {
    const pts = [];
    for (const [p0, c1, c2, p3, k] of sub) {
      const m = k === 'L' ? 1 : n;
      for (let i = 1; i <= m; i++) { const t = i / m, u = 1 - t;
        pts.push([u*u*u*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*p3[1]]); }
    }
    return pts;
  });
}
function crossings(P, axis, v) {   // axis 0: vertical line x=v → y crossings; axis 1: horizontal line y=v → x crossings
  const out = [];
  for (const poly of P) for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const a1 = a[axis], b1 = b[axis];
    if ((a1 > v) !== (b1 > v)) { const t = (v - a1) / (b1 - a1); out.push(a[1 - axis] + t * (b[1 - axis] - a[1 - axis])); }
  }
  return out.sort((x, y) => x - y);
}
function runs(P, axis, v) { const c = crossings(P, axis, v), r = []; for (let i = 0; i + 1 < c.length; i += 2) r.push([c[i], c[i + 1]]); return r; }
function inside(P, x, y) { let c = 0; for (const poly of P) for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; if ((a[1] > y) !== (b[1] > y)) { const xi = a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]); if (x < xi) c++; } } return c % 2 === 1; }
function coverage(P, cx, cy, r) { let n = 0, k = 0; const step = r / 4; for (let x = -r; x <= r; x += step) for (let y = -r; y <= r; y += step) { if (x*x + y*y > r*r) continue; n++; if (inside(P, cx + x, cy + y)) k++; } return n ? k / n : 0; }
function bboxOf(poly) { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const [x, y] of poly) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 }; }
const median = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
const r0 = v => Math.round(v);

// ── the audits ──
function overshoot(ch, s, subs, b) {
  const out = [];
  const nodes = []; subs.forEach((sub, si) => sub.forEach((seg, j) => nodes.push({ p: seg[0], prev: sub[(j + sub.length - 1) % sub.length], next: seg })));
  const extreme = (pick, guideList, word) => {
    const y = pick === 'top' ? b.ymax : b.ymin;
    const at = nodes.filter(n => Math.abs(n.p[1] - y) < 0.6);
    if (!at.length) return;
    // flat = a straight run along the extreme at least 0.4 stem long: a line, or a cubic whose
    // handles lie on the chord. Short sampled pieces (a polyline round) are round.
    const flatSeg = seg => { const [p0, c1, c2, p3, k] = seg; if (Math.abs(p0[1] - y) > 0.6 || Math.abs(p3[1] - y) > 0.6) return false;
      if (Math.abs(p3[0] - p0[0]) < 0.4 * s) return false; return k === 'L' || (Math.abs(c1[1] - y) < 0.6 && Math.abs(c2[1] - y) < 0.6); };
    const flat = at.some(n => flatSeg(n.next) || flatSeg(n.prev));
    const guide = guideList.reduce((g, c) => Math.abs(c.y - y) < Math.abs(g.y - y) ? c : g);
    const d = Math.abs(y - guide.y);
    if (!flat && d < 1.5) out.push({ ok: false, text: `The round ${word} sits exactly on the ${guide.name} line; a round shape needs to go about ${OV} past it to look level.` });
    else if (flat && d > 1.5 && d < 14) out.push({ ok: false, text: `The flat ${word} overshoots the ${guide.name} line by ${r0(d)}; flat shapes should sit on it.` });
    else if (!flat && d >= 1.5 && d < 14) out.push({ ok: true, text: `The round ${word} overshoots the ${guide.name} line by ${r0(d)}.` });
    else if (flat && d < 1.5) out.push({ ok: true, text: `The flat ${word} sits on the ${guide.name} line.` });
  };
  extreme('top', [{ name: 'Small letters', y: XH }, { name: 'Tall letters', y: ASC }, { name: 'Capitals', y: CAP }], 'top');
  extreme('bottom', [{ name: 'Baseline', y: 0 }, { name: 'Tails', y: -230 }], 'bottom');
  return out;
}
function weight(ch, s, P, b) {
  const stems = [], thins = [];
  for (const f of [0.35, 0.5, 0.65]) for (const r of runs(P, 1, XH * f)) { const w = r[1] - r[0]; if (w >= 0.5 * s && w <= 1.6 * s) stems.push(w); }
  // a horizontal is a run whose height holds steady a little to either side; a curve passing
  // through the scan line does not count
  for (const f of [0.3, 0.4, 0.5, 0.6, 0.7]) {
    const x = b.xmin + (b.xmax - b.xmin) * f, dx = 0.12 * s;
    for (const r of runs(P, 0, x)) {
      const h = r[1] - r[0]; if (h < 0.25 * s || h > 1.3 * s) continue;
      const mid = (r[0] + r[1]) / 2;
      const near = [x - dx, x + dx].map(xx => runs(P, 0, xx).find(q => q[0] <= mid && q[1] >= mid));
      // same height AND level edges either side — a diagonal keeps its height but shifts
      if (near.every(q => q && Math.abs((q[1] - q[0]) - h) < 0.15 * h && Math.abs(q[0] - r[0]) < 0.25 * dx && Math.abs(q[1] - r[1]) < 0.25 * dx)) thins.push(h);
    }
  }
  if (!stems.length || !thins.length) return [];
  const v = median(stems), h = Math.min(...thins), ratio = h / v, want = 0.72 * E.contrastK(s);
  if (ratio > 0.92) return [{ ok: false, text: `A horizontal (${r0(h)}) is as thick as the stems (${r0(v)}); at this weight it should be about ${r0(want * v)} or the letter looks heavy across.` }];
  if (ratio < 0.28) return [{ ok: false, text: `A horizontal (${r0(h)}) is very thin against the stems (${r0(v)}); it may drop out at small sizes.` }];
  return [{ ok: true, text: `Horizontals ${r0(h)} against stems ${r0(v)} — thinner, as they should be.` }];
}
function gravity(ch, s, P) {
  if (P.length < 3) return [];
  const boxes = P.map(bboxOf).sort((a, b) => a.w * a.h - b.w * b.h);
  const inner = boxes.slice(0, -1).sort((a, b) => b.y0 - a.y0);   // all but the largest, top first
  const out = [];
  for (let i = 0; i + 1 < inner.length; i++) {
    const up = inner[i], lo = inner[i + 1];
    if (up.y0 < lo.y1 - 5) continue;                               // side by side, not stacked
    const ua = up.w * up.h, la = lo.w * lo.h;
    if (ua >= la * 0.98) out.push({ ok: false, text: `The upper hole (${r0(up.w)} × ${r0(up.h)}) is not smaller than the lower one (${r0(lo.w)} × ${r0(lo.h)}); the letter will look top-heavy.` });
    else out.push({ ok: true, text: `Upper hole ${r0(up.w)} × ${r0(up.h)} over lower ${r0(lo.w)} × ${r0(lo.h)} — the weight sits low, as it should.` });
  }
  return out;
}
function irradiation(ch, s, P) {
  if (P.length < 2) return [];
  const boxes = P.map(bboxOf).sort((a, b) => a.w * a.h - b.w * b.h).slice(0, -1);
  const px = 12, out = [];
  for (const bx of boxes) {
    const m = Math.min(bx.w, bx.h), at = m * px / 1000;
    if (at < 1.5) out.push({ ok: false, text: `A hole in the letter is only ${r0(m)} units across — ${at.toFixed(1)} px at 12 px; in white on black it closes up.` });
    else out.push({ ok: true, text: `Smallest hole ${r0(m)} units (${at.toFixed(1)} px at 12 px) — stays open in negative.` });
  }
  return out.slice(0, 1).concat(out.filter(o => !o.ok).slice(out[0] && !out[0].ok ? 1 : 0));
}
function crowding(ch, s, subs, P) {
  const dark = [];
  const r = 0.9 * s; let i = 0;
  for (const sub of subs) for (const seg of sub) { const c = coverage(P, seg[0][0], seg[0][1], r); if (c > 0.78) dark.push({ i, p: seg[0], c }); i++; }
  if (!dark.length) return [{ ok: true, text: 'No join looks darker than the rest.' }];
  return [{ ok: false, text: `${dark.length} place${dark.length > 1 ? 's' : ''} where strokes meet look darker than the strokes themselves — squint to see it. The g's neck is the model for thinning a join.`, nodes: dark.map(d => d.i) }];
}
function rhythm(ch, s) {
  const gaps = [];
  for (const [a, b] of [['n', ch], [ch, 'n'], ['o', ch], [ch, 'o']]) {
    if (a === b) continue;
    const L = E.layout(a + b, s); if (L.glyphs.length < 2) continue;
    const [g1, g2] = L.glyphs, b1 = E.bbox(g1.d), b2 = E.bbox(g2.d);
    const t1 = +g1.tf.match(/-?[\d.]+/)[0], t2 = +g2.tf.match(/-?[\d.]+/)[0];
    gaps.push({ pair: a + b, gap: r0((t2 + b2.xmin) - (t1 + b1.xmax)) });
  }
  const outside = gaps.filter(g => g.gap < 70 || g.gap > 85);
  if (!outside.length) return [{ ok: true, text: `Next to n and o the gaps are ${gaps.map(g => g.gap).join(', ')} — inside the 70–85 band.` }];
  return [{ ok: false, text: `Next to n and o some gaps fall outside the 70–85 band: ${outside.map(g => `${g.pair} ${g.gap}`).join(', ')}.` }];
}

// Every law for one letter at one weight. Findings: { law, ok, text, nodes? }.
function audit(ch, s) {
  const g = E.glyph(ch, s); if (!g) return null;
  const subs = E.parsePath(g.d), P = polys(subs), b = E.bbox(g.d);
  const out = [];
  const add = (law, list) => list.forEach(f => out.push({ law, ...f }));
  add('overshoot', overshoot(ch, s, subs, b));
  add('weight', weight(ch, s, P, b));
  add('gravity', gravity(ch, s, P));
  add('irradiation', irradiation(ch, s, P));
  add('crowding', crowding(ch, s, subs, P));
  add('rhythm', rhythm(ch, s));
  return { ch, stem: s, findings: out, problems: out.filter(f => !f.ok).length };
}
function auditAll(s, chars) {
  const out = {}; for (const ch of chars || E.ORDER) out[ch] = audit(ch, s); return out;
}
return { LAWS, audit, auditAll, coverage, polys };
});
