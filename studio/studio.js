// Aqua Studio — Milestone 1: the shell. Eight rooms, light and dark, a live canvas for any
// letter at any weight (view only), the Test room, and SVG export. No framework, no build:
// window.AquaEngine draws, window.AquaHealth judges, this file only shows.
(() => {
'use strict';
const E = window.AquaEngine, H = window.AquaHealth, D = window.AquaDoc;
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
  const dd = o.d || g.d;
  const b = E.bbox(dd), pad = o.pad ?? 12;
  const x0 = b.xmin - pad, x1 = b.xmax + pad;
  const y0 = o.box === 'metrics' ? -250 : b.ymin - pad, y1 = o.box === 'metrics' ? 780 : b.ymax + pad;
  const style = o.h ? ` style="height:${o.h}px"` : '';
  return `<svg viewBox="${r1(x0)} ${r1(-y1)} ${r1(x1 - x0)} ${r1(y1 - y0)}"${style} ${o.attrs || ''}><g transform="scale(1,-1)"><path d="${dd}" fill-rule="evenodd"/></g></svg>`;
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
      <span id="docstate" title="${esc(D.lastLabel())}">${D.changeCount() ? `${D.changeCount()} change${D.changeCount() > 1 ? 's' : ''}${D.dirty() ? ' · not saved to a file' : ' · saved'}` : 'no changes'}</span>
      <button class="iconbtn ${D.canUndo() ? '' : 'off'}" id="undo" title="Undo${D.canUndo() ? ' · ' + esc(D.lastLabel()) : ''}"><svg viewBox="0 0 20 20"><path d="M8 5L4 9l4 4M4 9h8a4 4 0 0 1 0 8h-2"/></svg></button>
      <button class="iconbtn ${D.canRedo() ? '' : 'off'}" id="redo" title="Redo"><svg viewBox="0 0 20 20"><path d="M12 5l4 4-4 4M16 9H8a4 4 0 0 0 0 8h2"/></svg></button>
      <button class="iconbtn" id="save" title="Save your changes to a file"><svg viewBox="0 0 20 20"><path d="M10 3v10M6 9l4 4 4-4M4 16h12"/></svg></button>
      <button class="iconbtn" id="open" title="Open a saved file"><svg viewBox="0 0 20 20"><path d="M10 13V3M6 7l4-4 4 4M4 16h12"/></svg></button>
      <input type="file" id="openfile" accept=".json,application/json" style="display:none">
      <button class="iconbtn" id="theme" title="Light / dark">${isDark()
        ? '<svg viewBox="0 0 20 20"><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5 5l1.4 1.4M13.6 13.6L15 15M5 15l1.4-1.4M13.6 6.4L15 5"/><path d="M10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>'
        : '<svg viewBox="0 0 20 20"><path d="M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8z"/></svg>'}</button>
    </div>`;
  $('#rooms').onclick = e => { const b = e.target.closest('[data-room]'); if (b) go(b.dataset.room); };
  $('#theme').onclick = () => { S.theme = isDark() ? 'light' : 'dark'; save('theme', S.theme); applyTheme(); renderTop(); renderRoom(); };
  $('#undo').onclick = () => D.undo(); $('#redo').onclick = () => D.redo();
  $('#save').onclick = () => D.download();
  $('#open').onclick = () => $('#openfile').click();
  $('#openfile').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { D.openText(t); } catch (err) { alert('That is not a Studio file: ' + err.message); } }); e.target.value = ''; };
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

// Glyphs — the editor (studio/editor.js).
function Glyphs(root) { window.AquaEditor.room(root); }

// Weights — the family, the axis, and whether every letter survives it.
function Weights(root) {
  root.classList.add('one');
  const s = S.stem, ok = E.ORDER.split('').filter(c => S.health[c].compatible), bad = E.ORDER.split('').filter(c => !S.health[c].compatible);
  root.innerHTML = `<div class="main">
    <h1 class="title">Weights</h1>
    <p class="lead">One axis, from Light to Black. Light and Black are the two drawn weights; everything between them is made live. Scrub the thickness and watch the whole set follow.</p>
    <div class="banner info"><span>✓</span><span><b>Settled:</b> the thinner drawing (thickness 53) is the <b>Light</b>. Regular will be a new drawing near thickness 78; until then it is a blend of Light and Black. The family is Light · Regular · Black.</span></div>
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

// Import — the round trip back in: drop the sheet, see what changed, bring it in.
const IM = { files: [], rows: null, weight: null, err: null };
function Import(root) {
  root.classList.add('one');
  const diffs = S.diffs;
  const rows = IM.rows;
  root.innerHTML = `<div class="main">
    <h1 class="title">Import</h1>
    <p class="lead">Bring a drawing back in. Export a sheet, move points in Illustrator (never add or delete them), save as plain SVG, and drop the file here. The Studio reads which letters changed and lets you bring them in as drawn weights.</p>
    <div class="drop" id="drop"><b>Drop an SVG sheet here</b>or <a href="#" id="browse">choose a file</a>. Black and Light sheets can be dropped together.<input type="file" id="svgfile" accept=".svg,image/svg+xml" multiple style="display:none"></div>
    ${IM.err ? `<div class="banner warn" style="margin-top:14px"><span>!</span><span>${esc(IM.err)}</span></div>` : ''}
    ${rows ? rows.map(r => `<div class="panel" style="margin-top:18px">
      <div class="kv" style="margin:0 0 6px"><span style="font-weight:600;color:var(--ink)">${esc(r.file)}</span><span>${r.weight ? (r.weight === 'black' ? 'Black · thickness 106' : 'Light · thickness 53') : 'weight unknown'} · ${r.items.length} letters found</span></div>
      ${r.weight ? '' : `<div class="row" style="margin:0 0 10px"><label>Which weight is this?</label><span class="seg s" data-file="${esc(r.file)}"><b data-w="black">Black</b><b data-w="regular">Light</b></span></div>`}
      <table><thead><tr><th>Letter</th><th>Your drawing</th><th>What the Studio has</th><th>Difference</th><th>Bring in</th></tr></thead><tbody>
      ${r.items.map(it => `<tr>
        <td><b>${esc(it.label)}</b><br><span class="sub small">${it.points} points</span></td>
        <td><span class="g">${pathSVG(it.d)}</span></td>
        <td><span class="g">${pathSVG(it.mine)}</span></td>
        <td class="${it.ok ? '' : 'bad'}">${esc(it.note)}</td>
        <td>${it.ok && it.changed ? `<input type="checkbox" data-file="${esc(r.file)}" data-ch="${esc(it.ch)}" checked>` : ''}</td></tr>`).join('')}</tbody></table>
      <div class="btn pri inline" data-bring="${esc(r.file)}" style="margin-top:14px">Bring the ticked letters in</div>
      <div class="btn inline" data-discard="${esc(r.file)}" style="margin-top:14px">Discard</div>
    </div>`).join('') : ''}
    <div class="grid2" style="margin-top:18px">
      <div class="panel tight"><h6>Four rules for the round trip</h6><ol class="small" style="margin:0;padding-left:18px;line-height:1.7"><li>Keep each path's name — that is how a drawing finds its letter.</li><li>Keep each letter inside its own cell. Moving it within the cell changes its room, which is fine.</li><li>Flatten before saving so the path carries no transform.</li><li>Save as plain SVG and ignore the guides layer. <b>Move points, never add or delete them.</b></li></ol></div>
      <div class="panel tight"><h6>What a drawing becomes</h6><p class="small" style="margin:0">A letter you bring in stops following the rules and becomes a drawn weight, like the fifteen already in. Bring in one weight and the other stays as it is, so the axis still has two matching drawings. Bring in both for the change to hold across the range. "Forget the imported drawing" in the Glyphs room takes it back out.</p></div>
    </div>
    <div class="panel"><h6>The last round (already in)</h6>
      <p class="small sub" style="margin:0 0 8px">${diffs ? `The two sheets that came back in September. ${diffs.length} letters differ from what the rules draw or were carried over from the other weight; all but B are in as drawn weights.` : 'Reading the returned files…'}</p>
      ${diffs ? diffs.map(d => `<div class="diffrow"><div class="name">${esc(d.name === 'B.cap' ? 'B' : d.name)}<small>${esc(d.devLabel === 'identical' ? 'identical' : d.devLabel + ' moved')}</small></div>
        ${['black', 'regular'].map(k => `<div><svg viewBox="${d.vb}" preserveAspectRatio="xMidYMid meet"><g transform="${d.shift}"><path d="${d[k + 'Theirs']}" fill-rule="evenodd"/></g><path class="mine" d="${d[k + 'Mine']}" fill-rule="evenodd"/></svg><div class="cap">${k === 'black' ? 'Black' : 'Light'} · ${esc(d[k + 'DevLabel'])}</div></div>`).join('')}</div>`).join('') : ''}
    </div>
  </div>`;
  const drop = $('#drop'), input = $('#svgfile');
  $('#browse').onclick = e => { e.preventDefault(); input.click(); };
  input.onchange = e => { readSheets([...e.target.files]); e.target.value = ''; };
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); readSheets([...e.dataTransfer.files]); };
  root.querySelectorAll('[data-file] b[data-w]').forEach(b => b.onclick = () => { const r = IM.rows.find(x => x.file === b.closest('[data-file]').dataset.file); r.weight = b.dataset.w; compareRows(r); renderRoom(); });
  root.querySelectorAll('[data-bring]').forEach(b => b.onclick = () => {
    const r = IM.rows.find(x => x.file === b.dataset.bring); if (!r.weight) { IM.err = 'Say which weight this sheet is first.'; renderRoom(); return; }
    const picked = [...root.querySelectorAll(`input[type=checkbox][data-file="${CSS.escape(r.file)}"]:checked`)].map(i => i.dataset.ch);
    let n = 0; const fails = [];
    for (const ch of picked) { const it = r.items.find(x => x.ch === ch); const res = D.importMaster(ch, r.weight, it.d); if (res.ok) n++; else fails.push(`${shown(ch)}: ${res.why}`); }
    IM.rows = IM.rows.filter(x => x !== r); IM.err = fails.length ? 'Could not bring in ' + fails.join('; ') : null;
    D.commit(`Bring in ${n} drawing${n === 1 ? '' : 's'} from ${r.file}`);
  });
  root.querySelectorAll('[data-discard]').forEach(b => b.onclick = () => { IM.rows = IM.rows.filter(x => x.file !== b.dataset.discard); renderRoom(); });
}
function pathSVG(d) { if (!d) return ''; const b = E.bbox(d); if (!b) return ''; return `<svg viewBox="${r1(b.xmin - 10)} ${r1(-780)} ${r1(b.xmax - b.xmin + 20)} ${r1(780 + 250)}" style="height:56px;width:auto"><g transform="scale(1,-1)"><path d="${d}" fill-rule="evenodd"/></g></svg>`; }
// Read dropped sheets: find each glyph path, map it into font units from its cell, compare.
function readSheets(files) {
  IM.err = null;
  const svgs = files.filter(f => /\.svg$/i.test(f.name) || f.type === 'image/svg+xml');
  if (!svgs.length) { IM.err = 'That is not an SVG file.'; renderRoom(); return; }
  Promise.all(svgs.map(f => f.text().then(t => ({ name: f.name, text: t })))).then(list => {
    IM.rows = IM.rows || [];
    for (const { name, text } of list) {
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      const paths = [...doc.querySelectorAll('path[id^="glyph."]')];
      if (!paths.length) { IM.err = `${name}: no letters found — the paths need their glyph.<name> ids.`; continue; }
      const m = /stem\s+(\d+)u/.exec(text) || /(\d{2,3})/.exec(name);
      const stem = m ? +m[1] : null;
      const weight = stem === 106 ? 'black' : stem === 53 ? 'regular' : null;
      const byName = {}; for (const ch of E.ORDER) byName[E.GNAME[ch] || ch] = ch;
      const v1 = !!doc.querySelector('path[id="glyph.zero"]') || paths.length > 30;
      const cells = E.cellOrigins(v1 ? E.ORDER_V1 : E.ORDER);
      const items = [];
      for (const p of paths) {
        const gname = p.id.slice(6), ch = byName[gname]; if (!ch) continue;
        const cell = cells[gname]; if (!cell) continue;
        const raw = E.toFontUnits(E.normalizeSVGPath(p.getAttribute('d') || ''), cell.ox, cell.oy);
        items.push({ ch, label: shown(ch), raw, points: E.nodes(raw).reduce((n, s) => n + s.length, 0) });
      }
      const row = { file: name, weight, items };
      if (weight) compareRows(row);
      IM.rows = IM.rows.filter(x => x.file !== name).concat([row]);
    }
    renderRoom();
  });
}
function compareRows(r) {
  const stem = r.weight === 'black' ? 106 : 53;
  for (const it of r.items) {
    // the sheet placed the ink at the cell edge (export shifts by the letter's left ink edge); undo that
    it.d = E.translatePath(it.raw, E.glyph(it.ch, stem).minX, 0);
    // compare with the letter as it is now — the sheet went out with every Studio edit in it
    const mine = E.serializePath(E.parsePath(E.outline(it.ch, r.weight === 'black' ? 106 : 53)));
    it.mine = mine;
    const chk = E.sameSkeleton(it.d, mine);
    if (!chk.ok) { it.ok = false; it.changed = true; it.note = 'Cannot bring in — ' + chk.why; continue; }
    const A = E.samplePath(it.d, 0, 0), B = E.samplePath(mine, 0, 0);
    const dev = Math.max(E.devOneWay(A, B), E.devOneWay(B, A));
    it.ok = true; it.changed = dev >= 1; it.note = dev < 1 ? 'unchanged' : `${Math.round(dev)} units moved`;
  }
}

