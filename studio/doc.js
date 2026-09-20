// The Studio's document: everything Fabio changes, kept apart from the typeface until it is
// baked in (tools/bake_edits.mjs). Point edits per glyph per variation, imported drawings,
// undo and redo, autosave in the browser, save to and open from a file.
//
//   { version: 1, saved: ISO,
//     glyphs:  { [ch]: { use: 0, variants: [{ name, light: { [node]: { d, r } }, black: {...} }] } },
//     masters: { [ch]: { black, regular, source, when } } }
//
// Loads as a classic <script> (window.AquaDoc) and as CommonJS (require). Needs the engine.
(function (root, factory) {
  const E = typeof module === 'object' && module.exports ? require('../aqua/engine.js') : root.AquaEngine;
  const api = factory(E);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AquaDoc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
'use strict';

const KEY = 'aqua.doc';
const empty = () => ({ version: 1, saved: null, glyphs: {}, masters: {} });
let doc = empty();
let history = [], at = -1, savedAt = -1;      // history: JSON snapshots; at: current; savedAt: last file save
const listeners = new Set();
const clone = o => JSON.parse(JSON.stringify(o));
const store = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} };
const read = k => { try { return localStorage.getItem(k); } catch { return null; } };

function push(label) {
  history = history.slice(0, at + 1);
  history.push({ label, json: JSON.stringify(doc) });
  if (history.length > 80) { history.shift(); if (savedAt >= 0) savedAt--; }
  at = history.length - 1;
}
function apply(notify = true) {
  E.setDoc(doc);
  store(KEY, JSON.stringify(doc));
  if (notify) listeners.forEach(f => f());
}
// A change worth remembering: record it, apply it, tell the rooms.
function commit(label) { push(label); apply(); }
// A change in flight (a drag): apply without a history entry; commit() when it lands.
function live() { E.setDoc(doc); }

function init() {
  const raw = read(KEY);
  if (raw) { try { doc = Object.assign(empty(), JSON.parse(raw)); } catch { doc = empty(); } }
  history = [{ label: 'Opened', json: JSON.stringify(doc) }]; at = 0; savedAt = 0;
  apply(false);
}
function undo() { if (at > 0) { at--; doc = JSON.parse(history[at].json); apply(); } }
function redo() { if (at < history.length - 1) { at++; doc = JSON.parse(history[at].json); apply(); } }
const canUndo = () => at > 0, canRedo = () => at < history.length - 1;
const lastLabel = () => (history[at] && history[at].label) || '';
const dirty = () => at !== savedAt;

