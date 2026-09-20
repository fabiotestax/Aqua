// Render every skeleton in studio/skeletons.js through the engine at Light and Black, as one
// proof sheet PNG (studio/shots/skeletons-light.png) — the way the library is shown to Fabio.
// Usage: node tools/shoot_skeletons.mjs [out.png]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const E = require('../aqua/engine.js'), SK = require('../studio/skeletons.js');
const out = process.argv[2] || 'studio/shots/skeletons-light.png';
const cols = 10, cw = 150, ch = 190;
const cells = SK.chars().map((c, i) => {
  const sk = SK.strokes(c), g = { ch: c, strokes: sk.strokes, thick: 1, ends: 'round', round: 0.5 };
  const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
  const one = (s, dx, op) => `<g transform="translate(${x + dx} ${y + 150}) scale(0.11 -0.11)"><path d="${E.dropsOutline(g, s)}" fill="#000" fill-opacity="${op}" fill-rule="nonzero"/></g>`;
  return `${one(106, 10, 1)}${one(53, 78, 0.55)}<text x="${x + 10}" y="${y + 176}" font-family="system-ui" font-size="11" fill="#666">${c.replace('&', '&amp;').replace('<', '&lt;')} · ${SK.describe(c).toLowerCase()}</text>`;
}).join('');
const rows = Math.ceil(SK.chars().length / cols);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cw + 20}" height="${rows * ch + 40}" style="background:#fff;font-family:system-ui"><text x="10" y="22" font-size="14" fill="#000">The skeleton library · ${SK.chars().length} structures · Black, then Light</text><g transform="translate(10 32)">${cells}</g></svg>`;
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: cols * cw + 20, height: rows * ch + 40 }, deviceScaleFactor: 1.5 });
await p.setContent(`<!doctype html><body style="margin:0">${svg}</body>`);
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log(`wrote ${out} (${SK.chars().length} skeletons)`);
