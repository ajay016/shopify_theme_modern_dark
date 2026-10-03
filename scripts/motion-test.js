const { chromium } = require('playwright');
// Motion (F3): height-animated filter groups and top panel, animated
// dropdown close, scroll reveal that waits for the reader, stagger,
// reduced motion and Motion: Off.
//   node scripts/motion-test.js DIR   (DIR holds theme.css, theme.js and the
//   rendered rad_sidebar / rad_dropdown / rad_panel pages)
const path = require('path');
const dir = process.argv[2] || '.';
const TOKENS = ':root{--dur-1:160ms;--dur-2:280ms;--dur-3:440ms;--dur-4:820ms;--reveal-dist:30px}';
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
let ok=0,bad=0; const errs=[];
const check=(n,c,x='')=>{console.log((c?'PASS ':'FAIL ')+n+(x?'  '+x:''));c?ok++:bad++;};
const page=async(f,w=1440,opts={})=>{const p=await b.newPage({viewport:{width:w,height:900},...opts});p.on('pageerror',e=>errs.push(f+': '+e.message));
  const motion=f.startsWith('mo_'); const file=f==='mo_reveal.html'?path.resolve(__dirname,'fixtures/reveal.html'):path.resolve(dir,f.replace(/^mo_/,'rad_'));
  await p.goto('file://'+file); if(motion&&f!=='mo_reveal.html') await p.addStyleTag({content:TOKENS}); await p.waitForTimeout(400);return p;};
// --- filter group collapse animates
let p=await page('mo_sidebar.html');
const grp=await p.evaluate(()=>{const t=document.querySelector('.collection-sidebar .filter-group__toggle');t.click();const body=t.nextElementSibling;
  return new Promise(r=>{const h=[];const t0=performance.now();const tick=()=>{h.push(Math.round(body.getBoundingClientRect().height));if(performance.now()-t0<600)requestAnimationFrame(tick);else r({h,collapsed:body.classList.contains('is-collapsed'),aria:t.getAttribute('aria-expanded')});};tick();});});
const mid=grp.h.filter(x=>x>0&&x<grp.h[0]).length;
check('filter group closes with intermediate heights', mid>5 && grp.collapsed && grp.aria==='false', `${grp.h[0]}px -> 0, ${mid} in-between frames`);
const reopen=await p.evaluate(()=>{const t=document.querySelector('.collection-sidebar .filter-group__toggle');t.click();const body=t.nextElementSibling;
  return new Promise(r=>{const h=[];const t0=performance.now();const tick=()=>{h.push(Math.round(body.getBoundingClientRect().height));if(performance.now()-t0<600)requestAnimationFrame(tick);else r({h,collapsed:body.classList.contains('is-collapsed'),style:body.getAttribute('style')});};tick();});});
check('filter group reopens to full height, no leftover inline style', !reopen.collapsed && reopen.h[reopen.h.length-1]===grp.h[0] && !reopen.style, `${reopen.h[1]} -> ${reopen.h[reopen.h.length-1]}`);
await p.close();
// --- dropdown filter animated close
p=await page('mo_dropdown.html');
await p.click('.dropdown-filter > summary'); await p.waitForTimeout(350);
check('dropdown opens', await p.evaluate(()=>document.querySelector('.dropdown-filter').open));
await p.click('.dropdown-filter > summary');
const during=await p.evaluate(()=>document.querySelector('.dropdown-filter').open);
await p.waitForTimeout(400);
const after=await p.evaluate(()=>document.querySelector('.dropdown-filter').open);
check('dropdown close plays before removing open', during===true && after===false);
await p.click('.dropdown-filter > summary'); await p.waitForTimeout(300); await p.mouse.click(1200,200); await p.waitForTimeout(400);
check('outside click closes dropdown (animated)', !(await p.evaluate(()=>document.querySelector('.dropdown-filter').open)));
await p.close();
// --- top panel
p=await page('mo_panel.html');
await p.click('.collection-toolbar [data-toggle-filter-panel]');
const ph=await p.evaluate(()=>new Promise(r=>{const el=document.querySelector('[data-filter-panel]');const h=[];const t0=performance.now();const tick=()=>{h.push(Math.round(el.getBoundingClientRect().height));if(performance.now()-t0<700)requestAnimationFrame(tick);else r({h,hidden:el.hidden});};tick();}));
check('top panel grows open', !ph.hidden && ph.h[0]<ph.h[ph.h.length-1]/2, `${ph.h[0]} -> ${ph.h[ph.h.length-1]}`);
await p.click('.collection-toolbar [data-toggle-filter-panel]'); await p.waitForTimeout(150);
const midHidden=await p.evaluate(()=>document.querySelector('[data-filter-panel]').hidden);
await p.waitForTimeout(500);
check('top panel shrinks, then hides', midHidden===false && await p.evaluate(()=>document.querySelector('[data-filter-panel]').hidden));
await p.close();
// --- scroll reveal
p=await page('mo_reveal.html');
await p.waitForTimeout(2300);
const st=await p.evaluate(()=>[...document.querySelectorAll('main > .shopify-section')].map(s=>{const el=s.firstElementChild;return [el.className, getComputedStyle(el).opacity];}));
check('first section untouched', !st[0][0].includes('reveal'));
check('below-fold section still hidden 2.3s after load (old failsafe showed it)', st[3][1]==='0', st[3].join(' '));
await p.evaluate(()=>window.scrollTo(0, document.getElementById('s3').offsetTop-200)); await p.waitForTimeout(1300);
const s3=await p.evaluate(()=>{const el=document.querySelector('#s3 > section');return [getComputedStyle(el).opacity,getComputedStyle(el).transform,el.className];});
check('section reveals on scroll and disarms (no transform left)', s3[0]==='1' && s3[1]==='none' && !s3[2].includes('reveal-armed'), s3.join(' | '));
await p.evaluate(()=>window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(600);
const delays=await p.evaluate(()=>[...document.querySelectorAll('.reveal:not(.reveal--section)')].map(e=>e.style.transitionDelay));
check('items arriving together stagger', new Set(delays).size>3, delays.join(','));
await p.close();
// --- reduced motion: instant
p=await page('mo_sidebar.html',1440,{reducedMotion:'reduce'});
const rm=await p.evaluate(()=>{const t=document.querySelector('.collection-sidebar .filter-group__toggle');t.click();return t.nextElementSibling.classList.contains('is-collapsed');});
check('reduced motion: collapse is instant', rm);
await p.close();
p=await page('mo_reveal.html',1440,{reducedMotion:'reduce'});
check('reduced motion: nothing armed', await p.evaluate(()=>!document.querySelector('.reveal-armed')));
await p.close();
// --- motion off (tokens 0)
p=await page('rad_sidebar.html');
check('motion off (no tokens): collapse instant', await p.evaluate(()=>{const t=document.querySelector('.collection-sidebar .filter-group__toggle');t.click();return t.nextElementSibling.classList.contains('is-collapsed');}));
await p.close();
await b.close();
console.log(`\n${ok} passed, ${bad} failed. JS errors: ${errs.length?errs.join(' | '):'none'}`);process.exit(bad?1:0);})();
