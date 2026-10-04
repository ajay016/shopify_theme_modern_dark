(()=>{const {$,$$,icon,money,esc}=MN;const P=MN.pdp={};
const S=P.state={model:MN.main,sel:MN.main.default.slice(),qty:1,terms:false,forceSticky:false};
const cfg=()=>MN.settings;
P.variant=()=>MN.findVariant(S.model,S.sel)||S.model.variants.find(v=>v.stock>0);
P.colour=()=>S.model.colorOption>=0?S.sel[S.model.colorOption]:S.model.baseColour;
/* ---- Gallery: images, video, 3D; variant image group filters by colour ---- */
P.media=()=>{const m=S.model,col=P.colour();const l=m.shots.map((x,k)=>({type:'image',col,shot:k,label:x}));if(!m.digital){l.splice(2,0,{type:'video',col,shot:4,label:'Film'});l.push({type:'model',col,shot:5,label:'3D model'})}return l};
const mediaHTML=(x,i)=>x.type==='video'?`<div class="media media--video" data-i="${i}" tabindex="0" role="button" aria-label="Play the product film"><div class="media__art" style="${MN.art(x.col,x.shot)}"></div><span class="media__tag">${icon('play','icon--sm')}Shopify video · 0:24</span><span class="media__play">${icon('play','icon--lg')}</span><span class="media__progress"><i></i></span></div>`
 :x.type==='model'?`<div class="media media--model" data-i="${i}" aria-label="3D model, drag to rotate"><div class="media__stage"><div class="media__art" style="${MN.art(x.col,1)}"></div></div><span class="media__tag">${icon('cube','icon--sm')}3D model · drag to rotate</span></div>`
 :`<div class="media media--image" data-i="${i}" tabindex="0" role="button" aria-label="${x.col}, ${x.label}. Open full screen"><div class="media__art" style="${MN.art(x.col,x.shot)}"></div><span class="ph-cap">${x.col} · ${x.label}</span></div>`;
let cur=0;
const track=()=>$('#gallery .gallery__track');
const strip=()=>$('#gallery .gallery__thumbs');
const vert=()=>{const s=strip();return !!s&&getComputedStyle(s).flexDirection==='column'};
P.thumbNav=()=>{const s=strip();if(!s)return;const v=vert(),pos=v?s.scrollTop:s.scrollLeft,max=v?s.scrollHeight-s.clientHeight:s.scrollWidth-s.clientWidth;s.classList.toggle('can-prev',pos>2);s.classList.toggle('can-next',pos<max-2)};
const showThumb=i=>{const s=strip(),t=s&&s.querySelectorAll('.thumb')[i];if(!t)return;const v=vert(),a=v?t.offsetTop:t.offsetLeft,len=v?t.offsetHeight:t.offsetWidth,view=v?s.clientHeight:s.clientWidth,pos=v?s.scrollTop:s.scrollLeft,pad=40;let to=null;if(a<pos+pad)to=a-pad;else if(a+len>pos+view-pad)to=a+len-view+pad;if(to!==null)s.scrollTo({[v?'top':'left']:to,behavior:'smooth'})};
const setActive=i=>{cur=i;showThumb(i);$$('#gallery .thumb').forEach((t,k)=>t.classList.toggle('is-active',k===i));$$('#gallery .gallery__dot').forEach((t,k)=>t.classList.toggle('is-active',k===i))};
const progress=()=>{const t=track(),bar=$('#gallery .gallery__progress i');if(!t||!bar)return;const max=t.scrollWidth-t.clientWidth,vis=t.clientWidth/t.scrollWidth;bar.style.width=vis*100+'%';bar.style.transform=`translateX(${max?(t.scrollLeft/max)*(1/vis-1)*100:0}%)`};
P.renderGallery=()=>{const ms=P.media(),g=$('#gallery');
 g.innerHTML=`<div class="gallery__thumbs" aria-label="Product media"><button type="button" class="thumbs-nav thumbs-nav--prev" data-thumbs="-1" aria-label="Previous thumbnails" tabindex="-1">${icon('chevron-left')}</button>${ms.map((x,i)=>`<button type="button" class="thumb${i?'':' is-active'}" data-go="${i}" aria-label="Show ${x.label}" style="${MN.art(x.col,x.type==='model'?1:x.shot)}">${x.type==='video'?icon('play'):x.type==='model'?icon('cube'):''}</button>`).join('')}<button type="button" class="thumbs-nav thumbs-nav--next" data-thumbs="1" aria-label="Next thumbnails" tabindex="-1">${icon('chevron-right')}</button></div>
 <div class="gallery__main"><div class="gallery__track">${ms.map(mediaHTML).join('')}</div><button type="button" class="gallery__arrow gallery__arrow--prev" data-step="-1" aria-label="Previous">${icon('chevron-left')}</button><button type="button" class="gallery__arrow gallery__arrow--next" data-step="1" aria-label="Next">${icon('chevron-right')}</button><div class="gallery__dots" aria-hidden="true">${ms.map((x,i)=>`<span class="gallery__dot${i?'':' is-active'}"></span>`).join('')}</div>
 <div class="gallery__tools">${S.model.digital?'':`<button type="button" class="gallery__film" data-open="ov-video"><span class="gallery__film-dot">${icon('play')}</span><span>Watch the film</span></button>`}<button type="button" class="icon-btn gallery__expand" aria-label="Open full screen">${icon('expand')}</button></div><div class="gallery__progress"><i></i></div></div>`;
 cur=0;const st=strip();st.addEventListener('scroll',P.thumbNav,{passive:true});requestAnimationFrame(P.thumbNav);setTimeout(P.thumbNav,400);const t=track();t.addEventListener('scroll',()=>{progress();if(!t.children[1])return;const step=t.children[1].offsetLeft-t.children[0].offsetLeft;const i=Math.min(t.children.length-1,Math.round(t.scrollLeft/step));if(i!==cur)setActive(i)},{passive:true});requestAnimationFrame(progress)};
P.go=(i,smooth=true)=>{const t=track(),n=t.children.length;i=(i+n)%n;const el=t.children[i];
 if(getComputedStyle(t).display==='grid')window.scrollTo({top:el.getBoundingClientRect().top+scrollY-110,behavior:smooth?'smooth':'auto'});
 else t.scrollTo({left:el.offsetLeft-t.children[0].offsetLeft,behavior:smooth?'smooth':'auto'});setActive(i)};
const imgIndex=i=>P.media().slice(0,i+1).filter(x=>x.type==='image').length-1;
function bindGallery(){const g=$('#gallery');
 g.addEventListener('click',e=>{const tn=e.target.closest('[data-thumbs]');if(tn){const s=strip(),v=vert(),d=+tn.dataset.thumbs*(v?s.clientHeight:s.clientWidth)*.8;s.scrollBy({[v?'top':'left']:d,behavior:'smooth'});return}
  const th=e.target.closest('[data-go]');if(th)return P.go(+th.dataset.go);
  const ar=e.target.closest('[data-step]');if(ar)return P.go(cur+ +ar.dataset.step);
  if(e.target.closest('.gallery__expand'))return MN.lightbox(Math.max(0,imgIndex(cur)));
  const v=e.target.closest('.media--video');if(v){if(cfg().video==='inline')v.classList.toggle('is-playing');else MN.overlay.open('ov-video',v);return}
  const im=e.target.closest('.media--image');if(im)MN.lightbox(imgIndex(+im.dataset.i))});
 g.addEventListener('keydown',e=>{const m=e.target.closest('.media');if(m&&(e.key==='Enter'||e.key===' ')){e.preventDefault();m.click()}});
 /* inner zoom */
 g.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const m=e.target.closest('.media--image');if(!m)return;const r=m.getBoundingClientRect();m.firstElementChild.style.transformOrigin=`${(e.clientX-r.left)/r.width*100}% ${(e.clientY-r.top)/r.height*100}%`;m.classList.add('is-zooming')});
 g.addEventListener('pointerout',e=>{const m=e.target.closest('.media--image');if(m&&!m.contains(e.relatedTarget))m.classList.remove('is-zooming')});
 /* 3D drag */
 let drag=null;
 g.addEventListener('pointerdown',e=>{const m=e.target.closest('.media--model');if(!m)return;drag={m,x:e.clientX,r:parseFloat(m.style.getPropertyValue('--ry'))||0};m.setPointerCapture(e.pointerId)});
 g.addEventListener('pointermove',e=>{if(drag)drag.m.style.setProperty('--ry',Math.max(-65,Math.min(65,drag.r+(e.clientX-drag.x)*.4))+'deg')});
 addEventListener('pointerup',()=>drag=null)}
