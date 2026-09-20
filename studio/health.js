// Aqua glyph health, in the browser — a port of tools/health.py so the Studio's matrix and
// Health room are always live against the engine instead of a JSON file somebody ran.
//
// Same measures, same thresholds, same scores as the Python (validated: every glyph's score
// and colour match tools/out/health.json). What differs is the wording: every flag comes out
// as a plain sentence Fabio can read, with a short code for anything that wants to key on it.
//
//   smooth      curvature continuity at every join (the lump detector) and the tightest radius
//   discipline  every curve segment monotone in x and y (points sit on the extremes),
//               no squashed handles (< 5% of chord)
//   density     total segment count (an s made of 354 pieces is a trace, not a drawing)
//   spacing     both sidebearings non-negative against the glyph's own advance box
//   masters     Light and Black have the same contour structure — the interpolatable test
//
// Loads as a classic <script> (window.AquaHealth) and as CommonJS (require). Needs the engine.
(function (root, factory) {
  const E = typeof module === 'object' && module.exports ? require('../aqua/engine.js') : root.AquaEngine;
  const api = factory(E);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AquaHealth = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
'use strict';

const STEMS = [53, 78, 106];

function curv(p0, c1, c2, p3, t) {
  const mt = 1 - t;
  const d1x = 3*mt*mt*(c1[0]-p0[0]) + 6*mt*t*(c2[0]-c1[0]) + 3*t*t*(p3[0]-c2[0]);
  const d1y = 3*mt*mt*(c1[1]-p0[1]) + 6*mt*t*(c2[1]-c1[1]) + 3*t*t*(p3[1]-c2[1]);
  const d2x = 6*mt*(c2[0] - 2*c1[0] + p0[0]) + 6*t*(p3[0] - 2*c2[0] + c1[0]);
  const d2y = 6*mt*(c2[1] - 2*c1[1] + p0[1]) + 6*t*(p3[1] - 2*c2[1] + c1[1]);
  const n = Math.pow(d1x*d1x + d1y*d1y, 1.5);
  return n > 1e-9 ? (d1x*d2y - d1y*d2x) / n : 0;
}
function monotone(p0, c1, c2, p3) {
  for (const ax of [0, 1]) {
    const a = p0[ax], b = c1[ax], c = c2[ax], d = p3[ax];
    const A = 3*(-a + 3*b - 3*c + d), B = 6*(a - 2*b + c), C = 3*(b - a);
    let roots = [];
    if (Math.abs(A) < 1e-9) { if (Math.abs(B) > 1e-9) roots = [-C / B]; }
    else { const disc = B*B - 4*A*C; if (disc >= 0) { const sq = Math.sqrt(disc); roots = [(-B + sq) / (2*A), (-B - sq) / (2*A)]; } }
    for (const r of roots) if (r > 0.02 && r < 0.98) return false;
  }
  return true;
}
function extremumDepth(p0, c1, c2, p3) {
  let depth = 0;
  for (const ax of [0, 1]) {
    const lo = Math.min(p0[ax], p3[ax]), hi = Math.max(p0[ax], p3[ax]);
    for (let i = 1; i < 24; i++) {
      const t = i / 24, mt = 1 - t;
      const v = mt*mt*mt*p0[ax] + 3*mt*mt*t*c1[ax] + 3*mt*t*t*c2[ax] + t*t*t*p3[ax];
      depth = Math.max(depth, lo - v, v - hi);
    }
  }
  return depth;
}

function analyse(subs, stem) {
  const segs = [].concat(...subs);
  let maxJump = 0, maxK = 0, jumpAt = null, base = 0;
  const FILLET_R = 0.6 * stem, marks = [];
  for (const sub of subs) {
    const n = sub.length;
    for (let i = 0; i < n; i++) {
      const [p0, c1, c2, p3, k] = sub[i];
      for (const t of [0, 0.25, 0.5, 0.75, 1]) maxK = Math.max(maxK, Math.abs(curv(p0, c1, c2, p3, t)));
      const [q0, q1, q2, q3, kk] = sub[(i + 1) % n];
      // two points on top of each other
      if (Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) < 1.5) marks.push({ code: 'overlap', node: base + (i + 1) % n, text: 'Two points sit on top of each other here' });
      if (k === 'L' || kk === 'L') continue;
      const ke = curv(p0, c1, c2, p3, 1), ks = curv(q0, q1, q2, q3, 0);
      if (Math.max(Math.abs(ke), Math.abs(ks)) > 1 / FILLET_R) continue;
      const jump = Math.abs(ke - ks);
      if (jump > maxJump) { maxJump = jump; jumpAt = base + (i + 1) % n; }
    }
    base += n;
  }
  if (jumpAt != null && maxJump > 0.008) marks.push({ code: maxJump > 0.02 ? 'lump' : 'lump-slight', node: jumpAt, text: maxJump > 0.02 ? 'The curve bumps here' : 'The curve bumps slightly here' });
  let nonmono = 0, squashed = 0, gi = 0;
  for (const [p0, c1, c2, p3, k] of segs) {
    gi++;
    if (k !== 'C') continue;
    if (!monotone(p0, c1, c2, p3) && extremumDepth(p0, c1, c2, p3) > 2) { nonmono++; marks.push({ code: 'extreme', node: gi - 1, text: 'This curve has no point at its outermost edge' }); }
    const chord = Math.hypot(p3[0]-p0[0], p3[1]-p0[1]);
    if (chord < 1e-6) continue;
    const h1 = Math.hypot(c1[0]-p0[0], c1[1]-p0[1]), h2 = Math.hypot(c2[0]-p3[0], c2[1]-p3[1]);
    if (Math.min(h1, h2) < 0.05 * chord) { squashed++; marks.push({ code: 'squashed', node: gi - 1, text: 'A curve handle is squashed flat here' }); }
  }
  const xs = [], ys = [];
  for (const s of segs) { xs.push(s[0][0], s[3][0]); ys.push(s[0][1], s[3][1]); }
  return {
    marks,
    subpaths: subs.length, segs: segs.length, segsPerSub: subs.map(s => s.length),
    signature: subs.map(sub => sub.map(s => s[4]).join('')),
    maxJump: Math.round(maxJump * 1e5) / 1e5,
    minRadius: maxK > 1e-9 ? Math.round(10 / maxK) / 10 : 9999,
    nonmono, squashed,
    xmin: Math.min(...xs), xmax: Math.max(...xs), ymin: Math.min(...ys), ymax: Math.max(...ys)
  };
}

// Plain words for each finding. `code` is stable; `text` is what the UI shows.
const say = (code, text) => ({ code, text });
function scoreGlyph(perStem, compatible) {
  let score = 100; const flags = [];
  if (!compatible.ok) { score = Math.min(score, 35); flags.push(say('masters', 'Light and Black are not drawn with the same points — ' + compatible.why)); }
  let worst = null;
  for (const stem of Object.keys(perStem)) {
    const m = perStem[stem], st = +stem; let s = 100; const f = [];
    if (m.maxJump > 0.02) { s -= 30; f.push(say('lump', 'A curve has a visible bump where two pieces meet')); }
    else if (m.maxJump > 0.008) { s -= 15; f.push(say('lump-slight', 'A curve has a slight bump where two pieces meet')); }
    if (m.minRadius < Math.max(3, 0.06 * st)) { s -= 20; f.push(say('cusp', 'A corner comes to a sharp point')); }
    else if (m.minRadius < 0.10 * st) { s -= 5; f.push(say('tight', 'A corner is very tight')); }
    if (m.nonmono) { s -= Math.min(12, 2 * m.nonmono); f.push(say('extreme', `${m.nonmono} curve${m.nonmono > 1 ? 's have' : ' has'} no point at the outermost edge`)); }
    if (m.squashed) { s -= Math.min(24, 8 * m.squashed); f.push(say('squashed', `${m.squashed} curve handle${m.squashed > 1 ? 's are' : ' is'} squashed flat`)); }
    if (m.segs > 80 && !m.drops) { s -= 25; f.push(say('trace', `Too many points (${m.segs}) — this is a trace, not a drawing`)); }
    if (m.lsb < 0 || m.rsb < 0) {
      s -= 20;
      const side = m.lsb < 0 && m.rsb < 0 ? 'both sides' : m.lsb < 0 ? 'the left' : 'the right';
      f.push(say('overhang', `The ink sticks out of its box on ${side}`));
    }
    m.stemScore = s; m.flags = f;
    if (worst === null || s < worst[1]) worst = [stem, s];
  }
  const [stem, s] = worst;
  score = Math.min(score, s);
  if (s < 100) for (const x of perStem[stem].flags) flags.push({ ...x, text: x.text + ` (at ${E.weightName(+stem)})` });
  const colour = score >= 85 ? 'green' : score >= 65 ? 'amber' : 'red';
  return { score, colour, worstStem: +stem, flags };
}

// hand = the contents of tools/hand.json (or null). A glyph Fabio marks is red regardless.
function assess(ch, hand) {
  const per = {};
  for (const s of STEMS) {
    const g = E.glyph(ch, s); if (!g) return null;
    const subs = E.parsePath(g.d);
    const m = analyse(subs, s);
    m.drops = g.kind === 'drops';   // a letter from drops is sampled, not traced: its point count is by design
    // the export places the ink at (ox − minX); the box runs from ox − lsb to ox + w + rsb
    m.lsb = Math.round((m.xmin - g.minX + g.lsb) * 10) / 10;
    m.rsb = Math.round((g.w + g.rsb + g.minX - m.xmax) * 10) / 10;
    m.advance = Math.round(g.adv * 10) / 10;
    per[s] = m;
  }
  const a = per[STEMS[0]], b = per[STEMS[STEMS.length - 1]];
  let comp;
  if (a.subpaths !== b.subpaths) comp = { ok: false, why: `${a.subpaths} vs ${b.subpaths} outlines` };
  else if (a.segsPerSub.join() !== b.segsPerSub.join()) comp = { ok: false, why: `${a.segsPerSub.join('+')} vs ${b.segsPerSub.join('+')} pieces` };
  else if (a.signature.join() !== b.signature.join()) comp = { ok: false, why: 'the curves and straight runs come in a different order' };
  else comp = { ok: true, why: 'ok' };
  const r = scoreGlyph(per, comp);
  const name = E.GNAME[ch] || ch;
  let handNote = null;
  if (hand && hand.not_aqua && hand.not_aqua[name]) {
    handNote = 'Fabio: ' + hand.not_aqua[name];
    r.score = Math.min(r.score, 50); r.colour = 'red';
    r.flags = [say('hand', handNote), ...r.flags];
  } else if (hand && hand.check && hand.check[name]) {
    handNote = 'check: ' + hand.check[name];
    r.flags = [say('check', 'Fabio asked to check: ' + hand.check[name]), ...r.flags];
  } else if (hand && hand.approved && hand.approved[name]) {
    handNote = 'approved by Fabio';
  }
  return { ch, name, ...r, compatible: comp.ok, hand: handNote, stems: per };
}

// The lines the inspector shows: what is right as well as what is wrong.
function lines(rep) {
  const has = c => rep.flags.some(f => f.code === c || f.code.startsWith(c + '-'));
  const out = [];
  if (has('hand')) out.push({ ok: false, text: 'Fabio: not Aqua yet' });
  out.push(has('lump') || has('cusp') || has('tight') ? { ok: false, text: rep.flags.find(f => ['lump', 'lump-slight', 'cusp', 'tight'].includes(f.code)).text } : { ok: true, text: 'Curves are smooth' });
  out.push(rep.compatible ? { ok: true, text: 'Works in every weight' } : { ok: false, text: 'Light and Black are not drawn with the same points' });
  out.push(has('extreme') || has('squashed') ? { ok: false, text: rep.flags.find(f => f.code === 'extreme' || f.code === 'squashed').text } : { ok: true, text: 'Points sit on the outer edges' });
  out.push(has('trace') ? { ok: false, text: rep.flags.find(f => f.code === 'trace').text } : { ok: true, text: 'Drawn with a sensible number of points' });
  out.push(has('overhang') ? { ok: false, text: rep.flags.find(f => f.code === 'overhang').text } : { ok: true, text: 'Sits inside its box' });
  if (has('check')) out.push({ ok: null, text: rep.flags.find(f => f.code === 'check').text });
  return out;
}

// Where the problems are, at one weight — for the canvas. [{ code, node, text }]
function marks(ch, s) { const g = E.glyph(ch, s); if (!g) return []; return analyse(E.parsePath(g.d), s).marks; }
function assessAll(hand) {
  const out = {};
  for (const ch of E.allChars()) out[ch] = assess(ch, hand);
  return out;
}
const LABEL = { green: 'Looks good', amber: 'Needs a look', red: 'Not Aqua yet' };

return { STEMS, analyse, assess, assessAll, lines, marks, LABEL };
});