// Export — the SVG round trip out, plus where the font build will go.
function Export(root) {
  root.classList.add('one');
  const s = S.stem;
  const sheet = E.exportSVG(s);
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sheet);
  root.innerHTML = `<div class="main">
    <h1 class="title">Export</h1>
    <p class="lead">Every letter goes out as one plain path on a ruled sheet, ready for Illustrator, with every change you have made in the Studio included. Edit both drawn weights if you want a change to hold across the whole range.</p>
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
window.AquaStudio = { S, go, setStem, setGlyph, render: renderRoom, renderRoom, renderTop, glyphSVG, lineSVG, weightPicker, bindWeightPicker, healthLines, KIND, KIND_LONG, shown, esc };
applyTheme();
D.init();
computeHealth();
renderTop(); renderRoom();
D.onChange(() => { computeHealth(); renderTop(); renderRoom(); });
addEventListener('keydown', e => {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) D.redo(); else D.undo(); return; }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); D.download(); return; }
  if (window.AquaEditor && window.AquaEditor.keydown(e)) e.preventDefault();
});
addEventListener('beforeunload', e => { if (D.dirty() && D.changeCount()) { e.preventDefault(); e.returnValue = ''; } });
fetch('../tools/hand.json').then(r => r.ok ? r.json() : null).then(h => { if (h) { S.hand = h; computeHealth(); renderTop(); renderRoom(); } }).catch(() => {});
fetch('../aqua/masters/edited-paths.json').then(r => r.ok ? r.json() : null).then(ed => { if (ed) { S.edited = ed; S.diffs = E.buildDiffs(ed); if (S.room === 'Import') renderRoom(); } }).catch(() => {});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { renderTop(); renderRoom(); });
})();
