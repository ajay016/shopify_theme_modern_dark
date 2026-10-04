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
      if (fd) { body.append('sections', this.section); body.append('sections_url', location.pathname); }
      else body = Object.assign({}, body, { sections: this.section, sections_url: location.pathname });
      const r = await fetch(url, { method: 'POST', headers: fd ? { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } : { 'Content-Type': 'application/json', Accept: 'application/json' }, body: fd ? body : JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.status) { const e = new Error(j.description || j.message || STR().cart_error || 'Something went wrong.'); e.data = j; throw e; }
      return j;
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
        this.paint(j.sections && j.sections[this.section]);
        if (after === 'notification') this.notify(added[0]);
        else if (after !== 'none' && $('#ov-cart')) MN.overlay.open('ov-cart', opts.opener);
        return j;
      });
    },
    change(key, quantity) {
      return this.queue(async () => {
        const j = await this.post(routes().cart_change_url ? routes().cart_change_url + '.js' : '/cart/change.js', { id: key, quantity });
        this.paint(j.sections && j.sections[this.section]);
        const line = (j.items || []).find(i => i.key === key);
        if (quantity > 0 && line && line.quantity < quantity) MN.toast((STR().cart_only_left || 'Only __N__ available').replace('__N__', line.quantity));
        return j;
      });
    },
    // Re-read the cart (another tab, back/forward cache, an app changed it)
    refresh() {
      return this.queue(async () => {
        const r = await fetch(`${location.pathname}?sections=${this.section}`, { headers: { Accept: 'application/json' } });
        if (r.ok) this.paint((await r.json())[this.section]);
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
    const line = e.target.closest('#cartBody .cart-line'); if (!line) return;
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

  const bindCart = () => {
    const d = $('#ov-cart'); if (!d || d._bound) return; d._bound = 1;
    C.count(+d.dataset.count || 0, false);
  };
  window.addEventListener('pageshow', e => { if (e.persisted && $('#ov-cart')) C.refresh(); });

  const boot = root => { MN.initTabs(root || document); bindHeader(); bindFooter(); bindCart(); };
  document.addEventListener('DOMContentLoaded', () => boot());
  document.addEventListener('shopify:section:load', e => { if (e.target.querySelector('#siteHeader')) { H.cur = null; } boot(e.target); });
})();
