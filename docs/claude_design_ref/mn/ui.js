(()=>{
const MN=window.MN;
MN.$=(s,r=document)=>r.querySelector(s);
MN.$$=(s,r=document)=>[...r.querySelectorAll(s)];
MN.icon=(n,c='')=>`<svg class="icon ${c}" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
MN.stars=r=>`<span class="stars" style="--r:${r}" role="img" aria-label="${r} out of 5 stars"></span>`;
MN.esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const {$,$$,icon,esc}=MN;

/* ---- One custom animated select, used everywhere ---- */
class Select{
 constructor(host,o){this.host=host;this.o=Object.assign({options:[],value:null,label:'',onChange:()=>{}},o);host.classList.add('select',...(o.cls?o.cls.split(' '):[]));
  host.innerHTML=`<button type="button" class="select__trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(this.o.label)}"><span class="select__value"></span>${icon('chevron-down','select__chev')}</button><ul class="select__list" role="listbox" aria-label="${esc(this.o.label)}"></ul>`;
  this.btn=host.firstElementChild;this.list=host.lastElementChild;host._select=this;host.dataset.dir=this.o.dir||'down';
  this.btn.addEventListener('click',()=>this.isOpen()?this.close():this.open());
  this.btn.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();this.open()}});
  this.list.addEventListener('click',e=>{const li=e.target.closest('.select__option');if(li&&li.getAttribute('aria-disabled')!=='true'){this.set(li.dataset.value,true);this.close();this.btn.focus({preventScroll:true})}});
  this.list.addEventListener('keydown',e=>this.key(e));
  this.update(this.o.options,this.o.value)}
 update(options,value){this.o.options=options;if(value!==undefined)this.o.value=value;
  this.list.innerHTML=options.map(op=>`<li class="select__option${op.soldout?' is-soldout':''}" role="option" tabindex="-1" data-value="${esc(op.value)}" aria-selected="${String(op.value)===String(this.o.value)}"${op.disabled?' aria-disabled="true"':''}>${op.swatch?`<span class="select__dot" style="background:${op.swatch}"></span>`:''}<span class="select__label">${esc(op.label??op.value)}</span>${op.meta?`<span class="select__meta">${op.meta}</span>`:''}</li>`).join('');this.paint()}
 paint(){const op=this.o.options.find(x=>String(x.value)===String(this.o.value))||this.o.options[0];if(!op)return;this.btn.querySelector('.select__value').innerHTML=`${op.swatch?`<span class="select__dot" style="background:${op.swatch}"></span>`:''}${this.o.prefix?`<span class="select__prefix">${this.o.prefix}</span>`:''}<span>${esc(op.label??op.value)}</span>`}
 set(v,fire){this.o.value=v;$$('.select__option',this.list).forEach(li=>li.setAttribute('aria-selected',li.dataset.value===String(v)));this.paint();if(fire)this.o.onChange(v)}
 isOpen(){return this.host.classList.contains('is-open')}
 open(){$$('.select.is-open').forEach(s=>s!==this.host&&s._select.close());const r=this.btn.getBoundingClientRect(),below=innerHeight-r.bottom;this.host.dataset.dir=this.o.dir||(below<290&&r.top>below?'up':'down');if(r.left+200>innerWidth)this.host.dataset.align='end';this.host.classList.add('is-open');this.btn.setAttribute('aria-expanded','true');const cur=this.list.querySelector('[aria-selected=true]')||this.list.querySelector('.select__option:not([aria-disabled=true])');setTimeout(()=>{if(cur){cur.focus({preventScroll:true});this.list.scrollTop=Math.max(0,cur.offsetTop-60)}},30)}
 close(){this.host.classList.remove('is-open');this.btn.setAttribute('aria-expanded','false')}
 key(e){const items=$$('.select__option:not([aria-disabled=true])',this.list);const i=items.indexOf(document.activeElement);
  if(e.key==='ArrowDown'){e.preventDefault();items[Math.min(items.length-1,i+1)]?.focus()}
  else if(e.key==='ArrowUp'){e.preventDefault();items[Math.max(0,i-1)]?.focus()}
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(i>-1){this.set(items[i].dataset.value,true);this.close();this.btn.focus()}}
  else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.close();this.btn.focus()}
  else if(e.key==='Tab')this.close()}
}
MN.Select=Select;
document.addEventListener('pointerdown',e=>$$('.select.is-open').forEach(s=>{if(!s.contains(e.target))s._select.close()}));
MN.qtyOpts=Array.from({length:10},(_,i)=>({value:String(i+1),label:String(i+1)}));
/* ---- Quantity: stepper (default), pill stepper or the custom dropdown ---- */
MN.qty=(host,o)=>{const style=(MN.settings&&MN.settings.qtyStyle)||'stepper',max=Math.max(1,Math.min(o.max||10,99));let v=Math.min(o.value||1,max);
 if(style==='dropdown'){new MN.Select(host,{label:'Quantity',value:String(v),options:MN.qtyOpts.slice(0,max),onChange:x=>o.onChange(+x)});return}
 host.className='qty qty--'+style;host.innerHTML=`<button type="button" class="qty__btn qty__btn--minus" data-q="-1" aria-label="Decrease quantity"></button><span class="qty__win"><input class="qty__input" type="text" inputmode="numeric" aria-label="Quantity" value="${v}"><span class="qty__roll" aria-hidden="true"></span></span><button type="button" class="qty__btn qty__btn--plus" data-q="1" aria-label="Increase quantity"></button>`;
 const inp=host.querySelector('input'),roll=host.querySelector('.qty__roll');
 const paint=()=>{host.querySelector('[data-q="-1"]').disabled=v<=1;host.querySelector('[data-q="1"]').disabled=v>=max;host.classList.toggle('is-max',v>=max)};
 const set=(n,dir)=>{n=Math.max(1,Math.min(max,n||1));if(n===v){inp.value=v;if(dir>0&&v>=max){host.classList.remove('is-shake');void host.offsetWidth;host.classList.add('is-shake')}return}
  roll.textContent=v;roll.className='qty__roll is-'+(dir>0?'up':'down');inp.className='qty__input is-'+(dir>0?'up':'down');void inp.offsetWidth;roll.classList.add('go');inp.classList.add('go');v=n;inp.value=v;paint();o.onChange(v)};
 host.addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(b)set(v+ +b.dataset.q,+b.dataset.q)});
 inp.addEventListener('change',()=>{const n=parseInt(inp.value,10);set(isNaN(n)?v:n,n>v?1:-1)});
 inp.addEventListener('keydown',e=>{if(e.key==='ArrowUp'){e.preventDefault();set(v+1,1)}if(e.key==='ArrowDown'){e.preventDefault();set(v-1,-1)}});
 inp.addEventListener('focus',()=>inp.select());paint()};

/* ---- Overlays: drawers, modals, sheets ---- */
MN.overlay={stack:[],
 open(id,opener){const el=typeof id==='string'?document.getElementById(id):id;if(!el||el.classList.contains('is-open'))return;el._opener=opener||document.activeElement;el.classList.add('is-open');this.stack.push(el);document.body.classList.add('scroll-lock');el.dispatchEvent(new CustomEvent('overlay:open'));
  setTimeout(()=>{const f=el.querySelector('[autofocus]')||el.querySelector('.overlay__body input:not([type=checkbox]),.overlay__body button,.overlay__body a')||el.querySelector('[data-close]:not(.overlay__scrim)');f&&f.focus({preventScroll:true})},80)},
 close(el){el=el||this.stack[this.stack.length-1];if(!el)return;el.classList.remove('is-open');this.stack=this.stack.filter(x=>x!==el);if(!this.stack.length)document.body.classList.remove('scroll-lock');el.dispatchEvent(new CustomEvent('overlay:close'));if(el._opener&&el._opener.focus&&document.contains(el._opener))el._opener.focus({preventScroll:true})}};
document.addEventListener('click',e=>{
 const a=e.target.closest('a[href="#"]');if(a)e.preventDefault();
 const o=e.target.closest('[data-open]');if(o){e.preventDefault();MN.overlay.open(o.dataset.open,o)}
 const c=e.target.closest('[data-close]');if(c)MN.overlay.close(c.closest('.overlay'));
 const t=e.target.closest('[data-toast]');if(t)MN.toast(t.dataset.toast);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('.select.is-open'))MN.overlay.close()});

/* ---- Accordions (height animates in CSS) ---- */
MN.acc=(t,c,open=false,cls='')=>`<div class="acc ${cls}${open?' is-open':''}"><button type="button" class="acc__trigger" aria-expanded="${open}">${t}<span class="acc__icon"></span></button><div class="acc__panel"><div class="acc__inner"><div class="acc__content">${c}</div></div></div></div>`;
document.addEventListener('click',e=>{const t=e.target.closest('.acc__trigger');if(!t)return;const acc=t.parentElement;const open=!acc.classList.contains('is-open');
 if(open&&acc.parentElement.closest('[data-acc-single]'))[...acc.parentElement.children].forEach(s=>{if(s!==acc&&s.classList.contains('acc')){s.classList.remove('is-open');s.firstElementChild.setAttribute('aria-expanded','false')}});
 acc.classList.toggle('is-open',open);t.setAttribute('aria-expanded',open)});

/* ---- Tabs with sliding ink and animated height ---- */
MN.tabsHTML=(items,cls='')=>`<div class="tabs ${cls}"><div class="tabs__list" role="tablist">${items.map((it,i)=>`<button type="button" role="tab" class="tabs__btn" aria-selected="${!i}" data-tab="${i}">${it.t}</button>`).join('')}<span class="tabs__ink"></span></div><div class="tabs__panels">${items.map((it,i)=>`<div class="tabs__panel" role="tabpanel" data-panel="${i}"${i?' hidden':''}>${it.c}</div>`).join('')}</div></div>`;
MN.initTabs=root=>$$('.tabs',root).forEach(tb=>{if(tb._init)return;tb._init=1;const ink=tb.querySelector('.tabs__ink'),panels=tb.querySelector('.tabs__panels');
 const place=()=>{const b=tb.querySelector('.tabs__btn[aria-selected=true]');if(!b)return;const col=getComputedStyle(b.parentElement).flexDirection==='column';if(col){ink.style.width='';ink.style.height=b.offsetHeight+'px';ink.style.transform=`translateY(${b.offsetTop}px)`}else{ink.style.height='';ink.style.width=b.offsetWidth+'px';ink.style.transform=`translateX(${b.offsetLeft}px)`}};
 place();requestAnimationFrame(place);document.fonts&&document.fonts.ready.then(place);new ResizeObserver(place).observe(tb);
 tb.querySelector('.tabs__list').addEventListener('click',e=>{const b=e.target.closest('.tabs__btn');if(!b||b.getAttribute('aria-selected')==='true')return;const h1=panels.offsetHeight;
  tb.querySelectorAll('.tabs__btn').forEach(x=>x.setAttribute('aria-selected',x===b));tb.querySelectorAll('.tabs__panel').forEach(p=>p.hidden=p.dataset.panel!==b.dataset.tab);
  const h2=panels.scrollHeight;panels.style.height=h1+'px';void panels.offsetHeight;panels.style.height=h2+'px';
  const done=()=>{panels.style.height='';panels.removeEventListener('transitionend',done)};panels.addEventListener('transitionend',done);setTimeout(done,700);place()})});

/* ---- Reveal on scroll ---- */
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -5% 0px'}):null;
MN.reveal=(root=document)=>$$('.reveal:not(.is-in)',root).forEach(el=>io?io.observe(el):el.classList.add('is-in'));

MN.toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('is-on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('is-on'),2400)};
MN.bump=el=>{el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')};
let wish=3;MN.wish=d=>{wish+=d;const w=$('#wishCount');w.textContent=wish;MN.bump(w)};

/* ---- Price + product card ---- */
MN.priceHTML=(v,big)=>{const off=v.compare?Math.round((1-v.price/v.compare)*100):0;return `<div class="price${v.compare?' price--sale':''}${big?' price--lg':''}"><span class="price__now">${MN.money(v.price)}</span>${v.compare?`<s class="price__was"><span class="visually-hidden">Was </span>${MN.money(v.compare)}</s><span class="badge badge--sale">−${off}%</span>`:''}</div>`};
MN.card=(p,o={})=>{const off=p.compare?Math.round((1-p.price/p.compare)*100):0,b=[];
 if(p.badge==='new')b.push('<span class="badge badge--new">New</span>');if(p.compare)b.push(`<span class="badge badge--sale">Sale −${off}%</span>`);if(p.soldout)b.push('<span class="badge badge--soldout">Sold out</span>');if(p.low)b.push(`<span class="badge badge--low">Low stock</span>`);
 return `<article class="card${p.soldout?' is-soldout':''}${o.mini?' card--mini':''} reveal" data-id="${p.id}"><div class="card__media"><a href="#" class="card__img card__img--a" style="${MN.art(p.colors[0],0)}" aria-label="${esc(p.title)}"></a><span class="card__img card__img--b" style="${MN.art(p.colors[0],1)}"></span><div class="card__badges">${b.join('')}</div><div class="card__actions"><button type="button" class="icon-btn card__wish" aria-pressed="false" aria-label="Save ${esc(p.title)} to wishlist">${icon('heart')}</button><button type="button" class="icon-btn card__qv" aria-label="Quick view ${esc(p.title)}">${icon('eye')}</button><button type="button" class="icon-btn card__cmp" aria-pressed="${MN.compare&&MN.compare.ids.includes(p.id)}" aria-label="Compare ${esc(p.title)}">${icon('compare')}</button></div><button type="button" class="btn card__add">${p.soldout?'Notify me':'Add to bag'}</button></div>
 <div class="card__body"><div class="card__meta"><span class="card__brand">${p.vendor}</span><span class="card__rating">${icon('star')}${p.rating}<span>(${p.reviews})</span></span></div><h3 class="card__title"><a href="#">${p.title}</a></h3>${MN.priceHTML(p)}${o.mini?'':`<div class="card__swatches">${p.colors.slice(0,4).map((c,i)=>`<button type="button" class="card__swatch${i?'':' is-active'}" style="background:${MN.colors[c]}" data-colour="${c}" aria-label="${c}"></button>`).join('')}${p.colors.length>4?`<span class="card__more">+${p.colors.length-4}</span>`:''}</div><div class="card__sizes" aria-label="Sizes">${p.sizes.map(s=>p.soldout||p.oos.includes(s)?`<s>${s}</s>`:`<span>${s}</span>`).join('')}</div>`}</div></article>`};
MN.findProduct=id=>id==='main'?MN.mainCard:MN.products.find(x=>x.id===id);
document.addEventListener('click',e=>{const card=e.target.closest('.card');if(!card)return;const p=MN.findProduct(card.dataset.id);if(!p)return;
 const w=e.target.closest('.card__wish');if(w){const on=w.getAttribute('aria-pressed')!=='true';w.setAttribute('aria-pressed',on);MN.wish(on?1:-1);MN.toast(on?'Saved to your wishlist':'Removed from your wishlist');return}
 const q=e.target.closest('.card__qv');if(q){MN.quickView(p.id,q);return}
 if(e.target.closest('.card__cmp')){MN.compare.toggle(p.id);return}
 if(e.target.closest('.card__add')){if(p.soldout)MN.toast('We\'ll email you when it\'s back');else MN.cart.add({title:p.title,variant:p.colors[0]+' · '+p.sizes.find(s=>!p.oos.includes(s)),colour:p.colors[0],price:p.price});return}
 const s=e.target.closest('.card__swatch');if(s){card.querySelectorAll('.card__swatch').forEach(x=>x.classList.toggle('is-active',x===s));card.querySelector('.card__img--a').setAttribute('style',MN.art(s.dataset.colour,0));card.querySelector('.card__img--b').setAttribute('style',MN.art(s.dataset.colour,1))}});

/* ---- Buy button (custom): label, icon, style, loading → added ---- */
MN.atcHTML=(attrs='')=>{const s=MN.settings;return `<button type="button" class="btn btn--block atc atc--${s.atcStyle}${s.atcIcon==='off'?' atc--noicon':''}" data-atc data-state="idle" ${attrs}><span class="atc__spinner"></span><span class="atc__icon">${icon('bag')}</span><span class="atc__check">${icon('check')}</span><span class="atc__label">${esc(s.atcLabel)}</span></button>`};
MN.runAtc=(btn,item)=>{if(btn.dataset.state!=='idle')return;const lab=btn.querySelector('.atc__label');btn.dataset.state='loading';lab.textContent='Adding';
 setTimeout(()=>{btn.dataset.state='added';lab.textContent='Added to bag';MN.cart.add(item);setTimeout(()=>{btn.dataset.state='idle';lab.textContent=MN.settings.atcLabel;MN.pdp&&MN.pdp.updateBuy()},1800)},900)};
})();
