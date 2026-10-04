// Account pages in the design's language: sign in / reset switch, password
// show / hide, errors, guest checkout, orders (table and phone cards), one
// order, addresses (add / edit open in place, country -> province, delete
// confirmation), dark scheme, no sideways scroll on a phone.
//   python3 scripts/account-check.py OUT && node scripts/account-test.js OUT
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const routeFonts = require('./fonts-route');
const DIR = process.argv[2] || '.';
const ORIGIN = 'http://shop.test';
let ok = 0, bad = 0; const errs = [];
const check = (n, c, extra = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (extra ? '  ' + extra : '')); c ? ok++ : bad++; };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  async function open(name, w = 1440, hash = '') {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, isMobile: w < 500, hasTouch: w < 500 });
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    if (process.env.NOFONTS) await p.route('https://fonts.googleapis.com/**', r => r.abort()); else await routeFonts(p);
    await p.route(ORIGIN + '/**', r => {
      const f = path.join(DIR, new URL(r.request().url()).pathname);
      return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
    });
    await p.goto(`${ORIGIN}/${name}.html${hash}`); await p.waitForTimeout(350);
    return p;
  }
  const css = (p, sel, prop) => p.evaluate(([s, pr]) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[pr] : null; }, [sel, prop]);
  const vis = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && !!(e.offsetWidth || e.offsetHeight); }, sel);

  // ---- sign in
  let p = await open('ac_login');
  check('title in the display face', /Newsreader/.test(await css(p, '.mn-auth__login .section-title', 'fontFamily')));
  check('fields are the design input', (await css(p, '.mn-auth__login .input', 'borderTopLeftRadius')) !== '0px' && (await css(p, '.mn-auth__login .input', 'color')) === 'rgb(26, 26, 26)');
  check('sign in shown, reset hidden', await vis(p, '.mn-auth__login form') && !(await vis(p, '#recover')));
  check('no guest checkout unless the store allows it', await p.locator('[data-form="guest_login"]').count() === 0);
  await p.fill('#LoginPassword-main', 'secret');
  await p.click('[data-pw-toggle]');
  check('show password reveals it', (await p.getAttribute('#LoginPassword-main', 'type')) === 'text' && (await p.getAttribute('[data-pw-toggle]', 'aria-pressed')) === 'true');
  await p.click('[data-pw-toggle]');
  check('hide password masks it again', (await p.getAttribute('#LoginPassword-main', 'type')) === 'password');
  await p.click('[data-auth-recover]'); await p.waitForTimeout(150);
  check('Forgot password swaps in the reset form', await vis(p, '#recover form') && !(await vis(p, '.mn-auth__login form')));
  check('reset form posts recover_customer_password with an email field', await p.locator('#recover [data-form="recover_customer_password"] input[name="email"]').count() === 1);
  check('focus moves to the reset email', await p.evaluate(() => document.activeElement && document.activeElement.name === 'email'));
  await p.click('[data-auth-login]'); await p.waitForTimeout(150);
  check('Back to sign in returns', await vis(p, '.mn-auth__login form'));
  check('side panel with perks and register link', await p.locator('.mn-auth__perks li').count() === 3 && await p.locator('.mn-auth__side a[href="/account/register"]').count() === 1);
  await p.close();
  p = await open('ac_login', 1440, '#recover');
  check('/account/login#recover opens the reset form', await vis(p, '#recover form') && !(await vis(p, '.mn-auth__login form')));
  await p.close();
  p = await open('ac_login_error');
  check('login error shown in the design alert', (await p.textContent('.mn-auth__login .mn-alert--error')).includes('Incorrect'));
  await p.close();
  p = await open('ac_login_sent');
  check('reset email sent: confirmation on the sign-in view', await vis(p, '.mn-auth__login .mn-alert--ok'));
  await p.close();
  p = await open('ac_login_guest');
  check('guest checkout button when allowed', await p.locator('[data-form="guest_login"] .mn-btn').count() === 1);
  await p.close();
  p = await open('ac_login_image');
  check('panel image with light text', await p.locator('.mn-auth__img').count() === 1 && (await css(p, '.mn-auth__side[data-has-image] .mn-auth__panel', 'color')) === 'rgb(255, 255, 255)');
  await p.close();

  // ---- register / activate / reset
  p = await open('ac_register');
  check('register: names, email, password, newsletter', await p.locator('[name="customer[first_name]"], [name="customer[last_name]"], [name="customer[email]"], [name="customer[password]"], [name="customer[accepts_marketing]"]').count() === 5);
  check('register: small print', (await p.textContent('.mn-auth__fine')).includes('privacy'));
  await p.close();
  p = await open('ac_register_error');
  check('register: both errors listed', await p.locator('.mn-alert--error li').count() === 2);
  await p.close();
  p = await open('ac_activate');
  check('activate: password, confirm, activate and decline', await p.locator('[name="customer[password]"], [name="customer[password_confirmation]"]').count() === 2 && await p.locator('button[name="decline"]').count() === 1);
  await p.close();
  p = await open('ac_reset');
  check('reset: password and confirm', await p.locator('[data-form="reset_customer_password"] .mn-pw').count() === 2);
  await p.close();

  // ---- account
  p = await open('ac_account');
  check('greeting with the first name', (await p.textContent('.mn-acct__head .section-title')).includes('Ajay'));
  check('nav: orders current, addresses, wishlist, log out', (await p.textContent('.mn-acct__nav [aria-current]')).includes('Order') && await p.locator('.mn-acct__nav a').count() === 4);
  check('three order rows linking to the orders', await p.locator('a.mn-orders__row').count() === 3 && (await p.getAttribute('a.mn-orders__row', 'href')) === '/account/orders/o1');
  check('status badges', await p.locator('.mn-status--paid').count() === 1 && await p.locator('.mn-status--refunded').count() === 1);
  check('default address card', (await p.textContent('.mn-acct__aside .mn-acct__address')).includes('Spiga'));
  check('card titles in the sans face', /Geist/.test(await css(p, '.mn-acct__card-title', 'fontFamily')));
  await p.click('.mn-acct__nav [data-open="ov-wish"]'); await p.waitForTimeout(500);
  check('Wishlist opens the wishlist drawer', await p.evaluate(() => document.getElementById('ov-wish').classList.contains('is-open')));
  await p.close();
  p = await open('ac_account', 390);
  check('phone: orders become cards', (await css(p, '.mn-orders__row--head', 'display')) === 'none' && parseFloat(await css(p, 'a.mn-orders__row', 'borderTopLeftRadius')) > 0);
  check('phone: nav is a row of pills', (await css(p, '.mn-acct__nav', 'display')) === 'flex');
  await p.close();
  p = await open('ac_account_empty');
  check('no orders: empty state with a button', await p.locator('.mn-acct__empty .mn-btn').count() === 1);
  await p.close();

  // ---- order
  p = await open('ac_order');
  check('order: two lines, tracking link, line discount', await p.locator('.mn-order__line').count() === 2 && await p.locator('.mn-order__ship a[href*="track"]').count() === 1 && (await p.textContent('.mn-order__lines')).includes('WELCOME10'));
  check('order: summary rows and total', (await p.textContent('.mn-order__total')).includes('1,395') && (await p.textContent('.mn-order__rows')).includes('First order'));
  check('order: addresses and note', await p.locator('.mn-order__aside .mn-acct__address').count() === 2 && (await p.textContent('.mn-order__aside')).includes('gift wrap'));
  await p.close();
  p = await open('ac_order_cancelled');
  check('cancelled order: notice and refund row', (await p.textContent('.mn-alert--error')).includes('cancelled') && (await p.textContent('.mn-order__rows')).includes('Refunded'));
  await p.close();

  // ---- addresses
  p = await open('ac_addresses');
  check('two address cards, default badge first', await p.locator('.mn-addr__card').count() === 2 && await p.locator('.mn-addr__card').first().locator('.badge').count() === 1);
  check('add form starts closed', !(await vis(p, '#AddrNew')));
  await p.click('.mn-acct__head [data-acct-toggle="AddrNew"]'); await p.waitForTimeout(250);
  check('Add new address opens the form', await vis(p, '#AddrNew') && (await p.getAttribute('.mn-acct__head [data-acct-toggle]', 'aria-expanded')) === 'true');
  check('country and province are design selects', await p.locator('#AddrNew .cselect').count() === 2);
  check('province hidden for a country without provinces (Italy)', !(await vis(p, '#AddrNew select[name="address[province]"]') || await vis(p, '#address-province-new')) && await p.evaluate(() => document.querySelector('#address-province-new').closest('.form-field').hidden));
  await p.evaluate(() => { const s = document.querySelector('#address-country-new'); s.value = 'Canada'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(200);
  check('choosing Canada fills and shows provinces', await p.evaluate(() => { const s = document.querySelector('#address-province-new'); return s.options.length === 3 && !s.closest('.form-field').hidden; }));
  await p.click('#AddrNew [data-acct-toggle="AddrNew"]'); await p.waitForTimeout(150);
  check('Cancel closes the add form', !(await vis(p, '#AddrNew')));
  await p.click('#address-12 [data-acct-toggle="AddrEdit-12"]'); await p.waitForTimeout(250);
  check('Edit opens that address form, full width', await vis(p, '#AddrEdit-12') && await p.evaluate(() => document.getElementById('address-12').classList.contains('is-editing')));
  check('edit form prefilled, saved country and province chosen', (await p.inputValue('#address1-12')) === '210 Spring Street' && (await p.evaluate(() => [document.querySelector('#address-country-12').value, document.querySelector('#address-province-12').value].join('|'))) === 'United States|New York');
  let asked = 0; p.on('dialog', d => { asked++; d.dismiss(); });
  let submitted = false; await p.exposeFunction('__submitted', () => { submitted = true; });
  await p.evaluate(() => document.querySelectorAll('.mn-addr__delete').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); window.__submitted(); })));
  await p.click('#address-12 .mn-addr__del'); await p.waitForTimeout(200);
  check('Delete asks first, and dismissing keeps the address', asked === 1 && !submitted);
  await p.close();
  p = await open('ac_addresses_error');
  check('add form returned with errors stays open', await vis(p, '#AddrNew') && await p.locator('#AddrNew .mn-alert--error').count() === 1);
  await p.close();
  p = await open('ac_addresses_empty');
  check('no addresses: empty state', await p.locator('.mn-acct__empty').count() === 1);
  await p.close();

  // ---- dark
  p = await open('ac_account_dark');
  check('dark scheme: page dark, title light', (await css(p, '.mn-acct', 'backgroundColor')) === 'rgb(10, 10, 10)' && (await css(p, '.mn-acct__head .section-title', 'color')) === 'rgb(245, 240, 232)');
  await p.close();
  p = await open('ac_login_dark');
  check('dark scheme: inputs follow the scheme', (await css(p, '.mn-auth__login .input', 'color')) === 'rgb(245, 240, 232)');
  await p.close();

  // ---- phone
  const all = fs.readdirSync(DIR).filter(f => /^ac_.*\.html$/.test(f)).map(f => f.replace('.html', ''));
  const wide = [];
  for (const n of all) {
    p = await open(n, 390);
    const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth));
    if (w > 390) wide.push(`${n}:${w}`);
    await p.close();
  }
  check(`no page wider than 390 (${all.length} pages)`, wide.length === 0, wide.join(' '));

  check('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
