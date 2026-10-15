// D8b: the reference (docs/claude_design_ref/Product Page.html, its own
// defaults) next to the theme's product page in the same configuration
// (scripts/d8b-check.py), at 390 / 1024 / 1440.
//  1. side-by-side screenshots per region: header, product top, details,
//     footer, cart drawer  ->  OUT/d8b/cmp_<region>_<width>.png
//  2. computed-style diff of every element class both pages share (type,
//     colour, spacing, size, radius)  ->  OUT/d8b/diff_<width>.txt
//   node scripts/d8b-compare.js OUT [onlyWidth]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const routeFonts = require('./fonts-route'), serve = require('./pdp-serve');
const REF = path.join(__dirname, '..', 'docs', 'claude_design_ref');
const OUT = path.join(process.argv[2] || '.', 'd8b');
const WIDTHS = process.argv[3] ? [Number(process.argv[3])] : [1440, 1024, 390];
const PROPS = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'textTransform', 'color', 'backgroundColor',
  'borderTopWidth', 'borderTopColor', 'borderRadius', 'paddingTop', 'paddingLeft', 'height', 'width', 'gap'];
// sections the theme builds separately (tested in their own suites) and the
// demo-only settings panel
const SKIP = /^(look|look-item|card|row-cards|banner-sec|section|review|rv-|tpanel|toast|express|ph-cap)/;

