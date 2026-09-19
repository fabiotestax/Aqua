// Aqua Studio — the Glyphs room with editing (Milestone 2). Drag a point and it moves with
// its handles, snapping to the guides and to the other points; nudge with the arrow keys;
// Light and Black move together unless you unlink them; every change is undoable, kept in
// the document (AquaDoc), and shows in the text everywhere else in the Studio.
(() => {
'use strict';
const E = window.AquaEngine, D = window.AquaDoc, AU = window.AquaAudit;
const A = () => window.AquaStudio;
const GUIDES = [['Tall letters', 751], ['Capitals', 715], ['Small letters', 521], ['Middle', 268], ['Baseline', 0], ['Tails', -230]];
// the visual middle sits a little above the true middle (0.515); for the capital it is on the cap height
const guidesFor = ch => GUIDES.map(([n, y]) => n === 'Middle' ? [n, Math.round(0.515 * (ch === 'B' ? 715 : 521))] : [n, y]);
const SNAP_Y = [751, 715, 528, 521, 7, 0, -7, -230];
const ed = { tool: 'select', sel: null, linked: true, compare: false, variant: 0, zoom: 1, pan: [0, 0], glyph: null, view: null };
const r1 = v => Math.round(v * 10) / 10, r0 = v => Math.round(v);
const ICON = {
  select: '<svg viewBox="0 0 20 20"><path d="M4 3l12 7-5 1-3 5z"/></svg>',
  drop: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="6"/><path d="M10 7v6M7 10h6"/></svg>',
  connect: '<svg viewBox="0 0 20 20"><circle cx="5" cy="14" r="2.5"/><circle cx="15" cy="6" r="2.5"/><path d="M7 12l6-4"/></svg>',
  move: '<svg viewBox="0 0 20 20"><path d="M10 3v14M3 10h14"/></svg>',
  nudge: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3"/></svg>',
  compare: '<svg viewBox="0 0 20 20"><rect x="3" y="4" width="6" height="12"/><rect x="11" y="4" width="6" height="12"/></svg>'
};

// which weight an edit lands in: both, or the one nearer the slider when unlinked
const which = s => ed.linked ? 'both' : (s < 80 ? 'light' : 'black');
const whichName = s => ed.linked ? 'both weights' : (s < 80 ? 'Light only' : 'Black only');
function flatNodes(d) { const out = []; E.parsePath(d).forEach((sub, si) => sub.forEach((seg, j) => out.push({ p: seg[0], sub: si, first: j === 0 }))); return out; }
function outlineNow(ch, s) { return E.outline(ch, s, ed.variant); }
function outlineBefore(ch, s) { const keep = E.getDoc(); E.setDoc(null); const d = E.outline(ch, s); E.setDoc(keep); return d; }
function where(p) { for (const [n, y] of GUIDES) if (Math.abs(p[1] - y) <= 12) return 'on ' + n; if (Math.abs(p[1] - 528) <= 12) return 'just over Small letters'; if (Math.abs(p[1] + 7) <= 12) return 'just under the Baseline'; return null; }

// ── the room ──
function room(root) {
  const { S, glyphSVG, weightPicker, bindWeightPicker, healthLines, KIND, KIND_LONG, shown, esc, setStem, setGlyph } = A();
  root.classList.add('three');
  const ch = S.glyph, s = S.stem;
  if (ed.glyph !== ch) { ed.glyph = ch; ed.sel = null; ed.variant = D.used(ch); ed.zoom = 1; ed.pan = [0, 0]; ed.compare = false; }
  const vars = D.variants(ch); if (ed.variant >= vars.length) ed.variant = 0;
  const g = E.glyph(ch, s), d = outlineNow(ch, s), nodes = flatNodes(d), b = E.bbox(d);
  if (ed.sel != null && ed.sel >= nodes.length) ed.sel = null;
  const tool = (key, name, off, title) => `<div class="t ${ed.tool === key || (key === 'compare' && ed.compare) ? 'on' : ''} ${off ? 'off' : ''}" data-tool="${key}" title="${title || ''}">${ICON[key]}${name}</div>`;
  root.innerHTML = `
    <aside class="side">
      <input class="search" placeholder="Search letters…" value="${esc(S.search)}" id="search">
      <h6>Letters</h6>
      <div class="matrix" id="matrix">${E.ORDER.split('').map(c => {
        const h = S.health[c].colour, hide = S.search && !c.toLowerCase().includes(S.search.toLowerCase()) && !(E.GNAME[c] || '').includes(S.search.toLowerCase());
        const mark = D.hasEdits(c) || D.hasMaster(c) ? '<i class="edited" title="changed in this session"></i>' : '';
        return `<div class="c h-${h} ${c === ch ? 'on' : ''} ${hide ? 'hide' : ''}" data-ch="${esc(c)}" title="${shown(c)} · ${window.AquaHealth.LABEL[h]}">${glyphSVG(c, s, { box: 'metrics', pad: 4 })}${mark}</div>`; }).join('')}
        ${Object.keys(D.newGlyphs()).map(k => { const g = D.newGlyphs()[k]; return `<div class="c gen" data-new="${esc(k)}" title="${esc(g.name)} · from drops${g.use === false ? ' · draft' : ''}">${g.strokes.length ? glyphSVG(g.ch, s, { box: 'metrics', pad: 4, d: E.dropsOutline(g, s), fill: 'nonzero' }) : `<b>${esc(g.ch || '?')}</b>`}</div>`; }).join('')}
        <div class="c gen plus" data-act="newletter" title="Start a new letter from drops">+</div></div>
      <div class="key"><i style="background:var(--ok)"></i>looks good &nbsp; <i style="background:var(--warn)"></i>needs a look &nbsp; <i style="background:var(--bad)"></i>not Aqua &nbsp; <i style="background:var(--blue)"></i>changed &nbsp; <i style="border:1.5px dashed var(--blue)"></i>from drops</div>
      <h6>Variations of ${shown(ch)}</h6>
      <div id="vars">${vars.map((v, i) => `<div class="var ${i === ed.variant ? 'on' : ''}" data-var="${i}"><span>${esc(v.name)}</span><span>${i === D.used(ch) ? 'in text' : ''}</span></div>`).join('')}
      <div class="var new" data-act="newvar"><span>+ New variation</span><span></span></div></div>
      ${vars.length > 1 && ed.variant !== D.used(ch) ? `<div class="btn" data-act="usevar" style="margin-top:4px">Use this one in text</div>` : ''}
      ${ed.variant > 0 ? `<div class="btn" data-act="delvar" style="margin-top:4px">Remove this variation</div>` : ''}
    </aside>
    <div class="canvas" id="canvas">${canvasSVG(ch, s, d, nodes, g)}
      <div class="crumb"><b>${shown(ch)}</b>${ed.variant ? ' · ' + esc(vars[ed.variant].name) : ''} &nbsp;·&nbsp; ${E.weightName(s)} &nbsp;·&nbsp; ${nodes.length} points &nbsp;·&nbsp; ${KIND[g.kind].toLowerCase()}${D.hasMaster(ch) ? ' · drawing brought in' : ''}</div>
      ${guidesFor(ch).map(([n, y]) => `<div class="pill ${n === 'Middle' ? 'faint' : ''}" data-y="${y}">${n}</div>`).join('')}
      <div class="hint" id="hint"></div>
      <div class="tools" id="tools">
        ${tool('select', 'Select', false, 'Drag a point; drag the background to look around; scroll to zoom')}
        ${tool('drop', 'Add drop', true, 'Arrives with New glyph, in a later build')}
        ${tool('connect', 'Connect', true, 'Arrives with New glyph, in a later build')}
        ${tool('move', 'Move', false, 'Drag anywhere to move the whole letter')}
        ${tool('nudge', 'Nudge', false, 'Arrow keys move the selected point one unit; hold Shift for ten')}
        ${tool('compare', 'Compare', false, 'Show the letter before your changes, in red')}
      </div>
      <div class="preview">
        <div class="pv"><div class="box">${glyphSVG(ch, s, { box: 'metrics', d })}</div>Final</div>
        <div class="pv blur"><div class="box">${glyphSVG(ch, s, { box: 'metrics', d })}</div>Squint</div>
        <div class="pv neg"><div class="box">${glyphSVG(ch, s, { box: 'metrics', d })}</div>Negative</div>
      </div>
    </div>
    <aside class="insp" id="insp"></aside>
    <div class="bottom">
      ${E.WEIGHTS.map(w => `<div class="wt ${w.stem === s ? 'on' : ''} ${w.master ? '' : 'off'}" data-stem="${w.stem}" title="${w.master ? 'Drawn' : 'Planned — a blend of Light and Black for now'}">${glyphSVG(ch, w.stem, { box: 'metrics', d: outlineNow(ch, w.stem) })}<small>${w.name}${w.master ? '' : ' · planned'}</small></div>`).join('')}
      <div class="note">Light and Black are drawn. Regular is a blend of the two until it gets its own drawing. Every change shows up in all three here, and in every room.</div>
    </div>`;
  renderInspector();
  // sidebar
  root.querySelector('#matrix').onclick = e => { const c = e.target.closest('[data-ch]'); if (c) { setGlyph(c.dataset.ch); return; }
    const n = e.target.closest('[data-new]'); if (n) { S.newKey = n.dataset.new; A().renderRoom(); return; }
    if (e.target.closest('[data-act="newletter"]')) window.AquaNew.startNew(); };
  root.querySelector('#search').oninput = e => { S.search = e.target.value; root.querySelectorAll('#matrix .c').forEach(c => {
    const k = c.dataset.ch, hit = !S.search || k.toLowerCase().includes(S.search.toLowerCase()) || (E.GNAME[k] || '').includes(S.search.toLowerCase());
    c.classList.toggle('hide', !hit); }); };
  root.querySelector('#vars').onclick = e => {
    const v = e.target.closest('[data-var]'); if (v) { ed.variant = +v.dataset.var; ed.sel = null; A().renderRoom(); return; }
    if (e.target.closest('[data-act="newvar"]')) { const name = prompt('Name for the new variation', `${shown(ch)} · ${vars.length + 1}`); if (name) { const from = ed.variant; ed.variant = vars.length; ed.sel = null; D.addVariant(ch, name, from); } }
  };
  root.querySelectorAll('[data-act="usevar"]').forEach(b => b.onclick = () => D.useVariant(ch, ed.variant));
  root.querySelectorAll('[data-act="delvar"]').forEach(b => b.onclick = () => { if (confirm(`Remove the variation "${vars[ed.variant].name}"?`)) { const i = ed.variant; ed.variant = 0; D.removeVariant(ch, i); } });
  root.querySelectorAll('.bottom .wt').forEach(w => w.onclick = () => setStem(+w.dataset.stem));
  root.querySelector('#tools').onclick = e => {
    const t = e.target.closest('[data-tool]'); if (!t || t.classList.contains('off')) return;
    if (t.dataset.tool === 'compare') { ed.compare = !ed.compare; } else ed.tool = t.dataset.tool;
    redrawCanvas(); root.querySelectorAll('#tools .t').forEach(x => x.classList.toggle('on', x.dataset.tool === ed.tool || (x.dataset.tool === 'compare' && ed.compare)));
    renderInspector();
  };
  bindCanvas();
  positionPills();
}

// ── canvas ──
function viewBox(ch, s, g, b) {
  const cv = document.getElementById('canvas');
  const cw = cv ? cv.clientWidth || 1000 : 1000, chh = cv ? cv.clientHeight || 800 : 800;
  const x0 = Math.min(-g.lsb, b.xmin) - 150, x1 = Math.max(g.w + g.rsb, b.xmax) + 150, y0 = -330, y1 = 830;
  // fit the letter's box in the canvas, then zoom and pan about it
  const k0 = Math.min(cw / (x1 - x0), chh / (y1 - y0)), k = k0 * ed.zoom;
  const W = cw / k, Hh = chh / k, cx = (x0 + x1) / 2 + ed.pan[0], cy = (y0 + y1) / 2 + ed.pan[1];
  return { x: cx - W / 2, y: cy - Hh / 2, w: W, h: Hh, k, cx, cy };
}
function canvasSVG(ch, s, d, nodes, g) {
  const b = E.bbox(d), v = viewBox(ch, s, g, b); ed.view = v;
  const R = 7.5 / v.k, SW = 2.2 / v.k, big = 20 / v.k;
  const far = 4000;
  const before = ed.compare ? outlineBefore(ch, s) : null;
  return `<svg viewBox="${r1(v.x)} ${r1(-(v.y + v.h))} ${r1(v.w)} ${r1(v.h)}" preserveAspectRatio="xMidYMid meet" id="cv">
    <defs><pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="${r1(1.1 / v.k)}" fill="var(--dots)"/></pattern></defs>
    <g transform="scale(1,-1)" id="flip">
      <rect x="${r1(v.x - far)}" y="${r1(v.y - far)}" width="${r1(v.w + 2 * far)}" height="${r1(v.h + 2 * far)}" fill="url(#dots)"/>
      ${guidesFor(ch).map(([n, y]) => `<line class="guide ${y === 0 ? 'base' : ''} ${n === 'Middle' ? 'mid' : ''}" x1="${r1(v.x - far)}" x2="${r1(v.x + v.w + far)}" y1="${y}" y2="${y}" style="stroke-width:${r1((y === 0 ? 1.5 : 1) / v.k)}"/>`).join('')}
      <line class="boxline" x1="${r1(-g.lsb)}" x2="${r1(-g.lsb)}" y1="-260" y2="790" style="stroke-width:${r1(1 / v.k)}"/>
      <line class="boxline" x1="${r1(g.w + g.rsb)}" x2="${r1(g.w + g.rsb)}" y1="-260" y2="790" style="stroke-width:${r1(1 / v.k)}"/>
      ${before ? `<path class="before" d="${before}" fill-rule="evenodd" style="stroke-width:${r1(1.4 / v.k)}"/>` : ''}
      <path class="skin" id="skin" d="${d}" fill-rule="evenodd" style="stroke-width:${r1(1.1 / v.k)}"/>
      <g id="snaps"></g>
      <circle id="halo" r="${r1(big)}" class="halo" style="display:${ed.sel == null ? 'none' : ''}" cx="${ed.sel == null ? 0 : r1(nodes[ed.sel].p[0])}" cy="${ed.sel == null ? 0 : r1(nodes[ed.sel].p[1])}"/>
      <g id="dark">${(() => { try { const f = AU.audit(ch, s).findings.find(x => x.law === 'crowding' && !x.ok); return f && f.nodes ? f.nodes.map(i => nodes[i] ? `<circle class="darkhalo" cx="${r1(nodes[i].p[0])}" cy="${r1(nodes[i].p[1])}" r="${r1(0.9 * s)}"/>` : '').join('') : ''; } catch { return ''; } })()}</g>
      <g id="nodes">${nodes.map((n, i) => `<circle class="node ${n.first ? 'start' : ''} ${i === ed.sel ? 'sel' : ''}" data-i="${i}" cx="${r1(n.p[0])}" cy="${r1(n.p[1])}" r="${r1(i === ed.sel ? R * 1.2 : R)}" style="stroke-width:${r1(SW)}"/>`).join('')}</g>
    </g>
  </svg>`;
}
function redrawCanvas() {
  const { S } = A(); const ch = S.glyph, s = S.stem;
  const g = E.glyph(ch, s), d = outlineNow(ch, s), nodes = flatNodes(d);
  const old = document.getElementById('cv'); if (!old) return;
  old.outerHTML = canvasSVG(ch, s, d, nodes, g);
  bindCanvas(); positionPills();
}
// in-flight update while dragging: the outline, the points, the previews — no rebuild
function updateLive() {
  const { S, glyphSVG } = A(); const ch = S.glyph, s = S.stem;
  const d = outlineNow(ch, s), nodes = flatNodes(d);
  const skin = document.getElementById('skin'); if (skin) skin.setAttribute('d', d);
  document.querySelectorAll('#nodes .node').forEach((c, i) => { if (nodes[i]) { c.setAttribute('cx', r1(nodes[i].p[0])); c.setAttribute('cy', r1(nodes[i].p[1])); } });
  const halo = document.getElementById('halo'); if (halo && ed.sel != null && nodes[ed.sel]) { halo.setAttribute('cx', r1(nodes[ed.sel].p[0])); halo.setAttribute('cy', r1(nodes[ed.sel].p[1])); }
  document.querySelectorAll('.preview .box').forEach(box => { box.innerHTML = glyphSVG(ch, s, { box: 'metrics', d }); });
  const pos = document.getElementById('selpos'); if (pos && ed.sel != null && nodes[ed.sel]) pos.textContent = `x ${r0(nodes[ed.sel].p[0])} · y ${r0(nodes[ed.sel].p[1])}`;
  const nd = document.getElementById('selnudge'); if (nd && ed.sel != null) nd.textContent = nudgedText(ch, ed.sel);
}
function positionPills() {
  const cv = document.getElementById('canvas'); if (!cv || !ed.view) return;
  const v = ed.view, chh = cv.clientHeight, k = v.k;
  cv.querySelectorAll('.pill').forEach(p => { const y = +p.dataset.y; const top = (v.y + v.h - y) * k; p.style.top = top + 'px'; p.style.display = top < 0 || top > chh ? 'none' : ''; });
}
addEventListener('resize', () => { if (document.getElementById('cv')) { redrawCanvas(); } });

// pointer → font units, through the flipped group's own matrix
function toUnits(e) {
  const svg = document.getElementById('cv'), flip = document.getElementById('flip');
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(flip.getScreenCTM().inverse()); return [p.x, p.y];
}
function snap(want, self, nodes, shift) {
  const lines = []; let [x, y] = want;
  if (!shift) {
    const tol = 8 / ed.view.k;
    let bestY = null, bestX = null;
    for (const gy of SNAP_Y) if (Math.abs(y - gy) <= tol && (bestY == null || Math.abs(y - gy) < Math.abs(y - bestY))) bestY = gy;
    nodes.forEach((n, i) => { if (i === self) return;
      if (Math.abs(y - n.p[1]) <= tol && (bestY == null || Math.abs(y - n.p[1]) < Math.abs(y - bestY))) bestY = n.p[1];
      if (Math.abs(x - n.p[0]) <= tol && (bestX == null || Math.abs(x - n.p[0]) < Math.abs(x - bestX))) bestX = n.p[0]; });
    if (bestY != null) { y = bestY; lines.push(['y', bestY]); }
    if (bestX != null) { x = bestX; lines.push(['x', bestX]); }
  }
  return { p: [Math.round(x), Math.round(y)], lines };
}
function showSnaps(lines) {
  const g = document.getElementById('snaps'); if (!g) return;
  const v = ed.view, far = 4000;
  g.innerHTML = lines.map(([ax, val]) => ax === 'y'
    ? `<line class="snapline" x1="${r1(v.x - far)}" x2="${r1(v.x + v.w + far)}" y1="${val}" y2="${val}" style="stroke-width:${r1(1 / v.k)}"/>`
    : `<line class="snapline" y1="${r1(v.y - far)}" y2="${r1(v.y + v.h + far)}" x1="${val}" x2="${val}" style="stroke-width:${r1(1 / v.k)}"/>`).join('');
}
function bindCanvas() {
  const svg = document.getElementById('cv'), cv = document.getElementById('canvas'); if (!svg) return;
  const { S } = A();
  let drag = null;
  svg.onpointerdown = e => {
    if (e.button !== 0) return;
    const ch = S.glyph, s = S.stem, node = e.target.closest('.node');
    const p = toUnits(e);
    if (ed.tool === 'move') {
      const nodes = flatNodes(outlineNow(ch, s));
      drag = { kind: 'all', start: p, applied: [0, 0], n: nodes.length };
    } else if (node) {
      const i = +node.dataset.i;
      ed.sel = i; renderInspector();
      document.querySelectorAll('#nodes .node').forEach((c, j) => c.classList.toggle('sel', j === i));
      const nodes = flatNodes(outlineNow(ch, s));
      const halo = document.getElementById('halo'); halo.style.display = ''; halo.setAttribute('cx', r1(nodes[i].p[0])); halo.setAttribute('cy', r1(nodes[i].p[1]));
      drag = { kind: 'node', i, start: p, base: nodes[i].p.slice(), applied: [0, 0], moved: false };
    } else {
      drag = { kind: 'pan', start: [e.clientX, e.clientY], pan: ed.pan.slice() };
    }
    svg.setPointerCapture(e.pointerId); e.preventDefault();
  };
  svg.onpointermove = e => {
    if (!drag) return;
    const ch = S.glyph, s = S.stem, w = which(s);
    if (drag.kind === 'pan') {
      ed.pan = [drag.pan[0] - (e.clientX - drag.start[0]) / ed.view.k, drag.pan[1] + (e.clientY - drag.start[1]) / ed.view.k];
      const v = viewBox(ch, s, E.glyph(ch, s), E.bbox(outlineNow(ch, s))); ed.view = v;
      svg.setAttribute('viewBox', `${r1(v.x)} ${r1(-(v.y + v.h))} ${r1(v.w)} ${r1(v.h)}`); positionPills(); return;
    }
    const p = toUnits(e);
    if (drag.kind === 'node') {
      const nodes = flatNodes(outlineNow(ch, s));
      const want = [drag.base[0] + (p[0] - drag.start[0]), drag.base[1] + (p[1] - drag.start[1])];
      const sn = snap(want, drag.i, nodes, e.shiftKey);
      const cur = nodes[drag.i].p, dx = sn.p[0] - cur[0], dy = sn.p[1] - cur[1];
      if (dx || dy) { D.nudge(ch, ed.variant, drag.i, dx, dy, w, false); drag.moved = true; updateLive(); }
      showSnaps(sn.lines);
    } else if (drag.kind === 'all') {
      const want = [Math.round(p[0] - drag.start[0]), Math.round(p[1] - drag.start[1])];
      const dx = want[0] - drag.applied[0], dy = want[1] - drag.applied[1];
      if (dx || dy) { for (let i = 0; i < drag.n; i++) D.nudge(ch, ed.variant, i, dx, dy, w, false); drag.applied = want; updateLive(); }
    }
  };
  svg.onpointerup = svg.onpointercancel = e => {
    if (!drag) return;
    const ch = S.glyph; const dr = drag; drag = null; showSnaps([]);
    try { svg.releasePointerCapture(e.pointerId); } catch {}
    if (dr.kind === 'node' && dr.moved) D.commit(`Move point ${dr.i + 1} of ${ch}`);
    else if (dr.kind === 'all' && (dr.applied[0] || dr.applied[1])) D.commit(`Move ${ch}`);
  };
  svg.ondblclick = e => { if (!e.target.closest('.node')) { ed.zoom = 1; ed.pan = [0, 0]; redrawCanvas(); } };
  cv.onwheel = e => {
    e.preventDefault();
    const { S } = A(); const ch = S.glyph, s = S.stem;
    const before = toUnits(e);
    ed.zoom = Math.max(0.4, Math.min(8, ed.zoom * Math.exp(-e.deltaY * 0.0015)));
    const v = viewBox(ch, s, E.glyph(ch, s), E.bbox(outlineNow(ch, s))); ed.view = v;
    svg.setAttribute('viewBox', `${r1(v.x)} ${r1(-(v.y + v.h))} ${r1(v.w)} ${r1(v.h)}`);
    const after = toUnits(e);
    ed.pan = [ed.pan[0] + (before[0] - after[0]), ed.pan[1] + (before[1] - after[1])];
    redrawCanvas();
  };
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
function renderInspector() {
  const { S, weightPicker, bindWeightPicker, healthLines, KIND, KIND_LONG, shown, esc } = A();
  const ch = S.glyph, s = S.stem, g = E.glyph(ch, s), d = outlineNow(ch, s), nodes = flatNodes(d), b = E.bbox(d);
  const insp = document.getElementById('insp'); if (!insp) return;
  const sel = ed.sel != null && nodes[ed.sel] ? nodes[ed.sel] : null;
  const st = sel ? D.nodeState(ch, ed.variant, ed.sel) : null;
  const rNow = st ? (which(s) === 'black' ? (st.black && st.black.r) : (st.light && st.light.r)) ?? 1 : 1;
  const differ = D.weightsDiffer(ch, ed.variant), edited = D.hasEdits(ch, ed.variant);
  insp.innerHTML = `
    ${weightPicker()}
    <label class="check"><input type="checkbox" id="linked" ${ed.linked ? 'checked' : ''}> Light and Black move together</label>
    ${ed.linked ? '' : `<p class="small sub" style="margin:4px 0 10px">Editing <b>${whichName(s)}</b>. Pick Light or Black above to be sure which drawing you are changing.</p>`}
    ${sel ? `<div class="card sel">
      <h6>Point ${ed.sel + 1} of ${nodes.length}${where(sel.p) ? ' · ' + where(sel.p) : ''}</h6>
      <div class="kv"><span>Position</span><span id="selpos">x ${r0(sel.p[0])} · y ${r0(sel.p[1])}</span></div>
      <div class="kv"><span>Moved</span><span><span id="selnudge">${nudgedText(ch, ed.sel)}</span> · <a href="#" data-act="resetnode">reset to grid</a></span></div>
      <div class="row" style="margin:8px 0 2px"><label>Roundness</label><input type="range" min="0.5" max="1.6" step="0.02" value="${rNow}" id="round"><div class="v">${(+rNow).toFixed(2)}</div></div>
      ${ed.tool === 'nudge' ? `<div class="pad" id="pad"><b data-n="0,1">↑</b><b data-n="-1,0">←</b><b data-n="0,-1">↓</b><b data-n="1,0">→</b><small>one unit · Shift for ten</small></div>` : '<p class="small sub" style="margin:6px 0 0">Arrow keys move it one unit, Shift for ten. Tab picks the next point.</p>'}
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
    ${(() => { const r = AU.audit(ch, s); if (!r) return ''; return `<h6 style="margin-top:14px">Optical · at thickness ${s}</h6><div class="health">${r.findings.map(f => `<b class="${f.ok ? '' : 'w'}">${f.ok ? '✓' : '!'}</b>${esc(f.text)}<br>`).join('')}</div>`; })()}`;
  bindWeightPicker(insp);
  insp.querySelector('#linked').onchange = e => { ed.linked = e.target.checked; if (!ed.linked && s !== 53 && s !== 106) A().setStem(s < 80 ? 53 : 106); else renderInspector(); };
  const round = insp.querySelector('#round');
  if (round) {
    round.oninput = () => { D.setNode(ch, ed.variant, ed.sel, { r: +round.value }, which(s), false); round.nextElementSibling.textContent = (+round.value).toFixed(2); updateLive(); };
    round.onchange = () => D.commit(`Round point ${ed.sel + 1} of ${ch}`);
  }
  insp.querySelectorAll('[data-act]').forEach(el => el.onclick = e => {
    e.preventDefault();
    const act = el.dataset.act;
    if (el.classList.contains('off')) return;
    if (act === 'resetnode') D.resetNode(ch, ed.variant, ed.sel);
    else if (act === 'applyall') D.applyToAll(ch, ed.variant, s < 80 ? 'light' : 'black');
    else if (act === 'savevar') { const name = prompt('Name for the variation', `${shown(ch)} · ${D.variants(ch).length + 1}`); if (name) { const from = ed.variant; ed.variant = D.variants(ch).length; ed.sel = null; D.addVariant(ch, name, from); } }
    else if (act === 'reset') { if (confirm(`Undo every change to ${shown(ch)}${ed.variant ? ' (' + D.variants(ch)[ed.variant].name + ')' : ''}?`)) { ed.sel = null; D.resetGlyph(ch, ed.variant); } }
    else if (act === 'forget') { if (confirm(`Forget the drawing you brought in for ${shown(ch)}?`)) D.forgetMaster(ch); }
  });
  const pad = insp.querySelector('#pad'); if (pad) pad.onclick = e => { const b = e.target.closest('[data-n]'); if (b && ed.sel != null) { const [dx, dy] = b.dataset.n.split(',').map(Number), m = e.shiftKey ? 10 : 1; D.nudge(ch, ed.variant, ed.sel, dx * m, dy * m, which(s)); } };
}

// keys: arrows nudge, Tab cycles, Esc clears — only when the Glyphs room is up and no field has focus
function keydown(e) {
  const { S } = A(); if (S.room !== 'Glyphs') return false;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName)) return false;
  const ch = S.glyph, s = S.stem, n = flatNodes(outlineNow(ch, s)).length;
  const arrows = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  if (arrows[e.key] && ed.sel != null) { const m = e.shiftKey ? 10 : 1; D.nudge(ch, ed.variant, ed.sel, arrows[e.key][0] * m, arrows[e.key][1] * m, which(s)); return true; }
  if (e.key === 'Tab' && n) { ed.sel = ed.sel == null ? 0 : (ed.sel + (e.shiftKey ? n - 1 : 1)) % n; redrawCanvas(); renderInspector(); return true; }
  if (e.key === 'Escape' && ed.sel != null) { ed.sel = null; redrawCanvas(); renderInspector(); return true; }
  return false;
}

window.AquaEditor = { room, keydown, state: ed };
})();
