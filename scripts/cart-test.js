// Cart (design build): drawer, notification and page modes, rendered by
// scripts/cart-check.py and served from a fake origin so the Ajax Cart API
// and Section Rendering can be mocked with the states in cart_mock.json.
// Opens and closes, steppers (one request per burst, capped by stock),
// remove, add, shipping progress, counts, errors, empty state, phones.
//   python3 scripts/cart-check.py OUT && node scripts/cart-test.js OUT
const { chromium } = require('playwright');
const routeFonts = require('./fonts-route');
const fs = require('fs'), path = require('path');
const dir = process.argv[2] || '.';
const mock = JSON.parse(fs.readFileSync(path.join(dir, 'cart_mock.json'), 'utf8'));
const ORIGIN = 'http://shop.test';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let ok = 0, bad = 0; const errs = [];
  const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); c ? ok++ : bad++; };
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // srv.next(state | {error}) decides the answer to the next cart request
  const page = async (f, w = 1440, opts = {}) => {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, ignoreHTTPSErrors: true, ...opts });
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    const srv = { calls: [], answer: null, override: null };
    if (process.env.NOFONTS) await p.route('https://fonts.googleapis.com/**', r => r.abort()); else await routeFonts(p);
    await p.route(ORIGIN + '/**', async r => {
      const u = new URL(r.request().url());
      const body = r.request().postData();
      if (u.pathname === '/cart/add.js' || u.pathname === '/cart/change.js') {
        let req = {}; try { req = JSON.parse(body); } catch (e) { req = { form: true }; }
        srv.calls.push({ path: u.pathname, req });
        const a = srv.answer; const st = typeof a === 'string' ? mock[a] : null;
        await wait(120);
        if (!st) return r.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ status: 422, message: 'Cart Error', description: a.error }) });
        const items = srv.override ? st.items.map(i => (srv.override[i.key] != null ? { ...i, quantity: srv.override[i.key] } : i)) : st.items;
        const sections = { 'cart-drawer': st.html };
        const json = u.pathname === '/cart/add.js' ? { items: items.filter(i => (req.items || []).some(x => String(x.id) === i.key)), sections } : { item_count: st.item_count, items, sections };
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify(json) });
      }
      if (u.searchParams.get('sections') === 'cart-drawer') {
        srv.calls.push({ path: 'sections' });
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ 'cart-drawer': mock[srv.answer || 'two'].html }) });
      }
      if (u.pathname === '/cart') return r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>cart page</title>Cart page' });
      const file = path.join(dir, u.pathname);
      if (fs.existsSync(file)) return r.fulfill({ path: file });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.goto(`${ORIGIN}/${f}.html`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    return { p, srv };
  };
  const st = p => p.evaluate(() => ({
    open: document.getElementById('ov-cart')?.classList.contains('is-open'),
    title: document.getElementById('cartTitle')?.textContent.trim(),
    lines: [...document.querySelectorAll('#cartBody .cart-line')].map(l => l.dataset.key + 'x' + l.querySelector('.stepper span').textContent.trim()).join(','),
    sub: document.getElementById('cartSub')?.textContent.trim(),
    count: document.getElementById('cartCount').textContent.trim(),
    ship: document.querySelector('.ship-progress p')?.textContent.trim(),
    toast: document.querySelector('#mnToast.is-on')?.textContent || '',
  }));

  // ---- Drawer: open, look, close
  let { p, srv } = await page('ct_drawer');
  await p.click('.header__icon--cart'); await p.waitForTimeout(700); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
  let s = await st(p);
  const geo = await p.evaluate(() => { const r = document.querySelector('#ov-cart .overlay__panel').getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) }; });
  check('bag button opens the drawer from the right', s.open && geo.r <= 1440 && geo.w > 400 && geo.l > 900, JSON.stringify(geo));
  check('drawer shows title with count, lines, unlocked shipping, subtotal', s.title === 'Your bag (2)' && s.lines === 'scarfx1,hoopsx1' && /unlocked/.test(s.ship) && s.sub === '$530' && s.count === '2', JSON.stringify(s));
  check('minus disabled at 1; checkout posts to /cart with name=checkout', await p.evaluate(() => document.querySelector('.cart-line [data-step-q="-1"]').disabled && document.querySelector('#CartDrawerForm').getAttribute('action') === '/cart' && document.querySelector('#CartDrawerForm button').name === 'checkout'));
  await p.screenshot({ path: path.join(dir, 's_drawer_1440.png') });

  // ---- Stepper: a burst of clicks is one request, the line is not re-animated
  srv.answer = 'scarf2';
  await p.click('.cart-line[data-key="scarf"] [data-step-q="1"]');
  await p.waitForTimeout(60);
  const opt = await p.evaluate(() => document.querySelector('.cart-line[data-key="scarf"] .stepper span').textContent.trim());
  await p.click('.cart-line[data-key="scarf"] [data-step-q="1"]'); // capped at stock 2: shakes, no change
  await p.waitForTimeout(800);
  s = await st(p);
  const calls = srv.calls.filter(c => c.path === '/cart/change.js');
  check('plus updates the number at once, then one change request', opt === '2' && calls.length === 1 && calls[0].req.id === 'scarf' && calls[0].req.quantity === 2, JSON.stringify(calls));
  check('after the change: count 3, new subtotal, lines kept their place', s.count === '3' && s.sub === '$770' && s.lines === 'scarfx2,hoopsx1' && s.title === 'Your bag (3)', JSON.stringify(s));
  check('re-rendered lines do not replay the entrance; plus disabled at stock', await p.evaluate(() => [...document.querySelectorAll('#cartBody .cart-line')].every(l => l.classList.contains('is-settled')) && document.querySelector('.cart-line[data-key="scarf"] [data-step-q="1"]').disabled));
  check('count dot bumped', await p.evaluate(() => document.getElementById('cartCount').classList.contains('bump')));

  // ---- Remove
  srv.answer = 'hoops'; srv.calls = [];
  await p.click('.cart-line[data-key="scarf"] [data-remove]'); await p.waitForTimeout(80);
  const leaving = await p.evaluate(() => document.querySelector('.cart-line[data-key="scarf"]')?.classList.contains('is-leaving'));
  await p.waitForTimeout(700);
  s = await st(p);
  check('remove collapses the line, then the bag re-renders without it', leaving && s.lines === 'hoopsx1' && s.count === '1' && srv.calls[0].req.quantity === 0, JSON.stringify(s));
  check('below the threshold the bar shows what is left', /Add \$210/.test(s.ship || ''), s.ship);

  // ---- Server caps quantity: tell the shopper
  srv.answer = 'hoops'; srv.override = { hoops: 1 };
  await p.click('.cart-line[data-key="hoops"] [data-step-q="1"]'); await p.waitForTimeout(800);
  s = await st(p); srv.override = null;
  check('when stock caps a change, a toast says how many are available', /Only 1 available/.test(s.toast) && s.lines === 'hoopsx1', JSON.stringify(s));

  // ---- Escape closes, focus returns to the bag
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  check('Escape closes and focus returns to the bag button', await p.evaluate(() => !document.getElementById('ov-cart').classList.contains('is-open') && document.activeElement.classList.contains('header__icon--cart')));

  // ---- Add (old card / quick view path) opens the drawer with the new line animating
  srv.answer = 'dress'; srv.calls = [];
  await p.evaluate(() => window.MaisonNoir.addToCart('dress', 1));
  await p.waitForTimeout(700);
  s = await st(p);
  const anim = await p.evaluate(() => { const l = document.querySelector('.cart-line[data-key="dress"]'); return !!l && !l.classList.contains('is-settled'); });
  check('add: drawer open, 3 lines, count 3, new line animates in', s.open && s.lines.startsWith('dressx1') && s.count === '3' && anim, JSON.stringify(s));
  check('add: asks Shopify to render the drawer section', srv.calls[0].req.sections === 'cart-drawer' && typeof srv.calls[0].req.sections_url === 'string');

  // ---- Errors from Shopify show as a toast and do not break the drawer
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  srv.answer = { error: 'The Silk Twill Scarf is sold out.' };
  await p.evaluate(() => window.MN.cart.add([{ id: 1, quantity: 1 }]).catch(() => {}));
  await p.waitForTimeout(400);
  s = await st(p);
  check('add error: toast shows Shopify\'s reason, drawer stays closed', /sold out/.test(s.toast) && !s.open, s.toast);
  await p.close();

  // ---- Notification mode
  ({ p, srv } = await page('ct_notify'));
  srv.answer = 'dress';
  await p.evaluate(() => window.MN.cart.add([{ id: 'dress', quantity: 1 }]));
  await p.waitForTimeout(600);
  const nt = await p.evaluate(() => { const n = document.getElementById('cartNotify'); return { open: n.classList.contains('is-open'), drawer: document.getElementById('ov-cart').classList.contains('is-open'), title: n.querySelector('.cart-line__title')?.textContent, vars: n.querySelector('.cart-line__variant')?.textContent, price: n.querySelector('.cart-notify__price')?.textContent, img: !!n.querySelector('.cart-line__img img'), cnt: n.querySelector('[data-cart-count]').textContent, top: Math.round(n.getBoundingClientRect().top), right: Math.round(innerWidth - n.getBoundingClientRect().right) }; });
  check('notification mode: card shows the added item, drawer stays shut', nt.open && !nt.drawer && nt.title === 'Washed Silk Slip Dress' && nt.vars === 'Black · S' && nt.price === '$890' && nt.img && nt.cnt === '3', JSON.stringify(nt));
  await p.screenshot({ path: path.join(dir, 's_notify_1440.png') });
  await p.hover('#cartNotify'); await p.waitForTimeout(5400);
  check('notification stays while hovered', await p.evaluate(() => document.getElementById('cartNotify').classList.contains('is-open')));
  await p.click('#cartNotify [data-open="ov-cart"]'); await p.waitForTimeout(600);
  check('"View bag" opens the drawer and hides the card', await p.evaluate(() => document.getElementById('ov-cart').classList.contains('is-open') && !document.getElementById('cartNotify').classList.contains('is-open')));
  await p.close();

  // ---- Page mode: header links to the cart, adding goes there
  ({ p, srv } = await page('ct_page'));
  check('page mode: no drawer, bag is a link to /cart', await p.evaluate(() => !document.getElementById('ov-cart') && document.querySelector('.header__icon--cart').getAttribute('href') === '/cart'));
  srv.answer = 'dress';
  await Promise.all([p.waitForURL(ORIGIN + '/cart', { timeout: 4000 }).catch(() => {}), p.evaluate(() => window.MN.cart.add([{ id: 'dress', quantity: 1 }]))]);
  check('page mode: adding goes to the cart page', p.url() === ORIGIN + '/cart', p.url());
  await p.close();

  // ---- Empty bag
  ({ p, srv } = await page('ct_empty'));
  await p.click('.header__icon--cart'); await p.waitForTimeout(600);
  const em = await p.evaluate(() => ({ text: document.querySelector('.mn-cart-empty p')?.textContent, foot: getComputedStyle(document.getElementById('cartFoot')).display, link: document.querySelector('.mn-cart-empty a')?.getAttribute('href'), dot: getComputedStyle(document.getElementById('cartCount')).display }));
  check('empty bag: message and continue link, no checkout, no count dot', em.text === 'Your bag is empty.' && em.foot === 'none' && em.link === '/collections/all' && em.dot === 'none', JSON.stringify(em));
  srv.answer = 'hoops';
  await p.evaluate(() => window.MN.cart.add([{ id: 'hoops', quantity: 1 }]));
  await p.waitForTimeout(600);
  check('adding to an empty bag shows the footer and the count', await p.evaluate(() => getComputedStyle(document.getElementById('cartFoot')).display !== 'none' && document.getElementById('cartCount').textContent === '1' && getComputedStyle(document.getElementById('cartCount')).display !== 'none'));
  await p.close();

  // ---- Discounts, dark scheme, phones
  ({ p } = await page('ct_disc'));
  await p.click('.header__icon--cart'); await p.waitForTimeout(700);
  check('discounts: struck line price, code, cart discount row', await p.evaluate(() => !!document.querySelector('.cart-line__was') && !!document.querySelector('.cart-line__disc') && !!document.querySelector('.cart-sub--disc')));
  await p.screenshot({ path: path.join(dir, 's_disc_1440.png') });
  await p.close();
  ({ p } = await page('ct_dark'));
  await p.click('.header__icon--cart'); await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(dir, 's_dark_1440.png') });
  await p.close();
  ({ p } = await page('ct_drawer', 390, { hasTouch: true }));
  await p.tap('.header__icon--cart'); await p.waitForTimeout(700);
  const ph = await p.evaluate(() => { const r = document.querySelector('#ov-cart .overlay__panel').getBoundingClientRect(); const over = [...document.querySelectorAll('#ov-cart .overlay__panel *')].filter(e => e.getBoundingClientRect().right > r.right + 1).length; return { l: Math.round(r.left), r: Math.round(r.right), over, page: document.documentElement.scrollWidth - innerWidth }; });
  check('phone: drawer fits the screen, nothing spills', ph.l >= 0 && ph.r <= 390 && ph.over === 0 && ph.page <= 0, JSON.stringify(ph));
  await p.screenshot({ path: path.join(dir, 's_drawer_390.png') });
  await p.tap('#ov-cart .overlay__scrim', { position: { x: 4, y: 450 } }).catch(async () => p.mouse.click(4, 450)); await p.waitForTimeout(500);
  check('phone: tapping outside closes', await p.evaluate(() => !document.getElementById('ov-cart').classList.contains('is-open')));
  await p.close();

  await b.close();
  console.log(`\n${ok} passed, ${bad} failed. JS errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  process.exit(bad ? 1 : 0);
})();
