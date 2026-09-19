// Screenshot the canonical page (Aqua.dc.html) offline, as a smoke test after engine changes.
// Serves React/Babel from the local npm pack the same way export_glyphs.mjs does, waits for
// section 08 to finish diffing the returned SVGs, and checks the console for errors.
// Usage: AQUA_VENDOR=<dir> node tools/shoot_page.mjs [out.png]   (serve ./aqua on :8766 first)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const V = process.env.AQUA_VENDOR || '';
const out = process.argv[2] || 'tools/out/page.png';
const map = V ? {
  'react@18.3.1/umd/react.production.min.js': V + '/umd/react.production.min.js',
  'react-dom@18.3.1/umd/react-dom.production.min.js': V + '/umd/react-dom.production.min.js',
  '@babel/standalone@7.29.0/babel.min.js': V + '/babel.min.js',
} : {};
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
p.on('pageerror', e => errors.push(String(e)));
// the browser parses the raw <x-dc> template before the runtime fills it, so every {{ }}
// attribute logs a parse error once — that is template noise, not a page error
p.on('console', m => { if (m.type() === 'error' && !m.text().includes('{{')) errors.push(m.text()); });
await p.route('**/*', route => {
  const u = route.request().url();
  for (const k in map) if (u.includes(k)) return route.fulfill({ path: map[k], contentType: 'application/javascript' });
  if (u.includes('fonts.g')) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
  return route.continue();
});
await p.goto('http://localhost:8766/Aqua.dc.html', { waitUntil: 'networkidle' });
await p.waitForFunction(() => typeof window.aquaExport === 'function', null, { timeout: 20000 });
await p.waitForFunction(() => document.body.innerText.includes('drawn masters'), null, { timeout: 20000 });
const n = await p.evaluate(() => document.querySelectorAll('path').length);
await p.screenshot({ path: out, fullPage: true });
console.log(`paths on page: ${n}; console errors: ${errors.length}`);
errors.forEach(e => console.log('  ' + e));
await b.close();
process.exit(errors.length ? 1 : 0);
