// Drive the Studio the way Fabio would and check what happens: drag a point, undo it, nudge
// with the keyboard, edit one weight only, make a variation, save and reopen the file, and
// bring a sheet back in. Prints one line per check; exits non-zero on the first failure.
// Usage: node tools/test_studio.mjs   (serve the repo root on http://localhost:8000 first)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
p.on('pageerror', e => errors.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
p.on('dialog', d => d.accept(d.type() === 'prompt' ? 'h · open' : undefined));
const ok = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) { throw new Error(msg); } };
const nodePos = i => p.evaluate(i => { const c = document.querySelectorAll('#nodes .node')[i]; return [+c.getAttribute('cx'), +c.getAttribute('cy')]; }, i);
const nodeClient = async i => { const box = await p.locator(`#nodes .node[data-i="${i}"]`).boundingBox(); return [box.x + box.width / 2, box.y + box.height / 2]; };
const unitsPerPx = () => p.evaluate(() => 1 / window.AquaEditor.state.view.k);

await p.goto('http://localhost:8000/studio/?room=Glyphs&theme=light&glyph=h&stem=78', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.studioReady === true);
await p.evaluate(() => { localStorage.clear(); window.AquaDoc.clearAll(); });
await p.waitForTimeout(100);

// 1. drag point 3 of the h to the right by ~40 units, in both weights
const before = await nodePos(3), upp = await unitsPerPx();
let [cx, cy] = await nodeClient(3);
await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx + 20, cy, { steps: 4 }); await p.mouse.move(cx + 40 / upp, cy, { steps: 8 }); await p.mouse.up();
await p.waitForTimeout(100);
let after = await nodePos(3);
ok(Math.abs((after[0] - before[0]) - 40) <= 3 && Math.abs(after[1] - before[1]) <= 3, `drag moved point 3 by ~40 units (${(after[0] - before[0]).toFixed(1)}, ${(after[1] - before[1]).toFixed(1)})`);
let st = await p.evaluate(() => window.AquaDoc.nodeState('h', 0, 3));
ok(st.light && st.black && st.light.d[0] === st.black.d[0], `edit landed in both weights (${st.light.d})`);
ok(await p.evaluate(() => document.querySelector('#docstate').textContent.startsWith('2 change')), 'top bar counts the change');
ok((await p.evaluate(() => window.AquaEngine.glyph('h', 106).d)) !== (await p.evaluate(() => { const k = window.AquaEngine.getDoc(); window.AquaEngine.setDoc(null); const d = window.AquaEngine.glyph('h', 106).d; window.AquaEngine.setDoc(k); return d; })), 'the engine draws the edited outline everywhere');

// 2. undo / redo
await p.keyboard.press('Control+z'); await p.waitForTimeout(100);
after = await nodePos(3); ok(Math.abs(after[0] - before[0]) < 0.6, 'undo puts the point back');
await p.keyboard.press('Control+Shift+z'); await p.waitForTimeout(100);
after = await nodePos(3); ok(Math.abs((after[0] - before[0]) - 40) <= 3, 'redo moves it again');

// 3. select + arrow nudge
[cx, cy] = await nodeClient(5); await p.mouse.click(cx, cy); await p.waitForTimeout(50);
ok(await p.evaluate(() => window.AquaEditor.state.sel.has(5) && window.AquaEditor.state.sel.size === 1), 'clicking a point selects it');
const b5 = await nodePos(5);
await p.keyboard.press('ArrowUp'); await p.keyboard.press('Shift+ArrowLeft'); await p.waitForTimeout(100);
after = await nodePos(5); ok(after[1] - b5[1] === 1 && b5[0] - after[0] === 10, `arrow keys nudge (up 1, left 10): ${after[0] - b5[0]}, ${after[1] - b5[1]}`);
ok(await p.locator('#selnudge').textContent().then(t => t.includes('nudged')), 'inspector shows the nudge');

// 4. snap: drag point 5 near the Small letters line and it lands on 521
[cx, cy] = await nodeClient(5);
const pos5 = await nodePos(5), dyPx = (pos5[1] - 521 + 4) / upp;   // aim 4 units below the line
await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx, cy + dyPx, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(100);
after = await nodePos(5); ok(after[1] === 521, `snaps to the Small letters guide (y ${after[1]})`);

