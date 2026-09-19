// Aqua Studio — Milestone 1: the shell. Eight rooms, light and dark, a live canvas for any
// letter at any weight (view only), the Test room, and SVG export. No framework, no build:
// window.AquaEngine draws, window.AquaHealth judges, this file only shows.
(() => {
'use strict';
const E = window.AquaEngine, H = window.AquaHealth;
const $ = (sel, el = document) => el.querySelector(sel);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const r1 = v => Math.round(v * 10) / 10, r0 = v => Math.round(v);

const ROOMS = ['Glyphs', 'Weights', 'Spacing', 'Test', 'Import', 'Export', 'Guide', 'Health'];
const LABEL = { '!': '!', '.': '.', ',': ',', B: 'B' };
const shown = ch => LABEL[ch] || ch;
const KIND = { parametric: 'By rules', drawn: 'By you, in two weights', offset: 'From the original g' };
const KIND_LONG = {
  parametric: 'This letter is built from rules. Change the thickness and every part of it is redrawn to match.',
  drawn: 'You drew this letter in Light and Black. Every other weight is a blend of those two drawings.',
  offset: 'This is the original g. Lighter weights are made by thinning its outline, with the neck kept open on purpose.'
};

// ── state ─────────────────────────────────────────────────────────────────────
const q = new URLSearchParams(location.search);
const store = (k, d) => { try { const v = localStorage.getItem('aqua.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem('aqua.' + k, JSON.stringify(v)); } catch {} };
const S = {
  room: ROOMS.includes(q.get('room')) ? q.get('room') : store('room', 'Glyphs'),
  glyph: q.get('glyph') && E.ORDER.includes(q.get('glyph')) ? q.get('glyph') : store('glyph', 'g'),
  stem: q.get('stem') ? Math.max(53, Math.min(106, +q.get('stem'))) : store('stem', 78),
  theme: q.get('theme') || store('theme', 'auto'),
  text: q.get('text') || store('text', 'aqua bonefish'),
  view: q.get('view') || 'final',            // Test room: final | negative | squint | flip | mirror | heat
  guide: q.get('guide') || 'CLAUDE.md',
  search: '',
  hand: null, health: null, diffs: null, docs: {}, edited: null
};
const applyTheme = () => {
  if (S.theme === 'dark' || S.theme === 'light') document.documentElement.setAttribute('data-theme', S.theme);
  else document.documentElement.removeAttribute('data-theme');
};
const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark' ||
  (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);

// ── drawing helpers ───────────────────────────────────────────────────────────
// A letter on its own, sized by height. box 'ink' hugs the ink; 'metrics' keeps every letter on
// one baseline (tails to −250, tall letters to 780) so a row of them lines up.
function glyphSVG(ch, s, o = {}) {
  const g = E.glyph(ch, s); if (!g) return '';
  const b = E.bbox(g.d), pad = o.pad ?? 12;
  const x0 = b.xmin - pad, x1 = b.xmax + pad;
  const y0 = o.box === 'metrics' ? -250 : b.ymin - pad, y1 = o.box === 'metrics' ? 780 : b.ymax + pad;
  const style = o.h ? ` style="height:${o.h}px"` : '';
  return `<svg viewBox="${r1(x0)} ${r1(-y1)} ${r1(x1 - x0)} ${r1(y1 - y0)}"${style} ${o.attrs || ''}><g transform="scale(1,-1)"><path d="${g.d}" fill-rule="evenodd"/></g></svg>`;
}
// A line of text, laid out by the engine with its own spacing and pairs.
function lineSVG(text, s, o = {}) {
  const L = E.layout(text || ' ', s, o.noKern);
  const w = Math.max(L.w, 1), h = 1015;
  const style = o.h ? `height:${o.h}px;width:auto;max-width:100%` : 'width:100%;height:auto';
  return `<svg viewBox="0 -771 ${w} ${h}" preserveAspectRatio="xMinYMid meet" style="${style};display:block"><g transform="scale(1,-1)"${o.filter ? ` filter="url(#${o.filter})"` : ''}>` +
    L.glyphs.map(g => `<g transform="${g.tf}"><path d="${g.d}" fill-rule="evenodd"/></g>`).join('') + `</g></svg>`;
}
function bearingsAt(s) { return E.bearing(s); }

// ── health ────────────────────────────────────────────────────────────────────
function computeHealth() { S.health = H.assessAll(S.hand); }
function overall() {
  const rs = Object.values(S.health);
  const red = rs.filter(r => r.colour === 'red').length, amber = rs.filter(r => r.colour === 'amber').length;
  if (!red && !amber) return { cls: '', text: 'Everything looks good' };
  if (!red) return { cls: 'warn', text: `${amber} letter${amber > 1 ? 's' : ''} to check` };
  return { cls: 'bad', text: `${red} not Aqua yet · ${amber} to check` };
}

// ── top bar ───────────────────────────────────────────────────────────────────
function renderTop() {
  const o = overall();
  const drawn = E.ORDER.split('').filter(ch => E.kindOf(ch) === 'drawn').length;
  $('#top').innerHTML = `
    <div class="brand">Aqua<span>Studio</span></div>
    <div class="seg" id="rooms">${ROOMS.map(r => `<b class="${r === S.room ? 'on' : ''}" data-room="${r}">${r}</b>`).join('')}</div>
    <div class="meta">
      <span>${E.ORDER.length} letters · ${drawn} drawn by you</span>
      <span>offline</span>
      <span><i class="dot ${o.cls}"></i>${o.text}</span>
      <button class="iconbtn" id="theme" title="Light / dark">${isDark()
        ? '<svg viewBox="0 0 20 20"><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5 5l1.4 1.4M13.6 13.6L15 15M5 15l1.4-1.4M13.6 6.4L15 5"/><path d="M10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>'
        : '<svg viewBox="0 0 20 20"><path d="M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8z"/></svg>'}</button>
    </div>`;
  $('#rooms').onclick = e => { const b = e.target.closest('[data-room]'); if (b) go(b.dataset.room); };
  $('#theme').onclick = () => { S.theme = isDark() ? 'light' : 'dark'; save('theme', S.theme); applyTheme(); renderTop(); renderRoom(); };
}
function go(room) { S.room = room; save('room', room); renderTop(); renderRoom(); }
function setStem(s) { S.stem = Math.max(53, Math.min(106, Math.round(s))); save('stem', S.stem); renderRoom(); }
function setGlyph(ch) { S.glyph = ch; save('glyph', ch); if (S.room !== 'Glyphs') S.room = 'Glyphs'; renderTop(); renderRoom(); }

// shared: the weight picker (segment + slider)
function weightPicker() {
  return `<h6>Weight</h6>
    <div class="seg w" data-act="weights">${E.WEIGHTS.map(w => `<b class="${w.stem === S.stem ? 'on' : ''}" data-stem="${w.stem}">${w.name}</b>`).join('')}</div>
    <div class="row"><label>Thickness</label><input type="range" min="53" max="106" step="1" value="${S.stem}" data-act="stem"><div class="v">${S.stem}</div></div>`;
}
function bindWeightPicker(root) {
  root.querySelectorAll('[data-act="weights"] b').forEach(b => b.onclick = () => setStem(+b.dataset.stem));
  root.querySelectorAll('[data-act="stem"]').forEach(i => i.oninput = () => setStem(+i.value));
}
function healthLines(rep) {
  return `<div class="health">${H.lines(rep).map(l =>
    `<b class="${l.ok === true ? '' : l.ok === false ? 'x' : 'q'}">${l.ok === true ? '✓' : l.ok === false ? '!' : '?'}</b>${esc(l.text)}<br>`).join('')}</div>`;
}

// ── rooms ─────────────────────────────────────────────────────────────────────
function renderRoom() {
  const root = $('#room');
  root.className = 'room';
  ({ Glyphs, Weights, Spacing, Test, Import, Export, Guide, Health })[S.room](root);
  window.studioReady = true;
}

// Glyphs — the blueprint's screen 1, view only.
function Glyphs(root) {
  root.classList.add('three');
  const ch = S.glyph, s = S.stem, g = E.glyph(ch, s), rep = S.health[ch], b = E.bbox(g.d);
  const nodes = E.nodes(g.d), nPts = nodes.reduce((n, sub) => n + sub.length, 0);
  // canvas geometry: the letter's box plus air, tails to −330 and tall letters to 830
  const vx0 = Math.min(-g.lsb, b.xmin) - 150, vx1 = Math.max(g.w + g.rsb, b.xmax) + 150, vy0 = -330, vy1 = 830;
  const GUIDES = [['Tall letters', 751], ['Capitals', 715], ['Small letters', 521], ['Baseline', 0], ['Tails', -230]];
  const tool = (name, icon, on, off) => `<div class="t ${on ? 'on' : ''} ${off ? 'off' : ''}" title="${off ? 'Editing arrives in the next build' : ''}">${icon}${name}</div>`;
  root.innerHTML = `
    <aside class="side">
      <input class="search" placeholder="Search letters…" value="${esc(S.search)}" id="search">
      <h6>Letters</h6>
      <div class="matrix" id="matrix">${E.ORDER.split('').map(c => {
        const h = S.health[c].colour, hide = S.search && !c.toLowerCase().includes(S.search.toLowerCase()) && !(E.GNAME[c] || '').includes(S.search.toLowerCase());
        return `<div class="c h-${h} ${c === ch ? 'on' : ''} ${hide ? 'hide' : ''}" data-ch="${esc(c)}" title="${shown(c)} · ${H.LABEL[h]}">${glyphSVG(c, s, { box: 'metrics', pad: 4 })}</div>`; }).join('')}</div>
      <div class="key"><i style="background:var(--ok)"></i>looks good &nbsp; <i style="background:var(--warn)"></i>needs a look &nbsp; <i style="background:var(--bad)"></i>not Aqua</div>
      <h6>Variations of ${shown(ch)}</h6>
      <div class="var on"><span>${shown(ch)}</span><span>main</span></div>
      <div class="var new" title="Arrives with editing, in the next build"><span>+ New variation</span><span></span></div>
    </aside>
    <div class="canvas" id="canvas">
      <svg viewBox="${r1(vx0)} ${-vy1} ${r1(vx1 - vx0)} ${vy1 - vy0}" preserveAspectRatio="xMidYMid meet">
        <defs><pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="1.1" fill="var(--dots)"/></pattern></defs>
        <g transform="scale(1,-1)">
          <rect x="${r1(vx0) - 400}" y="${vy0 - 400}" width="${r1(vx1 - vx0) + 800}" height="${vy1 - vy0 + 800}" fill="url(#dots)"/>
          ${GUIDES.map(([n, y]) => `<line class="guide ${y === 0 ? 'base' : ''}" x1="${r1(vx0) - 400}" x2="${r1(vx1) + 400}" y1="${y}" y2="${y}"/>`).join('')}
          <line class="boxline" x1="${r1(-g.lsb)}" x2="${r1(-g.lsb)}" y1="-260" y2="790"/>
          <line class="boxline" x1="${r1(g.w + g.rsb)}" x2="${r1(g.w + g.rsb)}" y1="-260" y2="790"/>
          <path class="skin" d="${g.d}" fill-rule="evenodd"/>
          <g>${nodes.map(sub => sub.map((p, i) => `<circle class="node ${i === 0 ? 'start' : ''}" cx="${r1(p[0])}" cy="${r1(p[1])}" r="7.5"/>`).join('')).join('')}</g>
        </g>
      </svg>
      <div class="crumb"><b>${shown(ch)}</b> &nbsp;·&nbsp; ${E.weightName(s)} &nbsp;·&nbsp; ${nPts} points &nbsp;·&nbsp; ${KIND[g.kind].toLowerCase()}</div>
      ${GUIDES.map(([n, y]) => `<div class="pill" data-y="${y}">${n}</div>`).join('')}
      <div class="tools">
        ${tool('Select', '<svg viewBox="0 0 20 20"><path d="M4 3l12 7-5 1-3 5z"/></svg>', true, false)}
        ${tool('Add drop', '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="6"/><path d="M10 7v6M7 10h6"/></svg>', false, true)}
        ${tool('Connect', '<svg viewBox="0 0 20 20"><circle cx="5" cy="14" r="2.5"/><circle cx="15" cy="6" r="2.5"/><path d="M7 12l6-4"/></svg>', false, true)}
        ${tool('Move', '<svg viewBox="0 0 20 20"><path d="M10 3v14M3 10h14"/></svg>', false, true)}
        ${tool('Nudge', '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3"/></svg>', false, true)}
        ${tool('Compare', '<svg viewBox="0 0 20 20"><rect x="3" y="4" width="6" height="12"/><rect x="11" y="4" width="6" height="12"/></svg>', false, true)}
      </div>
      <div class="preview">
        <div class="pv"><div class="box">${glyphSVG(ch, s, { box: 'metrics' })}</div>Final</div>
        <div class="pv blur"><div class="box">${glyphSVG(ch, s, { box: 'metrics' })}</div>Squint</div>
        <div class="pv neg"><div class="box">${glyphSVG(ch, s, { box: 'metrics' })}</div>Negative</div>
      </div>
    </div>
    <aside class="insp">
      ${weightPicker()}
      <h6>This letter</h6>
      <div class="card" style="margin-top:0">
        <div class="kv"><span>Made</span><span class="ink">${KIND[g.kind]}</span></div>
        <div class="kv"><span>Width</span><span>${r0(g.w)} units</span></div>
        <div class="kv"><span>Room on the left</span><span>${r0(g.lsb)} units</span></div>
        <div class="kv"><span>Room on the right</span><span>${r0(g.rsb)} units</span></div>
        <div class="kv"><span>Points</span><span>${nPts} in ${nodes.length} outline${nodes.length > 1 ? 's' : ''}</span></div>
        <div class="kv"><span>Ink reaches</span><span>${r0(b.ymin)} to ${r0(b.ymax)}</span></div>
      </div>
      <p class="small sub" style="margin:0 0 6px">${KIND_LONG[g.kind]}</p>
      <div class="btn pri off" title="Editing arrives in the next build">Apply to all weights</div>
      <div class="btn off" title="Editing arrives in the next build">Save as a variation</div>
      <div class="btn off" title="Editing arrives in the next build">Start this letter over</div>
      ${healthLines(rep)}
    </aside>
    <div class="bottom">
      ${E.WEIGHTS.map(w => `<div class="wt ${w.stem === s ? 'on' : ''} ${w.master ? '' : 'off'}" data-stem="${w.stem}" title="${w.master ? 'Drawn' : 'Planned — a blend of Light and Black for now'}">${glyphSVG(ch, w.stem, { box: 'metrics' })}<small>${w.name}${w.master ? '' : ' · planned'}</small></div>`).join('')}
      <div class="note">Light and Black are drawn. Regular is a blend of the two until it gets its own drawing. Every change will show up in all three here.</div>
    </div>`;
  bindWeightPicker(root);
  $('#matrix').onclick = e => { const c = e.target.closest('[data-ch]'); if (c) setGlyph(c.dataset.ch); };
  $('#search').oninput = e => { S.search = e.target.value; root.querySelectorAll('#matrix .c').forEach(c => {
    const k = c.dataset.ch, hit = !S.search || k.toLowerCase().includes(S.search.toLowerCase()) || (E.GNAME[k] || '').includes(S.search.toLowerCase());
    c.classList.toggle('hide', !hit); }); };
  root.querySelectorAll('.bottom .wt').forEach(w => w.onclick = () => setStem(+w.dataset.stem));
  positionPills();
}
// The guide names are HTML pills laid over the SVG; place them on their lines in pixels.
function positionPills() {
  const cv = $('#canvas'); if (!cv) return;
  const svg = $('svg', cv), vb = svg.viewBox.baseVal, W = cv.clientWidth, Hh = cv.clientHeight;
  const k = Math.min(W / vb.width, Hh / vb.height), oy = (Hh - vb.height * k) / 2;
  cv.querySelectorAll('.pill').forEach(p => { p.style.top = (oy + (-(+p.dataset.y) - vb.y) * k) + 'px'; });
}
addEventListener('resize', positionPills);

// Weights — the family, the axis, and whether every letter survives it.
function Weights(root) {
  root.classList.add('one');
  const s = S.stem, ok = E.ORDER.split('').filter(c => S.health[c].compatible), bad = E.ORDER.split('').filter(c => !S.health[c].compatible);
  root.innerHTML = `<div class="main">
    <h1 class="title">Weights</h1>
    <p class="lead">One axis, from Light to Black. Light and Black are the two drawn weights; everything between them is made live. Scrub the thickness and watch the whole set follow.</p>
    <div class="banner info"><span>?</span><span><b>Open with Fabio:</b> is the thinner drawing (thickness 53) the <b>Light</b>? If yes, Regular becomes a new drawing near thickness 78, so the family is Light · Regular · Black. That is the recommended reading and what the Studio shows for now.</span></div>
    <div class="panel">
      <div class="row" style="margin:0 0 18px"><label>Thickness</label><input type="range" min="53" max="106" step="1" value="${s}" data-act="stem"><div class="v">${s}</div><span class="sub small" style="width:90px">${E.weightName(s)}</span></div>
      <div class="line">${lineSVG('hamburgefontsiv', s)}</div>
    </div>
    <div class="grid3">${E.WEIGHTS.map(w => `<div class="panel" style="cursor:pointer" data-stem="${w.stem}">
        <div class="kv" style="margin:0 0 10px"><span style="font-weight:600;color:var(--ink)">${w.name}</span><span>thickness ${w.stem} · ${w.master ? 'drawn' : 'planned'}</span></div>
        <div class="line">${lineSVG('aqua', w.stem)}</div>
        <p class="small sub" style="margin:10px 0 0">${w.master ? 'A drawn weight. The axis runs between this and the other one.' : 'Not drawn yet — shown as a blend of Light and Black. Gets its own drawing in a later build.'}</p>
      </div>`).join('')}</div>
    <div class="panel">
      <h6>Works in every weight</h6>
      <p class="small sub" style="margin:0 0 12px">A letter passes when Light and Black are drawn with the same points in the same order, so every weight in between is a clean blend. ${bad.length ? `${bad.length} letter${bad.length > 1 ? 's do' : ' does'} not.` : 'Every letter passes.'}</p>
      <div class="chips">${E.ORDER.split('').map(c => `<span class="chip ${S.health[c].compatible ? 'green' : 'red'}">${shown(c)}</span>`).join('')}</div>
      ${bad.map(c => `<p class="small" style="margin:12px 0 0"><b>${shown(c)}</b> — ${esc(S.health[c].flags.find(f => f.code === 'masters')?.text || '')}</p>`).join('')}
    </div>
    <div class="panel"><h6>Ladder</h6><div class="ladder">${[53, 66, 78, 92, 106].map(st => `<div class="rung"><div class="lab">${st}<br>${E.weightName(st)}</div><div class="line" style="flex:1">${lineSVG('bonefish', st)}</div></div>`).join('')}</div></div>
  </div>`;
  bindWeightPicker(root);
  root.querySelectorAll('[data-stem]').forEach(p => p.onclick = () => setStem(+p.dataset.stem));
}

// Spacing — on hold by decision, but everything it will need is visible.
function Spacing(root) {
  root.classList.add('one');
  const s = S.stem, sb = bearingsAt(s);
  const strip = text => {
    const L = E.layout(text, s), cells = [];
    // walk the text alongside the laid-out glyphs so a word space is known as one
    let ti = 0;
    for (let i = 0; i < L.glyphs.length; i++) {
      const gl = L.glyphs[i], g = E.glyph(gl.key, s), b = E.bbox(g.d), tx = +gl.tf.match(/-?[\d.]+/)[0];
      let space = false; while (text[ti] !== gl.key) { if (text[ti] === ' ') space = true; ti++; } ti++;
      const x0 = tx - g.lsb + g.minX, x1 = tx + g.minX + g.w + g.rsb;   // the letter's box in line units
      const inkL = tx + b.xmin, inkR = tx + b.xmax;                         // where the ink actually is
      const gap = i ? r0(inkL - cells[i - 1].inkR) : null;                  // ink to ink, the rhythm
      cells.push({ ch: gl.key, d: gl.d, tx, x0, x1, inkL, inkR, gap, space });
    }
    return `<div class="strip">${cells.map((c, i) => `<div class="cell">
        <svg viewBox="${r1(c.x0)} -771 ${r1(c.x1 - c.x0)} 1015"><g transform="scale(1,-1)"><rect class="box" x="${r1(c.x0)}" y="-240" width="${r1(c.x1 - c.x0)}" height="1000"/><g transform="translate(${r1(c.tx)},0)"><path d="${c.d}" fill-rule="evenodd"/></g></g></svg>
        <div class="gap ${c.gap != null && !c.space && (c.gap < 70 || c.gap > 85) ? 'out' : ''}">${c.gap == null ? '&nbsp;' : c.space ? 'word space' : c.gap + ' before'}</div></div>`).join('')}</div>`;
  };
  const rows = E.ORDER.split('').map(c => {
    const g = E.glyph(c, s), b = E.bbox(g.d);
    const inkL = r0(b.xmin - g.minX + g.lsb), inkR = r0(g.w + g.rsb + g.minX - b.xmax);
    return `<tr><td><span class="g">${glyphSVG(c, s, { box: 'metrics' })}</span></td><td>${shown(c)}</td><td>${(E.SHAPE[c] || 'ff').split('').map(k => ({ f: 'flat', r: 'round', o: 'open' })[k]).join(' · ')}</td>
      <td class="num">${r0(g.lsb)}</td><td class="num">${r0(g.rsb)}</td><td class="num">${r0(g.w)}</td><td class="num ${inkL < 0 ? 'x' : ''}" style="${inkL < 0 ? 'color:var(--bad)' : ''}">${inkL}</td><td class="num" style="${inkR < 0 ? 'color:var(--bad)' : ''}">${inkR}</td></tr>`;
  }).join('');
  root.innerHTML = `<div class="main">
    <h1 class="title">Spacing</h1>
    <p class="lead">How much room each letter keeps on its left and right, and which pairs pull closer. Measured from the outlines, so it only settles once the drawings do.</p>
    <div class="banner warn"><span>⏸</span><span><b>On hold until the reshape lands.</b> The order is: reshape the letters → redraw B → bring the drawings back in → take each letter's room from its ink → then fix the pairs. Nothing here is edited before that.</span></div>
    <div class="panel"><div class="row" style="margin:0 0 14px"><label>Thickness</label><input type="range" min="53" max="106" step="1" value="${s}" data-act="stem"><div class="v">${s}</div></div>
      <h6>Rhythm</h6><p class="small sub" style="margin:0 0 10px">The gap between one letter's ink and the next should sit in the 70–85 band. Amber means it is out of band at this weight; pairs that pull closer on purpose show up here too.</p>
      ${['nnonon', 'hhohoh', 'aqua bonefish'].map(strip).join('<div style="height:10px"></div>')}</div>
    <div class="grid2">
      <div class="panel tight"><h6>How the room is set</h6><p class="small" style="margin:0">Room is set by what the edge <i>does</i>, not by which letter it is. A flat edge gets the full amount, a round one 0.82 of it, an open or slanted one 0.68. The base amount at this weight is <b>${r1(sb)} units</b>; it opens up as the letters get lighter. A word space is four of them.</p></div>
      <div class="panel tight"><h6>Pairs</h6><p class="small" style="margin:0">${Object.keys(E.KERN).length} pairs pull closer than their room alone would put them (m·a, r·o, v·a …). They are fitted to today's outlines and will be redone after the reshape. They shrink toward Light, where letters need the room back.</p></div>
    </div>
    <div class="panel"><h6>Every letter at thickness ${s}</h6>
      <table><thead><tr><th></th><th>Letter</th><th>Edges</th><th class="num">Room left</th><th class="num">Room right</th><th class="num">Width</th><th class="num">Ink to box, left</th><th class="num">Ink to box, right</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="small sub" style="margin:10px 0 0">"Ink to box" is what the drawing actually leaves; red means the ink sticks out of its box. Those are the ones "room from ink" will fix.</p></div>
  </div>`;
  bindWeightPicker(root);
}

// Test — type anything, at any size, in every way of looking at it.
function Test(root) {
  root.classList.add('two');
  const s = S.stem, views = [['final', 'Normal'], ['negative', 'Negative'], ['squint', 'Squint'], ['flip', 'Upside down'], ['mirror', 'Mirrored'], ['heat', 'Darkness']];
  const cls = { final: '', negative: 'neg', squint: 'blur', flip: 'flip', mirror: 'mirror', heat: 'heat' }[S.view] || '';
  const fo = S.view === 'heat' ? { filter: 'heat' } : {};
  const avail = E.ORDER.split('').map(shown).join(' ');
  root.innerHTML = `
    <aside class="side">
      <h6>Type anything</h6>
      <input class="search" id="text" value="${esc(S.text)}" spellcheck="false" style="margin-bottom:6px">
      <p class="small sub" style="margin:0 0 16px">Letters not drawn yet are skipped. Available: ${avail}</p>
      ${weightPicker()}
      <h6>Look at it</h6>
      <div class="seg w" id="views" style="flex-wrap:wrap">${views.map(([k, n]) => `<b class="${S.view === k ? 'on' : ''}" data-view="${k}" style="flex-basis:33%">${n}</b>`).join('')}</div>
      <p class="small sub">Squint and Darkness show where the weight sits. Upside down and Mirrored hide the words so only the shapes are left.</p>
      <div class="card"><h6>Quick words</h6>${['hamburgefontsiv', 'aqua bonefish', 'nnonon', 'the source logotype', 'vixen wax', 'quick jazz'].map(w => `<div class="var" data-word="${w}" style="cursor:pointer"><span>${w}</span></div>`).join('')}</div>
    </aside>
    <div class="main">
      <svg width="0" height="0" style="position:absolute"><filter id="heat" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" x="-300" y="-400" width="30000" height="1300">
        <feGaussianBlur stdDeviation="34"/>
        <feColorMatrix type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1"/>
        <feComponentTransfer><feFuncR type="table" tableValues="0.04 0.08 0.10 0.95 1 1"/><feFuncG type="table" tableValues="0.04 0.10 0.55 0.85 0.45 1"/><feFuncB type="table" tableValues="0.05 0.55 0.85 0.15 0.05 0.85"/></feComponentTransfer>
      </filter></svg>
      <div class="stage ${cls}" style="margin-bottom:18px"><div class="line">${lineSVG(S.text, s, fo)}</div></div>
      <div class="stage ${cls}"><div class="ladder">${[16, 24, 40, 72, 120].map(px => `<div class="rung"><div class="lab">${px} px</div>${lineSVG(S.text, s, { h: px * 1.015, ...fo })}</div>`).join('')}</div></div>
      <p class="small sub" style="margin-top:14px">Sizes are true to the screen: the ladder shows the same words at 16, 24, 40, 72 and 120 pixels, at ${E.weightName(s)} (thickness ${s}).</p>
    </div>`;
  bindWeightPicker(root);
  const t = $('#text'); t.oninput = () => { S.text = t.value; save('text', S.text); root.querySelectorAll('.stage').forEach((st, i) => {
    st.innerHTML = i === 0 ? `<div class="line">${lineSVG(S.text, S.stem, fo)}</div>` : `<div class="ladder">${[16, 24, 40, 72, 120].map(px => `<div class="rung"><div class="lab">${px} px</div>${lineSVG(S.text, S.stem, { h: px * 1.015, ...fo })}</div>`).join('')}</div>`; }); };
  $('#views').onclick = e => { const b = e.target.closest('[data-view]'); if (b) { S.view = b.dataset.view; renderRoom(); } };
  root.querySelectorAll('[data-word]').forEach(w => w.onclick = () => { S.text = w.dataset.word; save('text', S.text); renderRoom(); });
}

// Import — the round trip back in. The drop zone arrives with editing; the diff is live now.
function Import(root) {
  root.classList.add('one');
  const diffs = S.diffs;
  root.innerHTML = `<div class="main">
    <h1 class="title">Import</h1>
    <p class="lead">Bring a drawing back in. Today that is the SVG round trip: a sheet goes out from Export, you move points in Illustrator, and the sheet comes back here. Dropping files onto this page arrives in the next build; the comparison below is already live.</p>
    <div class="drop"><b>Drop an SVG here</b>Arrives in the next build. For now, save the returned files into <code>aqua/masters/</code> and they show up below.</div>
    <div class="grid2" style="margin-top:18px">
      <div class="panel tight"><h6>Four rules for the round trip</h6><ol class="small" style="margin:0;padding-left:18px;line-height:1.7"><li>Keep each path's name — that is how a drawing finds its letter.</li><li>Keep each letter inside its own cell. Moving it within the cell changes its room, which is fine.</li><li>Flatten before saving so the path carries no transform.</li><li>Save as plain SVG and ignore the guides layer. <b>Move points, never add or delete them.</b></li></ol></div>
      <div class="panel tight"><h6>What came back last time</h6><p class="small" style="margin:0">${diffs ? `${diffs.length} letters differ from what the rules draw, or were carried over from the other weight. Fifteen of them are already in as drawn masters. B still needs both weights drawn on the same points.` : 'Reading the returned files…'}</p></div>
    </div>
    <div class="panel"><h6>Your drawing (filled) against what the rules draw (outline)</h6>
      ${diffs ? diffs.map(d => `<div class="diffrow"><div class="name">${esc(d.name === 'B.cap' ? 'B' : d.name)}<small>${esc(d.devLabel === 'identical' ? 'identical' : d.devLabel + ' moved')}</small></div>
        ${['black', 'regular'].map(k => `<div><svg viewBox="${d.vb}" preserveAspectRatio="xMidYMid meet"><g transform="${d.shift}"><path d="${d[k + 'Theirs']}" fill-rule="evenodd"/></g><path class="mine" d="${d[k + 'Mine']}" fill-rule="evenodd"/></svg><div class="cap">${k === 'black' ? 'Black' : 'Light'} · ${esc(d[k + 'DevLabel'])}</div></div>`).join('')}</div>`).join('') : '<p class="sub small">Reading…</p>'}
    </div>
  </div>`;
}

// Export — the SVG round trip out, plus where the font build will go.
function Export(root) {
  root.classList.add('one');
  const s = S.stem;
  const sheet = E.exportSVG(s);
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sheet);
  root.innerHTML = `<div class="main">
    <h1 class="title">Export</h1>
    <p class="lead">Every letter goes out as one plain path on a ruled sheet, ready for Illustrator. Edit both drawn weights if you want a change to hold across the whole range.</p>
    <div class="panel">
      <h6>SVG sheet</h6>
      <div class="btn pri inline" data-dl="106">Black · thickness 106</div>
      <div class="btn pri inline" data-dl="53">Light · thickness 53</div>
      <div class="btn inline" data-dl="${s}">Current · ${E.weightName(s)} (${s})</div>
      <div class="row" style="margin:10px 0 0;max-width:420px"><label>Thickness</label><input type="range" min="53" max="106" step="1" value="${s}" data-act="stem"><div class="v">${s}</div></div>
      <p class="small sub" style="margin:8px 0 0">${E.ORDER.length} letters on a 6-column grid · pink rules are baseline, small-letter height and tails · the guides layer is ignored on the way back.</p>
    </div>
    <div class="panel"><h6>Preview of the sheet at thickness ${s}</h6><div class="sheet"><img alt="export sheet" src="${src}"></div></div>
    <div class="grid2">
      <div class="panel tight"><h6>Font file</h6><p class="small" style="margin:0">A real variable font (TTF and WOFF2) comes in a later build, once Light · Regular · Black are all drawn and every letter passes the health check. The check is the gate: nothing ships red.</p></div>
      <div class="panel tight"><h6>Versions</h6><p class="small" style="margin:0">Each export will be numbered and kept, so a drawing can always be traced back to the sheet it came from. Arrives with the font build.</p></div>
    </div>
  </div>`;
  bindWeightPicker(root);
  root.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => {
    const st = +b.dataset.dl, name = st === 106 ? 'aqua-black-106.svg' : st === 53 ? 'aqua-light-53.svg' : `aqua-${st}u.svg`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([E.exportSVG(st)], { type: 'image/svg+xml' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
}

// Guide — the project's own notes, rendered in the app.
const DOCS = [['CLAUDE.md', 'How to work here', '../CLAUDE.md'], ['AQUA-STATUS.md', 'Where things stand', '../AQUA-STATUS.md'], ['SPEC.md', 'The Studio plan', '../studio/SPEC.md']];
function Guide(root) {
  root.classList.add('one');
  const cur = DOCS.find(d => d[0] === S.guide) || DOCS[0];
  root.innerHTML = `<div class="main">
    <h1 class="title">Guide</h1>
    <p class="lead">The notes this project runs on, as they are in the repository. Read "Where things stand" first.</p>
    <div class="tabs" id="tabs">${DOCS.map(d => `<b class="${d[0] === cur[0] ? 'on' : ''}" data-doc="${d[0]}">${d[1]}</b>`).join('')}</div>
    <div class="panel md" id="doc">${S.docs[cur[0]] ? md(S.docs[cur[0]]) : '<p class="sub">Loading…</p>'}</div>
  </div>`;
  $('#tabs').onclick = e => { const b = e.target.closest('[data-doc]'); if (b) { S.guide = b.dataset.doc; renderRoom(); } };
  if (!S.docs[cur[0]]) fetch(cur[2]).then(r => r.ok ? r.text() : 'Could not load ' + cur[0]).then(t => { S.docs[cur[0]] = t; if (S.room === 'Guide' && S.guide === cur[0]) renderRoom(); });
}
// A small markdown renderer: headings, lists, code, tables, rules, inline marks. Enough for our notes.
function md(src) {
  const inline = t => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  const lines = src.split('\n'), out = []; let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) { const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`); continue; }
    if (/^#{1,3} /.test(l)) { const n = l.match(/^#+/)[0].length; out.push(`<h${n}>${inline(l.replace(/^#+ /, ''))}</h${n}>`); i++; continue; }
    if (/^---+\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (/^\|/.test(l)) { const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const body = rows.filter(r => !/^\|[\s:-|]+\|$/.test(r));
      out.push('<table>' + body.map((r, k) => `<tr>${cells(r).map(c => `<${k ? 'td' : 'th'}>${inline(c)}</${k ? 'td' : 'th'}>`).join('')}</tr>`).join('') + '</table>'); continue; }
    if (/^\s*[-*] /.test(l) || /^\s*\d+\. /.test(l)) { const ord = /^\s*\d+\. /.test(l), items = [];
      while (i < lines.length && (/^\s*[-*] /.test(lines[i]) || /^\s*\d+\. /.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) { if (/^\s*([-*]|\d+\.) /.test(lines[i])) items.push(lines[i].replace(/^\s*([-*]|\d+\.) /, '')); else items[items.length - 1] += ' ' + lines[i].trim(); i++; }
      out.push(`<${ord ? 'ol' : 'ul'}>${items.map(t => `<li>${inline(t)}</li>`).join('')}</${ord ? 'ol' : 'ul'}>`); continue; }
    if (/^> /.test(l)) { const buf = []; while (i < lines.length && /^> /.test(lines[i])) buf.push(lines[i++].slice(2)); out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`); continue; }
    if (!l.trim()) { i++; continue; }
    const buf = []; while (i < lines.length && lines[i].trim() && !/^(#{1,3} |```|\||---|\s*[-*] |\s*\d+\. |> )/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

// Health — the sheet, the gate, the list of what is broken.
function Health(root) {
  root.classList.add('one');
  const reps = E.ORDER.split('').map(c => S.health[c]);
  const n = k => reps.filter(r => r.colour === k).length;
  const broken = reps.filter(r => r.colour !== 'green').sort((a, b) => a.score - b.score);
  const gate = n('red') === 0 && n('amber') === 0;
  root.innerHTML = `<div class="main">
    <h1 class="title">Health</h1>
    <p class="lead">Every letter gets a score from its own geometry — smooth curves, points on the edges, works in every weight, sits in its box — and your verdicts sit on top: a letter you mark as not Aqua is red whatever the geometry says.</p>
    <div class="banner ${gate ? 'ok' : 'warn'}"><span>${gate ? '✓' : '!'}</span><span><b>Build gate: ${gate ? 'open' : 'closed'}.</b> ${gate ? 'Every letter is green — a font could be built from this set.' : `${n('red')} letter${n('red') === 1 ? '' : 's'} not Aqua yet and ${n('amber')} to check. The font build waits until the set is green.`}</span></div>
    <div class="grid3" style="margin-bottom:18px">
      ${[['green', 'Looks good'], ['amber', 'Needs a look'], ['red', 'Not Aqua yet']].map(([k, t]) => `<div class="panel tight"><div class="kv" style="margin:0"><span><i class="dot ${k === 'amber' ? 'warn' : k === 'red' ? 'bad' : ''}"></i>${t}</span><span class="ink" style="font-size:22px;font-weight:700">${n(k)}</span></div></div>`).join('')}
    </div>
    <div class="tiles">${reps.map(r => `<div class="tile ${r.colour}" data-ch="${esc(r.ch)}"><div class="g">${glyphSVG(r.ch, 106, { box: 'metrics' })}</div><div class="s"><span>${shown(r.ch)}</span><span>${r.score}</span></div><div class="f">${esc(r.flags[0]?.text || 'Clean')}</div></div>`).join('')}</div>
    <div class="panel" style="margin-top:18px"><h6>What needs work</h6>
      ${broken.length ? `<table><thead><tr><th></th><th>Letter</th><th class="num">Score</th><th>Findings</th></tr></thead><tbody>${broken.map(r => `<tr><td><span class="g">${glyphSVG(r.ch, 106, { box: 'metrics' })}</span></td><td><b>${shown(r.ch)}</b><br><span class="sub small">${KIND[E.kindOf(r.ch)]}</span></td><td class="num" style="color:var(--${r.colour === 'red' ? 'bad' : 'warn'})">${r.score}</td><td>${r.flags.map(f => esc(f.text)).join('<br>')}</td></tr>`).join('')}</tbody></table>` : '<p class="small sub" style="margin:0">Nothing. Every letter is green.</p>'}
    </div>
    <p class="small sub">Scores are computed live from the outlines at thicknesses 53, 78 and 106; the worst weight governs. Your verdicts come from tools/hand.json.</p>
  </div>`;
  root.querySelectorAll('.tile').forEach(t => t.onclick = () => setGlyph(t.dataset.ch));
}

// ── boot ──────────────────────────────────────────────────────────────────────
applyTheme();
computeHealth();
renderTop(); renderRoom();
fetch('../tools/hand.json').then(r => r.ok ? r.json() : null).then(h => { if (h) { S.hand = h; computeHealth(); renderTop(); renderRoom(); } }).catch(() => {});
fetch('../aqua/masters/edited-paths.json').then(r => r.ok ? r.json() : null).then(ed => { if (ed) { S.edited = ed; S.diffs = E.buildDiffs(ed); if (S.room === 'Import') renderRoom(); } }).catch(() => {});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { renderTop(); renderRoom(); });
window.AquaStudio = { S, go, setStem, setGlyph, render: renderRoom };
})();
