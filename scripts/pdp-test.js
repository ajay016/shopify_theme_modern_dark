// Product page (design build): every picker type, gallery mode, layout and
// details style rendered by scripts/pdp-check.py, served from a fake origin
// with Shopify's endpoints mocked (scripts/pdp-serve.js).
//   python3 scripts/pdp-check.py OUT && node scripts/pdp-test.js OUT
const { chromium } = require('playwright');
const path = require('path');
const serve = require('./pdp-serve'), routeFonts = require('./fonts-route');
const dir = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let ok = 0, bad = 0; const errs = [];
  const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); c ? ok++ : bad++; };
  const calls = [];
  const open = async (f, w = 1440, opts = {}) => {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, ...opts });
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    await routeFonts(p); await p.route('http://shop.test/**', serve(dir, calls));
    await p.goto(`http://shop.test/${f}.html`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    return p;
  };
  const state = p => p.evaluate(() => ({
    url: new URL(location.href).searchParams.get('variant'), id: document.querySelector('[data-variant-input]')?.value,
    stock: document.querySelector('[data-stock]')?.textContent.trim(), atc: document.querySelector('#mainAtc .atc__label')?.textContent.trim(),
    atcDis: document.querySelector('#mainAtc')?.getAttribute('aria-disabled'), sold: document.querySelector('#mainAtc')?.classList.contains('is-soldout'),
    badges: [...document.querySelectorAll('[data-badges] .badge')].map(x => x.textContent.trim()).join('|'),
    labels: [...document.querySelectorAll('.picker__label span')].map(x => x.textContent).join('|'),
    thumb: [...document.querySelectorAll('.gallery__thumbs .thumb')].findIndex(t => t.classList.contains('is-active')),
  }));
  const V = require(path.join(dir, 'mock', 'variants.json'));
  const vid = (c, s) => V.dress.find(v => v.options[0] === c && v.options[1] === s).id;

  // ---- Pickers, variant state, URL, stock, badges
  let p = await open('pdp_default');
  let s = await state(p);
  check('first available variant chosen; colour is a dropdown, size buttons', s.id == vid('Black', 'XS') && s.labels === 'Black|XS' && await p.evaluate(() => !!document.querySelector('.picker .select .select__trigger') && document.querySelectorAll('.sw-text').length === 5), JSON.stringify(s));
  check('stock bar and badges read the variant', /Only 3 left in XS/.test(s.stock) && s.badges === 'New|Sale|Low stock|Made in Italy', JSON.stringify(s));
  await p.click('.sw-text[data-val="S"]'); await p.waitForTimeout(150);
  s = await state(p);
  check('size click: URL, form id, label, stock follow', s.url == vid('Black', 'S') && s.id == vid('Black', 'S') && s.labels === 'Black|S' && /in S/.test(s.stock), JSON.stringify(s));
  await p.click('.picker .select__trigger'); await p.waitForTimeout(250);
  await p.click('.picker .select__option >> text=Wine'); await p.waitForTimeout(1200);
  s = await state(p);
  check('colour dropdown: Wine chosen, gallery jumps to its image', s.labels === 'Wine|S' && s.thumb === 7, JSON.stringify(s));
  check('L is sold out: struck, still selectable', await p.evaluate(() => { const b = document.querySelector('.sw-text[data-val="L"]'); return b.classList.contains('is-soldout') && !b.disabled; }));

  // ---- Terms gate the buy buttons
  check('terms unticked: buy disabled, hint shown, dynamic checkout greyed', s.atcDis === 'true' && await p.evaluate(() => document.querySelector('[data-hint]').classList.contains('is-open') && document.querySelector('.buy__dynamic').classList.contains('is-disabled')));
  await p.click('#mainAtc', { force: true }); await p.waitForTimeout(150);
  check('clicking the disabled button shakes the terms', await p.evaluate(() => document.querySelector('.pi-terms').classList.contains('is-shake')) && !calls.some(c => c.path === '/cart/add.js'));
  await p.click('.pi-terms input'); await p.waitForTimeout(100);
  s = await state(p);
  check('terms ticked: buy enabled, hint gone', s.atcDis === 'false' && await p.evaluate(() => !document.querySelector('[data-hint]').classList.contains('is-open') && !document.querySelector('.buy__dynamic').classList.contains('is-disabled')));

  // ---- Quantity + add to bag → drawer
  await p.click('.pi-qty [data-q="1"]'); await p.waitForTimeout(100);
  await p.click('#mainAtc'); await p.waitForTimeout(150);
  const loading = await p.evaluate(() => document.querySelector('#mainAtc').dataset.state);
  await p.waitForTimeout(700);
  const add = calls.filter(c => c.path === '/cart/add.js').pop();
  check('add posts the form: variant, quantity 2, sections', !!add && add.body.includes(`name="id"\r\n\r\n${vid('Wine', 'S')}`) && add.body.includes('name="quantity"\r\n\r\n2') && add.body.includes('cart-drawer'), add ? add.body.slice(0, 120).replace(/\r\n/g, ' ') : 'none');
  check('button: loading → added; the cart drawer opens', ['loading', 'added'].includes(loading) && await p.evaluate(() => document.querySelector('#mainAtc').dataset.state === 'added' && document.getElementById('ov-cart').classList.contains('is-open')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);

  // ---- Sold-out size → notify me
  await p.click('.sw-text[data-val="L"]'); await p.waitForTimeout(150);
  s = await state(p);
  check('sold-out variant: button reads notify, badge Sold out, stock says so', s.atc === 'Sold out — notify me' && s.sold && /Sold out/i.test(s.badges) && /Sold out in L/.test(s.stock), JSON.stringify(s));
  await p.waitForTimeout(1800);
  await p.click('#mainAtc'); await p.waitForTimeout(500);
  check('clicking it opens the email form', await p.evaluate(() => document.querySelector('[data-notify]').classList.contains('is-open')));
  await p.fill('[data-notify] input[type=email]', 'a@b.co'); await p.click('[data-notify] button[type=submit]'); await p.waitForTimeout(500);
  const nc = calls.filter(c => c.path === '/contact').pop();
  check('notify form posts the variant to the store contact form', !!nc && /Wine/.test(nc.body) && /restock/.test(nc.body) && await p.evaluate(() => !!document.querySelector('.buy__notify-done')), nc ? nc.body.length + '' : 'none');

  // ---- Gallery: arrows, thumbs, lightbox, video, zoom
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
  await p.click('.gallery__thumbs .thumb >> nth=0'); await p.waitForTimeout(500);
  await p.hover('.gallery__main'); await p.click('.gallery__arrow--next'); await p.waitForTimeout(600);
  check('gallery arrow moves to the next media', (await state(p)).thumb === 1);
  await p.mouse.move(400, 600); await p.waitForTimeout(100);
  check('hovering an image zooms in place', await p.evaluate(() => !!document.querySelector('.media--image.is-zooming')));
  await p.click('.gallery__expand'); await p.waitForTimeout(600);
  const lb = await p.evaluate(() => ({ open: document.getElementById('ov-lightbox').classList.contains('is-open'), count: document.getElementById('lbCount').textContent }));
  check('expand opens the lightbox at that image', lb.open && lb.count === '02 / 09', JSON.stringify(lb));
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(600);
  check('arrow keys page the lightbox', await p.evaluate(() => document.getElementById('lbCount').textContent) === '03 / 09');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.click('[data-film]'); await p.waitForTimeout(500);
  check('Watch the film opens the video popup with the product video', await p.evaluate(() => document.getElementById('ov-video').classList.contains('is-open') && !!document.querySelector('#videoBody video')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  check('closing the popup stops and removes the video', await p.evaluate(() => !document.querySelector('#videoBody video')));

  // ---- Size guide, compare colours, ask, share, code, pickup, compare
  await p.click('[data-open="ov-size"]'); await p.waitForTimeout(500);
  const sg = await p.evaluate(() => ({ open: document.getElementById('ov-size').classList.contains('is-open'), cur: document.querySelector('#sizeBody tr.is-current')?.dataset.size, bust: document.querySelector('#sizeBody tr[data-size="XS"] td[data-cm]')?.textContent }));
  await p.click('#sizeBody [data-unit="in"]'); await p.waitForTimeout(100);
  const inch = await p.evaluate(() => document.querySelector('#sizeBody tr[data-size="XS"] td[data-cm]').textContent);
  check('size guide: current size marked, cm ↔ in', sg.open && sg.cur === 'L' && sg.bust === '80' && inch === '31.5', JSON.stringify({ ...sg, inch }));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.click('[data-open="ov-compare"]'); await p.waitForTimeout(500);
  const cc = await p.evaluate(() => ({ cols: document.querySelectorAll('.cmp__col').length, cur: document.querySelector('.cmp__col.is-current .cmp__name')?.textContent }));
  check('compare colours: one column per colour, current marked', cc.cols === 3 && cc.cur === 'Wine', JSON.stringify(cc));
  await p.click('[data-pick-colour="Ivory"]'); await p.waitForTimeout(500);
  check('choosing a colour there selects it and closes', (await state(p)).labels.startsWith('Ivory') && await p.evaluate(() => !document.getElementById('ov-compare').classList.contains('is-open')));
  await p.click('.pi-actions [data-open="ov-ask"]'); await p.waitForTimeout(500);
  check('ask a question: product and variant prefilled', await p.evaluate(() => /Washed Silk Slip Dress · Ivory/.test(document.querySelector('[data-ask-body]').value) && document.querySelector('[data-ask-variant]').textContent === 'Ivory · L'));
  await p.fill('#AskForm [name="contact[name]"]', 'Ann'); await p.fill('#AskForm [name="contact[email]"]', 'a@b.co');
  await p.click('#AskForm button[type=submit]'); await p.waitForTimeout(500);
  check('ask: sent to the contact form, thank-you shown', calls.filter(c => c.path === '/contact').length === 2 && await p.evaluate(() => !document.querySelector('[data-ask-done]').hidden));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.click('[data-share]'); await p.waitForTimeout(250);
  check('share opens its menu', await p.evaluate(() => document.querySelector('.share').classList.contains('is-open')));
  await p.click('[data-copy-link]'); await p.waitForTimeout(100);
  check('copy link confirms', await p.evaluate(() => document.querySelector('[data-copy-link] span').textContent) === 'Link copied');
  await p.click('.offer__code'); await p.waitForTimeout(100);
  check('offer code copies', await p.evaluate(() => document.querySelector('.offer__code').textContent) === 'Copied');
  check('pickup block reads store availability', await p.evaluate(() => /Pickup (available|unavailable) at Maison Noir Milan/.test(document.querySelector('[data-pickup]').textContent) && !document.querySelector('[data-pickup]').hidden));
  await p.click('[data-pickup] [data-open="ov-pickup"]'); await p.waitForTimeout(500);
  check('pickup drawer lists the stores', await p.evaluate(() => document.querySelectorAll('#pickupBody .store').length === 2));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.click('[data-cmp-main]'); await p.waitForTimeout(400);
  check('compare action adds the product and reads "In compare"', await p.evaluate(() => document.querySelector('[data-cmp-main] span').textContent === 'In compare' && document.getElementById('cmpTray').classList.contains('is-visible')));
  await p.click('[data-cmp-main]'); await p.waitForTimeout(200);
  await p.click('[data-jump]'); await p.waitForTimeout(600);
  check('rating link opens the reviews', await p.evaluate(() => document.querySelector('[data-dsec-acc="rev"]').classList.contains('is-open')));

  // ---- Sticky bar
  await p.evaluate(() => scrollTo(0, 2200)); await p.waitForTimeout(700);
  const sb = await p.evaluate(() => ({ vis: document.getElementById('stickyAtc').classList.contains('is-visible'), sel: document.querySelectorAll('#stickyAtc .select').length, price: document.querySelector('#stickyAtc .price__now')?.textContent }));
  check('sticky bar appears once the buy button is out of view, with selects and price', sb.vis && sb.sel === 2 && /890/.test(sb.price), JSON.stringify(sb));
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600);
  check('and hides when it is back', await p.evaluate(() => !document.getElementById('stickyAtc').classList.contains('is-visible')));
  await p.screenshot({ path: path.join(dir, 's_default_top.png') });

  // ---- Quick view from a card
  await p.evaluate(() => document.querySelector('.row-cards').scrollIntoView()); await p.waitForTimeout(300);
  await p.hover('.row-cards .card >> nth=0'); await p.click('.row-cards .card >> nth=0 >> .card__qv'); await p.waitForTimeout(900);
  const qv = await p.evaluate(() => ({ open: document.getElementById('ov-quick').classList.contains('is-open'), title: document.getElementById('ov-quick-t')?.textContent, sw: document.querySelectorAll('#qvBody .sw-colour').length, sizes: document.querySelectorAll('#qvBody .sw-text').length, price: document.querySelector('#qvBody [data-qv-price] .price__now')?.textContent, buy: document.querySelector('#qvBody [data-qv-buynow]')?.getAttribute('href') }));
  check('quick view opens with colour swatches, sizes, price, Buy it now link', qv.open && qv.title === 'Washed Silk Slip Dress' && qv.sw === 3 && qv.sizes === 5 && /890/.test(qv.price) && /^\/cart\/\d+:1$/.test(qv.buy), JSON.stringify(qv));
  await p.screenshot({ path: path.join(dir, 's_quick.png') });
  await p.click('#qvBody .sw-colour >> nth=1'); await p.click('#qvBody .sw-text[data-val="M"]'); await p.waitForTimeout(150);
  await p.click('#qvBody [data-qv-atc]'); await p.waitForTimeout(700);
  const qa = calls.filter(c => c.path === '/cart/add.js').pop();
  check('quick view adds the chosen variant', qa && qa.body.includes(String(vid('Ivory', 'M'))), qa ? qa.body.slice(0, 80) : '');
  await p.close();

  // ---- Button settings, notification after add, inline video, pill qty
  p = await open('pdp_btn');
  const bs = await p.evaluate(() => { const a = document.getElementById('mainAtc'); return { accent: a.classList.contains('atc--accent'), noicon: a.classList.contains('atc--noicon'), label: a.querySelector('.atc__label').textContent, anim: document.querySelector('.mn-pdp').dataset.atcAnim, qty: document.querySelector('.pi-qty .qty')?.className }; });
  check('button settings: accent, no icon, own label, lift; pill quantity', bs.accent && bs.noicon && bs.label === 'Reserve yours' && bs.anim === 'lift' && /qty--pill/.test(bs.qty), JSON.stringify(bs));
  await p.click('.pi-terms input'); await p.click('#mainAtc'); await p.waitForTimeout(800);
  check('after adding: notification instead of the drawer', await p.evaluate(() => document.getElementById('cartNotify').classList.contains('is-open') && !document.getElementById('ov-cart').classList.contains('is-open')));
  await p.click('.media--video'); await p.waitForTimeout(300);
  check('inline video plays inside the gallery', await p.evaluate(() => document.querySelector('.media--video').classList.contains('is-playing') && !!document.querySelector('.media--video video') && !document.getElementById('ov-video').classList.contains('is-open')));
  await p.close();
  p = await open('pdp_qtydrop');
  check('dropdown quantity and outline button', await p.evaluate(() => !!document.querySelector('.pi-qty .select') && document.getElementById('mainAtc').classList.contains('atc--outline')));
  await p.close();

  // ---- Picker types
  for (const [f, sel, n] of [['pdp_col_image', '.sw-image', 3], ['pdp_col_colour', '.sw-colour', 3], ['pdp_col_radio', '.sw-radio', 8], ['pdp_col_text', '.sw-text', 8], ['pdp_col_dropdown', '.picker .select', 2]]) {
    p = await open(f);
    const c = await p.evaluate(s2 => document.querySelectorAll(s2).length, sel);
    check(`${f.replace('pdp_col_', 'colour option ')}: ${n} × ${sel}`, c === n, String(c));
    if (f === 'pdp_col_radio') check('radio meta: sold out and only-N-left notes', await p.evaluate(() => [...document.querySelectorAll('.sw-radio__meta')].some(x => /Sold out/.test(x.textContent)) && [...document.querySelectorAll('.sw-radio__meta')].some(x => /Only 3 left/.test(x.textContent))));
    await p.close();
  }

  // ---- Gallery modes
  for (const g of ['left', 'right', 'top', 'bottom', 'none', 'grid-1', 'grid-2', 'grid-mix', 'slider-2', 'slider-full', 'slider-container']) {
    p = await open('pdp_gal_' + g);
    const r = await p.evaluate(() => { const t = document.querySelector('.gallery__thumbs'), tr = document.querySelector('.gallery__track'), cs = getComputedStyle(t); return { thumbs: cs.display !== 'none', dir: cs.flexDirection, track: getComputedStyle(tr).display, over: document.documentElement.scrollWidth - document.documentElement.clientWidth, galW: Math.round(document.querySelector('.gallery').getBoundingClientRect().width) }; });
    const want = { left: r.thumbs && r.dir === 'column', right: r.thumbs && r.dir === 'column', top: r.thumbs && r.dir === 'row', bottom: r.thumbs && r.dir === 'row', none: !r.thumbs, 'grid-1': !r.thumbs && r.track === 'grid', 'grid-2': !r.thumbs && r.track === 'grid', 'grid-mix': !r.thumbs && r.track === 'grid', 'slider-2': !r.thumbs && r.track === 'flex', 'slider-full': !r.thumbs && r.galW >= 1420, 'slider-container': !r.thumbs && r.track === 'flex' }[g];
    check(`gallery ${g}`, want && r.over <= 0, JSON.stringify(r));
    await p.screenshot({ path: path.join(dir, `s_gal_${g}.png`) });
    await p.close();
  }

  // ---- Layouts and details styles / placements
  const det = p2 => p2.evaluate(() => { const w = el => el && !el.hidden ? { tabs: el.querySelectorAll('.tabs__btn').length, accs: el.querySelectorAll('.acc').length, open: el.querySelectorAll('.details-open').length, rows: el.querySelectorAll('.drow').length } : null; return { left: w(document.getElementById('detailsLeft')), right: w(document.querySelector('[data-details-inner]')), below: w(document.getElementById('detailsBelow')), w: getComputedStyle(document.querySelector('.product__wrap')).maxWidth, bg: getComputedStyle(document.querySelector('.product')).backgroundImage !== 'none' }; });
  const L = {
    default: d => d.left && d.left.accs === 3, box: d => d.left && d.left.accs === 3, wide: d => d.left && d.left.accs === 3, digital: d => d.left && d.left.accs === 3,
    'default-tab': d => d.below && d.below.tabs === 3, inner: d => d.right && d.right.accs === 3, gradient: d => d.left && d.bg, mixed: d => d.below && d.below.tabs === 1 && d.below.accs === 1 && d.below.open === 1,
  };
  for (const k of Object.keys(L)) { p = await open('pdp_lay_' + k); const d = await det(p); check(`layout ${k}: details where the design puts them`, L[k](d), JSON.stringify(d)); if (k === 'digital') check('digital: no pickup, instant download line', await p.evaluate(() => !document.querySelector('[data-pickup]') && /Instant download/.test(document.querySelector('[data-stock]').textContent))); await p.close(); }
  const D = { accordion: d => d.accs === 3, 'accordion-card': d => d.accs === 3, tabs: d => d.tabs === 3, 'tabs-pill': d => d.tabs === 3, 'tabs-vertical': d => d.tabs === 3, open: d => d.open === 3, drawer: d => d.rows === 3, 'per-section': d => d.tabs === 1 && d.accs === 1 && d.open === 1 };
  for (const k of Object.keys(D)) { p = await open('pdp_det_' + k); const d = (await det(p)).below; check(`details ${k}`, !!d && D[k](d), JSON.stringify(d)); if (k === 'drawer') { await p.click('.drow >> nth=0'); await p.waitForTimeout(500); check('drawer link opens the section in a drawer', await p.evaluate(() => document.getElementById('ov-details').classList.contains('is-open') && /Description/.test(document.getElementById('detailsT').textContent) && /mulberry/.test(document.getElementById('detailsBody').textContent))); } await p.close(); }
  p = await open('pdp_right'); check('placement right column', !!(await det(p)).right); await p.close();

  // ---- Countdown + visitors, sold-out product, single variant
  p = await open('pdp_countdown');
  const cd = await p.evaluate(() => ({ vis: !document.querySelector('.countdown').hidden, d: document.querySelector('[data-countdown] b').textContent, v: +document.querySelector('[data-visitors]').textContent }));
  check('countdown runs to the set date; visitors in range', cd.vis && +cd.d > 100 && cd.v >= 12 && cd.v <= 26, JSON.stringify(cd));
  await p.close();
  p = await open('pdp_soldout');
  s = await state(p);
  check('sold-out product: notify label, Sold out badge', s.atc === 'Sold out — notify me' && /Sold out/i.test(s.badges), JSON.stringify(s));
  await p.close();
  p = await open('pdp_single');
  check('one-variant product: no pickers, buy enabled', await p.evaluate(() => !document.querySelector('[data-pickers]') && document.getElementById('mainAtc').getAttribute('aria-disabled') === 'false'));
  await p.click('#mainAtc'); await p.waitForTimeout(600);
  check('and adds its variant', calls.filter(c => c.path === '/cart/add.js').pop().body.includes(String(V.scarf[0].id)));
  await p.close();

  // ---- Dark, phone
  p = await open('pdp_dark'); await p.screenshot({ path: path.join(dir, 's_dark.png') }); await p.close();
  p = await open('pdp_default', 390, { hasTouch: true, isMobile: true });
  const ph = await p.evaluate(() => ({ over: document.documentElement.scrollWidth - 390, galL: Math.round(document.querySelector('.gallery').getBoundingClientRect().left), info: getComputedStyle(document.querySelector('.product__info')).position }));
  check('phone: no sideways scroll, gallery edge to edge, info flows', ph.over <= 0 && ph.galL === 0 && ph.info === 'static', JSON.stringify(ph));
  await p.screenshot({ path: path.join(dir, 's_phone.png'), fullPage: true });
  await p.evaluate(() => scrollTo(0, 2600)); await p.waitForTimeout(700);
  const pb = await p.evaluate(() => { const r = document.querySelector('#stickyAtc .sticky-atc__inner').getBoundingClientRect(); return { vis: document.getElementById('stickyAtc').classList.contains('is-visible'), l: Math.round(r.left), r: Math.round(r.right) }; });
  check('phone: sticky bar fits', pb.vis && pb.l >= 0 && pb.r <= 390, JSON.stringify(pb));
  await p.screenshot({ path: path.join(dir, 's_phone_sticky.png') });
  await p.close();

  await b.close();
  console.log(`\n${ok} passed, ${bad} failed. JS errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  process.exit(bad ? 1 : 0);
})();
