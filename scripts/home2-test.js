// Maison homepage (sections/mh-*.liquid): behaviour, in the store's own
// page, at 1440 and 390, for a stocked store (OUT/hm) and an empty one (OUT/hm_empty).
//   python3 scripts/home-check.py OUT/hm && MN_EMPTY=1 python3 scripts/home-check.py OUT/hm_empty index.maison
//   node scripts/home2-test.js OUT
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const routeFonts = require('./fonts-route');
const ROOT = process.argv[2] || '.';
let ok = 0, bad = 0; const errs = [];
const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); c ? ok++ : bad++; };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const open = async (dir, page, w = 1440, motion) => {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 500, hasTouch: w < 500 });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(`${dir}/${page}@${w}: ${e.message}`));
    await routeFonts(p);
    await p.route(/^https:\/\/images\.unsplash\.com\//, r => r.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }));
    await p.route('http://shop.test/**', r => {
      const f = path.join(ROOT, dir, new URL(r.request().url()).pathname);
      if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return r.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      if (motion && f.endsWith('.html')) return r.fulfill({ contentType: 'text/html', body: fs.readFileSync(f, 'utf8').replace(/data-motion="[^"]*"/, `data-motion="${motion}"`) });
      return r.fulfill({ path: f });
    });
    await p.goto(`http://shop.test/${page}.html`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    return [p, ctx];
  };
  const to = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); e && e.scrollIntoView({ block: 'center', behavior: 'instant' }); }, sel).then(() => p.waitForTimeout(500));

  for (const [dir, label] of [['hm', 'stocked'], ['hm_empty', 'empty']]) {
    let [p, c] = await open(dir, 'hm_maison');
    const secs = await p.evaluate(() => [...document.querySelectorAll('section.mh[data-mh]')].map(s => s.dataset.mh));
    check(`${label}: all 16 sections render`, secs.length === 16, secs.join(' '));
    check(`${label}: every section booted once`, await p.evaluate(() => [...document.querySelectorAll('section.mh')].every(s => s.dataset.ready === '1')));

    // palette reaches the store's product cards (colour tokens only)
    const pal = await p.evaluate(() => { const cd = document.querySelector('.mh-na .card'); const t = cd && cd.querySelector('.card__title'); return t ? getComputedStyle(t).color : ''; });
    check(`${label}: product cards take the palette's text colour`, pal === 'rgb(29, 28, 25)', pal);
    check(`${label}: cards are the store's own (quick view, wishlist hooks)`, await p.evaluate(() => !!document.querySelector('.mh-na .card[data-pcard]') && !!document.querySelector('.mh-na .card__wish, .mh-na [data-open-quickview]')));

    // ticker
    check(`${label}: ticker list doubled for the loop`, await p.evaluate(() => document.querySelectorAll('.mh-tk__list').length === 2 && document.querySelectorAll('.mh-tk__list')[1].getAttribute('aria-hidden') === 'true'));
    await p.click('.mh-tk__toggle');
    check(`${label}: ticker pauses`, await p.evaluate(() => document.querySelector('.mh-tk').classList.contains('is-paused') && document.querySelector('.mh-tk__toggle').getAttribute('aria-pressed') === 'true'));

    // categories hover preview
    await to(p, '.mh-ct__row:nth-child(3)');
    const row = await p.$('.mh-ct__row:nth-child(3) .mh-ct__link'); const bb = await row.boundingBox();
    await p.mouse.move(bb.x + bb.width * .5, bb.y + bb.height / 2); await p.mouse.move(bb.x + bb.width * .55, bb.y + bb.height / 2, { steps: 4 }); await p.waitForTimeout(600);
    check(`${label}: category hover shows its photo`, await p.evaluate(() => { const r = document.querySelector('.mh-ct__row:nth-child(3)'); return r.classList.contains('is-active') && parseFloat(getComputedStyle(r.querySelector('.mh-ct__img')).opacity) > .9; }));
    await p.mouse.move(5, 5);

    // new arrivals tabs
    await to(p, '.mh-na__tabs');
    const before = await p.evaluate(() => [...document.querySelectorAll('.mh-na__item')].filter(x => !x.hidden).map(x => x.dataset.tab).join(''));
    await p.click('.mh-na__tab[data-tab="2"]'); await p.waitForTimeout(500);
    const after = await p.evaluate(() => ({ vis: [...document.querySelectorAll('.mh-na__item')].filter(x => !x.hidden).map(x => x.dataset.tab), sel: document.querySelector('.mh-na__tab[data-tab="2"]').getAttribute('aria-selected') }));
    check(`${label}: new arrivals tab switches the grid`, /^0+$/.test(before) && after.vis.length > 0 && after.vis.every(t => t === '2') && after.sel === 'true', JSON.stringify(after).slice(0, 80));
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(450);
    check(`${label}: tabs move with the arrow keys`, await p.evaluate(() => document.querySelector('.mh-na__tab[data-tab="1"]').getAttribute('aria-selected') === 'true'));

    // best sellers rail
    await to(p, '.mh-bs__nav');
    await p.click('.mh-bs [data-dir="1"]'); await p.waitForTimeout(900);
    const bs = await p.evaluate(() => ({ x: document.querySelector('.mh-bs__rail').scrollLeft, n: document.querySelector('.mh-bs [data-current]').textContent, prev: document.querySelector('.mh-bs [data-dir="-1"]').disabled }));
    check(`${label}: best-seller arrow scrolls, counter follows`, bs.x > 50 && bs.n === '02' && !bs.prev, JSON.stringify(bs));

    // shop the look
    await to(p, '.mh-sl__photo');
    await p.hover('.mh-sl__spot:nth-of-type(2)'); await p.waitForTimeout(200);
    check(`${label}: hotspot lights its piece`, await p.evaluate(() => document.querySelectorAll('.mh-sl__item')[1].classList.contains('is-active') && document.querySelectorAll('.mh-sl__spot')[1].getAttribute('aria-pressed') === 'true'));
    await p.evaluate(() => {
      window.__added = null;
      window.MN = window.MN || {}; MN.cart = MN.cart || {};
      MN.cart.add = items => { window.__added = items; return Promise.resolve({}); };
      document.querySelectorAll('.mh-sl__item').forEach((it, i) => { if (!it.querySelector('[data-variant]')) { const s = document.createElement('span'); s.hidden = true; s.dataset.variant = String(9000 + i); it.appendChild(s); } });
    });
    await p.click('.mh-sl__all'); await p.waitForTimeout(200);
    check(`${label}: "Add all" puts every piece in the bag`, await p.evaluate(() => Array.isArray(window.__added) && window.__added.length === 3 && window.__added.every(x => x.id && x.quantity === 1)));

    // countdown
    await to(p, '.mh-ld__count');
    const t1 = await p.evaluate(() => document.querySelector('.mh-ld [data-u="s"]').textContent); await p.waitForTimeout(1200);
    const t2 = await p.evaluate(() => document.querySelector('.mh-ld [data-u="s"]').textContent);
    check(`${label}: countdown ticks, release note waits`, t1 !== t2 && await p.evaluate(() => document.querySelector('.mh-ld [data-live]').hidden), `${t1} -> ${t2}`);

    // spotlight
    await to(p, '.mh-sp__ch:nth-child(3)'); await p.waitForTimeout(500);
    const sp = await p.evaluate(() => ({ n: document.querySelector('[data-numeral]').textContent, cur: [...document.querySelectorAll('.mh-sp__step')].findIndex(x => x.getAttribute('aria-current') === 'true'), steps: document.querySelectorAll('.mh-sp__step').length }));
    check(`${label}: spotlight panel follows the chapter in view`, sp.n === 'III' && sp.cur === 2 && sp.steps === 4, JSON.stringify(sp));

    // atelier figures
    await to(p, '.mh-cr__figs'); await p.waitForTimeout(1700);
    check(`${label}: figures count up to their values`, await p.evaluate(() => [...document.querySelectorAll('.mh-cr__val')].map(x => x.textContent).join(',') === '1987,64,4,38'));

    // lookbook
    await to(p, '.mh-lb__ctrl');
    const tr = await (await p.$('.mh-lb__track')).boundingBox();
    await p.mouse.move(tr.x + 700, tr.y + 200); await p.mouse.down(); await p.mouse.move(tr.x + 300, tr.y + 200, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(500);
    const lx = await p.evaluate(() => document.querySelector('.mh-lb__track').scrollLeft); // then it snaps to a frame
    await p.click('.mh-lb [data-dir="1"]'); await p.waitForTimeout(900);
    const lx2 = await p.evaluate(() => document.querySelector('.mh-lb__track').scrollLeft);
    check(`${label}: lookbook mouse drag and arrow scroll`, lx > 200 && lx2 > lx + 100, `${lx} -> ${lx2}`);

    // press
    await to(p, '.mh-pr__names');
    await p.click('.mh-pr__name:nth-child(3)'); await p.waitForTimeout(300);
    check(`${label}: press names switch the quote`, await p.evaluate(() => document.querySelectorAll('.mh-pr__q')[2].classList.contains('is-active') && document.querySelectorAll('.mh-pr__name')[2].getAttribute('aria-selected') === 'true' && document.querySelectorAll('.mh-pr__q.is-active').length === 1));

    // newsletter
    await to(p, '.mh-nl__row');
    await p.fill('.mh-nl__row input', 'not-an-email');
    const prevented = await p.evaluate(() => { const f = document.querySelector('.mh-nl__form'); let d = false; f.addEventListener('submit', e => { d = e.defaultPrevented; e.preventDefault(); }, { once: true }); f.requestSubmit(); return d; });
    check(`${label}: newsletter stops a bad address and says why`, prevented && await p.evaluate(() => { const m = document.querySelector('.mh-nl__msg'); return m.classList.contains('is-error') && m.textContent.trim().length > 5 && document.querySelector('.mh-nl__row input').getAttribute('aria-invalid') === 'true'; }));
    await p.fill('.mh-nl__row input', 'ada@example.com');
    const passes = await p.evaluate(() => { const f = document.querySelector('.mh-nl__form'); let d = true; f.addEventListener('submit', e => { d = e.defaultPrevented; e.preventDefault(); }, { once: true }); f.requestSubmit(); return !d; });
    check(`${label}: a good address goes to Shopify's form`, passes && await p.evaluate(() => !!document.querySelector('.mh-nl__form input[name="contact[tags]"][value="newsletter"]')));

    // theme editor: re-render each section twice; controls still work, one timer
    const sec = async sel => p.evaluate(sel => {
      for (let k = 0; k < 2; k++) {
        const host = document.querySelector(sel).closest('.shopify-section');
        host.dispatchEvent(new CustomEvent('shopify:section:unload', { bubbles: true, detail: { sectionId: host.id.replace(/^shopify-section-/, '') } }));
        const t = document.createElement('template'); t.innerHTML = host.outerHTML.replace(/ data-ready="1"/g, '');
        const fresh = t.content.firstElementChild; host.replaceWith(fresh);
        fresh.dispatchEvent(new CustomEvent('shopify:section:load', { bubbles: true, detail: { sectionId: fresh.id.replace(/^shopify-section-/, '') } }));
      }
      return true;
    }, sel);
    const ints = await p.evaluate(() => { let n = 0; const si = window.setInterval; window.setInterval = (...a) => { n++; return si(...a); }; window.__ints = () => n; return 0; });
    await sec('.mh-ld'); await sec('.mh-press, .mh-pr'); await sec('.mh-na');
    await p.waitForTimeout(400);
    check(`${label}: editor re-render: one countdown timer, press tabs rebuilt once`, await p.evaluate(() => window.__ints() === 2 && document.querySelectorAll('.mh-pr__name').length === document.querySelectorAll('.mh-pr__q').length), String(await p.evaluate(() => window.__ints())));
    await p.click('.mh-na__tab[data-tab="1"]'); await p.waitForTimeout(450);
    check(`${label}: editor re-render: tabs still switch`, await p.evaluate(() => [...document.querySelectorAll('.mh-na__item')].filter(x => !x.hidden).every(x => x.dataset.tab === '1')));
    await c.close();

    // widths: no sideways scroll; Motion Off: nothing waits for a scroll
    for (const w of [1440, 1024, 390]) {
      [p, c] = await open(dir, 'hm_maison', w);
      const wd = await p.evaluate(() => document.documentElement.scrollWidth);
      check(`${label} @${w}: no sideways scroll`, wd <= w, String(wd));
      await c.close();
    }
    [p, c] = await open(dir, 'hm_maison', 1440, 'reduced');
    check(`${label}: Motion Off shows every section at once`, await p.evaluate(() => [...document.querySelectorAll('.mh-reveal')].every(e => getComputedStyle(e).opacity === '1')));
    check(`${label}: Motion Off stops the ticker`, await p.evaluate(() => getComputedStyle(document.querySelector('.mh-tk__track')).animationName === 'none'));
    await c.close();
  }

  check('no page errors', errs.length === 0, errs.slice(0, 4).join(' | '));
  await b.close();
  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