/* ---- Variant pickers: image / colour / radio / text / dropdown per option ---- */
const linksFor=(o,m)=>m.digital?'':o.name==='Colour'?`<button type="button" class="picker__link" data-open="ov-compare">${icon('compare','icon--sm')}Compare colours</button>`:o.name==='Size'?`<button type="button" class="picker__link" data-open="ov-size">${icon('ruler','icon--sm')}Size guide</button>`:'';
MN.renderPickers=(root,ctx)=>{const m=ctx.model,sel=ctx.sel;root._ctx=ctx;
 root.innerHTML=m.options.map((o,i)=>{const type=ctx.type(i,o),isCol=o.name==='Colour';const st=v=>MN.valueState(m,sel,i,v);
  const cls=v=>({ok:'',soldout:' is-soldout',unavailable:' is-unavailable'})[st(v)];
  const tip=v=>({ok:v,soldout:`${v}, sold out. Select to be notified`,unavailable:`${v}, unavailable in this combination`})[st(v)];
  const base=v=>`type="button" role="radio" data-opt="${i}" data-val="${esc(v)}" aria-checked="${v===sel[i]}" title="${esc(tip(v))}" aria-label="${esc(tip(v))}"${st(v)==='unavailable'?' disabled':''}`;
  let body;
  if(type==='colour'&&isCol)body=`<div class="swatches" role="radiogroup" aria-label="${o.name}">${o.values.map(v=>`<button ${base(v)} class="sw-colour${cls(v)}" style="background:${MN.colors[v]}"></button>`).join('')}</div>`;
  else if(type==='image'&&isCol)body=`<div class="swatches" role="radiogroup" aria-label="${o.name}">${o.values.map(v=>`<button ${base(v)} class="sw-image${cls(v)}"><span style="${MN.art(v,0)}"></span></button>`).join('')}</div>`;
  else if(type==='radio')body=`<div class="sw-radio-list" role="radiogroup" aria-label="${o.name}">${o.values.map(v=>{const s=st(v),c=sel.slice();c[i]=v;const va=MN.findVariant(m,c);const meta=s==='soldout'?'Sold out · notify me':s==='unavailable'?'Unavailable':m.digital?money(va.price):(va.stock<=5?`Only ${va.stock} left`:'');return `<button ${base(v)} class="sw-radio${cls(v)}"><span class="sw-radio__dot"></span>${isCol?`<span class="sw-radio__chip" style="background:${MN.colors[v]}"></span>`:''}<span class="sw-radio__name">${v}</span><span class="sw-radio__meta">${meta}</span></button>`}).join('')}</div>`;
  else if(type==='dropdown')body=`<div class="picker__select" data-select-opt="${i}"></div>`;
  else body=`<div class="swatches" role="radiogroup" aria-label="${o.name}">${o.values.map(v=>`<button ${base(v)} class="sw-text${cls(v)}">${v}</button>`).join('')}</div>`;
  return `<div class="picker" data-picker="${i}"><div class="picker__head"><span class="picker__label">${o.name}<span>${sel[i]}</span></span>${ctx.links?linksFor(o,m):''}</div>${body}</div>`}).join('');
 $$('[data-select-opt]',root).forEach(h=>{const i=+h.dataset.selectOpt,o=m.options[i];new MN.Select(h,{label:o.name,value:sel[i],options:o.values.map(v=>{const s=MN.valueState(m,sel,i,v);return {value:v,disabled:s==='unavailable',soldout:s==='soldout',meta:s==='soldout'?'Sold out':s==='unavailable'?'Unavailable':'',swatch:o.name==='Colour'?MN.colors[v]:null}}),onChange:v=>root._ctx.onChange(i,v)})});
 if(!root._bound){root._bound=1;root.addEventListener('click',e=>{const b=e.target.closest('[data-opt][data-val]');if(b&&!b.disabled)root._ctx.onChange(+b.dataset.opt,b.dataset.val)})}};
