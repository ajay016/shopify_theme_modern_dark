/* Maison homepage: behaviour, ported from docs/claude_design_ref_home2/script.js.
   Each section has one init that receives its <section class="mh" data-mh="…">
   and touches nothing outside it. Product cards, quick view, wishlist and the
   cart are the store's own (theme.js / mn.js); "Add all" uses MN.cart.
   Theme editor: sections boot on shopify:section:load and stop their timers
   and observers on shopify:section:unload. */
(function () {
  'use strict';
  if (window.MH) return; // the script tag can appear once per section
  var MH = window.MH = { inits: {}, stops: new WeakMap() };

  var qs = function (s, r) { return r.querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call(r.querySelectorAll(s)); };
  var html = document.documentElement;
  var reduced = function () {
    var m = html.getAttribute('data-motion');
    if (m === 'reduced') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var onStop = function (sec, fn) { var l = MH.stops.get(sec) || []; l.push(fn); MH.stops.set(sec, l); };

  function reveal(sec) {
    var items = qsa('.mh-reveal', sec);
    if (!items.length) return;
    if (reduced() || window.Shopify && Shopify.designMode || !('IntersectionObserver' in window)) { items.forEach(function (i) { i.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    items.forEach(function (i) { io.observe(i); });
    onStop(sec, function () { io.disconnect(); });
  }

  /* Horizontal rail: progress bar + arrow state */
  function bindRail(sec, rail, prev, next, bar, onUpdate) {
    var items = Array.prototype.slice.call(rail.children);
    var step = function () { return items[1] ? items[1].offsetLeft - items[0].offsetLeft : rail.clientWidth; };
    var update = function () {
      var max = rail.scrollWidth - rail.clientWidth, x = rail.scrollLeft;
      var w = rail.scrollWidth ? rail.clientWidth / rail.scrollWidth : 1, p = max > 0 ? x / max : 0;
      if (bar) { bar.style.setProperty('--mh-w', (w * 100) + '%'); bar.style.setProperty('--mh-l', (p * (1 - w) * 100) + '%'); }
      if (prev) prev.disabled = x < 4;
      if (next) next.disabled = x > max - 4;
      if (onUpdate) onUpdate(Math.min(items.length, Math.round(x / step()) + 1));
    };
    var go = function (dir) { rail.scrollBy({ left: dir * step(), behavior: reduced() ? 'auto' : 'smooth' }); };
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    rail.addEventListener('scroll', update, { passive: true });
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(update); ro.observe(rail); onStop(sec, function () { ro.disconnect(); }); }
    update();
  }

  /* ---------- Ticker ---------- */
  MH.inits.ticker = function (sec) {
    var track = qs('.mh-tk__track', sec), list = qs('.mh-tk__list', sec), btn = qs('.mh-tk__toggle', sec);
    if (!track || !list) return;
    var clone = list.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
    if (btn) btn.addEventListener('click', function () {
      var paused = sec.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', String(paused));
      btn.setAttribute('aria-label', paused ? btn.dataset.play : btn.dataset.pause);
    });
  };

  /* ---------- Shop by category: hover preview follows the pointer ---------- */
  MH.inits.categories = function (sec) {
    var list = qs('.mh-ct__list', sec), rows = qsa('.mh-ct__row', sec);
    if (!list) return;
    var fine = window.matchMedia('(hover: hover) and (min-width: 721px)');
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    var setActive = function (row) { rows.forEach(function (r) { r.classList.toggle('is-active', r === row); }); };
    var paint = function () {
      var k = reduced() ? 1 : 0.16;
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      list.style.setProperty('--mh-x', cx + 'px'); list.style.setProperty('--mh-y', cy + 'px');
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
    onStop(sec, function () { if (raf) cancelAnimationFrame(raf); });
  };

  /* ---------- New arrivals: tabs filter the grid ---------- */
  MH.inits['new-arrivals'] = function (sec) {
    var tabs = qsa('.mh-na__tab', sec), grid = qs('.mh-na__grid', sec), items = qsa('.mh-na__item', sec), link = qs('[data-na-link]', sec), t = 0;
    if (!grid || !tabs.length) return;
    var select = function (tab, focus) {
      tabs.forEach(function (x) { var on = x === tab; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; });
      if (focus) tab.focus();
      var f = tab.dataset.tab;
      if (link && tab.dataset.url) link.href = tab.dataset.url;
      var apply = function () {
        items.forEach(function (c) { c.hidden = c.dataset.tab !== f; if (!c.hidden) qsa('.mh-reveal', c).concat([c]).forEach(function (r) { r.classList.add('is-in'); }); });
        grid.classList.remove('is-out');
      };
      if (reduced()) { apply(); return; }
      grid.classList.add('is-out');
      clearTimeout(t); t = setTimeout(apply, 280);
    };
    tabs.forEach(function (x, i) {
      x.addEventListener('click', function () { select(x); });
      x.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
    onStop(sec, function () { clearTimeout(t); });
  };

  /* ---------- Best sellers rail ---------- */
  MH.inits['best-sellers'] = function (sec) {
    var rail = qs('.mh-bs__rail', sec); if (!rail) return;
    var cur = qs('[data-current]', sec);
    bindRail(sec, rail, qs('[data-dir="-1"]', sec), qs('[data-dir="1"]', sec), qs('.mh-bs__bar span', sec), function (i) { if (cur) cur.textContent = pad(i); });
  };

  /* ---------- Shop the look: hotspots light their piece; add all to the bag ---------- */
  MH.inits['shop-the-look'] = function (sec) {
    var spots = qsa('.mh-sl__spot', sec), items = qsa('.mh-sl__item', sec), all = qs('.mh-sl__all', sec);
    var set = function (i) {
      spots.forEach(function (s, k) { s.classList.toggle('is-active', k === i); s.setAttribute('aria-pressed', String(k === i)); });
      items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); });
    };
    spots.forEach(function (s, i) {
      s.addEventListener('mouseenter', function () { set(i); });
      s.addEventListener('focus', function () { set(i); });
      s.addEventListener('click', function () {
        set(i);
        if (items[i] && window.matchMedia('(max-width: 900px)').matches) {
          var r = items[i].getBoundingClientRect();
          window.scrollTo({ top: r.top + window.pageYOffset - 120, behavior: reduced() ? 'auto' : 'smooth' });
        }
      });
    });
    items.forEach(function (it, i) { it.addEventListener('mouseenter', function () { set(i); }); });
    if (all) all.addEventListener('click', function () {
      var ids = qsa('[data-variant]', sec).map(function (x) { return { id: +x.dataset.variant, quantity: 1 }; }).filter(function (x) { return x.id; });
      if (!ids.length || !(window.MN && MN.cart)) { location.href = all.dataset.fallback || '/collections/all'; return; }
      var label = qs('.mh-sl__all-t', all) || all, prev = label.textContent;
      all.disabled = true;
      MN.cart.add(ids, { opener: all }).then(function () {
        all.classList.add('is-added'); label.textContent = all.dataset.added || prev;
        setTimeout(function () { all.classList.remove('is-added'); label.textContent = prev; }, 2000);
      }).catch(function () {}).then(function () { all.disabled = false; });
    });
    if (spots.length) set(0);
  };

  /* ---------- Limited drop countdown ---------- */
  MH.inits['limited-drop'] = function (sec) {
    // data-end: epoch ms from Liquid (the store's time zone), or an ISO date
    var raw = (sec.dataset.end || '').trim();
    var end = /^\d+$/.test(raw) ? +raw : Date.parse(raw.indexOf('T') > 0 || !raw ? raw : raw.replace(' ', 'T'));
    var u = { d: qs('[data-u="d"]', sec), h: qs('[data-u="h"]', sec), m: qs('[data-u="m"]', sec), s: qs('[data-u="s"]', sec) };
    var live = qs('[data-live]', sec), timer = 0;
    if (!u.d) return;
    var tick = function () {
      var ms = isNaN(end) ? 0 : end - Date.now();
      if (ms <= 0) { ms = 0; clearInterval(timer); if (live) live.hidden = false; }
      var t = Math.floor(ms / 1000);
      u.d.textContent = pad(Math.floor(t / 86400)); u.h.textContent = pad(Math.floor(t % 86400 / 3600));
      u.m.textContent = pad(Math.floor(t % 3600 / 60)); u.s.textContent = pad(t % 60);
    };
    tick();
    timer = setInterval(tick, 1000);
    onStop(sec, function () { clearInterval(timer); });
  };

  /* ---------- Collection spotlight: the sticky panel follows the chapters ---------- */
  MH.inits['collection-spotlight'] = function (sec) {
    var chs = qsa('.mh-sp__ch', sec), steps = qs('[data-steps]', sec), now = qs('.mh-sp__now', sec);
    var num = qs('[data-numeral]', sec), title = qs('[data-ctitle]', sec), btns = [], active = -1;
    if (!chs.length || !steps) return;
    steps.innerHTML = '';
    var set = function (i) {
      if (i === active || i < 0) return; active = i;
      btns.forEach(function (b, k) { b.setAttribute('aria-current', String(k === i)); });
      if (num) num.textContent = chs[i].dataset.num;
      if (title) title.textContent = chs[i].dataset.title;
      if (now && !reduced()) { now.classList.remove('is-swap'); void now.offsetWidth; now.classList.add('is-swap'); }
    };
    chs.forEach(function (c) {
      var li = document.createElement('li'), b = document.createElement('button'), n = document.createElement('span'), t = document.createElement('span');
      b.type = 'button'; b.className = 'mh-sp__step'; n.textContent = c.dataset.num; t.textContent = c.dataset.title;
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
      onStop(sec, function () { io.disconnect(); });
    }
    set(0);
  };

  /* ---------- Atelier: figures count up once ---------- */
  MH.inits.atelier = function (sec) {
    var vals = qsa('[data-count]', sec);
    if (!vals.length || reduced() || window.Shopify && Shopify.designMode || !('IntersectionObserver' in window)) return;
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
    vals.forEach(function (v) { if (isNaN(parseInt(v.dataset.count, 10))) return; v.textContent = '0'; io.observe(v); });
    onStop(sec, function () { io.disconnect(); });
  };

  /* ---------- Lookbook: drag to scroll (mouse), native swipe on touch ---------- */
  MH.inits.lookbook = function (sec) {
    var track = qs('.mh-lb__track', sec), down = false, moved = false, sx = 0, sl = 0;
    if (!track) return;
    bindRail(sec, track, qs('[data-dir="-1"]', sec), qs('[data-dir="1"]', sec), qs('.mh-lb__bar span', sec));
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
  };

  /* ---------- Press: publication names act as tabs ---------- */
  MH.inits.press = function (sec) {
    var figs = qsa('.mh-pr__q', sec), list = qs('.mh-pr__names', sec), tabs = [];
    if (!figs.length || !list) return;
    list.innerHTML = '';
    var uid = 'pr' + Math.random().toString(36).slice(2, 7);
    var select = function (i, focus) {
      tabs.forEach(function (t, k) { var on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; figs[k].classList.toggle('is-active', on); });
      if (focus) tabs[i].focus();
    };
    figs.forEach(function (f, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mh-pr__name mh-pr__name--' + (f.dataset.style || 'a');
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
  };

  /* ---------- Newsletter: check the address, then the store's own form posts ---------- */
  MH.inits.newsletter = function (sec) {
    var form = qs('form', sec), input = qs('input[type=email]', sec), msg = qs('.mh-nl__msg', sec);
    if (!form || !input || !msg) return;
    form.addEventListener('submit', function (e) {
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      if (ok) return; // Shopify's customer form takes it from here
      e.preventDefault();
      msg.classList.add('is-error');
      input.setAttribute('aria-invalid', 'true');
      msg.textContent = msg.dataset.invalid || 'Please enter a valid email address.';
      input.focus();
    });
  };

  /* ---------- Boot ---------- */
  function boot(root) {
    var list = root.matches && root.matches('.mh[data-mh]') ? [root] : qsa('.mh[data-mh]', root || document);
    list.forEach(function (s) {
      if (s.dataset.ready) return;
      s.dataset.ready = '1';
      reveal(s);
      var fn = MH.inits[s.dataset.mh];
      if (fn) fn(s);
    });
  }
  function stop(root) { qsa('.mh[data-mh]', root).forEach(function (s) { (MH.stops.get(s) || []).forEach(function (f) { f(); }); MH.stops.delete(s); }); }
  MH.boot = boot;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(document); });
  else boot(document);
  document.addEventListener('shopify:section:load', function (e) { boot(e.target); });
  document.addEventListener('shopify:section:unload', function (e) { stop(e.target); });
})();
