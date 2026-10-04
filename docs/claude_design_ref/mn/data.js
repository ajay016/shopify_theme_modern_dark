window.MN={};
(()=>{
const C={Black:'#1B1A19',Ivory:'#ECE5D6',Champagne:'#D6BE97',Bordeaux:'#5B1923',Camel:'#B38650',Charcoal:'#46474A',Gold:'#C7A35A',Stone:'#BDB5A8',Navy:'#25304A',Sage:'#A5AD95',Blush:'#E0C2BA'};
MN.colors=C;
const A=[83,101,72,112,95,88],H=['34% 14%','68% 22%','22% 30%','74% 12%','50% 8%','30% 20%'],D=['86% 92%','16% 96%','90% 70%','10% 80%','50% 100%','80% 100%'];
/* Tonal placeholder art standing in for product photography */
MN.art=(n,s=0)=>{const h=C[n]||n,k=s%6;return `background-color:${h};background-image:repeating-linear-gradient(${A[k]}deg,rgba(0,0,0,.16) 0,rgba(0,0,0,0) 22px,rgba(255,255,255,.12) 40px,rgba(0,0,0,0) 58px,rgba(0,0,0,.15) 80px),radial-gradient(60% 46% at ${H[k]},rgba(255,255,255,.3),transparent 64%),radial-gradient(96% 72% at ${D[k]},rgba(0,0,0,.45),transparent 62%),linear-gradient(${190+k*7}deg,color-mix(in oklab,${h},white 16%),${h} 46%,color-mix(in oklab,${h},black 38%));background-size:cover`};
MN.money=n=>'$'+Number(n).toLocaleString('en-US');

/* Main product */
const ST={Black:[6,4,9,0,3],Ivory:[5,8,4,0,2],Champagne:[null,4,6,0,5],Bordeaux:[3,2,4,0,1]};
const PR={Bordeaux:[920,1150]};
MN.main={id:'washed-silk-slip-dress',vendor:'Maison Noir',title:'Washed Silk Slip Dress',rating:4.8,reviews:126,colorOption:0,
 options:[{name:'Colour',values:['Black','Ivory','Champagne','Bordeaux']},{name:'Size',values:['XS','S','M','L','XL']}],
 shots:['Front','Back','Detail','On figure'],default:['Black','S'],variants:[]};
MN.main.options[0].values.forEach((c,ci)=>MN.main.options[1].values.forEach((s,si)=>{const q=ST[c][si];if(q===null)return;const [p,cp]=PR[c]||[890,1120];MN.main.variants.push({id:'4710'+ci+si,opts:[c,s],stock:q,price:p,compare:cp})}));

/* Digital product (Digital products layout) */
MN.digital={id:'slip-dress-pattern',vendor:'Maison Noir Studio',title:'Slip Dress Sewing Pattern',rating:4.9,reviews:58,digital:true,colorOption:-1,baseColour:'Ivory',
 options:[{name:'Format',values:['PDF · A4','PDF · US Letter','Projector file']},{name:'Licence',values:['Personal','Studio']}],
 shots:['Pattern sheet','Instructions','Cutting layout'],default:['PDF · A4','Personal'],variants:[],
 spec:{'Format':'PDF (A4 or US Letter), A0 projector file','File size':'24 MB, zipped','Licence':'Personal use, or Studio for up to 50 garments','Delivery':'Instant download, link also sent by email'}};
MN.digital.options[0].values.forEach((f,fi)=>MN.digital.options[1].values.forEach((l,li)=>MN.digital.variants.push({id:'5900'+fi+li,opts:[f,l],stock:999,price:li?140:48,compare:0})));

/* Catalogue for cards, search, quick view */
MN.products=[
{id:'p1',vendor:'Maison Noir',title:'Silk Charmeuse Camisole',price:420,colors:['Black','Ivory','Champagne'],sizes:['XS','S','M','L','XL'],oos:['XL'],rating:4.7,reviews:88,badge:'new'},
{id:'p2',vendor:'Maison Noir',title:'Cashmere Wrap Coat',price:1890,compare:2360,colors:['Camel','Black','Stone'],sizes:['XS','S','M','L'],oos:[],rating:4.9,reviews:64},
{id:'p3',vendor:'Ossa',title:'Leather Slingback Mule',price:640,colors:['Black','Bordeaux'],sizes:['36','37','38','39','40'],oos:['36','40'],rating:4.6,reviews:51,low:2},
{id:'p4',vendor:'Maison Noir',title:'Pleated Satin Midi Skirt',price:560,colors:['Champagne','Black','Bordeaux'],sizes:['XS','S','M','L'],oos:['XS'],rating:4.5,reviews:39},
{id:'p5',vendor:'Atelier Ondine',title:'Gold Vermeil Hoops',price:290,colors:['Gold'],sizes:['One size'],oos:[],rating:4.8,reviews:212,badge:'new'},
{id:'p6',vendor:'Ossa',title:'Croissant Leather Bag',price:980,colors:['Black','Champagne','Bordeaux'],sizes:['One size'],oos:[],rating:4.7,reviews:97},
{id:'p7',vendor:'Halden',title:'Merino Rib Cardigan',price:360,compare:450,colors:['Ivory','Black','Champagne','Sage','Blush'],sizes:['XS','S','M','L','XL'],oos:['M'],rating:4.4,reviews:140},
{id:'p8',vendor:'Maison Noir',title:'Tailored Wool Trouser',price:520,colors:['Black','Charcoal','Ivory'],sizes:['XS','S','M','L','XL'],oos:['XS','S','M','L','XL'],rating:4.6,reviews:73,soldout:true},
{id:'p9',vendor:'Maison Noir',title:'Silk Twill Scarf',price:240,colors:['Ivory','Bordeaux','Navy'],sizes:['One size'],oos:[],rating:4.9,reviews:156},
{id:'p10',vendor:'Ossa',title:'Satin Kitten-Heel Pump',price:590,compare:740,colors:['Black','Champagne'],sizes:['36','37','38','39','40'],oos:['39'],rating:4.3,reviews:28,low:3},
{id:'p11',vendor:'Maison Noir',title:'Silk Organza Shirt',price:480,colors:['Ivory','Black'],sizes:['XS','S','M','L'],oos:[],rating:4.5,reviews:44,badge:'new'},
{id:'p12',vendor:'Halden',title:'Cashmere Rollneck',price:540,colors:['Camel','Charcoal','Ivory','Navy'],sizes:['XS','S','M','L','XL'],oos:['L'],rating:4.8,reviews:191}];
MN.mainCard={id:'main',vendor:'Maison Noir',title:'Washed Silk Slip Dress',price:890,compare:1120,colors:['Black','Ivory','Champagne','Bordeaux'],sizes:['XS','S','M','L','XL'],oos:['L'],rating:4.8,reviews:126};

MN.toModel=p=>{if(p.id==='main')return MN.main;const variants=[];p.colors.forEach((c,ci)=>p.sizes.forEach((s,si)=>variants.push({id:p.id+ci+si,opts:[c,s],stock:p.soldout||p.oos.includes(s)?0:(p.low||7),price:p.price,compare:p.compare||0})));return {id:p.id,vendor:p.vendor,title:p.title,rating:p.rating,reviews:p.reviews,colorOption:0,options:[{name:'Colour',values:p.colors},{name:'Size',values:p.sizes}],variants,shots:['Front','Back','Detail']}};
MN.findVariant=(m,sel)=>m.variants.find(v=>v.opts.every((o,k)=>o===sel[k]));
MN.valueState=(m,sel,i,val)=>{const c=sel.slice();c[i]=val;const v=MN.findVariant(m,c);return !v?'unavailable':v.stock===0?'soldout':'ok'};

/* Navigation: menu → submenu → sub-submenu */
MN.menu=[
{t:'New In'},
{t:'Women',feature:{eyebrow:'New season',title:'The Silk Edition',cta:'Shop the edit',colour:'Champagne'},groups:[
 {t:'Ready-to-wear',colour:'Black',shot:0,links:['Dresses','Knitwear','Coats & jackets','Tailoring','Skirts','Shirts & tops']},
 {t:'Shoes',colour:'Bordeaux',shot:2,links:['Mules','Ankle boots','Loafers','Pumps','Sandals']},
 {t:'Bags',colour:'Camel',shot:1,links:['Shoulder bags','Totes','Clutches','Small leather goods']},
 {t:'Edits',colour:'Ivory',shot:3,links:['The Silk Edition','Evening','The Winter Coat','Gifts under $500']}]},
{t:'Men',feature:{eyebrow:'Tailoring',title:'The Florence Suit',cta:'Discover',colour:'Charcoal'},groups:[
 {t:'Ready-to-wear',colour:'Charcoal',shot:0,links:['Coats','Knitwear','Shirts','Trousers','Suits']},
 {t:'Shoes',colour:'Black',shot:2,links:['Loafers','Boots','Derbies','Sneakers']},
 {t:'Accessories',colour:'Navy',shot:1,links:['Belts','Scarves','Ties','Gloves']}]},
{t:'Accessories',feature:{eyebrow:'Fine jewellery',title:'Gold Vermeil',cta:'Shop jewellery',colour:'Gold'},groups:[
 {t:'Jewellery',colour:'Gold',shot:0,links:['Earrings','Necklaces','Rings','Bracelets']},
 {t:'Scarves',colour:'Bordeaux',shot:1,links:['Silk twill','Cashmere','Stoles']},
 {t:'Eyewear',colour:'Black',shot:3,links:['Sunglasses','Optical']},
 {t:'Belts & gloves',colour:'Camel',shot:2,links:['Leather belts','Gloves','Hair accessories']}]},
{t:'Journal'},{t:'Stores'}];
MN.announce=['Complimentary express shipping on orders over $500','Free returns within 30 days','The Silk Edition: washed in Como, cut in Florence','Book a private appointment in Milan, Paris, London or New York'];
MN.collections=['Dresses','Slip dresses','The Silk Edition','Knitwear','Coats & jackets','Evening','Shoes','Bags','Jewellery','Scarves'];
MN.pages=['Size guide','Shipping & returns','Caring for silk','Our ateliers','Book an appointment','Gift cards'];
MN.reviews=[
{name:'Camille R.',r:5,date:'12 Sep 2026',title:'Falls like water',body:'The wash takes the shine down just enough that it reads as daywear with a knit over it, and the bias cut does the rest. I took my usual S and it skims rather than clings.',meta:'Size bought: S · Fits true to size',photos:['Black','Black']},
{name:'Hannah L.',r:5,date:'28 Aug 2026',title:'Worth waiting for the Bordeaux',body:'The colour is deeper in person, closer to wine than red. The straps adjust far enough that I didn\'t need any alterations.',meta:'Size bought: M · Fits true to size',photos:['Bordeaux']},
{name:'Sofia M.',r:4,date:'3 Aug 2026',title:'Beautiful silk, size up if between',body:'Heavier silk than I expected, in a good way. I\'m between sizes and the S was close at the hip, so I exchanged for the M. The exchange took four days.',meta:'Size bought: M · Runs slightly small at the hip',photos:['Champagne','Ivory']}];
MN.stores=[{n:'Milan',a:'Via della Spiga 26'},{n:'Paris',a:'219 Rue Saint-Honoré'},{n:'London',a:'28 Mount Street, Mayfair'},{n:'New York',a:'870 Madison Avenue'}];
MN.countries=['United States (USD $)','United Kingdom (GBP £)','France (EUR €)','Italy (EUR €)','Japan (JPY ¥)','Australia (AUD $)'];
MN.languages=['English','Français','Italiano','Deutsch','日本語'];
})();
