(()=>{const {$,$$,icon,esc}=MN;const H=MN.header={};
const root=document.documentElement;
const feat=(m,img)=>`<a href="#" class="mega__feature${img?' has-img':''}">${img?`<span class="mega__feature-img" style="${MN.art(m.feature.colour,1)}"></span>`:''}<span class="mega__feature-copy"><span class="eyebrow">${m.feature.eyebrow}</span><span class="mega__feature-title">${m.feature.title}</span><span class="link-arrow">${m.feature.cta}${icon('arrow-right')}</span></span></a>`;
const links=ls=>`<ul class="mega__links">${ls.map(l=>`<li><a href="#">${l}</a></li>`).join('')}</ul>`;
function megaHTML(m,i,L,img){
 if(L==='visual')return `<div class="mega mega--visual" id="mega-${i}" data-i="${i}"><div class="mega__inner"><div class="mega__tiles">${m.groups.map(g=>`<div class="mega__tile"><a href="#" class="mega__tile-img${img?'':' is-text'}">${img?`<span class="mega__tile-bg" style="${MN.art(g.colour,g.shot)}"></span>`:''}<span>${g.t}</span>${icon('arrow-right')}</a>${links(g.links)}<a href="#" class="mega__all">View all ${g.t.toLowerCase()}</a></div>`).join('')}</div></div></div>`;
 if(L==='flyout')return `<div class="mega mega--flyout" id="mega-${i}" data-i="${i}"><div class="flyout"><ul class="flyout__groups">${m.groups.map((g,k)=>`<li><button type="button" class="flyout__group${k?'':' is-active'}" data-k="${k}">${g.t}${icon('chevron-right','icon--sm')}</button></li>`).join('')}</ul><div class="flyout__links">${m.groups.map((g,k)=>`<div class="flyout__pane${k?'':' is-active'}" data-k="${k}"><a href="#" class="mega__heading">${g.t}</a>${links(g.links)}<a href="#" class="mega__all">View all ${g.t.toLowerCase()}</a></div>`).join('')}</div>${feat(m,img)}</div></div>`;
 return `<div class="mega mega--columns" id="mega-${i}" data-i="${i}"><div class="mega__inner"><div class="mega__cols">${m.groups.map(g=>`<div class="mega__col"><a href="#" class="mega__heading">${g.t}</a>${links(g.links)}<a href="#" class="mega__all">View all</a></div>`).join('')}</div>${feat(m,img)}</div></div>`}
H.renderMega=()=>{const L=root.dataset.mega,img=root.dataset.megaImages!=='off';$('.mega-host').innerHTML=MN.menu.map((m,i)=>m.groups?megaHTML(m,i,L,img):'').join('')};
let cur=null,tm;
H.openMega=i=>{clearTimeout(tm);if(cur===i)return;H.closeMega();const p=$('#mega-'+i),it=$(`.nav__item[data-i="${i}"]`);if(!p||!it)return;
 if(p.classList.contains('mega--flyout')){const hb=$('.header__bar').getBoundingClientRect(),r=it.getBoundingClientRect(),w=Math.min(760,innerWidth-32);let l=r.left-hb.left-12;l=Math.max(16,Math.min(l,hb.width-w-16));p.style.left=l+'px'}
 p.classList.add('is-open');it.classList.add('is-open');it.firstElementChild.setAttribute('aria-expanded','true');$('.site-header').classList.add('has-mega');cur=i};
H.closeMega=()=>{$$('.mega.is-open').forEach(m=>m.classList.remove('is-open'));$$('.nav__item.is-open').forEach(n=>{n.classList.remove('is-open');n.firstElementChild.setAttribute('aria-expanded','false')});$('.site-header').classList.remove('has-mega');cur=null};
const later=()=>{clearTimeout(tm);tm=setTimeout(H.closeMega,180)};

H.init=()=>{
 const msgs=MN.announce;
 $('.announce__track').innerHTML=[...msgs,...msgs].map(m=>`<span class="announce__item">${m}</span>`).join('');
 $('.announce__slides').innerHTML=msgs.map((m,i)=>`<p class="announce__slide${i?'':' is-active'}"><span>${m}</span></p>`).join('');
 $('.announce__static').innerHTML=`${msgs[0]} · <a href="#">Shop the Silk Edition</a>`;
 let ai=0;const rot=d=>{const sl=$$('.announce__slide');sl[ai].classList.remove('is-active');ai=(ai+d+sl.length)%sl.length;sl[ai].classList.add('is-active')};
 $('.announce__prev').onclick=()=>rot(-1);$('.announce__next').onclick=()=>rot(1);
 setInterval(()=>{if(root.dataset.announce==='rotate'&&!$('.announce:hover'))rot(1)},4500);
 $('.nav__list').innerHTML=MN.menu.map((m,i)=>`<li class="nav__item" data-i="${i}">${m.groups?`<button type="button" class="nav__link" aria-expanded="false" aria-controls="mega-${i}">${m.t}${icon('chevron-down')}</button>`:`<a class="nav__link" href="#">${m.t}${i===0?'<span class="nav__tag">NEW</span>':''}</a>`}</li>`).join('');
 const nav=$('.nav__list'),bar=$('.header__bar');
 nav.addEventListener('mouseover',e=>{const it=e.target.closest('.nav__item');if(!it)return;MN.menu[it.dataset.i].groups?H.openMega(+it.dataset.i):later()});
 nav.addEventListener('click',e=>{const b=e.target.closest('button.nav__link');if(!b)return;const i=+b.parentElement.dataset.i;cur===i?H.closeMega():H.openMega(i)});
 bar.addEventListener('mouseleave',later);bar.addEventListener('mouseenter',()=>{if(cur!==null)clearTimeout(tm)});
 $('.mega-host').addEventListener('mouseover',e=>{const g=e.target.closest('.flyout__group');if(g)activateFly(g)});
 $('.mega-host').addEventListener('focusin',e=>{const g=e.target.closest('.flyout__group');if(g)activateFly(g)});
 bar.addEventListener('keydown',e=>{if(e.key==='Escape'&&cur!==null){const i=cur;H.closeMega();$(`.nav__item[data-i="${i}"] .nav__link`).focus()}});
 bar.addEventListener('focusout',e=>{if(!bar.contains(e.relatedTarget))later()});
 // search
 const inp=$('#searchInput');inp.addEventListener('input',()=>H.renderSearch(inp.value));H.renderSearch('');
 $('#searchChips').addEventListener('click',e=>{const c=e.target.closest('.chip');if(c){inp.value=c.textContent;H.renderSearch(inp.value);inp.focus()}});
 // mobile / drawer menu
 const l3=g=>`<ul class="mnav__l3">${g.links.map(l=>`<li><a href="#">${l}</a></li>`).join('')}<li><a href="#" class="mnav__all">View all ${g.t.toLowerCase()}</a></li></ul>`;
 $('#menuNav').innerHTML=MN.menu.map(m=>m.groups?MN.acc(m.t,`<div class="mnav__l2" data-acc-single>${m.groups.map(g=>MN.acc(g.t,l3(g),false,'mnav__acc2')).join('')}<a href="#" class="mnav__all mnav__all--l1">View all ${m.t.toLowerCase()}</a></div>`,false,'mnav__acc1'):`<a href="#" class="mnav__link">${m.t}</a>`).join('');
 new MN.Select($('#menuCountry'),{label:'Country / region',value:MN.countries[0],options:MN.countries.map(v=>({value:v})),cls:'select--compact',dir:'up'});
 new MN.Select($('#menuLang'),{label:'Language',value:'English',options:MN.languages.map(v=>({value:v})),cls:'select--compact',dir:'up'});
 addEventListener('scroll',H.onScroll,{passive:true});addEventListener('resize',H.onScroll);
};
function activateFly(g){const fl=g.closest('.flyout');fl.querySelectorAll('.flyout__group').forEach(x=>x.classList.toggle('is-active',x===g));fl.querySelectorAll('.flyout__pane').forEach(p=>p.classList.toggle('is-active',p.dataset.k===g.dataset.k))}
const hl=(t,q)=>q?esc(t).replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>'):esc(t);
H.renderSearch=raw=>{const q=raw.trim().toLowerCase();const all=[MN.mainCard,...MN.products];
 const ps=(q?all.filter(p=>(p.title+' '+p.vendor+' '+p.colors.join(' ')).toLowerCase().includes(q)):all.slice(0,4)).slice(0,4);
 const cs=(q?MN.collections.filter(c=>c.toLowerCase().includes(q)):MN.collections.slice(0,5)).slice(0,5);
 const pg=(q?MN.pages.filter(c=>c.toLowerCase().includes(q)):MN.pages.slice(0,4)).slice(0,4);
 $('#searchChips').hidden=!!q;
 $('#searchResults').innerHTML=(!ps.length&&!cs.length&&!pg.length)?`<p class="search__empty">No results for “${esc(raw)}”. Try “silk”, “coat” or “Bordeaux”.</p>`:
 `<div class="search__col"><span class="eyebrow search__label">${q?'Products':'Trending now'}</span><div class="search__products">${ps.map(p=>`<a href="#" class="sresult"><span class="sresult__img" style="${MN.art(p.colors[0],0)}"></span><span class="sresult__title">${hl(p.title,q)}</span><span class="sresult__price">${MN.money(p.price)}</span></a>`).join('')||'<p class="search__empty">No products.</p>'}</div>${q?`<a href="#" class="link-arrow" style="margin-top:22px">View all results for “${esc(raw)}”${icon('arrow-right')}</a>`:''}</div>
 <div class="search__side">${cs.length?`<div><span class="eyebrow search__label">Collections</span><ul class="search__list">${cs.map(c=>`<li><a href="#">${hl(c,q)}${icon('arrow-right')}</a></li>`).join('')}</ul></div>`:''}${pg.length?`<div><span class="eyebrow search__label">Pages</span><ul class="search__list">${pg.map(c=>`<li><a href="#">${hl(c,q)}${icon('arrow-right')}</a></li>`).join('')}</ul></div>`:''}</div>`};
let lastY=scrollY;
H.onScroll=()=>{const y=scrollY,s=MN.settings,hdr=$('.site-header');if(!s)return;
 hdr.classList.toggle('is-compact',y>40);
 const hero=s.hero==='on'?$('#hero'):null;hdr.classList.toggle('is-transparent',!!hero&&y<hero.offsetHeight-hdr.offsetHeight-10);
 if(Math.abs(y-lastY)>4){hdr.classList.toggle('is-hidden',s.hideOnScroll==='on'&&y>lastY&&y>260&&!hdr.classList.contains('has-mega'));lastY=y}
 root.style.setProperty('--header-live',hdr.offsetHeight+'px');
 root.style.setProperty('--header-offset',hdr.classList.contains('is-hidden')?'0px':(hdr.offsetHeight)+'px')};
H.apply=()=>{H.closeMega();H.renderMega();$('#hero').hidden=MN.settings.hero!=='on';H.onScroll()};
})();
