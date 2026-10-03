// Header (F5): every style x mega layout x images, rendered by
// scripts/header-check.py. Menus open on hover and keyboard, close on
// leave / Escape / outside click, flyouts stay on screen, the mobile
// submenus open (they never could), hide-on-scroll, content offset, and
// no sideways scroll at phone width.
//   python3 scripts/header-check.py OUT && node scripts/header-test.js OUT
const { chromium } = require('playwright');
const path = require('path');
const dir = process.argv[2] || '.';
const TOKENS = ':root{--dur-1:160ms;--dur-2:280ms;--dur-3:440ms}';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let ok = 0, bad = 0; const errs = [];
  const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); c ? ok++ : bad++; };
  const page = async (f, w = 1440, opts = {}) => {
    const p = await b.newPage({ viewport: { width: w, height: 820 }, ...opts });
    p.on('pageerror', e => errs.push(f + ': ' + e.message));
    await p.goto('file://' + path.resolve(dir, f + '.html'));
    await p.addStyleTag({ content: TOKENS }); await p.waitForTimeout(250);
    return p;
  };
  const panelState = p => p.evaluate(() => {
    const it = [...document.querySelectorAll('.has-megamenu')].find(i => i.textContent.includes('Women'));
    const m = it.querySelector('.mega-menu'); const r = m.getBoundingClientRect(); const cs = getComputedStyle(m);
    return { open: it.classList.contains('is-open'), vis: cs.visibility, op: +cs.opacity, l: Math.round(r.left), r: Math.round(r.right), aria: it.querySelector('.site-nav__link').getAttribute('aria-expanded') };
  });

  for (const style of ['v1', 'v2', 'v4']) for (const mega of ['v1', 'v2', 'v3']) for (const im of ['img', 'txt']) {
    const f = `hd_${style}_${mega}_${im}`; const p = await page(f);
    await p.hover('.site-nav__link:has-text("Women")'); await p.waitForTimeout(650);
    const s = await panelState(p);
    const inView = s.l >= 0 && s.r <= 1440;
    await p.mouse.move(700, 790); await p.waitForTimeout(700);
    const c = await panelState(p);
    check(`${f}: hover opens, on screen, leave closes`, s.open && s.vis === 'visible' && s.op > .95 && s.aria === 'true' && inView && !c.open && c.vis === 'hidden', `open[${s.l},${s.r}] closed=${!c.open}`);
    await p.close();
  }

  // Keyboard and Escape
  let p = await page('hd_v1_v3_img');
  await p.focus('.site-nav__link:has-text("Women")'); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(300);
  const focusIn = await p.evaluate(() => !!document.activeElement.closest('.mega-menu'));
  check('keyboard: ArrowDown opens and moves focus into the panel', (await panelState(p)).open && focusIn);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  check('Escape closes and returns focus to the menu link', !(await panelState(p)).open && await p.evaluate(() => document.activeElement.classList.contains('site-nav__link')));
  // Flyout panes switch
  await p.hover('.site-nav__link:has-text("Women")'); await p.waitForTimeout(500);
  await p.hover('.has-megamenu.is-open [data-flyout-item="2"]'); await p.waitForTimeout(200);
  check('flyout: hovering a submenu shows its links', await p.evaluate(() => document.querySelector('.has-megamenu.is-open .flyout__pane.is-current .flyout__heading').textContent.trim() === 'Bags'));
  await p.mouse.click(700, 790); await p.waitForTimeout(100);
  check('outside click closes', !(await panelState(p)).open);
  await p.close();

  // Touch: first tap opens instead of navigating
  p = await page('hd_v1_v1_img', 1280, { hasTouch: true, isMobile: false });
  const url0 = p.url();
  await p.tap('.site-nav__link:has-text("Women")'); await p.waitForTimeout(400);
  check('touch: first tap opens the panel, does not navigate', p.url() === url0 && (await panelState(p)).open);
  await p.close();

  // Mobile menu and submenus (were unopenable)
  for (const style of ['v1', 'v2', 'v3', 'v4']) {
    p = await page(`hd_${style}_v1_img`, 390);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await p.click('.header-burger'); await p.waitForTimeout(500);
    await p.click('.mobile-menu__toggle:has-text("Women")'); await p.waitForTimeout(450);
    await p.click('#mobile-menu .mobile-menu__toggle--child:has-text("Shoes")'); await p.waitForTimeout(450);
    const st = await p.evaluate(() => ({ menu: document.getElementById('mobile-menu').classList.contains('is-open'),
      sub: document.getElementById('mobile-sub-2').classList.contains('is-open'),
      deep: [...document.querySelectorAll('.mobile-menu__subnav--deep.is-open a')].map(a => a.textContent.trim()).join(',') }));
    check(`${style} phone: no sideways scroll, menu + submenu + sub-submenu open`, overflow <= 0 && st.menu && st.sub && st.deep.includes('Boots'), `overflow=${overflow} deep=${st.deep}`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    check(`${style} phone: Escape closes the drawer`, !(await p.evaluate(() => document.getElementById('mobile-menu').classList.contains('is-open'))));
    await p.close();
  }

  // Content offset follows the header
  for (const f of ['hd_v1_v1_img', 'hd_v2_v1_img', 'hd_v4_v1_img']) {
    p = await page(f);
    const r = await p.evaluate(() => { const h = document.querySelector('.site-header').getBoundingClientRect(); const m = document.querySelector('main section').getBoundingClientRect(); return [Math.round(h.bottom), Math.round(m.top)]; });
    check(`${f}: content starts below the header`, r[1] >= r[0] && r[1] - r[0] <= 2, `header bottom ${r[0]}, content ${r[1]}`);
    await p.close();
  }
  p = await page('hd_transparent');
  check('transparent homepage: hero runs under the header', await p.evaluate(() => document.querySelector('main').getBoundingClientRect().top === 0 && getComputedStyle(document.querySelector('.content-for-layout')).paddingTop === '0px'));
  await p.close();

  // Hide on scroll
  p = await page('hd_hide');
  await p.mouse.wheel(0, 900); await p.waitForTimeout(600);
  const hidden = await p.evaluate(() => [document.querySelector('.site-header').classList.contains('is-hidden'), getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim()]);
  await p.mouse.wheel(0, -200); await p.waitForTimeout(600);
  const back = await p.evaluate(() => [document.querySelector('.site-header').classList.contains('is-hidden'), getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim()]);
  check('hide on scroll: hides going down, returns going up, --header-h follows', hidden[0] && hidden[1] === '0px' && !back[0] && back[1] !== '0px', `${hidden} / ${back}`);
  await p.close();

  await b.close();
  console.log(`\n${ok} passed, ${bad} failed. JS errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  process.exit(bad ? 1 : 0);
})();
