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
ok(await p.evaluate(() => window.AquaEditor.state.sel === 5), 'clicking a point selects it');
const b5 = await nodePos(5);
await p.keyboard.press('ArrowUp'); await p.keyboard.press('Shift+ArrowLeft'); await p.waitForTimeout(100);
after = await nodePos(5); ok(after[1] - b5[1] === 1 && b5[0] - after[0] === 10, `arrow keys nudge (up 1, left 10): ${after[0] - b5[0]}, ${after[1] - b5[1]}`);
ok(await p.locator('#selnudge').textContent().then(t => t.includes('nudged')), 'inspector shows the nudge');

// 4. snap: drag point 5 near the Small letters line and it lands on 521
[cx, cy] = await nodeClient(5);
const pos5 = await nodePos(5), dyPx = (pos5[1] - 521 + 4) / upp;   // aim 4 units below the line
await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx, cy + dyPx, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(100);
after = await nodePos(5); ok(after[1] === 521, `snaps to the Small letters guide (y ${after[1]})`);

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
console.log(`console errors: ${errors.length}`); errors.forEach(e => console.log('  ' + e));
await b.close();
process.exit(errors.length ? 1 : 0);
