const { chromium } = require('playwright');
const path=require('path');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const errs=[];
console.log('style      header-h  toolbar-top  sidebar-top  hidden-under-header?');
for (const fs of ['sidebar','toggle','hidden','drawer','dropdown','panel']) {
  const p=await b.newPage({viewport:{width:1300,height:900}});
  p.on('pageerror',e=>errs.push(fs+': '+e.message));
  await p.goto('file://'+path.resolve(`hdr_${fs}.html`)); await p.waitForTimeout(500);
  if (fs==='hidden') { await p.click('[data-toggle-sidebar]'); await p.waitForTimeout(500); }
  await p.evaluate(()=>window.scrollTo(0,900)); await p.waitForTimeout(300);
  const m=await p.evaluate(()=>{
    const hdr=document.querySelector('.site-header').getBoundingClientRect();
    const tb=document.querySelector('.collection-toolbar').getBoundingClientRect();
    const sb=document.querySelector('.collection-sidebar');
    const sbr=sb && getComputedStyle(sb).display!=='none' && sb.offsetWidth>0 ? sb.getBoundingClientRect() : null;
    return {hh:getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim(),
            hdrBottom:Math.round(hdr.bottom), tbTop:Math.round(tb.top), sbTop:sbr?Math.round(sbr.top):null};
  });
  const under = m.tbTop < m.hdrBottom - 0.5 || (m.sbTop!==null && m.sbTop < m.hdrBottom - 0.5);
  console.log(`${fs.padEnd(10)} ${m.hh.padEnd(9)} ${String(m.tbTop).padEnd(12)} ${String(m.sbTop??'-').padEnd(12)} ${under?'YES - HIDDEN':'no'}  (header bottom ${m.hdrBottom})`);
  if (fs==='drawer') {
    await p.click('.collection-toolbar [data-open-filter-drawer]'); await p.waitForTimeout(500);
    const top=await p.evaluate(()=>{const t=document.querySelector('.filter-drawer__header h2').getBoundingClientRect();
      const el=document.elementFromPoint(t.left+5,t.top+t.height/2); const c=document.querySelector('.filter-drawer__close').getBoundingClientRect();
      const el2=document.elementFromPoint(c.left+c.width/2,c.top+c.height/2);
      return {titleOnTop:!!el.closest('.filter-drawer'), closeOnTop:!!el2.closest('.filter-drawer__close')};});
    console.log('           drawer open -> title visible above header:', top.titleOnTop, ' close button clickable:', top.closeOnTop);
    await p.screenshot({path:'hdr_drawer.png'});
  }
  if (fs==='dropdown') await p.screenshot({path:'hdr_dropdown_scrolled.png',clip:{x:0,y:0,width:1300,height:420}});
  await p.close();
}
console.log('JS errors:', errs.length?errs.join(' | '):'none');
await b.close();})();