P.ctx={get model(){return S.model},get sel(){return S.sel},links:true,
 type:(i,o)=>S.model.digital?(i===0?'text':'radio'):(o.name==='Colour'?cfg().swColour:cfg().swSize),
 onChange:(i,v)=>{const cc=i===S.model.colorOption&&v!==S.sel[i];S.sel[i]=v;P.update(cc)}};
P.renderPickers=()=>{const r=$('#info [data-pickers]');if(r)MN.renderPickers(r,P.ctx)};
/* ---- Info column blocks: each complete on its own, reorderable ---- */
MN.blockLabels={title:'Vendor, title, rating',price:'Price',summary:'Short description',badges:'Badges',urgency:'Countdown, stock, visitors',variants:'Variant pickers',quantity:'Quantity',terms:'Terms checkbox',buy:'Buy buttons',pickup:'Pickup availability',offer:'Special offer',shipping:'Shipping information',trust:'Trust badges',actions:'Ask a question, share',details:'Description, shipping, reviews'};
const shipRange=()=>{const f=d=>d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});const add=n=>{const d=new Date();let k=0;while(k<n){d.setDate(d.getDate()+1);if(d.getDay()%6)k++}return d};return `${f(add(2))} – ${f(add(4))}`};
const B={
 title:m=>`<div class="block pi-head"><a href="#" class="eyebrow pi-vendor">${m.vendor}</a><h1 class="pi-title">${m.title}</h1><a href="#" class="pi-rating" data-jump>${MN.stars(m.rating)}<span>${m.rating}</span><span class="pi-rating__count">${m.reviews} reviews</span></a></div>`,
 price:()=>`<div class="block pi-price" data-price></div>`,
 badges:()=>`<div class="block pi-badges" data-badges></div>`,
 urgency:()=>{const s=cfg();return `<div class="block urgency">${s.countdown==='on'?`<div class="countdown"><span class="countdown__label">${icon('clock','icon--sm')}Winter sale ends in</span><div class="countdown__units" data-countdown>${['Days','Hrs','Min','Sec'].map(u=>`<span class="countdown__unit"><b>00</b><small>${u}</small></span>`).join('')}</div></div>`:''}<div class="stockbar" data-stock></div>${s.visitors==='on'?`<div class="visitors"><span class="pulse"></span><span><b data-visitors>18</b> people are viewing this right now</span></div>`:''}</div>`},
 variants:()=>`<div class="block pi-variants" data-pickers></div>`,
 quantity:()=>`<div class="block pi-qty"><span class="field__label">Quantity</span><div data-qty></div></div>`,
 summary:m=>`<div class="block pi-summary"><p>${(MN.info[m.digital?'digital':'main']||{}).short}</p><button type="button" class="link-quiet" data-read-more>Read the full description</button></div>`,
 terms:()=>`<label class="block check pi-terms"><input type="checkbox" data-terms${S.terms?' checked':''}><span>I agree to the <a href="#" class="link-quiet">terms of sale</a> and the <a href="#" class="link-quiet">returns policy</a>.</span></label>`,
 buy:()=>`<div class="block buy">${MN.atcHTML('id="mainAtc" data-main')}<div class="buy__notify" data-notify><div><form data-notify-form><input class="input" type="email" placeholder="Email for restock alert" required aria-label="Email"><button class="btn btn--sm" type="submit">Notify me</button></form></div></div><div class="buy__hint" data-hint><div><p>${icon('lock','icon--sm')}Tick the terms above to continue.</p></div></div><button type="button" class="btn btn--secondary btn--block" data-buynow>Buy it now</button><div class="express" aria-label="Express checkout"><button type="button" class="express__btn express__btn--shop">Shop Pay</button><button type="button" class="express__btn express__btn--apple">Apple Pay</button><button type="button" class="express__btn express__btn--google">G Pay</button><button type="button" class="express__btn express__btn--paypal">PayPal</button></div></div>`,
 pickup:()=>`<div class="block pickup" data-pickup></div>`,
 offer:()=>`<div class="block offer"><span class="offer__icon">${icon('tag')}</span><div class="offer__text"><b>Buy two silk pieces, save 10%</b><span>Applied at checkout, or use the code.</span></div><button type="button" class="offer__code" data-copy="SILK10" aria-label="Copy code SILK10">SILK10</button></div>`,
 shipping:m=>m.digital?`<div class="block digital-spec"><dl class="spec-dl">${Object.entries(m.spec).map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></div>`:`<div class="block info-list"><div class="info-row">${icon('truck')}<div><b>Delivered ${shipRange()}</b><span>Complimentary express shipping over $500</span></div></div><div class="info-row">${icon('return')}<div><b>Free returns within 30 days</b><span>Unworn with tags. We collect from your door.</span></div></div></div>`,
 trust:()=>`<div class="block trust-block"><div class="trust"><div class="trust__item">${icon('shield')}Authenticity guaranteed</div><div class="trust__item">${icon('lock')}Secure checkout</div><div class="trust__item">${icon('pin')}Made in Italy</div></div><div class="payments">${['Visa','Mastercard','Amex','PayPal','Apple Pay','Shop Pay','Klarna'].map(p=>`<span class="pay">${p}</span>`).join('')}</div></div>`,
 actions:()=>`<div class="block pi-actions"><button type="button" data-open="ov-ask">${icon('question')}Ask a question</button><button type="button" data-cmp-main aria-pressed="false">${icon('compare')}<span>Compare</span></button><div class="share"><button type="button" class="share__btn" data-share aria-expanded="false">${icon('share')}Share</button><div class="share__pop" role="menu"><button type="button" data-copy-link role="menuitem">${icon('link')}<span>Copy link</span></button><hr><a href="#" role="menuitem">${icon('pinterest')}Pinterest</a><a href="#" role="menuitem">${icon('facebook')}Facebook</a><a href="#" role="menuitem">${icon('x')}X</a><a href="#" role="menuitem">${icon('whatsapp')}WhatsApp</a><a href="#" role="menuitem">${icon('mail')}Email</a></div></div></div>`,
 details:()=>`<div class="block pi-details" data-details-inner></div>`};
