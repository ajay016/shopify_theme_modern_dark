const { chromium } = require('playwright');
const path=require('path');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const errs=[];
async function page(file,w){const p=await b.newPage({viewport:{width:w,height:900},deviceScaleFactor:2});
  p.on('pageerror',e=>errs.push(file+': '+e.message));
  await p.goto('file://'+path.resolve(file)); await p.waitForTimeout(700); return p;}

// DROPDOWN: every panel has content; price panel has a slider; colour has swatches
let p=await page('mode_dropdown.html',1280);
const dd=await p.evaluate(()=>[...document.querySelectorAll('.dropdown-filter')].map(d=>({
  label:d.querySelector('summary').textContent.trim().split(/\s+/)[0],
  rows:d.querySelectorAll('.filter-check, .filter-swatch, .cfilter-pill').length,
  slider:!!d.querySelector('.cfilter-price__range'),
  swatch:!!d.querySelector('.filter-swatch__dot')})));
console.log('DROPDOWN panels:'); dd.forEach(x=>console.log(`   ${x.label.padEnd(13)} rows=${x.rows} slider=${x.slider} swatches=${x.swatch}`));
await p.click('.dropdown-filter summary'); await p.waitForTimeout(200);
await p.screenshot({path:'shot_dropdown.png', clip:{x:0,y:0,width:1280,height:640}});
await p.close();

// DRAWER: button opens it, overlay click closes, Escape closes
p=await page('mode_drawer.html',1280);
const st=()=>p.evaluate(()=>{const d=document.querySelector('[data-filter-drawer]');return d?d.classList.contains('is-open'):'none'});
console.log('DRAWER initially open:', await st());
await p.click('[data-open-filter-drawer]'); await p.waitForTimeout(500);
console.log('DRAWER after Filter click:', await st());
await p.screenshot({path:'shot_drawer.png'});
await p.keyboard.press('Escape'); await p.waitForTimeout(450);
console.log('DRAWER after Escape:', await st());
await p.close();

// PHONE, default sidebar layout: sidebar hidden, Filters button visible and working
p=await page('mode_sidebar.html',390);
const vis=await p.evaluate(()=>({
  sidebarShown: getComputedStyle(document.querySelector('.collection-sidebar')).display!=='none',
  buttonShown:  getComputedStyle(document.querySelector('.toolbar-btn--mobile-filters')).display!=='none'}));
console.log('PHONE sidebar layout:', JSON.stringify(vis));
await p.click('.toolbar-btn--mobile-filters'); await p.waitForTimeout(500);
console.log('PHONE drawer opens:', await p.evaluate(()=>document.querySelector('[data-filter-drawer]').classList.contains('is-open')));
await p.screenshot({path:'shot_phone.png'});
await p.close();

console.log('JS errors:', errs.length?errs.join(' | '):'none');
await b.close();})();