// 4b. more than one point: Shift-click, a rectangle, a group drag, Backspace
[cx, cy] = await nodeClient(6); await p.keyboard.down('Shift'); await p.mouse.click(cx, cy); await p.keyboard.up('Shift'); await p.waitForTimeout(50);
ok(await p.evaluate(() => { const s = window.AquaEditor.state.sel; return s.size === 2 && s.has(5) && s.has(6); }), 'Shift-click adds a second point');
const ptsBefore = await p.evaluate(() => [...document.querySelectorAll('#nodes .node')].map(c => [+c.getAttribute('cx'), +c.getAttribute('cy')]));
const bb = await p.locator('#nodes').boundingBox();
await p.mouse.move(bb.x - 12, bb.y - 12); await p.mouse.down(); await p.mouse.move(bb.x + bb.width + 12, bb.y + bb.height + 12, { steps: 8 });
ok(await p.evaluate(() => !!document.querySelector('#cv .marquee')), 'dragging on empty canvas draws a rectangle');
await p.mouse.up(); await p.waitForTimeout(80);
const nAll = ptsBefore.length;
ok(await p.evaluate(n => window.AquaEditor.state.sel.size === n, nAll), `the rectangle selects every point inside it (${nAll})`);
[cx, cy] = await nodeClient(2); await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx + 10, cy, { steps: 3 }); await p.mouse.move(cx + 30 / upp, cy, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(100);
const ptsAfter = await p.evaluate(() => [...document.querySelectorAll('#nodes .node')].map(c => [+c.getAttribute('cx'), +c.getAttribute('cy')]));
ok(ptsAfter.every((q, i) => Math.abs((q[0] - ptsBefore[i][0]) - 30) <= 3), 'dragging one selected point moves the whole selection');
await p.keyboard.press('Control+z'); await p.waitForTimeout(80);
await p.keyboard.press('Escape'); await p.waitForTimeout(50);
ok(await p.evaluate(() => window.AquaEditor.state.sel.size === 0), 'Esc clears the selection');
// Space + drag looks around
const panBefore = await p.evaluate(() => [window.AquaEditor.state.pan.slice(), window.AquaDoc.changeCount()]);
await p.keyboard.down(' '); await p.mouse.move(bb.x + 40, bb.y + 40); await p.mouse.down(); await p.mouse.move(bb.x + 140, bb.y + 60, { steps: 5 }); await p.mouse.up(); await p.keyboard.up(' '); await p.waitForTimeout(80);
ok(await p.evaluate(([p0, n0]) => { const p1 = window.AquaEditor.state.pan; return Math.abs(p1[0] - p0[0]) > 20 && window.AquaDoc.changeCount() === n0; }, panBefore), 'Space + drag pans the canvas without editing anything');
await p.keyboard.press('0');
// add a point on the outline, then remove it again
const nPts = await p.evaluate(() => document.querySelectorAll('#nodes .node').length);
await p.keyboard.press('a'); await p.waitForTimeout(50);
const mid = await p.evaluate(() => { const E = window.AquaEngine, d = E.outline('h', 78); const sub = E.parsePath(d)[0]; const a = sub[0][0], b = sub[1][0]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; });
const midClient = await p.evaluate(([ux, uy]) => { const svg = document.getElementById('cv'), flip = document.getElementById('flip'); const pt = svg.createSVGPoint(); pt.x = ux; pt.y = uy; const c = pt.matrixTransform(flip.getScreenCTM()); return [c.x, c.y]; }, mid);
await p.mouse.click(midClient[0], midClient[1]); await p.waitForTimeout(120);
ok(await p.evaluate(n => document.querySelectorAll('#nodes .node').length === n + 1 && window.AquaEditor.state.sel.size === 1, nPts), `Add point puts a point on the outline (${nPts} → ${nPts + 1})`);
ok(await p.evaluate(() => window.AquaEngine.parsePath(window.AquaEngine.outline('h', 53))[0].length === window.AquaEngine.parsePath(window.AquaEngine.outline('h', 106))[0].length), 'both weights got the point');
p.removeAllListeners('dialog'); p.on('dialog', d => d.accept());
await p.keyboard.press('v'); await p.keyboard.press('Backspace'); await p.waitForTimeout(120);
ok(await p.evaluate(n => document.querySelectorAll('#nodes .node').length === n, nPts), 'Backspace removes it again');
p.removeAllListeners('dialog'); p.on('dialog', d => d.accept(d.type() === 'prompt' ? 'h · open' : undefined));
// measure
await p.keyboard.press('r'); await p.mouse.move(bb.x + 20, bb.y + 20); await p.mouse.down(); await p.mouse.move(bb.x + 120, bb.y + 20, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(80);
ok(await p.evaluate(() => !!document.querySelector('#cv .measure')), 'the measure tool draws a ruler');
await p.keyboard.press('Escape'); await p.keyboard.press('v');
// the cheat sheet
await p.keyboard.press('?'); await p.waitForTimeout(80);
ok(await p.evaluate(() => !!document.querySelector('#cheatsheet') && document.querySelector('#cheatsheet').textContent.includes('Space')), '? opens the cheat sheet');
await p.screenshot({ path: 'studio/shots/cheatsheet-light.png' });
await p.keyboard.press('Escape'); await p.waitForTimeout(50);
ok(await p.evaluate(() => !document.querySelector('#cheatsheet')), 'Esc closes it');
ok(await p.evaluate(() => document.querySelector('#save').classList.contains('attn') && !!document.querySelector('.savebar')), 'the Save button and the inspector remind you to save');

// 5. unlinked: edit Black only
await p.click('#linked'); await p.waitForTimeout(100);
ok(await p.evaluate(() => window.AquaStudio.S.stem === 53), 'unlinking at 78 moves the slider to Light');
await p.click('[data-act="weights"] b[data-stem="106"]'); await p.waitForTimeout(100);
[cx, cy] = await nodeClient(7); await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx, cy - 30 / (await unitsPerPx()), { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(100);
st = await p.evaluate(() => window.AquaDoc.nodeState('h', 0, 7));
ok(st.black && !st.light, `unlinked drag edits Black only (${JSON.stringify(st)})`);
ok(await p.evaluate(() => !document.querySelector('[data-act="applyall"]').classList.contains('off')), '"Apply to all weights" lights up');
await p.click('[data-act="applyall"]'); await p.waitForTimeout(100);
st = await p.evaluate(() => window.AquaDoc.nodeState('h', 0, 7)); ok(st.light && st.light.d[1] === st.black.d[1], 'apply to all copies Black onto Light');
await p.click('#linked');

// 6. roundness
await p.locator('#nodes .node[data-i="9"]').click(); await p.waitForTimeout(50);
await p.locator('#round').fill('1.4'); await p.locator('#round').dispatchEvent('input'); await p.locator('#round').dispatchEvent('change'); await p.waitForTimeout(100);
st = await p.evaluate(() => window.AquaDoc.nodeState('h', 0, 9)); ok(st.light && Math.abs(st.light.r - 1.4) < 1e-9, 'roundness slider sets r');

// 7. variation
await p.click('[data-act="savevar"]'); await p.waitForTimeout(150);
ok(await p.evaluate(() => window.AquaDoc.variants('h').length === 2 && window.AquaEditor.state.variant === 1), 'saved as a variation and selected it');
await p.click('[data-act="usevar"]'); await p.waitForTimeout(100);
ok(await p.evaluate(() => window.AquaDoc.used('h') === 1), 'the variation is now used in text');

// 8. health and matrix follow the edits
ok(await p.evaluate(() => document.querySelector('#matrix .c[data-ch="h"] .edited') !== null), 'matrix marks the h as changed');

// 9. save to a file, clear, reopen
const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#save')]);
const path = await dl.path(); const json = fs.readFileSync(path, 'utf8');
ok(JSON.parse(json).glyphs.h.variants.length === 2, 'saved file holds the h and its variation');
await p.evaluate(() => window.AquaDoc.clearAll()); await p.waitForTimeout(100);
ok(await p.evaluate(() => window.AquaDoc.changeCount() === 0), 'cleared');
await p.locator('#openfile').setInputFiles({ name: 'aqua-studio-edits.json', mimeType: 'application/json', buffer: Buffer.from(json) }); await p.waitForTimeout(200);
ok(await p.evaluate(() => window.AquaDoc.variants('h').length === 2), 'reopened the file');

// 10. autosave survives a reload
await p.reload({ waitUntil: 'networkidle' }); await p.waitForFunction(() => window.studioReady === true);
ok(await p.evaluate(() => window.AquaDoc.variants('h').length === 2), 'edits survive a reload (autosave)');

// 11. import: export the Black sheet, move the n's first point, drop it back
const sheet = await p.evaluate(() => window.AquaEngine.exportSVG(106));
// move the n's first point 25 to the right — and the closing point that sits on it, as Illustrator would
const moved = sheet.replace(/<path id="glyph\.n" d="([^"]*)"/, (m, d) => {
  const [, x, y] = /^M([-\d.]+) ([-\d.]+)/.exec(d);
  return `<path id="glyph.n" d="${d.split(`${x} ${y}`).join(`${(+x + 25).toFixed(1)} ${y}`)}"`; });
