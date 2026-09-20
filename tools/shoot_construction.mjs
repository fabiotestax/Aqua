// Render every glyph the extended construction draws (capitals, punctuation, signs, accents,
// composed letters) through the engine at Black and Light, as one proof sheet PNG — the way
// the generator is shown to Fabio. Also the polished s 2 3 5.
// Usage: node tools/shoot_construction.mjs [out.png] [chars]   (chars: a string, default all)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const E = require('../aqua/engine.js');
const out = process.argv[2] || 'studio/shots/construction-light.png';
const chars = process.argv[3] ? [...process.argv[3]] : ['s', '2', '3', '5', ...Object.keys(E.EXT_DESC)];
const cols = 8, cw = 270, ch = 250, nodes = process.env.NODES === '1';
const cells = chars.map((c, i) => {
  const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
  const one = (s, dx, op) => { const g = E.glyph(c, s); if (!g) return ''; const pts = nodes ? E.parsePath(g.d).flatMap(sub => sub.map(sg => sg[0])) : [];
    return `<g transform="translate(${x + dx} ${y + 190}) scale(0.19 -0.19)"><path d="${g.d}" fill="#000" fill-opacity="${op}" fill-rule="${g.fill}"/>${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#1a73e8"/>`).join('')}</g>`; };
  const n = E.parsePath(E.glyph(c, 106).d).reduce((k, s) => k + s.length, 0);
  return `${one(106, 10, 1)}${one(53, 140, 0.6)}<text x="${x + 10}" y="${y + 224}" font-size="10.5" fill="#666">${c.replace('&', '&amp;').replace('<', '&lt;')} · ${n} pts · ${(E.describeGlyph(c) || 'by rules').slice(0, 44)}</text>`;
}).join('');
const rows = Math.ceil(chars.length / cols);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cw + 20}" height="${rows * ch + 40}" style="background:#fff;font-family:system-ui"><text x="10" y="22" font-size="14">The construction, extended · ${chars.length} glyphs · Black, then Light</text><g transform="translate(10 32)">${cells}</g></svg>`;
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: cols * cw + 20, height: rows * ch + 40 }, deviceScaleFactor: 1.5 });
await p.setContent(`<!doctype html><body style="margin:0">${svg}</body>`);
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log(`wrote ${out} (${chars.length} glyphs)`);
