// Product card (design build) with every Product cards setting that changes
// its look, the compare tray and table, and the wishlist drawer. Pages come
// from scripts/card-check.py and are served from a fake origin, so
// /products/<handle>?view=mn-data and /cart/add.js can be answered.
//   python3 scripts/card-check.py OUT && node scripts/card-test.js OUT
const { chromium } = require('playwright');
const routeFonts = require('./fonts-route');
const fs = require('fs'), path = require('path');
const dir = process.argv[2] || '.';
const ORIGIN = 'http://shop.test';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let ok = 0, bad = 0; const errs = [];
  const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); c ? ok++ : bad++; };
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const calls = [];
  const serve = async r => {
    const u = new URL(r.request().url());
    if (u.pathname === '/cart/add.js') { calls.push(JSON.parse(r.request().postData() || '{}')); return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ items: [] }) }); }
    if (u.pathname.startsWith('/products/') && u.searchParams.get('view') === 'mn-data') {
      const f = path.join(dir, 'data', u.pathname.split('/').pop() + '.json');
      return fs.existsSync(f) ? r.fulfill({ contentType: 'text/html', body: fs.readFileSync(f) }) : r.fulfill({ status: 404, body: '' });
    }
    const f = path.join(dir, u.pathname);
    return fs.existsSync(f) && fs.statSync(f).isFile() ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
  };
  const open = async (f, opts = {}) => {
    const c = opts.ctx || ctx;
    const p = await c.newPage();
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    if (process.env.NOFONTS) await p.route('https://fonts.googleapis.com/**', r => r.abort()); else await routeFonts(p);
    await p.route(ORIGIN + '/**', serve);
    await p.goto(`${ORIGIN}/${f}.html`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
    return p;
  };
  const card = (p, h) => `.card[data-handle="${h}"]`;

  // ---- What each card shows
  let p = await open('cd_default');
  const info = await p.evaluate(() => [...document.querySelectorAll('.card')].map(c => ({
    h: c.dataset.handle, badges: [...c.querySelectorAll('.card__badges .badge')].map(x => x.textContent.trim()),
    brand: c.querySelector('.card__brand')?.textContent, rating: c.querySelector('.card__rating')?.textContent.trim(),
    price: c.querySelector('.price__now')?.textContent, was: c.querySelector('.price__was')?.textContent.replace('Was', '').trim(), off: c.querySelector('.price .badge--sale')?.textContent,
    sw: c.querySelectorAll('.card__swatch').length, more: c.querySelector('.card__more')?.textContent,
    sizes: [...c.querySelectorAll('.card__sizes > *')].map(x => (x.tagName === 'S' ? '~' : '') + x.textContent).join(' '),
    add: c.querySelector('.card__add')?.textContent.trim(), addVariant: !!c.querySelector('.card__add[data-variant-id]'), addQv: !!c.querySelector('.card__add[data-open-quickview]'),
    sold: c.classList.contains('is-soldout'), acts: c.querySelectorAll('.card__actions .icon-btn').length })));
  const by = Object.fromEntries(info.map(x => [x.h, x]));
  check('six cards render in the design markup', info.length === 6 && info.every(x => x.acts === 3), info.map(x => x.h + ':' + x.acts).join(','));
  const s = by['slip-dress'];
  check('sale card: New + Sale badges, price, struck was, −21%', s.badges.join('|') === 'New|Sale −21%' && s.price === '$890' && s.was === '$1,120' && s.off === '−21%', JSON.stringify(s));
  check('meta row: brand + rating with count', s.brand === 'Maison Noir' && s.rating === '4.8(191)', s.rating);
  check('swatches and sizes, sold-out size struck', s.sw === 3 && s.sizes === 'XS S M L ~XL', s.sizes);
  check('many colours: four swatches and "+2"', by['shoulder-bag'].sw === 4 && by['shoulder-bag'].more === '+2');
  check('one variant adds at once; several open quick view', by['silk-scarf'].addVariant && s.addQv && !s.addVariant);
  check('sold out: badge, greyed card, disabled button', by['wrap-coat'].sold && by['wrap-coat'].badges.includes('Sold Out') && by['wrap-coat'].add === 'Sold Out' && await p.evaluate(() => document.querySelector('.card.is-soldout .card__add').getAttribute('aria-disabled') === 'true'), JSON.stringify(by['wrap-coat']));
  check('sold-out button stays hidden until hover, like the others', await p.evaluate(() => +getComputedStyle(document.querySelector('.card.is-soldout .card__add')).opacity === 0));
  check('empty compare tray is hidden and out of the tab order', await p.evaluate(() => getComputedStyle(document.getElementById('cmpTray')).visibility === 'hidden'));
  check('tracked stock under the threshold: Low stock badge', by['hoops'].badges.includes('Low stock'), by['hoops'].badges.join());
  await p.screenshot({ path: path.join(dir, 's_default_1440.png') });

  // ---- Hover: second image, actions, add button; a card with one image keeps it
  await p.hover(card(p, 'slip-dress') + ' .card__media'); await p.waitForTimeout(700);
  const hv = await p.evaluate(() => { const c = document.querySelector('.card[data-handle="slip-dress"]'); const o = s => +getComputedStyle(c.querySelector(s)).opacity; return { a: o('.card__img--a'), b: o('.card__img--b'), act: o('.card__actions .icon-btn'), add: o('.card__add') }; });
  check('hover: second image fades in, actions and add appear', hv.a === 0 && hv.b === 1 && hv.act === 1 && hv.add === 1, JSON.stringify(hv));
  await p.screenshot({ path: path.join(dir, 's_hover_1440.png'), clip: { x: 0, y: 0, width: 760, height: 700 } });
  await p.hover(card(p, 'silk-scarf') + ' .card__media'); await p.waitForTimeout(700);
  check('hover on a card with one image keeps the image', await p.evaluate(() => +getComputedStyle(document.querySelector('.card[data-handle="silk-scarf"] .card__img--a')).opacity === 1));

  // ---- Swatch: click picks the colour image and points links at the variant
  const before = await p.evaluate(() => document.querySelector('.card[data-handle="slip-dress"] .card__img--a img').getAttribute('src'));
  await p.click(card(p, 'slip-dress') + ' .card__swatch >> nth=2'); await p.waitForTimeout(150);
  const sw = await p.evaluate(() => { const c = document.querySelector('.card[data-handle="slip-dress"]'); return { src: c.querySelector('.card__img--a img').getAttribute('src'), href: c.querySelector('.card__title a').getAttribute('href'), pressed: c.querySelectorAll('.card__swatch')[2].getAttribute('aria-pressed') }; });
  check('swatch click: image changes, links carry ?variant=, swatch pressed', sw.src !== before && /\?variant=\d+/.test(sw.href) && sw.pressed === 'true', JSON.stringify({ href: sw.href, pressed: sw.pressed }));

  // ---- Add to bag from a one-variant card
  await p.hover(card(p, 'silk-scarf') + ' .card__media'); await p.waitForTimeout(400);
  await p.click(card(p, 'silk-scarf') + ' .card__add'); await p.waitForTimeout(400);
  check('add to bag posts that variant to /cart/add.js', calls.length === 1 && calls[0].items[0].quantity === 1 && calls[0].items[0].id > 0, JSON.stringify(calls));

  // ---- Wishlist: heart, count, drawer, remove
  await p.hover(card(p, 'slip-dress') + ' .card__media');
  await p.click(card(p, 'slip-dress') + ' .card__wish'); await p.waitForTimeout(200);
  await p.hover(card(p, 'hoops') + ' .card__media');
  await p.click(card(p, 'hoops') + ' .card__wish'); await p.waitForTimeout(200);
  const wc = await p.evaluate(() => ({ pressed: document.querySelector('.card[data-handle="slip-dress"] .card__wish').getAttribute('aria-pressed'), count: document.getElementById('wishCount').textContent }));
  check('heart: pressed, count 2', wc.pressed === 'true' && wc.count === '2', JSON.stringify(wc));
  await p.click('#wishBtn'); await p.waitForTimeout(800);
  const wd = await p.evaluate(() => ({ open: document.getElementById('ov-wish').classList.contains('is-open'), title: document.getElementById('wishTitle').textContent, lines: [...document.querySelectorAll('#wishBody .wish-line .cart-line__title')].map(x => x.textContent), buy: [...document.querySelectorAll('#wishBody .wish-line .mn-btn')].map(x => x.textContent) }));
  check('wishlist drawer lists the saved pieces with the right buy button', wd.open && wd.title === 'Wishlist (2)' && wd.lines.join('|') === 'Washed Silk Slip Dress|Gold Vermeil Hoops' && wd.buy.join('|') === 'Choose options|Choose options', JSON.stringify(wd));
  await p.screenshot({ path: path.join(dir, 's_wish_1440.png') });
  await p.click('#wishBody .wish-line >> nth=0 >> [data-wishlist-id]'); await p.waitForTimeout(700);
  check('remove in the drawer: list and title update, card heart released', await p.evaluate(() => document.querySelectorAll('#wishBody .wish-line').length === 1 && document.getElementById('wishTitle').textContent === 'Wishlist (1)' && document.querySelector('.card[data-handle="slip-dress"] .card__wish').getAttribute('aria-pressed') === 'false'));
  await p.click('#wishBody .wish-line >> nth=0 >> [data-wishlist-id]'); await p.waitForTimeout(700);
  check('empty wishlist: message and browse link', await p.evaluate(() => /Nothing saved yet/.test(document.querySelector('#wishBody .mn-cart-empty p')?.textContent || '') && document.getElementById('wishCount').textContent === ''));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);

  // ---- Compare: tray, table, differences, max four, remove, clear, persistence
  for (const h of ['slip-dress', 'silk-scarf', 'wrap-coat']) { await p.hover(card(p, h) + ' .card__media'); await p.click(card(p, h) + ' .card__cmp'); await p.waitForTimeout(250); }
  await p.waitForTimeout(400);
  const tr = await p.evaluate(() => ({ vis: document.getElementById('cmpTray').classList.contains('is-visible'), filled: document.querySelectorAll('#cmpTray .cmp-slot.is-filled').length, slots: document.querySelectorAll('#cmpTray .cmp-slot').length, n: document.querySelector('[data-cmp-count]').textContent, pressed: document.querySelectorAll('.card__cmp[aria-pressed="true"]').length }));
  check('compare: tray shows three filled of four slots, count 3, buttons pressed', tr.vis && tr.filled === 3 && tr.slots === 4 && tr.n === '3' && tr.pressed === 3, JSON.stringify(tr));
  await p.click('#cmpTray [data-open="ov-cmpp"]'); await p.waitForTimeout(900);
  const tb = await p.evaluate(() => ({ cols: document.querySelectorAll('#cmppBody .cmpt__prod').length, rows: [...document.querySelectorAll('#cmppBody tbody tr th')].map(x => x.textContent).filter(Boolean), slot: !!document.querySelector('#cmppBody .cmpt__slot'), sug: document.querySelectorAll('#cmppBody .cmpt__sug-item').length, buy: [...document.querySelectorAll('#cmppBody [data-cmp-add], #cmppBody .cmpt a.mn-btn, #cmppBody [aria-disabled]')].map(x => x.textContent) }));
  check('table: three pieces, the rows they have, an add slot with suggestions', tb.cols === 3 && tb.rows.join('|') === 'Price|Rating|Material|Origin|Care|Colours|Sizes|Availability' && tb.slot && tb.sug === 3, JSON.stringify(tb));
  check('table buy row: add / choose / sold out', tb.buy.join('|') === 'Choose options|Add to bag|Sold out', tb.buy.join('|'));
  await p.click('#cmppBody [data-cmp-diff]'); await p.waitForTimeout(300);
  check('highlight differences marks rows that differ', await p.evaluate(() => [...document.querySelectorAll('#cmppBody tr.is-diff th')].map(x => x.textContent).join('|')) === 'Material|Availability');
  await p.screenshot({ path: path.join(dir, 's_compare_1440.png') });
  await p.click('#cmppBody .cmpt__sug-item >> nth=0'); await p.waitForTimeout(700);
  check('a suggestion joins the table (4 of 4, no add slot)', await p.evaluate(() => document.querySelectorAll('#cmppBody .cmpt__prod').length === 4 && !document.querySelector('#cmppBody .cmpt__slot')));
  await p.evaluate(() => window.MN.compare.toggle('cardigan')); await p.waitForTimeout(200);
  check('a fifth piece is refused with a toast', await p.evaluate(() => /up to 4/.test(document.querySelector('#mnToast')?.textContent || '') && window.MN.compare.ids.length === 4));
  await p.click('#cmppBody [data-cmp-remove] >> nth=0'); await p.waitForTimeout(700);
  check('remove in the table: 3 left, tray follows', await p.evaluate(() => document.querySelectorAll('#cmppBody .cmpt__prod').length === 3 && document.querySelectorAll('#cmpTray .cmp-slot.is-filled').length === 3));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(800);
  check('compare survives a page load', await p.evaluate(() => document.getElementById('cmpTray').classList.contains('is-visible') && document.querySelectorAll('#cmpTray .cmp-slot.is-filled').length === 3));
  await p.evaluate(() => { const c = document.querySelector('.card[data-handle="slip-dress"]').cloneNode(true); c.querySelector('.card__cmp').setAttribute('aria-pressed', 'false'); c.id = 'late'; document.querySelector('.product-grid').appendChild(c); });
  await p.waitForTimeout(100);
  check('a card added later shows its compare state', await p.evaluate(() => document.querySelector('#late .card__cmp').getAttribute('aria-pressed') === String(window.MN.compare.ids.includes('slip-dress'))));
  await p.evaluate(() => document.getElementById('late').remove());
  await p.click('#cmpTray [data-cmp-clear]'); await p.waitForTimeout(300);
  check('clear empties and hides the tray', await p.evaluate(() => !document.getElementById('cmpTray').classList.contains('is-visible') && window.MN.compare.ids.length === 0));
  await p.close();

  // ---- Styles
  p = await open('cd_styles');
  const st = await p.evaluate(() => Object.fromEntries(['minimal', 'overlay', 'bordered', 'plaque'].map(k => { const c = document.querySelector(`.card[data-style=${k}]`); const bdy = c.querySelector('.card__body'); const cs = getComputedStyle(c), bs = getComputedStyle(bdy);
    return [k, { meta: c.querySelector('.card__meta') ? getComputedStyle(c.querySelector('.card__meta')).display : '-', pos: bs.position, border: cs.borderTopWidth, bodyBg: bs.backgroundColor, color: bs.color }]; })));
  check('minimal: name and price only', st.minimal.meta === 'none', JSON.stringify(st.minimal));
  check('editorial: info over the image in white', st.overlay.pos === 'absolute' && st.overlay.color === 'rgb(255, 255, 255)', JSON.stringify(st.overlay));
  check('bordered: framed', st.bordered.border === '1px', JSON.stringify(st.bordered));
  check('plaque: info on a raised panel', st.plaque.bodyBg !== 'rgba(0, 0, 0, 0)', JSON.stringify(st.plaque));
  await p.screenshot({ path: path.join(dir, 's_styles_1440.png'), fullPage: true });
  await p.close();

  // ---- Alignment, title font, ratio, radius, number, category, material, zoom, always visible, carousel, facts off
  p = await open('cd_variants');
  const va = await p.evaluate(() => { const g = [...document.querySelectorAll('.product-grid')]; const c1 = g[0].querySelector('.card'), c2 = g[1].querySelector('.card'), c3 = g[2].querySelector('.card');
    const r = el => el.getBoundingClientRect();
    return { align: getComputedStyle(c1.querySelector('.card__body')).textAlign, font: getComputedStyle(c1.querySelector('.card__title')).fontFamily, sq: Math.round(r(c1.querySelector('.card__media')).width / r(c1.querySelector('.card__media')).height * 100) / 100,
      rad: getComputedStyle(c1.querySelector('.card__media')).borderTopLeftRadius, num: c1.querySelector('.card__num')?.textContent, cat: !!c1.querySelector('.card__cat'), mat: c1.querySelector('.card__extra')?.textContent,
      land: Math.round(r(c2.querySelector('.card__media')).width / r(c2.querySelector('.card__media')).height * 100) / 100, rad0: getComputedStyle(c2.querySelector('.card__media')).borderTopLeftRadius, always: +getComputedStyle(c2.querySelector('.card__add')).opacity,
      facts: ['.card__meta', '.card__swatches', '.card__sizes', '.card__actions .icon-btn'].map(s => c3.querySelectorAll(s).length).join(',') }; });
  check('centre, heading title font, square, rounded, number, category, material', va.align === 'center' && /Newsreader/.test(va.font) && va.sq === 1 && va.rad === '20px' && va.num === '01' && va.cat && va.mat === '100% mulberry silk', JSON.stringify(va));
  check('landscape, no radius, add always visible', va.land === 1.33 && va.rad0 === '0px' && va.always === 1, JSON.stringify(va));
  check('facts switched off are not rendered', va.facts === '0,0,0,0', va.facts);
  await p.hover('.product-grid >> nth=1 >> .card >> nth=0 >> .card__media'); await p.waitForTimeout(1200);
  check('zoom hover scales the image', await p.evaluate(() => /matrix\(1\.0[1-5]/.test(getComputedStyle(document.querySelectorAll('.product-grid')[1].querySelector('.card__img--a img')).transform)));
  await p.hover('.product-grid >> nth=2 >> .card >> nth=0 >> .card__media'); await p.waitForTimeout(1100);
  check('carousel hover cycles the other images', await p.evaluate(() => !!document.querySelectorAll('.product-grid')[2].querySelector('.card__img--cycle.is-on')));
  await p.mouse.move(5, 5); await p.waitForTimeout(300);
  check('and stops when the pointer leaves', await p.evaluate(() => !document.querySelectorAll('.product-grid')[2].querySelector('.card__img--cycle.is-on')));
  await p.screenshot({ path: path.join(dir, 's_variants_1440.png'), fullPage: true });
  await p.close();

  // ---- List view, dark, phone
  p = await open('cd_list');
  check('list view: image beside the text, description shown', await p.evaluate(() => { const c = document.querySelector('.card'); return getComputedStyle(c).display === 'grid' && getComputedStyle(c.querySelector('.card__desc')).display === 'block'; }));
  await p.close();
  p = await open('cd_dark');
  await p.screenshot({ path: path.join(dir, 's_dark_1440.png') });
  check('dark: card text follows the scheme', await p.evaluate(() => getComputedStyle(document.querySelector('.card__title')).color !== 'rgb(26, 26, 26)'));
  await p.close();
  const phone = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, ignoreHTTPSErrors: true });
  p = await open('cd_phone', { ctx: phone });
  const ph = await p.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, acts: +getComputedStyle(document.querySelector('.card__actions .icon-btn')).opacity, add: getComputedStyle(document.querySelector('.card__add')).display }));
  check('phone: no sideways scroll, actions visible without hover, no hover-only add button', ph.over <= 0 && ph.acts === 1 && ph.add === 'none', JSON.stringify(ph));
  await p.evaluate(() => { ['slip-dress', 'silk-scarf', 'hoops', 'cardigan'].forEach(h => window.MN.compare.toggle(h)); });
  await p.waitForTimeout(900);
  const pt = await p.evaluate(() => { const r = document.getElementById('cmpTray').getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), b: Math.round(r.bottom), vh: innerHeight }; });
  check('phone: a full compare tray fits the screen', pt.l >= 0 && pt.r <= 390 && pt.b <= pt.vh, JSON.stringify(pt));
  await p.screenshot({ path: path.join(dir, 's_tray_390.png') });
  await p.evaluate(() => { window.MN.compare.ids = []; window.MN.compare.paint(); });
  await p.screenshot({ path: path.join(dir, 's_phone_390.png'), fullPage: true });
  await p.close();

  await b.close();
  console.log(`\n${ok} passed, ${bad} failed. JS errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  process.exit(bad ? 1 : 0);
})();
