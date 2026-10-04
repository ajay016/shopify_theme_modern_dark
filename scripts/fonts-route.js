// Serve Google Fonts from a local copy so screenshots render the real type
// even when the network is slow or blocked. MN_FONTS=<dir> holds fonts.css
// (as fetched from fonts.googleapis.com) and each woff2 named by the md5 of
// its URL's first 12 hex digits. Without MN_FONTS the fonts load normally.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
module.exports = async function routeFonts(page) {
  const dir = process.env.MN_FONTS;
  if (!dir || !fs.existsSync(path.join(dir, 'fonts.css'))) return;
  const css = fs.readFileSync(path.join(dir, 'fonts.css'), 'utf8');
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: css }));
  await page.route('https://fonts.gstatic.com/**', r => {
    const h = crypto.createHash('md5').update(r.request().url() + '\n').digest('hex').slice(0, 12);
    const f = path.join(dir, h + '.woff2');
    return fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'font/woff2' }) : r.continue();
  });
};
