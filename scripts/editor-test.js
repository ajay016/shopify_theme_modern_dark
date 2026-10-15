// Theme editor re-render. When a setting changes in Customize, Shopify fires
// shopify:section:unload, swaps the section's HTML, runs its inline scripts
// and fires shopify:section:load. This replays that twice on the main
// interactive sections and checks their controls still work, and work once
// (a control bound twice toggles twice, which looks like "does nothing").
//   node scripts/editor-test.js ROOT    (ROOT: harness output, as for scheme-test)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || '.';
let ok = 0, bad = 0; const errs = [];
const check = (n, c, extra = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (extra ? '  ' + extra : '')); c ? ok++ : bad++; };

const RERENDER = sel => {
  const root = document.querySelector(sel); if (!root) return false;
  const host = root.closest('.shopify-section') || root;
  const sid = host.id.replace(/^shopify-section-/, '');
  host.dispatchEvent(new CustomEvent('shopify:section:unload', { bubbles: true, detail: { sectionId: sid } }));
  const tpl = document.createElement('template'); tpl.innerHTML = host.outerHTML;
  const fresh = tpl.content.firstElementChild;
  host.replaceWith(fresh);
  fresh.querySelectorAll('script:not([type]), script[type="text/javascript"]').forEach(old => { const s = document.createElement('script'); s.textContent = old.textContent; old.replaceWith(s); });
  fresh.dispatchEvent(new CustomEvent('shopify:section:load', { bubbles: true, detail: { sectionId: sid } }));
  return true;
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  async function open(dir, page) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', e => errs.push(`${page}: ${e.message}`));
    await p.route('https://**', r => r.abort());
    await p.route('http://shop.test/**', r => {
      const f = path.join(ROOT, dir, new URL(r.request().url()).pathname);
      return fs.existsSync(f) && fs.statSync(f).isFile() ? r.fulfill({ path: f }) : r.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    });
    await p.goto(`http://shop.test/${page}.html`); await p.waitForTimeout(500);
    return p;
  }
  const twice = async (p, sel) => { if (process.env.NORERENDER) return !!(await p.$(sel)); for (let i = 0; i < 2; i++) { const done = await p.evaluate(RERENDER, sel); if (!done) return false; await p.waitForTimeout(300); } return true; };

  // ---- product page
  let p = await open('t_pdp', 'pdp_default');
  check('product: section re-rendered twice', await twice(p, '.mn-pdp'));
  await p.click('.sw-text[data-val="L"]'); await p.waitForTimeout(200);
  check('product: size picker still selects', (await p.getAttribute('.sw-text[data-val="L"]', 'aria-checked')) === 'true');
  const q0 = await p.inputValue('.pi-qty input');
  await p.click('.pi-qty [data-q="1"]'); await p.waitForTimeout(150);
  check('product: quantity + adds exactly one', Number(await p.inputValue('.pi-qty input')) === Number(q0) + 1, `${q0} -> ${await p.inputValue('.pi-qty input')}`);
  const tab = p.locator('.tabs__btn:visible').nth(1);
  if (await tab.count()) { await tab.click(); await p.waitForTimeout(250); check('product: details tabs still switch', (await tab.getAttribute('aria-selected')) === 'true'); }
  await p.click('[data-open="ov-size"]'); await p.waitForTimeout(400);
  check('product: size guide still opens', await p.evaluate(() => document.getElementById('ov-size').classList.contains('is-open')));
  await p.close();

  // ---- collection
  p = await open('t_collection', 'cl_sidebar');
  check('collection: section re-rendered twice', await twice(p, '.collection-page'));
  const t = p.locator('.collection-sidebar .filter-group__toggle').first();
  const before = await t.getAttribute('aria-expanded'); await t.click(); await p.waitForTimeout(200);
  check('collection: filter group toggles once', (await t.getAttribute('aria-expanded')) !== before, `${before} -> ${await t.getAttribute('aria-expanded')}`);
  await p.click('.view-toggle__btn--list'); await p.waitForTimeout(150);
  check('collection: list view still switches', (await p.getAttribute('#product-grid', 'data-view')) === 'list');
  await p.close();

  // ---- header
  p = await open('t_header', 'hd_classic_columns_img');
  check('header: section re-rendered twice', await twice(p, '#siteHeader'));
  await p.click('.header__icon--search'); await p.waitForTimeout(450);
  check('header: search still opens', await p.evaluate(() => !!document.querySelector('.overlay.is-open, #ov-search.is-open, .search.is-open')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(450);
  check('header: Escape still closes it', await p.evaluate(() => !document.querySelector('.overlay.is-open')));
  await p.close();

  // ---- homepage: product tabs, countdown
  p = await open('hm', 'hm_aureline');
  check('home: product tabs re-rendered twice', await twice(p, '[data-section-type="product-tabs"]'));
  const ptab = p.locator('[data-section-type="product-tabs"] .ptab-tab').nth(1);
  await ptab.scrollIntoViewIfNeeded(); await ptab.click(); await p.waitForTimeout(300);
  check('home: product tab still switches', await ptab.evaluate(el => el.classList.contains('is-active') || el.getAttribute('aria-selected') === 'true'));
  check('home: countdown re-rendered twice', await twice(p, '[data-section-type="offer-countdown"]'));
  const sec = () => p.evaluate(() => document.querySelector('[data-section-type="offer-countdown"]').innerText.replace(/\s+/g, ' '));
  const c1 = await sec(); await p.waitForTimeout(1300); const c2 = await sec();
  check('home: countdown still ticks', c1 !== c2);
  await p.close();

  // ---- account addresses (delegated handlers)
  p = await open('t_account', 'ac_addresses');
  check('addresses: section re-rendered twice', await twice(p, '.mn-acct'));
  await p.click('.mn-acct__head [data-acct-toggle="AddrNew"]'); await p.waitForTimeout(200);
  check('addresses: add form still opens once', await p.evaluate(() => !document.getElementById('AddrNew').hidden));
  await p.close();

  // ---- every section of every homepage, About page and collections list
  const homes = fs.readdirSync(path.join(ROOT, 'hm')).filter(f => /^hm_.*\.html$/.test(f)).map(f => f.replace('.html', '')).sort();
  for (const h of homes) {
    p = await open('hm', h);
    const types = await p.evaluate(() => [...document.querySelectorAll('[data-section-type]')].map(e => e.id));
    const broken = [];
    for (const id of types) {
      const before = errs.length;
      const ok1 = await twice(p, '#' + id);
      const hgt = await p.evaluate(id => { const e = document.getElementById(id); return e ? e.getBoundingClientRect().height : 0; }, id);
      if (!ok1 || hgt < 20 || errs.length > before) broken.push(`${id}(${Math.round(hgt)}px${errs.length > before ? ', error' : ''})`);
    }
    check(`${h}: all ${types.length} sections survive re-render`, broken.length === 0, broken.join(' '));
    await p.close();
  }

  check('no page errors', errs.length === 0, errs.slice(0, 5).join(' | '));
  await b.close();
  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