P.renderInfo=()=>{const s=cfg(),m=S.model;
 $('#info').innerHTML=s.blocks.filter(k=>!s.hidden.includes(k)).map(k=>(m.digital&&k==='pickup')||(k==='terms'&&s.terms!=='on')?'':B[k](m)).join('');
 const q=$('#info [data-qty]');if(q)MN.qty(q,{value:S.qty,max:Math.min(10,P.variant().stock||10),onChange:v=>S.qty=v});
 P.update(false);P.renderDetails();P.observeAtc();tick()};
const badges=v=>[S.model.digital?'<span class="badge badge--new">Digital</span>':'<span class="badge badge--new">New</span>',v.compare?'<span class="badge badge--sale">Sale</span>':'',v.stock===0?'<span class="badge badge--soldout">Sold out</span>':'',v.stock>0&&v.stock<=5?'<span class="badge badge--low">Low stock</span>':'',S.model.digital?'':'<span class="badge">Made in Italy</span>'].join('');
const stockHTML=v=>{if(S.model.digital)return `<div class="stockbar__text">${icon('download','icon--sm')}<span><b>Instant download</b> after checkout</span></div>`;const sz=S.sel[1];
 if(v.stock===0)return `<div class="stockbar__text"><span><b>Sold out</b> in ${sz}. Leave your email below.</span></div><div class="stockbar__track"><i style="width:0"></i></div>`;
 const low=v.stock<=5;return `<div class="stockbar__text"><span>${low?`Only <b>${v.stock} left</b> in ${sz}`:`<b>In stock</b> in ${sz}, ready to ship`}</span></div><div class="stockbar__track${low?' is-low':''}"><i style="width:${Math.min(100,v.stock/20*100)}%"></i></div>`};
