// Aqua Studio — the Glyphs room with editing. Select points one at a time, with Shift, or by
// dragging a rectangle; drag them together, nudge them with the arrow keys, rotate or scale
// them; add a point on the outline, remove points; measure; hold Space to look around.
// Light and Black move together unless unlinked. Every change is undoable and kept in the
// document (AquaDoc); it shows in every room and on the export sheet.
(() => {
'use strict';
const E = window.AquaEngine, D = window.AquaDoc, AU = window.AquaAudit, H = window.AquaHealth;
const A = () => window.AquaStudio;
const GUIDES = [['Tall letters', 751], ['Capitals', 715], ['Small letters', 521], ['Middle', 268], ['Baseline', 0], ['Tails', -230]];
const guidesFor = ch => GUIDES.map(([n, y]) => n === 'Middle' ? [n, Math.round(0.515 * (ch === 'B' ? 715 : 521))] : [n, y]);
const SNAP_Y = [751, 715, 528, 521, 7, 0, -7, -230];
const ed = { tool: 'select', sel: new Set(), linked: true, compare: false, variant: 0, zoom: 1, pan: [0, 0], glyph: null, view: null,
             space: false, marquee: null, measure: null, ghosts: true, context: 'no', marks: true };
const r1 = v => Math.round(v * 10) / 10, r0 = v => Math.round(v);
const ICON = {
  select: '<svg viewBox="0 0 20 20"><path d="M4 3l12 7-5 1-3 5z"/></svg>',
  addpoint: '<svg viewBox="0 0 20 20"><path d="M3 14c4-9 10-9 14 0" /><circle cx="10" cy="7.3" r="2.4"/><path d="M10 3v2M10 10v2"/></svg>',
  move: '<svg viewBox="0 0 20 20"><path d="M10 3v14M3 10h14M7 6l3-3 3 3M7 14l3 3 3-3"/></svg>',
  nudge: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3"/></svg>',
  measure: '<svg viewBox="0 0 20 20"><path d="M3 15L15 3M5 13l1 1M8 10l1 1M11 7l1 1"/></svg>',
  compare: '<svg viewBox="0 0 20 20"><rect x="3" y="4" width="6" height="12"/><rect x="11" y="4" width="6" height="12"/></svg>'
};
const TOOLS = [['select', 'Select', 'V · click, Shift-click, or drag a rectangle to select points; drag them to move'],
               ['addpoint', 'Add point', 'A · click on the outline to add a point there'],
               ['move', 'Move', 'M · drag to move the whole letter'],
               ['nudge', 'Nudge', 'N · arrow keys move the selection one unit, Shift for ten'],
               ['measure', 'Measure', 'R · drag between two places to measure'],
               ['compare', 'Compare', 'C · show the letter before your changes, in red']];

const which = s => ed.linked ? 'both' : (s < 80 ? 'light' : 'black');
const whichName = s => ed.linked ? 'both weights' : (s < 80 ? 'Light only' : 'Black only');
function flatNodes(d) { const out = []; E.parsePath(d).forEach((sub, si) => sub.forEach((seg, j) => out.push({ p: seg[0], sub: si, first: j === 0 }))); return out; }
function outlineNow(ch, s) { return E.outline(ch, s, ed.variant); }
function outlineBefore(ch, s) { const keep = E.getDoc(); E.setDoc(null); const d = E.outline(ch, s); E.setDoc(keep); return d; }
function where(p) { for (const [n, y] of GUIDES) if (n !== 'Middle' && Math.abs(p[1] - y) <= 12) return 'on ' + n; if (Math.abs(p[1] - 528) <= 12) return 'just over Small letters'; if (Math.abs(p[1] + 7) <= 12) return 'just under the Baseline'; return null; }
const selList = () => [...ed.sel].sort((a, b) => a - b);

// ── the room ──
function room(root) {
  const { S, glyphSVG, weightPicker, bindWeightPicker, esc, shown, setStem, setGlyph } = A();
  root.classList.add('three');
  const ch = S.glyph, s = S.stem;
  if (ed.glyph !== ch) { ed.glyph = ch; ed.sel = new Set(); ed.variant = D.used(ch); ed.zoom = 1; ed.pan = [0, 0]; ed.compare = false; ed.measure = null; }
  const vars = D.variants(ch); if (ed.variant >= vars.length) ed.variant = 0;
  const g = E.glyph(ch, s), d = outlineNow(ch, s), nodes = flatNodes(d), b = E.bbox(d);
  for (const i of [...ed.sel]) if (i >= nodes.length) ed.sel.delete(i);
  const tool = (key, name, title) => `<div class="t ${ed.tool === key || (key === 'compare' && ed.compare) ? 'on' : ''}" data-tool="${key}" title="${title}">${ICON[key]}${name}</div>`;
  const cats = D.categories();
  root.innerHTML = `
    <aside class="side">
      <input class="search" placeholder="Search letters…" value="${esc(S.search)}" id="search">
      <h6>Letters</h6>
      <div class="matrix" id="matrix">${E.ORDER.split('').map(c => {
        const h = S.health[c].colour, hide = S.search && !c.toLowerCase().includes(S.search.toLowerCase()) && !(E.GNAME[c] || '').includes(S.search.toLowerCase());
        const mark = D.hasEdits(c) || D.hasMaster(c) ? '<i class="edited" title="changed in this session"></i>' : '';
        return `<div class="c h-${h} ${c === ch ? 'on' : ''} ${hide ? 'hide' : ''}" data-ch="${esc(c)}" title="${shown(c)} · ${H.LABEL[h]}">${glyphSVG(c, s, { box: 'metrics', pad: 4 })}${mark}</div>`; }).join('')}
        ${Object.keys(D.newGlyphs()).map(k => { const ng = D.newGlyphs()[k]; return `<div class="c gen" data-new="${esc(k)}" title="${esc(ng.name)} · from drops${ng.use === false ? ' · draft' : ''}">${ng.strokes.length ? glyphSVG(ng.ch, s, { box: 'metrics', pad: 4, d: E.dropsOutline(ng, s), fill: 'nonzero' }) : `<b>${esc(ng.ch || '?')}</b>`}</div>`; }).join('')}
        <div class="c gen plus" data-act="newletter" title="Start a new letter (Cmd/Ctrl+N)">+</div></div>
      <div class="key"><i style="background:var(--ok)"></i>looks good &nbsp; <i style="background:var(--warn)"></i>needs a look &nbsp; <i style="background:var(--bad)"></i>not Aqua &nbsp; <i style="background:var(--blue)"></i>changed &nbsp; <i style="border:1.5px dashed var(--blue)"></i>from drops</div>
      <h6>Variations of ${shown(ch)}</h6>
      <div id="vars">${vars.map((v, i) => `<div class="var ${i === ed.variant ? 'on' : ''}" data-var="${i}"><span>${esc(v.name)}</span><span>${i === D.used(ch) ? 'in text' : ''}</span></div>`).join('')}
      <div class="var new" data-act="newvar"><span>+ New variation</span><span></span></div></div>
      ${vars.length > 1 && ed.variant !== D.used(ch) ? `<div class="btn" data-act="usevar" style="margin-top:4px">Use this one in text</div>` : ''}
      ${ed.variant > 0 ? `<div class="btn" data-act="delvar" style="margin-top:4px">Remove this variation</div>` : ''}
      <h6 style="margin-top:18px">Category</h6>
      <select class="sel" id="cat">${cats.map(c => `<option ${D.categoryOf(ch) === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
    </aside>
    <div class="canvas ${ed.space ? 'grab' : ''} tool-${ed.tool}" id="canvas">${canvasSVG(ch, s, d, nodes, g)}
      <div class="crumb"><b>${shown(ch)}</b>${ed.variant ? ' · ' + esc(vars[ed.variant].name) : ''} &nbsp;·&nbsp; ${E.weightName(s)} &nbsp;·&nbsp; ${nodes.length} points &nbsp;·&nbsp; ${A().KIND[g.kind].toLowerCase()}${D.hasMaster(ch) ? ' · drawing brought in' : ''}</div>
      ${guidesFor(ch).map(([n, y]) => `<div class="pill ${n === 'Middle' ? 'faint' : ''}" data-y="${y}">${n}</div>`).join('')}
      <div class="hint" id="hint">${hintFor()}</div>
      <div class="tools" id="tools">${TOOLS.map(([k, n, t]) => tool(k, n, t)).join('')}</div>
      <div class="preview">
        <div class="pv"><div class="box">${glyphSVG(ch, s, { box: 'metrics', d })}</div>Final</div>
        <div class="pv blur"><div class="box">${glyphSVG(ch, s, { box: 'metrics', d })}</div>Squint</div>
        <div class="pv neg"><div class="box">${glyphSVG(ch, s, { box: 'metrics', d })}</div>Negative</div>
      </div>
    </div>
    <aside class="insp" id="insp"></aside>
    <div class="bottom">
      ${E.WEIGHTS.map(w => `<div class="wt ${w.stem === s ? 'on' : ''} ${w.master ? '' : 'off'}" data-stem="${w.stem}" title="${w.master ? 'Drawn' : 'Planned — a blend of Light and Black for now'}">${glyphSVG(ch, w.stem, { box: 'metrics', d: outlineNow(ch, w.stem) })}<small>${w.name}${w.master ? '' : ' · planned'}</small></div>`).join('')}
      <div class="look" title="The whole set at this weight — the look the letter has to belong to">${A().lineSVG('aqua bonefish quick jazz', s, { h: 54 })}</div>
      <div class="note">Light and Black are drawn. Regular is a blend of the two until it gets its own drawing. The line shows the set at this weight: the letter has to belong to it.</div>
    </div>`;
  renderInspector();
  root.querySelector('#matrix').onclick = e => { const c = e.target.closest('[data-ch]'); if (c) { setGlyph(c.dataset.ch); return; }
    const n = e.target.closest('[data-new]'); if (n) { S.newKey = n.dataset.new; A().renderRoom(); return; }
    if (e.target.closest('[data-act="newletter"]')) window.AquaNew.startNew(); };
  root.querySelector('#search').oninput = e => { S.search = e.target.value; root.querySelectorAll('#matrix .c[data-ch]').forEach(c => {
    const k = c.dataset.ch, hit = !S.search || k.toLowerCase().includes(S.search.toLowerCase()) || (E.GNAME[k] || '').includes(S.search.toLowerCase());
    c.classList.toggle('hide', !hit); }); };
  root.querySelector('#vars').onclick = e => {
    const v = e.target.closest('[data-var]'); if (v) { ed.variant = +v.dataset.var; ed.sel = new Set(); A().renderRoom(); return; }
    if (e.target.closest('[data-act="newvar"]')) { const name = prompt('Name for the new variation', `${shown(ch)} · ${vars.length + 1}`); if (name) { const from = ed.variant; ed.variant = vars.length; ed.sel = new Set(); D.addVariant(ch, name, from); } }
  };
  root.querySelectorAll('[data-act="usevar"]').forEach(b => b.onclick = () => D.useVariant(ch, ed.variant));
  root.querySelectorAll('[data-act="delvar"]').forEach(b => b.onclick = () => { if (confirm(`Remove the variation "${vars[ed.variant].name}"?`)) { const i = ed.variant; ed.variant = 0; D.removeVariant(ch, i); } });
  root.querySelector('#cat').onchange = e => D.setCategory(ch, e.target.value);
  root.querySelectorAll('.bottom .wt').forEach(w => w.onclick = () => setStem(+w.dataset.stem));
  root.querySelector('#tools').onclick = e => { const t = e.target.closest('[data-tool]'); if (!t) return; setTool(t.dataset.tool); };
  bindCanvas();
  positionPills();
}
function hintFor() {
  return { select: ed.sel.size ? `${ed.sel.size} selected · drag to move · arrows nudge · Backspace removes` : 'click a point · Shift adds · drag a rectangle · Space + drag looks around',
           addpoint: 'click on the outline to add a point', move: 'drag anywhere to move the whole letter',
           nudge: 'arrow keys move the selection one unit, Shift for ten', measure: 'drag between two places' }[ed.tool] || '';
}
function setTool(t) {
  if (t === 'compare') ed.compare = !ed.compare; else ed.tool = t;
  ed.measure = null;
  redrawCanvas(); document.querySelectorAll('#tools .t').forEach(x => x.classList.toggle('on', x.dataset.tool === ed.tool || (x.dataset.tool === 'compare' && ed.compare)));
  const cv = document.getElementById('canvas'); if (cv) cv.className = `canvas ${ed.space ? 'grab' : ''} tool-${ed.tool}`;
  const h = document.getElementById('hint'); if (h) h.textContent = hintFor();
  renderInspector();
}

// ── canvas ──
function viewBox(ch, s, g, b) {
  const cv = document.getElementById('canvas');
  const cw = cv ? cv.clientWidth || 1000 : 1000, chh = cv ? cv.clientHeight || 800 : 800;
  const x0 = Math.min(-g.lsb, b.xmin) - 150, x1 = Math.max(g.w + g.rsb, b.xmax) + 150, y0 = -330, y1 = 830;
  const k0 = Math.min(cw / (x1 - x0), chh / (y1 - y0)), k = k0 * ed.zoom;
  const W = cw / k, Hh = chh / k, cx = (x0 + x1) / 2 + ed.pan[0], cy = (y0 + y1) / 2 + ed.pan[1];
  return { x: cx - W / 2, y: cy - Hh / 2, w: W, h: Hh, k, cx, cy };
}
// the letter's neighbours, laid out by the engine, drawn faint either side
function ghosts(ch, s) {
  if (!ed.ghosts) return '';
  const ctx = (ed.context || 'no').replace(/[^\S ]/g, ''), left = ctx.slice(0, Math.ceil(ctx.length / 2)), right = ctx.slice(Math.ceil(ctx.length / 2));
  const L = E.layout(left + ch + right, s); const mine = L.glyphs.findIndex((gl, i) => gl.key === ch && i >= left.replace(/ /g, '').length);
  if (mine < 0) return '';
  const tx0 = +L.glyphs[mine].tf.match(/-?[\d.]+/)[0];
  return L.glyphs.map((gl, i) => i === mine ? '' : `<g transform="translate(${r1(+gl.tf.match(/-?[\d.]+/)[0] - tx0)},0)"><path class="ghost" d="${gl.d}" fill-rule="${E.fillRule(gl.key)}"/></g>`).join('');
}
function canvasSVG(ch, s, d, nodes, g) {
  const b = E.bbox(d), v = viewBox(ch, s, g, b); ed.view = v;
  const R = 7.5 / v.k, SW = 2.2 / v.k, far = 4000;
  const before = ed.compare ? outlineBefore(ch, s) : null;
  const marks = ed.marks ? H.marks(ch, s) : [];
  let dark = []; try { const f = AU.audit(ch, s).findings.find(x => x.law === 'crowding' && !x.ok); dark = f && f.nodes ? f.nodes : []; } catch {}
  const mq = ed.marquee;
  return `<svg viewBox="${r1(v.x)} ${r1(-(v.y + v.h))} ${r1(v.w)} ${r1(v.h)}" preserveAspectRatio="xMidYMid meet" id="cv">
    <defs><pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="${r1(1.1 / v.k)}" fill="var(--dots)"/></pattern></defs>
    <g transform="scale(1,-1)" id="flip">
      <rect x="${r1(v.x - far)}" y="${r1(v.y - far)}" width="${r1(v.w + 2 * far)}" height="${r1(v.h + 2 * far)}" fill="url(#dots)"/>
      ${guidesFor(ch).map(([n, y]) => `<line class="guide ${y === 0 ? 'base' : ''} ${n === 'Middle' ? 'mid' : ''}" x1="${r1(v.x - far)}" x2="${r1(v.x + v.w + far)}" y1="${y}" y2="${y}" style="stroke-width:${r1((y === 0 ? 1.5 : 1) / v.k)}"/>`).join('')}
      <line class="boxline" x1="${r1(-g.lsb)}" x2="${r1(-g.lsb)}" y1="-260" y2="790" style="stroke-width:${r1(1 / v.k)}"/>
      <line class="boxline" x1="${r1(g.w + g.rsb)}" x2="${r1(g.w + g.rsb)}" y1="-260" y2="790" style="stroke-width:${r1(1 / v.k)}"/>
      <g id="ghosts">${ghosts(ch, s)}</g>
      ${before ? `<path class="before" d="${before}" fill-rule="evenodd" style="stroke-width:${r1(1.4 / v.k)}"/>` : ''}
      <path class="skin" id="skin" d="${d}" fill-rule="${E.fillRule(ch)}" style="stroke-width:${r1(1.1 / v.k)}"/>
      <g id="snaps"></g>
      <g id="dark">${dark.map(i => nodes[i] ? `<circle class="darkhalo" cx="${r1(nodes[i].p[0])}" cy="${r1(nodes[i].p[1])}" r="${r1(0.9 * s)}"/>` : '').join('')}</g>
      <g id="marks">${marks.map(m => nodes[m.node] ? `<g class="mark ${m.code}" data-node="${m.node}"><circle cx="${r1(nodes[m.node].p[0])}" cy="${r1(nodes[m.node].p[1])}" r="${r1(16 / v.k)}" class="markhalo"/><circle cx="${r1(nodes[m.node].p[0])}" cy="${r1(nodes[m.node].p[1])}" r="${r1(4 / v.k)}" class="markdot"/><title>${m.text}</title></g>` : '').join('')}</g>
      <g id="nodes">${nodes.map((n, i) => `<circle class="node ${n.first ? 'start' : ''} ${ed.sel.has(i) ? 'sel' : ''}" data-i="${i}" cx="${r1(n.p[0])}" cy="${r1(n.p[1])}" r="${r1(ed.sel.has(i) ? R * 1.2 : R)}" style="stroke-width:${r1(SW)}"/>`).join('')}</g>
      ${mq ? `<rect class="marquee" x="${r1(Math.min(mq.x0, mq.x1))}" y="${r1(Math.min(mq.y0, mq.y1))}" width="${r1(Math.abs(mq.x1 - mq.x0))}" height="${r1(Math.abs(mq.y1 - mq.y0))}" style="stroke-width:${r1(1 / v.k)}"/>` : ''}
      ${ed.measure ? measureSVG(v) : ''}
    </g>
  </svg>`;
}
function measureSVG(v) {
  const m = ed.measure, dx = m.b[0] - m.a[0], dy = m.b[1] - m.a[1], L = Math.hypot(dx, dy);
  const mid = [(m.a[0] + m.b[0]) / 2, (m.a[1] + m.b[1]) / 2], fs = 12 / v.k;
  return `<g class="measure"><line x1="${r1(m.a[0])}" y1="${r1(m.a[1])}" x2="${r1(m.b[0])}" y2="${r1(m.b[1])}" style="stroke-width:${r1(1.2 / v.k)}"/>
    <circle cx="${r1(m.a[0])}" cy="${r1(m.a[1])}" r="${r1(3 / v.k)}"/><circle cx="${r1(m.b[0])}" cy="${r1(m.b[1])}" r="${r1(3 / v.k)}"/>
    <g transform="translate(${r1(mid[0])},${r1(mid[1])}) scale(1,-1)"><rect x="${r1(-46 / v.k)}" y="${r1(-fs * 1.3)}" width="${r1(92 / v.k)}" height="${r1(fs * 1.8)}" rx="${r1(4 / v.k)}" class="mlabel"/><text text-anchor="middle" y="${r1(fs * 0.05)}" style="font-size:${r1(fs)}px">${r0(L)} · ${r0(Math.abs(dx))} across, ${r0(Math.abs(dy))} up</text></g></g>`;
}
function redrawCanvas() {
  const { S } = A(); const ch = S.glyph, s = S.stem;
  const g = E.glyph(ch, s), d = outlineNow(ch, s), nodes = flatNodes(d);
  const old = document.getElementById('cv'); if (!old) return;
  old.outerHTML = canvasSVG(ch, s, d, nodes, g);
  bindCanvas(); positionPills();
}
function updateLive() {
  const { S, glyphSVG } = A(); const ch = S.glyph, s = S.stem;
  const d = outlineNow(ch, s), nodes = flatNodes(d);
  const skin = document.getElementById('skin'); if (skin) skin.setAttribute('d', d);
  document.querySelectorAll('#nodes .node').forEach((c, i) => { if (nodes[i]) { c.setAttribute('cx', r1(nodes[i].p[0])); c.setAttribute('cy', r1(nodes[i].p[1])); } });
  document.querySelectorAll('.preview .box').forEach(box => { box.innerHTML = glyphSVG(ch, s, { box: 'metrics', d }); });
  const pos = document.getElementById('selpos'); if (pos && ed.sel.size === 1) { const n = nodes[selList()[0]]; if (n) pos.textContent = `x ${r0(n.p[0])} · y ${r0(n.p[1])}`; }
  const nd = document.getElementById('selnudge'); if (nd && ed.sel.size === 1) nd.textContent = nudgedText(ch, selList()[0]);
}
function positionPills() {
  const cv = document.getElementById('canvas'); if (!cv || !ed.view) return;
  const v = ed.view, chh = cv.clientHeight, k = v.k;
  cv.querySelectorAll('.pill').forEach(p => { const y = +p.dataset.y; const top = (v.y + v.h - y) * k; p.style.top = top + 'px'; p.style.display = top < 0 || top > chh ? 'none' : ''; });
}
addEventListener('resize', () => { if (document.getElementById('cv') && !A().S.newKey) redrawCanvas(); });
function toUnits(e) { const svg = document.getElementById('cv'), flip = document.getElementById('flip'); const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(flip.getScreenCTM().inverse()); return [p.x, p.y]; }
function setView() { const { S } = A(); const ch = S.glyph, s = S.stem; const v = viewBox(ch, s, E.glyph(ch, s), E.bbox(outlineNow(ch, s))); ed.view = v; const svg = document.getElementById('cv'); if (svg) svg.setAttribute('viewBox', `${r1(v.x)} ${r1(-(v.y + v.h))} ${r1(v.w)} ${r1(v.h)}`); positionPills(); }
function zoomBy(f, at) {
  const before = at ? toUnits(at) : null;
  ed.zoom = Math.max(0.4, Math.min(8, ed.zoom * f)); setView();
  if (before) { const after = toUnits(at); ed.pan = [ed.pan[0] + (before[0] - after[0]), ed.pan[1] + (before[1] - after[1])]; }
  redrawCanvas();
}
function snap(want, self, nodes, shift) {
  const lines = []; let [x, y] = want;
  if (!shift) {
    const tol = 8 / ed.view.k; let bestY = null, bestX = null;
    for (const gy of SNAP_Y) if (Math.abs(y - gy) <= tol && (bestY == null || Math.abs(y - gy) < Math.abs(y - bestY))) bestY = gy;
    nodes.forEach((n, i) => { if (ed.sel.has(i) || i === self) return;
      if (Math.abs(y - n.p[1]) <= tol && (bestY == null || Math.abs(y - n.p[1]) < Math.abs(y - bestY))) bestY = n.p[1];
      if (Math.abs(x - n.p[0]) <= tol && (bestX == null || Math.abs(x - n.p[0]) < Math.abs(x - bestX))) bestX = n.p[0]; });
    if (bestY != null) { y = bestY; lines.push(['y', bestY]); }
    if (bestX != null) { x = bestX; lines.push(['x', bestX]); }
  }
  return { p: [Math.round(x), Math.round(y)], lines };
}
function showSnaps(lines) {
  const g = document.getElementById('snaps'); if (!g) return; const v = ed.view, far = 4000;
  g.innerHTML = lines.map(([ax, val]) => ax === 'y' ? `<line class="snapline" x1="${r1(v.x - far)}" x2="${r1(v.x + v.w + far)}" y1="${val}" y2="${val}" style="stroke-width:${r1(1 / v.k)}"/>` : `<line class="snapline" y1="${r1(v.y - far)}" y2="${r1(v.y + v.h + far)}" x1="${val}" x2="${val}" style="stroke-width:${r1(1 / v.k)}"/>`).join('');
}
function bindCanvas() {
  const svg = document.getElementById('cv'), cv = document.getElementById('canvas'); if (!svg) return;
  const { S } = A();
  let drag = null;
  svg.onpointerdown = e => {
    if (e.button === 1) e.preventDefault();
    const ch = S.glyph, s = S.stem, node = e.target.closest('.node'), mark = e.target.closest('.mark');
    const p = toUnits(e);
    if (ed.space || e.button === 1) { drag = { kind: 'pan', start: [e.clientX, e.clientY], pan: ed.pan.slice() }; svg.setPointerCapture(e.pointerId); return; }
    if (e.button !== 0) return;
    if (mark) { const i = +mark.dataset.node; ed.sel = new Set([i]); redrawCanvas(); renderInspector(); return; }
    if (ed.tool === 'move') { drag = { kind: 'all', start: p, applied: [0, 0], n: flatNodes(outlineNow(ch, s)).length }; }
    else if (ed.tool === 'measure') { drag = { kind: 'measure' }; ed.measure = { a: p, b: p }; }
    else if (ed.tool === 'addpoint') {
      const near = E.nearestOnPath(outlineNow(ch, s), p[0], p[1]);
      if (near && near.dist < 24 / ed.view.k) { const at = D.insertNode(ch, ed.variant, near.sub, near.seg, near.t); ed.sel = new Set([at]); }
      return;
    }
    else if (node) {
      const i = +node.dataset.i;
      if (e.shiftKey) { if (ed.sel.has(i)) ed.sel.delete(i); else ed.sel.add(i); }
      else if (!ed.sel.has(i)) ed.sel = new Set([i]);
      document.querySelectorAll('#nodes .node').forEach((c, j) => c.classList.toggle('sel', ed.sel.has(j)));
      renderInspector();
      const nodes = flatNodes(outlineNow(ch, s));
      if (ed.sel.has(i)) drag = { kind: 'nodes', i, start: p, base: nodes[i].p.slice(), moved: false, total: [0, 0] };
    } else {
      drag = { kind: 'marquee', start: p, add: e.shiftKey };
      ed.marquee = { x0: p[0], y0: p[1], x1: p[0], y1: p[1] };
    }
    if (drag) { svg.setPointerCapture(e.pointerId); e.preventDefault(); }
  };
  svg.onpointermove = e => {
    if (!drag) return;
    const ch = S.glyph, s = S.stem, w = which(s);
    if (drag.kind === 'pan') { ed.pan = [drag.pan[0] - (e.clientX - drag.start[0]) / ed.view.k, drag.pan[1] + (e.clientY - drag.start[1]) / ed.view.k]; setView(); return; }
    const p = toUnits(e);
    if (drag.kind === 'nodes') {
      const nodes = flatNodes(outlineNow(ch, s));
      const want = [drag.base[0] + (p[0] - drag.start[0]), drag.base[1] + (p[1] - drag.start[1])];
      const sn = snap(want, drag.i, nodes, e.shiftKey);
      const cur = nodes[drag.i].p, dx = sn.p[0] - cur[0], dy = sn.p[1] - cur[1];
      if (dx || dy) { const deltas = {}; for (const k of ed.sel) deltas[k] = [dx, dy]; D.nudgeMany(ch, ed.variant, deltas, w, false); drag.moved = true; updateLive(); }
      showSnaps(sn.lines);
    } else if (drag.kind === 'all') {
      const want = [Math.round(p[0] - drag.start[0]), Math.round(p[1] - drag.start[1])];
      const dx = want[0] - drag.applied[0], dy = want[1] - drag.applied[1];
      if (dx || dy) { const deltas = {}; for (let i = 0; i < drag.n; i++) deltas[i] = [dx, dy]; D.nudgeMany(ch, ed.variant, deltas, w, false); drag.applied = want; updateLive(); }
    } else if (drag.kind === 'marquee') {
      ed.marquee.x1 = p[0]; ed.marquee.y1 = p[1];
      let r = svg.querySelector('.marquee'); if (!r) { r = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); r.setAttribute('class', 'marquee'); r.style.strokeWidth = r1(1 / ed.view.k); document.getElementById('flip').appendChild(r); }
      const m = ed.marquee; r.setAttribute('x', Math.min(m.x0, m.x1)); r.setAttribute('y', Math.min(m.y0, m.y1)); r.setAttribute('width', Math.abs(m.x1 - m.x0)); r.setAttribute('height', Math.abs(m.y1 - m.y0));
    } else if (drag.kind === 'measure') { ed.measure.b = p; const old = svg.querySelector('.measure'); if (old) old.remove(); document.getElementById('flip').insertAdjacentHTML('beforeend', measureSVG(ed.view)); }
  };
  svg.onpointerup = svg.onpointercancel = e => {
    if (!drag) return;
    const ch = S.glyph, s = S.stem; const dr = drag; drag = null; showSnaps([]);
    try { svg.releasePointerCapture(e.pointerId); } catch {}
    if (dr.kind === 'nodes' && dr.moved) D.commit(ed.sel.size > 1 ? `Move ${ed.sel.size} points of ${ch}` : `Move point ${dr.i + 1} of ${ch}`);
    else if (dr.kind === 'all' && (dr.applied[0] || dr.applied[1])) D.commit(`Move ${ch}`);
    else if (dr.kind === 'marquee') {
      const m = ed.marquee; ed.marquee = null;
      const nodes = flatNodes(outlineNow(ch, s));
      const x0 = Math.min(m.x0, m.x1), x1 = Math.max(m.x0, m.x1), y0 = Math.min(m.y0, m.y1), y1 = Math.max(m.y0, m.y1);
      const tiny = Math.abs(m.x1 - m.x0) < 3 / ed.view.k && Math.abs(m.y1 - m.y0) < 3 / ed.view.k;
      const hit = new Set(nodes.map((n, i) => n.p[0] >= x0 && n.p[0] <= x1 && n.p[1] >= y0 && n.p[1] <= y1 ? i : -1).filter(i => i >= 0));
      if (tiny) { if (!dr.add) ed.sel = new Set(); } else ed.sel = dr.add ? new Set([...ed.sel, ...hit]) : hit;
      redrawCanvas(); renderInspector();
    } else if (dr.kind === 'measure') { if (Math.hypot(ed.measure.b[0] - ed.measure.a[0], ed.measure.b[1] - ed.measure.a[1]) < 2) ed.measure = null; redrawCanvas(); }
  };
  svg.ondblclick = e => { if (!e.target.closest('.node')) { ed.zoom = 1; ed.pan = [0, 0]; redrawCanvas(); } };
  cv.onwheel = e => { e.preventDefault(); zoomBy(Math.exp(-e.deltaY * 0.0015), e); };
}

// ── inspector ──
function nudgedText(ch, i) {
  const st = D.nodeState(ch, ed.variant, i);
  const one = e => e && (e.d[0] || e.d[1]) ? `${r0(e.d[0])}, ${r0(e.d[1])}` : null;
  const l = one(st.light), b = one(st.black);
  if (!l && !b) return 'on the grid';
  if (JSON.stringify(st.light && st.light.d) === JSON.stringify(st.black && st.black.d)) return `nudged ${l}`;
  return `Light ${l || '0, 0'} · Black ${b || '0, 0'}`;
}
function transformSel(kind, amount) {
  const { S } = A(); const ch = S.glyph, s = S.stem, nodes = flatNodes(outlineNow(ch, s)), list = selList(); if (!list.length) return;
  const cx = list.reduce((a, i) => a + nodes[i].p[0], 0) / list.length, cy = list.reduce((a, i) => a + nodes[i].p[1], 0) / list.length;
  const deltas = {};
  for (const i of list) { const [x, y] = nodes[i].p; let nx = x, ny = y;
    if (kind === 'rotate') { const a = amount * Math.PI / 180, dx = x - cx, dy = y - cy; nx = cx + dx * Math.cos(a) - dy * Math.sin(a); ny = cy + dx * Math.sin(a) + dy * Math.cos(a); }
    else if (kind === 'scale') { nx = cx + (x - cx) * amount; ny = cy + (y - cy) * amount; }
    else if (kind === 'flipx') { nx = 2 * cx - x; } else if (kind === 'flipy') { ny = 2 * cy - y; }
    deltas[i] = [Math.round(nx) - x, Math.round(ny) - y]; }
  D.nudgeMany(ch, ed.variant, deltas, which(s), true, kind === 'rotate' ? `Rotate ${list.length} points of ${ch}` : kind === 'scale' ? `Scale ${list.length} points of ${ch}` : `Flip ${list.length} points of ${ch}`);
}
function renderInspector() {
  const { S, weightPicker, bindWeightPicker, healthLines, KIND, KIND_LONG, shown, esc } = A();
  const ch = S.glyph, s = S.stem, g = E.glyph(ch, s), d = outlineNow(ch, s), nodes = flatNodes(d), b = E.bbox(d);
  const insp = document.getElementById('insp'); if (!insp) return;
  const list = selList().filter(i => nodes[i]);
  const one = list.length === 1 ? nodes[list[0]] : null;
  const st = one ? D.nodeState(ch, ed.variant, list[0]) : null;
  const rNow = st ? (which(s) === 'black' ? (st.black && st.black.r) : (st.light && st.light.r)) ?? 1 : 1;
  const differ = D.weightsDiffer(ch, ed.variant), edited = D.hasEdits(ch, ed.variant);
  const th = 0.72 * s * E.contrastK(s);
  insp.innerHTML = `
    ${weightPicker()}
    <label class="check"><input type="checkbox" id="linked" ${ed.linked ? 'checked' : ''}> Light and Black move together</label>
    ${ed.linked ? '' : `<p class="small sub" style="margin:4px 0 10px">Editing <b>${whichName(s)}</b>. Pick Light or Black above to be sure which drawing you are changing.</p>`}
    ${edited || D.hasMaster(ch) ? `<div class="savebar ${D.dirty() ? 'dirty' : ''}"><span>${D.dirty() ? 'Changed · kept in this browser · not yet saved to a file' : 'Changed · saved to a file'}</span>${D.dirty() ? '<b data-act="savefile">Save</b>' : ''}</div>` : ''}
    ${one ? `<div class="card sel">
      <h6>Point ${list[0] + 1} of ${nodes.length}${where(one.p) ? ' · ' + where(one.p) : ''}</h6>
      <div class="kv"><span>Position</span><span id="selpos">x ${r0(one.p[0])} · y ${r0(one.p[1])}</span></div>
      <div class="kv"><span>Moved</span><span><span id="selnudge">${nudgedText(ch, list[0])}</span> · <a href="#" data-act="resetnode">reset to grid</a></span></div>
      <div class="row" style="margin:8px 0 2px"><label>Roundness</label><input type="range" min="0.5" max="1.6" step="0.02" value="${rNow}" id="round"><div class="v">${(+rNow).toFixed(2)}</div></div>
      ${ed.tool === 'nudge' ? `<div class="pad" id="pad"><b data-n="0,1">↑</b><b data-n="-1,0">←</b><b data-n="0,-1">↓</b><b data-n="1,0">→</b><small>one unit · Shift for ten</small></div>` : '<p class="small sub" style="margin:6px 0 0">Arrows move it, Shift for ten. Backspace removes it. Tab picks the next.</p>'}
      <div class="btn" data-act="delpts" style="margin-top:8px">Remove this point</div>
    </div>` : list.length > 1 ? `<div class="card sel">
      <h6>${list.length} points selected</h6>
      <div class="row" style="margin:6px 0"><label>Rotate</label><input type="number" class="num-in" id="rot" value="0" step="1" style="width:64px"><span class="sub small">°</span><div class="btn inline" data-act="rotate" style="margin:0 0 0 8px;padding:6px 10px">Apply</div></div>
      <div class="row" style="margin:6px 0"><label>Scale</label><input type="number" class="num-in" id="scl" value="100" step="1" style="width:64px"><span class="sub small">%</span><div class="btn inline" data-act="scale" style="margin:0 0 0 8px;padding:6px 10px">Apply</div></div>
      <div class="row" style="margin:6px 0"><label>Flip</label><div class="btn inline" data-act="flipx" style="margin:0;padding:6px 10px">Left ↔ right</div><div class="btn inline" data-act="flipy" style="margin:0 0 0 6px;padding:6px 10px">Up ↕ down</div></div>
      <div class="row" style="margin:6px 0"><label>Roundness</label><input type="range" min="0.5" max="1.6" step="0.02" value="1" id="round"><div class="v">1.00</div></div>
      <p class="small sub" style="margin:6px 0 0">Drag any selected point to move them all. Arrows nudge, Shift for ten. Backspace removes them.</p>
      <div class="btn" data-act="delpts" style="margin-top:8px">Remove these points</div>
      <div class="btn" data-act="resetsel">Reset them to the grid</div>
    </div>` : `<h6>This letter</h6>
    <div class="card" style="margin-top:0">
      <div class="kv"><span>Made</span><span class="ink">${KIND[g.kind]}</span></div>
      <div class="kv"><span>Width</span><span>${r0(g.w)} units</span></div>
      <div class="kv"><span>Room on the left</span><span>${r0(g.lsb)} units</span></div>
      <div class="kv"><span>Room on the right</span><span>${r0(g.rsb)} units</span></div>
      <div class="kv"><span>Points</span><span>${nodes.length}</span></div>
      <div class="kv"><span>Ink reaches</span><span>${r0(b.ymin)} to ${r0(b.ymax)}</span></div>
    </div>
    <p class="small sub" style="margin:0 0 6px">${KIND_LONG[g.kind]} Click a point to move it.</p>`}
    <div class="btn pri ${differ ? '' : 'off'}" data-act="applyall" title="${differ ? 'Carry the ' + (s < 80 ? 'Light' : 'Black') + ' edits onto the other weight' : 'Both weights already match'}">Apply to all weights</div>
    <div class="btn" data-act="savevar">Save as a variation</div>
    <div class="btn ${edited ? '' : 'off'}" data-act="reset">Start this letter over</div>
    ${D.hasMaster(ch) ? `<div class="btn" data-act="forget" title="Go back to the drawing the Studio had before you brought this one in">Forget the imported drawing</div>` : ''}
    ${healthLines(S.health[ch])}
    ${(() => { const r = AU.audit(ch, s); if (!r) return ''; return `<h6 style="margin-top:14px">Optical · at thickness ${s}</h6><div class="health">${r.findings.map(f => `<b class="${f.ok ? '' : 'w'}">${f.ok ? '✓' : '!'}</b>${esc(f.text)}<br>`).join('')}</div>`; })()}
    <details class="rules" ${ed.rulesOpen ? 'open' : ''}><summary>Aqua's rules at this weight</summary>
      <div class="kv"><span>Stem</span><span>${s} thick</span></div>
      <div class="kv"><span>Horizontals</span><span>${r0(th)} thick (${(th / s).toFixed(2)} of the stem)</span></div>
      <div class="kv"><span>Cut terminals</span><span>climb 0.34 to the right</span></div>
      <div class="kv"><span>Foot corners</span><span>${r0(0.30 * s)} (0.30 of the stem)</span></div>
      <div class="kv"><span>Shoulder of a cut</span><span>${r0(0.34 * s)} (0.34 of the stem)</span></div>
      <div class="kv"><span>Round overshoot</span><span>7 past the line</span></div>
      <div class="kv"><span>Small letters</span><span>521 · round tops 528</span></div>
      <div class="kv"><span>Capitals · Tall · Tails</span><span>715 · 751 · −230</span></div>
      <div class="kv"><span>Room base</span><span>${r1(E.bearing(s))} · flat 0.90 · round 0.82 · open 0.68</span></div>
      <p class="small sub" style="margin:8px 0 0">One stem, one cut, one foot, one shoulder: every letter is built from the same few parts, and what changes with the weight is a rule, not a number. That is what makes them a set.</p>
    </details>
    <details class="rules" ${ed.viewOpen ? 'open' : ''}><summary>On the canvas</summary>
      <label class="check"><input type="checkbox" id="ghosts" ${ed.ghosts ? 'checked' : ''}> Show the neighbours</label>
      <div class="row" style="margin:4px 0"><label>Between</label><input class="num-in" id="ctx" value="${esc(ed.context)}" maxlength="6" style="width:80px;text-align:left" title="the letters shown either side, e.g. no, nn, oo"></div>
      <label class="check"><input type="checkbox" id="marksck" ${ed.marks ? 'checked' : ''}> Mark bumps and overlapping points</label>
    </details>`;
  bindWeightPicker(insp);
  insp.querySelector('#linked').onchange = e => { ed.linked = e.target.checked; if (!ed.linked && s !== 53 && s !== 106) A().setStem(s < 80 ? 53 : 106); else renderInspector(); };
  insp.querySelectorAll('details.rules').forEach((dt, i) => dt.ontoggle = () => { if (i === 0) ed.rulesOpen = dt.open; else ed.viewOpen = dt.open; });
  insp.querySelector('#ghosts').onchange = e => { ed.ghosts = e.target.checked; redrawCanvas(); };
  insp.querySelector('#ctx').onchange = e => { ed.context = e.target.value || 'no'; redrawCanvas(); };
  insp.querySelector('#marksck').onchange = e => { ed.marks = e.target.checked; redrawCanvas(); };
  const round = insp.querySelector('#round');
  if (round) {
    round.oninput = () => { for (const i of list) D.setNode(ch, ed.variant, i, { r: +round.value }, which(s), false); round.nextElementSibling.textContent = (+round.value).toFixed(2); updateLive(); };
    round.onchange = () => D.commit(`Round ${list.length > 1 ? list.length + ' points' : 'point ' + (list[0] + 1)} of ${ch}`);
  }
  insp.querySelectorAll('[data-act]').forEach(el => el.onclick = e => {
    e.preventDefault();
    const act = el.dataset.act;
    if (el.classList.contains('off')) return;
    if (act === 'resetnode') D.resetNode(ch, ed.variant, list[0]);
    else if (act === 'resetsel') { for (const i of list) { const v = D.variant(ch, ed.variant); delete v.light[i]; delete v.black[i]; } D.commit(`Reset ${list.length} points of ${ch}`); }
    else if (act === 'delpts') { deleteSelection(); }
    else if (act === 'rotate') transformSel('rotate', +insp.querySelector('#rot').value);
    else if (act === 'scale') transformSel('scale', +insp.querySelector('#scl').value / 100);
    else if (act === 'flipx') transformSel('flipx'); else if (act === 'flipy') transformSel('flipy');
    else if (act === 'applyall') D.applyToAll(ch, ed.variant, s < 80 ? 'light' : 'black');
    else if (act === 'savevar') { const name = prompt('Name for the variation', `${shown(ch)} · ${D.variants(ch).length + 1}`); if (name) { const from = ed.variant; ed.variant = D.variants(ch).length; ed.sel = new Set(); D.addVariant(ch, name, from); } }
    else if (act === 'reset') { if (confirm(`Undo every change to ${shown(ch)}${ed.variant ? ' (' + D.variants(ch)[ed.variant].name + ')' : ''}?`)) { ed.sel = new Set(); D.resetGlyph(ch, ed.variant); } }
    else if (act === 'forget') { if (confirm(`Forget the drawing you brought in for ${shown(ch)}?`)) D.forgetMaster(ch); }
    else if (act === 'savefile') D.download();
  });
  const pad = insp.querySelector('#pad'); if (pad) pad.onclick = e => { const b = e.target.closest('[data-n]'); if (b && ed.sel.size) { const [dx, dy] = b.dataset.n.split(',').map(Number), m = e.shiftKey ? 10 : 1; nudgeSel(dx * m, dy * m); } };
}
function nudgeSel(dx, dy) { const { S } = A(); const ch = S.glyph, s = S.stem; const deltas = {}; for (const i of ed.sel) deltas[i] = [dx, dy]; D.nudgeMany(ch, ed.variant, deltas, which(s), true, ed.sel.size > 1 ? `Nudge ${ed.sel.size} points of ${ch}` : `Nudge point ${[...ed.sel][0] + 1} of ${ch}`); }
function deleteSelection() {
  const { S } = A(); const ch = S.glyph, s = S.stem, nodes = flatNodes(outlineNow(ch, s)), list = selList();
  if (!list.length) return;
  const subs = E.parsePath(outlineNow(ch, s)); let base = 0; const perSub = {};
  subs.forEach((sub, si) => { for (const i of list) if (i >= base && i < base + sub.length) perSub[si] = (perSub[si] || 0) + 1; base += sub.length; });
  for (const si in perSub) if (subs[si].length - perSub[si] < 3) { alert('An outline needs at least three points; leave some in.'); return; }
  if (!confirm(`Remove ${list.length} point${list.length > 1 ? 's' : ''} from ${ch}? The curve is joined across the gap, in both weights.`)) return;
  ed.sel = new Set(); D.deleteNodes(ch, ed.variant, list);
}

// keys
function keydown(e) {
  const { S } = A(); if (S.room !== 'Glyphs' || S.newKey) return false;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName)) return false;
  const ch = S.glyph, s = S.stem, n = flatNodes(outlineNow(ch, s)).length, mod = e.metaKey || e.ctrlKey;
  const arrows = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  if (e.key === ' ' && !e.repeat) { ed.space = true; const cv = document.getElementById('canvas'); if (cv) cv.classList.add('grab'); return true; }
  if (arrows[e.key] && ed.sel.size) { const m = e.shiftKey ? 10 : 1; nudgeSel(arrows[e.key][0] * m, arrows[e.key][1] * m); return true; }
  if (e.key === 'Tab' && n) { const cur = ed.sel.size ? Math.max(...ed.sel) : -1; ed.sel = new Set([((cur + (e.shiftKey ? -1 : 1)) + n) % n]); redrawCanvas(); renderInspector(); return true; }
  if (e.key === 'Escape') { if (ed.sel.size || ed.measure) { ed.sel = new Set(); ed.measure = null; redrawCanvas(); renderInspector(); } return true; }
  if ((e.key === 'Backspace' || e.key === 'Delete') && ed.sel.size) { deleteSelection(); return true; }
  if (mod && e.key.toLowerCase() === 'a') { ed.sel = new Set(Array.from({ length: n }, (_, i) => i)); redrawCanvas(); renderInspector(); return true; }
  if (mod) return false;
  const k = e.key.toLowerCase();
  const tools = { v: 'select', a: 'addpoint', m: 'move', n: 'nudge', r: 'measure', c: 'compare' };
  if (tools[k]) { setTool(tools[k]); return true; }
  if (e.key === '+' || e.key === '=') { zoomBy(1.25); return true; }
  if (e.key === '-') { zoomBy(0.8); return true; }
  if (e.key === '0') { ed.zoom = 1; ed.pan = [0, 0]; redrawCanvas(); return true; }
  if (k === 'g') { ed.ghosts = !ed.ghosts; redrawCanvas(); renderInspector(); return true; }
  if (k === 'l') { ed.linked = !ed.linked; renderInspector(); return true; }
  return false;
}
function keyup(e) { if (e.key === ' ') { ed.space = false; const cv = document.getElementById('canvas'); if (cv) cv.classList.remove('grab'); } }
addEventListener('keyup', keyup);
addEventListener('blur', () => { ed.space = false; });

window.AquaEditor = { room, keydown, state: ed, select: i => { ed.sel = new Set(i); } };
})();
