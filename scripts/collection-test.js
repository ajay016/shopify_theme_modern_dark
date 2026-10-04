// Collection and search pages in the design's language: tokens instead of
// the old dark palette, display type, every filter mode opening, view
// toggle, chips, pagination and no sideways scroll on a phone.
//   python3 scripts/collection-check.py OUT && node scripts/collection-test.js OUT
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const routeFonts = require('./fonts-route');
const DIR = process.argv[2] || '.';
const ORIGIN = 'http://shop.test';
let ok = 0, bad = 0; const errs = [];
const check = (n, c, extra = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (extra ? '  ' + extra : '')); c ? ok++ : bad++; };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  async function open(name, w = 1440) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, isMobile: w < 500, hasTouch: w < 500 });
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    if (process.env.NOFONTS) await p.route('https://fonts.googleapis.com/**', r => r.abort()); else await routeFonts(p);
    await p.route(ORIGIN + '/**', r => {
      const f = path.join(DIR, new URL(r.request().url()).pathname);
      return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
    });
    await p.goto(`${ORIGIN}/${name}.html`); await p.waitForTimeout(400);
    return p;
  }
  const css = (p, sel, prop) => p.evaluate(([s, pr]) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[pr] : null; }, [sel, prop]);

  // ---- tokens, type
  let p = await open('cl_sidebar');
  const bodyBg = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
  check('page background is the scheme base, not the old dark tone', (await css(p, '.collection-page', 'backgroundColor')) === 'rgb(255, 255, 255)', bodyBg);
  check('title in the display face', /Newsreader/.test(await css(p, '.collection-title__text', 'fontFamily')));
  check('breadcrumb rendered', await p.locator('.collection-title .mn-breadcrumb [aria-current]').count() === 1);
  check('group headings not uppercase', (await css(p, '.filter-group__toggle', 'textTransform')) === 'none');
  check('sort is the design select', await p.locator('.sort-by .select__trigger').count() === 1);
  // view toggle
  await p.click('.view-toggle__btn--list'); await p.waitForTimeout(200);
  check('list toggle switches the grid', (await p.getAttribute('#product-grid', 'data-view')) === 'list');
  await p.click('.view-toggle__btn--grid'); await p.waitForTimeout(200);
  check('grid toggle switches back', (await p.getAttribute('#product-grid', 'data-view')) === 'grid');
  check('numbered pagination with current page', await p.locator('.pagination__item--current').count() === 1 && await p.locator('.pagination__item--next .icon').count() === 1);
  check('current page filled with the text colour', (await css(p, '.pagination__item--current', 'backgroundColor')) === 'rgb(26, 26, 26)');
  await p.close();

  // ---- active chips
  p = await open('cl_active');
  check('active filter chips with close icons', await p.locator('.filter-chip--active .icon').count() === 2);
  check('chip is a pill', parseFloat(await css(p, '.filter-chip--active', 'borderTopLeftRadius')) >= 17);
  check('checked size pill filled', (await css(p, '.cfilter-pill:has(input:checked)', 'backgroundColor')) === 'rgb(26, 26, 26)');
  check('sidebar shows Clear all', await p.locator('.sidebar-clear').count() === 1);
  await p.close();

  // ---- drawer
  p = await open('cl_drawer');
  await p.click('.collection-toolbar [data-open-filter-drawer]'); await p.waitForTimeout(500);
  check('drawer opens', await p.evaluate(() => document.querySelector('[data-filter-drawer]').classList.contains('is-open')));
  check('drawer on the page background', (await css(p, '.filter-drawer', 'backgroundColor')) === 'rgb(255, 255, 255)');
  check('drawer buttons are design buttons', await p.locator('.filter-drawer__footer .mn-btn').count() === 2);
  await p.keyboard.press('Escape'); await p.waitForTimeout(450);
  check('Escape closes the drawer', !(await p.evaluate(() => document.querySelector('[data-filter-drawer]').classList.contains('is-open'))));
  await p.close();

  // ---- dropdown / panel / toggle
  p = await open('cl_dropdown');
  await p.click('.dropdown-filter summary'); await p.waitForTimeout(200);
  check('dropdown opens a panel with rows', await p.locator('.dropdown-filter[open] .filter-check').count() > 0);
  await p.close();
  p = await open('cl_panel');
  await p.click('.collection-toolbar [data-toggle-filter-panel]'); await p.waitForTimeout(400);
  check('top panel opens', await p.evaluate(() => !document.querySelector('[data-filter-panel]').hidden));
  check('panel buttons not uppercase', (await css(p, '.filter-panel__close', 'textTransform')) === 'none');
  await p.close();
  p = await open('cl_toggle');
  check('toggle mode starts groups collapsed', await p.locator('.filter-group__body.is-collapsed').count() >= 3);
  await p.close();

  // ---- title styles, surfaces
  for (const [n, sel] of [['cl_title2', '.collection-title__banner'], ['cl_title3', '.collection-title__text--large'], ['cl_title4', '.collection-title__centered'], ['cl_title5', '.collection-title__row']]) {
    p = await open(n); check(`${n} renders`, await p.locator(sel).count() === 1); await p.close();
  }
  p = await open('cl_dark');
  check('dark scheme: page dark, text light', (await css(p, '.collection-page', 'backgroundColor')) === 'rgb(10, 10, 10)' && (await css(p, '.collection-title__text', 'color')) === 'rgb(245, 240, 232)');
  await p.close();
  p = await open('cl_empty');
  check('empty collection: icon and a design button', await p.locator('.collection-empty .collection-empty__icon').count() === 1 && await p.locator('.collection-empty .mn-btn').count() === 1);
  await p.close();
  p = await open('cl_loadmore');
  check('load more is a design button', await p.locator('[data-load-more].mn-btn').count() === 1);
  await p.close();

  // ---- search
  p = await open('sr_results');
  check('search title carries the terms', /silk/.test(await p.textContent('.mn-searchpage__head .section-title')));
  check('search field shows the query', (await p.inputValue('.mn-searchpage__field input')) === 'silk');
  check('type tabs, All current', (await p.textContent('.mn-searchpage__tabs [aria-current]')).trim() === 'All' && await p.locator('.mn-searchpage__tabs a').count() === 4);
  check('product results are design cards', await p.locator('.mn-searchpage__grid .card').count() === 6);
  check('journal and page rows', await p.locator('.mn-entry').count() === 2);
  check('placeholder visible (not the old cream)', (await css(p, '.mn-searchpage__field input', 'color')) === 'rgb(26, 26, 26)');
  await p.close();
  p = await open('sr_empty');
  check('no results: message, chips, picks', await p.locator('.mn-searchpage__empty-title').count() === 1 && await p.locator('.mn-searchpage__suggest .chip').count() === 4 && await p.locator('.card').count() === 4);
  check('no results: no tabs or zero count', await p.locator('.mn-searchpage__tabs').count() === 0 && await p.locator('.mn-searchpage__count').count() === 0);
  await p.close();
  p = await open('sr_start');
  check('before a search: prompt title', /looking/.test(await p.textContent('.mn-searchpage__head .section-title')));
  await p.close();

  // ---- phone: no sideways scroll, filters reachable
  const all = fs.readdirSync(DIR).filter(f => /^(cl|sr)_.*\.html$/.test(f)).map(f => f.replace('.html', ''));
  const wide = [];
  for (const n of all) {
    p = await open(n, 390);
    const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth));
    if (w > 390) wide.push(`${n}:${w}`);
    await p.close();
  }
  check(`no page wider than 390 (${all.length} pages)`, wide.length === 0, wide.join(' '));
  p = await open('cl_sidebar', 390);
  await p.click('.toolbar-btn--mobile-filters'); await p.waitForTimeout(500);
  check('phone: Filter opens the drawer', await p.evaluate(() => document.querySelector('[data-filter-drawer]').classList.contains('is-open')));
  await p.close();

  check('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
