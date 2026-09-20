// Aqua Studio — the skeleton library. For every character the Studio can suggest a first
// structure: strokes of drop centres, in font units, drawn the way a hand would tap them on
// the tile grid (a stem, an arch, a bowl, a bar). The engine thickens them with Aqua's own
// contrast and ends, so a suggested letter already has the family's weight and rhythm; what
// it does not have is the designer's judgement, which is why it is a start, not a drawing.
//
// This is a codified library of the usual construction of each character, not something
// learned from other fonts: an n is a stem and an arch, an a is a bowl and a stem, an
// ampersand is a small loop, a big loop and an arm. Every entry says so in plain words
// (describe) so the dialog can tell Fabio what he will get.
//
//   has(ch)            → true if the library knows the character
//   describe(ch)       → one plain sentence
//   strokes(ch, height)→ { strokes: [[x, y], ...][], ends?: 'round' | 'flat' } scaled to the
//                        chosen height (small 521 · caps 715 · tall 751), or null
//   chars()            → every character in the library, in display order
(() => {
'use strict';
const X = 520, C = 720, T = 760, D = -240;           // small · capitals · tall · tails, on the tile grid
const R = v => Math.round(v);
// n + 1 points on an ellipse from angle a0 to a1 (degrees, 0 = right, 90 = up)
const arc = (cx, cy, rx, ry, a0, a1, n = 6) => { const out = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return out; };
// a closed loop is two open arcs that overlap at both ends: the stroker gathers a stroke whose
// end meets its own start as a self-crossing, so a ring is never one stroke
const ring = (cx, cy, rx, ry, n = 12) => [arc(cx, cy, rx, ry, 80, 280, Math.ceil(n / 2)), arc(cx, cy, rx, ry, 260, 460, Math.ceil(n / 2))];
const mirror = (strokes, w) => strokes.map(st => st.map(([x, y]) => [w - x, y]));
const scaled = (strokes, kx, ky) => strokes.map(st => st.map(([x, y]) => [x * kx, y * ky]));
const S_SMALL = [[330, 440], [250, 520], [120, 500], [70, 400], [140, 300], [260, 230], [330, 140], [270, 40], [150, 0], [60, 70]];
const dot = (x, y) => [[x, y - 20], [x, y + 20]];

// natural height of each group: small letters sit on X, everything else on C
const LIB = {
  // ── small letters ──
  a: ['a bowl and a stem on the right', 'small', () => [[[340, X], [340, 0]], [[340, 330], ...arc(200, 190, 140, 190, 60, 300, 7), [340, 50]]]],
  b: ['a tall stem and a bowl on the right', 'small', () => [[[60, T], [60, 0]], arc(200, 260, 140, 260, 150, -150, 9)]],
  c: ['one open curve', 'small', () => [arc(200, 260, 140, 260, 50, 310, 8)]],
  d: ['a bowl and a tall stem on the right', 'small', () => [[[340, T], [340, 0]], arc(200, 260, 140, 260, 30, 330, 9)]],
  e: ['a bar and a curve that opens at the bottom right', 'small', () => [[[60, 260], [340, 260]], arc(200, 260, 140, 260, 0, 310, 8)]],
  f: ['a stem that hooks over at the top, and a bar', 'small', () => [[[60, 0], [60, 600], ...arc(200, 600, 140, 160, 180, 60, 4)], [[0, X], [240, X]]]],
  g: ['a bowl, a stem and a hooked tail below the line', 'small', () => [arc(200, 260, 140, 260, 30, 330, 9), [[340, X], [340, -100], ...arc(200, -100, 140, 140, 0, -180, 5)]]],
  h: ['a tall stem and an arch', 'small', () => [[[60, T], [60, 0]], [[60, 300], ...arc(200, 300, 140, 220, 180, 0, 6), [340, 0]]]],
  i: ['a stem and a dot', 'small', () => [[[60, X], [60, 0]], dot(60, 680)]],
  j: ['a stem that curls below the line, and a dot', 'small', () => [[[340, X], [340, -100], ...arc(200, -100, 140, 140, 0, -180, 5)], dot(340, 680)]],
  k: ['a tall stem, an arm up and a leg down', 'small', () => [[[60, T], [60, 0]], [[60, 200], [320, X]], [[150, 310], [340, 0]]]],
  l: ['one tall stem', 'small', () => [[[60, T], [60, 0]]]],
  m: ['a stem and two arches', 'small', () => [[[60, X], [60, 0]], [[60, 300], ...arc(180, 300, 120, 220, 180, 0, 6), [300, 0]], [[300, 300], ...arc(420, 300, 120, 220, 180, 0, 6), [540, 0]]]],
  n: ['a stem and an arch', 'small', () => [[[60, X], [60, 0]], [[60, 300], ...arc(200, 300, 140, 220, 180, 0, 6), [340, 0]]]],
  o: ['one closed ring', 'small', () => [...ring(200, 260, 140, 260)]],
  p: ['a stem down below the line and a bowl on the right', 'small', () => [[[60, X], [60, D]], arc(200, 260, 140, 260, 150, -150, 9)]],
  q: ['a bowl and a stem down below the line on the right', 'small', () => [[[340, X], [340, D]], arc(200, 260, 140, 260, 30, 330, 9)]],
  r: ['a stem and a short arch', 'small', () => [[[60, X], [60, 0]], [[60, 300], ...arc(200, 300, 140, 220, 180, 20, 5)]]],
  s: ['one stroke that curves twice', 'small', () => [S_SMALL]],
  t: ['a stem with a curved foot, and a bar', 'small', () => [[[60, 700], [60, 140], ...arc(180, 140, 120, 140, 180, 300, 4)], [[0, X], [240, X]]]],
  u: ['a stem, a round bottom and a stem', 'small', () => [[[60, X], [60, 220], ...arc(200, 220, 140, 220, 180, 360, 6)], [[340, X], [340, 0]]]],
  v: ['two diagonals meeting at the bottom', 'small', () => [[[40, X], [200, 0], [360, X]]]],
  w: ['four diagonals', 'small', () => [[[40, X], [160, 0], [300, X], [440, 0], [560, X]]]],
  x: ['two diagonals that cross', 'small', () => [[[40, X], [360, 0]], [[360, X], [40, 0]]]],
  y: ['two diagonals, one carrying on into a tail', 'small', () => [[[40, X], [200, 0]], [[360, X], [200, 0], [140, -160], [60, -230]]]],
  z: ['a bar, a diagonal and a bar', 'small', () => [[[40, X], [360, X], [40, 0], [360, 0]]]],
  // ── capitals ──
  A: ['two diagonals meeting at the top, and a bar', 'caps', () => [[[40, 0], [220, C], [400, 0]], [[110, 260], [330, 260]]]],
  B: ['a stem and two bowls', 'caps', () => [[[60, C], [60, 0]], [[60, C], [220, C], ...arc(220, 540, 120, 180, 90, -90, 5), [60, 360]], [[60, 360], [240, 360], ...arc(240, 180, 140, 180, 90, -90, 5), [60, 0]]]],
  C: ['one open curve', 'caps', () => [arc(240, 360, 200, 360, 50, 310, 9)]],
  D: ['a stem and one big bowl', 'caps', () => [[[60, C], [60, 0]], [[60, C], [200, C], ...arc(200, 360, 220, 360, 90, -90, 8), [60, 0]]]],
  E: ['a stem and three bars', 'caps', () => [[[60, C], [60, 0]], [[60, C], [360, C]], [[60, 360], [320, 360]], [[60, 0], [360, 0]]]],
  F: ['a stem and two bars', 'caps', () => [[[60, C], [60, 0]], [[60, C], [360, C]], [[60, 360], [320, 360]]]],
  G: ['an open curve with a bar into it', 'caps', () => [[...arc(240, 360, 200, 360, 50, 360, 9), [300, 360]]]],
  H: ['two stems and a bar', 'caps', () => [[[60, C], [60, 0]], [[400, C], [400, 0]], [[60, 360], [400, 360]]]],
  I: ['one stem', 'caps', () => [[[60, C], [60, 0]]]],
  J: ['a stem that curls at the bottom', 'caps', () => [[[300, C], [300, 160], ...arc(180, 160, 120, 160, 0, -180, 5)]]],
  K: ['a stem, an arm up and a leg down', 'caps', () => [[[60, C], [60, 0]], [[60, 300], [380, C]], [[170, 440], [400, 0]]]],
  L: ['a stem and a bar', 'caps', () => [[[60, C], [60, 0]], [[60, 0], [360, 0]]]],
  M: ['two stems and a V between them', 'caps', () => [[[60, 0], [60, C], [260, 200], [460, C], [460, 0]]]],
  N: ['two stems and a diagonal', 'caps', () => [[[60, 0], [60, C], [400, 0], [400, C]]]],
  O: ['one closed ring', 'caps', () => [...ring(240, 360, 200, 360)]],
  P: ['a stem and a bowl at the top', 'caps', () => [[[60, C], [60, 0]], [[60, C], [240, C], ...arc(240, 540, 140, 180, 90, -90, 5), [60, 360]]]],
  Q: ['a ring with a tail', 'caps', () => [...ring(240, 360, 200, 360), [[300, 120], [460, -40]]]],
  R: ['a stem, a bowl at the top and a leg', 'caps', () => [[[60, C], [60, 0]], [[60, C], [240, C], ...arc(240, 540, 140, 180, 90, -90, 5), [60, 360]], [[200, 360], [400, 0]]]],
  S: ['one stroke that curves twice', 'caps', () => scaled([S_SMALL], 1.2, C / X)],
  T: ['a bar and a stem', 'caps', () => [[[0, C], [440, C]], [[220, C], [220, 0]]]],
  U: ['two stems joined by a round bottom', 'caps', () => [[[60, C], [60, 200], ...arc(230, 200, 170, 200, 180, 360, 6), [400, C]]]],
  V: ['two diagonals meeting at the bottom', 'caps', () => [[[40, C], [240, 0], [440, C]]]],
  W: ['four diagonals', 'caps', () => [[[40, C], [180, 0], [330, C], [480, 0], [620, C]]]],
  X: ['two diagonals that cross', 'caps', () => [[[40, C], [440, 0]], [[440, C], [40, 0]]]],
  Y: ['two diagonals meeting on a stem', 'caps', () => [[[40, C], [240, 320]], [[440, C], [240, 320], [240, 0]]]],
  Z: ['a bar, a diagonal and a bar', 'caps', () => [[[40, C], [440, C], [40, 0], [440, 0]]]],
  // ── digits (Aqua's rules draw these already; the skeletons are for a drops version) ──
  '0': ['one ring', 'caps', () => [...ring(200, 360, 150, 360)]],
  '1': ['a flag and a stem', 'caps', () => [[[60, 560], [200, C], [200, 0]]]],
  '2': ['a curve over the top, a diagonal and a bar', 'caps', () => [[...arc(200, 540, 140, 170, 160, -60, 6), [60, 0], [360, 0]]]],
  '3': ['two bowls, open on the left', 'caps', () => [[[70, 620], ...arc(200, 540, 140, 180, 120, -90, 6)], [[200, 360], ...arc(200, 180, 150, 180, 90, -120, 6), [60, 80]]]],
  '4': ['a diagonal, a bar and a stem', 'caps', () => [[[320, C], [40, 200], [420, 200]], [[320, C], [320, 0]]]],
  '5': ['a bar, a stem and a bowl', 'caps', () => [[[340, C], [100, C], [80, 400], ...arc(210, 220, 150, 220, 120, -100, 6), [60, 60]]]],
  '6': ['a curve down into a bowl', 'caps', () => [[[320, 700], [180, 640], [70, 420], [60, 220]], ...ring(200, 220, 140, 220, 8)]],
  '7': ['a bar and a diagonal', 'caps', () => [[[40, C], [400, C], [160, 0]]]],
  '8': ['two rings, one on the other', 'caps', () => [...ring(200, 540, 120, 180, 8), ...ring(200, 180, 140, 180, 8)]],
  '9': ['a bowl and a curve down', 'caps', () => [[[80, 20], [220, 80], [330, 300], [340, 500]], ...ring(200, 500, 140, 220, 8)]],
  // ── punctuation and signs ──
  '&': ['a diagonal up into a small loop, then the big loop below and the arm out to the right', 'caps', () => [[[300, 60], [140, 280], [100, 520], [150, 660], [230, 700], [300, 640], [290, 520], [200, 420]], [[200, 420], [80, 300], [60, 150], [120, 40], [230, 20], [320, 90], [400, 220]]]],
  '@': ['a small ring inside a big open curve', 'caps', () => [...ring(240, 260, 110, 150, 8), [[350, 420], [350, 160]], arc(240, 260, 220, 260, -20, 290, 9)]],
  '#': ['two slanted stems and two bars', 'caps', () => [[[140, C], [60, 0]], [[340, C], [260, 0]], [[20, 460], [380, 460]], [[0, 260], [360, 260]]]],
  '%': ['two small rings and a diagonal', 'caps', () => [...ring(120, 560, 80, 120, 8), ...ring(320, 160, 80, 120, 8), [[400, C], [40, 0]]]],
  '*': ['three short strokes through one point', 'caps', () => [[[200, C], [200, 400]], [[60, 640], [340, 480]], [[340, 640], [60, 480]]]],
  '+': ['a bar and a stem crossing', 'caps', () => [[[40, 300], [360, 300]], [[200, 460], [200, 140]]]],
  '=': ['two bars', 'caps', () => [[[40, 380], [360, 380]], [[40, 220], [360, 220]]]],
  '-': ['one short bar', 'caps', () => [[[40, 300], [300, 300]]]],
  '_': ['one bar under the line', 'caps', () => [[[0, -80], [400, -80]]]],
  '?': ['a curve over the top down to a short stem, and a dot', 'caps', () => [[...arc(200, 540, 140, 180, 150, -90, 6), [200, 300], [200, 180]], dot(200, 40)]],
  '!': ['a stem and a dot', 'caps', () => [[[60, C], [60, 200]], dot(60, 40)]],
  '.': ['one dot', 'caps', () => [dot(60, 40)]],
  ',': ['one dot with a tail', 'caps', () => [[[70, 70], [70, 0], [30, -90]]]],
  ';': ['a dot over a comma', 'caps', () => [dot(60, 460), [[70, 70], [70, 0], [30, -90]]]],
  ':': ['two dots', 'caps', () => [dot(60, 460), dot(60, 40)]],
  "'": ['one short stem at the top', 'caps', () => [[[60, C], [60, 560]]]],
  '"': ['two short stems at the top', 'caps', () => [[[60, C], [60, 560]], [[200, C], [200, 560]]]],
  '(': ['one curve, open to the right', 'caps', () => [arc(360, 260, 260, 500, 120, 240, 6)]],
  ')': ['one curve, open to the left', 'caps', () => [arc(40, 260, 260, 500, 60, -60, 6)]],
  '[': ['a stem with two short bars', 'caps', () => [[[200, T], [60, T], [60, D], [200, D]]]],
  ']': ['a stem with two short bars', 'caps', () => mirror([[[200, T], [60, T], [60, D], [200, D]]], 260)],
  '{': ['a stem that pinches in the middle', 'caps', () => [[[240, T], [140, 740], [120, 600], [120, 340], [40, 260], [120, 180], [120, -80], [140, -220], [240, D]]]],
  '}': ['a stem that pinches in the middle', 'caps', () => mirror([[[240, T], [140, 740], [120, 600], [120, 340], [40, 260], [120, 180], [120, -80], [140, -220], [240, D]]], 280)],
  '/': ['one diagonal', 'caps', () => [[[40, -100], [360, T]]]],
  '\\': ['one diagonal', 'caps', () => [[[360, -100], [40, T]]]],
  '<': ['two diagonals meeting on the left', 'caps', () => [[[340, 600], [40, 300], [340, 0]]]],
  '>': ['two diagonals meeting on the right', 'caps', () => [[[40, 600], [340, 300], [40, 0]]]],
  '|': ['one tall stem', 'caps', () => [[[60, T], [60, D]]]],
  '~': ['one wave', 'caps', () => [[[40, 280], [120, 360], [200, 320], [280, 240], [360, 320]]]],
  '^': ['two diagonals meeting at the top', 'caps', () => [[[60, 480], [200, C], [340, 480]]]],
  '€': ['an open curve with two bars', 'caps', () => [arc(260, 360, 200, 360, 50, 310, 9), [[20, 420], [300, 420]], [[20, 300], [300, 300]]]],
  '$': ['an S with a stem through it', 'caps', () => [...scaled([S_SMALL], 1.2, C / X), [[200, 780], [200, -60]]]],
  '£': ['a hooked stem, a foot and a bar', 'caps', () => [[[360, 660], ...arc(240, 560, 120, 160, 60, 180, 4), [120, 400], [120, 100], [60, 0], [380, 0]], [[20, 320], [260, 320]]]],
  // ── pictos ──
  '❤': ['a heart: one closed stroke with two bumps at the top', 'caps', () => [[[200, 0], [40, 240], [40, 420], [120, 520], [200, 460]], [[200, 460], [280, 520], [360, 420], [360, 240], [200, 0]]]],
  '★': ['a five-pointed star, one closed stroke', 'caps', () => (() => { const pt = i => { const a = (90 + i * 36) * Math.PI / 180, r = i % 2 ? 140 : 360; return [240 + r * Math.cos(a), 360 + r * Math.sin(a)]; }; return [[0, 1, 2, 3, 4, 5].map(pt), [5, 6, 7, 8, 9, 10].map(pt)]; })()],
  '→': ['an arrow to the right: a bar and a head', 'caps', () => [[[40, 360], [440, 360]], [[300, 520], [440, 360], [300, 200]]]],
  '←': ['an arrow to the left: a bar and a head', 'caps', () => [[[440, 360], [40, 360]], [[180, 520], [40, 360], [180, 200]]]],
  '↑': ['an arrow up: a stem and a head', 'caps', () => [[[200, 0], [200, C]], [[60, 580], [200, C], [340, 580]]]],
  '↓': ['an arrow down: a stem and a head', 'caps', () => [[[200, C], [200, 0]], [[60, 140], [200, 0], [340, 140]]]],
  '✓': ['a tick: a short diagonal down and a long one up', 'caps', () => [[[40, 300], [160, 60], [440, 640]]]],
  '×': ['two diagonals that cross', 'caps', () => [[[60, 560], [340, 140]], [[340, 560], [60, 140]]]],
  '○': ['one ring', 'caps', () => [...ring(240, 360, 200, 360)]],
  '□': ['a square: four sides', 'caps', () => [[[60, 0], [60, C], [420, C]], [[420, C], [420, 0], [60, 0]]]],
  '△': ['a triangle: three sides', 'caps', () => [[[40, 0], [240, C], [440, 0]], [[440, 0], [40, 0]]]],
  '◇': ['a diamond: four sides', 'caps', () => [[[240, C], [440, 360], [240, 0]], [[240, 0], [40, 360], [240, C]]]],
  '☺': ['a face: a ring, two dots and a smile', 'caps', () => [...ring(240, 360, 220, 360), dot(160, 470), dot(320, 470), arc(240, 300, 120, 120, 200, 340, 4)]],
  '⚓': ['an anchor: a small ring, a stem, a bar and the curved arms', 'caps', () => [...ring(240, 660, 50, 60, 6), [[240, 600], [240, 0]], [[120, 440], [360, 440]], arc(240, 220, 200, 220, 180, 360, 6)]],
  '♪': ['a note: a stem, a flag and a ring at the bottom', 'caps', () => [[[300, 700], [300, 80]], ...ring(220, 80, 90, 80, 7), [[300, 700], [420, 600], [420, 480]]]]
};
const NATURAL = { small: X, caps: C, tall: T };
function has(ch) { return !!LIB[ch]; }
function describe(ch) { const e = LIB[ch]; return e ? e[0][0].toUpperCase() + e[0].slice(1) : null; }
function strokes(ch, height) {
  const e = LIB[ch]; if (!e) return null;
  const nat = NATURAL[e[1]], want = NATURAL[height] || nat, k = want / nat;
  const out = e[2]().map(st => st.map(([x, y]) => [R(x), R(y * k)]));
  return { strokes: out, natural: e[1] };
}
function chars() { return Object.keys(LIB); }
const api = { has, describe, strokes, chars };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.AquaSkeletons = api;
})();