// ── glyph entries ──
function entry(ch, create) {
  if (!doc.glyphs[ch] && create) doc.glyphs[ch] = { use: 0, variants: [{ name: 'main', light: {}, black: {} }] };
  return doc.glyphs[ch] || null;
}
function variants(ch) { const g = entry(ch); return g ? g.variants : [{ name: 'main', light: {}, black: {} }]; }
function variant(ch, i) { const g = entry(ch, true); return g.variants[Math.min(i, g.variants.length - 1)]; }
function used(ch) { const g = entry(ch); return g ? g.use || 0 : 0; }
const has = o => o && Object.keys(o).length > 0;
function hasEdits(ch, i) { const v = i == null ? null : variants(ch)[i]; if (v) return has(v.light) || has(v.black) || !!(v.ops && v.ops.length); return variants(ch).some(x => has(x.light) || has(x.black) || (x.ops && x.ops.length)); }
function edit(ch, i, node, which) { const v = variant(ch, i); const side = v[which] || (v[which] = {}); return side[node] || (side[node] = { d: [0, 0], r: 1 }); }
function clean(v) { for (const w of ['light', 'black']) for (const k in v[w]) { const e = v[w][k]; if (Math.abs(e.d[0]) < 1e-9 && Math.abs(e.d[1]) < 1e-9 && Math.abs((e.r ?? 1) - 1) < 1e-9) delete v[w][k]; } }
// Move a node by (dx, dy) — in both weights, or in one.
function nudge(ch, i, node, dx, dy, which = 'both', settle = true) {
  for (const w of which === 'both' ? ['light', 'black'] : [which]) { const e = edit(ch, i, node, w); e.d = [e.d[0] + dx, e.d[1] + dy]; }
  clean(variant(ch, i));
  if (settle) commit(`Move point ${node + 1} of ${ch}`); else live();
}
function setNode(ch, i, node, patch, which = 'both', settle = true) {
  for (const w of which === 'both' ? ['light', 'black'] : [which]) Object.assign(edit(ch, i, node, w), clone(patch));
  clean(variant(ch, i));
  if (settle) commit(`Change point ${node + 1} of ${ch}`); else live();
}
// structural edits: insert a point on a segment / remove a point — both weights alike.
// Node keys of the nudges shift so they keep pointing at the same points.
function nodeIndexOfSeg(ch, i, sub, seg) { const subs = E.parsePath(E.outline(ch, 53, i)); let n = 0; for (let k = 0; k < sub; k++) n += subs[k].length; return n + seg; }
function shiftKeys(v, from, by) { for (const w of ['light', 'black']) { const o = {}; for (const k in v[w]) { const n = +k; o[n >= from ? n + by : n] = v[w][k]; } v[w] = o; } }
function insertNode(ch, i, sub, seg, t) { const v = variant(ch, i); const at = nodeIndexOfSeg(ch, i, sub, seg) + 1; (v.ops || (v.ops = [])).push({ op: 'insert', sub, seg, t }); shiftKeys(v, at, 1); commit(`Add a point to ${ch}`); return at; }
function deleteNodes(ch, i, nodes) { const v = variant(ch, i); const list = [...new Set(nodes)].sort((a, b) => b - a); for (const n of list) { (v.ops || (v.ops = [])).push({ op: 'delete', node: n }); delete v.light[n]; delete v.black[n]; shiftKeys(v, n + 1, -1); } commit(`Remove ${list.length} point${list.length > 1 ? 's' : ''} from ${ch}`); }
function hasOps(ch, i) { const v = variants(ch)[i]; return !!(v && v.ops && v.ops.length); }
// move several nodes at once (a drag of a selection, a rotate, a scale)
function nudgeMany(ch, i, deltas, which = 'both', settle = true, label) { for (const n in deltas) for (const w of which === 'both' ? ['light', 'black'] : [which]) { const e = edit(ch, i, +n, w); e.d = [e.d[0] + deltas[n][0], e.d[1] + deltas[n][1]]; } clean(variant(ch, i)); if (settle) commit(label || `Move ${Object.keys(deltas).length} points of ${ch}`); else live(); }
function resetNode(ch, i, node) { const v = variant(ch, i); delete v.light[node]; delete v.black[node]; commit(`Reset point ${node + 1} of ${ch}`); }
function nodeState(ch, i, node) { const v = variants(ch)[i] || variants(ch)[0]; return { light: v.light[node] || null, black: v.black[node] || null }; }
// "Apply to all weights": carry one weight's edits onto the other.
function applyToAll(ch, i, from) { const v = variant(ch, i); const to = from === 'light' ? 'black' : 'light'; v[to] = clone(v[from]); commit(`Apply ${ch}'s ${from === 'light' ? 'Light' : 'Black'} edits to both weights`); }
function weightsDiffer(ch, i) { const v = variants(ch)[i] || variants(ch)[0]; return JSON.stringify(v.light) !== JSON.stringify(v.black); }
function resetGlyph(ch, i) { if (doc.glyphs[ch]) { const k = i == null ? doc.glyphs[ch].use || 0 : i; doc.glyphs[ch].variants[k] = { name: doc.glyphs[ch].variants[k].name, light: {}, black: {}, ops: [] }; } commit(`Start ${ch} over`); }

// ── variations ──
function addVariant(ch, name, from) { const g = entry(ch, true); const src = g.variants[from ?? g.use ?? 0]; g.variants.push({ name: name || `${ch} · ${g.variants.length + 1}`, light: clone(src.light), black: clone(src.black) }); commit(`New variation of ${ch}`); return g.variants.length - 1; }
function useVariant(ch, i) { const g = entry(ch, true); g.use = i; commit(`Use ${g.variants[i].name} in text`); }
function renameVariant(ch, i, name) { const g = entry(ch, true); g.variants[i].name = name; commit(`Rename variation`); }
function removeVariant(ch, i) { const g = entry(ch, true); if (g.variants.length < 2 || i === 0) return; g.variants.splice(i, 1); if (g.use >= g.variants.length) g.use = 0; else if (g.use > i) g.use--; commit(`Remove variation of ${ch}`); }

// ── imported drawings ──
// Bring one weight's drawing in. The other weight stays what it is (its drawing, or the rules
// built at that stem) so the axis keeps two masters with the same points.
// The drawing carries every point edit the sheet went out with, so the edits it came from are
// cleared and the other weight is frozen as it looks now: two complete outlines, edits at zero.
function importMaster(ch, weight, d) {
  const cur = E.masterPair(ch); if (!cur) return { ok: false, why: 'no such letter' };
  const other = E.serializePath(E.parsePath(E.outline(ch, weight === 'black' ? 53 : 106)));
  const chk = E.sameSkeleton(d, other);
  if (!chk.ok) return { ok: false, why: chk.why };
  doc.masters[ch] = { black: weight === 'black' ? d : other, regular: weight === 'regular' ? d : other,
                      source: 'imported', when: new Date().toISOString().slice(0, 10), from: cur.source };
  const g = doc.glyphs[ch]; if (g) { const v = g.variants[g.use || 0]; v.light = {}; v.black = {}; }
  return { ok: true };
}
function forgetMaster(ch) { delete doc.masters[ch]; commit(`Forget the imported drawing of ${ch}`); }
function hasMaster(ch) { return !!doc.masters[ch]; }

