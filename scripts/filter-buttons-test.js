const { chromium } = require('playwright');
const path=require('path');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
console.log('visible filter-type buttons per style   desktop 1280 | phone 390');
for (const fs of ['sidebar','toggle','hidden','drawer','dropdown','panel']) {
  const r=[];
  for (const w of [1280,390]) {
    const p=await b.newPage({viewport:{width:w,height:900}});
    await p.goto('file://'+path.resolve(`mode_${fs}.html`)); await p.waitForTimeout(400);
    r.push(await p.evaluate(()=>[...document.querySelectorAll('.toolbar-btn')]
      .filter(x=>getComputedStyle(x).display!=='none' && x.offsetParent!==null)
      .map(x=>x.textContent.trim().replace(/\s+/g,' ')).join(' + ') || '(none)'));
    await p.close();
  }
  console.log(`  ${fs.padEnd(9)} ${r[0].padEnd(28)} | ${r[1]}`);
}
await b.close();})();
