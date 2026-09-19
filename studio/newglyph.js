// Aqua Studio — the New-glyph room. A letter is made of drops on a tile grid: tap tiles to
// place them, drops that follow each other become one stroke, and the engine draws the
// stroke with the family's thickness and contrast at every weight. A faint reference image
// can sit behind the grid, and "Trace the image for me" turns it into a first set of drops.
(() => {
'use strict';
const E = window.AquaEngine, D = window.AquaDoc, H = window.AquaHealth;
const A = () => window.AquaStudio;
const T = E.TILE;
const HEIGHTS = { small: ['Small letters', 521], caps: ['Capitals', 715], tall: ['Tall letters', 751] };
const ng = { key: null, tool: 'add', sel: null, active: null, zoom: 1, pan: [0, 0], view: null, connectFrom: null, hover: null, image: null };
const r1 = v => Math.round(v * 10) / 10, r0 = v => Math.round(v);
const snap = v => Math.round(v / T) * T;
const ICON = {
  select: '<svg viewBox="0 0 20 20"><path d="M4 3l12 7-5 1-3 5z"/></svg>',
  add: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="6"/><path d="M10 7v6M7 10h6"/></svg>',
  connect: '<svg viewBox="0 0 20 20"><circle cx="5" cy="14" r="2.5"/><circle cx="15" cy="6" r="2.5"/><path d="M7 12l6-4"/></svg>',
  move: '<svg viewBox="0 0 20 20"><path d="M10 3v14M3 10h14"/></svg>',
  erase: '<svg viewBox="0 0 20 20"><path d="M4 16L16 4M6 4h10v10"/></svg>',
  nudge: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3"/></svg>'
};

const glyphOf = () => D.newGlyphs()[ng.key];
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
function findDrop(p) { const g = glyphOf(); for (let si = 0; si < g.strokes.length; si++) { const st = g.strokes[si]; for (let i = 0; i < st.length; i++) if (same(st[i], p)) return { si, i }; } return null; }
function adjacent(a, b) { return Math.abs(a[0] - b[0]) <= 1.5 * T && Math.abs(a[1] - b[1]) <= 1.5 * T && !same(a, b); }
function outlineAt(s) { const g = glyphOf(); return g ? E.dropsOutline(g, s) : null; }

// ── the room ──
function room(root) {
  const { S, glyphSVG, weightPicker, bindWeightPicker, esc, shown, setGlyph } = A();
  root.classList.add('three');
  const g = glyphOf(); if (!g) { S.newKey = null; A().renderRoom(); return; }
  const s = S.stem, d = outlineAt(s), nDrops = g.strokes.reduce((n, st) => n + st.length, 0);
  const tool = (key, name, title) => `<div class="t ${ng.tool === key ? 'on' : ''}" data-tool="${key}" title="${title}">${ICON[key]}${name}</div>`;
  const all = D.newGlyphs();
  root.innerHTML = `
    <aside class="side">
      <input class="search" placeholder="Search letters…" id="search">
      <h6>Letters</h6>
      <div class="matrix" id="matrix">${E.ORDER.split('').map(c => `<div class="c h-${S.health[c] ? S.health[c].colour : ''}" data-ch="${esc(c)}">${glyphSVG(c, s, { box: 'metrics', pad: 4 })}</div>`).join('')}
        ${Object.keys(all).map(k => `<div class="c gen ${k === ng.key ? 'on' : ''}" data-new="${esc(k)}" title="${esc(all[k].name)} · ${all[k].use === false ? 'draft' : 'in Aqua'}">${all[k].strokes.length ? glyphSVG(all[k].ch, s, { box: 'metrics', pad: 4, d: E.dropsOutline(all[k], s), fill: 'nonzero' }) : `<b>${esc(all[k].ch || '?')}</b>`}</div>`).join('')}
        <div class="c gen plus" data-act="newletter" title="Start a new letter">+</div></div>
      <div class="key"><i style="background:var(--panel);border:1px solid var(--line)"></i>drawn &nbsp; <i style="border:1.5px dashed var(--blue)"></i>from drops &nbsp; <i style="background:var(--tile)"></i>later</div>
      <h6>Reference</h6>
      ${ng.image && ng.image.key === ng.key ? `<div class="var on"><span>${esc(ng.image.name)}</span><span>${r0(ng.image.opacity * 100)}%</span></div>` : ''}
      <div class="var new" data-act="addimage"><span>+ Add image</span><span></span></div>
      <input type="file" id="imgfile" accept="image/*" style="display:none">
    </aside>
    <div class="canvas" id="canvas">${canvasSVG(g, s, d)}
      <div class="crumb"><b>New glyph · ${esc(g.name)}</b> &nbsp;·&nbsp; ${E.weightName(s)} &nbsp;·&nbsp; ${nDrops} drops${g.use === false ? ' · draft' : ' · in Aqua'}</div>
      <div class="pill" data-y="${HEIGHTS[g.height][1]}">${HEIGHTS[g.height][0]}</div>
      <div class="pill" data-y="0">Baseline</div>
      <div class="hint" id="hint">${ng.tool === 'add' ? (ng.active != null ? 'tap to continue the stroke · Esc to start a new one' : 'tap a tile to start a stroke') : ng.tool === 'connect' ? (ng.connectFrom ? 'now tap the drop to join it to' : 'tap a drop, then another') : ng.tool === 'erase' ? 'tap a drop to remove it' : ''}</div>
      <div class="tools" id="tools">
        ${tool('select', 'Select', 'Drag a drop')}${tool('add', 'Add drop', 'Tap tiles to place drops')}${tool('connect', 'Connect', 'Join two drops into one stroke')}${tool('move', 'Move', 'Drag to move the whole letter')}${tool('erase', 'Erase', 'Tap a drop to remove it')}${tool('nudge', 'Nudge', 'Arrow keys move the selected drop one tile')}
      </div>
      <div class="preview">
        <div class="pv"><div class="box">${d ? glyphSVG(g.ch, s, { box: 'metrics', d, fill: 'nonzero' }) : ''}</div>Final</div>
        <div class="pv blur"><div class="box">${d ? glyphSVG(g.ch, s, { box: 'metrics', d, fill: 'nonzero' }) : ''}</div>Squint</div>
        <div class="pv neg"><div class="box">${d ? glyphSVG(g.ch, s, { box: 'metrics', d, fill: 'nonzero' }) : ''}</div>Negative</div>
      </div>
    </div>
    <aside class="insp" id="insp"></aside>
    <div class="bottom">
      ${E.WEIGHTS.map(w => `<div class="wt ${w.stem === s ? 'on' : ''}" data-stem="${w.stem}">${d ? glyphSVG(g.ch, w.stem, { box: 'metrics', d: E.dropsOutline(g, w.stem), fill: 'nonzero' }) : ''}<small>${w.name}</small></div>`).join('')}
      <div class="note">Tap tiles to place drops. Drops that follow each other become one stroke. The letter's thickness and ends are applied for you, in every weight.</div>
    </div>`;
  renderInspector();
  root.querySelector('#matrix').onclick = e => {
    const c = e.target.closest('[data-ch]'); if (c) { S.newKey = null; setGlyph(c.dataset.ch); return; }
    const n = e.target.closest('[data-new]'); if (n) { ng.key = n.dataset.new; S.newKey = ng.key; ng.sel = null; A().renderRoom(); return; }
    if (e.target.closest('[data-act="newletter"]')) startNew();
  };
  root.querySelectorAll('[data-act="addimage"]').forEach(b => b.onclick = () => root.querySelector('#imgfile').click());
  root.querySelector('#imgfile').onchange = e => { const f = e.target.files[0]; if (f) loadImage(f); e.target.value = ''; };
  root.querySelectorAll('.bottom .wt').forEach(w => w.onclick = () => A().setStem(+w.dataset.stem));
  root.querySelector('#tools').onclick = e => { const t = e.target.closest('[data-tool]'); if (!t) return; ng.tool = t.dataset.tool; ng.connectFrom = null; A().renderRoom(); };
  bindCanvas();
  positionPills();
}
function startNew() {
  const name = prompt('Name for the new letter (one character to type it, or a word like "anchor")', '');
  if (!name) return;
  const ch = name.length === 1 ? name : name[0];
  const key = name.trim();
  if (D.newGlyphs()[key]) { alert('There is already a letter called ' + key); return; }
  if (E.ORDER.includes(ch) && name.length === 1) { if (!confirm(`"${ch}" is already in Aqua. Make a drops version anyway? It will not replace the drawn one until you add it.`)) return; }
  D.addNewGlyph(key, { ch, name: key, height: /[A-Z]/.test(ch) ? 'caps' : 'small', use: false });
  ng.key = key; A().S.newKey = key; ng.sel = null; ng.tool = 'add'; ng.zoom = 1; ng.pan = [0, 0];
  A().renderRoom();
}

// ── canvas ──
function viewBox(g) {
  const cv = document.getElementById('canvas');
  const cw = cv ? cv.clientWidth || 1000 : 1000, chh = cv ? cv.clientHeight || 800 : 800;
  const x0 = -160, x1 = 760, y0 = -330, y1 = 830;
  const k0 = Math.min(cw / (x1 - x0), chh / (y1 - y0)), k = k0 * ng.zoom;
  const W = cw / k, Hh = chh / k, cx = (x0 + x1) / 2 + ng.pan[0], cy = (y0 + y1) / 2 + ng.pan[1];
  return { x: cx - W / 2, y: cy - Hh / 2, w: W, h: Hh, k };
}
function canvasSVG(g, s, d) {
  const v = viewBox(g); ng.view = v;
  const R = 8 / v.k, SW = 2.2 / v.k, far = 4000, hy = HEIGHTS[g.height][1];
  const img = ng.image && ng.image.key === ng.key ? ng.image : null;
  return `<svg viewBox="${r1(v.x)} ${r1(-(v.y + v.h))} ${r1(v.w)} ${r1(v.h)}" preserveAspectRatio="xMidYMid meet" id="cv">
    <defs><pattern id="tiles" width="${T}" height="${T}" patternUnits="userSpaceOnUse" x="${-T / 2}" y="${-T / 2}"><rect width="${T}" height="${T}" fill="none" stroke="var(--line)" stroke-width="${r1(1 / v.k)}"/><circle cx="${T / 2}" cy="${T / 2}" r="${r1(1.4 / v.k)}" fill="var(--dots)"/></pattern></defs>
    <g transform="scale(1,-1)" id="flip">
      <rect x="${r1(v.x - far)}" y="${r1(v.y - far)}" width="${r1(v.w + 2 * far)}" height="${r1(v.h + 2 * far)}" fill="url(#tiles)"/>
      ${img ? `<image href="${img.src}" x="${r1(img.x)}" y="${r1(img.y + img.h)}" width="${r1(img.w)}" height="${r1(img.h)}" transform="scale(1,-1)" opacity="${img.opacity}" preserveAspectRatio="none" style="pointer-events:none"/>` : ''}
      <line class="guide" x1="${r1(v.x - far)}" x2="${r1(v.x + v.w + far)}" y1="${hy}" y2="${hy}" style="stroke-width:${r1(1 / v.k)}"/>
      <line class="guide base" x1="${r1(v.x - far)}" x2="${r1(v.x + v.w + far)}" y1="0" y2="0" style="stroke-width:${r1(1.5 / v.k)}"/>
      ${d ? `<path class="skin" id="skin" d="${d}" fill-rule="nonzero" style="stroke-width:${r1(1 / v.k)}"/>` : ''}
      <g id="bones" fill="none" stroke="var(--blue)" stroke-opacity=".9" style="stroke-width:${r1(2.2 / v.k)}">${g.strokes.map(st => st.length > 1 ? `<path d="${E.spinePath(st, g.round == null ? 0.5 : g.round)}"/>` : '').join('')}</g>
      ${ng.hover ? `<rect class="hovertile" x="${ng.hover[0] - T / 2}" y="${ng.hover[1] - T / 2}" width="${T}" height="${T}" rx="${r1(6 / v.k)}"/>` : ''}
      <g id="drops">${g.strokes.map((st, si) => st.map((p, i) => `<circle class="node ${ng.sel && ng.sel.si === si && ng.sel.i === i ? 'sel' : ''} ${ng.connectFrom && ng.connectFrom.si === si && ng.connectFrom.i === i ? 'from' : ''}" data-si="${si}" data-i="${i}" cx="${p[0]}" cy="${p[1]}" r="${r1(R)}" style="stroke-width:${r1(SW)}"/>`).join('')).join('')}</g>
    </g>
  </svg>`;
}
function redraw() { const g = glyphOf(); if (!g) return; const { S } = A(); const old = document.getElementById('cv'); if (!old) return; old.outerHTML = canvasSVG(g, S.stem, outlineAt(S.stem)); bindCanvas(); positionPills(); updatePreviews(); }
function updatePreviews() {
  const g = glyphOf(); const { S, glyphSVG } = A(); const d = outlineAt(S.stem);
  document.querySelectorAll('.preview .box').forEach(box => { box.innerHTML = d ? glyphSVG(g.ch, S.stem, { box: 'metrics', d, fill: 'nonzero' }) : ''; });
  document.querySelectorAll('.bottom .wt').forEach(w => { const st = +w.dataset.stem; const svg = d ? glyphSVG(g.ch, st, { box: 'metrics', d: E.dropsOutline(g, st), fill: 'nonzero' }) : ''; w.innerHTML = svg + `<small>${E.weightName(st)}</small>`; });
  const crumb = document.querySelector('.crumb'); if (crumb) crumb.innerHTML = `<b>New glyph · ${g.name}</b> &nbsp;·&nbsp; ${E.weightName(S.stem)} &nbsp;·&nbsp; ${g.strokes.reduce((n, st) => n + st.length, 0)} drops${g.use === false ? ' · draft' : ' · in Aqua'}`;
}
function positionPills() {
  const cv = document.getElementById('canvas'); if (!cv || !ng.view) return;
  const v = ng.view, chh = cv.clientHeight, k = v.k;
  cv.querySelectorAll('.pill').forEach(p => { const top = (v.y + v.h - (+p.dataset.y)) * k; p.style.top = top + 'px'; p.style.display = top < 0 || top > chh ? 'none' : ''; });
}
function toUnits(e) { const svg = document.getElementById('cv'), flip = document.getElementById('flip'); const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(flip.getScreenCTM().inverse()); return [p.x, p.y]; }
function bindCanvas() {
  const svg = document.getElementById('cv'), cv = document.getElementById('canvas'); if (!svg) return;
  let drag = null;
  svg.onpointermove = e => {
    if (drag) { onDrag(e); return; }
    if (ng.tool !== 'add') return;
    const p = toUnits(e), t = [snap(p[0]), snap(p[1])];
    if (!ng.hover || !same(ng.hover, t)) { ng.hover = t; const h = svg.querySelector('.hovertile'); if (h) { h.setAttribute('x', t[0] - T / 2); h.setAttribute('y', t[1] - T / 2); } else redraw(); }
  };
  svg.onpointerleave = () => { if (ng.hover) { ng.hover = null; const h = svg.querySelector('.hovertile'); if (h) h.remove(); } };
  svg.onpointerdown = e => {
    if (e.button !== 0) return;
    const g = glyphOf(), p = toUnits(e), node = e.target.closest('.node'), t = [snap(p[0]), snap(p[1])];
    const hit = node ? { si: +node.dataset.si, i: +node.dataset.i } : null;
    if (ng.tool === 'add') {
      if (hit) { ng.sel = hit; ng.active = hit.si; redraw(); renderInspector(); return; }
      if (findDrop(t)) return;
      addDrop(t); return;
    }
    if (ng.tool === 'erase') { if (hit) eraseDrop(hit); return; }
    if (ng.tool === 'connect') { if (!hit) return; if (!ng.connectFrom) { ng.connectFrom = hit; redraw(); document.getElementById('hint').textContent = 'now tap the drop to join it to'; } else { connect(ng.connectFrom, hit); ng.connectFrom = null; } return; }
    if (ng.tool === 'move') { drag = { kind: 'all', start: p, applied: [0, 0] }; svg.setPointerCapture(e.pointerId); return; }
    // select / nudge
    if (hit) { ng.sel = hit; ng.active = hit.si; drag = { kind: 'drop', hit, start: p, base: g.strokes[hit.si][hit.i].slice(), moved: false }; redraw(); renderInspector(); svg.setPointerCapture(e.pointerId); }
    else { drag = { kind: 'pan', start: [e.clientX, e.clientY], pan: ng.pan.slice() }; svg.setPointerCapture(e.pointerId); }
  };
  const onDrag = e => {
    const g = glyphOf();
    if (drag.kind === 'pan') { ng.pan = [drag.pan[0] - (e.clientX - drag.start[0]) / ng.view.k, drag.pan[1] + (e.clientY - drag.start[1]) / ng.view.k]; const v = viewBox(g); ng.view = v; svg.setAttribute('viewBox', `${r1(v.x)} ${r1(-(v.y + v.h))} ${r1(v.w)} ${r1(v.h)}`); positionPills(); return; }
    const p = toUnits(e);
    if (drag.kind === 'drop') {
      const want = [snap(drag.base[0] + p[0] - drag.start[0]), snap(drag.base[1] + p[1] - drag.start[1])];
      const cur = g.strokes[drag.hit.si][drag.hit.i];
      if (!same(want, cur)) { const other = findDrop(want); if (other && !(other.si === drag.hit.si && other.i === drag.hit.i)) return; g.strokes[drag.hit.si][drag.hit.i] = want; drag.moved = true; D.setStrokes(ng.key, g.strokes, false); redraw(); }
    } else if (drag.kind === 'all') {
      const want = [snap(p[0] - drag.start[0]), snap(p[1] - drag.start[1])];
      const dx = want[0] - drag.applied[0], dy = want[1] - drag.applied[1];
      if (dx || dy) { g.strokes = g.strokes.map(st => st.map(q => [q[0] + dx, q[1] + dy])); drag.applied = want; D.setStrokes(ng.key, g.strokes, false); redraw(); }
    }
  };
  svg.onpointerup = svg.onpointercancel = e => {
    if (!drag) return; const dr = drag; drag = null; try { svg.releasePointerCapture(e.pointerId); } catch {}
    if (dr.kind === 'drop' && dr.moved) D.setStrokes(ng.key, glyphOf().strokes, true, 'Move a drop');
    else if (dr.kind === 'all' && (dr.applied[0] || dr.applied[1])) D.setStrokes(ng.key, glyphOf().strokes, true, 'Move the letter');
  };
  svg.ondblclick = e => { if (!e.target.closest('.node')) { ng.zoom = 1; ng.pan = [0, 0]; redraw(); } };
  cv.onwheel = e => { e.preventDefault(); const before = toUnits(e); ng.zoom = Math.max(0.5, Math.min(6, ng.zoom * Math.exp(-e.deltaY * 0.0015))); const v = viewBox(glyphOf()); ng.view = v; svg.setAttribute('viewBox', `${r1(v.x)} ${r1(-(v.y + v.h))} ${r1(v.w)} ${r1(v.h)}`); const after = toUnits(e); ng.pan = [ng.pan[0] + (before[0] - after[0]), ng.pan[1] + (before[1] - after[1])]; redraw(); };
}

// ── editing the drops ──
function addDrop(t) {
  const g = glyphOf(); let placed = null;
  // keep extending the stroke you are on (from whichever end is nearer); Esc starts a new one
  if (ng.active != null && g.strokes[ng.active] && g.strokes[ng.active].length) {
    const st = g.strokes[ng.active], a = st[0], b = st[st.length - 1];
    if (Math.hypot(t[0] - a[0], t[1] - a[1]) < Math.hypot(t[0] - b[0], t[1] - b[1]) && st.length > 1) { st.unshift(t); placed = { si: ng.active, i: 0 }; }
    else { st.push(t); placed = { si: ng.active, i: st.length - 1 }; }
  }
  if (!placed) {
    // touching the end of another stroke joins it; otherwise this is a new stroke
    for (let si = 0; si < g.strokes.length && !placed; si++) { const st = g.strokes[si];
      if (adjacent(st[st.length - 1], t)) { st.push(t); placed = { si, i: st.length - 1 }; }
      else if (adjacent(st[0], t)) { st.unshift(t); placed = { si, i: 0 }; } }
  }
  if (!placed) { g.strokes.push([t]); placed = { si: g.strokes.length - 1, i: 0 }; }
  ng.sel = placed; ng.active = placed.si;
  D.setStrokes(ng.key, g.strokes, true, 'Add a drop');
}
function eraseDrop(hit) {
  const g = glyphOf(), st = g.strokes[hit.si];
  const before = st.slice(0, hit.i), after = st.slice(hit.i + 1);
  g.strokes.splice(hit.si, 1, ...[before, after].filter(x => x.length));
  ng.sel = null; ng.active = null;
  D.setStrokes(ng.key, g.strokes, true, 'Remove a drop');
}
function connect(a, b) {
  const g = glyphOf(); if (a.si === b.si && a.i === b.i) return;
  const A_ = g.strokes[a.si], B_ = g.strokes[b.si];
  const isEnd = (st, i) => i === 0 || i === st.length - 1;
  if (a.si !== b.si && isEnd(A_, a.i) && isEnd(B_, b.i)) {
    // end to end: one stroke
    const first = a.i === 0 ? A_.slice().reverse() : A_.slice();
    const second = b.i === 0 ? B_.slice() : B_.slice().reverse();
    g.strokes.splice(Math.max(a.si, b.si), 1); g.strokes.splice(Math.min(a.si, b.si), 1);
    g.strokes.push(first.concat(second));
  } else if (a.si === b.si && isEnd(A_, a.i) && isEnd(B_, b.i)) {
    // close the loop
    g.strokes[a.si] = A_.concat([A_[0]]);
  } else {
    // a branch: a new stroke from a to b
    g.strokes.push([g.strokes[a.si][a.i], g.strokes[b.si][b.i]]);
  }
  ng.sel = null; ng.active = g.strokes.length - 1;
  D.setStrokes(ng.key, g.strokes, true, 'Connect two drops');
}
function nudgeSel(dx, dy) { const g = glyphOf(); if (!ng.sel || !g.strokes[ng.sel.si]) return; const p = g.strokes[ng.sel.si][ng.sel.i]; const want = [p[0] + dx * T, p[1] + dy * T]; if (findDrop(want)) return; g.strokes[ng.sel.si][ng.sel.i] = want; D.setStrokes(ng.key, g.strokes, true, 'Nudge a drop'); }

// ── inspector ──
function renderInspector() {
  const { S, weightPicker, bindWeightPicker, healthLines, esc } = A();
  const g = glyphOf(), insp = document.getElementById('insp'); if (!g || !insp) return;
  const img = ng.image && ng.image.key === ng.key ? ng.image : null;
  const rep = g.use !== false && g.strokes.length ? S.health[g.ch] : null;
  insp.innerHTML = `
    <h6>New glyph</h6>
    <div class="card" style="margin-top:0">
      <div class="kv"><span>Name</span><span><input class="num-in" id="ngname" value="${esc(g.name)}" style="width:110px;text-align:left"></span></div>
      <div class="kv"><span>Typed as</span><span><input class="num-in" id="ngch" value="${esc(g.ch)}" maxlength="1" style="width:44px;text-align:center"></span></div>
      <div class="kv"><span>Height</span><span class="seg s" id="ngheight">${Object.keys(HEIGHTS).map(k => `<b class="${g.height === k ? 'on' : ''}" data-h="${k}">${k === 'small' ? 'Small' : k === 'caps' ? 'Capitals' : 'Tall'}</b>`).join('')}</span></div>
      <div class="kv"><span>Thickness</span><span>${Math.abs((g.thick || 1) - 1) < 0.01 ? 'matches Aqua ✓' : `${Math.round((g.thick || 1) * 100)}% of Aqua`}</span></div>
      <div class="row" style="margin:4px 0"><label></label><input type="range" min="0.6" max="1.4" step="0.02" value="${g.thick || 1}" id="ngthick"><div class="v">${(g.thick || 1).toFixed(2)}</div></div>
      <div class="kv"><span>Ends</span><span class="seg s" id="ngends"><b class="${g.ends === 'flat' ? 'on' : ''}" data-e="flat">Flat</b><b class="${g.ends !== 'flat' ? 'on' : ''}" data-e="round">Drop</b></span></div>
      <div class="row" style="margin:6px 0 0"><label>Roundness</label><input type="range" min="0" max="1" step="0.05" value="${g.round == null ? 0.5 : g.round}" id="nground"><div class="v">${(g.round == null ? 0.5 : g.round).toFixed(2)}</div></div>
    </div>
    <h6>Reference image</h6>
    ${img ? `<div class="row"><label>Show</label><input type="range" min="0" max="1" step="0.05" value="${img.opacity}" id="ngopacity"><div class="v">${Math.round(img.opacity * 100)}%</div></div>
      <div class="btn" data-act="trace">Trace the image for me</div>
      <div class="btn" data-act="dropimage">Remove the image</div>` : `<p class="small sub" style="margin:0 0 8px">Add an image in the left column to draw over it, or to have the Studio trace it into drops.</p><div class="btn" data-act="addimage">Add an image</div>`}
    <h6 style="margin-top:16px">Drops</h6>
    ${ng.sel && g.strokes[ng.sel.si] ? `<div class="card sel" style="margin-top:0"><h6>Selected drop</h6><div class="kv"><span>At</span><span>x ${g.strokes[ng.sel.si][ng.sel.i][0]} · y ${g.strokes[ng.sel.si][ng.sel.i][1]}</span></div><div class="kv"><span>Stroke</span><span>${ng.sel.si + 1} of ${g.strokes.length} · drop ${ng.sel.i + 1} of ${g.strokes[ng.sel.si].length}</span></div>
      ${ng.tool === 'nudge' ? `<div class="pad" id="pad"><b data-n="0,1">↑</b><b data-n="-1,0">←</b><b data-n="0,-1">↓</b><b data-n="1,0">→</b><small>one tile</small></div>` : '<p class="small sub" style="margin:6px 0 0">Arrow keys move it one tile. Erase removes it.</p>'}</div>`
    : `<p class="small sub" style="margin:0">${g.strokes.length ? `${g.strokes.length} stroke${g.strokes.length > 1 ? 's' : ''}, ${g.strokes.reduce((n, st) => n + st.length, 0)} drops.` : 'No drops yet. Pick Add drop and tap the tiles.'}</p>`}
    ${g.use === false ? `<div class="btn pri ${g.strokes.length ? '' : 'off'}" data-act="use">Add to Aqua</div>` : `<div class="btn" data-act="draft">Keep as a draft (out of the text)</div>`}
    <div class="btn" data-act="clear" title="Remove every drop">Start over</div>
    <div class="btn" data-act="delete">Delete this letter</div>
    ${rep ? healthLines(rep) : `<div class="health"><b>✓</b>Thickness and ends match Aqua<br><b class="q">?</b>${g.use === false ? 'Add it to Aqua to see its health' : 'Place some drops to see its health'}</div>`}`;
  const upd = (patch, label, settle = true) => D.updateNewGlyph(ng.key, patch, settle, label);
  insp.querySelector('#ngname').onchange = e => upd({ name: e.target.value.trim() || g.name }, 'Rename the letter');
  insp.querySelector('#ngch').onchange = e => { const c = e.target.value; if (c.length === 1) upd({ ch: c }, 'Change how the letter is typed'); };
  insp.querySelector('#ngheight').onclick = e => { const b = e.target.closest('[data-h]'); if (b) { upd({ height: b.dataset.h }, 'Change the height'); if (ng.image) fitImage(); } };
  insp.querySelector('#ngends').onclick = e => { const b = e.target.closest('[data-e]'); if (b) upd({ ends: b.dataset.e }, 'Change the ends'); };
  const thick = insp.querySelector('#ngthick'); thick.oninput = () => { upd({ thick: +thick.value }, null, false); thick.nextElementSibling.textContent = (+thick.value).toFixed(2); redraw(); }; thick.onchange = () => upd({ thick: +thick.value }, 'Change the thickness');
  const rnd = insp.querySelector('#nground'); rnd.oninput = () => { upd({ round: +rnd.value }, null, false); rnd.nextElementSibling.textContent = (+rnd.value).toFixed(2); redraw(); }; rnd.onchange = () => upd({ round: +rnd.value }, 'Change the roundness');
  const op = insp.querySelector('#ngopacity'); if (op) op.oninput = () => { ng.image.opacity = +op.value; op.nextElementSibling.textContent = Math.round(op.value * 100) + '%'; const im = document.querySelector('#cv image'); if (im) im.setAttribute('opacity', op.value); };
  insp.querySelectorAll('[data-act]').forEach(el => el.onclick = () => {
    const act = el.dataset.act; if (el.classList.contains('off')) return;
    if (act === 'trace') traceNow();
    else if (act === 'dropimage') { ng.image = null; A().renderRoom(); }
    else if (act === 'addimage') document.getElementById('imgfile').click();
    else if (act === 'use') upd({ use: true }, `Add ${g.name} to Aqua`);
    else if (act === 'draft') upd({ use: false }, `Keep ${g.name} as a draft`);
    else if (act === 'clear') { if (confirm('Remove every drop of this letter?')) { ng.sel = null; D.setStrokes(ng.key, [], true, 'Start the letter over'); } }
    else if (act === 'delete') { if (confirm(`Delete the letter "${g.name}"?`)) { const k = ng.key; ng.key = null; A().S.newKey = null; D.removeNewGlyph(k); } }
  });
  const pad = insp.querySelector('#pad'); if (pad) pad.onclick = e => { const b = e.target.closest('[data-n]'); if (b) { const [dx, dy] = b.dataset.n.split(',').map(Number); nudgeSel(dx, dy); } };
}

// ── the reference image and the tracer ──
function loadImage(file) {
  const rd = new FileReader();
  rd.onload = () => { const im = new Image(); im.onload = () => { ng.image = { key: ng.key, name: file.name, src: rd.result, el: im, opacity: 0.4 }; fitImage(); A().renderRoom(); }; im.src = rd.result; };
  rd.readAsDataURL(file);
}
// fit the image's height to the chosen height, sitting on the baseline, starting at x = 0
function fitImage() {
  const g = glyphOf(), im = ng.image; if (!im || !g) return;
  const hy = HEIGHTS[g.height][1];
  im.h = hy; im.w = hy * im.el.width / im.el.height; im.x = 0; im.y = 0;
}
// image → drops: threshold, thin to a one-pixel skeleton, walk it into strokes, snap to tiles
function traceImage(imgEl, placement, tile = T) {
  const cell = tile / 4;
  const W = Math.max(4, Math.round(placement.w / cell)), Hh = Math.max(4, Math.round(placement.h / cell));
  const c = document.createElement('canvas'); c.width = W; c.height = Hh;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, Hh); ctx.drawImage(imgEl, 0, 0, W, Hh);
  const px = ctx.getImageData(0, 0, W, Hh).data;
  let lo = 255, hi = 0; const lum = new Float32Array(W * Hh);
  for (let i = 0; i < W * Hh; i++) { const a = px[i * 4 + 3] / 255; const l = (0.3 * px[i * 4] + 0.59 * px[i * 4 + 1] + 0.11 * px[i * 4 + 2]) * a + 255 * (1 - a); lum[i] = l; if (l < lo) lo = l; if (l > hi) hi = l; }
  const thr = lo + (hi - lo) * 0.5;
  let bin = new Uint8Array(W * Hh); for (let i = 0; i < W * Hh; i++) bin[i] = lum[i] < thr ? 1 : 0;
  // Zhang–Suen thinning
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= Hh) ? 0 : bin[y * W + x];
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of [0, 1]) {
      const kill = [];
      for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
        if (!at(x, y)) continue;
        const p2 = at(x, y - 1), p3 = at(x + 1, y - 1), p4 = at(x + 1, y), p5 = at(x + 1, y + 1), p6 = at(x, y + 1), p7 = at(x - 1, y + 1), p8 = at(x - 1, y), p9 = at(x - 1, y - 1);
        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9; if (B < 2 || B > 6) continue;
        const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2]; let A_ = 0; for (let i = 0; i < 8; i++) if (seq[i] === 0 && seq[i + 1] === 1) A_++; if (A_ !== 1) continue;
        if (step === 0 ? (p2 * p4 * p6 || p4 * p6 * p8) : (p2 * p4 * p8 || p2 * p6 * p8)) continue;
        kill.push(y * W + x);
      }
      if (kill.length) { changed = true; for (const i of kill) bin[i] = 0; }
    }
  }
  // walk the skeleton into polylines
  const nbrs = (x, y) => { const o = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && at(x + dx, y + dy)) o.push([x + dx, y + dy]); return o; };
  const seen = new Uint8Array(W * Hh), lines = [];
  const walk = (x, y, px_, py_) => {
    const line = [[px_, py_], [x, y]]; seen[py_ * W + px_] = 1; seen[y * W + x] = 1;
    let cx = x, cy = y;
    for (let guard = 0; guard < W * Hh; guard++) {
      const nb = nbrs(cx, cy).filter(([a, b]) => !seen[b * W + a]);
      if (nb.length !== 1 || nbrs(cx, cy).length > 2) break;
      cx = nb[0][0]; cy = nb[0][1]; seen[cy * W + cx] = 1; line.push([cx, cy]);
    }
    return line;
  };
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    if (!at(x, y) || seen[y * W + x]) continue;
    const deg = nbrs(x, y).length;
    if (deg === 2) continue;                     // start only at ends and junctions
    seen[y * W + x] = 1;
    for (const [nx, ny] of nbrs(x, y)) if (!seen[ny * W + nx]) lines.push(walk(nx, ny, x, y));
  }
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {   // closed loops left over
    if (!at(x, y) || seen[y * W + x]) continue;
    const nb = nbrs(x, y); if (nb.length) { const l = walk(nb[0][0], nb[0][1], x, y); l.push([x, y]); lines.push(l); }
  }
  // simplify, scale into font units, snap to tiles
  const simplify = (pts, tol) => {
    if (pts.length < 3) return pts;
    let idx = 0, dmax = 0; const [a, b] = [pts[0], pts[pts.length - 1]];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    for (let i = 1; i < pts.length - 1; i++) { const p = pts[i]; const d = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L; if (d > dmax) { dmax = d; idx = i; } }
    if (dmax > tol) { const l = simplify(pts.slice(0, idx + 1), tol), r = simplify(pts.slice(idx), tol); return l.slice(0, -1).concat(r); }
    return [a, b];
  };
  const strokes = [];
  for (const l of lines) {
    const sm = simplify(l, 1.5);
    const st = []; for (const [x, y] of sm) { const u = [Math.round((placement.x + (x + 0.5) * cell) / tile) * tile, Math.round((placement.y + placement.h - (y + 0.5) * cell) / tile) * tile]; if (!st.length || !same(st[st.length - 1], u)) st.push(u); }
    if (st.length) strokes.push(st);
  }
  return tidy(strokes);
}
// after snapping, many short pieces meet on the same tile: join them end to end, and drop
// lone drops that sit against another stroke
function tidy(strokes) {
  const near = (a, b) => Math.abs(a[0] - b[0]) <= T && Math.abs(a[1] - b[1]) <= T;
  let list = strokes.map(st => st.slice()), joined = true;
  while (joined) {
    joined = false;
    outer: for (let i = 0; i < list.length; i++) for (let j = 0; j < list.length; j++) {
      if (i === j) continue;
      const a = list[i], b = list[j];
      const ends = [[a[a.length - 1], b[0], () => a.concat(same(a[a.length - 1], b[0]) ? b.slice(1) : b)],
                    [a[a.length - 1], b[b.length - 1], () => a.concat((same(a[a.length - 1], b[b.length - 1]) ? b.slice(0, -1) : b).reverse())],
                    [a[0], b[0], () => b.slice().reverse().concat(same(a[0], b[0]) ? a.slice(1) : a)],
                    [a[0], b[b.length - 1], () => b.concat(same(a[0], b[b.length - 1]) ? a.slice(1) : a)]];
      for (const [p, q, make] of ends) if (near(p, q)) { const m = make(); list.splice(Math.max(i, j), 1); list.splice(Math.min(i, j), 1); list.push(m); joined = true; break outer; }
    }
  }
  return list.filter((st, i) => st.length > 1 || !list.some((o, j) => j !== i && o.some(q => near(q, st[0]))));
}
function traceNow() {
  const g = glyphOf(), im = ng.image; if (!g || !im) return;
  const strokes = traceImage(im.el, { x: im.x, y: im.y, w: im.w, h: im.h });
  if (!strokes.length) { alert('Nothing dark enough to trace was found in the image.'); return; }
  ng.sel = null; ng.active = null;
  D.setStrokes(ng.key, strokes, true, 'Trace the image');
}

function keydown(e) {
  const { S } = A(); if (S.room !== 'Glyphs' || !S.newKey) return false;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName)) return false;
  const arrows = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  if (arrows[e.key] && ng.sel) { nudgeSel(...arrows[e.key]); return true; }
  if ((e.key === 'Backspace' || e.key === 'Delete') && ng.sel) { eraseDrop(ng.sel); return true; }
  if (e.key === 'Escape') { ng.sel = null; ng.active = null; ng.connectFrom = null; redraw(); renderInspector(); const h = document.getElementById('hint'); if (h && ng.tool === 'add') h.textContent = 'tap a tile to start a stroke'; return true; }
  return false;
}
window.AquaNew = { room, startNew, keydown, traceImage, state: ng, open: key => { ng.key = key; ng.sel = null; } };
})();
