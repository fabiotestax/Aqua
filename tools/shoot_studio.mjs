// Screenshot every Studio room in light and dark, for showing the app as pictures.
// Usage: node tools/shoot_studio.mjs [outdir]   (serve the repo root on http://localhost:8000 first)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const out = process.argv[2] || 'studio/shots';
fs.mkdirSync(out, { recursive: true });
const ROOMS = ['Glyphs', 'Weights', 'Spacing', 'Test', 'Import', 'Export', 'Guide', 'Health'];
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
p.on('pageerror', e => errors.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
for (const theme of ['light', 'dark']) {
  for (const room of ROOMS) {
    const extra = room === 'Glyphs' ? '&glyph=g&stem=78' : room === 'Test' ? '&text=aqua%20bonefish&stem=78' : '&stem=78';
    await p.goto(`http://localhost:8000/studio/?room=${room}&theme=${theme}${extra}`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.studioReady === true, null, { timeout: 20000 });
    if (room === 'Import') await p.waitForFunction(() => document.querySelector('.diffrow'), null, { timeout: 20000 });
    if (room === 'Guide') await p.waitForFunction(() => document.querySelector('.md h1'), null, { timeout: 20000 });
    await p.waitForTimeout(150);
    await p.screenshot({ path: `${out}/${room.toLowerCase()}-${theme}.png` });
    console.log(`${room} · ${theme}`);
  }
}
// one extra of the Glyphs room on a different letter, to show the matrix and canvas change
await p.goto('http://localhost:8000/studio/?room=Glyphs&theme=light&glyph=a&stem=106', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.studioReady === true);
await p.screenshot({ path: `${out}/glyphs-a-black-light.png` });

// editing scenes: a selected, nudged point on the k with the snap and compare views
await p.goto('http://localhost:8000/studio/?room=Glyphs&theme=light&glyph=k&stem=106', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.studioReady === true);
await p.evaluate(() => { window.AquaDoc.clearAll(); });
await p.evaluate(() => { window.AquaDoc.nudge('k', 0, 4, 18, 0); window.AquaDoc.nudge('k', 0, 5, 18, 0); window.AquaEditor.select([5]); window.AquaStudio.renderRoom(); });
await p.waitForTimeout(150);
await p.screenshot({ path: `${out}/glyphs-editing-light.png` });
// several points at once: the whole bowl of the k's arm selected, with the group tools in the inspector
await p.evaluate(() => { window.AquaEditor.select([4, 5, 6, 7, 8]); window.AquaStudio.renderRoom(); });
await p.waitForTimeout(150);
await p.screenshot({ path: `${out}/glyphs-multiselect-light.png` });
// the s with its marks: overlapping points and bumps, haloed on the canvas
await p.goto('http://localhost:8000/studio/?room=Glyphs&theme=light&glyph=s&stem=106', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.studioReady === true);
await p.waitForTimeout(150);
await p.screenshot({ path: `${out}/glyphs-marks-light.png` });
await p.goto('http://localhost:8000/studio/?room=Glyphs&theme=light&glyph=k&stem=106', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.studioReady === true);
await p.evaluate(() => { window.AquaEditor.state.compare = true; window.AquaStudio.renderRoom(); });
await p.waitForTimeout(150);
await p.screenshot({ path: `${out}/glyphs-compare-light.png` });
await p.evaluate(() => { window.AquaDoc.clearAll(); localStorage.clear(); });
console.log('editing scenes');

// the New-glyph room: an L from drops, then a traced anchor-like shape
await p.goto('http://localhost:8000/studio/?room=Glyphs&theme=light&glyph=a&stem=78', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.studioReady === true);
await p.evaluate(() => { window.AquaDoc.clearAll(); window.AquaDoc.addNewGlyph('L', { ch: 'L', name: 'L', height: 'caps', use: true, strokes: [[[40, 680], [40, 520], [40, 360], [40, 200], [40, 40], [40, 0], [200, 0], [360, 0]]] }); window.AquaStudio.S.newKey = 'L'; window.AquaStudio.renderRoom(); });
await p.waitForTimeout(200);
await p.screenshot({ path: `${out}/newglyph-light.png` });
await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); window.AquaStudio.renderTop(); window.AquaStudio.renderRoom(); });
await p.waitForTimeout(200);
await p.screenshot({ path: `${out}/newglyph-dark.png` });
await p.evaluate(() => { window.AquaDoc.clearAll(); localStorage.clear(); });
console.log('new glyph scenes');
console.log(`console errors: ${errors.length}`); errors.forEach(e => console.log('  ' + e));
await b.close();
process.exit(errors.length ? 1 : 0);
