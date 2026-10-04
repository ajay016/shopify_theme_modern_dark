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

  /* ---- Boot: tabs present in server-rendered markup ---- */
  const boot = root => MN.initTabs(root || document);
  document.addEventListener('DOMContentLoaded', () => boot());
  document.addEventListener('shopify:section:load', e => boot(e.target));
})();
