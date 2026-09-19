// Pull every glyph out of the live Aqua.dc.html at given stems, via the page's own
// exportSVG (window.aquaExport). Writes tools/out/aqua-<stem>.svg and tools/out/glyphs.json:
//   { "<stem>": { order: [...], glyphs: { name: { d, ox, oy, L, R } } } }
// d is in SVG axis (y down); font units = (x - ox, oy - y). L/R = the advance box.
// Usage: node tools/export_glyphs.mjs 53 78 106   (serve ./aqua on http://localhost:8766 first)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const V = process.env.AQUA_VENDOR || '';
const stems = process.argv.slice(2).map(Number);
const map = V ? {
  'react@18.3.1/umd/react.production.min.js': V + '/umd/react.production.min.js',
  'react-dom@18.3.1/umd/react-dom.production.min.js': V + '/umd/react-dom.production.min.js',
  '@babel/standalone@7.29.0/babel.min.js': V + '/babel.min.js',
} : {};
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage();
await p.route('**/*', route => {
  const u = route.request().url();
  for (const k in map) if (u.includes(k)) return route.fulfill({ path: map[k], contentType: 'application/javascript' });
  if (u.includes('fonts.g')) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
  return route.continue();
});
await p.goto('http://localhost:8766/Aqua.dc.html', { waitUntil: 'networkidle' });
await p.waitForFunction(() => typeof window.aquaExport === 'function', null, { timeout: 20000 });
const out = {};
for (const s of stems) {
  const svg = await p.evaluate(s => window.aquaExport(s), s);
  fs.writeFileSync(`tools/out/aqua-${s}.svg`, svg);
  const glyphs = {}, order = [];
  const pathRe = /<path id="glyph\.([A-Za-z.]+)" d="([^"]*)"/g;
  const rectRe = /<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="981"/g;
  const rects = [...svg.matchAll(rectRe)].map(m => ({ L: +m[1], oy: +m[2] + 751, R: +m[1] + +m[3] }));
  let i = 0, m;
  while ((m = pathRe.exec(svg))) {
    const c = i % 6, r = (i / 6) | 0, ox = c * 1150 + 90, oy = r * 1300 + 1000;
    glyphs[m[1]] = { d: m[2], ox, oy, L: rects[i]?.L, R: rects[i]?.R };
    order.push(m[1]); i++;
  }
  out[s] = { order, glyphs };
  console.log(`stem ${s}: ${order.length} glyphs`);
}
fs.writeFileSync('tools/out/glyphs.json', JSON.stringify(out));
await b.close();
