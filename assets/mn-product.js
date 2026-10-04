/**
 * Maison Noir — product page and quick view.
 * Ported from docs/claude_design_ref/mn/product.js and mn/extras.js with the
 * demo product replaced by Shopify's (snippets/mn-product-json.liquid):
 * pickers (image / colour / radio / text / dropdown), price, badges, stock,
 * pickup, gallery (zoom, lightbox, video, 3D), terms, buy button states,
 * back-in-stock and ask-a-question forms, share, size guide, compare
 * colours, details drawer, sticky information column, smart sticky bar.
 */
(() => {
  'use strict';
  const MN = window.MN;
  if (!MN) return;
  const { $, $$, icon, esc } = MN;
  const money = c => MN.money(c);
  const T = (s, m) => Object.entries(m || {}).reduce((a, [k, v]) => a.split(k).join(v), s || '');
  const rootUrl = () => ((window.routes && window.routes.root_url) || '/').replace(/\/?$/, '/');
  const json = el => { try { return JSON.parse(el.textContent); } catch (e) { return null; } };

  /* ---- Model helpers ---- */
  const findVariant = (m, sel) => m.variants.find(v => v.opts.every((o, k) => o === sel[k]));
  const valueState = (m, sel, i, val) => { const c = sel.slice(); c[i] = val; const v = findVariant(m, c); return !v ? 'unavailable' : !v.available ? 'soldout' : 'ok'; };
  const kindIdx = (m, kind) => m.options.findIndex(o => o.kind === kind);
  const swatchBg = style => (style || '').replace(/^\s*background(-color|-image)?\s*:\s*/, '').replace(/;\s*$/, '') || 'var(--bg-deep)';
  MN.findVariant = findVariant;

  MN.priceHTML = (v, big) => {
    const sale = v.compare > v.price, off = sale ? Math.round((1 - v.price / v.compare) * 100) : 0;
    return `<div class="price${sale ? ' price--sale' : ''}${big ? ' price--lg' : ''}"><span class="price__now">${money(v.price)}</span>${sale ? `<s class="price__was"><span class="visually-hidden">Was </span>${money(v.compare)}</s><span class="badge badge--sale">−${off}%</span>` : ''}</div>`;
  };

  /* ---- Variant pickers, one type per option (design MN.renderPickers) ---- */
  MN.renderPickers = (root, ctx) => {
    const m = ctx.model, sel = ctx.sel, S = ctx.str; root._ctx = ctx;
    root.innerHTML = m.options.map((o, i) => {
      const type = ctx.type(i, o), isCol = o.kind === 'colour';
      const st = v => valueState(m, sel, i, v);
      const cls = v => ({ ok: '', soldout: ' is-soldout', unavailable: ' is-unavailable' })[st(v)];
      const tip = v => ({ ok: v, soldout: T(S.tip_soldout, { __V__: v }), unavailable: T(S.tip_unavailable, { __V__: v }) })[st(v)];
      const base = v => `type="button" role="radio" data-opt="${i}" data-val="${esc(v)}" aria-checked="${v === sel[i]}" title="${esc(tip(v))}" aria-label="${esc(tip(v))}"${st(v) === 'unavailable' ? ' disabled' : ''}`;
      let body;
      if (type === 'colour' && isCol) body = `<div class="swatches" role="radiogroup" aria-label="${esc(o.name)}">${o.values.map(v => `<button ${base(v.label)} class="sw-colour${cls(v.label)}" style="background:${esc(swatchBg(v.swatch))}"></button>`).join('')}</div>`;
      else if (type === 'image' && isCol) body = `<div class="swatches" role="radiogroup" aria-label="${esc(o.name)}">${o.values.map(v => `<button ${base(v.label)} class="sw-image${cls(v.label)}"><span style="${v.image ? '' : `background:${esc(swatchBg(v.swatch))}`}">${v.image ? `<img class="mn-fill" src="${esc(v.image)}" alt="" loading="lazy">` : ''}</span></button>`).join('')}</div>`;
      else if (type === 'radio') body = `<div class="sw-radio-list" role="radiogroup" aria-label="${esc(o.name)}">${o.values.map(v => {
        const s = st(v.label), c = sel.slice(); c[i] = v.label; const va = findVariant(m, c);
        const meta = s === 'soldout' ? S.meta_soldout : s === 'unavailable' ? S.meta_unavailable : ctx.digital && va ? money(va.price) : (va && va.stock != null && va.stock <= ctx.low ? T(S.only_left, { __N__: va.stock }) : '');
        return `<button ${base(v.label)} class="sw-radio${cls(v.label)}"><span class="sw-radio__dot"></span>${isCol ? `<span class="sw-radio__chip" style="background:${esc(swatchBg(v.swatch))}"></span>` : ''}<span class="sw-radio__name">${esc(v.label)}</span><span class="sw-radio__meta">${esc(meta)}</span></button>`;
      }).join('')}</div>`;
      else if (type === 'dropdown') body = `<div class="picker__select" data-select-opt="${i}"></div>`;
      else body = `<div class="swatches" role="radiogroup" aria-label="${esc(o.name)}">${o.values.map(v => `<button ${base(v.label)} class="sw-text${cls(v.label)}">${esc(v.label)}</button>`).join('')}</div>`;
      const link = ctx.links && !ctx.digital ? (isCol && ctx.links.compare ? `<button type="button" class="picker__link" data-open="ov-compare">${icon('compare', 'icon--sm')}${esc(S.compare_colours)}</button>` : o.kind === 'size' && ctx.links.size ? `<button type="button" class="picker__link" data-open="ov-size">${icon('ruler', 'icon--sm')}${esc(S.size_guide)}</button>` : '') : '';
      return `<div class="picker" data-picker="${i}"><div class="picker__head"><span class="picker__label">${esc(o.name)}<span>${esc(sel[i])}</span></span>${link}</div>${body}</div>`;
    }).join('');
    $$('[data-select-opt]', root).forEach(h => {
      const i = +h.dataset.selectOpt, o = m.options[i];
      new MN.Select(h, { label: o.name, value: sel[i], options: o.values.map(v => { const s = valueState(m, sel, i, v.label); return { value: v.label, disabled: s === 'unavailable', soldout: s === 'soldout', meta: s === 'soldout' ? S.meta_soldout : s === 'unavailable' ? S.meta_unavailable : '', swatch: o.kind === 'colour' ? swatchBg(v.swatch) : null }; }), onChange: v => root._ctx.onChange(i, v) });
    });
    if (!root._bound) { root._bound = 1; root.addEventListener('click', e => { const b = e.target.closest('[data-opt][data-val]'); if (b && !b.disabled) root._ctx.onChange(+b.dataset.opt, b.dataset.val); }); }
  };

  /* ---- Buy button: loading → added → idle, through MN.cart ---- */
  const runAtc = async (btn, body, opts, S, done) => {
    if (btn.dataset.state !== 'idle') return;
    const lab = btn.querySelector('.atc__label');
    btn.dataset.state = 'loading'; lab.textContent = S.adding;
    try {
      await MN.cart.add(body, Object.assign({ quiet: true, opener: btn }, opts));
      btn.dataset.state = 'added'; lab.textContent = S.added;
      setTimeout(() => { btn.dataset.state = 'idle'; done && done(); }, 1800);
    } catch (err) {
      MN.toast(err.message);
      btn.dataset.state = 'idle'; done && done();
    }
  };
  const afterAdd = pref => {
    if (!$('#ov-cart')) return 'page';
    return pref === 'drawer' || pref === 'notification' ? pref : undefined;
  };
  const postForm = async form => {
    const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'text/html' } });
    if (!r.ok || /challenge/.test(r.url)) throw new Error('fallback');
    return r;
  };

  /* ==================================================================
     Product page
     ================================================================== */
  const P = MN.pdp = {};
  P.init = sec => {
    if (!sec || sec._pdp) return; sec._pdp = 1;
    const model = json($('[data-product-json]', sec)), S = json($('[data-pdp-strings]', sec)) || {};
    if (!model) return;
    const d = sec.dataset, digital = d.layout === 'digital';
    const low = +d.low || 5, full = +d.full || 20;
    const info = $('#info', sec), form = $('form.mn-pform', sec);
    const ci = kindIdx(model, 'colour'), si = kindIdx(model, 'size');
    const urlId = +new URLSearchParams(location.search).get('variant');
    const start = model.variants.find(v => v.id === urlId) || model.variants.find(v => v.id === +($('[data-variant-input]', sec) || {}).value) || model.variants.find(v => v.available) || model.variants[0];
    const st = { sel: start ? start.opts.slice() : [], qty: 1, terms: false };
    const variant = () => findVariant(model, st.sel) || model.variants.find(v => v.available) || model.variants[0];
    const colour = () => (ci >= 0 ? st.sel[ci] : '');
    const sizeLabel = v => (si >= 0 ? st.sel[si] : (v.title === 'Default Title' ? '' : v.title));
    P.state = st; P.model = model; P.variant = variant;

    const pick = $('[data-pickers]', sec);
    const ctx = {
      model, get sel() { return st.sel; }, str: S, low, digital,
      links: pick ? { size: pick.dataset.sizeGuide === 'true' && !!$('#ov-size', sec), compare: pick.dataset.compareColours === 'true' && ci >= 0 && model.options[ci].values.length > 1 } : null,
      type: (i, o) => (digital ? (i === 0 ? 'text' : 'radio') : o.kind === 'colour' ? d.colourType : d.sizeType),
      onChange: (i, v) => { const cc = i === ci && v !== st.sel[i]; st.sel[i] = v; update(cc); },
    };
    P.ctx = ctx;

    /* ---- badges, stock, price ---- */
    const badges = v => {
      const b = $('[data-badges]', sec); if (!b) return;
      b.innerHTML = [b.dataset.new ? `<span class="badge badge--new">${esc(S.new)}</span>` : '', v.compare > v.price ? `<span class="badge badge--sale">${esc(S.sale)}</span>` : '', !v.available ? `<span class="badge badge--soldout">${esc(S.soldout)}</span>` : '', v.available && v.stock != null && v.stock > 0 && v.stock <= low ? `<span class="badge badge--low">${esc(S.low)}</span>` : '', b.dataset.extra ? `<span class="badge">${esc(b.dataset.extra)}</span>` : ''].join('');
      b.hidden = !b.innerHTML;
    };
    const stockHTML = v => {
      if (digital) return `<div class="stockbar__text">${icon('download', 'icon--sm')}<span>${S.stock_digital}</span></div>`;
      const sz = esc(sizeLabel(v));
      if (!v.available) return `<div class="stockbar__text"><span>${T(S.stock_out, { __V__: sz })}</span></div><div class="stockbar__track"><i style="width:0"></i></div>`;
      if (v.stock == null) return `<div class="stockbar__text"><span>${sz ? T(S.stock_in, { __V__: sz }) : S.stock_in_plain}</span></div><div class="stockbar__track"><i style="width:100%"></i></div>`;
      const isLow = v.stock <= low;
      return `<div class="stockbar__text"><span>${isLow ? T(S.stock_low, { __N__: v.stock, __V__: sz }) : sz ? T(S.stock_in, { __V__: sz }) : S.stock_in_plain}</span></div><div class="stockbar__track${isLow ? ' is-low' : ''}"><i style="width:${Math.min(100, v.stock / full * 100)}%"></i></div>`;
    };
    const price = v => {
      const p = $('[data-price]', sec); if (!p) return;
      const pr = p.querySelector('.price'); if (pr) pr.outerHTML = MN.priceHTML(v, true);
      const u = p.querySelector('[data-unit-price]');
      if (u) { u.hidden = !v.unit; if (v.unit) u.textContent = T(S.unit, { __P__: money(v.unit.price), __R__: v.unit.ref }); }
    };

    /* ---- pickup (Shopify store availability) ---- */
    const pickupEl = $('[data-pickup]', sec);
    const pickup = async v => {
      if (!pickupEl) return;
      try {
        const r = await fetch(`${rootUrl()}variants/${v.id}/?section_id=mn-pickup`);
        const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
        const sum = doc.querySelector('[data-pickup-summary]'), list = doc.querySelector('[data-pickup-list]');
        pickupEl.hidden = !sum; pickupEl.innerHTML = sum ? sum.innerHTML : '';
        const body = $('#pickupBody', sec); if (body) body.innerHTML = list ? list.innerHTML : '';
      } catch (e) { pickupEl.hidden = true; }
    };

    /* ---- terms and buy states ---- */
    const needTerms = () => !!$('[data-terms]', info) && !st.terms;
    const updateBuy = () => {
      const v = variant(), so = !v.available, need = needTerms();
      $$('[data-atc][data-main]', sec).forEach(b => {
        b.classList.toggle('is-soldout', so);
        if (b.dataset.state === 'idle') b.querySelector('.atc__label').textContent = so ? S.soldout_notify : S.atc;
        b.setAttribute('aria-disabled', need && !so ? 'true' : 'false');
      });
      const dyn = $('.buy__dynamic', sec); if (dyn) dyn.classList.toggle('is-disabled', need || so);
      $('[data-hint]', sec)?.classList.toggle('is-open', need);
      if (!so) $('[data-notify]', sec)?.classList.remove('is-open');
      $('.pi-terms', sec)?.classList.toggle('is-required', need);
    };
    const toEl = el => el && window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 140, behavior: 'smooth' });
    const shakeTerms = () => { const t = $('.pi-terms', sec); if (!t) return; toEl(t); t.classList.remove('is-shake'); void t.offsetWidth; t.classList.add('is-shake'); };

    /* ---- update everything for the chosen variant ---- */
    const update = colourChanged => {
      if (pick) MN.renderPickers(pick, ctx);
      const v = variant();
      const input = $('[data-variant-input]', sec); if (input) input.value = v.id;
      // a new choice is a new purchase: drop any "Added" state
      $$('[data-atc][data-main]', sec).forEach(b => { if (b.dataset.state === 'added') b.dataset.state = 'idle'; });
      price(v); badges(v);
      const sb = $('[data-stock]', sec); if (sb) sb.innerHTML = stockHTML(v);
      updateBuy(); pickup(v);
      if (qtyHost) setQty(v);
      if (colourChanged && d.groupColour === 'true') groupMedia();
      if (v.media) { const i = mediaIndex(v.media); if (i > -1) go(i); }
      $$('[data-ask-variant]', sec).forEach(x => (x.textContent = st.sel.join(' · ')));
      try { const u = new URL(location.href); u.searchParams.set('variant', v.id); history.replaceState(history.state, '', u); } catch (e) {}
      sticky.update();
      document.dispatchEvent(new CustomEvent('variant:change', { detail: { variant: v, section: sec } }));
    };

    /* ---- quantity ---- */
    let qtyHost = $('[data-qty]', sec);
    // MN.qty binds to its host, so each render gets a fresh one
    const freshQty = () => { const f = qtyHost.cloneNode(false); qtyHost.replaceWith(f); qtyHost = f; return f; };
    const setQty = v => {
      freshQty();
      const max = v.stock != null && v.stock > 0 ? Math.min(v.stock, d.qtyStyle === 'dropdown' ? 10 : 99) : (d.qtyStyle === 'dropdown' ? 10 : 99);
      st.qty = Math.min(st.qty, max);
      MN.qty(qtyHost, { style: d.qtyStyle, max, value: st.qty, name: 'quantity', label: S.quantity, onChange: x => { st.qty = x; syncQtyInput(); } });
      syncQtyInput();
    };
    const syncQtyInput = () => {
      if (!qtyHost) return;
      let inp = qtyHost.querySelector('input[name="quantity"]');
      if (!inp) { inp = document.createElement('input'); inp.type = 'hidden'; inp.name = 'quantity'; qtyHost.appendChild(inp); }
      inp.value = st.qty; inp.setAttribute('form', qtyHost.dataset.form);
    };

    /* ---- gallery ---- */
    const g = $('#gallery', sec);
    const track = () => $('.gallery__track', g), strip = () => $('.gallery__thumbs', g);
    const vert = () => { const s = strip(); return !!s && getComputedStyle(s).flexDirection === 'column'; };
    let cur = 0;
    const visibleMedia = () => [...track().children].filter(x => !x.hidden);
    const thumbNav = () => { const s = strip(); if (!s) return; const v = vert(), pos = v ? s.scrollTop : s.scrollLeft, max = v ? s.scrollHeight - s.clientHeight : s.scrollWidth - s.clientWidth; s.classList.toggle('can-prev', pos > 2); s.classList.toggle('can-next', pos < max - 2); };
    const showThumb = i => { const s = strip(), t = s && s.querySelectorAll('.thumb')[i]; if (!t || t.hidden) return; const v = vert(), a = v ? t.offsetTop : t.offsetLeft, len = v ? t.offsetHeight : t.offsetWidth, view = v ? s.clientHeight : s.clientWidth, pos = v ? s.scrollTop : s.scrollLeft, pad = 40; let to = null; if (a < pos + pad) to = a - pad; else if (a + len > pos + view - pad) to = a + len - view + pad; if (to !== null) s.scrollTo({ [v ? 'top' : 'left']: to, behavior: 'smooth' }); };
    const setActive = i => { cur = i; showThumb(i); $$('.thumb', g).forEach((t, k) => t.classList.toggle('is-active', k === i)); $$('.gallery__dot', g).forEach((t, k) => t.classList.toggle('is-active', k === i)); };
    const progress = () => { const t = track(), bar = $('.gallery__progress i', g); if (!t || !bar) return; const max = t.scrollWidth - t.clientWidth, vis = t.clientWidth / t.scrollWidth; bar.style.width = vis * 100 + '%'; bar.style.transform = `translateX(${max ? (t.scrollLeft / max) * (1 / vis - 1) * 100 : 0}%)`; };
    const go = (i, smooth = true) => {
      const t = track(); if (!t) return; const all = [...t.children], n = all.length; i = (i + n) % n;
      let el = all[i];
      if (el.hidden) { const vis = visibleMedia(); el = vis[0]; i = all.indexOf(el); }
      if (getComputedStyle(t).display === 'grid') window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 110, behavior: smooth ? 'smooth' : 'auto' });
      else t.scrollTo({ left: el.offsetLeft - t.children[0].offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
      setActive(i);
    };
    const step = dir => { const all = [...track().children]; let i = cur; for (let k = 0; k < all.length; k++) { i = (i + dir + all.length) % all.length; if (!all[i].hidden) break; } go(i); };
    const mediaIndex = id => [...track().children].findIndex(x => +x.dataset.mediaId === id);
    const groupMedia = () => {
      const c = (colour() || '').toLowerCase(); if (!c) return;
      const all = [...track().children], has = all.some(x => (x.dataset.colour || '').includes(c));
      all.forEach((x, k) => { const hide = has && !(x.dataset.colour || '').includes(c) && !!x.dataset.colour; x.hidden = hide; const th = strip()?.querySelectorAll('.thumb')[k]; if (th) th.hidden = hide; const dt = $$('.gallery__dot', g)[k]; if (dt) dt.hidden = hide; });
      if (all[cur]?.hidden) go(all.findIndex(x => !x.hidden), false);
    };
    const imgIndex = i => [...track().children].slice(0, i + 1).filter(x => x.classList.contains('media--image')).length - 1;
    const playVideo = el => {
      if (d.video === 'inline') {
        if (!el.classList.contains('is-playing')) {
          const tpl = $('template.media__src', el); if (!tpl) return;
          const art = $('.media__art', el); art.innerHTML = tpl.innerHTML; el.classList.add('is-playing', 'is-inline');
          const vid = $('video', art); if (vid) { vid.play().catch(() => {}); }
        }
        return;
      }
      openVideo(el);
    };
    const openVideo = el => {
      el = el || $('.media--video', g); if (!el) return;
      const tpl = $('template.media__src', el), pl = $('#videoBody .player', sec); if (!tpl || !pl) return;
      pl.innerHTML = tpl.innerHTML; pl.classList.add('is-playing');
      MN.overlay.open('ov-video', el);
      const vid = $('video', pl); if (vid) setTimeout(() => vid.play().catch(() => {}), 250);
    };
    if (g) {
      const s = strip(); s && s.addEventListener('scroll', thumbNav, { passive: true }); requestAnimationFrame(thumbNav); setTimeout(thumbNav, 400);
      const t = track();
      t.addEventListener('scroll', () => { progress(); const kids = [...t.children].filter(x => !x.hidden); if (kids.length < 2) return; const stepW = kids[1].offsetLeft - kids[0].offsetLeft; if (!stepW) return; const k = Math.min(kids.length - 1, Math.round(t.scrollLeft / stepW)); const i = [...t.children].indexOf(kids[k]); if (i !== cur) setActive(i); }, { passive: true });
      requestAnimationFrame(progress);
      g.addEventListener('click', e => {
        const tn = e.target.closest('[data-thumbs]'); if (tn) { const v = vert(), dd = +tn.dataset.thumbs * (v ? s.clientHeight : s.clientWidth) * 0.8; s.scrollBy({ [v ? 'top' : 'left']: dd, behavior: 'smooth' }); return; }
        const th = e.target.closest('[data-go]'); if (th) return go(+th.dataset.go);
        const ar = e.target.closest('[data-step]'); if (ar) return step(+ar.dataset.step);
        if (e.target.closest('.gallery__expand')) return MN.lightbox(Math.max(0, imgIndex(cur)));
        if (e.target.closest('[data-film]')) return openVideo();
        const v = e.target.closest('.media--video'); if (v) { if (!e.target.closest('video,iframe')) playVideo(v); return; }
        const im = e.target.closest('.media--image'); if (im && $('#ov-lightbox', sec)) MN.lightbox(imgIndex(+im.dataset.i));
      });
      g.addEventListener('keydown', e => { const m = e.target.closest('.media'); if (m && (e.key === 'Enter' || e.key === ' ') && e.target === m) { e.preventDefault(); m.click(); } });
      if (!g.hasAttribute('data-no-zoom')) {
        g.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const m = e.target.closest('.media--image'); if (!m) return; const r = m.getBoundingClientRect(); m.firstElementChild.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; m.classList.add('is-zooming'); });
        g.addEventListener('pointerout', e => { const m = e.target.closest('.media--image'); if (m && !m.contains(e.relatedTarget)) m.classList.remove('is-zooming'); });
      }
      if ($('model-viewer', g) && window.Shopify && Shopify.loadFeatures) {
        Shopify.loadFeatures([{ name: 'model-viewer-ui', version: '1.0', onLoad: err => { if (err || !window.Shopify.ModelViewerUI) return; $$('model-viewer', g).forEach(mv => { try { new Shopify.ModelViewerUI(mv); } catch (e) {} }); } }]);
      }
      if (d.groupColour === 'true') groupMedia();
    }

    /* ---- lightbox ---- */
    let lbi = 0;
    const lbTrack = $('#lbTrack', sec);
    const lbPaint = () => { const n = lbTrack.children.length; $('#lbCount', sec).textContent = `${String(lbi + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`; $$('.lb__thumb', sec).forEach((t, k) => t.classList.toggle('is-active', k === lbi)); $$('.lb__img.is-zoomed', sec).forEach(z => z.classList.remove('is-zoomed')); };
    const lbGo = (i, smooth = true) => { const n = lbTrack.children.length; if (!n) return; lbi = (i + n) % n; lbTrack.scrollTo({ left: lbi * lbTrack.clientWidth, behavior: smooth ? 'smooth' : 'auto' }); lbPaint(); };
    MN.lightbox = i => { if (!lbTrack || !lbTrack.children.length) return; MN.overlay.open('ov-lightbox'); requestAnimationFrame(() => lbGo(i, false)); };
    if (lbTrack) {
      lbTrack.addEventListener('scroll', () => { const i = Math.round(lbTrack.scrollLeft / lbTrack.clientWidth); if (i !== lbi) { lbi = i; lbPaint(); } }, { passive: true });
      lbTrack.addEventListener('dblclick', e => { const im = e.target.closest('.lb__img'); if (im) im.classList.toggle('is-zoomed'); });
      lbTrack.addEventListener('click', e => { const im = e.target.closest('.lb__img'); if (im && e.detail === 1 && matchMedia('(hover:hover)').matches) im.classList.toggle('is-zoomed'); });
      $('#ov-lightbox', sec).addEventListener('click', e => { const s2 = e.target.closest('[data-lb-step]'); if (s2) lbGo(lbi + +s2.dataset.lbStep); const t2 = e.target.closest('[data-lb]'); if (t2) lbGo(+t2.dataset.lb); });
      document.addEventListener('keydown', e => { if (!$('#ov-lightbox', sec).classList.contains('is-open')) return; if (e.key === 'ArrowRight') lbGo(lbi + 1); if (e.key === 'ArrowLeft') lbGo(lbi - 1); });
    }
    $('#ov-video', sec)?.addEventListener('overlay:close', () => { const pl = $('#videoBody .player', sec); if (pl) { pl.innerHTML = ''; pl.classList.remove('is-playing'); } });

    /* ---- size guide: cm / in, current size ---- */
    const sizeBody = $('#sizeBody', sec);
    if (sizeBody) {
      sizeBody.addEventListener('click', e => {
        const u = e.target.closest('[data-unit]'); if (!u) return;
        $$('[data-unit]', sizeBody).forEach(b => b.setAttribute('aria-pressed', b === u));
        $$('td[data-cm]', sizeBody).forEach(td => { const n = parseFloat(td.dataset.cm); td.textContent = isNaN(n) ? td.dataset.cm : u.dataset.unit === 'in' ? (n / 2.54).toFixed(1) : td.dataset.cm; });
      });
      $('#ov-size', sec).addEventListener('overlay:open', () => { const sz = si >= 0 ? st.sel[si] : ''; $$('tr[data-size]', sizeBody).forEach(r => r.classList.toggle('is-current', r.dataset.size.toLowerCase() === String(sz).toLowerCase())); MN.initTabs(sizeBody); });
    }

    /* ---- compare colours ---- */
    const cmpCols = $('[data-cmp-cols]', sec);
    const renderCompare = () => {
      if (!cmpCols || ci < 0) return;
      const sizes = si >= 0 ? model.options[si].values.map(v => v.label) : [];
      cmpCols.innerHTML = model.options[ci].values.map(c => {
        const vs = model.variants.filter(v => v.opts[ci] === c.label); if (!vs.length) return '';
        const ok = vs.filter(v => v.available).map(v => v.opts[si]), on = st.sel[ci] === c.label;
        const img = c.image || vs.find(v => v.image)?.image;
        return `<div class="cmp__col${on ? ' is-current' : ''}"><div class="cmp__img" style="${img ? '' : `background:${esc(swatchBg(c.swatch))}`}">${img ? `<img class="mn-fill" src="${esc(img)}" alt="" loading="lazy">` : ''}${on ? `<span class="badge">${esc(S.selected)}</span>` : ''}</div><div class="cmp__name"><span class="cmp__chip" style="background:${esc(swatchBg(c.swatch))}"></span>${esc(c.label)}</div>${MN.priceHTML(vs[0])}${sizes.length ? `<p class="cmp__sizes">${sizes.map(s2 => (ok.includes(s2) ? `<span>${esc(s2)}</span>` : `<s>${esc(s2)}</s>`)).join('')}</p>` : ''}<button type="button" class="mn-btn mn-btn--sm mn-btn--block${on ? ' mn-btn--secondary' : ''}" data-pick-colour="${esc(c.label)}">${esc(on ? S.current_colour : T(S.choose_colour, { __V__: c.label }))}</button></div>`;
      }).join('');
    };
    $('#ov-compare', sec)?.addEventListener('overlay:open', renderCompare);
    cmpCols?.addEventListener('click', e => { const b = e.target.closest('[data-pick-colour]'); if (!b) return; ctx.onChange(ci, b.dataset.pickColour); MN.overlay.close($('#ov-compare', sec)); });

    /* ---- ask a question ---- */
    const askForm = $('form[data-ask]', sec);
    $('#ov-ask', sec)?.addEventListener('overlay:open', () => {
      const ta = $('[data-ask-body]', sec); if (ta && !ta.value) ta.value = T(S.ask_body, { __V__: `${model.title} · ${st.sel.join(' / ')}` });
      const pr = $('[data-ask-product]', sec); if (pr) pr.value = location.href;
    });
    askForm?.addEventListener('submit', async e => {
      e.preventDefault();
      try { await postForm(askForm); askForm.hidden = true; $('[data-ask-done]', sec).hidden = false; } catch (err) { askForm.submit(); }
    });

    /* ---- info column clicks ---- */
    sec.addEventListener('change', e => { if (e.target.matches('[data-terms]')) { st.terms = e.target.checked; updateBuy(); } });
    sec.addEventListener('click', e => {
      const t = e.target;
      const atc = t.closest('[data-atc][data-main]');
      if (atc) {
        e.preventDefault();
        const v = variant();
        if (!v.available) { const n = $('[data-notify]', sec); if (n) { n.classList.add('is-open'); if (atc.dataset.sticky != null) toEl(n); setTimeout(() => n.querySelector('input[type=email]')?.focus({ preventScroll: true }), 350); } return; }
        if (needTerms()) return shakeTerms();
        if (!form) return;
        syncQtyInput();
        const fd = new FormData(form); fd.set('id', v.id); fd.set('quantity', st.qty);
        runAtc(atc, fd, { after: afterAdd(d.afterAdd) }, S, updateBuy);
        return;
      }
      const dyn = t.closest('.buy__dynamic.is-disabled'); if (dyn) { e.preventDefault(); e.stopPropagation(); if (needTerms()) shakeTerms(); return; }
      const cp = t.closest('[data-copy]'); if (cp) { navigator.clipboard?.writeText(cp.dataset.copy).catch(() => {}); cp.textContent = S.copied; setTimeout(() => (cp.textContent = cp.dataset.copy), 1600); return; }
      if (t.closest('[data-share]')) return toggleShare();
      const cl = t.closest('[data-copy-link]'); if (cl) { navigator.clipboard?.writeText(location.href).catch(() => {}); const sp = cl.lastElementChild, was = sp.textContent; sp.textContent = S.link_copied; setTimeout(() => (sp.textContent = was), 1600); return; }
      if (t.closest('[data-jump]')) { e.preventDefault(); jumpTo('rev'); return; }
      if (t.closest('[data-read-more]')) { jumpTo('desc'); return; }
      const dr = t.closest('[data-dsec]'); if (dr) { const tpl = $(`#dsec-${d.pdp}-${dr.dataset.dsec}`, sec); if (tpl) { $('#detailsT', sec).textContent = tpl.dataset.title; $('#detailsBody', sec).innerHTML = tpl.innerHTML; MN.initTabs($('#detailsBody', sec)); MN.overlay.open('ov-details', dr); } }
    }, true);
    const toggleShare = force => { const s2 = $('.share', sec); if (!s2) return; const on = force ?? !s2.classList.contains('is-open'); if (on) s2.classList.toggle('is-left', s2.getBoundingClientRect().left + 240 < document.documentElement.clientWidth); s2.classList.toggle('is-open', on); s2.firstElementChild.setAttribute('aria-expanded', on); };
    document.addEventListener('pointerdown', e => { const s2 = $('.share.is-open', sec); if (s2 && !s2.contains(e.target)) toggleShare(false); });
    const jumpTo = k => {
      const dr = $(`[data-dsec="${k}"]`, sec); if (dr) return dr.click();
      const acc = $(`[data-dsec-acc="${k}"]`, sec);
      if (acc) { if (!acc.classList.contains('is-open')) acc.querySelector('.acc__trigger').click(); setTimeout(() => toEl(acc), 320); return; }
      const open = $(`[data-dsec-open="${k}"]`, sec); if (open) return toEl(open);
      const label = k === 'desc' ? 0 : -1;
      const btns = $$('.details-tabs .tabs__btn', sec), b = label === 0 ? btns[0] : btns[btns.length - 1];
      if (b) { if (b.getAttribute('aria-selected') !== 'true') b.click(); setTimeout(() => toEl(b), 40); }
    };

    /* ---- back-in-stock form ---- */
    $('form[data-notify-form]', sec)?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.target;
      $('[data-notify-body]', f).value = T(S.notify_body, { __V__: `${model.title} · ${st.sel.join(' / ')} (${variant().sku || variant().id})` });
      try { await postForm(f); f.outerHTML = `<p class="buy__notify-done">${icon('check', 'icon--sm')}${esc(T(S.notify_done, { __V__: st.sel.join(' / ') }))}</p>`; } catch (err) { f.submit(); }
    });

    /* ---- countdown, visitors, delivery dates ---- */
    const cd = $('.countdown[data-end]', sec);
    if (cd) {
      const end = new Date(cd.dataset.end.trim().replace(' ', 'T')).getTime();
      if (end && end > Date.now()) {
        cd.hidden = false;
        const tick = () => { const s2 = Math.max(0, end - Date.now()) / 1000, u = [s2 / 86400, s2 % 86400 / 3600, s2 % 3600 / 60, s2 % 60].map(Math.floor); $$('b', cd).forEach((b, k) => (b.textContent = String(u[k]).padStart(2, '0'))); if (s2 <= 0) { cd.hidden = true; clearInterval(tm); } };
        tick(); const tm = setInterval(tick, 1000);
      }
    }
    const vis = $('.visitors', sec);
    if (vis) { const lo = +vis.dataset.min || 10, hi = Math.max(lo, +vis.dataset.max || lo); const set = () => ($('[data-visitors]', vis).textContent = lo + Math.floor(Math.random() * (hi - lo + 1))); set(); setInterval(set, 5000); }
    $$('[data-ship-est]', sec).forEach(b => {
      const lang = document.documentElement.lang || undefined;
      const f = dt => dt.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' });
      const add = n => { const dt = new Date(); let k = 0; while (k < n) { dt.setDate(dt.getDate() + 1); if (dt.getDay() % 6) k++; } return dt; };
      b.textContent = b.dataset.template.replace('[dates]', `${f(add(+b.dataset.min))} – ${f(add(+b.dataset.max))}`);
    });

    /* ---- sticky information column ---- */
    const left = $('.product__left', sec), grid = $('.product__grid', sec);
    const fitInfo = () => {
      thumbNav();
      if (!info || !left) return;
      if (d.infoSticky !== 'true') { info.classList.remove('is-sticky'); return; }
      const two = getComputedStyle(grid).gridTemplateColumns.split(' ').length > 1;
      const on = two && left.offsetHeight > info.offsetHeight + 40;
      info.classList.toggle('is-sticky', on);
      if (!on) { info.style.top = ''; return; }
      const ho = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-offset')) || 76, h = info.offsetHeight;
      info.style.top = (h > innerHeight - ho - 40 ? Math.min(ho + 20, innerHeight - h - 24) : ho + 20) + 'px';
    };

    /* ---- smart sticky bar ---- */
    const bar = $('#stickyAtc', sec);
    const sticky = {
      update() {
        if (!bar) return; const v = variant();
        const img = bar.querySelector('.sticky-atc__img'); if (img && v.image) img.innerHTML = `<img class="mn-fill" src="${esc(v.image)}" alt="">`;
        bar.querySelector('.sticky-atc__variant').textContent = model.variants.length > 1 ? st.sel.join(' · ') : '';
        bar.querySelector('.sticky-atc__price').innerHTML = MN.priceHTML(v);
        const opts = bar.querySelector('.sticky-atc__opts');
        if (model.variants.length > 1) {
          opts.innerHTML = model.options.map(() => '<div class="sticky-atc__opt"></div>').join('');
          model.options.forEach((o, i) => new MN.Select(opts.children[i], { label: o.name, value: st.sel[i], cls: 'select--compact', dir: 'up', options: o.values.map(val => { const s2 = valueState(model, st.sel, i, val.label); return { value: val.label, disabled: s2 === 'unavailable', soldout: s2 === 'soldout', meta: s2 === 'soldout' ? S.meta_soldout : s2 === 'unavailable' ? S.meta_unavailable : '', swatch: o.kind === 'colour' ? swatchBg(val.swatch) : null }; }), onChange: val => ctx.onChange(i, val) }));
        } else opts.innerHTML = '';
      },
      show(on) { if (!bar) return; bar.classList.toggle('is-visible', on); bar.setAttribute('aria-hidden', String(!on)); bar.inert = !on; document.documentElement.style.setProperty('--sticky-h', on ? bar.offsetHeight + 'px' : '0px'); },
    };
    P.sticky = sticky;
    const mainAtc = $('#mainAtc', sec);
    const checkSticky = () => { if (!bar) return; const want = !!mainAtc && mainAtc.getBoundingClientRect().bottom < 0 && !document.body.classList.contains('scroll-lock'); if (want !== bar.classList.contains('is-visible')) sticky.show(want); };
    addEventListener('scroll', checkSticky, { passive: true });
    addEventListener('resize', () => { checkSticky(); fitInfo(); });
    if ('ResizeObserver' in window && info && left) { const ro = new ResizeObserver(() => fitInfo()); ro.observe(info); ro.observe(left); }

    // first paint
    if (qtyHost) setQty(variant());
    update(false);
    MN.initTabs(sec);
    fitInfo(); checkSticky();
  };

  /* ==================================================================
     Quick view: the same pickers, price and buy button, in a modal /
     bottom sheet. Markup from templates/product.mn-quick.liquid.
     ================================================================== */
  MN.quickView = async (url, opener) => {
    const ov = $('#ov-quick'), body = $('#qvBody'); if (!ov || !body) { location.href = url; return; }
    const path = String(url).split('?')[0];
    body.innerHTML = '<div class="qv qv--loading"><span class="atc__spinner" style="display:block;margin:120px auto"></span></div>';
    MN.overlay.open('ov-quick', opener);
    let html;
    try { const r = await fetch(`${path}?view=mn-quick`); if (!r.ok) throw 0; html = await r.text(); } catch (e) { location.href = url; return; }
    body.innerHTML = html.slice(html.indexOf('<'), html.lastIndexOf('>') + 1);
    const q = $('[data-qv]', body); if (!q) return;
    const model = json($('[data-product-json]', q)), S = json($('[data-pdp-strings]', q)) || {}, d = q.dataset;
    const low = +d.low || 5;
    const first = model.variants.find(v => v.available) || model.variants[0];
    const st = { sel: first.opts.slice(), qty: 1 };
    const variant = () => findVariant(model, st.sel) || first;
    const ctx = { model, get sel() { return st.sel; }, str: S, low, links: null, type: (i, o) => (o.kind === 'colour' ? d.colourType : d.sizeType), onChange: (i, v) => { st.sel[i] = v; render(); } };
    const ci = kindIdx(model, 'colour'), si = kindIdx(model, 'size');
    const render = () => {
      const v = variant(), so = !v.available;
      MN.renderPickers($('[data-qv-pickers]', q), ctx);
      $('[data-qv-price]', q).innerHTML = MN.priceHTML(v, true);
      const meta = $('[data-qv-meta]', q);
      if (meta) meta.innerHTML = [meta.dataset.new ? `<span class="badge badge--new">${esc(S.new)}</span>` : '', v.compare > v.price ? `<span class="badge badge--sale">${esc(S.sale)} −${Math.round((1 - v.price / v.compare) * 100)}%</span>` : '', so ? `<span class="badge badge--soldout">${esc(S.soldout)}</span>` : v.stock != null && v.stock <= low ? `<span class="badge badge--low">${esc(S.low)}</span>` : '', meta.dataset.extra ? `<span class="badge">${esc(meta.dataset.extra)}</span>` : ''].join('');
      const sb = $('[data-qv-stock]', q);
      if (sb) { const sz = esc(si >= 0 ? st.sel[si] : ''); sb.innerHTML = so ? `<div class="stockbar__text"><span>${T(S.stock_out, { __V__: sz })}</span></div>` : v.stock != null && v.stock <= low ? `<div class="stockbar__text"><span>${T(S.stock_low, { __N__: v.stock, __V__: sz })}</span></div><div class="stockbar__track is-low"><i style="width:${Math.min(100, v.stock / 20 * 100)}%"></i></div>` : `<div class="stockbar__text"><span>${S.stock_in_plain}</span></div><div class="stockbar__track"><i style="width:100%"></i></div>`; }
      const oq = $('[data-qv-qty]', q), nq = oq.cloneNode(false); oq.replaceWith(nq);
      MN.qty(nq, { value: st.qty, max: v.stock != null && v.stock > 0 ? Math.min(10, v.stock) : 10, label: S.quantity, onChange: x => (st.qty = x) });
      const b = $('[data-qv-atc]', q); b.classList.toggle('is-soldout', so); if (b.dataset.state === 'idle') b.querySelector('.atc__label').textContent = so ? S.soldout_notify : S.atc; b.setAttribute('aria-disabled', so ? 'true' : 'false');
      const bn = $('[data-qv-buynow]', q); if (bn) { bn.setAttribute('aria-disabled', so ? 'true' : 'false'); bn.href = `${rootUrl()}cart/${v.id}:${st.qty}`; }
      if (v.media) { const sl = $(`.qv__slide[data-media-id="${v.media}"]`, q); if (sl) { const tr = $('.qv__track', q); tr.scrollTo({ left: sl.offsetLeft - tr.firstElementChild.offsetLeft, behavior: 'smooth' }); } }
      else if (ci >= 0) { const c = st.sel[ci].toLowerCase(); const sl = $$('.qv__slide', q).find(x => (x.dataset.colour || '').includes(c)); if (sl) { const tr = $('.qv__track', q); tr.scrollTo({ left: sl.offsetLeft - tr.firstElementChild.offsetLeft, behavior: 'smooth' }); } }
    };
    render();
    const tr = $('.qv__track', q);
    tr && tr.addEventListener('scroll', () => { const w = tr.firstElementChild ? tr.firstElementChild.offsetWidth + 10 : 1; const i = Math.round(tr.scrollLeft / w); $$('.qv__thumbs .thumb', q).forEach((t2, k) => t2.classList.toggle('is-active', k === i)); }, { passive: true });
    q.addEventListener('click', e => {
      const gq = e.target.closest('[data-qv-go]'); if (gq) { tr.scrollTo({ left: +gq.dataset.qvGo * (tr.firstElementChild.offsetWidth + 10), behavior: 'smooth' }); return; }
      const b = e.target.closest('[data-qv-atc]');
      if (b) { const v = variant(); if (!v.available) { MN.toast(S.soldout); return; } runAtc(b, [{ id: v.id, quantity: st.qty }], { after: $('#ov-cart') ? undefined : 'page' }, S, render); return; }
      const bn = e.target.closest('[data-qv-buynow]'); if (bn && bn.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
      if (bn) bn.href = `${rootUrl()}cart/${variant().id}:${st.qty}`;
    });
  };
  // Card quick view buttons (and anything with data-open-quickview)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open-quickview]'); if (!b || !$('#ov-quick')) return;
    e.preventDefault(); e.stopPropagation();
    MN.quickView(b.dataset.productUrl || b.getAttribute('href'), b);
  }, true);

  /* ---- Complete the look: hotspots, Add, Add all ---- */
  document.addEventListener('mouseover', e => {
    const sec = e.target.closest('[data-look]'); if (!sec) return;
    const sp = e.target.closest('[data-spot],[data-spot-item]');
    $$('.look__spot,.look-item', sec).forEach(x => x.classList.remove('is-hot'));
    if (!sp) return; const k = sp.dataset.spot ?? sp.dataset.spotItem;
    $(`[data-spot="${k}"]`, sec)?.classList.add('is-hot'); $(`[data-spot-item="${k}"]`, sec)?.classList.add('is-hot');
  });
  document.addEventListener('click', async e => {
    const sec = e.target.closest('[data-look]'); if (!sec) return;
    const sp = e.target.closest('[data-spot]'); if (sp) { $(`[data-spot-item="${sp.dataset.spot}"] .mn-btn`, sec)?.focus(); return; }
    const a = e.target.closest('[data-look-add]');
    if (a) { a.setAttribute('aria-busy', 'true'); try { await MN.cart.add([{ id: +a.dataset.lookAdd, quantity: 1 }]); a.classList.add('is-added'); } catch (err) {} a.removeAttribute('aria-busy'); return; }
    const all = e.target.closest('[data-look-all]');
    if (all) {
      const items = all.dataset.lookAll.split(',').filter(Boolean).map(id => ({ id: +id, quantity: 1 }));
      if (sec.dataset.includeCurrent === 'true' && P.variant) { const v = P.variant(); if (v && v.available) items.unshift({ id: v.id, quantity: 1 }); }
      all.setAttribute('aria-busy', 'true'); try { await MN.cart.add(items); } catch (err) {} all.removeAttribute('aria-busy');
    }
  });

  const boot = root => $$('[data-pdp]', root || document).forEach(P.init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot()); else boot();
  document.addEventListener('shopify:section:load', e => boot(e.target));
})();