// ── spacing ──
// doc.spacing = { fromInk, shape: { ch: 'rf' }, kern: { pair: units at Black } } — on hold by
// decision, but live to try; the engine reads it through spacing() / shapeOf() / kernOf().
function spacingDoc() { return doc.spacing || (doc.spacing = { fromInk: false, shape: {}, kern: {} }); }
function setFromInk(on) { spacingDoc().fromInk = !!on; commit(on ? 'Room from ink: on' : 'Room from ink: off'); }
function setShape(ch, cls) { const sp = spacingDoc(); if (cls === E.SHAPE[ch] || (!E.SHAPE[ch] && cls === 'ff')) delete sp.shape[ch]; else sp.shape[ch] = cls; commit(`Edges of ${ch}: ${cls}`); }
function setKern(pair, v) { const sp = spacingDoc(); v = Math.round(v || 0); if (v === (E.KERN[pair] || 0)) delete sp.kern[pair]; else sp.kern[pair] = v; commit(v ? `Pair ${pair}: ${v}` : `Remove pair ${pair}`); }
function resetSpacing() { delete doc.spacing; commit('Spacing back to the tables'); }
function spacingChanges() { const sp = doc.spacing; if (!sp) return 0; return (sp.fromInk ? 1 : 0) + Object.keys(sp.shape || {}).length + Object.keys(sp.kern || {}).length; }

// ── new letters from drops ──
function newGlyphs() { return doc.newGlyphs || {}; }
function addNewGlyph(key, init) { if (!doc.newGlyphs) doc.newGlyphs = {}; doc.newGlyphs[key] = Object.assign({ ch: key[0], name: key, height: 'small', thick: 1, ends: 'round', round: 0.5, strokes: [], use: false, shape: 'rr' }, init || {}); commit(`New letter ${key}`); }
function updateNewGlyph(key, patch, settle = true, label) { const g = doc.newGlyphs && doc.newGlyphs[key]; if (!g) return; Object.assign(g, patch); if (settle) commit(label || `Change ${key}`); else live(); }
function setStrokes(key, strokes, settle = true, label) { const g = doc.newGlyphs && doc.newGlyphs[key]; if (!g) return; g.strokes = clone(strokes); if (settle) commit(label || `Change the drops of ${key}`); else live(); }
function removeNewGlyph(key) { if (doc.newGlyphs) delete doc.newGlyphs[key]; commit(`Delete the letter ${key}`); }

// ── categories ──
// doc.categories: the list (editable); doc.category[ch]: which one a letter belongs to.
const DEFAULT_CATEGORIES = ['Letters', 'Capitals', 'Numbers', 'Punctuation', 'Diacritics', 'Ligatures', 'Pictos', 'Other'];
function categories() { return doc.categories || DEFAULT_CATEGORIES.slice(); }
function setCategories(list) { doc.categories = list.filter(Boolean); commit('Change the categories'); }
function categoryOf(ch) {
  if (doc.category && doc.category[ch]) return doc.category[ch];
  const g = newGlyphs(); for (const k in g) if (g[k].ch === ch && g[k].category) return g[k].category;
  if (/^[a-z]$/.test(ch)) return 'Letters'; if (/^[A-Z]$/.test(ch)) return 'Capitals'; if (/^[0-9]$/.test(ch)) return 'Numbers';
  if (/^[!?.,;:'"()\-–—&@#%*\/\\]$/.test(ch)) return 'Punctuation';
  if (/^[\u00C0-\u017F]$/.test(ch)) return 'Diacritics';
  return 'Other';
}
function setCategory(ch, cat) { (doc.category || (doc.category = {}))[ch] = cat; commit(`${ch} is a ${cat.toLowerCase()} glyph`); }

// ── files ──
function changeCount() { let n = 0; for (const ch in doc.glyphs) for (const v of doc.glyphs[ch].variants) n += Object.keys(v.light).length + Object.keys(v.black).length + (v.ops ? v.ops.length : 0); return n + Object.keys(doc.masters).length + spacingChanges() + Object.keys(doc.newGlyphs || {}).length; }
function toJSON() { doc.saved = new Date().toISOString(); return JSON.stringify(doc, null, 1); }
function download() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([toJSON()], { type: 'application/json' })); a.download = 'aqua-studio-edits.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  savedAt = at; listeners.forEach(f => f());
}
function openText(text) {
  const d = JSON.parse(text);
  if (!d || typeof d !== 'object' || !d.glyphs) throw new Error('not a Studio file');
  doc = Object.assign(empty(), d); commit('Open file'); savedAt = at; listeners.forEach(f => f());
}
function clearAll() { doc = empty(); commit('Clear every change'); }
function onChange(f) { listeners.add(f); return () => listeners.delete(f); }
function get() { return doc; }

return { init, get, commit, live, undo, redo, canUndo, canRedo, lastLabel, dirty,
         variants, variant, used, hasEdits, nudge, setNode, resetNode, nodeState, applyToAll, weightsDiffer, resetGlyph,
         addVariant, useVariant, renameVariant, removeVariant,
         importMaster, forgetMaster, hasMaster, changeCount, toJSON, download, openText, clearAll, onChange,
         setFromInk, setShape, setKern, resetSpacing, spacingChanges, spacing: spacingDoc,
         newGlyphs, addNewGlyph, updateNewGlyph, setStrokes, removeNewGlyph,
         insertNode, deleteNodes, hasOps, nudgeMany, categories, setCategories, categoryOf, setCategory };
});
