const { chromium } = require('playwright');
// Custom select: no visible native select; keyboard, pointer, type-ahead,
// address country/province, late-added selects, sort navigation, phone.
//   node scripts/custom-select-test.js DIR   (DIR holds theme.css, theme.js, rad_sidebar.html)
const dir = process.argv[2] || '.';
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const errs=[]; let ok=0, bad=0;
const check=(n,c,extra='')=>{console.log((c?'PASS ':'FAIL ')+n+(extra?'  '+extra:'')); c?ok++:bad++;};
// ---- form page
let p=await b.newPage({viewport:{width:900,height:800}}); p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'fixtures/select-form.html')); await p.waitForTimeout(300);
const visibleNative=async()=>p.evaluate(()=>[...document.querySelectorAll('select')].filter(s=>{const cs=getComputedStyle(s);return cs.opacity!=='0'&&s.offsetParent&&!s.classList.contains('sr-only')}).length);
check('no visible native select (form)', await visibleNative()===0);
check('saved country preselected', await p.evaluate(()=>document.querySelector('[name="address[country]"]').value)==='Canada');
check('province list filled + saved province', await p.evaluate(()=>{const s=document.querySelector('[name="address[province]"]');return s.options.length===4&&s.value==='Ontario'}));
check('trigger shows province', (await p.textContent('#address-province-1 ~ .select__trigger, .cselect:has(#address-province-1) .select__value')).trim()==='Ontario');
// keyboard: focus country trigger, open, type "f", enter
const trig=p.locator('.cselect:has(#address-country-1) .select__trigger');
await trig.focus(); await p.keyboard.press('ArrowDown');
check('opens on ArrowDown', await trig.getAttribute('aria-expanded')==='true');
await p.waitForTimeout(350); await p.screenshot({path:require('path').resolve(dir,'cs_form_open.png')});
await p.keyboard.type('fr'); await p.keyboard.press('Enter');
check('type-ahead + Enter picks France', await p.evaluate(()=>document.querySelector('[name="address[country]"]').value)==='France');
check('focus returns to trigger', await p.evaluate(()=>document.activeElement.classList.contains('select__trigger')));
check('province field hidden for France', await p.evaluate(()=>document.querySelector('#address-province-1').closest('.form-field').hidden));
await trig.click(); await p.waitForTimeout(300);
await p.click('.cselect:has(#address-country-1) .select__option:has-text("United States")');
check('click picks US, provinces refill', await p.evaluate(()=>{const s=document.querySelector('[name="address[province]"]');return document.querySelector('[name="address[country]"]').value==='United States'&&s.options.length===4&&!s.closest('.form-field').hidden}));
check('trigger label after programmatic value set', await p.evaluate(()=>{const s=document.querySelector('#address-province-1');s.value='Texas';return s.closest('.cselect').querySelector('.select__value').textContent==='Texas'}));
await trig.click(); await p.waitForTimeout(100); await p.keyboard.press('Escape');
check('Escape closes', await trig.getAttribute('aria-expanded')==='false');
await trig.click(); await p.mouse.click(800,700); await p.waitForTimeout(50);
check('outside click closes', await trig.getAttribute('aria-expanded')==='false');
check('disabled select -> disabled trigger', await p.evaluate(()=>document.querySelector('#x').closest('.cselect').querySelector('button').disabled));
// dynamic select
await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML='<select id="late"><option>A</option><option>B</option></select>';document.body.appendChild(d);});
await p.waitForTimeout(50);
check('select added later is enhanced', await p.evaluate(()=>!!document.querySelector('#late').closest('.cselect')));
// form submit carries value
check('form data carries chosen values', await p.evaluate(()=>{const fd=new FormData(document.getElementById('f'));return fd.get('address[country]')==='United States'&&fd.get('address[province]')==='Texas'}));
await p.close();
// ---- collection sort (onchange navigates)
p=await b.newPage({viewport:{width:1440,height:900}}); p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(dir,'rad_sidebar.html')); await p.waitForTimeout(400);
check('no visible native select (collection)', await visibleNative()===0);
const st=p.locator('.sort-by .select__trigger');
await st.click(); await p.waitForTimeout(350);
await p.screenshot({path:require('path').resolve(dir,'cs_sort_open.png')});
const before=p.url();
await p.locator('.sort-by .select__option').nth(2).click();
await p.waitForTimeout(200); check('choosing a sort fires the inline onchange (navigates)', p.url()!==before && p.url().endsWith('title-ascending'), p.url().split('#')[1]);
await p.close();
// ---- phone
p=await b.newPage({viewport:{width:390,height:800}}); p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(dir,'rad_sidebar.html')); await p.waitForTimeout(400);
await p.locator('.sort-by .select__trigger').click(); await p.waitForTimeout(350);
const r=await p.evaluate(()=>{const l=document.querySelector('.sort-by .select__list').getBoundingClientRect();return [Math.round(l.left),Math.round(l.right)]});
check('phone: sort list inside viewport', r[0]>=0&&r[1]<=390, JSON.stringify(r));
await p.screenshot({path:require('path').resolve(dir,'cs_sort_phone.png')});
await b.close();
console.log(`\n${ok} passed, ${bad} failed. JS errors: ${errs.length?errs.join(' | '):'none'}`);
process.exit(bad?1:0);})();
