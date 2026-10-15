// Maison homepage vs Claude Design's file, section by section, at 390 / 1024 / 1440.
//  - photos: every image request answers a transparent pixel, so both pages
//    show the design's toned placeholders and only layout and type are compared
//  - product cards are hidden on both sides: the store's own card is used by
//    instruction, and is tested in its own suite
//  - moving parts are held still: ticker, countdown digits, clock
// Writes OUT/h2/cmp_<section>_<width>.png (design | ours | difference) and
// prints the share of differing pixels per section; fails above LIMIT.
//   MN_EMPTY=1 python3 scripts/home-check.py OUT/hm_empty index.maison && node scripts/home2-compare.js OUT [width] [section]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const routeFonts = require('./fonts-route');
const ROOT = process.argv[2] || '.';
const WIDTHS = process.argv[3] ? [Number(process.argv[3])] : [1440, 1024, 390];
const ONLY = process.argv[4] || '';
const LIMIT = Number(process.env.LIMIT || 1.5); // % of pixels
// phone emulation rasterises text edges a little differently on the two pages
const limitFor = (name, w) => Math.max(w < 500 ? 2.5 : LIMIT, EXPECT[name] || 0);
// known, intended differences in copy: the lookbook captions describe the
// default photos (the design's captions describe its placeholders), and are
// shorter, so the strip is one caption line lower
const EXPECT = { lookbook: 3 };
const DESIGN = path.join(__dirname, '..', 'docs', 'claude_design_ref_home2');
const OUT = path.join(ROOT, 'h2'); fs.mkdirSync(OUT, { recursive: true });
const PNG1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const HOLD = `
  .tk__track,.mh-tk__track{animation:none!important}
  .ld__num,.mh-ld__num{visibility:hidden!important}
  .pc,.card{visibility:hidden!important;height:var(--mh-stand)!important;min-height:0!important;overflow:hidden!important}
  .na__grid,.mh-na__grid,.bs__rail,.mh-bs__rail{--mh-stand:560px}
  .sl__list,.mh-sl__list{--mh-stand:138px}
  @media (max-width:720px){.na__grid,.mh-na__grid{--mh-stand:330px}.bs__rail,.mh-bs__rail{--mh-stand:470px}}
  .sl__spot::before,.mh-sl__spot::before{animation:none!important;opacity:0!important}
  *{caret-color:transparent!important}
  img{visibility:hidden!important}`;
let ok = 0, bad = 0;
const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); c ? ok++ : bad++; };

