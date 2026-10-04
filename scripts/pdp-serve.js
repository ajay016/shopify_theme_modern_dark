// Shared fake-origin server for the product page tests (scripts/pdp-test.js):
// static files from OUT, plus mocked /cart/add.js, pickup, quick view and contact.
const fs = require('fs'), path = require('path');
module.exports = (dir, calls = []) => async r => {
  const u = new URL(r.request().url());
  const send = (body, type = 'text/html') => r.fulfill({ contentType: type, body });
  if (u.pathname === '/cart/add.js') {
    const pd = r.request().postData() || ''; calls.push({ path: u.pathname, body: pd });
    return send(JSON.stringify({ items: [{ key: 'k1', product_title: 'Washed Silk Slip Dress', quantity: 1 }], key: 'k1', product_title: 'Washed Silk Slip Dress', sections: { 'cart-drawer': fs.readFileSync(path.join(dir, 'mock', 'cart.html'), 'utf8') } }), 'application/json');
  }
  if (u.pathname === '/contact') { calls.push({ path: '/contact', body: r.request().postData() || '' }); return send('<p>ok</p>'); }
  let m = u.pathname.match(/^\/variants\/(\d+)\/?$/);
  if (m) { const f = path.join(dir, 'mock', `pickup-${m[1]}.html`); return send(fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''); }
  m = u.pathname.match(/^\/products\/([\w-]+)$/);
  if (m && u.searchParams.get('view') === 'mn-quick') { calls.push({ path: 'quick', handle: m[1] }); return send(fs.readFileSync(path.join(dir, 'mock', `quick-${m[1]}.html`), 'utf8')); }
  const f = path.join(dir, u.pathname);
  return fs.existsSync(f) && fs.statSync(f).isFile() ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
};