const notes=v=>`<p class="pi-price__notes"><span>Unit price ${money(v.price)} / ${S.model.digital?'licence':'piece'}</span><span>Tax included.</span><span>${S.model.digital?'No shipping, instant download.':'<a href="#" class="link-quiet">Shipping</a> calculated at checkout.'}</span></p>`;
const storeState=(v,k)=>v.stock===0?0:k===0?2:(parseInt(v.id.slice(-2),10)+k)%4===0?0:(k%2?1:2);
const pickupHTML=v=>{const ok=storeState(v,0)>0;return `<span class="pickup__status${ok?'':' is-off'}"></span><div class="pickup__text"><b>${ok?'Pickup available':'Pickup unavailable'} at ${MN.stores[0].a}, Milan</b><span>${ok?'Usually ready in 2 hours':'Not in stock at this store'}</span><button type="button" class="link-quiet" data-open="ov-pickup">Check other stores</button></div>`};
P.renderPickupDrawer=()=>{const v=P.variant();$('#pickupBody').innerHTML=`<div class="store__variant"><span style="${MN.art(P.colour(),0)}"></span><div><b>${S.model.title}</b><br><span class="muted-note">${S.sel.join(' · ')}</span></div></div><div class="stores">${MN.stores.map((st,k)=>{const s=storeState(v,k);return `<div class="store"><span class="pickup__status${s?'':' is-off'}"></span><b>Maison Noir ${st.n}</b><span>${st.a}</span><span>${s===2?'Pickup available, usually ready in 2 hours':s===1?'Available, ready in 2–4 days':'Unavailable for this size'}</span></div>`}).join('')}</div>`};
P.update=colourChanged=>{P.renderPickers();const v=P.variant();
 const set=(sel,html)=>{const el=$('#info '+sel);if(el)el.innerHTML=html};
 set('[data-price]',MN.priceHTML(v,true)+notes(v));set('[data-badges]',badges(v));set('[data-stock]',stockHTML(v));set('[data-pickup]',pickupHTML(v));
 P.renderPickupDrawer();P.updateBuy();if(colourChanged)P.renderGallery();
 try{const u=new URL(location.href);u.searchParams.set('variant',v.id);history.replaceState(null,'',u)}catch(e){}
 MN.sticky&&MN.sticky.update()};
P.needTerms=()=>cfg().terms==='on'&&!S.terms&&!!$('#info [data-terms]');
P.updateBuy=()=>{const v=P.variant(),so=v.stock===0,need=P.needTerms();
 $$('[data-atc][data-main]').forEach(b=>{b.classList.toggle('is-soldout',so);if(b.dataset.state==='idle')b.querySelector('.atc__label').textContent=so?'Sold out — notify me':cfg().atcLabel;b.setAttribute('aria-disabled',need&&!so?'true':'false')});
 $$('#info [data-buynow],#info .express__btn').forEach(b=>b.setAttribute('aria-disabled',need||so?'true':'false'));
 $('#info [data-hint]')?.classList.toggle('is-open',need);if(!so)$('#info [data-notify]')?.classList.remove('is-open');$('#info .pi-terms')?.classList.toggle('is-required',need)};