async function open(b, side, w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 500, hasTouch: w < 500, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await routeFonts(p);
  await p.route('https://images.unsplash.com/**', r => r.abort());
  await p.route('http://ref.test/**', r => { const f = path.join(REF, decodeURIComponent(new URL(r.request().url()).pathname)); return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' }); });
  await p.route('http://shop.test/**', serve(OUT, []));
  await p.goto(side === 'ref' ? 'http://ref.test/Product%20Page.html?panel=0' : 'http://shop.test/ours.html');
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
  // stop the ticker and countdown from making the two shots differ by time
  await p.addStyleTag({ content: '.announce__track,.announce *{animation-play-state:paused!important} *{caret-color:transparent!important} .tpanel,.lxp{display:none!important}' });
  return [p, ctx];
}

const styles = (p, props) => p.evaluate(props => {
  const out = {};
  document.querySelectorAll('body *').forEach(e => {
    if (typeof e.className !== 'string') return;
    const cls = e.className.split(/\s+/).filter(Boolean)[0]; if (!cls) return;
    // keyed by the region the element sits in, so a dropdown in the sticky bar
    // is never compared with one in the footer
    const land = e.parentElement && e.parentElement.closest('.sticky-atc,.site-footer,.site-header,.announce,.gallery,.product__info,.details-left,.details-below,.overlay,.cmp-tray,.breadcrumb,.mdrawer,.card,.cart-notify');
    const k = (land ? land.className.split(/\s+/)[0] + ' ' : '') + e.tagName.toLowerCase() + '.' + cls; if (out[k]) return;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (e.closest('[hidden], .overlay:not(.is-open), dialog:not([open])')) return;
    const cs = getComputedStyle(e); const o = {};
    props.forEach(x => { o[x] = x === 'height' ? Math.round(r.height) + 'px' : x === 'width' ? Math.round(r.width) + 'px' : cs[x]; });
    out[k] = o;
  });
  return out;
}, props);

async function regions(p) {
  return p.evaluate(() => {
    const top = el => el ? el.getBoundingClientRect().top + scrollY : null;
    const hd = document.querySelector('.site-header'), hb = hd.getBoundingClientRect().bottom + scrollY;
    const det = document.querySelector('.details-left, .details-below, .pdp-details, [data-details]');
    const ft = document.querySelector('.site-footer');
    return { header: [0, hb], product: [hb, hb + 1000], details: det ? [top(det) - 20, top(det) + 760] : null, footer: ft ? [top(ft), top(ft) + ft.offsetHeight] : null };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const w of WIDTHS) {
    const shots = {}, st = {};
    for (const side of ['ref', 'ours']) {
      const [p, ctx] = await open(b, side, w);
      st[side] = await styles(p, PROPS);
      await p.addStyleTag({ content: '.sticky-atc,.cmp-tray{visibility:hidden!important}' });
      const R = await regions(p);
      for (const [name, rg] of Object.entries(R)) {
        if (!rg) continue;
        const h = Math.min(rg[1] - rg[0], 2400);
        const f = path.join(OUT, `${side}_${name}_${w}.png`);
        await p.screenshot({ path: f, fullPage: true, clip: { x: 0, y: Math.max(0, rg[0]), width: w, height: h } });
        (shots[name] = shots[name] || {})[side] = f;
      }
      await p.addStyleTag({ content: '.sticky-atc,.cmp-tray{visibility:visible!important}' });
      // cart drawer: the same flow on both, tick the terms, add to bag
      const terms = await p.$('.pi-terms input, .terms input, [data-terms]');
      if (terms) await terms.check({ force: true }).catch(() => {});
      await p.evaluate(() => scrollTo(0, 0));
      const atc = await p.$('#mainAtc, [data-atc][data-main], .atc');
      if (atc) { await atc.click({ force: true }).catch(() => {}); await p.waitForTimeout(1600); }
      const f = path.join(OUT, `${side}_drawer_${w}.png`);
      await p.screenshot({ path: f });
      (shots.drawer = shots.drawer || {})[side] = f;
      Object.assign(st[side], Object.fromEntries(Object.entries(await styles(p, PROPS)).filter(([k]) => /cart|drawer|ship-progress|stepper/.test(k)).map(([k, v]) => ['drawer:' + k, v])));
      await ctx.close();
    }
    // side by side
    const v = await b.newPage({ viewport: { width: 1200, height: 800 } });
    for (const [name, s] of Object.entries(shots)) {
      if (!s.ref || !s.ours) continue;
      const img = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
      await v.setContent(`<body style="margin:0;display:flex;gap:16px;background:#888;align-items:flex-start;font:12px sans-serif">
        <figure style="margin:0;flex:1"><figcaption style="color:#fff;padding:4px">Reference</figcaption><img src="${img(s.ref)}" style="width:100%"></figure>
        <figure style="margin:0;flex:1"><figcaption style="color:#fff;padding:4px">Theme</figcaption><img src="${img(s.ours)}" style="width:100%"></figure></body>`);
      await v.waitForTimeout(150);
      await v.screenshot({ path: path.join(OUT, `cmp_${name}_${w}.png`), fullPage: true });
    }
    await v.close();
    // style diff
    const lines = [];
    const px = s => parseFloat(s);
    for (const k of Object.keys(st.ref).sort()) {
      const cls = k.replace(/^drawer:/, '').split(' ').pop().split('.')[1] || '';
      if (!st.ours[k] || SKIP.test(cls)) continue;
      const a = st.ref[k], o = st.ours[k], d = [];
      for (const x of PROPS) {
        if (a[x] === o[x]) continue;
        if (/px$/.test(a[x]) && /px$/.test(o[x]) && Math.abs(px(a[x]) - px(o[x])) <= (x === 'width' || x === 'height' ? Math.max(2, px(a[x]) * .04) : .6)) continue;
        if (x === 'fontFamily' && a[x].split(',')[0].replace(/"/g, '') === o[x].split(',')[0].replace(/"/g, '')) continue;
        d.push(`${x}: ${a[x]} -> ${o[x]}`);
      }
      if (d.length) lines.push(`${k}\n    ${d.join('\n    ')}`);
    }
    fs.writeFileSync(path.join(OUT, `diff_${w}.txt`), lines.join('\n'));
    console.log(`${w}: ${Object.keys(shots).length} regions, ${lines.length} shared elements differ -> d8b/diff_${w}.txt`);
  }
  await b.close();
})();
