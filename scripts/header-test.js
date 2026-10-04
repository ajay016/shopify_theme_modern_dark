// Header (design build): every style x mega layout x images, rendered by
// scripts/header-check.py. Mega menus open on hover / keyboard / first tap,
// close on leave / Escape / outside click and stay on screen; flyout panes
// switch; announcement modes; search overlay with predictive results (the
// suggest endpoint is mocked); menu drawer three levels; compact,
// transparent-over-hero and hide-on-scroll; no sideways scroll on phones.
//   python3 scripts/header-check.py OUT && node scripts/header-test.js OUT
const { chromium } = require('playwright');
const path = require('path');
const dir = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let ok = 0, bad = 0; const errs = [];
  const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); c ? ok++ : bad++; };
  const page = async (f, w = 1440, opts = {}) => {
    const p = await b.newPage({ viewport: { width: w, height: 860 }, ignoreHTTPSErrors: true, ...opts });
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    await p.route('https://fonts.googleapis.com/**', r => r.abort());
    await p.route('**/search/suggest.json*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ resources: { results: {
      products: [{ title: 'Washed Silk Slip Dress', url: '/products/slip', price: '890.00', featured_image: { url: '' } }, { title: 'Silk Twill Scarf', url: '/products/scarf', price: '240.00', image: '' }],
      collections: [{ title: 'The Silk Edition', url: '/collections/silk' }], pages: [{ title: 'Caring for silk', url: '/pages/silk' }] } } }) }));
    await p.goto('file://' + path.resolve(dir, f + '.html')); await p.waitForTimeout(300); return p;
  };
  const mega = p => p.evaluate(() => { const m = document.querySelector('#mega-1'); const r = m.getBoundingClientRect(); const cs = getComputedStyle(m);
    return { open: m.classList.contains('is-open'), vis: cs.visibility, l: Math.round(r.left), r: Math.round(r.right), aria: document.querySelector('.nav__item[data-i="1"] .nav__link').getAttribute('aria-expanded') }; });

  for (const style of ['classic', 'centred', 'floating']) for (const m of ['columns', 'visual', 'flyout']) for (const im of ['img', 'txt']) {
    const f = `hd_${style}_${m}_${im}`; const p = await page(f);
    await p.hover('.nav__item[data-i="1"] .nav__link'); await p.waitForTimeout(650);
    const s = await mega(p);
    await p.mouse.move(700, 840); await p.waitForTimeout(700);
    const c = await mega(p);
    check(`${f}: hover opens on screen, leave closes`, s.open && s.vis === 'visible' && s.aria === 'true' && s.l >= 0 && s.r <= 1440 && !c.open, `[${s.l},${s.r}]`);
    await p.close();
  }
  let p = await page('hd_minimal_columns_img');
  check('minimal: no inline menu, menu button visible', await p.evaluate(() => getComputedStyle(document.querySelector('.header__nav')).display === 'none' && getComputedStyle(document.querySelector('.header__menu-btn')).display !== 'none'));
  await p.close();

  // keyboard, Escape, outside click, flyout panes
  p = await page('hd_classic_flyout_img');
  await p.focus('.nav__item[data-i="1"] .nav__link'); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(250);
  check('keyboard: ArrowDown opens and focuses into the panel', (await mega(p)).open && await p.evaluate(() => !!document.activeElement.closest('.mega')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  check('Escape closes and returns focus', !(await mega(p)).open && await p.evaluate(() => document.activeElement.classList.contains('nav__link')));
  await p.hover('.nav__item[data-i="1"] .nav__link'); await p.waitForTimeout(500);
  await p.hover('#mega-1 .flyout__group[data-k="2"]'); await p.waitForTimeout(400);
  const fk = await p.evaluate(() => [document.querySelector('#mega-1').classList.contains('is-open'), document.querySelector('#mega-1 .flyout__pane.is-active').dataset.k, document.querySelector('#mega-1 .flyout__group.is-active').dataset.k]);
  check('flyout: hovering a group shows its links', fk[1] === '2' && fk[2] === '2', JSON.stringify(fk));
  await p.mouse.click(700, 840); await p.waitForTimeout(100);
  check('outside click closes', !(await mega(p)).open);
  await p.close();

  // touch: first tap opens
  p = await page('hd_classic_columns_img', 1280, { hasTouch: true });
  const u0 = p.url(); await p.tap('.nav__item[data-i="1"] .nav__link'); await p.waitForTimeout(400);
  check('touch: first tap opens, no navigation', p.url() === u0 && (await mega(p)).open);
  await p.close();

  // announcement modes
  for (const [f, sel] of [['hd_classic_columns_img', '.announce__ticker'], ['hd_announce_rotating', '.announce__rotate'], ['hd_announce_static', '.announce__static']]) {
    p = await page(f);
    const v = await p.evaluate(s => ['.announce__ticker', '.announce__rotate', '.announce__static'].map(x => [x, getComputedStyle(document.querySelector(x)).display !== 'none']).filter(x => x[1]).map(x => x[0]), sel);
    check(`announcement ${f.split('_').pop()}: only ${sel} shown`, v.length === 1 && v[0] === sel, v.join(','));
    if (f.includes('rotating')) {
      await p.click('.announce__next'); await p.waitForTimeout(200);
      check('rotating: next shows the second message', await p.evaluate(() => [...document.querySelectorAll('.announce__slide')].findIndex(s => s.classList.contains('is-active')) === 1));
    }
    await p.close();
  }

  // search overlay + predictive results
  p = await page('hd_classic_columns_img');
  await p.click('.header__icon--search'); await p.waitForTimeout(600);
  check('search opens, input focused', await p.evaluate(() => document.getElementById('ov-search').classList.contains('is-open') && document.activeElement.id === 'searchInput'));
  check('empty state: trending products shown', await p.evaluate(() => document.querySelectorAll('#searchResults .sresult').length === 4));
  await p.fill('#searchInput', 'silk'); await p.waitForTimeout(600);
  const sr = await p.evaluate(() => ({ prods: document.querySelectorAll('#searchResults .sresult').length, mark: !!document.querySelector('#searchResults mark'), coll: document.querySelector('#searchResults .search__list a')?.textContent, chips: document.getElementById('searchChips').hidden }));
  check('typing shows predictive results with highlights; chips hide', sr.prods === 2 && sr.mark && /Silk/.test(sr.coll || '') && sr.chips, JSON.stringify(sr));
  await p.fill('#searchInput', ''); await p.waitForTimeout(400);
  check('clearing restores the empty state', await p.evaluate(() => document.querySelectorAll('#searchResults .sresult').length === 4));
  await p.click('#searchChips .chip >> nth=0'); await p.waitForTimeout(600);
  check('a chip searches for its term', await p.evaluate(() => document.getElementById('searchInput').value === 'Silk'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  check('Escape closes search', await p.evaluate(() => !document.getElementById('ov-search').classList.contains('is-open')));
  await p.close();

  // phone: menu drawer, no overflow
  for (const style of ['classic', 'centred', 'minimal', 'floating']) {
    p = await page(`hd_${style}_columns_img`, 390);
    const of = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await p.click('.header__menu-btn'); await p.waitForTimeout(600);
    await p.click('.mnav__acc1 >> nth=0 >> .acc__trigger'); await p.waitForTimeout(500);
    await p.click('.mnav__acc1 >> nth=0 >> .mnav__acc2 >> nth=1 >> .acc__trigger'); await p.waitForTimeout(600);
    const st = await p.evaluate(() => ({ open: document.getElementById('ov-menu').classList.contains('is-open'), l3: [...document.querySelectorAll('.mnav__acc2.is-open .mnav__l3 a')].map(a => a.textContent.trim()).slice(0, 2).join(',') }));
    check(`${style} phone: no sideways scroll, drawer + level 2 + level 3 open`, of <= 0 && st.open && st.l3.startsWith('Mules'), `overflow ${of}, ${st.l3}`);
    await p.close();
  }

  // scroll behaviour
  p = await page('hd_classic_columns_img');
  await p.mouse.wheel(0, 300); await p.waitForTimeout(400);
  const cp = await p.evaluate(() => ({ compact: document.getElementById('siteHeader').classList.contains('is-compact'), top: Math.round(document.getElementById('siteHeader').getBoundingClientRect().top), h: getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim() }));
  check('scrolled: header compact and pinned at the top, --header-h set', cp.compact && cp.top === 0 && cp.h !== '0px', JSON.stringify(cp));
  await p.close();
  p = await page('hd_hide');
  for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 150); await p.waitForTimeout(120); }
  await p.waitForTimeout(400);
  const hid = await p.evaluate(() => [document.getElementById('siteHeader').classList.contains('is-hidden'), getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim()]);
  await p.mouse.wheel(0, -200); await p.waitForTimeout(600);
  const back = await p.evaluate(() => document.getElementById('siteHeader').classList.contains('is-hidden'));
  check('hide on scroll: hides going down (offset 0), returns going up', hid[0] && hid[1] === '0px' && !back, hid.join(','));
  await p.close();
  p = await page('hd_transparent');
  const t0 = await p.evaluate(() => ({ tr: document.getElementById('siteHeader').classList.contains('is-transparent'), mainTop: Math.round(document.getElementById('MainContent').getBoundingClientRect().top) }));
  await p.mouse.wheel(0, 900); await p.waitForTimeout(500);
  const t1 = await p.evaluate(() => document.getElementById('siteHeader').classList.contains('is-transparent'));
  check('transparent over the homepage hero, solid after it', t0.tr && t0.mainTop <= 40 && !t1, JSON.stringify(t0));
  await p.close();

  await b.close();
  console.log(`\n${ok} passed, ${bad} failed. JS errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  process.exit(bad ? 1 : 0);
})();