const toEl=el=>el&&window.scrollTo({top:el.getBoundingClientRect().top+scrollY-140,behavior:'smooth'});
const shakeTerms=()=>{const t=$('#info .pi-terms');if(!t)return;toEl(t);t.classList.remove('is-shake');void t.offsetWidth;t.classList.add('is-shake')};
P.toggleShare=force=>{const s=$('#info .share');if(!s)return;const on=force??!s.classList.contains('is-open');s.classList.toggle('is-open',on);s.firstElementChild.setAttribute('aria-expanded',on)};
P.jumpDesc=()=>{const dr=$('[data-dsec="desc"]');if(dr)return dr.click();const d=[...document.querySelectorAll('.acc__trigger,.tabs__btn,.details-open__title')].find(x=>/^Description|^Delivery/.test(x.textContent.trim()));if(!d)return;const acc=d.closest('.acc');if(acc&&!acc.classList.contains('is-open'))d.click();if(d.classList.contains('tabs__btn')&&d.getAttribute('aria-selected')!=='true')d.click();setTimeout(()=>window.scrollTo({top:(acc||d).getBoundingClientRect().top+scrollY-140,behavior:'smooth'}),acc?320:40)};
P.jumpReviews=()=>{const dr=$('[data-dsec="rev"]');if(dr)return dr.click();const r=$('.reviews');if(!r)return;const acc=r.closest('.acc');if(acc&&!acc.classList.contains('is-open'))acc.firstElementChild.click();const pn=r.closest('.tabs__panel');if(pn&&pn.hidden)pn.closest('.tabs').querySelector(`.tabs__btn[data-tab="${pn.dataset.panel}"]`).click();setTimeout(()=>toEl(acc||pn||r),acc?320:40)};
/* ---- Description / shipping / reviews ---- */
const descHTML=()=>S.model.digital?`<div class="prose"><p>A full-size sewing pattern for the Washed Silk Slip Dress, graded XS to XL, with illustrated step-by-step instructions and a cutting layout for 140 cm silk.</p><ul><li>Print at home on A4 or US Letter, or project at A0</li><li>Seam allowances included, 1 cm throughout</li><li>Fabric suggestions: silk charmeuse, crepe de chine, washed satin</li></ul></div>`
 :`<div class="prose"><p>Cut on the bias from 22-momme mulberry silk, then washed in Como until the surface turns soft and matte. It skims the body without clinging and falls to mid-calf, with adjustable straps and a low cowl back.</p><ul><li>100% mulberry silk, 22 momme</li><li>Bias cut with French seams throughout</li><li>Adjustable straps, cowl back</li><li>Midi length, 118 cm from shoulder in size S</li><li>Made in Italy</li></ul><p class="muted-note">Model is 177 cm and wears size S. Dry clean, or hand wash cold and dry flat away from sunlight.</p></div>`;
const shipHTML=()=>S.model.digital?`<div class="ship-grid"><div class="info-row">${icon('download')}<div><b>Instant delivery</b><span>Download from the order page straight after checkout. A link is also emailed and stays valid for 12 months.</span></div></div><div class="info-row">${icon('shield')}<div><b>Licence</b><span>Personal licence for your own garments. Studio licence covers up to 50 garments for sale.</span></div></div></div>`
 :`<div class="ship-grid"><div class="info-row">${icon('truck')}<div><b>Express delivery</b><span>2–4 business days. Complimentary over $500, otherwise $25.</span></div></div><div class="info-row">${icon('return')}<div><b>Returns</b><span>Free within 30 days. Unworn, with tags. Collected from your door.</span></div></div><div class="info-row">${icon('store')}<div><b>Pickup in store</b><span>Milan, Paris, London and New York, usually ready in 2 hours.</span></div></div><div class="info-row">${icon('globe')}<div><b>Duties</b><span>Included for the US, UK and EU. Nothing to pay on delivery.</span></div></div></div>`;
