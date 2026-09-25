const { chromium } = require('playwright');
const path=require('path');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const errs=[];
const open=async(f,w)=>{const p=await b.newPage({viewport:{width:w,height:900},deviceScaleFactor:2});
  p.on('pageerror',e=>errs.push(f+': '+e.message)); await p.goto('file://'+path.resolve(f)); await p.waitForTimeout(650); return p;};

// HIDDEN: collapsed, then opens inline
let p=await open('mode_hidden.html',1280);
const col=()=>p.evaluate(()=>{const l=document.querySelector('[data-collection-layout]');
  const sb=document.querySelector('.collection-sidebar');
  return {cols:getComputedStyle(l).gridTemplateColumns, sidebarVisible:getComputedStyle(sb).visibility,
          label:document.querySelector('[data-toggle-sidebar-label]').textContent.trim()};});
console.log('HIDDEN before :', JSON.stringify(await col()));
await p.click('[data-toggle-sidebar]'); await p.waitForTimeout(700);
console.log('HIDDEN opened :', JSON.stringify(await col()));
await p.screenshot({path:'shot_hidden_open.png',clip:{x:0,y:0,width:1280,height:760}});
await p.click('[data-toggle-sidebar]'); await p.waitForTimeout(700);
console.log('HIDDEN closed :', JSON.stringify(await col()));
await p.close();

// PANEL: hidden until the button, then groups laid out in columns
p=await open('mode_panel.html',1280);
const pan=()=>p.evaluate(()=>{const e=document.querySelector('[data-filter-panel]');
  return {shown:!e.hidden, groups:e.querySelectorAll('.filter-group').length,
          columns:getComputedStyle(e.querySelector('.filter-panel__grid')).gridTemplateColumns.split(' ').length};});
console.log('PANEL before  :', JSON.stringify(await pan()));
await p.click('[data-toggle-filter-panel]'); await p.waitForTimeout(300);
console.log('PANEL opened  :', JSON.stringify(await pan()));
await p.screenshot({path:'shot_panel_open.png',clip:{x:0,y:0,width:1280,height:760}});
await p.close();

// PHONE: every style has a visible way to open the drawer, and it opens
console.log('PHONE (390px):');
for (const fs of ['sidebar','toggle','hidden','drawer','dropdown','panel']) {
  p=await open(`mode_${fs}.html`,390);
  const btn=await p.evaluate(()=>{const bs=[...document.querySelectorAll('[data-open-filter-drawer]')]
     .filter(b=>getComputedStyle(b).display!=='none' && b.offsetParent!==null); return bs.length;});
  let opened=false;
  if(btn){ await p.locator('[data-open-filter-drawer]:visible').first().click(); await p.waitForTimeout(450);
    opened=await p.evaluate(()=>document.querySelector('[data-filter-drawer]').classList.contains('is-open')); }
  console.log(`   ${fs.padEnd(9)} visible filter button=${btn>0}  drawer opens=${opened}`);
  await p.close();
}
console.log('JS errors:', errs.length?errs.join(' | '):'none');
await b.close();})();