ok(moved !== sheet, 'made a sheet with the n moved');
await p.goto('http://localhost:8000/studio/?room=Import&theme=light', { waitUntil: 'networkidle' }); await p.waitForFunction(() => window.studioReady === true);
await p.locator('#svgfile').setInputFiles({ name: 'aqua-black-106.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(moved) }); await p.waitForTimeout(800);
const rowText = await p.evaluate(() => [...document.querySelectorAll('tbody tr')].map(tr => tr.innerText.replace(/\s+/g, ' ')).join(' | '));
ok(/n \d+ points.*?units moved/.test(rowText), 'import shows the n as moved');
ok((rowText.match(/unchanged/g) || []).length >= 25, 'and the rest as unchanged');
ok(await p.evaluate(() => document.querySelectorAll('input[type=checkbox][data-ch]').length === 1), 'only the n is ticked to bring in');
await p.screenshot({ path: 'studio/shots/import-review-light.png' });
await p.click('[data-bring]'); await p.waitForTimeout(300);
ok(await p.evaluate(() => window.AquaDoc.hasMaster('n') && window.AquaEngine.kindOf('n') === 'drawn'), 'the n is now a drawn weight');
const n106 = await p.evaluate(() => window.AquaEngine.parsePath(window.AquaEngine.glyph('n', 106).d)[0][0][0][0]);
const n53 = await p.evaluate(() => window.AquaEngine.parsePath(window.AquaEngine.glyph('n', 53).d)[0][0][0][0]);
ok(Math.abs(n106 - 283.5) < 0.2 && Math.abs(n53 - 232) < 0.2, `Black took the moved point (${n106}) and Light kept the rules (${n53})`);

// 12. forget it
await p.goto('http://localhost:8000/studio/?room=Glyphs&glyph=n&stem=106&theme=light', { waitUntil: 'networkidle' }); await p.waitForFunction(() => window.studioReady === true);
await p.click('[data-act="forget"]'); await p.waitForTimeout(150);
ok(await p.evaluate(() => !window.AquaDoc.hasMaster('n') && window.AquaEngine.kindOf('n') === 'parametric'), 'forgetting the drawing restores the rules');

await p.evaluate(() => { window.AquaDoc.clearAll(); localStorage.clear(); });

// ── Milestone 3: spacing edits and the built font ──
await p.goto('http://localhost:8000/studio/?room=Spacing&theme=light&stem=106', { waitUntil: 'networkidle' }); await p.waitForFunction(() => window.studioReady === true);
await p.evaluate(() => { window.AquaDoc.clearAll(); });
await p.waitForTimeout(100);
const advB0 = await p.evaluate(() => window.AquaEngine.glyph('B', 106).w);
await p.click('#fromink'); await p.waitForTimeout(150);
const advB1 = await p.evaluate(() => window.AquaEngine.glyph('B', 106).w);
ok(Math.abs(advB0 - 400) < 0.1 && Math.abs(advB1 - 453) < 0.1, `room from ink: B width ${advB0} → ${advB1}`);
await p.click('[data-edge="n"][data-side="1"] b[data-k="o"]'); await p.waitForTimeout(150);
ok(await p.evaluate(() => window.AquaEngine.shapeOf('n') === 'fo'), 'edge class of n set to flat · open');
await p.locator('input[data-pair="ma"]').fill('-40'); await p.locator('input[data-pair="ma"]').dispatchEvent('change'); await p.waitForTimeout(150);
ok(await p.evaluate(() => window.AquaEngine.kernOf('ma') === -40), 'pair ma changed to -40');
await p.locator('#np').fill('zz'); await p.locator('#nv').fill('-9'); await p.click('#addpair'); await p.waitForTimeout(150);
ok(await p.evaluate(() => window.AquaEngine.kernOf('zz') === -9 && window.AquaDoc.changeCount() >= 4), 'new pair zz added and counted');
await p.click('a[data-drop="zz"]'); await p.waitForTimeout(150);
ok(await p.evaluate(() => window.AquaEngine.kernOf('zz') === 0), 'pair removed again');
await p.goto('http://localhost:8000/studio/?room=Test&theme=light&stem=106&real=1', { waitUntil: 'networkidle' }); await p.waitForFunction(() => window.studioReady === true);
await p.waitForFunction(() => document.querySelector('.realfont'), null, { timeout: 5000 });
ok(await p.evaluate(() => document.fonts.check("40px AquaVF")), 'the built font loads in the Test room');
await p.screenshot({ path: 'studio/shots/test-realfont-light.png' });
await p.evaluate(() => { window.AquaDoc.clearAll(); localStorage.clear(); });

// ── Milestone 4: a new letter from drops, and a traced image ──
await p.goto('http://localhost:8000/studio/?room=Glyphs&theme=light&glyph=a&stem=106', { waitUntil: 'networkidle' }); await p.waitForFunction(() => window.studioReady === true);
await p.evaluate(() => { window.AquaDoc.clearAll(); });
p.removeAllListeners('dialog'); p.on('dialog', d => d.accept(d.type() === 'prompt' ? 'L' : undefined));
await p.click('[data-act="newletter"]'); await p.waitForTimeout(200);
ok(await p.evaluate(() => window.AquaStudio.S.newKey === 'L' && !!document.querySelector('#tiles')), 'a new letter opens the drops room');
const tileClient = (ux, uy) => p.evaluate(([ux, uy]) => { const svg = document.getElementById('cv'), flip = document.getElementById('flip'); const pt = svg.createSVGPoint(); pt.x = ux; pt.y = uy; const c = pt.matrixTransform(flip.getScreenCTM()); return [c.x, c.y]; }, [ux, uy]);
for (const [x, y] of [[40, 680], [40, 520], [40, 360], [40, 200], [40, 40], [40, 0], [200, 0], [360, 0]]) { const [cx, cy] = await tileClient(x, y); await p.mouse.click(cx, cy); await p.waitForTimeout(60); }
let strokes = await p.evaluate(() => window.AquaDoc.newGlyphs().L.strokes);
ok(strokes.length === 1 && strokes[0].length === 8, `eight taps make one stroke of eight drops (${strokes.map(s => s.length).join('+')})`);
ok(await p.evaluate(() => !!document.querySelector('#skin')), 'the stroked outline draws on the canvas');
await p.click('[data-act="use"]'); await p.waitForTimeout(200);
ok(await p.evaluate(() => window.AquaEngine.allChars().includes('L') && window.AquaEngine.kindOf('L') === 'drops'), 'Add to Aqua puts the L in the set');
ok(await p.evaluate(() => window.AquaEngine.layout('aLa', 78).glyphs.length === 3), 'the L lays out in text');
ok(await p.evaluate(() => window.AquaStudio.S.health.L && window.AquaStudio.S.health.L.compatible), 'the L has a health score and blends across weights');
// erase the corner drop: the stroke splits in two
await p.click('#tools [data-tool="erase"]'); await p.waitForTimeout(100);
let [ex, ey] = await tileClient(40, 200); await p.mouse.click(ex, ey); await p.waitForTimeout(150);
strokes = await p.evaluate(() => window.AquaDoc.newGlyphs().L.strokes);
ok(strokes.length === 2, `erasing a middle drop splits the stroke (${strokes.map(s => s.length).join('+')})`);
await p.keyboard.press('Control+z'); await p.waitForTimeout(150);
ok(await p.evaluate(() => window.AquaDoc.newGlyphs().L.strokes.length === 1), 'undo joins it back');
await p.screenshot({ path: 'studio/shots/newglyph-light.png' });
// trace: render the engine's own "a" at Black to a PNG and hand it to the tracer
const traced = await p.evaluate(async () => {
  const E = window.AquaEngine; const g = E.glyph('a', 106); const b = E.bbox(g.d);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.xmin} ${-b.ymax} ${b.xmax - b.xmin} ${b.ymax - b.ymin}" width="${Math.round(b.xmax - b.xmin)}" height="${Math.round(b.ymax - b.ymin)}"><g transform="scale(1,-1)"><path d="${g.d}" fill="#000" fill-rule="evenodd"/></g></svg>`;
  const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await im.decode();
  const strokes = window.AquaNew.traceImage(im, { x: 0, y: b.ymin, w: b.xmax - b.xmin, h: b.ymax - b.ymin });
  return { n: strokes.length, drops: strokes.reduce((k, s) => k + s.length, 0), first: strokes[0] };
});
ok(traced.n >= 1 && traced.drops >= 6, `tracing an image of the a gives ${traced.n} stroke(s), ${traced.drops} drops`);
await p.evaluate(() => { window.AquaDoc.clearAll(); localStorage.clear(); });
console.log(`console errors: ${errors.length}`); errors.forEach(e => console.log('  ' + e));
await b.close();
process.exit(errors.length ? 1 : 0);