const reviewsHTML=()=>{const m=S.model,dist=m.digital?[49,7,2,0,0]:[98,19,6,2,1],tot=dist.reduce((a,b)=>a+b,0);
 return `<div class="reviews"><div class="rv-summary"><div class="rv-summary__score">${m.rating}</div>${MN.stars(m.rating)}<p class="rv-summary__count">Based on ${m.reviews} reviews</p><div class="rv-bars">${dist.map((n,k)=>`<div class="rv-bar"><span>${5-k}★</span><span class="rv-bar__track"><i style="width:${n/tot*100}%"></i></span><span>${n}</span></div>`).join('')}</div>${m.digital?'':`<dl class="rv-fit"><dt>Fit</dt><dd><span class="rv-fit__scale"><i style="left:54%"></i></span><span class="rv-fit__labels"><span>Small</span><span>True to size</span><span>Large</span></span></dd></dl>`}<button type="button" class="btn btn--secondary btn--block btn--sm" data-toast="The review form opens here">Write a review</button></div>
 <div class="rv-list">${MN.reviews.map(r=>`<article class="review"><div class="review__head">${MN.stars(r.r)}<span class="review__name">${r.name}</span><span class="review__verified">${icon('check','icon--sm')}Verified buyer</span><span class="review__date">${r.date}</span></div><h4 class="review__title">${r.title}</h4><p class="review__body">${r.body}</p><div class="review__photos">${r.photos.map((c,k)=>`<button type="button" class="review__photo" style="${MN.art(c,k+2)}" aria-label="Customer photo"></button>`).join('')}</div><p class="review__meta">${r.meta}</p></article>`).join('')}<button type="button" class="link-arrow rv-more">Show all ${m.reviews} reviews${icon('arrow-right')}</button></div></div>`};
P.renderDetails=()=>{const s=cfg(),L=s.layout,m=S.model;
 const secs=[{k:'desc',t:'Description',c:descHTML()},{k:'ship',t:m.digital?'Delivery & licence':'Shipping & returns',c:shipHTML()},{k:'rev',t:`Reviews<span class="tab-count">${m.reviews}</span>`,c:reviewsHTML()}];P._secs=secs;
 const per=s.detailsStyle==='per-section'||(s.detailsStyle==='auto'&&L==='mixed');
 const all=per?null:(s.detailsStyle!=='auto'?s.detailsStyle:(L==='default-tab'?'tabs':'accordion'));
 let place=s.detailsPlace!=='auto'?s.detailsPlace:(L==='default-tab'||L==='mixed'?'below':L==='inner'?'right':'left');
 if(place==='left'&&/^slider-(full|container)$/.test(s.gallery))place='below';
 if(place==='right'&&!$('#info [data-details-inner]'))place='left';
 const mode=k=>all||({desc:s.tabDesc,ship:s.tabShip,rev:s.tabRev})[k];
 const pick=f=>secs.filter(x=>f(mode(x.k)||''));
 const accs=pick(v=>v.startsWith('accordion')),tabs=pick(v=>v.startsWith('tabs')),open=pick(v=>v==='open'),rows=pick(v=>v==='drawer');
 const tabCls=all==='tabs-pill'?'tabs--pill':all==='tabs-vertical'?'tabs--vertical':'';
 const strip=t=>t.replace(/<span.*<\/span>/,'');
 const html=(tabs.length?`<div class="details-tabs">${MN.tabsHTML(tabs,tabCls)}</div>`:'')
  +(accs.length?`<div class="details-accs${all==='accordion-card'?' acc-cards':''}">${accs.map((x,k)=>MN.acc(x.t,x.c,k===0&&(place==='left'||L==='inner'),all==='accordion-card'?'acc--card':'')).join('')}</div>`:'')
  +(rows.length?`<div class="drows">${rows.map(x=>`<button type="button" class="drow" data-dsec="${x.k}">${x.t.replace('<span class="tab-count">','<small>').replace('</span>','</small>')}${icon('arrow-right')}</button>`).join('')}</div>`:'')
  +open.map(x=>`<section class="details-open"><h2 class="details-open__title">${strip(x.t)}</h2>${x.c}</section>`).join('');
 const T={left:$('#detailsLeft'),right:$('#info [data-details-inner]'),below:$('#detailsBelow')};
 Object.entries(T).forEach(([k,el])=>{if(!el)return;const on=k===place&&!!html;el.innerHTML=on?html:'';el.hidden=!on;if(on)MN.initTabs(el)});
 P.fitInfo()};
