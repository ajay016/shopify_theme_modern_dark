/**
 * Maison Noir — design system runtime.
 * Ported from docs/claude_design_ref/mn/ui.js (overlays, accordions, tabs,
 * toast, quantity stepper, scripted selects) with the demo data replaced by
 * Shopify data. Component modules (header, cart, product page, quick view,
 * compare) follow below and share these helpers.
 */
(() => {
  'use strict';
  const MN = window.MN = window.MN || {};
  const $ = MN.$ = (s, r = document) => r.querySelector(s);
  const $$ = MN.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  const icon = MN.icon = (n, c = '') => `<svg class="icon ${c}" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
  const esc = MN.esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  MN.stars = r => `<span class="stars" style="--r:${r}" role="img" aria-label="${r} out of 5 stars"></span>`;
  MN.money = cents => (window.MaisonNoir && window.MaisonNoir.formatMoney)
    ? window.MaisonNoir.formatMoney(cents)
    : '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0 });

  /* ---- Scripted select (for controls built in JS: sticky bar, quick view).
     Native <select> elements are enhanced by theme.js into the same markup. */
  class Select {
    constructor(host, o) {
      this.host = host;
      this.o = Object.assign({ options: [], value: null, label: '', onChange: () => {} }, o);
      host.classList.add('select', ...(o.cls ? o.cls.split(' ') : []));
      host.innerHTML = `<button type="button" class="select__trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(this.o.label)}"><span class="select__value"></span>${icon('chevron-down', 'select__chev')}</button><ul class="select__list" role="listbox" aria-label="${esc(this.o.label)}"></ul>`;
      this.btn = host.firstElementChild; this.list = host.lastElementChild; host._select = this; host.dataset.dir = this.o.dir || 'down';
      this.btn.addEventListener('click', () => (this.isOpen() ? this.close() : this.open()));
      this.btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); this.open(); } });
      this.list.addEventListener('click', e => {
        const li = e.target.closest('.select__option');
        if (li && li.getAttribute('aria-disabled') !== 'true') { this.set(li.dataset.value, true); this.close(); this.btn.focus({ preventScroll: true }); }
      });
      this.list.addEventListener('keydown', e => this.key(e));
      this.update(this.o.options, this.o.value);
    }
    update(options, value) {
      this.o.options = options; if (value !== undefined) this.o.value = value;
      this.list.innerHTML = options.map(op => `<li class="select__option${op.soldout ? ' is-soldout' : ''}" role="option" tabindex="-1" data-value="${esc(op.value)}" aria-selected="${String(op.value) === String(this.o.value)}"${op.disabled ? ' aria-disabled="true"' : ''}>${op.swatch ? `<span class="select__dot" style="background:${op.swatch}"></span>` : ''}<span class="select__label">${esc(op.label ?? op.value)}</span>${op.meta ? `<span class="select__meta">${op.meta}</span>` : ''}</li>`).join('');
      this.paint();
    }
    paint() {
      const op = this.o.options.find(x => String(x.value) === String(this.o.value)) || this.o.options[0]; if (!op) return;
      this.btn.querySelector('.select__value').innerHTML = `${op.swatch ? `<span class="select__dot" style="background:${op.swatch}"></span>` : ''}${this.o.prefix ? `<span class="select__prefix">${this.o.prefix}</span>` : ''}<span>${esc(op.label ?? op.value)}</span>`;
    }
    set(v, fire) { this.o.value = v; $$('.select__option', this.list).forEach(li => li.setAttribute('aria-selected', li.dataset.value === String(v))); this.paint(); if (fire) this.o.onChange(v); }
    isOpen() { return this.host.classList.contains('is-open'); }
    open() {
      $$('.select.is-open').forEach(s => s !== this.host && s._select && s._select.close());
      const r = this.btn.getBoundingClientRect(), below = innerHeight - r.bottom;
      this.host.dataset.dir = this.o.dir || (below < 290 && r.top > below ? 'up' : 'down');
      if (r.left + 200 > innerWidth) this.host.dataset.align = 'end';
      this.host.classList.add('is-open'); this.btn.setAttribute('aria-expanded', 'true');
      const cur = this.list.querySelector('[aria-selected=true]') || this.list.querySelector('.select__option:not([aria-disabled=true])');
      setTimeout(() => { if (cur) { cur.focus({ preventScroll: true }); this.list.scrollTop = Math.max(0, cur.offsetTop - 60); } }, 30);
    }
    close() { this.host.classList.remove('is-open'); this.btn.setAttribute('aria-expanded', 'false'); }
    key(e) {
      const items = $$('.select__option:not([aria-disabled=true])', this.list); const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(items.length - 1, i + 1)]?.focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[Math.max(0, i - 1)]?.focus(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i > -1) { this.set(items[i].dataset.value, true); this.close(); this.btn.focus(); } }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); this.btn.focus(); }
      else if (e.key === 'Tab') this.close();
    }
  }
  MN.Select = Select;
  document.addEventListener('pointerdown', e => $$('.select.is-open').forEach(s => { if (!s.contains(e.target) && s._select) s._select.close(); }));

  /* ---- Quantity: stepper (default), pill stepper or dropdown ---- */
  MN.qtyOpts = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
  MN.qty = (host, o) => {
    const style = o.style || 'stepper', max = Math.max(1, Math.min(o.max || 10, 99)); let v = Math.min(o.value || 1, max);
    if (style === 'dropdown') { new Select(host, { label: o.label || 'Quantity', value: String(v), options: MN.qtyOpts.slice(0, max), onChange: x => o.onChange(+x) }); return; }
    host.className = 'qty qty--' + style;
    host.innerHTML = `<button type="button" class="qty__btn qty__btn--minus" data-q="-1" aria-label="${esc(o.minusLabel || 'Decrease quantity')}"></button><span class="qty__win"><input class="qty__input" type="text" inputmode="numeric" aria-label="${esc(o.label || 'Quantity')}" value="${v}"${o.name ? ` name="${o.name}"` : ''}><span class="qty__roll" aria-hidden="true"></span></span><button type="button" class="qty__btn qty__btn--plus" data-q="1" aria-label="${esc(o.plusLabel || 'Increase quantity')}"></button>`;
    const inp = host.querySelector('input'), roll = host.querySelector('.qty__roll');
    const paint = () => { host.querySelector('[data-q="-1"]').disabled = v <= 1; host.querySelector('[data-q="1"]').disabled = v >= max; host.classList.toggle('is-max', v >= max); };
    const set = (n, dir) => {
      n = Math.max(1, Math.min(max, n || 1));
      if (n === v) { inp.value = v; if (dir > 0 && v >= max) { host.classList.remove('is-shake'); void host.offsetWidth; host.classList.add('is-shake'); } return; }
      roll.textContent = v; roll.className = 'qty__roll is-' + (dir > 0 ? 'up' : 'down'); inp.className = 'qty__input is-' + (dir > 0 ? 'up' : 'down');
      void inp.offsetWidth; roll.classList.add('go'); inp.classList.add('go'); v = n; inp.value = v; paint(); o.onChange(v);
    };
    host.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) set(v + +b.dataset.q, +b.dataset.q); });
    inp.addEventListener('change', () => { const n = parseInt(inp.value, 10); set(isNaN(n) ? v : n, n > v ? 1 : -1); });
    inp.addEventListener('keydown', e => { if (e.key === 'ArrowUp') { e.preventDefault(); set(v + 1, 1); } if (e.key === 'ArrowDown') { e.preventDefault(); set(v - 1, -1); } });
    inp.addEventListener('focus', () => inp.select()); paint();
    host._qty = { get value() { return v; }, setMax(m) { /* re-render with a new max */ MN.qty(host, Object.assign({}, o, { value: Math.min(v, m), max: m })); } };
  };

  /* ---- Overlays: drawers, modals, sheets ---- */
  MN.overlay = {
    stack: [],
    open(id, opener) {
      const el = typeof id === 'string' ? document.getElementById(id) : id;
      if (!el || el.classList.contains('is-open')) return;
      el._opener = opener || document.activeElement; el.classList.add('is-open'); this.stack.push(el);
      document.body.classList.add('scroll-lock'); el.dispatchEvent(new CustomEvent('overlay:open'));
      setTimeout(() => {
        const f = el.querySelector('[autofocus]') || el.querySelector('.overlay__body input:not([type=checkbox]):not([type=hidden]),.overlay__body button,.overlay__body a') || el.querySelector('[data-close]:not(.overlay__scrim)');
        f && f.focus({ preventScroll: true });
      }, 80);
    },
    close(el) {
      el = el || this.stack[this.stack.length - 1]; if (!el) return;
      el.classList.remove('is-open'); this.stack = this.stack.filter(x => x !== el);
      if (!this.stack.length) document.body.classList.remove('scroll-lock');
      el.dispatchEvent(new CustomEvent('overlay:close'));
      if (el._opener && el._opener.focus && document.contains(el._opener)) el._opener.focus({ preventScroll: true });
    },
  };
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o && document.getElementById(o.dataset.open)) { e.preventDefault(); MN.overlay.open(o.dataset.open, o); }
    const c = e.target.closest('[data-close]'); if (c && c.closest('.overlay')) MN.overlay.close(c.closest('.overlay'));
    const t = e.target.closest('[data-toast]'); if (t) MN.toast(t.dataset.toast);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('.select.is-open') && MN.overlay.stack.length) MN.overlay.close(); });

  /* ---- Accordions (height animates in CSS via grid rows) ---- */
  MN.acc = (t, c, open = false, cls = '') => `<div class="acc ${cls}${open ? ' is-open' : ''}"><button type="button" class="acc__trigger" aria-expanded="${open}">${t}<span class="acc__icon"></span></button><div class="acc__panel"><div class="acc__inner"><div class="acc__content">${c}</div></div></div></div>`;
  document.addEventListener('click', e => {
    const t = e.target.closest('.acc__trigger'); if (!t) return;
    if (getComputedStyle(t).pointerEvents === 'none') return;
    const acc = t.parentElement; const open = !acc.classList.contains('is-open');
    if (open && acc.parentElement.closest('[data-acc-single]')) [...acc.parentElement.children].forEach(s => { if (s !== acc && s.classList.contains('acc')) { s.classList.remove('is-open'); s.firstElementChild.setAttribute('aria-expanded', 'false'); } });
    acc.classList.toggle('is-open', open); t.setAttribute('aria-expanded', open);
  });

  /* ---- Tabs with sliding ink and animated height ---- */
  MN.tabsHTML = (items, cls = '') => `<div class="tabs ${cls}"><div class="tabs__list" role="tablist">${items.map((it, i) => `<button type="button" role="tab" class="tabs__btn" aria-selected="${!i}" data-tab="${i}">${it.t}</button>`).join('')}<span class="tabs__ink"></span></div><div class="tabs__panels">${items.map((it, i) => `<div class="tabs__panel" role="tabpanel" data-panel="${i}"${i ? ' hidden' : ''}>${it.c}</div>`).join('')}</div></div>`;
  MN.initTabs = root => $$('.tabs', root).forEach(tb => {
    if (tb._init) return; tb._init = 1;
    const ink = tb.querySelector('.tabs__ink'), panels = tb.querySelector('.tabs__panels');
    const place = () => {
      const b = tb.querySelector('.tabs__btn[aria-selected=true]'); if (!b || !ink) return;
      const col = getComputedStyle(b.parentElement).flexDirection === 'column';
      if (col) { ink.style.width = ''; ink.style.height = b.offsetHeight + 'px'; ink.style.transform = `translateY(${b.offsetTop}px)`; }
      else { ink.style.height = ''; ink.style.width = b.offsetWidth + 'px'; ink.style.transform = `translateX(${b.offsetLeft}px)`; }
    };
    place(); requestAnimationFrame(place); document.fonts && document.fonts.ready.then(place);
    if ('ResizeObserver' in window) new ResizeObserver(place).observe(tb);
    tb.querySelector('.tabs__list').addEventListener('click', e => {
      const b = e.target.closest('.tabs__btn'); if (!b || b.getAttribute('aria-selected') === 'true') return;
      const h1 = panels.offsetHeight;
      tb.querySelectorAll('.tabs__btn').forEach(x => x.setAttribute('aria-selected', x === b));
      tb.querySelectorAll('.tabs__panel').forEach(p => (p.hidden = p.dataset.panel !== b.dataset.tab));
      const h2 = panels.scrollHeight; panels.style.height = h1 + 'px'; void panels.offsetHeight; panels.style.height = h2 + 'px';
      const done = () => { panels.style.height = ''; panels.removeEventListener('transitionend', done); };
      panels.addEventListener('transitionend', done); setTimeout(done, 700); place();
    });
  });

  /* ---- Toast and count bump ---- */
  MN.toast = m => {
    let t = $('#mnToast');
    if (!t) { t = document.createElement('div'); t.id = 'mnToast'; t.className = 'mn-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.textContent = m; t.classList.add('is-on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('is-on'), 2400);
  };
  MN.bump = el => { if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };

  /* ==================================================================
     Header — ported from docs/claude_design_ref/mn/header.js
     Announcement rotation, mega menus (hover intent, flyout placement,
     keyboard), predictive search, compact / transparent / hide-on-scroll.
     ================================================================== */
  const H = MN.header = { cur: null, tm: 0 };
  const hdr = () => $('#siteHeader');

  H.openMega = i => {
    clearTimeout(H.tm); if (H.cur === i) return; H.closeMega();
    const p = $('#mega-' + i), it = $(`.nav__item[data-i="${i}"]`); if (!p || !it) return;
    if (p.classList.contains('mega--flyout')) {
      const hb = $('.header__bar').getBoundingClientRect(), r = it.getBoundingClientRect(), w = Math.min(760, innerWidth - 32);
      let l = r.left - hb.left - 12; l = Math.max(16, Math.min(l, hb.width - w - 16)); p.style.left = l + 'px';
    }
    p.classList.add('is-open'); it.classList.add('is-open'); it.firstElementChild.setAttribute('aria-expanded', 'true');
    hdr().classList.add('has-mega'); H.cur = i;
  };
  H.closeMega = () => {
    $$('.mega.is-open').forEach(m => m.classList.remove('is-open'));
    $$('.nav__item.is-open').forEach(n => { n.classList.remove('is-open'); n.firstElementChild.setAttribute('aria-expanded', 'false'); });
    hdr() && hdr().classList.remove('has-mega'); H.cur = null;
  };
  const later = () => { clearTimeout(H.tm); H.tm = setTimeout(H.closeMega, 180); };
  const activateFly = g => {
    const fl = g.closest('.flyout');
    fl.querySelectorAll('.flyout__group').forEach(x => x.classList.toggle('is-active', x === g));
    fl.querySelectorAll('.flyout__pane').forEach(p => p.classList.toggle('is-active', p.dataset.k === g.dataset.k));
  };

  let lastY = scrollY;
  H.onScroll = () => {
    const h = hdr(); if (!h) return;
    const y = scrollY, root = document.documentElement;
    h.classList.toggle('is-compact', y > 40);
    if (h.dataset.transparentHome === 'true') {
      const hero = $('#MainContent > .shopify-section, main .shopify-section');
      h.classList.toggle('is-transparent', !!hero && y < hero.offsetHeight - h.offsetHeight - 10);
    }
    if (Math.abs(y - lastY) > 4) {
      h.classList.toggle('is-hidden', h.dataset.hideOnScroll === 'true' && y > lastY && y > 260 && !h.classList.contains('has-mega'));
      lastY = y;
    }
    const sticky = h.dataset.sticky !== 'false';
    const off = !sticky || h.classList.contains('is-hidden') ? 0 : h.offsetHeight;
    root.style.setProperty('--header-live', h.offsetHeight + 'px');
    root.style.setProperty('--header-offset', off + 'px');
    // The theme's pinned toolbars and sidebars read --header-h.
    root.style.setProperty('--header-h', off + 'px');
  };

  function bindHeader() {
    const h = hdr(); if (!h || h._mn) return; h._mn = 1;
    const root = document.documentElement;
    const ann = $('.announce');
    if (ann && !ann._mn) {
      ann._mn = 1; let ai = 0;
      const rot = d => { const sl = $$('.announce__slide', ann); if (sl.length < 2) return; sl[ai].classList.remove('is-active'); ai = (ai + d + sl.length) % sl.length; sl[ai].classList.add('is-active'); };
      ann.querySelector('.announce__prev')?.addEventListener('click', () => rot(-1));
      ann.querySelector('.announce__next')?.addEventListener('click', () => rot(1));
      setInterval(() => { if (root.dataset.announce === 'rotate' && !ann.matches(':hover')) rot(1); }, 4500);
    }
    const nav = h.querySelector('.nav__list'), bar = h.querySelector('.header__bar'), host = h.querySelector('.mega-host');
    if (nav) {
      nav.addEventListener('mouseover', e => {
        const it = e.target.closest('.nav__item'); if (!it) return;
        $('#mega-' + it.dataset.i) ? H.openMega(+it.dataset.i) : later();
      });
      // Touch: the first tap opens the panel, the second follows the link.
      let tapOpens = false;
      nav.addEventListener('pointerdown', e => {
        const it = e.target.closest('.nav__item'); tapOpens = !!it && e.pointerType !== 'mouse' && !!$('#mega-' + it.dataset.i) && H.cur !== +it.dataset.i;
      });
      nav.addEventListener('click', e => { if (!tapOpens) return; const it = e.target.closest('.nav__item'); e.preventDefault(); tapOpens = false; H.openMega(+it.dataset.i); });
      nav.addEventListener('keydown', e => {
        const it = e.target.closest('.nav__item'); if (!it || !$('#mega-' + it.dataset.i)) return;
        if (e.key === 'ArrowDown' || e.key === ' ') {
          e.preventDefault(); H.openMega(+it.dataset.i);
          setTimeout(() => $(`#mega-${it.dataset.i} a, #mega-${it.dataset.i} button`)?.focus(), 40);
        }
      });
    }
    if (bar) {
      bar.addEventListener('mouseleave', later);
      bar.addEventListener('mouseenter', () => { if (H.cur !== null) clearTimeout(H.tm); });
      bar.addEventListener('keydown', e => { if (e.key === 'Escape' && H.cur !== null) { const i = H.cur; H.closeMega(); $(`.nav__item[data-i="${i}"] .nav__link`)?.focus(); } });
      bar.addEventListener('focusout', e => { if (!bar.contains(e.relatedTarget)) later(); });
    }
    if (host) {
      host.addEventListener('mouseover', e => { const g = e.target.closest('.flyout__group'); if (g) activateFly(g); });
      host.addEventListener('focusin', e => { const g = e.target.closest('.flyout__group'); if (g) activateFly(g); });
    }
    document.addEventListener('pointerdown', e => { if (H.cur !== null && !e.target.closest('.header__bar')) H.closeMega(); });
    bindSearch();
    H.onScroll();
  }
  addEventListener('scroll', H.onScroll, { passive: true });
  addEventListener('resize', H.onScroll);
  if ('ResizeObserver' in window) document.addEventListener('DOMContentLoaded', () => { const h = hdr(); if (h) new ResizeObserver(H.onScroll).observe(h); });

  /* ---- Predictive search (Shopify /search/suggest.json) ---- */
  const hl = (t, q) => q ? esc(t).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>') : esc(t);
  const sized = (u, w) => !u ? '' : u + (u.includes('?') ? '&' : '?') + 'width=' + w;
  function bindSearch() {
    const inp = $('#searchInput'), res = $('#searchResults'), chips = $('#searchChips');
    if (!inp || !res || inp._mn) return; inp._mn = 1;
    const initial = res.innerHTML, base = res.dataset.predictiveUrl || '/search/suggest';
    let seq = 0, tm = 0;
    const render = raw => {
      const q = raw.trim(); if (chips) chips.hidden = !!q;
      if (!q) { res.innerHTML = initial; return; }
      const my = ++seq;
      fetch(`${base}.json?q=${encodeURIComponent(q)}&resources[type]=product,collection,page&resources[limit]=4&resources[options][unavailable_products]=last`)
        .then(r => r.json()).then(d => {
          if (my !== seq) return;
          const R = (d.resources && d.resources.results) || {}, ps = R.products || [], cs = R.collections || [], pg = R.pages || [];
          const all = `${(window.routes && window.routes.search_url) || '/search'}?q=${encodeURIComponent(q)}&options[prefix]=last`;
          if (!ps.length && !cs.length && !pg.length) { res.innerHTML = `<p class="search__empty">${esc((window.MN_STRINGS && MN_STRINGS.no_results || 'No results for “__TERMS__”.').replace('__TERMS__', q))}</p>`; return; }
          const img = p => sized((p.featured_image && p.featured_image.url) || p.image, 360);
          const price = p => p.price != null ? MN.money(Math.round(parseFloat(p.price) * 100)) : '';
          res.innerHTML = `<div class="search__col"><span class="mn-eyebrow search__label">${esc(MN_STRINGS.products)}</span><div class="search__products">${ps.map(p => `<a href="${p.url}" class="sresult"><span class="sresult__img">${img(p) ? `<img class="mn-fill" src="${img(p)}" alt="" loading="lazy">` : ''}</span><span class="sresult__title">${hl(p.title, q)}</span><span class="sresult__price">${price(p)}</span></a>`).join('') || `<p class="search__empty">—</p>`}</div><a href="${all}" class="link-arrow" style="margin-top:22px">${esc(MN_STRINGS.view_all_results.replace('__TERMS__', q))}${icon('arrow-right')}</a></div>
            <div class="search__side">${cs.length ? `<div><span class="mn-eyebrow search__label">${esc(MN_STRINGS.collections)}</span><ul class="search__list">${cs.map(c => `<li><a href="${c.url}">${hl(c.title, q)}${icon('arrow-right')}</a></li>`).join('')}</ul></div>` : ''}${pg.length ? `<div><span class="mn-eyebrow search__label">${esc(MN_STRINGS.pages)}</span><ul class="search__list">${pg.map(c => `<li><a href="${c.url}">${hl(c.title, q)}${icon('arrow-right')}</a></li>`).join('')}</ul></div>` : ''}</div>`;
        }).catch(() => {});
    };
    inp.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => render(inp.value), 160); });
    chips && chips.addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) { inp.value = c.textContent.trim(); render(inp.value); inp.focus(); } });
  }

  /* ==================================================================
     Footer — wordmark fitted to the width, back to top
     (docs/claude_design_ref/mn/panel.js → fitWordmark / initFooter)
     ================================================================== */
  const fitWordmark = () => {
    const w = $('.footer__wordmark'), s = w && w.firstElementChild;
    if (!s || getComputedStyle(w).display === 'none') return;
    s.style.fontSize = '100px';
    const avail = w.clientWidth - parseFloat(getComputedStyle(w).paddingLeft) * 2;
    s.style.fontSize = Math.floor(100 * avail / s.offsetWidth) + 'px';
  };
  function bindFooter() {
    const f = $('#siteFooter'); if (!f || f._mn) return; f._mn = 1;
    $('#toTop', f)?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    fitWordmark(); document.fonts && document.fonts.ready.then(fitWordmark);
  }
  addEventListener('resize', fitWordmark);

  /* ---- Boot ---- */
  /* ==================================================================
     Cart — ported from docs/claude_design_ref/mn/extras.js (MN.cart)
     The drawer (sections/cart-drawer.liquid) is rendered by Shopify and
     re-rendered through the Section Rendering API on every add / change,
     so totals, discounts and money formats are always the store's own.
     Requests run one at a time, in order. Theme settings → Cart → cart
     type picks what happens after adding: drawer, notification or page.
     ================================================================== */
  const STR = () => window.MN_STRINGS || {};
  const routes = () => window.routes || {};
  const C = MN.cart = {
    section: 'cart-drawer',
    q: Promise.resolve(),
    queue(fn) { const run = this.q.then(fn, fn); this.q = run.catch(() => {}); return run; },
    async post(url, body) {
      const fd = body instanceof FormData;
      if (fd) { body.append('sections', this.sections()); body.append('sections_url', location.pathname); }
      else body = Object.assign({}, body, { sections: this.sections(), sections_url: location.pathname });
      const r = await fetch(url, { method: 'POST', headers: fd ? { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } : { 'Content-Type': 'application/json', Accept: 'application/json' }, body: fd ? body : JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.status) { const e = new Error(j.description || j.message || STR().cart_error || 'Something went wrong.'); e.data = j; throw e; }
      return j;
    },
    // The drawer, plus the cart page when it is open
    sections() { const pg = $('[data-cart-page]'); return pg ? `${this.section},${pg.dataset.cartPage}` : this.section; },
    paintAll(sections, j) {
      if (!sections) return;
      this.paint(sections[this.section]);
      const pg = $('[data-cart-page]');
      if (pg && sections[pg.dataset.cartPage]) this.paintPage(pg, sections[pg.dataset.cartPage]);
      if (!$('#ov-cart') && j && j.item_count != null) this.count(j.item_count);
    },
    // Cart page: swap its parts; lines already on the page do not replay the entrance
    paintPage(pg, html) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const had = new Set($$('.cart-line[data-key]', pg).map(l => l.dataset.key));
      const note = $('[data-cart-note]', pg), keepNote = note && document.activeElement === note;
      $$('[data-cart-part]', pg).forEach(a => {
        if (keepNote && a.contains(note)) { // do not wipe what is being typed
          const b = doc.querySelector(`[data-cart-part="${a.dataset.cartPart}"]`);
          const lines = b && b.querySelector('.mn-cartpage__lines'), sum = b && b.querySelector('.mn-cartpage__rows');
          if (lines) $('.mn-cartpage__lines', a).innerHTML = lines.innerHTML;
          if (sum) $('.mn-cartpage__rows', a).innerHTML = sum.innerHTML;
          return;
        }
        const b = doc.querySelector(`[data-cart-part="${a.dataset.cartPart}"]`); if (b) a.innerHTML = b.innerHTML;
      });
      $$('.cart-line[data-key]', pg).forEach(l => had.has(l.dataset.key) && l.classList.add('is-settled'));
      if (!$('.cart-line[data-key]', pg)) $('[data-cart-recs]', pg)?.remove();
    },
    // Swap the re-rendered parts in; the overlay shell (and its open state) stays.
    paint(html) {
      if (!html) return;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const src = doc.getElementById('ov-cart'); if (!src) return;
      const had = new Set($$('#cartBody .cart-line').map(l => l.dataset.key));
      ['cartTitle', 'cartBody', 'cartFoot'].forEach(id => {
        const a = document.getElementById(id), b = doc.getElementById(id);
        if (a && b) { a.innerHTML = b.innerHTML; a.hidden = b.hidden; }
      });
      // only lines new to the bag play the entrance
      $$('#cartBody .cart-line').forEach(l => had.has(l.dataset.key) && l.classList.add('is-settled'));
      this.count(+src.dataset.count || 0);
    },
    count(n, bump = true) {
      const was = this.n; this.n = n;
      const drawer = $('#ov-cart'); if (drawer) drawer.dataset.count = n;
      $$('[data-cart-count]').forEach(x => (x.textContent = x.closest('.count-dot') && !n ? '' : n));
      if (bump && was !== undefined && was !== n) MN.bump($('#cartCount'));
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: n } }));
    },
    /** items: [{ id, quantity, properties, selling_plan }] or a product form's FormData.
        opts.after: 'drawer' | 'notification' | 'page' | 'none' (default: the theme setting).
        opts.quiet: the caller shows errors itself (no toast). */
    add(items, opts = {}) {
      return this.queue(async () => {
        const body = items instanceof FormData ? items : { items: [].concat(items).map(i => Object.assign({ quantity: 1 }, i)) };
        let j;
        try { j = await this.post(routes().cart_add_url ? routes().cart_add_url + '.js' : '/cart/add.js', body); }
        catch (err) { if (!opts.quiet) MN.toast(err.message); throw err; }
        const added = j.items || [j];
        const after = opts.after || (window.theme_settings && window.theme_settings.cart_type) || 'drawer';
        if (after === 'page') { location.href = routes().cart_url || '/cart'; return j; }
        this.paintAll(j.sections, null);
        if (after === 'notification') this.notify(added[0]);
        else if (after !== 'none' && $('#ov-cart')) MN.overlay.open('ov-cart', opts.opener);
        return j;
      });
    },
    change(key, quantity) {
      return this.queue(async () => {
        const j = await this.post(routes().cart_change_url ? routes().cart_change_url + '.js' : '/cart/change.js', { id: key, quantity });
        this.paintAll(j.sections, j);
        const line = (j.items || []).find(i => i.key === key);
        if (quantity > 0 && line && line.quantity < quantity) MN.toast((STR().cart_only_left || 'Only __N__ available').replace('__N__', line.quantity));
        return j;
      });
    },
    // Re-read the cart (another tab, back/forward cache, an app changed it)
    refresh() {
      return this.queue(async () => {
        const r = await fetch(`${location.pathname}?sections=${this.sections()}`, { headers: { Accept: 'application/json' } });
        if (r.ok) this.paintAll(await r.json(), null);
      });
    },
    notify(item) {
      const el = $('#cartNotify'); if (!el || !item) return;
      const line = item.key && $(`#cartBody .cart-line[data-key="${CSS.escape(item.key)}"]`);
      const img = line && line.querySelector('.cart-line__img img');
      const vars = line ? $$('.cart-line__variant', line).map(v => v.textContent.trim()).filter(Boolean).join(' · ') : (item.variant_title || '');
      const price = line ? line.dataset.unit : '';
      $('#cartNotifyItem').innerHTML = `<span class="cart-line__img">${img ? `<img class="mn-fill" src="${esc(img.currentSrc || img.src)}" alt="">` : ''}</span><div><span class="cart-line__title">${esc(item.product_title || item.title)}</span>${vars ? `<span class="cart-line__variant">${esc(vars)}</span>` : ''}${price ? `<span class="cart-notify__price">${esc(price)}</span>` : ''}</div>`;
      el.classList.add('is-open');
      const arm = () => { clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('is-open'), 5000); };
      arm();
      if (!el._bound) {
        el._bound = 1;
        el.addEventListener('mouseenter', () => clearTimeout(el._t));
        el.addEventListener('focusin', () => clearTimeout(el._t));
        el.addEventListener('mouseleave', () => el.classList.contains('is-open') && arm());
        el.addEventListener('click', e => { if (e.target.closest('[data-notify-close],[data-open]')) { clearTimeout(el._t); el.classList.remove('is-open'); } });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && el.classList.contains('is-open')) el.classList.remove('is-open'); });
      }
    },
  };

  // Steppers and remove, delegated so they survive every re-render
  document.addEventListener('click', e => {
    const line = e.target.closest('.cart-line[data-key]'); if (!line) return;
    const st = e.target.closest('[data-step-q]'), rm = e.target.closest('[data-remove]');
    if (!st && !rm) return;
    e.preventDefault();
    const key = line.dataset.key, max = line.dataset.max ? +line.dataset.max : Infinity;
    const fail = err => { line.classList.remove('is-busy', 'is-leaving'); line.style.height = ''; MN.toast(err.message); C.refresh(); };
    if (rm) {
      // collapse the line, then remove it
      line.style.height = line.offsetHeight + 'px'; void line.offsetHeight;
      line.classList.add('is-leaving'); line.style.height = '0px';
      C.change(key, 0).catch(fail);
      return;
    }
    const cur = +line.dataset.qty, next = Math.max(1, Math.min(max, cur + +st.dataset.stepQ));
    if (next === cur) { line.classList.remove('is-shake'); void line.offsetWidth; line.classList.add('is-shake'); return; }
    line.dataset.qty = next;
    const out = line.querySelector('.stepper span'); if (out) out.textContent = next;
    line.classList.add('is-busy');
    clearTimeout(line._t);
    // a burst of clicks becomes one request
    line._t = setTimeout(() => C.change(key, +line.dataset.qty).catch(fail), 280);
  });

  // Cart page: the order note saves itself; recommendations load from the first item
  let noteT;
  document.addEventListener('input', e => {
    const n = e.target.closest('[data-cart-note]'); if (!n) return;
    clearTimeout(noteT);
    noteT = setTimeout(() => fetch((routes().cart_url || '/cart') + '/update.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ note: n.value }) }).catch(() => {}), 500);
  });
  const loadRecs = () => {
    const r = $('[data-cart-recs]'); if (!r || r._loaded || $('[data-recs-inner]', r)) return; r._loaded = 1;
    fetch(r.dataset.cartRecs).then(x => (x.ok ? x.text() : '')).then(html => {
      const inner = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-recs-inner]');
      if (inner) r.innerHTML = inner.outerHTML;
    }).catch(() => {});
  };

  const bindCart = () => {
    loadRecs();
    const d = $('#ov-cart'); if (!d || d._bound) return; d._bound = 1;
    C.count(+d.dataset.count || 0, false);
  };
  window.addEventListener('pageshow', e => { if (e.persisted && $('#ov-cart')) C.refresh(); });

  /* ---- Product facts for compare and the wishlist:
     /products/{handle}?view=mn-data (templates/product.mn-data.liquid) ---- */
  const rootUrl = () => ((routes().root_url) || '/').replace(/\/?$/, '/');
  const pcache = new Map();
  MN.pdata = handle => {
    if (!pcache.has(handle)) {
      pcache.set(handle, fetch(`${rootUrl()}products/${encodeURIComponent(handle)}?view=mn-data`)
        .then(r => (r.ok ? r.text() : Promise.reject(r.status)))
        .then(t => JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)))
        .catch(err => { pcache.delete(handle); throw err; }));
    }
    return pcache.get(handle);
  };
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const bg = url => (url ? `background:var(--bg-soft) center/cover no-repeat url('${String(url).replace(/'/g, '%27')}')` : 'background:var(--bg-soft)');
  const t = (s, map) => Object.entries(map || {}).reduce((a, [k, v]) => a.split(k).join(v), s || '');
  const priceHTML = d => `<div class="price${d.compare ? ' price--sale' : ''}"><span class="price__now">${esc(d.price)}</span>${d.compare ? `<s class="price__was">${esc(d.compare)}</s><span class="badge badge--sale">−${d.off}%</span>` : ''}</div>`;
  const buyHTML = (d, attr) => !d.available
    ? `<span class="mn-btn mn-btn--sm mn-btn--block mn-btn--secondary" aria-disabled="true">${esc(STR().cmp?.sold_out || 'Sold out')}</span>`
    : d.single
      ? `<button type="button" class="mn-btn mn-btn--sm mn-btn--block" ${attr}="${d.variant_id}">${esc(STR().add || 'Add to bag')}</button>`
      : `<a class="mn-btn mn-btn--sm mn-btn--block mn-btn--secondary" href="${esc(d.url)}">${esc(STR().choose || 'Choose options')}</a>`;
  const addFrom = async (btn, id) => {
    btn.setAttribute('aria-busy', 'true');
    try { await C.add([{ id: +id, quantity: 1 }]); } catch (e) { /* toast shown */ }
    btn.removeAttribute('aria-busy');
  };

  /* ==================================================================
     Compare — ported from docs/claude_design_ref/mn/compare.js
     Up to four pieces, kept by handle in the browser; the tray gathers
     them and the table compares price, rating, material, origin, care,
     colours, sizes and availability. Rows nobody has are left out.
     ================================================================== */
  const CMP = MN.compare = {
    max: 4, diff: false,
    get ids() { return store.get('mn_compare', []).filter(h => typeof h === 'string'); },
    set ids(v) { store.set('mn_compare', v.slice(0, this.max)); },
    toggle(h) {
      const ids = this.ids, i = ids.indexOf(h);
      if (i > -1) ids.splice(i, 1);
      else { if (ids.length >= this.max) { MN.toast(STR().cmp?.max || 'You can compare up to 4 pieces'); return; } ids.push(h); MN.toast(STR().cmp?.added || 'Added to compare'); }
      this.ids = ids; this.paint();
    },
    async paint() {
      const ids = this.ids;
      $$('[data-compare-id]').forEach(b => b.setAttribute('aria-pressed', ids.includes(b.dataset.compareId)));
      // the product page's Compare action reads "In compare" while chosen
      $$('[data-cmp-main]').forEach(b => { const sp = b.querySelector('span'); if (!sp) return; sp.dataset.off = sp.dataset.off || sp.textContent; sp.textContent = ids.includes(b.dataset.compareId) ? (STR().in_compare || 'In compare') : sp.dataset.off; });
      const tray = $('#cmpTray'); if (!tray) return;
      tray.classList.toggle('is-visible', ids.length > 0);
      const n = tray.querySelector('[data-cmp-count]'); if (n) n.textContent = ids.length;
      const data = await Promise.all(ids.map(h => MN.pdata(h).catch(() => null)));
      tray.querySelector('.cmp-tray__items').innerHTML = Array.from({ length: this.max }, (_, k) => {
        const d = data[k];
        return d ? `<span class="cmp-slot is-filled" style="${bg(d.image)}" title="${esc(d.title)}"><button type="button" data-cmp-remove="${esc(d.handle)}" aria-label="${esc(t(STR().cmp?.remove, { __T__: d.title }))}">${icon('close')}</button></span>` : '<span class="cmp-slot"></span>';
      }).join('');
      if ($('#ov-cmpp')?.classList.contains('is-open')) this.render();
    },
    async render() {
      const body = $('#cmppBody'); if (!body) return;
      const S = STR().cmp || {};
      const ps = (await Promise.all(this.ids.map(h => MN.pdata(h).catch(() => null)))).filter(Boolean);
      if (!ps.length) { body.innerHTML = `<p class="cmpt__empty">${esc(S.empty)}</p>`; return; }
      const opt = (d, kind) => (d.options || []).find(o => o.kind === kind);
      const rows = [
        ['price', S.price, d => priceHTML(d)],
        ['rating', S.rating, d => (+d.rating ? `${MN.stars(+d.rating)} <span class="muted-note">${(+d.rating).toFixed(1)}${d.rating_count ? ' (' + d.rating_count + ')' : ''}</span>` : '')],
        ['material', S.material, d => esc(d.material)],
        ['origin', S.origin, d => esc(d.origin)],
        ['care', S.care, d => esc(d.care)],
        ['colours', S.colours, d => { const o = opt(d, 'colour'); return o ? `<div class="card__swatches">${o.values.map(v => `<span class="card__swatch" style="${esc(v.style)}" title="${esc(v.label)}"></span>`).join('')}</div>` : ''; }],
        ['sizes', S.sizes, d => { const o = opt(d, 'size'); return o ? `<div class="card__sizes">${o.values.map(v => (v.in_stock ? `<span>${esc(v.label)}</span>` : `<s>${esc(v.label)}</s>`)).join('')}</div>` : ''; }],
        ['availability', S.availability, d => esc(!d.available ? S.sold_out : d.low ? t(S.only_left, { __N__: d.low }) : S.in_stock)],
        ['buy', '', d => buyHTML(d, 'data-cmp-add')],
      ].map(([k, l, f]) => [k, l, ps.map(f)]).filter(r => r[0] === 'buy' || r[2].some(v => v));
      const diffKeys = ['material', 'origin', 'care', 'availability'];
      const empty = Math.max(0, Math.min(this.max, Math.max(2, ps.length + 1)) - ps.length);
      const cards = $$('.card[data-handle]').filter(c => !this.ids.includes(c.dataset.handle) && !c.classList.contains('is-soldout'));
      const seen = new Set(), sug = cards.filter(c => !seen.has(c.dataset.handle) && seen.add(c.dataset.handle)).slice(0, 3);
      const sugHTML = sug.map(c => { const img = c.querySelector('.card__img--a img'); return `<button type="button" class="cmpt__sug-item" data-cmp-pick="${esc(c.dataset.handle)}" aria-pressed="false"><span style="${bg(img && (img.currentSrc || img.src))}"></span><span><b>${esc(c.querySelector('.card__title')?.textContent.trim())}</b><small>${esc(c.querySelector('.price__now')?.textContent.trim())}</small></span>${icon('plus', 'icon--sm')}</button>`; }).join('');
      const slot = empty ? `<td colspan="${empty}" class="cmpt__slot" rowspan="${rows.length + 1}"><div class="cmpt__add"><span class="cmpt__add-icon">${icon('plus')}</span><b>${esc(S.add_title)}</b><span class="muted-note">${esc(S.add_hint)}</span>${sugHTML ? `<div class="cmpt__sug">${sugHTML}</div>` : ''}</div></td>` : '';
      body.innerHTML = `<div class="cmpt__toggle"><span class="muted-note">${esc(t(S.count, { __N__: ps.length }))}</span><label class="check"><input type="checkbox" data-cmp-diff${this.diff ? ' checked' : ''}><span>${esc(S.diff)}</span></label></div>`
        + `<div class="cmpt"><table><colgroup><col style="width:130px">${ps.map(() => '<col>').join('')}${'<col>'.repeat(empty)}</colgroup><tbody>`
        + `<tr><th></th>${ps.map(d => `<td><div class="cmpt__prod"><div class="cmpt__img" style="${bg(d.image)}"><button type="button" class="icon-btn" data-cmp-remove="${esc(d.handle)}" aria-label="${esc(t(S.remove, { __T__: d.title }))}">${icon('close', 'icon--sm')}</button></div><span class="mn-eyebrow">${esc(d.vendor)}</span><a class="cmpt__title" href="${esc(d.url)}">${esc(d.title)}</a></div></td>`).join('')}${slot}</tr>`
        + rows.map(([k, l, vals]) => { const diff = this.diff && diffKeys.includes(k) && new Set(vals).size > 1; return `<tr class="${diff ? 'is-diff' : ''}"><th>${esc(l)}</th>${vals.map(v => `<td>${v || '<span class="muted-note">—</span>'}</td>`).join('')}</tr>`; }).join('')
        + '</tbody></table></div>';
    },
  };
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-compare-id]'); if (c) { e.preventDefault(); CMP.toggle(c.dataset.compareId); return; }
    const r = e.target.closest('[data-cmp-remove]'); if (r) { e.preventDefault(); CMP.toggle(r.dataset.cmpRemove); return; }
    const p = e.target.closest('[data-cmp-pick]'); if (p) { CMP.toggle(p.dataset.cmpPick); return; }
    if (e.target.closest('[data-cmp-clear]')) { CMP.ids = []; CMP.paint(); return; }
    const a = e.target.closest('[data-cmp-add]'); if (a) addFrom(a, a.dataset.cmpAdd);
  });
  document.addEventListener('change', e => { if (e.target.matches('[data-cmp-diff]')) { CMP.diff = e.target.checked; CMP.render(); } });
  window.addEventListener('storage', e => { if (e.key === 'mn_compare') CMP.paint(); });

  /* ==================================================================
     Wishlist drawer. theme.js keeps the saved ids (mn_wishlist) and
     their handles (mn_wishlist_h); this shows them in the design's
     drawer, with add to bag and remove.
     ================================================================== */
  const W = MN.wish = {
    async render() {
      const body = $('#wishBody'); if (!body) return;
      const S = STR().wish || {};
      const ids = store.get('mn_wishlist', []), map = store.get('mn_wishlist_h', {});
      const list = ids.filter(id => map[id]);
      $('#wishTitle').textContent = list.length ? t(S.title_count, { __N__: list.length }) : S.title;
      if (!list.length) {
        body.innerHTML = `<div class="mn-cart-empty"><p>${esc(S.empty)}</p><a href="${esc(routes().all_products_url || '/collections/all')}" class="mn-btn mn-btn--secondary mn-btn--sm">${esc(S.browse)}</a></div>`;
        return;
      }
      const data = await Promise.all(list.map(id => MN.pdata(map[id]).catch(() => null)));
      body.innerHTML = list.map((id, k) => {
        const d = data[k]; if (!d) return '';
        return `<div class="cart-line wish-line" data-wish-id="${esc(id)}"><a href="${esc(d.url)}" class="cart-line__img" style="${bg(d.image)}" tabindex="-1" aria-hidden="true"></a><div class="cart-line__text"><span class="cart-line__variant">${esc(d.vendor)}</span><a href="${esc(d.url)}" class="cart-line__title">${esc(d.title)}</a>${priceHTML(d)}<div class="wish-line__buy">${buyHTML(d, 'data-wish-add')}</div></div><div class="cart-line__end"><span></span><button type="button" class="link-quiet" data-wishlist-id="${esc(id)}">${esc(S.remove)}</button></div></div>`;
      }).join('');
    },
  };
  document.addEventListener('click', e => { const a = e.target.closest('[data-wish-add]'); if (a) addFrom(a, a.dataset.wishAdd); });
  document.addEventListener('wishlist:updated', () => { if ($('#ov-wish')?.classList.contains('is-open')) W.render(); });

  // Cards that arrive later (load more, infinite scroll, recently viewed)
  // show the saved / comparing state like the rest.
  const syncCards = node => {
    const cmp = CMP.ids, wish = store.get('mn_wishlist', []).map(String);
    $$('[data-compare-id]', node).forEach(b => b.setAttribute('aria-pressed', cmp.includes(b.dataset.compareId)));
    $$('.card [data-wishlist-id]', node).forEach(b => { const on = wish.includes(String(b.dataset.wishlistId)); b.setAttribute('aria-pressed', on); b.classList.toggle('is-active', on); });
  };
  new MutationObserver(rs => rs.forEach(r => r.addedNodes.forEach(n => { if (n.nodeType === 1 && (n.matches('.card') || n.querySelector('.card'))) syncCards(n); })))
    .observe(document.documentElement, { childList: true, subtree: true });

  const bindExtras = () => {
    const cm = $('#ov-cmpp'); if (cm && !cm._bound) { cm._bound = 1; cm.addEventListener('overlay:open', () => CMP.render()); }
    const wd = $('#ov-wish'); if (wd && !wd._bound) { wd._bound = 1; wd.addEventListener('overlay:open', () => W.render()); }
    CMP.paint();
  };

  /* ==================================================================
     Account pages: password show / hide, forms that open in place,
     delete confirmation, and the sign-in / reset-password switch.
     ================================================================== */
  document.addEventListener('click', e => {
    const pw = e.target.closest('[data-pw-toggle]');
    if (pw) {
      const inp = document.getElementById(pw.getAttribute('aria-controls')); if (!inp) return;
      const show = inp.type === 'password'; inp.type = show ? 'text' : 'password';
      pw.setAttribute('aria-pressed', show); pw.setAttribute('aria-label', show ? pw.dataset.labelHide : pw.dataset.labelShow);
      return;
    }
    const tg = e.target.closest('[data-acct-toggle]');
    if (tg) {
      const el = document.getElementById(tg.dataset.acctToggle); if (!el) return;
      const open = el.hidden; el.hidden = !open;
      $$(`[data-acct-toggle="${tg.dataset.acctToggle}"][aria-expanded]`).forEach(b => b.setAttribute('aria-expanded', open));
      el.closest('.mn-addr__card')?.classList.toggle('is-editing', open);
      if (open) { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); el.querySelector('input:not([type=hidden]), select')?.focus({ preventScroll: true }); }
      return;
    }
    const cp = e.target.closest('[data-copy-link]');
    if (cp) {
      const done = () => MN.toast(cp.dataset.copied || 'Copied');
      navigator.clipboard ? navigator.clipboard.writeText(cp.dataset.copyLink).then(done, done) : done();
      return;
    }
    const del = e.target.closest('[data-confirm]');
    if (del && !window.confirm(del.dataset.confirm)) { e.preventDefault(); return; }
    const auth = e.target.closest('[data-auth-recover], [data-auth-login]');
    if (auth) {
      const root = auth.closest('.mn-auth'); if (!root) return;
      e.preventDefault();
      const rec = auth.hasAttribute('data-auth-recover'); root.classList.toggle('is-recover', rec);
      history.replaceState(null, '', rec ? '#recover' : location.pathname + location.search);
      $(rec ? '.mn-auth__recover input[type=email]' : '.mn-auth__login input[type=email]', root)?.focus();
    }
  });
  const bindAuth = () => { if (location.hash === '#recover') $$('.mn-auth').forEach(r => { if ($('#recover', r)) r.classList.add('is-recover'); }); };
  window.addEventListener('hashchange', bindAuth);

  const boot = root => { MN.initTabs(root || document); bindHeader(); bindFooter(); bindCart(); bindExtras(); bindAuth(); };
  document.addEventListener('DOMContentLoaded', () => boot());
  document.addEventListener('shopify:section:load', e => { if (e.target.querySelector('#siteHeader')) { H.cur = null; } boot(e.target); });
})();
