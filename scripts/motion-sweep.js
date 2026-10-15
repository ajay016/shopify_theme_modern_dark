// Reduced motion, as the theme settings promise it:
//   Motion: Off                       -> nothing animates, everything is visible
//   Strict + device "reduce motion"   -> the same
//   Gentle + device "reduce motion"   -> animations stay, scroll reveals fade in
//                                        place (no travel, no blur)
// Pages come from the harness output (ROOT, as for scheme-test); the <html>
// data-motion attribute is set the way snippets/mn-html-attrs sets it.
//   node scripts/motion-sweep.js ROOT
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || '.';
let ok = 0, bad = 0; const errs = [];
const check = (n, c, extra = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (extra ? '  ' + extra : '')); c ? ok++ : bad++; };
const PAGES = [['hm', 'hm_default'], ['hm', 'hm_atelier'], ['t_pdp', 'pdp_default'], ['t_collection', 'cl_sidebar'], ['t_content', 'ct_blog']];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  async function open(dir, page, motion, reduce) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(`${page}: ${e.message}`));
    await p.route('https://**', r => r.abort());
    await p.route('http://shop.test/**', r => {
      const f = path.join(ROOT, dir, new URL(r.request().url()).pathname);
      if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return r.fulfill({ status: 404, body: '' });
      if (!f.endsWith('.html')) return r.fulfill({ path: f });
      let html = fs.readFileSync(f, 'utf8');
      html = /data-motion="[^"]*"/.test(html) ? html.replace(/data-motion="[^"]*"/, `data-motion="${motion}"`) : html.replace('<html', `<html data-motion="${motion}"`);
      if (motion === 'system') html = html.replace('<html', '<html class="motion-strict"');
      return r.fulfill({ body: html, contentType: 'text/html' });
    });
    await p.goto(`http://shop.test/${page}.html`); await p.waitForTimeout(700);
    return [p, ctx];
  }
  const probe = p => p.evaluate(() => {
    const below = [...document.querySelectorAll('.reveal, [class*="reveal"]')].filter(el => el.getBoundingClientRect().top > innerHeight + 50);
    const hidden = below.filter(el => parseFloat(getComputedStyle(el).opacity) < .99).length;
    const moving = below.filter(el => { const cs = getComputedStyle(el); return (cs.transform !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(cs.transform)) || (cs.filter !== 'none' && cs.filter !== ''); }).map(el => el.className.toString().split(' ')[0]);
    const animated = [...document.querySelectorAll('body *')].filter(el => { const cs = getComputedStyle(el); const on = d => parseFloat(d) * (/ms$/.test(d.trim()) ? .001 : 1) > .002; // 1ms is the theme's "instant": transitionend still fires
      return cs.transitionDuration.split(',').some(on) || (cs.animationName !== 'none' && cs.animationDuration.split(',').some(on) && cs.animationPlayState === 'running'); }).length;
    return { below: below.length, hidden, moving: [...new Set(moving)], animated };
  });

  for (const [dir, page] of PAGES) {
    if (!fs.existsSync(path.join(ROOT, dir, page + '.html'))) { check(`${page}: present`, false); continue; }
    let [p, c] = await open(dir, page, 'full', false);
    const base = await probe(p); await c.close();
    if (dir === 'hm') check(`${page}: baseline has reveals below the fold that travel`, base.below > 0 && base.moving.length > 0, `${base.below} below, moving: ${base.moving.slice(0, 4).join(' ')}`);

    [p, c] = await open(dir, page, 'reduced', false);
    let r = await probe(p); await c.close();
    check(`${page}: Motion Off — nothing hidden waiting for a scroll`, r.hidden === 0, `${r.hidden} of ${r.below} hidden`);
    check(`${page}: Motion Off — nothing animates`, r.animated === 0, `${r.animated} elements still transition`);

    [p, c] = await open(dir, page, 'system', true);
    r = await probe(p); await c.close();
    check(`${page}: Strict + device reduce — nothing hidden`, r.hidden === 0, `${r.hidden} of ${r.below} hidden`);
    check(`${page}: Strict + device reduce — nothing animates`, r.animated === 0, `${r.animated} elements still transition`);

    [p, c] = await open(dir, page, 'full', true);
    r = await probe(p); await c.close();
    check(`${page}: Gentle + device reduce — reveals fade in place (no travel or blur)`, r.moving.length === 0, r.moving.slice(0, 6).join(' '));
  }
  check('no page errors', errs.length === 0, errs.slice(0, 4).join(' | '));
  await b.close();
  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
