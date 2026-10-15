/* Maison Noir · Homepage AW26
   Each section has one init function that receives its <section> and touches nothing outside it.
   Cross-section communication happens only through bubbling CustomEvents (mn:cart:add). */
(function () {
  'use strict';

  /* ---------- Shared helpers (pure, stateless) ---------- */
  var qs = function (s, r) { return r.querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call(r.querySelectorAll(s)); };
  var reduced = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  function reveal(sectionEl) {
    var items = qsa('.rv', sectionEl);
    if (sectionEl.classList.contains('rv')) items.push(sectionEl);
    if (!('IntersectionObserver' in window)) { items.forEach(function (i) { i.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    items.forEach(function (i) { io.observe(i); });
  }

  function confirmAdd(btn, labelEl, text, qty) {
    if (btn.classList.contains('is-added')) return;
    var prev = labelEl ? labelEl.textContent : '';
    btn.classList.add('is-added');
    if (labelEl) labelEl.textContent = text;
    btn.dispatchEvent(new CustomEvent('mn:cart:add', { bubbles: true, detail: { quantity: qty } }));
    setTimeout(function () { btn.classList.remove('is-added'); if (labelEl) labelEl.textContent = prev; }, 2000);
  }

  /* Product card behaviour, delegated from the section that contains cards */
  function bindProductCards(sectionEl) {
    sectionEl.addEventListener('click', function (e) {
      var heart = e.target.closest('.pc__heart');
      if (heart) { heart.setAttribute('aria-pressed', String(heart.getAttribute('aria-pressed') !== 'true')); return; }
      var dot = e.target.closest('.pc__dot');
      if (dot) {
        var card = dot.closest('.pc');
        qsa('.pc__dot', card).forEach(function (d) { d.setAttribute('aria-pressed', String(d === dot)); });
        var hex = dot.style.getPropertyValue('--sw').trim(), img = qs('.pc__img', card), name = qs('.pc__colour', card);
        if (img && hex) img.style.setProperty('--ph', 'color-mix(in oklab, ' + hex + ' 58%, var(--c-deep))');
        if (name) name.textContent = dot.getAttribute('aria-label');
        return;
      }
      var add = e.target.closest('.pc__add');
      if (add) confirmAdd(add, qs('.pc__add-t', add), 'Added', 1);
    });
  }

  /* Horizontal rail: progress bar + arrow state */
  function bindRail(rail, prev, next, bar, onUpdate) {
    var items = Array.prototype.slice.call(rail.children);
    var step = function () { return items[1] ? items[1].offsetLeft - items[0].offsetLeft : rail.clientWidth; };
    var update = function () {
      var max = rail.scrollWidth - rail.clientWidth, x = rail.scrollLeft;
      var w = rail.scrollWidth ? rail.clientWidth / rail.scrollWidth : 1, p = max > 0 ? x / max : 0;
      if (bar) { bar.style.setProperty('--w', (w * 100) + '%'); bar.style.setProperty('--l', (p * (1 - w) * 100) + '%'); }
      if (prev) prev.disabled = x < 4;
      if (next) next.disabled = x > max - 4;
      if (onUpdate) onUpdate(Math.min(items.length, Math.round(x / step()) + 1));
    };
    var go = function (dir) { rail.scrollBy({ left: dir * step(), behavior: reduced() ? 'auto' : 'smooth' }); };
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    rail.addEventListener('scroll', update, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(rail);
    update();
  }

  /* ---------- Header ---------- */
  function initHeader(sectionEl) {
    var btn = qs('.hd__menu', sectionEl), drawer = qs('.hd__drawer', sectionEl);
    var count = qs('[data-count]', sectionEl), bag = qs('.hd__bag', sectionEl);
    var toggle = function (open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.hidden = !open;
    };
    btn.addEventListener('click', function () { toggle(btn.getAttribute('aria-expanded') !== 'true'); });
    sectionEl.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden) { toggle(false); btn.focus(); } });
    document.addEventListener('mn:cart:add', function (e) {
      var n = (parseInt(count.textContent, 10) || 0) + ((e.detail && e.detail.quantity) || 1);
      count.textContent = n;
      bag.setAttribute('aria-label', 'Bag, ' + n + ' items');
      count.classList.remove('is-bump'); void count.offsetWidth; count.classList.add('is-bump');
    });
  }

  /* ---------- Hero ---------- */
  function initHero(sectionEl) { /* reveals only */ }

  /* ---------- Ticker ---------- */
  function initTicker(sectionEl) {
    var track = qs('.tk__track', sectionEl), list = qs('.tk__list', sectionEl), btn = qs('.tk__toggle', sectionEl);
    var clone = list.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
    btn.addEventListener('click', function () {
      var paused = sectionEl.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', String(paused));
      btn.setAttribute('aria-label', paused ? 'Play ticker' : 'Pause ticker');
    });
  }

  /* ---------- Shop by category: hover preview follows the pointer ---------- */
  function initCategories(sectionEl) {
    var list = qs('.ct__list', sectionEl), rows = qsa('.ct__row', sectionEl);
    var fine = window.matchMedia('(hover: hover) and (min-width: 721px)');
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    var setActive = function (row) { rows.forEach(function (r) { r.classList.toggle('is-active', r === row); }); };
    var paint = function () {
      var k = reduced() ? 1 : 0.16;
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      list.style.setProperty('--x', cx + 'px'); list.style.setProperty('--y', cy + 'px');
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(paint) : 0;
    };
    var moveTo = function (x, y, jump) { tx = x; ty = y; if (jump) { cx = x; cy = y; } if (!raf) raf = requestAnimationFrame(paint); };
    list.addEventListener('pointermove', function (e) {
      if (!fine.matches || e.pointerType !== 'mouse') return;
      var r = list.getBoundingClientRect();
      moveTo(e.clientX - r.left, e.clientY - r.top, !list.classList.contains('is-live'));
      list.classList.add('is-live');
    });
    rows.forEach(function (row) {
      row.addEventListener('pointerenter', function (e) { if (fine.matches && e.pointerType === 'mouse') setActive(row); });
      row.addEventListener('focusin', function () {
        if (!fine.matches) return;
        moveTo(list.clientWidth * 0.62, row.offsetTop + row.offsetHeight / 2, true);
        setActive(row);
      });
    });
    list.addEventListener('pointerleave', function () { setActive(null); list.classList.remove('is-live'); });
    list.addEventListener('focusout', function (e) { if (!list.contains(e.relatedTarget)) setActive(null); });
  }

  /* ---------- New arrivals: tabs filter ---------- */
  function initNewArrivals(sectionEl) {
    bindProductCards(sectionEl);
    var tabs = qsa('.na__tab', sectionEl), grid = qs('.na__grid', sectionEl), cards = qsa('.pc', grid);
    var select = function (tab, focus) {
      tabs.forEach(function (t) { var on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      if (focus) tab.focus();
      var f = tab.dataset.filter;
      var apply = function () {
        cards.forEach(function (c) { c.hidden = !(f === 'all' || c.dataset.type === f); if (!c.hidden) c.classList.add('is-in'); });
        grid.classList.remove('is-out');
      };
      if (reduced()) { apply(); return; }
      grid.classList.add('is-out');
      setTimeout(apply, 280);
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  }

  /* ---------- Editorial campaign ---------- */
  function initEditorial(sectionEl) { /* reveals only */ }

  /* ---------- Best sellers rail ---------- */
  function initBestSellers(sectionEl) {
    bindProductCards(sectionEl);
    var cur = qs('[data-current]', sectionEl);
    bindRail(qs('.bs__rail', sectionEl), qs('[data-dir="-1"]', sectionEl), qs('[data-dir="1"]', sectionEl), qs('.bs__bar span', sectionEl),
      function (i) { if (cur) cur.textContent = pad(i); });
  }

  /* ---------- Shop the look ---------- */
  function initShopTheLook(sectionEl) {
    bindProductCards(sectionEl);
    var spots = qsa('.sl__spot', sectionEl), items = qsa('.sl__item', sectionEl), all = qs('.sl__all', sectionEl);
    var set = function (i) {
      spots.forEach(function (s, k) { s.classList.toggle('is-active', k === i); s.setAttribute('aria-pressed', String(k === i)); });
      items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); });
    };
    spots.forEach(function (s, i) {
      s.addEventListener('mouseenter', function () { set(i); });
      s.addEventListener('focus', function () { set(i); });
      s.addEventListener('click', function () {
        set(i);
        if (window.matchMedia('(max-width: 900px)').matches) {
          var r = items[i].getBoundingClientRect();
          window.scrollTo({ top: r.top + window.pageYOffset - 120, behavior: reduced() ? 'auto' : 'smooth' });
        }
      });
    });
    items.forEach(function (it, i) { it.addEventListener('mouseenter', function () { set(i); }); });
    if (all) all.addEventListener('click', function () { confirmAdd(all, all, 'Added to bag', items.length); });
    set(0);
  }

  /* ---------- Limited drop countdown ---------- */
  function initLimitedDrop(sectionEl) {
    var end = Date.parse(sectionEl.dataset.end), timer = 0;
    var u = { d: qs('[data-u="d"]', sectionEl), h: qs('[data-u="h"]', sectionEl), m: qs('[data-u="m"]', sectionEl), s: qs('[data-u="s"]', sectionEl) };
    var live = qs('[data-live]', sectionEl);
    var tick = function () {
      var ms = isNaN(end) ? 0 : end - Date.now();
      if (ms <= 0) { ms = 0; clearInterval(timer); if (live) live.hidden = false; }
      var t = Math.floor(ms / 1000);
      u.d.textContent = pad(Math.floor(t / 86400)); u.h.textContent = pad(Math.floor(t % 86400 / 3600));
      u.m.textContent = pad(Math.floor(t % 3600 / 60)); u.s.textContent = pad(t % 60);
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  /* ---------- Collection spotlight: sticky panel follows scrolling chapters ---------- */
  function initSpotlight(sectionEl) {
    var chs = qsa('.sp__ch', sectionEl), steps = qs('[data-steps]', sectionEl), now = qs('.sp__now', sectionEl);
    var num = qs('[data-numeral]', sectionEl), title = qs('[data-ctitle]', sectionEl), btns = [], active = -1;
    var set = function (i) {
      if (i === active) return; active = i;
      btns.forEach(function (b, k) { b.setAttribute('aria-current', String(k === i)); });
      num.textContent = chs[i].dataset.num; title.textContent = chs[i].dataset.title;
      if (!reduced()) { now.classList.remove('is-swap'); void now.offsetWidth; now.classList.add('is-swap'); }
    };
    chs.forEach(function (c, i) {
      var li = document.createElement('li'), b = document.createElement('button'), n = document.createElement('span'), t = document.createElement('span');
      b.type = 'button'; b.className = 'sp__step'; n.textContent = c.dataset.num; t.textContent = c.dataset.title;
      b.appendChild(n); b.appendChild(t); li.appendChild(b); steps.appendChild(li); btns.push(b);
      b.addEventListener('click', function () {
        var r = c.getBoundingClientRect();
        window.scrollTo({ top: r.top + window.pageYOffset - window.innerHeight * 0.18, behavior: reduced() ? 'auto' : 'smooth' });
      });
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) set(chs.indexOf(e.target)); });
      }, { rootMargin: '-50% 0px -50% 0px' });
      chs.forEach(function (c) { io.observe(c); });
    }
    set(0);
  }

  /* ---------- Atelier: figures count up once ---------- */
  function initAtelier(sectionEl) {
    var vals = qsa('[data-count]', sectionEl);
    if (reduced() || !('IntersectionObserver' in window)) return;
    var run = function (el) {
      var to = parseInt(el.dataset.count, 10), t0 = performance.now(), dur = 1400;
      var frame = function (t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * e);
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    vals.forEach(function (v) { v.textContent = '0'; io.observe(v); });
  }

  /* ---------- Lookbook: drag to scroll (mouse), native swipe on touch ---------- */
  function initLookbook(sectionEl) {
    var track = qs('.lb__track', sectionEl), down = false, moved = false, sx = 0, sl = 0;
    bindRail(track, qs('[data-dir="-1"]', sectionEl), qs('[data-dir="1"]', sectionEl), qs('.lb__bar span', sectionEl));
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = track.scrollLeft;
      track.setPointerCapture(e.pointerId); track.classList.add('is-dragging');
    });
    track.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = sl - dx;
    });
    var up = function () { if (!down) return; down = false; track.classList.remove('is-dragging'); };
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* ---------- Press: publication names act as tabs ---------- */
  function initPress(sectionEl) {
    var figs = qsa('.pr__q', sectionEl), list = qs('.pr__names', sectionEl), tabs = [];
    var uid = 'pr' + Math.random().toString(36).slice(2, 7);
    var select = function (i, focus) {
      tabs.forEach(function (t, k) { var on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; figs[k].classList.toggle('is-active', on); });
      if (focus) tabs[i].focus();
    };
    figs.forEach(function (f, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pr__name pr__name--' + (f.dataset.style || 'a');
      b.id = uid + '-t' + i; f.id = uid + '-q' + i;
      b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', f.id);
      f.setAttribute('role', 'tabpanel'); f.setAttribute('aria-labelledby', b.id);
      b.textContent = f.dataset.name;
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); select((i + d + figs.length) % figs.length, true); }
      });
      list.appendChild(b); tabs.push(b);
    });
    select(0);
  }

  /* ---------- Journal / Community / Services / Footer ---------- */
  function initJournal(sectionEl) { /* reveals only */ }
  function initCommunity(sectionEl) { /* reveals only */ }
  function initServices(sectionEl) { /* reveals only */ }
  function initFooter(sectionEl) { /* placeholder */ }

  /* ---------- Newsletter ---------- */
  function initNewsletter(sectionEl) {
    var form = qs('form', sectionEl), input = qs('input[type=email]', sectionEl), msg = qs('.nl__msg', sectionEl);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      msg.classList.toggle('is-error', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      msg.textContent = ok ? 'Thank you. Your first letter arrives at the start of next month.' : 'Please enter a valid email address.';
      if (ok) form.reset(); else input.focus();
    });
  }

  /* ---------- Boot ---------- */
  var inits = {
    'header': initHeader, 'hero': initHero, 'ticker': initTicker, 'categories': initCategories,
    'new-arrivals': initNewArrivals, 'editorial': initEditorial, 'best-sellers': initBestSellers,
    'shop-the-look': initShopTheLook, 'limited-drop': initLimitedDrop, 'collection-spotlight': initSpotlight,
    'atelier': initAtelier, 'lookbook': initLookbook, 'press': initPress, 'journal': initJournal,
    'community': initCommunity, 'services': initServices, 'newsletter': initNewsletter, 'footer': initFooter
  };
  function boot(root) {
    var list = root.matches && root.matches('[data-section]') ? [root] : qsa('[data-section]', root);
    list.forEach(function (s) {
      if (s.dataset.ready) return;
      s.dataset.ready = '1';
      reveal(s);
      var fn = inits[s.dataset.section];
      if (fn) fn(s);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(document); });
  else boot(document);
  document.addEventListener('shopify:section:load', function (e) { boot(e.target); });
})();
