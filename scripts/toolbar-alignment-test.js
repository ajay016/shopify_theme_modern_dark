const { chromium } = require('playwright');
const path=require('path');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const errs=[];
for (const fs of ['dropdown','drawer','panel','sidebar']) {
  const p=await b.newPage({viewport:{width:1300,height:900},deviceScaleFactor:2});
  p.on('pageerror',e=>errs.push(fs+': '+e.message));
  await p.goto('file://'+path.resolve(`real_${fs}.html`)); await p.waitForTimeout(700);
  const m=await p.evaluate(()=>{
    const tb=document.querySelector('.collection-toolbar'); const grid=document.querySelector('#product-grid');
    const first=tb.querySelector('.toolbar-btn:not([style*="none"]), .dropdown-filters, .toolbar-count');
    const kids=[...tb.children].filter(c=>c.offsetParent!==null && getComputedStyle(c).display!=='none');
    const l=Math.min(...kids.map(k=>k.getBoundingClientRect().left));
    const r=Math.max(...kids.map(k=>k.getBoundingClientRect().right));
    const g=grid.getBoundingClientRect();
    return {toolbarLeft:Math.round(l), gridLeft:Math.round(g.left), toolbarRight:Math.round(r), gridRight:Math.round(g.right)};
  });
  const ok = Math.abs(m.toolbarLeft-m.gridLeft)<=1 && Math.abs(m.toolbarRight-m.gridRight)<=1;
  console.log(`${fs.padEnd(9)} toolbar ${m.toolbarLeft}-${m.toolbarRight}  grid ${m.gridLeft}-${m.gridRight}   ${ok?'ALIGNED':'MISALIGNED'}`);
  if (fs==='dropdown') {
    const sums=await p.$$('.dropdown-filter summary');
    await sums[0].click(); await p.waitForTimeout(150);
    await sums[4].click(); await p.waitForTimeout(150);
    const openNow=await p.evaluate(()=>[...document.querySelectorAll('.dropdown-filter[open] summary')].map(s=>s.textContent.trim().split(/\s+/)[0]));
    console.log('   opened Availability then Color -> open now:', JSON.stringify(openNow));
    await p.screenshot({path:'real_dropdown_color.png',clip:{x:0,y:0,width:1300,height:760}});
    await sums[6].click(); await p.waitForTimeout(200);
    const edge=await p.evaluate(()=>{const d=document.querySelector('.dropdown-filter[open]');const r=d.querySelector('.dropdown-filter__panel').getBoundingClientRect();
      return {label:d.querySelector('summary').textContent.trim().split(/\s+/)[0], panelRight:Math.round(r.right), viewport:document.documentElement.clientWidth, flipped:d.classList.contains('is-flip')};});
    console.log('   last pill panel:', JSON.stringify(edge), edge.panelRight<=edge.viewport?'IN VIEW':'OVERFLOWS');
    await p.mouse.click(1200,820); await p.waitForTimeout(150);
    console.log('   after outside click, open:', await p.evaluate(()=>document.querySelectorAll('.dropdown-filter[open]').length));
    await p.screenshot({path:'real_dropdown_closed.png',clip:{x:0,y:0,width:1300,height:560}});
  }
  await p.close();
}
console.log('JS errors:', errs.length?errs.join(' | '):'none');
await b.close();})();
