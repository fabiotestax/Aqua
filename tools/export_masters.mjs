// Export the masters for a font build, straight from the engine (no browser needed).
//
//   node tools/export_masters.mjs [aqua-studio-edits.json] [--out build/masters.json]
//
// Writes one JSON with, per glyph and per master stem (53 Light, 78 Regular, 106 Black):
// the outline in font units placed at its left sidebearing, and its advance width; plus the
// kerning per master, the word space, the metrics, the health of every glyph, and where
// the outlines came from (commit, date, edits file). tools/build_font.py reads it.
import fs from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const E = require('../aqua/engine.js');
const H = require('../studio/health.js');

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : 'build/masters.json';
const editsFile = args.find(a => a.endsWith('.json') && a !== out);
let edits = null;
if (editsFile) { edits = JSON.parse(fs.readFileSync(editsFile, 'utf8')); E.setDoc(edits); }
const hand = fs.existsSync('tools/hand.json') ? JSON.parse(fs.readFileSync('tools/hand.json', 'utf8')) : null;

const STEMS = E.WEIGHTS.map(w => w.stem);
const UNI = { '!': 0x21, '.': 0x2e, ',': 0x2c, B: 0x42 };
// production glyph names: the Studio's 'B.cap' is a font glyph called 'B'
const prod = ch => { const n = E.GNAME[ch] || ch; return n === 'B.cap' ? 'B' : n; };
const glyphs = {}, kern = {}, space = {};
for (const s of STEMS) {
  const kS = 0.40 + 0.32 * s / 106;
  kern[s] = {}; space[s] = 4 * E.bearing(s);
  const pairs = E.kernPairs();
  for (const p of Object.keys(pairs)) {
    const a = p[0], b = p[1];
    if (!E.allChars().includes(a) || !E.allChars().includes(b)) continue;
    const v = Math.round(pairs[p] * kS);
    if (v) kern[s][`${prod(a)},${prod(b)}`] = v;
  }
}
for (const ch of E.allChars()) {
  const name = prod(ch);
  glyphs[name] = { ch, unicode: UNI[ch] ?? ch.codePointAt(0), kind: E.kindOf(ch), fill: E.fillRule(ch), masters: {} };
  for (const s of STEMS) {
    const g = E.glyph(ch, s);
    glyphs[name].masters[s] = { d: E.translatePath(g.d, g.lsb - g.minX, 0), adv: Math.round(g.adv * 10) / 10 };
  }
}
const health = {};
for (const ch of E.allChars()) { const r = H.assess(ch, hand); health[prod(ch)] = { score: r.score, colour: r.colour, compatible: r.compatible, flags: r.flags.map(f => f.text) }; }
let commit = 'unknown'; try { commit = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}
const data = {
  family: 'Aqua', date: new Date().toISOString(), commit, edits: editsFile || null,
  metrics: E.METRICS, weights: E.WEIGHTS, stems: STEMS,
  glyphs, kern, space, health
};
fs.mkdirSync(out.replace(/\/[^/]*$/, ''), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data));
const c = { green: 0, amber: 0, red: 0 }; for (const n in health) c[health[n].colour]++;
console.log(`${Object.keys(glyphs).length} glyphs × ${STEMS.length} masters → ${out} · health green ${c.green} / amber ${c.amber} / red ${c.red}${editsFile ? ' · with edits from ' + editsFile : ''}`);
