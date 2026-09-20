// Render test letters with and without liquid joins (webs tinted red), at Black and Light.
// Usage: node tools/shoot_liquid.mjs [out.png]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const E = require('../aqua/engine.js'), SK = require('../studio/skeletons.js');
const out = process.argv[2] || 'studio/shots/liquid-joins-light.png';
const mk = (ch, strokes) => ({ ch, strokes, thick: 1, ends: 'round', round: 0.5 });
const tests = [mk('T', [[[0, 720], [440, 720]], [[220, 720], [220, 0]]]), mk('X', [[[40, 720], [440, 0]], [[440, 720], [40, 0]]]),
  ...'k a u B R & 4 ⚓ ♪ f'.split(' ').map(c => mk(c, SK.strokes(c).strokes))];
const cw = 480, ch = 400;
let cells = '';
tests.forEach((g, i) => {
  const x = (i % 6) * cw, y = Math.floor(i / 6) * ch;
  const one = (s, dx, liquid) => {
    const plain = E.dropsOutline({ ...g, liquid: false }, s), ws = liquid ? E.webs(g, s) : [];
    const full = E.dropsOutline({ ...g, liquid }, s);
    return `<g transform="translate(${x + dx} ${y + 330}) scale(0.32 -0.32)"><path d="${full}" fill="#000" fill-rule="nonzero"/>${ws.map(w => `<path d="${w}" fill="#e33" fill-opacity=".75"/>`).join('')}</g>`;
  };
  cells += one(106, 10, false) + one(106, 160, true) + one(53, 320, true) + `<text x="${x + 10}" y="${y + 370}" font-size="11" fill="#666">${g.ch.replace('&', '&amp;')} · plain · liquid · Light (${E.webs(g, 106).length} webs)</text>`;
});
const rows = Math.ceil(tests.length / 6);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${6 * cw + 20}" height="${rows * ch + 20}" style="background:#fff;font-family:system-ui"><g transform="translate(10 10)">${cells}</g></svg>`;
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 6 * cw + 20, height: rows * ch + 20 }, deviceScaleFactor: 1.5 });
await p.setContent(`<!doctype html><body style="margin:0">${svg}</body>`);
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log('wrote', out);
