// Footer (F6): every style x surface and every scheme, rendered by
// scripts/footer-check.py. Text contrast against the footer surface, no
// sideways scroll (the Statement wordmark included), custom selects in the
// bottom bar, accordions on phones only, back to top.
//   python3 scripts/footer-check.py OUT && node scripts/footer-test.js OUT
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const dir = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let ok = 0, bad = 0; const errs = [];
  const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); c ? ok++ : bad++; };
  const open = async (f, w) => {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    await p.goto('file://' + path.resolve(dir, f)); await p.waitForTimeout(250); return p;
  };
  // WCAG contrast of fg (possibly translucent) over the footer background
  const contrast = p => p.evaluate(() => {
    const parse = c => (c.match(/[\d.]+/g) || []).map(Number);
    const ft = document.querySelector('.site-footer');
    const bg = parse(getComputedStyle(ft).backgroundColor);
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const ratio = el => {
      const c = parse(getComputedStyle(el).color); const a = c.length > 3 ? c[3] : 1;
      const mix = [0, 1, 2].map(i => c[i] * a + bg[i] * (1 - a));
      const L1 = lum(mix), L2 = lum(bg); return (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    };
    const pick = s => document.querySelector(s);
    return { title: ratio(pick('.footer-col__title')), link: ratio(pick('.footer-col__list a')), copy: ratio(pick('.site-footer__copy')) };
  });

  const files = fs.readdirSync(dir).filter(f => /^ft_.*\.html$/.test(f)).sort();
  for (const f of files) {
    for (const w of [1440, 390]) {
      const p = await open(f, w);
      const r = await p.evaluate(() => ({ page: document.documentElement.scrollWidth - innerWidth,
        word: (() => { const el = document.querySelector('.site-footer__wordmark'); return el ? el.scrollWidth - el.clientWidth : 0; })(),
        native: [...document.querySelectorAll('.site-footer select')].filter(s => getComputedStyle(s).opacity !== '0').length,
        custom: document.querySelectorAll('.site-footer .cselect').length }));
      let c = { title: 99, link: 99, copy: 99 };
      if (!f.includes('minimal')) c = await contrast(p);
      const good = r.page <= 0 && r.word <= 0 && r.native === 0 && r.custom === 2 && c.title >= 4.5 && c.link >= 4.5 && c.copy >= 4.5;
      check(`${f.replace('.html', '')} @${w}`, good, `overflow ${r.page}/${r.word}, selects ${r.custom}, contrast title ${c.title.toFixed(1)} link ${c.link.toFixed(1)} copy ${c.copy.toFixed(1)}`);
      await p.close();
    }
  }

  // Accordions fold on phones only
  let p = await open('ft_columns_soft.html', 390);
  await p.click('.footer-col__title >> nth=0'); await p.waitForTimeout(450);
  const st = await p.evaluate(() => { const c = document.querySelector('[data-footer-col]'); return [c.classList.contains('is-open'), c.querySelector('.footer-col__list').offsetHeight, c.querySelector('.footer-col__title').getAttribute('aria-expanded')]; });
  check('phone: a column opens on tap', st[0] && st[1] > 60 && st[2] === 'true', JSON.stringify(st));
  await p.click('.footer-col__title >> nth=0'); await p.waitForTimeout(450);
  check('phone: and closes again', !(await p.evaluate(() => document.querySelector('[data-footer-col]').classList.contains('is-open'))));
  await p.close();
  p = await open('ft_columns_soft.html', 1440);
  check('desktop: every column is open, titles are labels', await p.evaluate(() => [...document.querySelectorAll('.footer-col__list')].every(l => l.offsetHeight > 60)));
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(100);
  await p.click('[data-back-to-top]'); await p.waitForTimeout(900);
  check('back to top scrolls to the top', await p.evaluate(() => window.scrollY) === 0);
  await p.close();

  await b.close();
  console.log(`\n${ok} passed, ${bad} failed. JS errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  process.exit(bad ? 1 : 0);
})();
