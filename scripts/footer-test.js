// Footer (design build): every style x surface and every scheme, rendered by
// scripts/footer-check.py. Each style shows only its parts; text contrast
// against the footer surface; no sideways scroll (the Statement wordmark is
// fitted); localization selects enhanced; accordions on phones only; back to top.
//   python3 scripts/footer-check.py OUT && node scripts/footer-test.js OUT
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const dir = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let ok = 0, bad = 0; const errs = [];
  const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); c ? ok++ : bad++; };
  const open = async (f, w) => {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, ignoreHTTPSErrors: true });
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    await p.route('https://fonts.googleapis.com/**', r => r.abort());
    await p.goto('file://' + path.resolve(dir, f)); await p.waitForTimeout(300); return p;
  };
  const files = fs.readdirSync(dir).filter(f => /^ft_.*\.html$/.test(f)).sort();
  for (const f of files) {
    const style = f.includes('statement') ? 'statement' : f.includes('minimal') ? 'minimal' : 'columns';
    for (const w of [1440, 390]) {
      const p = await open(f, w);
      const r = await p.evaluate(() => {
        // canvas turns any CSS colour (oklab, color-mix…) into rgba bytes
        const cx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        const parse = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
        const ft = document.querySelector('.site-footer');
        const bg = parse(getComputedStyle(ft).backgroundColor);
        const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
        const ratio = el => {
          if (!el || !el.offsetParent) return 99;
          const c = parse(getComputedStyle(el).color); const a = c[3];
          const mix = [0, 1, 2].map(i => c[i] * a + bg[i] * (1 - a));
          const L1 = lum(mix), L2 = lum(bg); return (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
        };
        const vis = s => { const el = document.querySelector(s); return !!el && getComputedStyle(el).display !== 'none' && el.offsetHeight > 0; };
        const wm = document.querySelector('.footer__wordmark span');
        return {
          page: document.documentElement.scrollWidth - innerWidth,
          word: wm && wm.offsetParent ? Math.round(wm.getBoundingClientRect().right - innerWidth) : -1,
          native: [...ft.querySelectorAll('select')].filter(s => getComputedStyle(s).opacity !== '0' && s.offsetParent).length,
          custom: ft.querySelectorAll('.select.cselect').length,
          parts: { band: vis('.footer__band'), brand: vis('.footer__desc'), cols: vis('.footer__cols'), linkrow: vis('.footer__linkrow'), wordmark: vis('.footer__wordmark') },
          c: { title: ratio(ft.querySelector('.footer__col .acc__trigger')), link: ratio(ft.querySelector('.footer__col a')), copy: ratio(ft.querySelector('.footer__bottom > span')), row: ratio(ft.querySelector('.footer__linkrow a')) }
        };
      });
      const want = { columns: { band: false, cols: true, linkrow: false, wordmark: false }, statement: { band: true, cols: true, wordmark: true }, minimal: { band: false, cols: false, linkrow: true, wordmark: false } }[style];
      const partsOk = Object.entries(want).every(([k, v]) => r.parts[k] === v);
      const cMin = Math.min(...Object.values(r.c));
      const good = r.page <= 0 && r.word <= 0 && r.native === 0 && r.custom === 2 && partsOk && cMin >= 4.5;
      check(`${f.replace('.html', '')} @${w}`, good, `overflow ${r.page}/${r.word}, selects ${r.custom}/${r.native}, parts ${JSON.stringify(r.parts)}, min contrast ${cMin.toFixed(1)}`);
      await p.close();
    }
  }

  // Accordions fold on phones only
  let p = await open('ft_columns_soft.html', 390);
  const t = '.footer__col >> nth=0 >> .acc__trigger';
  await p.click(t); await p.waitForTimeout(500);
  const st = await p.evaluate(() => { const c = document.querySelector('.footer__col'); return [c.classList.contains('is-open'), c.querySelector('.acc__panel').offsetHeight, c.querySelector('.acc__trigger').getAttribute('aria-expanded')]; });
  check('phone: a column opens on tap', st[0] && st[1] > 60 && st[2] === 'true', JSON.stringify(st));
  await p.click(t); await p.waitForTimeout(500);
  check('phone: and closes again', !(await p.evaluate(() => document.querySelector('.footer__col').classList.contains('is-open'))));
  await p.close();
  p = await open('ft_columns_soft.html', 1440);
  check('desktop: every column is open, titles are labels', await p.evaluate(() => [...document.querySelectorAll('.footer__col .acc__panel')].every(l => l.offsetHeight > 60)));
  await p.click('.footer__col >> nth=0 >> .acc__trigger').catch(() => {}); await p.waitForTimeout(400);
  check('desktop: clicking a title does not fold it', await p.evaluate(() => document.querySelector('.footer__col .acc__panel').offsetHeight > 60));
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(150);
  await p.click('#toTop'); await p.waitForTimeout(1200);
  check('back to top scrolls to the top', await p.evaluate(() => window.scrollY) === 0);
  await p.click('.footer__selects .select__trigger >> nth=0'); await p.waitForTimeout(350);
  check('country select opens its list', await p.evaluate(() => document.querySelector('.footer__selects .select').classList.contains('is-open')));
  await p.close();

  await b.close();
  console.log(`\n${ok} passed, ${bad} failed. JS errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  process.exit(bad ? 1 : 0);
})();
