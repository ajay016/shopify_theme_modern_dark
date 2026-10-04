// Content pages in the design's language: journal (grid, list, masonry,
// sidebar, topics, empty), article (sidebars, share, pager, comments, more),
// page (standard, editorial), contact (split, centred, sent, error), 404,
// password and gift card; dark scheme; no sideways scroll on a phone.
//   python3 scripts/content-check.py OUT && node scripts/content-test.js OUT
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
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 500, hasTouch: w < 500, permissions: ['clipboard-read', 'clipboard-write'] });
    const p = await ctx.newPage();
    await p.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__clip = t; return Promise.resolve(); }, readText: () => Promise.resolve(window.__clip || '') } }); });
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    if (process.env.NOFONTS) await p.route('https://fonts.googleapis.com/**', r => r.abort()); else await routeFonts(p);
    await p.route(ORIGIN + '/**', r => {
      const f = path.join(DIR, new URL(r.request().url()).pathname);
      return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
    });
    await p.goto(`${ORIGIN}/${name}.html`); await p.waitForTimeout(350);
    return p;
  }
  const css = (p, sel, prop) => p.evaluate(([s, pr]) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[pr] : null; }, [sel, prop]);
  const cols = (p, sel) => p.evaluate(s => getComputedStyle(document.querySelector(s)).gridTemplateColumns.split(' ').length, sel);

  // ---- journal
  let p = await open('ct_blog');
  check('journal title in the display face', /Newsreader/.test(await css(p, '.mn-blog .section-title', 'fontFamily')));
  check('topic chips, All current', await p.locator('.mn-blog__tags .chip').count() === 5 && (await p.textContent('.mn-blog__tags [aria-current]')).trim() === 'All');
  check('five posts, three columns, first featured over two', await p.locator('.mn-post').count() === 5 && await cols(p, '.mn-blog__posts') === 3 && await p.locator('.mn-post--featured').count() === 1);
  check('post without an image shows a placeholder initial', await p.locator('.mn-post__ph').count() === 1);
  check('excerpt falls back to the content, with spaces between paragraphs', !(await p.textContent('.mn-post:nth-child(2) .mn-post__excerpt')).includes('wear.Wash'));
  check('author and read more', (await p.textContent('.mn-post')).includes('By Clara Rossi') && await p.locator('.mn-post .link-arrow').count() === 5);
  await p.close();
  p = await open('ct_blog_list');
  check('list layout: one column of rows, nothing featured', await cols(p, '.mn-blog__posts') === 1 && await p.locator('.mn-post--featured').count() === 0);
  await p.close();
  p = await open('ct_blog_masonry');
  check('masonry with sidebar: columns + search + recent', (await css(p, '.mn-blog__posts', 'columnCount')) === '2' && await p.locator('.mn-blog__aside .mn-blog__recent li').count() === 4 && await p.locator('.mn-blog__search input[name=q]').count() === 1);
  await p.close();
  p = await open('ct_blog_tag');
  check('tagged view: title carries the topic, chip current', (await p.textContent('.mn-blog .section-title')).includes('Care') && (await p.textContent('.mn-blog__tags [aria-current]')).trim() === 'Care');
  await p.close();
  p = await open('ct_blog_empty');
  check('empty journal message', await p.locator('.mn-blog .mn-acct__empty').count() === 1);
  await p.close();

  // ---- article
  p = await open('ct_article');
  check('article: breadcrumb, eyebrow, title, dek, byline', await p.locator('.mn-article .mn-breadcrumb [aria-current]').count() === 1 && /Newsreader/.test(await css(p, '.mn-article__title', 'fontFamily')) && (await p.textContent('.mn-article__byline')).includes('min read'));
  check('reading column at most 68ch and centred', parseFloat(await css(p, '.mn-article__main', 'maxWidth')) < 800);
  check('prose: display headings, accent quote', /Newsreader/.test(await css(p, '.mn-prose h2', 'fontFamily')) && (await css(p, '.mn-prose blockquote', 'borderLeftStyle')) === 'solid');
  check('share: copy, Facebook, X, Pinterest, email', await p.locator('.mn-article__share .icon-btn').count() === 5);
  await p.click('[data-copy-link]'); await p.waitForTimeout(300);
  check('copy link copies the article URL and confirms', (await p.evaluate(() => navigator.clipboard.readText())).includes('/blogs/journal/1') && (await p.textContent('#mnToast')).includes('copied'));
  check('previous / next stories', await p.locator('.mn-article__pager a').count() === 2);
  check('comments listed, form in design fields, moderation note', await p.locator('.mn-comment').count() === 2 && await p.locator('.mn-comment-form .input').count() === 3 && (await p.textContent('.mn-comment-form')).includes('reviewed'));
  check('more from the journal: three cards without the current one', await p.locator('.mn-article__more .mn-post').count() === 3 && !(await p.textContent('.mn-article__more')).includes('Caring for silk'));
  await p.close();
  p = await open('ct_article_left');
  check('left sidebar sits left of the text', await p.evaluate(() => document.querySelector('.mn-article__aside').getBoundingClientRect().x < document.querySelector('.mn-article__main').getBoundingClientRect().x));
  await p.close();
  p = await open('ct_article_right');
  check('right sidebar sits right of the text, wide column', await p.evaluate(() => document.querySelector('.mn-article__aside').getBoundingClientRect().x > document.querySelector('.mn-article__main').getBoundingClientRect().x));
  await p.close();
  p = await open('ct_article_posted');
  check('posted comment: moderation thank-you', (await p.textContent('.mn-comment-form .mn-alert--ok')).includes('approved'));
  await p.close();
  p = await open('ct_article_noimg');
  check('no image, comments off: no hero, no comments', await p.locator('.mn-article__hero').count() === 0 && await p.locator('#comments').count() === 0);
  await p.close();

  // ---- page
  p = await open('ct_page');
  check('standard page: breadcrumb, title, prose', await p.locator('.mn-page .mn-breadcrumb').count() === 1 && await p.locator('.mn-page .mn-prose h2').count() === 1);
  await p.close();
  p = await open('ct_page_v2');
  check('editorial page: centred hero title, eyebrow, no breadcrumb', (await css(p, '.mn-page--v2 .mn-content__head', 'textAlign')) === 'center' && await p.locator('.mn-page .mn-breadcrumb').count() === 0 && (await p.textContent('.mn-page .mn-eyebrow')).includes('Maison'));
  await p.close();

  // ---- contact
  p = await open('ct_contact');
  check('contact: details with links, email linked automatically', await p.locator('.mn-contact__detail').count() === 3 && (await p.getAttribute('.mn-contact__detail a', 'href')) === 'mailto:care@maisonnoir.example' && await p.locator('a[href^="tel:"]').count() === 1);
  check('contact form: name, email, subject, order, message', await p.locator('[name="contact[name]"], [name="contact[email]"], [name="contact[subject]"], [name="contact[order]"], [name="contact[body]"]').count() === 5);
  check('form beside the details', await p.evaluate(() => document.querySelector('.mn-contact__form').getBoundingClientRect().x > 600));
  await p.close();
  p = await open('ct_contact_centered');
  check('centred: form only, no details', await p.locator('.mn-contact__detail').count() === 0 && (await css(p, '.mn-contact__info', 'textAlign')) === 'center');
  await p.close();
  p = await open('ct_contact_sent');
  check('sent: thank-you state replaces the form', await p.locator('.mn-contact__done').count() === 1 && await p.locator('[name="contact[body]"]').count() === 0);
  await p.close();
  p = await open('ct_contact_error');
  check('error listed in the design alert', (await p.textContent('.mn-contact .mn-alert--error')).includes('invalid'));
  await p.close();

  // ---- 404
  p = await open('ct_404');
  check('404: outlined numerals, title, search, buttons, picks', await p.locator('.mn-404__code').count() === 1 && await p.locator('.mn-404__search input[name=q]').count() === 1 && await p.locator('.mn-404__actions a').count() === 2 && await p.locator('.mn-404 .card').count() === 4);
  await p.close();

  // ---- password
  p = await open('ct_password');
  check('password page: Olive scheme from the theme settings', (await css(p, '.mn-pwpage', 'backgroundColor')) === 'rgb(242, 241, 234)');
  check('password page: title, sign-up form tagged for the newsletter', /Newsreader/.test(await css(p, '.mn-pwpage__title', 'fontFamily')) && (await p.getAttribute('[data-form="customer"] input[name="contact[tags]"]', 'value')).includes('password page'));
  check('password form starts closed', await p.locator('#PwPanel[hidden]').count() === 1);
  await p.click('[data-acct-toggle="PwPanel"]'); await p.waitForTimeout(200);
  check('Enter using password opens the storefront password form', await p.locator('#PwPanel:not([hidden]) [data-form="storefront_password"] input[name="password"]').count() === 1);
  check('owner login and Powered by Shopify', (await p.textContent('.mn-pwpage__foot')).includes('Powered by Shopify') && await p.locator('.mn-pwpage__foot a[href="/admin"]').count() === 1);
  await p.close();
  p = await open('ct_password_error');
  check('wrong password: form open with the error', await p.locator('#PwPanel:not([hidden]) .mn-alert--error').count() === 1);
  await p.close();
  p = await open('ct_password_subscribed');
  check('subscribed: thank-you', await p.locator('.mn-pwpage__news .mn-alert--ok').count() === 1);
  await p.close();
  p = await open('ct_password_image');
  check('image beside the text', await p.locator('.mn-pwpage__media img').count() === 1 && await cols(p, '.mn-pwpage') === 2);
  await p.close();

  // ---- gift card
  p = await open('ct_gift');
  check('gift card: amount, grouped code, QR drawn from the identifier', (await p.textContent('.mn-gift__amount')).includes('$250') && (await p.textContent('#GiftCardCode')).includes('MNGI FT20') && (await p.getAttribute('#GiftCardQr canvas', 'data-qr')) === 'abc123');
  await p.close();
  p = await open('ct_gift_used');
  check('used gift card: remaining balance and expiry', (await p.textContent('.mn-gift__status')).includes('$90') && (await p.textContent('.mn-gift__status')).includes('Valid until'));
  await p.close();
  p = await open('ct_gift_expired');
  check('expired gift card: badge and greyed card', await p.locator('.mn-gift__card.is-expired').count() === 1 && (await p.textContent('.mn-gift__status')).includes('expired'));
  await p.close();

  // ---- dark
  p = await open('ct_dark_article');
  check('dark scheme article: dark page, light text', (await css(p, '.mn-article', 'backgroundColor')) === 'rgb(10, 10, 10)' && (await css(p, '.mn-article__title', 'color')) === 'rgb(245, 240, 232)');
  await p.close();

  // ---- phone
  const all = fs.readdirSync(DIR).filter(f => /^ct_.*\.html$/.test(f)).map(f => f.replace('.html', ''));
  const wide = [];
  for (const n of all) {
    p = await open(n, 390);
    const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth));
    if (w > 390) wide.push(`${n}:${w}`);
    await p.close();
  }
  check(`no page wider than 390 (${all.length} pages)`, wide.length === 0, wide.join(' '));
  p = await open('ct_blog', 390);
  check('phone: journal in one column', await cols(p, '.mn-blog__posts') === 1);
  await p.close();

  check('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(`\n${ok} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