P.fitInfo=()=>{P.thumbNav&&P.thumbNav();const i=$('#info'),l=$('.product__left'),g=$('.product__grid');if(!i||!l)return;const twoCol=getComputedStyle(g).gridTemplateColumns.split(' ').length>1;const sticky=twoCol&&l.offsetHeight>i.offsetHeight+40;i.classList.toggle('is-sticky',sticky);if(!sticky){i.style.top='';return}const ho=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-offset'))||76,h=i.offsetHeight;i.style.top=(h>innerHeight-ho-40?Math.min(ho+20,innerHeight-h-24):ho+20)+'px'};
/* ---- Countdown + visitors ---- */
const endKey='mn-countdown-end';let end=+localStorage.getItem(endKey);if(!end||end<Date.now()){end=Date.now()+((2*24+14)*3600+33*60)*1000;localStorage.setItem(endKey,end)}
function tick(){const d=Math.max(0,end-Date.now())/1000,u=[d/86400,d%86400/3600,d%3600/60,d%60].map(Math.floor);$$('[data-countdown]').forEach(el=>el.querySelectorAll('b').forEach((b,k)=>b.textContent=String(u[k]).padStart(2,'0')))}
/* ---- Sticky bar visibility ---- */
P.checkSticky=()=>{const b=$('#mainAtc');const want=S.forceSticky||(!!b&&b.getBoundingClientRect().bottom<0);if(want!==$('#stickyAtc').classList.contains('is-visible'))MN.sticky.show(want)};
P.observeAtc=()=>{P._io&&P._io.disconnect();const b=$('#mainAtc');if(b&&'IntersectionObserver' in window){P._io=new IntersectionObserver(P.checkSticky);P._io.observe(b)}P.checkSticky()};
P.forceSticky=on=>{S.forceSticky=on;MN.sticky.show(on)};
P.apply=()=>{const want=cfg().layout==='digital'?MN.digital:MN.main;if(S.model!==want){S.model=want;S.sel=want.default.slice()}
 $('#crumbTitle').textContent=S.model.title;$('#crumbCat').textContent=S.model.digital?'Patterns':'Dresses';P.renderGallery();P.renderInfo();MN.compare&&MN.compare.paint()};
P.init=()=>{bindGallery();const info=$('#info');
 info.addEventListener('change',e=>{if(e.target.matches('[data-terms]')){S.terms=e.target.checked;P.updateBuy()}});
 info.addEventListener('click',e=>{const t=e.target;
  const bn=t.closest('[data-buynow],.express__btn');if(bn){if(bn.getAttribute('aria-disabled')==='true'){if(P.needTerms())shakeTerms();return}MN.toast('Taking you to secure checkout…');return}
  const cp=t.closest('[data-copy]');if(cp){navigator.clipboard?.writeText(cp.dataset.copy).catch(()=>{});cp.textContent='Copied';setTimeout(()=>cp.textContent=cp.dataset.copy,1600);return}
  if(t.closest('[data-share]'))return P.toggleShare();
  const cl=t.closest('[data-copy-link]');if(cl){navigator.clipboard?.writeText(location.href).catch(()=>{});cl.lastElementChild.textContent='Link copied';setTimeout(()=>cl.lastElementChild.textContent='Copy link',1600);return}
  if(t.closest('[data-jump]')){e.preventDefault();P.jumpReviews();return}
  if(t.closest('[data-read-more]')){P.jumpDesc();return}
  const dr=t.closest('[data-dsec]');if(dr&&false){const x=P._secs.find(s=>s.k===dr.dataset.dsec);$('#detailsT').innerHTML=x.t.replace(/<span.*<\/span>/,'');$('#detailsBody').innerHTML=`<div class="pi-details">${x.c}</div>`;MN.overlay.open('ov-details',dr)}});
 info.addEventListener('submit',e=>{if(e.target.matches('[data-notify-form]')){e.preventDefault();e.target.outerHTML=`<p class="buy__notify-done">${icon('check','icon--sm')}We'll email you when ${esc(S.sel.join(' / '))} is back.</p>`}});
 document.addEventListener('pointerdown',e=>{const s=$('#info .share.is-open');if(s&&!s.contains(e.target))P.toggleShare(false)});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-atc][data-main]');if(!b)return;const v=P.variant();
  if(v.stock===0){const n=$('#info [data-notify]');if(n){n.classList.add('is-open');if(b.closest('.sticky-atc'))toEl(n);setTimeout(()=>n.querySelector('input')?.focus({preventScroll:true}),350)}return}
  if(P.needTerms())return shakeTerms();
  MN.runAtc(b,{title:S.model.title,variant:S.sel.join(' · '),colour:P.colour(),price:v.price,qty:S.qty})});
 addEventListener('scroll',P.checkSticky,{passive:true});addEventListener('resize',()=>{P.checkSticky();P.fitInfo()});if('ResizeObserver' in window){const ro=new ResizeObserver(()=>P.fitInfo());ro.observe($('#info'));ro.observe($('.product__left'))}
 setInterval(tick,1000);
 setInterval(()=>{const el=$('[data-visitors]');if(el)el.textContent=12+Math.floor(Math.random()*14)},5000)};
})();

document.addEventListener('click',e=>{const dr=e.target.closest('[data-dsec]');if(!dr)return;const P=MN.pdp,x=P._secs.find(s=>s.k===dr.dataset.dsec);document.getElementById('detailsT').innerHTML=x.t.replace(/<span.*<\/span>/,'');document.getElementById('detailsBody').innerHTML='<div class="pi-details">'+x.c+'</div>';MN.overlay.open('ov-details',dr)});
