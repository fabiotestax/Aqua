// Bake a Studio document into the typeface for good.
//
//   node tools/bake_edits.mjs aqua-studio-edits.json [--dry]
//
// Imported drawings become MASTERS entries in aqua/engine.js (a new line per letter, or the
// letter's existing line replaced), and point edits of each letter's used variation go into
// the engine's BAKED table, where outline() applies them like the Studio does. Other
// variations are kept in the file only. Prints what it did; --dry prints without writing.
// After baking, clear the Studio's document (Open a saved file → an empty one, or the
// browser's site data) so the same edits are not applied twice.
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ENGINE = new URL('../aqua/engine.js', import.meta.url).pathname;
const file = process.argv[2], dry = process.argv.includes('--dry');
if (!file) { console.error('usage: node tools/bake_edits.mjs <aqua-studio-edits.json> [--dry]'); process.exit(2); }
const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
let src = fs.readFileSync(ENGINE, 'utf8');
const E = require(ENGINE);
const report = [];

// 1. masters
const masters = doc.masters || {};
for (const ch of Object.keys(masters)) {
  const m = masters[ch];
  const chk = E.sameSkeleton(m.black, m.regular);
  if (!chk.ok) { report.push(`SKIP ${ch}: the two weights do not share a point structure (${chk.why})`); continue; }
  const name = E.GNAME[ch] || ch;
  const line = `  '${name}': { ch: '${ch.replace(/'/g, "\\'")}', black: "${m.black}", regular: "${m.regular}" },`;
  const re = new RegExp(`^  '${name.replace('.', '\\.')}': \\{ ch: .*$`, 'm');
  if (re.test(src)) { src = src.replace(re, line); report.push(`replaced the drawn weights of ${ch}`); }
  else {
    const i = src.indexOf('\n};\nfunction makeMaster');
    if (i < 0) throw new Error('could not find the end of MASTERS');
    src = src.slice(0, i) + ',\n' + line.replace(/,$/, '') + src.slice(i);
    // keep the object valid: the previous last entry now needs its comma
    src = src.replace(/" \}\n,\n  '/, '" },\n  \'');
    report.push(`added ${ch} as a drawn letter (it no longer follows the rules)`);
  }
}

// 2. point edits of the used variation, merged over what is already baked
const baked = JSON.parse(JSON.stringify(E.BAKED));
for (const ch of Object.keys(doc.glyphs || {})) {
  const g = doc.glyphs[ch], v = g.variants[g.use || 0];
  const has = o => o && Object.keys(o).length;
  if (!has(v.light) && !has(v.black) && !(v.ops && v.ops.length)) continue;
  baked.glyphs[ch] = { use: 0, variants: [{ name: 'main', light: v.light, black: v.black, ops: v.ops || [] }] };
  report.push(`baked ${Object.keys(v.light).length + Object.keys(v.black).length} point edits of ${ch}${g.variants.length > 1 ? ` (variation "${v.name}"; ${g.variants.length - 1} other variation(s) stay in the file)` : ''}`);
}
// 3. spacing: the whole table as it stands after this document
const spacing = Object.assign({}, baked.spacing || {});
if (doc.spacing) {
  if (doc.spacing.fromInk != null) spacing.fromInk = !!doc.spacing.fromInk;
  spacing.shape = Object.assign({}, spacing.shape || {}, doc.spacing.shape || {});
  spacing.kern = Object.assign({}, spacing.kern || {}, doc.spacing.kern || {});
  const n = Object.keys(doc.spacing.shape || {}).length + Object.keys(doc.spacing.kern || {}).length;
  if (n || doc.spacing.fromInk) report.push(`baked spacing: room from ink ${spacing.fromInk ? 'on' : 'off'}, ${Object.keys(doc.spacing.shape || {}).length} edge classes, ${Object.keys(doc.spacing.kern || {}).length} pairs`);
}
const bakedLine = `const BAKED = ${JSON.stringify({ glyphs: baked.glyphs, masters: {}, spacing, extra: doc.extra || [] })};`;
if (!/^const BAKED = .*$/m.test(src)) throw new Error('could not find BAKED in the engine');
src = src.replace(/^const BAKED = .*$/m, bakedLine);

console.log(report.length ? report.join('\n') : 'nothing to bake');
if (dry) { console.log('(dry run — engine.js not written)'); process.exit(0); }
fs.writeFileSync(ENGINE, src);
// prove the file still loads and every letter still draws
delete require.cache[ENGINE];
const E2 = require(ENGINE);
for (const ch of E2.ORDER) for (const s of [53, 78, 106]) if (!E2.glyph(ch, s)) throw new Error(`${ch} does not draw at ${s} after baking`);
console.log(`wrote aqua/engine.js — ${E2.ORDER.length} letters draw at 53 / 78 / 106. Now clear the Studio's document so these edits are not applied twice.`);
