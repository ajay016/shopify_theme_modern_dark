const { chromium } = require('playwright');
const path=require('path');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1300,height:1000},deviceScaleFactor:2});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('real_panel.html')); await p.waitForTimeout(700);
await p.click('.collection-toolbar [data-toggle-filter-panel]'); await p.waitForTimeout(300);
const m=await p.evaluate(()=>{
  const grid=document.querySelector('.filter-panel__grid').getBoundingClientRect();
  const pg=document.querySelector('#product-grid').getBoundingClientRect();
  const groups=[...document.querySelectorAll('.filter-panel__grid > .filter-group')].map(gr=>Math.round(gr.getBoundingClientRect().height));
  return {panelContent:[Math.round(grid.left),Math.round(grid.right)], productGrid:[Math.round(pg.left),Math.round(pg.right)],
          groupHeights:groups, tallest:Math.max(...groups),
          footButton:document.querySelector('.filter-panel__close').textContent.trim()};
});
console.log('panel content edges', m.panelContent, ' product grid edges', m.productGrid,
  (Math.abs(m.panelContent[0]-m.productGrid[0])<=1 && Math.abs(m.panelContent[1]-m.productGrid[1])<=1)?'ALIGNED':'MISALIGNED');
console.log('group heights', JSON.stringify(m.groupHeights), 'tallest', m.tallest);
console.log('footer button:', m.footButton);
await p.screenshot({path:'real_panel_open.png',clip:{x:0,y:250,width:1300,height:640}});
// simulate the reload that choosing a filter causes
await p.reload(); await p.waitForTimeout(700);
console.log('after reload, panel open:', await p.evaluate(()=>!document.querySelector('[data-filter-panel]').hidden));
await p.click('.collection-toolbar [data-toggle-filter-panel]'); await p.waitForTimeout(200);
await p.reload(); await p.waitForTimeout(600);
console.log('closed, then reload, panel open:', await p.evaluate(()=>!document.querySelector('[data-filter-panel]').hidden));

await p.goto('file://'+path.resolve('real_hidden.html')); await p.waitForTimeout(600);
await p.click('[data-toggle-sidebar]'); await p.waitForTimeout(600);
await p.reload(); await p.waitForTimeout(700);
console.log('hidden sidebar, opened then reload:', await p.evaluate(()=>({
  open:document.querySelector('[data-collection-layout]').classList.contains('is-sidebar-open'),
  label:document.querySelector('[data-toggle-sidebar-label]').textContent.trim()})));
console.log('JS errors:', errs.length?errs.join(' | '):'none');
await b.close();})();
