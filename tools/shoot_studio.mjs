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
console.log(`console errors: ${errors.length}`); errors.forEach(e => console.log('  ' + e));
await b.close();
process.exit(errors.length ? 1 : 0);
