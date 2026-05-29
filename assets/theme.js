/**
 * Maison Noir — Theme JavaScript
 * Global behaviors: scroll reveal, cart, wishlist, nav, search, quick view
 */
(function () {
  'use strict';

  /* ============================================================
     Scroll Reveal
     ============================================================ */
  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    els.forEach(el => observer.observe(el));
  }


  /* ============================================================
     Header — sticky + transparent
     ============================================================ */
  function initHeader() {
    const header = document.querySelector('.site-header');
    const bar    = document.querySelector('.announcement-bar');
    if (!header) return;

    // Push header below announcement bar
    function setHeaderOffset() {
      const barH = bar ? bar.offsetHeight : 0;
      header.style.top = barH + 'px';
    }
    setHeaderOffset();
    window.addEventListener('resize', setHeaderOffset);

    const isTransparent = header.dataset.transparent === 'true';

    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY > 60;
      header.classList.toggle('scrolled', scrolled);

      // Once user scrolls past announcement bar, snap header to top
      if (bar) {
        header.style.top = (scrolled || window.scrollY > bar.offsetHeight)
          ? '0'
          : bar.offsetHeight + 'px';
      }

      if (isTransparent) {
        header.style.background = scrolled
          ? 'rgba(10,10,10,0.97)'
          : 'linear-gradient(to bottom, rgba(10,10,10,0.95), transparent)';
      }
    }, { passive: true });
  }


  /* ============================================================
     Mobile Menu
     ============================================================ */
  function initMobileMenu() {
    const openBtns  = document.querySelectorAll('[data-open-mobile-menu]');
    const closeBtn  = document.querySelector('[data-close-mobile-menu]');
    const menu      = document.getElementById('mobile-menu');
    const overlay   = document.getElementById('mobile-menu-overlay');
    if (!menu) return;

    function open() {
      menu.classList.add('is-open');
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      menu.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    openBtns.forEach(btn => btn.addEventListener('click', open));
    closeBtn && closeBtn.addEventListener('click', close);
    overlay && overlay.addEventListener('click', close);

    // Submenus
    document.querySelectorAll('[data-toggle-submenu]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.toggleSubmenu);
        if (target) target.classList.toggle('is-open');
        const arrow = btn.querySelector('.submenu-arrow');
        if (arrow) arrow.classList.toggle('is-open');
      });
    });
  }


  /* ============================================================
     Search Overlay
     ============================================================ */
  function initSearch() {
    const overlay   = document.getElementById('search-overlay');
    const input     = overlay && overlay.querySelector('input');
    const openBtns  = document.querySelectorAll('[data-open-search]');
    const closeBtn  = document.querySelector('[data-close-search]');
    if (!overlay) return;

    function open() {
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => input && input.focus(), 100);
    }
    function close() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    openBtns.forEach(btn => btn.addEventListener('click', open));
    closeBtn && closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }


  /* ============================================================
     Cart Drawer
     ============================================================ */
  function initCartDrawer() {
    const drawer  = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (!drawer) return;

    function openCart() {
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeCart() {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-open-cart]').forEach(btn => btn.addEventListener('click', openCart));
    document.querySelectorAll('[data-close-cart]').forEach(btn => btn.addEventListener('click', closeCart));
    overlay && overlay.addEventListener('click', closeCart);

    // Qty controls in cart
    document.addEventListener('click', async e => {
      const qtyBtn = e.target.closest('.qty-btn');
      if (!qtyBtn) return;
      const key = qtyBtn.closest('[data-line-key]')?.dataset.lineKey;
      const val = qtyBtn.dataset.qty;
      if (!key || !val) return;
      await updateCartItem(key, parseInt(val));
    });

    // Remove item
    document.addEventListener('click', async e => {
      const removeBtn = e.target.closest('.cart-item__remove');
      if (!removeBtn) return;
      const key = removeBtn.closest('[data-line-key]')?.dataset.lineKey;
      if (!key) return;
      await updateCartItem(key, 0);
    });
  }

  async function updateCartItem(key, quantity) {
    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });
      const cart = await res.json();
      updateCartUI(cart);
    } catch (err) {
      console.error('Cart update failed', err);
    }
  }

  async function addToCart(variantId, quantity = 1, properties = {}) {
    // Open drawer immediately — don't wait for server
    document.getElementById('cart-drawer')?.classList.add('is-open');
    document.getElementById('cart-overlay')?.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity, properties })
    });
    if (!res.ok) throw new Error('add failed');
    const item = await res.json();

    // Background: refresh full cart state for count/shipping bar
    fetch('/cart.js')
      .then(r => r.json())
      .then(cart => updateCartUI(cart))
      .catch(() => {});

    showToast(window.theme_strings?.added_to_cart || 'Added to bag');
    return item;
  }

  function updateCartUI(cart) {
    // Update count badges
    document.querySelectorAll('.header-cart-count').forEach(el => {
      el.textContent = cart.item_count || '';
    });

    // Update subtotal
    const subtotalEl = document.querySelector('.cart-drawer__subtotal-price');
    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(cart.total_price);
    }

    // Update shipping bar
    const threshold = parseFloat(document.body.dataset.freeShippingThreshold || 500) * 100;
    if (threshold > 0) {
      const pct = Math.min((cart.total_price / threshold) * 100, 100);
      const fill = document.querySelector('.shipping-bar__fill');
      if (fill) fill.style.width = pct + '%';

      const msg = document.querySelector('.cart-drawer__shipping-bar span');
      if (msg) {
        if (pct >= 100) {
          msg.textContent = window.theme_strings?.free_shipping_achieved || "You've unlocked free shipping!";
        } else {
          const remaining = formatMoney(threshold - cart.total_price);
          msg.textContent = (window.theme_strings?.free_shipping_message || "You're {amount} away from free shipping").replace('{amount}', remaining);
        }
      }
    }
  }

  function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }


  /* ============================================================
     Add to Cart — product cards
     ============================================================ */
  function initCardAddToCart() {
    document.addEventListener('click', async e => {
      const addBtn = e.target.closest('.pcard-atc[data-variant-id]');
      if (!addBtn) return;
      const variantId = addBtn.dataset.variantId;
      if (!variantId) return;

      const originalText = addBtn.textContent.trim();
      addBtn.textContent = '…';
      addBtn.disabled = true;

      try {
        await addToCart(variantId);
        addBtn.textContent = '✓';
        setTimeout(() => {
          addBtn.textContent = originalText;
          addBtn.disabled = false;
        }, 1800);
      } catch {
        showToast('Could not add to bag. Please try again.');
        addBtn.textContent = originalText;
        addBtn.disabled = false;
      }
    });
  }


  /* ============================================================
     Quick View Modal — AJAX product JSON approach
     ============================================================ */
  function initQuickView() {
    const overlay = document.getElementById('quick-view-overlay');
    const modal   = document.getElementById('quick-view-modal');
    if (!overlay || !modal) return;

    function closeQV() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      modal.innerHTML = '';
    }

    overlay.addEventListener('click', e => { if (e.target === overlay) closeQV(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeQV(); });

    document.addEventListener('click', async e => {
      const btn = e.target.closest('[data-open-quickview]');
      if (!btn) return;

      const productUrl = btn.dataset.productUrl;
      if (!productUrl) return;

      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      modal.innerHTML = `
        <div class="qv-loading">
          <span class="qv-loading__dot"></span>
          <span class="qv-loading__dot"></span>
          <span class="qv-loading__dot"></span>
        </div>`;

      try {
        const res     = await fetch(productUrl + '.js');
        if (!res.ok) throw new Error('fetch failed');
        const product = await res.json();
        renderQV(product);
      } catch {
        modal.innerHTML = '<p class="qv-error">Could not load product — <a href="' + productUrl + '" style="color:var(--gold)">view full page</a></p>';
      }
    });

    function fmt(cents) {
      const currency = window.Shopify?.currency?.active || 'USD';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
    }

    function renderQV(p) {
      const allImages = p.images.map(src =>
        'https:' + src.replace(/^https?:/, '').replace(/(\.\w+)(\?.*)?$/, '_800x$1')
      );
      const mainSrc = allImages[0] || '';

      // Thumbnails
      const thumbs = allImages.slice(0, 8).map((src, i) => `
        <button class="qv-thumb ${i === 0 ? 'is-active' : ''}" data-qv-thumb="${src}">
          <img src="${src}" alt="" loading="lazy">
        </button>`).join('');

      // Variant options — group by option name
      let variantHtml = '';
      if (p.variants.length > 1) {
        variantHtml = p.options.map((optName, oi) => {
          const values = [...new Set(p.variants.map(v => v.options[oi]))];
          return `
            <div class="qv-option">
              <p class="qv-option__label">${optName}</p>
              <div class="qv-option__values">
                ${values.map(val => `
                  <button class="qv-opt-btn" data-opt-index="${oi}" data-opt-value="${val}">${val}</button>
                `).join('')}
              </div>
            </div>`;
        }).join('');
        variantHtml = `<div class="qv-variants">${variantHtml}</div>`;
      }

      const cPrice = fmt(p.price);
      const oPrice = p.compare_at_price > p.price ? fmt(p.compare_at_price) : '';
      const firstVariant = p.variants[0];

      modal.innerHTML = `
        <button class="qv-close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        <div class="qv-gallery">
          <div class="qv-gallery__main">
            ${mainSrc ? `<img src="${mainSrc}" class="qv-main-img" id="qv-main-img" alt="${p.title}">` : ''}
          </div>
          ${allImages.length > 1 ? `<div class="qv-gallery__thumbs">${thumbs}</div>` : ''}
        </div>

        <div class="qv-details">
          ${p.vendor ? `<p class="qv-vendor">${p.vendor}</p>` : ''}
          <h2 class="qv-title">${p.title}</h2>
          <div class="qv-price">
            <span class="qv-price__current" id="qv-price">${cPrice}</span>
            ${oPrice ? `<span class="qv-price__compare">${oPrice}</span>` : ''}
          </div>

          ${variantHtml}

          <button class="btn-primary qv-atc" id="qv-atc-btn"
            data-variant-id="${firstVariant ? firstVariant.id : ''}"
            ${firstVariant && !firstVariant.available ? 'disabled' : ''}>
            ${firstVariant && !firstVariant.available ? 'Sold Out' : 'Add to Cart'}
          </button>

          <a href="${p.url}" class="qv-view-full">View Full Details &rarr;</a>
        </div>`;

      // — Close
      modal.querySelector('.qv-close').addEventListener('click', closeQV);

      // — Gallery thumbnails
      const mainImg = modal.querySelector('#qv-main-img');
      modal.querySelectorAll('[data-qv-thumb]').forEach(thumb => {
        thumb.addEventListener('click', () => {
          if (mainImg) { mainImg.style.opacity = '0'; setTimeout(() => { mainImg.src = thumb.dataset.qvThumb; mainImg.style.opacity = '1'; }, 150); }
          modal.querySelectorAll('[data-qv-thumb]').forEach(t => t.classList.remove('is-active'));
          thumb.classList.add('is-active');
        });
      });

      // — Variant selection
      let selectedOpts = firstVariant ? [...firstVariant.options] : [];

      function syncVariant() {
        const variant = p.variants.find(v => v.options.every((o, i) => o === selectedOpts[i]));
        const atcBtn  = modal.querySelector('#qv-atc-btn');
        const priceEl = modal.querySelector('#qv-price');
        if (variant) {
          atcBtn.dataset.variantId = variant.id;
          atcBtn.disabled  = !variant.available;
          atcBtn.textContent = variant.available ? 'Add to Cart' : 'Sold Out';
          if (priceEl) priceEl.textContent = fmt(variant.price);
        } else {
          atcBtn.disabled = true;
          atcBtn.textContent = 'Unavailable';
        }
        modal.querySelectorAll('.qv-opt-btn').forEach(b => {
          b.classList.toggle('is-active', b.dataset.optValue === selectedOpts[parseInt(b.dataset.optIndex)]);
        });
      }

      modal.querySelectorAll('.qv-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedOpts[parseInt(btn.dataset.optIndex)] = btn.dataset.optValue;
          syncVariant();
        });
      });
      syncVariant();

      // — Add to cart from modal
      const atcBtn = modal.querySelector('#qv-atc-btn');
      if (atcBtn) {
        atcBtn.addEventListener('click', async () => {
          const variantId = parseInt(atcBtn.dataset.variantId);
          if (!variantId) return;
          const prev = atcBtn.textContent;
          atcBtn.textContent = 'Adding…';
          atcBtn.disabled = true;
          try {
            await addToCart(variantId, 1);
            atcBtn.textContent = '✓ Added';
            setTimeout(() => { atcBtn.textContent = prev; atcBtn.disabled = false; }, 2000);
          } catch {
            atcBtn.textContent = 'Error — try again';
            setTimeout(() => { atcBtn.textContent = prev; atcBtn.disabled = false; }, 2000);
          }
        });
      }
    }
  }


  /* ============================================================
     Wishlist (localStorage)
     ============================================================ */
  const WISHLIST_KEY = 'mn_wishlist';

  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; }
    catch { return []; }
  }

  function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  }

  function toggleWishlist(productId) {
    const list = getWishlist();
    const idx  = list.indexOf(productId);
    if (idx === -1) {
      list.push(productId);
      showToast(window.theme_strings?.wishlist_added || 'Added to wishlist');
    } else {
      list.splice(idx, 1);
      showToast(window.theme_strings?.wishlist_removed || 'Removed from wishlist');
    }
    saveWishlist(list);
    updateWishlistUI(productId);
    updateWishlistCount();
    return list.includes(productId);
  }

  function updateWishlistUI(productId) {
    const list = getWishlist();
    document.querySelectorAll(`[data-wishlist-id="${productId}"]`).forEach(btn => {
      btn.classList.toggle('is-active', list.includes(productId));
      btn.setAttribute('aria-pressed', list.includes(productId));
    });
  }

  function updateWishlistCount() {
    const count = getWishlist().length;
    document.querySelectorAll('.header-wishlist-count').forEach(el => {
      el.textContent = count || '';
    });
  }

  function initWishlist() {
    updateWishlistCount();

    // Mark already-wishlisted buttons on page load
    getWishlist().forEach(id => updateWishlistUI(id));

    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-wishlist-id]');
      if (!btn) return;
      const id = btn.dataset.wishlistId;
      toggleWishlist(id);
    });
  }


  /* ============================================================
     Filter Sidebar — collapsible groups
     ============================================================ */
  function initFilters() {
    document.querySelectorAll('.filter-group__title[data-toggle-filter]').forEach(title => {
      title.addEventListener('click', () => {
        title.classList.toggle('is-open');
        const body = title.nextElementSibling;
        if (body) body.classList.toggle('is-collapsed');
      });
    });

    // Chip toggle
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('is-active');
        // Dispatch event for filter logic
        document.dispatchEvent(new CustomEvent('mn:filter-change'));
      });
    });

    // Filter option toggle
    document.querySelectorAll('.filter-option[data-filter-value]').forEach(opt => {
      opt.addEventListener('click', () => {
        opt.classList.toggle('is-selected');
        const cb  = opt.querySelector('.filter-option__check');
        const svg = cb?.querySelector('svg');
        if (svg) svg.style.opacity = opt.classList.contains('is-selected') ? '1' : '0';
        document.dispatchEvent(new CustomEvent('mn:filter-change'));
      });
    });

    // Color swatch toggle
    document.querySelectorAll('.filter-swatch').forEach(s => {
      s.addEventListener('click', () => {
        s.classList.toggle('is-selected');
        document.dispatchEvent(new CustomEvent('mn:filter-change'));
      });
    });
  }


  /* ============================================================
     Collection View Toggle (grid columns)
     ============================================================ */
  function initViewToggle() {
    document.querySelectorAll('.view-btn[data-grid]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const grid = document.getElementById('product-grid');
        if (!grid) return;
        // Remove all grid-cols-* classes
        grid.className = grid.className.replace(/\bgrid-cols-\S+|\bgrid-list\b/g, '').trim();
        grid.classList.add(btn.dataset.grid);
        // Persist preference
        try { localStorage.setItem('mn_grid', btn.dataset.grid); } catch {}
      });
    });

    // Restore preference
    try {
      const saved = localStorage.getItem('mn_grid');
      if (saved) {
        const btn = document.querySelector(`.view-btn[data-grid="${saved}"]`);
        if (btn) btn.click();
      }
    } catch {}
  }


  /* ============================================================
     Season / Category Tabs
     ============================================================ */
  function initTabs() {
    document.querySelectorAll('.season-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const group = tab.closest('.season-tabs');
        group.querySelectorAll('.season-tab').forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
      });
    });
  }


  /* ============================================================
     Price Range Slider
     ============================================================ */
  function initPriceRange() {
    document.querySelectorAll('.price-range input[type="range"]').forEach(slider => {
      const output = document.getElementById(slider.dataset.output);
      function update() {
        if (output) output.textContent = '$' + Number(slider.value).toLocaleString();
      }
      slider.addEventListener('input', update);
      update();
    });
  }


  /* ============================================================
     Toast Notification
     ============================================================ */
  let toastTimer;
  function showToast(message) {
    let toast = document.getElementById('mn-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'mn-toast';
      toast.className = 'toast';
      toast.innerHTML = `
        <span class="toast__icon">
          <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <span class="toast__message"></span>
      `;
      document.body.appendChild(toast);
    }
    toast.querySelector('.toast__message').textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
  }

  // Expose globally for use in sections
  window.MaisonNoir = {
    addToCart,
    toggleWishlist,
    showToast,
    formatMoney,
    getWishlist
  };


  /* ============================================================
     Announcement Bar — rotating messages
     ============================================================ */
  function initAnnouncementRotation() {
    const bar = document.querySelector('.announcement-bar__rotating');
    if (!bar) return;
    const messages = bar.dataset.messages ? JSON.parse(bar.dataset.messages) : [];
    if (messages.length < 2) return;

    let current = 0;
    setInterval(() => {
      bar.style.opacity = '0';
      setTimeout(() => {
        current = (current + 1) % messages.length;
        bar.textContent = messages[current];
        bar.style.opacity = '1';
      }, 400);
    }, 4000);

    bar.style.transition = 'opacity 0.4s';
  }


  /* ============================================================
     Mega Menu hover — keyboard accessible
     ============================================================ */
  function initMegaMenu() {
    document.querySelectorAll('.has-megamenu').forEach(item => {
      const menu = item.querySelector('.mega-menu');
      if (!menu) return;

      item.addEventListener('focusin', () => item.classList.add('is-open'));
      item.addEventListener('focusout', e => {
        if (!item.contains(e.relatedTarget)) item.classList.remove('is-open');
      });
    });
  }


  /* ============================================================
     Init all
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initHeader();
    initMobileMenu();
    initSearch();
    initCartDrawer();
    initCardAddToCart();
    initQuickView();
    initWishlist();
    initFilters();
    initViewToggle();
    initTabs();
    initPriceRange();
    initAnnouncementRotation();
    initMegaMenu();
  });

})();
