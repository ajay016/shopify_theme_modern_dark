const { chromium } = require('playwright');
const path=require('path');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await b.newPage({viewport:{width:1280,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('full.html')); await p.waitForTimeout(600);

const state = () => p.evaluate(()=>{
  const t=document.querySelector('.filter-group__toggle');
  return t ? t.getAttribute('aria-expanded') : null;
});
const clickToggle = async () => { await p.click('.filter-group__toggle'); await p.waitForTimeout(150); };

// 1. fresh page load
let a=await state(); await clickToggle(); let b1=await state();
console.log(`fresh load       : ${a} -> ${b1}   ${a!==b1?'WORKS':'DEAD'}`);

// 2. theme editor: replace section HTML, fire shopify:section:load, twice over
for (let i=1;i<=2;i++){
  await p.evaluate(()=>{
    const sec=document.querySelector('.collection-page');
    const wrap=document.createElement('div'); wrap.id='shopify-section-x';
    wrap.innerHTML=sec.outerHTML;              // fresh nodes, no listeners
    sec.replaceWith(wrap);
    document.dispatchEvent(Object.assign(new Event('shopify:section:load',{bubbles:true}),{}));
    wrap.dispatchEvent(new Event('shopify:section:load',{bubbles:true}));
  });
  await p.waitForTimeout(200);
  a=await state(); await clickToggle(); b1=await state();
  console.log(`after editor re-render #${i}: ${a} -> ${b1}   ${a!==b1?'WORKS':'DEAD'}`);
}

// 3. price slider still binds exactly once after re-render
const bound=await p.evaluate(()=>[...document.querySelectorAll('.price-range-filter')].map(r=>r.dataset.priceBound||'unbound'));
console.log('price sliders bound:', JSON.stringify(bound));
console.log('JS errors:', errs.length?errs.join(' | '):'none');
await b.close();})();
