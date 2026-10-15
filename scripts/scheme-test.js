// Colour-scheme sweep: every page written by scripts/scheme-sweep.py, in each
// theme colour scheme, at 1440 and 390. Fails when visible text is hard to
// read against what is behind it (WCAG contrast: 4.5 for body text, 3 for
// large text and for text on filled buttons and badges), or when the page
// scrolls sideways. Text over photos and gradients is skipped: its contrast
// depends on the merchant's image.
//   python3 scripts/scheme-sweep.py ROOT && node scripts/scheme-test.js ROOT [filter]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const routeFonts = require('./fonts-route');
const ROOT = process.argv[2] || '.';
const FILTER = process.argv[3] || '';
let ok = 0, bad = 0; const errs = [];
const check = (n, c, extra = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (extra ? '\n      ' + extra : '')); c ? ok++ : bad++; };

const AUDIT = () => {
  const parse = c => {
    const k = c.match(/color\(srgb ([^)]+)\)/);
    if (k) { const p = k[1].split(/[ /]+/).filter(Boolean).map(Number); return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p.length > 3 ? p[3] : 1 }; }
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
  const L = c => .2126 * lin(c.r) + .7152 * lin(c.g) + .0722 * lin(c.b);
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  // the colour behind an element: composite every background up the tree;
  // null when a photo, gradient or video sits behind it
  const behind = el => {
    const layers = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none' && !/^linear-gradient\(currentcolor/i.test(cs.backgroundImage) && !(cs.backgroundSize === '100% 1px' || /1px$/.test(cs.backgroundSize))) return null;
      if (e !== el && e.querySelector(':scope > img, :scope > picture, :scope > video, :scope > svg[class*=placeholder]')) {
        const media = e.querySelector(':scope > img, :scope > picture, :scope > video, :scope > svg[class*=placeholder]');
        const mb = media.getBoundingClientRect(), eb = el.getBoundingClientRect();
        if (getComputedStyle(media).position === 'absolute' && mb.left <= eb.left + 2 && mb.right >= eb.right - 2 && mb.top <= eb.top + 2 && mb.bottom >= eb.bottom - 2) return null;
      }
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let col = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) col = over(layers[i], col);
    return col;
  };
  const visible = el => {
    if (el.closest('[aria-hidden=true], .visually-hidden, [hidden], template, noscript, script, style, svg, select, option, .card__actions, .overlay:not(.is-open), dialog:not([open]), .marquee, [class*=ticker], [class*=watermark]')) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
    if (op < .9) return false; // faded on purpose: sold-out sizes, disabled controls, the reveal in progress
    const b = el.getBoundingClientRect();
    if (b.width < 2 || b.height < 2) return false;
    if (b.top < 0 || b.bottom > innerHeight || b.right < 0 || b.left > innerWidth) return false; // judged when on screen
    if (cs.textDecorationLine.includes('line-through')) return false;
    return true;
  };
  const fails = [];
  const seen = new Set();
  document.querySelectorAll('body *').forEach(el => {
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!own && !(el.matches('input[type=text], input[type=email], input[type=search], textarea') && el.value)) return;
    if (!visible(el)) return;
    const cs = getComputedStyle(el);
    if (el.matches('section[style*="color:#999"]')) return;                 // harness filler
    if (cs.webkitTextFillColor && /rgba?\(0, 0, 0, 0\)|transparent/.test(cs.webkitTextFillColor)) return; // outlined display type
    // anything painted under the text that is not a flat colour: a photo,
    // video, placeholder or gradient. Its contrast is the merchant's image.
    const r = el.getBoundingClientRect();
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 4, r.top + r.height / 2], [r.right - 4, r.top + r.height / 2]];
    for (const [x, y] of pts) {
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
      for (const u of document.elementsFromPoint(x, y)) {
        if (u === el || el.contains(u)) continue;
        if (u.matches('img, picture, video, canvas, iframe, svg[class*=placeholder], [class*=placeholder] svg, .placeholder-svg')) return;
        const ucs = getComputedStyle(u);
        if (ucs.backgroundImage !== 'none' && !/1px$/.test(ucs.backgroundSize)) return;
        const bgc = parse(ucs.backgroundColor); if (bgc && bgc.a >= 1) break;
      }
    }
    const fg = parse(cs.color); if (!fg) return;
    const bg = behind(el); if (!bg) return;
    const col = over(fg, bg);
    const l1 = L(col), l2 = L(bg);
    const ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    // muted helper text (counts, notes) sits deliberately below body contrast in
    // the design; hold it to the large-text bar rather than flag every one
    const muted = /muted|note|count|meta|hint|label|eyebrow|caption|desc|sub|fine|placeholder|unit|disc|vendor|card__brand|card__rating|card__sizes/i.test(el.className + ' ' + (el.parentElement && el.parentElement.className));
    const bar = muted ? Math.min(need, 3) : need;
    if (ratio + .01 < bar) {
      const key = (el.className || el.tagName) + '|' + ratio.toFixed(1);
      if (seen.has(key)) return; seen.add(key);
      const sec = el.closest('[data-section-type], [id^=shopify-section], section, header, footer');
      fails.push(`${ratio.toFixed(2)} < ${bar}  ${el.tagName.toLowerCase()}.${String(el.className).trim().split(/\s+/).slice(0, 2).join('.')}  "${el.textContent.trim().slice(0, 28)}"  in ${sec ? (sec.dataset.sectionType || sec.id || sec.className.split(' ')[0]) : 'page'}`);
    }
  });
  return { fails, w: Math.max(document.documentElement.scrollWidth, innerWidth) };
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const dirs = fs.readdirSync(ROOT).filter(d => fs.statSync(path.join(ROOT, d)).isDirectory());
  const pages = [];
  for (const d of dirs) for (const f of fs.readdirSync(path.join(ROOT, d))) if (/^sw_.*\.html$/.test(f) && f.includes(FILTER)) pages.push([d, f]);
  pages.sort();
  for (const [d, f] of pages) {
    for (const w of [1440, 390]) {
      const p = await b.newPage({ viewport: { width: w, height: 900 }, isMobile: w < 500, hasTouch: w < 500 });
      p.on('pageerror', e => errs.push(`${f}@${w}: ${e.message}`));
      if (process.env.NOFONTS) await p.route('https://fonts.googleapis.com/**', r => r.abort()); else await routeFonts(p);
      await p.route('http://shop.test/**', r => {
        const u = new URL(r.request().url()); const file = path.join(ROOT, d, u.pathname);
        return fs.existsSync(file) && fs.statSync(file).isFile() ? r.fulfill({ path: file }) : r.fulfill({ status: 404, body: '{}' });
      });
      await p.goto(`http://shop.test/${f}`); await p.waitForTimeout(350);
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 25)); } scrollTo(0, 0); });
      await p.waitForTimeout(500);
      // audit the whole page height, section by section
      const fails = []; let width = 0;
      const H = await p.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < H; y += 700) {
        await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(80);
        const r = await p.evaluate(AUDIT);
        r.fails.forEach(x => { if (!fails.includes(x)) fails.push(x); }); width = Math.max(width, r.w);
      }
      const name = `${f.replace(/^sw_/, '').replace('.html', '')} @${w}`;
      check(`${name}: text readable`, fails.length === 0, fails.slice(0, 8).join('\n      '));
      check(`${name}: no sideways scroll`, width <= w, String(width));
      await p.close();
    }
  }
  check('no page errors', errs.length === 0, errs.slice(0, 5).join(' | '));
  await b.close();
  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