async function shots(b, side, w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 500, hasTouch: w < 500, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.addInitScript(() => { const t0 = Date.parse('2026-10-15T12:00:00Z'), real = Date.now(); const N = Date.now; Date.now = () => t0 + (N() - real); });
  await routeFonts(p);
  await p.route(/^https:\/\/(images\.unsplash\.com|cdn\.shopify\.com)\//, r => r.fulfill({ contentType: 'image/png', body: PNG1 }));
  await p.route('http://d.test/**', r => { const f = path.join(DESIGN, decodeURIComponent(new URL(r.request().url()).pathname)); return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' }); });
  await p.route('http://shop.test/**', r => { const f = path.join(ROOT, 'hm_empty', new URL(r.request().url()).pathname); return fs.existsSync(f) && fs.statSync(f).isFile() ? r.fulfill({ path: f }) : r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }); });
  await p.goto(side === 'design' ? 'http://d.test/index.html' : 'http://shop.test/hm_maison.html');
  await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: HOLD });
  // design: drop its placeholder header so sections start at the same place
  if (side === 'design') await p.addStyleTag({ content: 'header.hd,footer.ft,.skip{display:none!important}' });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); });
  await p.evaluate(() => document.querySelectorAll('.rv,.mh-reveal').forEach(e => e.classList.add('is-in')));
  await p.waitForTimeout(1300);
  const secs = await p.evaluate(sel => [...document.querySelectorAll(sel)].map(e => { const r = e.getBoundingClientRect(); return { name: e.dataset.section || e.dataset.mh, y: r.top + scrollY, h: r.height }; }),
    side === 'design' ? 'main > section[data-section]' : 'section.mh[data-mh]');
  const out = {};
  for (const s of secs) {
    if (ONLY && s.name !== ONLY) continue;
    const f = path.join(OUT, `${side}_${s.name}_${w}.png`);
    await p.screenshot({ path: f, fullPage: true, clip: { x: 0, y: s.y, width: w, height: Math.max(1, Math.min(s.h, 4000)) } });
    out[s.name] = { f, h: Math.round(s.h) };
  }
  await ctx.close();
  return out;
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const v = await b.newPage();
  for (const w of WIDTHS) {
    const d = await shots(b, 'design', w), o = await shots(b, 'ours', w);
    for (const name of Object.keys(d)) {
      if (!o[name]) { check(`${name} @${w}: present`, false); continue; }
      const img = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
      const r = await v.evaluate(async ([a, c]) => {
        const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = src; });
        const A = await load(a), C = await load(c);
        const W = Math.max(A.width, C.width), H = Math.max(A.height, C.height);
        const cv = n => { const x = document.createElement('canvas'); x.width = W; x.height = H; const g = x.getContext('2d'); g.fillStyle = '#ff00ff'; g.fillRect(0, 0, W, H); g.drawImage(n, 0, 0); return g.getImageData(0, 0, W, H); };
        const da = cv(A), dc = cv(C), out = new ImageData(W, H);
        // sections sit at slightly different sub-pixel positions on the two
        // pages; compare at the best vertical shift within 2px
        const count = dy => { let n = 0; for (let y = 0; y < H; y += 2) { const yc = y + dy; if (yc < 0 || yc >= H) continue; for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4, j = (yc * W + x) * 4; if (Math.max(Math.abs(da.data[i] - dc.data[j]), Math.abs(da.data[i + 1] - dc.data[j + 1]), Math.abs(da.data[i + 2] - dc.data[j + 2])) > 40) n++; } } return n; };
        let best = 0, bn = Infinity; for (const dy of [0, -1, 1, -2, 2]) { const n = count(dy); if (n < bn) { bn = n; best = dy; } }
        let diff = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4, yc = Math.min(H - 1, Math.max(0, y + best)), j = (yc * W + x) * 4;
          const near = (xx, yy) => { if (xx < 0 || yy < 0 || xx >= W || yy >= H) return false; const k = (yy * W + xx) * 4; return Math.max(Math.abs(da.data[i] - dc.data[k]), Math.abs(da.data[i + 1] - dc.data[k + 1]), Math.abs(da.data[i + 2] - dc.data[k + 2])) <= 40; };
          let m = Math.max(Math.abs(da.data[i] - dc.data[j]), Math.abs(da.data[i + 1] - dc.data[j + 1]), Math.abs(da.data[i + 2] - dc.data[j + 2]));
          // anti-aliasing: a pixel that matches one within 1px on the other side is the same edge
          if (m > 40 && (near(x - 1, yc) || near(x + 1, yc) || near(x, yc - 1) || near(x, yc + 1) || near(x - 1, yc - 1) || near(x + 1, yc + 1) || near(x - 1, yc + 1) || near(x + 1, yc - 1))) m = 0;
          if (m > 40) { diff++; out.data[i] = 230; out.data[i + 1] = 20; out.data[i + 2] = 60; out.data[i + 3] = 255; }
          else { const g = (da.data[i] + da.data[i + 1] + da.data[i + 2]) / 3; out.data[i] = out.data[i + 1] = out.data[i + 2] = 255 - (255 - g) * .25; out.data[i + 3] = 255; }
        }
        const x = document.createElement('canvas'); x.width = W; x.height = H; x.getContext('2d').putImageData(out, 0, 0);
        return { pct: diff / (W * H) * 100, diff: x.toDataURL(), W, H, ha: A.height, hc: C.height };
      }, [img(d[name].f), img(o[name].f)]);
      // design | ours | difference
      await v.setViewportSize({ width: 1200, height: 800 });
      await v.setContent(`<body style="margin:0;background:#777;display:flex;gap:10px;align-items:flex-start;font:12px sans-serif;color:#fff">
        <figure style="margin:0;flex:1"><figcaption>Design</figcaption><img src="${img(d[name].f)}" style="width:100%"></figure>
        <figure style="margin:0;flex:1"><figcaption>Theme</figcaption><img src="${img(o[name].f)}" style="width:100%"></figure>
        <figure style="margin:0;flex:1"><figcaption>Differences ${r.pct.toFixed(2)}%</figcaption><img src="${r.diff}" style="width:100%"></figure></body>`);
      await v.waitForTimeout(100);
      await v.screenshot({ path: path.join(OUT, `cmp_${name}_${w}.png`), fullPage: true });
      check(`${name} @${w}: ${r.pct.toFixed(2)}% of pixels differ`, r.pct <= limitFor(name, w), `height design ${r.ha} / theme ${r.hc}`);
    }
  }
  await b.close();
  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
