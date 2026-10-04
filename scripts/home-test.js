// Every homepage template as saved: renders, no script errors, no sideways
// scroll at 1440 or 390, and the shared details follow the design: buttons
// and links in sentence case with the design's size, eyebrows at the design's
// size, section headings not in capitals, rail cards wide enough, primary
// buttons legible.
//   python3 scripts/home-check.py OUT && node scripts/home-test.js OUT
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const routeFonts = require('./fonts-route');
const DIR = process.argv[2] || '.';
const ORIGIN = 'http://shop.test';
let ok = 0, bad = 0; const errs = [];
const check = (n, c, extra = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (extra ? '  ' + extra : '')); c ? ok++ : bad++; };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  async function open(name, w) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, isMobile: w < 500, hasTouch: w < 500 });
    p.on('pageerror', e => errs.push(`${name}@${w}: ${e.message}`));
    if (process.env.NOFONTS) await p.route('https://fonts.googleapis.com/**', r => r.abort()); else await routeFonts(p);
    await p.route(ORIGIN + '/**', r => {
      const f = path.join(DIR, new URL(r.request().url()).pathname);
      return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
    });
    await p.goto(`${ORIGIN}/${name}.html`); await p.waitForTimeout(400);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } scrollTo(0, 0); });
    await p.waitForTimeout(300);
    return p;
  }
  const pages = fs.readdirSync(DIR).filter(f => /^hm_.*\.html$/.test(f)).map(f => f.replace('.html', '')).sort();
  for (const n of pages) {
    let p = await open(n, 1440);
    const r = await p.evaluate(() => {
      const secs = [...document.querySelectorAll('[data-section-type]')];
      const vis = el => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
      const role = el => { const c = [...el.classList].find(x => /(^|[-_])(btn|cta|link|submit|follow)$/.test(x)); return c; };
      const actions = [...document.querySelectorAll('[data-section-type] [class]')].filter(el => role(el) && vis(el) && el.textContent.trim().length > 1 && !el.closest('.card, .mn-breadcrumb') && !el.querySelector('img, picture, svg[class*=placeholder], [class*=img], [class*=media]'));
      const upperActions = actions.filter(el => getComputedStyle(el).textTransform === 'uppercase').map(role);
      const eyebrows = [...document.querySelectorAll('[data-section-type] [class*="eyebrow"]')].filter(el => vis(el) && el.textContent.trim());
      const bigEyebrows = eyebrows.filter(el => parseFloat(getComputedStyle(el).fontSize) > 12.5).map(el => [...el.classList][0]);
      const heads = [...document.querySelectorAll('[data-section-type] h2')].filter(el => vis(el) && el.textContent.trim().length > 3 && !el.closest('.card'));
      const upperHeads = heads.filter(el => getComputedStyle(el).textTransform === 'uppercase').map(el => el.className);
      const rails = [...document.querySelectorAll('.card--rail')].filter(vis).map(el => Math.round(el.getBoundingClientRect().width));
      const lum = c => { const m = c.match(/[\d.]+/g); if (!m) return 1; const [r, g, bl] = m.slice(0, 3).map(v => { v = v / 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * bl; };
      const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c) && !/, 0\)$/.test(c)) return c; } return 'rgb(255,255,255)'; };
      const lowContrast = actions.filter(el => { const cs = getComputedStyle(el); if (/rgba\(0, 0, 0, 0\)/.test(cs.backgroundColor)) return false; const a = lum(cs.color), bb = lum(bgOf(el)); const ratio = (Math.max(a, bb) + .05) / (Math.min(a, bb) + .05); return ratio < 3; }).map(role);
      return { n: secs.length, errors: document.querySelectorAll('.render-error').length, actions: actions.length, upperActions, bigEyebrows, upperHeads, rails, lowContrast,
               w: Math.max(document.documentElement.scrollWidth, innerWidth) };
    });
    check(`${n}: ${r.n} sections render`, r.n > 3 && r.errors === 0);
    check(`${n}: buttons and links in sentence case (${r.actions})`, r.upperActions.length === 0, r.upperActions.join(' '));
    check(`${n}: eyebrows at the design size`, r.bigEyebrows.length === 0, r.bigEyebrows.join(' '));
    check(`${n}: section headings not in capitals`, r.upperHeads.length === 0, r.upperHeads.join(' '));
    check(`${n}: filled buttons legible (contrast ≥ 3)`, r.lowContrast.length === 0, r.lowContrast.join(' '));
    if (r.rails.length) check(`${n}: rail cards at least 200px`, Math.min(...r.rails) >= 200, r.rails.join(','));
    check(`${n}: no sideways scroll at 1440`, r.w <= 1440, String(r.w));
    await p.close();
    p = await open(n, 390);
    const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, innerWidth));
    check(`${n}: no sideways scroll at 390`, w <= 390, String(w));
    await p.close();
  }
  check('no page errors', errs.length === 0, errs.slice(0, 6).join(' | '));
  await b.close();
  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
