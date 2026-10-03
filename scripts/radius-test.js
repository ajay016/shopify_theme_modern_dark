// Corners & Shape in the browser: computed radius of each shared component
// at every setting value. Pages come from scripts/radius-check.py.
//   node scripts/radius-test.js DIR
const { chromium } = require('playwright');
const path = require('path');
const dir = process.argv[2] || '.';
const PROBES = {
  button: '.btn-primary', ghost: '.btn-ghost', toolbar: '.toolbar-btn', input: 'input[placeholder="Email address"]',
  group: '.input-group', pill: '.cfilter-pill', chip: '.filter-chip', badge: '.pcard__badge',
  page: '.pagination__item--current', prev: '.pagination__item--prev', toast: '.toast', modal: '.quick-view-modal',
};
const EXPECT = {
  sharp:   { button: '0px', input: '0px', page: '0px', modal: '0px', chip: '0px', toast: '0px' },
  soft:    { button: '8px', input: '8px', page: '8px', modal: '16px', toast: '12px', badge: '4px', chip: '999px', group: '8px' },
  rounded: { button: '12px', modal: '24px' },
  pill:    { button: '999px', toolbar: '999px', input: '8px', group: '999px' },
  circle:  { page: '50%', prev: '999px' },
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let fail = 0;
  for (const name of ['sharp', 'subtle', 'soft', 'rounded', 'pill', 'circle']) {
    const p = await b.newPage({ viewport: { width: 1000, height: 640 } });
    await p.goto('file://' + path.resolve(dir, `radius_${name}.html`));
    const got = await p.evaluate(P => Object.fromEntries(Object.entries(P).map(([k, s]) => {
      const el = document.querySelector(s); return [k, el ? getComputedStyle(el).borderTopLeftRadius : 'MISSING'];
    })), PROBES);
    const bad = Object.entries(EXPECT[name] || {}).filter(([k, v]) => got[k] !== v);
    fail += bad.length;
    console.log(`${name.padEnd(8)} ${bad.length ? 'FAIL ' + JSON.stringify(bad.map(([k, v]) => [k, got[k], 'want ' + v])) : 'ok  '} ` +
      Object.entries(got).map(([k, v]) => `${k}=${v}`).join(' '));
    await p.screenshot({ path: path.resolve(dir, `radius_${name}.png`) });
    await p.close();
  }
  await b.close();
  process.exit(fail ? 1 : 0);
})();
