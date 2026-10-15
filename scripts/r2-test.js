// R2 review fixes: homepage product cards and the Layouts button.
//  - stocked store: every homepage card is a real product (no demo pieces,
//    no links to the whole catalogue)
//  - empty store: demo cards come from the one shared catalogue, so each
//    name always shows its own photo and links to a search for that piece
//  - Layouts button: right-edge tab on desktop; on phones a small pill in the
//    bottom corner that clears the sticky add-to-bag bar; hiding it is
//    remembered, ?layouts=1 brings it back
//   MN_EMPTY=1 python3 scripts/home-check.py OUT/hm_empty
//   python3 scripts/explorer-check.py OUT && node scripts/r2-test.js OUT
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || '.';
let ok = 0, bad = 0; const errs = [];
const check = (n, c, extra = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (extra ? '  ' + extra : '')); c ? ok++ : bad++; };

// the catalogue as the snippet declares it
const card = fs.readFileSync('snippets/product-card.liquid', 'utf8');
const list = id => card.match(new RegExp(`assign ${id}\\s*= '([^']*)'`))[1].split('~');
const TITLES = list('dc_titles'), PHOTOS = list('dc_photos');

const cards = html => [...html.matchAll(/<article class="card product-card[\s\S]*?<\/article>/g)].map(m => {
  const a = m[0];
  return { title: (a.match(/card__title"><a href="[^"]*">([^<]*)</) || [])[1], href: (a.match(/card__title"><a href="([^"]*)"/) || [])[1],
           photo: (a.match(/images\.unsplash\.com\/photo-([0-9a-f-]+)/) || [])[1] };
});

(async () => {
  // ---- cards, from the rendered homepages
  const homes = d => fs.readdirSync(path.join(ROOT, d)).filter(f => /^hm_(?!lxp).*\.html$/.test(f));
  let real = [], demo = [];
  for (const f of homes('hm')) real.push(...cards(fs.readFileSync(path.join(ROOT, 'hm', f), 'utf8')).map(c => ({ ...c, f })));
  for (const f of homes('hm_empty')) demo.push(...cards(fs.readFileSync(path.join(ROOT, 'hm_empty', f), 'utf8')).map(c => ({ ...c, f })));
  check(`stocked store: ${real.length} homepage cards, all real products`, real.length > 40 && real.every(c => /^\/products\//.test(c.href) && !c.photo), real.filter(c => !/^\/products\//.test(c.href)).slice(0, 3).map(c => c.f + ':' + c.title).join(' '));
  check(`empty store: ${demo.length} demo cards`, demo.length > 40);
  const wrong = demo.filter(c => { const i = TITLES.indexOf(c.title); return i < 0 || PHOTOS[i] !== c.photo; });
  check('every demo name shows its own photo', wrong.length === 0, wrong.slice(0, 3).map(c => `${c.f}: ${c.title} / ${c.photo}`).join(' | '));
  const links = demo.filter(c => c.href !== '/search?type=product&q=' + encodeURIComponent(c.title).replace(/%20/g, '+'));
  check('every demo card links to a search for that piece', links.length === 0, links.slice(0, 3).map(c => c.title + ' -> ' + c.href).join(' | '));
  const allLinks = [...real, ...demo].filter(c => /collections\/all/.test(c.href || ''));
  check('no card links to the whole catalogue', allLinks.length === 0, String(allLinks.length));

  // ---- Layouts button
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const open = async (dir, page, w, ctxOpts = {}) => {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, isMobile: w < 500, hasTouch: w < 500, ...ctxOpts });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(`${page}@${w}: ${e.message}`));
    await p.route('https://**', r => r.abort());
    await p.route('http://shop.test/**', r => {
      const f = path.join(ROOT, dir, new URL(r.request().url()).pathname);
      return fs.existsSync(f) && fs.statSync(f).isFile() ? r.fulfill({ path: f }) : r.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    });
    await p.goto(`http://shop.test/${page}.html`); await p.waitForTimeout(500);
    return [p, ctx];
  };
  const box = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e || e.closest('[hidden]')) return null; const r = e.getBoundingClientRect(); return r.width ? { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom } : null; }, sel);

  let [p, ctx] = await open('hm', 'hm_lxp', 1440);
  let d = await box(p, '[data-lxp-dock]');
  check('desktop: tab on the right edge, mid-height', d && d.r >= 1439 && Math.abs(d.y + d.h / 2 - 450) < 4, JSON.stringify(d));
  await p.click('[data-lxp-toggle]'); await p.waitForTimeout(450);
  check('desktop: tab opens the panel', await p.evaluate(() => !document.getElementById('lxp-panel').hidden && document.querySelector('[data-lxp]').dataset.open === 'true'));
  await ctx.close();

  [p, ctx] = await open('t_pdp', 'pdp_lxp', 390);
  d = await box(p, '[data-lxp-dock]');
  check('phone: a small pill in the bottom-left corner', d && d.x <= 14 && d.b >= 844 - 16 && d.b <= 844 && d.h <= 32 && d.w <= 130, JSON.stringify(d));
  await p.evaluate(() => scrollTo({ top: 2600, behavior: 'instant' })); await p.waitForTimeout(1000);
  const bar = await box(p, '.sticky-atc.is-visible');
  d = await box(p, '[data-lxp-dock]');
  check('phone: pill sits above the sticky add-to-bag bar', !!bar && d && d.b <= bar.y + 1, JSON.stringify({ d, bar }));
  await p.click('[data-lxp-hide]'); await p.waitForTimeout(150);
  check('phone: hide removes the button', !(await box(p, '[data-lxp-dock]')));
  await p.reload(); await p.waitForTimeout(500);
  check('hidden stays hidden after a reload', !(await box(p, '[data-lxp-dock]')));
  await p.goto('http://shop.test/pdp_lxp.html?layouts=1'); await p.waitForTimeout(500);
  check('?layouts=1 brings it back', !!(await box(p, '[data-lxp-dock]')));
  await ctx.close();

  check('no page errors', errs.length === 0, errs.slice(0, 4).join(' | '));
  await b.close();
  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
