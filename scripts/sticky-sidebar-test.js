const { chromium } = require('playwright');
const path=require('path');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
for (const fs of ['sidebar','toggle','hidden']) {
  const p=await b.newPage({viewport:{width:1300,height:900}});
  await p.goto('file://'+path.resolve(`hdr_${fs}.html`)); await p.waitForTimeout(500);
  if (fs==='hidden') { await p.click('[data-toggle-sidebar]'); await p.waitForTimeout(500); }
  const rows=[];
  for (const y of [300,600,900]) {
    await p.evaluate(y=>window.scrollTo(0,y),y); await p.waitForTimeout(250);
    rows.push(await p.evaluate(()=>{const s=document.querySelector('.collection-sidebar').getBoundingClientRect();
      const h=document.querySelector('.site-header').getBoundingClientRect();
      const lay=document.querySelector('.collection-layout').getBoundingClientRect();
      return `sidebar-top ${Math.round(s.top)} (header bottom ${Math.round(h.bottom)}, layout bottom ${Math.round(lay.bottom)})`;}));
  }
  console.log(fs.padEnd(8), rows.map((r,i)=>`scroll ${[300,600,900][i]}: ${r}`).join('\n         '));
  if (fs==='sidebar'){ await p.evaluate(()=>window.scrollTo(0,600)); await p.waitForTimeout(250); await p.screenshot({path:'hdr_sidebar_scrolled.png',clip:{x:0,y:0,width:1300,height:600}}); }
  await p.close();
}
await b.close();})();
