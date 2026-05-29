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
    // Optimistic remove: immediately hide the item, skip re-rendering it from server
    let skipItemRender = false;
    if (quantity === 0) {
      const el = document.querySelector(`[data-line-key="${key}"]`);
      if (el) {
        el.style.transition = 'opacity 0.18s, transform 0.18s';
        el.style.opacity = '0';
        el.style.transform = 'translateX(28px)';
        el.style.pointerEvents = 'none';
        skipItemRender = true;
        // Remove from DOM after animation, regardless of server response
        setTimeout(() => { if (el.parentNode) el.remove(); }, 200);
      }
    }

    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });
      const cart = await res.json();

      if (skipItemRender) {
        // Always update shipping bar, subtotal and count badge immediately
        updateCartCounters(cart);
        // If cart is now empty, show empty state after the fade animation finishes
        const remaining = (cart.items || []).filter(i => i.quantity > 0);
        if (remaining.length === 0) {
          setTimeout(() => renderCartItems(cart), 210);
        }
      } else {
        updateCartUI(cart);
      }
    } catch (err) {
      console.error('Cart update failed', err);
    }
  }

  async function addToCart(variantId, quantity = 1, properties = {}) {
    // 1. Loading state on the ATC button
    const btn = document.querySelector(`.pcard-btn--atc[data-variant-id="${variantId}"]`) ||
                document.querySelector('button.qv-atc');
    if (btn) {
      btn._origHTML = btn.innerHTML;
      btn.innerHTML = '<span class="cart-spinner"></span>';
      btn.disabled = true;
    }

    // 2. Open drawer with spinner immediately
    const body = document.getElementById('cart-drawer-items');
    if (body) body.innerHTML = '<div class="cart-loading"><span class="cart-spinner"></span></div>';
    document.getElementById('cart-drawer')?.classList.add('is-open');
    document.getElementById('cart-overlay')?.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    try {
      // 3. Add item
      const addRes = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity, properties })
      });
      if (!addRes.ok) {
        const errData = await addRes.json().catch(() => ({}));
        throw new Error(errData.description || 'Could not add to bag');
      }
      const addedItem = await addRes.json();

      // 4. Show the added item immediately from the add.js response (faster feedback)
      if (body && addedItem) {
        const imgHtml = addedItem.featured_image?.url
          ? `<img src="${addedItem.featured_image.url}" loading="eager" alt="">`
          : (addedItem.image ? `<img src="${addedItem.image}" loading="eager" alt="">` : '');
        body.innerHTML = `
          <div class="cart-item" data-line-key="${addedItem.key}">
            <a href="${addedItem.url}" class="cart-item__image">${imgHtml}</a>
            <div class="cart-item__details">
              <p class="cart-item__brand">${addedItem.vendor || ''}</p>
              <a href="${addedItem.url}" class="cart-item__title">${addedItem.product_title}</a>
              ${addedItem.variant_title && addedItem.variant_title !== 'Default Title' ? `<p class="cart-item__variant">${addedItem.variant_title}</p>` : ''}
              <div class="cart-item__bottom">
                <span class="cart-item__price">${formatMoney(addedItem.final_price)}</span>
              </div>
            </div>
          </div>
          <div class="cart-loading" style="height:40px"><span class="cart-spinner" style="width:14px;height:14px;border-width:1.5px"></span></div>`;
        document.querySelector('.cart-drawer__footer')?.style.setProperty('display', 'block');
      }

      // 5. Fetch full cart in background to reconcile all items and totals
      const cart = await fetch('/cart.js').then(r => r.json());
      updateCartUI(cart);
      showToast(window.theme_strings?.added_to_cart || 'Added to bag');
    } catch (err) {
      console.error('Add to cart failed:', err);
      if (body) body.innerHTML = `<div class="cart-error">${err.message || 'Something went wrong. Please try again.'}</div>`;
    } finally {
      if (btn && btn._origHTML !== undefined) {
        btn.innerHTML = btn._origHTML;
        btn.disabled = false;
        delete btn._origHTML;
      }
    }
  }

  function renderCartItems(cart) {
    const body = document.getElementById('cart-drawer-items');
    if (!body) return;

    const footer = document.querySelector('.cart-drawer__footer');

    if (!cart.items || cart.items.length === 0) {
      body.innerHTML = `
        <div class="cart-drawer__empty">
          <div class="cart-drawer__empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <h3 class="cart-drawer__empty-title">${window.theme_strings?.cart_empty || 'Your bag is empty'}</h3>
          <a href="/collections/all" class="btn btn-ghost btn-sm">${window.theme_strings?.continue_shopping || 'Continue Shopping'}</a>
        </div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';

    // Filter out any zero-qty items (Shopify occasionally returns them during transition)
    const items = cart.items.filter(item => item.quantity > 0);

    body.innerHTML = items.map(item => {
      const variantLine = item.variant_title && item.variant_title !== 'Default Title'
        ? `<p class="cart-item__variant">${item.variant_title}</p>` : '';
      const imgHtml = item.featured_image?.url
        ? `<img src="${item.featured_image.url}" loading="lazy" alt="${(item.product_title || '').replace(/"/g, '&quot;')}">`
        : '';
      const qtyMinus = Math.max(0, item.quantity - 1);
      const qtyPlus = item.quantity + 1;
      return `
        <div class="cart-item" data-line-key="${item.key}">
          <a href="${item.url}" class="cart-item__image">${imgHtml}</a>
          <div class="cart-item__details">
            <p class="cart-item__brand">${item.vendor || ''}</p>
            <a href="${item.url}" class="cart-item__title">${item.product_title}</a>
            ${variantLine}
            <div class="cart-item__qty">
              <button class="qty-btn" data-qty="${qtyMinus}" aria-label="Decrease quantity">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" data-qty="${qtyPlus}" aria-label="Increase quantity">+</button>
            </div>
            <div class="cart-item__bottom">
              <span class="cart-item__price">${formatMoney(item.final_line_price)}</span>
              <button class="cart-item__remove" data-qty="0" aria-label="Remove" title="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function updateCartCounters(cart) {
    document.querySelectorAll('.header-cart-count').forEach(el => {
      el.textContent = cart.item_count || '';
    });
    const countEl = document.querySelector('.cart-drawer__count');
    if (countEl) {
      countEl.textContent = cart.item_count === 1 ? '1 item' : `${cart.item_count || 0} items`;
    }
    const subtotalEl = document.querySelector('.cart-drawer__subtotal-price');
    if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);

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
          const template = window.theme_strings?.free_shipping_message || "You're %{amount} away from free shipping";
          // Use innerHTML so HTML entities from Liquid json filter render as real characters
          msg.innerHTML = template.replace('%{amount}', `<strong>${remaining}</strong>`);
        }
      }
    }
  }

  function updateCartUI(cart) {
    renderCartItems(cart);
    updateCartCounters(cart);
  }

  function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }


  /* ============================================================
     Add to Cart — product cards
     ============================================================ */
  function initCardAddToCart() {
    document.addEventListener('click', async e => {
      const addBtn = e.target.closest('.pcard-btn--atc[data-variant-id]');
      if (!addBtn) return;
      const variantId = addBtn.dataset.variantId;
      if (!variantId) return;

      const label = addBtn.querySelector('.pcard-btn__label');
      const originalLabel = label ? label.textContent : '';
      if (label) label.textContent = '…';
      addBtn.disabled = true;

      try {
        await addToCart(variantId);
        if (label) label.textContent = '✓';
        setTimeout(() => {
          if (label) label.textContent = originalLabel;
          addBtn.disabled = false;
        }, 1800);
      } catch {
        showToast('Could not add to bag. Please try again.');
        if (label) label.textContent = originalLabel;
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

      // Try embedded JSON first (works with password-protected stores, faster)
      const card = btn.closest('.product-card');
      const jsonScript = card && card.querySelector('.product-card__json');
      if (jsonScript) {
        try {
          const product = JSON.parse(jsonScript.textContent);
          renderQV(product, productUrl, closeQV);
          return;
        } catch (_) {
          // fall through to fetch
        }
      }

      // Fallback: AJAX fetch (works when store is public)
      modal.innerHTML = `
        <div class="qv-loading">
          <span class="qv-loading__dot"></span>
          <span class="qv-loading__dot"></span>
          <span class="qv-loading__dot"></span>
        </div>`;

      try {
        const res = await fetch(productUrl + '.js');
        if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Store appears to be password protected. Log in to Shopify admin and preview the theme from there.');
        }
        const product = await res.json();
        renderQV(product, productUrl, closeQV);
      } catch (err) {
        modal.innerHTML = `
          <div class="qv-error">
            <p style="margin-bottom:16px;">Unable to load product preview.</p>
            <p style="font-size:11px;opacity:0.5;margin-bottom:24px;">${err.message}</p>
            <a href="${productUrl}" class="btn-primary" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 32px;">View Product Page</a>
          </div>`;
      }
    });

    function fmt(cents) {
      const currency = window.Shopify?.currency?.active || 'USD';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
    }

    function isColorOption(name) {
      return /^colou?r$/i.test(name.trim());
    }
    function isSizeOption(name) {
      return /^size$/i.test(name.trim());
    }

    function renderOption(optName, oi, values) {
      if (isColorOption(optName)) {
        const swatches = values.map(val => {
          const css = val.toLowerCase().replace(/\s+/g, '');
          return `<button class="qv-swatch-btn" data-opt-index="${oi}" data-opt-value="${val}"
            title="${val}"
            style="background-color:${css};"
          ></button>`;
        }).join('');
        return `
          <div class="qv-option">
            <p class="qv-option__label">${optName}: <span class="qv-opt-selected" data-opt-sel="${oi}"></span></p>
            <div class="qv-option__values qv-option__values--swatches">${swatches}</div>
          </div>`;
      }
      if (isSizeOption(optName)) {
        const btns = values.map(val =>
          `<button class="qv-opt-btn qv-opt-btn--size" data-opt-index="${oi}" data-opt-value="${val}">${val}</button>`
        ).join('');
        return `
          <div class="qv-option">
            <p class="qv-option__label">${optName}: <span class="qv-opt-selected" data-opt-sel="${oi}"></span></p>
            <div class="qv-option__values">${btns}</div>
          </div>`;
      }
      const btns = values.map(val =>
        `<button class="qv-opt-btn" data-opt-index="${oi}" data-opt-value="${val}">${val}</button>`
      ).join('');
      return `
        <div class="qv-option">
          <p class="qv-option__label">${optName}: <span class="qv-opt-selected" data-opt-sel="${oi}"></span></p>
          <div class="qv-option__values">${btns}</div>
        </div>`;
    }

    function renderQV(p, productUrl, closeQV) {
      // Image URLs — Shopify CDN format
      const allImages = p.images.map(src =>
        'https:' + src.replace(/^https?:/, '').replace(/(\.\w+)(\?.*)?$/, '_800x$1')
      );
      const mainSrc = allImages[0] || '';

      // Thumbnails
      const thumbsHtml = allImages.slice(0, 8).map((src, i) => `
        <button class="qv-thumb ${i === 0 ? 'is-active' : ''}" data-qv-thumb="${src}">
          <img src="${src}" alt="" loading="lazy">
        </button>`).join('');

      // Variant options
      let variantHtml = '';
      if (p.options && p.options.length > 0 && !(p.options.length === 1 && p.options[0] === 'Title')) {
        const optionsHtml = p.options.map((optName, oi) => {
          const values = [...new Set(p.variants.map(v => v.options[oi]))];
          return renderOption(optName, oi, values);
        }).join('');
        variantHtml = `<div class="qv-variants">${optionsHtml}</div>`;
      }

      const firstVariant = p.variants[0];
      const cPrice = fmt(p.price);
      const oPrice = p.compare_at_price > p.price ? fmt(p.compare_at_price) : '';

      // Description — strip to first 280 chars for quick view
      let descHtml = '';
      if (p.body_html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = p.body_html;
        const text = tmp.textContent.trim();
        if (text) {
          const short = text.length > 280 ? text.slice(0, 280).trimEnd() + '…' : text;
          descHtml = `<p class="qv-description">${short}</p>`;
        }
      }

      modal.innerHTML = `
        <button class="qv-close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        <div class="qv-gallery">
          <div class="qv-gallery__main">
            ${mainSrc ? `<img src="${mainSrc}" class="qv-main-img" id="qv-main-img" alt="${p.title}">` : '<div class="qv-img-placeholder"></div>'}
          </div>
          ${allImages.length > 1 ? `<div class="qv-gallery__thumbs">${thumbsHtml}</div>` : ''}
        </div>

        <div class="qv-details">
          ${p.vendor ? `<p class="qv-vendor">${p.vendor}</p>` : ''}
          <h2 class="qv-title">${p.title}</h2>
          <div class="qv-price">
            <span class="qv-price__current" id="qv-price">${cPrice}</span>
            ${oPrice ? `<span class="qv-price__compare">${oPrice}</span>` : ''}
          </div>

          ${variantHtml}

          ${descHtml}

          <button class="btn-primary qv-atc" id="qv-atc-btn"
            data-variant-id="${firstVariant ? firstVariant.id : ''}"
            ${firstVariant && !firstVariant.available ? 'disabled' : ''}>
            ${firstVariant && !firstVariant.available ? 'Sold Out' : 'Add to Bag'}
          </button>

          <a href="${productUrl}" class="qv-view-full">View Full Details &rarr;</a>
        </div>`;

      // Close button
      modal.querySelector('.qv-close').addEventListener('click', closeQV);

      // Gallery thumbnails
      const mainImg = modal.querySelector('#qv-main-img');
      modal.querySelectorAll('[data-qv-thumb]').forEach(thumb => {
        thumb.addEventListener('click', () => {
          if (mainImg) {
            mainImg.style.opacity = '0';
            setTimeout(() => { mainImg.src = thumb.dataset.qvThumb; mainImg.style.opacity = '1'; }, 150);
          }
          modal.querySelectorAll('[data-qv-thumb]').forEach(t => t.classList.remove('is-active'));
          thumb.classList.add('is-active');
        });
      });

      // Variant selection state
      let selectedOpts = firstVariant ? [...firstVariant.options] : [];

      function syncVariant() {
        const variant = p.variants.find(v => v.options.every((o, i) => o === selectedOpts[i]));
        const atcBtn  = modal.querySelector('#qv-atc-btn');
        const priceEl = modal.querySelector('#qv-price');

        if (variant) {
          atcBtn.dataset.variantId = variant.id;
          atcBtn.disabled = !variant.available;
          atcBtn.textContent = variant.available ? 'Add to Bag' : 'Sold Out';
          if (priceEl) priceEl.textContent = fmt(variant.price);
        } else {
          atcBtn.disabled = true;
          atcBtn.textContent = 'Unavailable';
        }

        // Highlight selected option buttons
        modal.querySelectorAll('[data-opt-index]').forEach(b => {
          const oi = parseInt(b.dataset.optIndex);
          b.classList.toggle('is-active', b.dataset.optValue === selectedOpts[oi]);
        });

        // Update selected value labels
        modal.querySelectorAll('[data-opt-sel]').forEach(label => {
          const oi = parseInt(label.dataset.optSel);
          label.textContent = selectedOpts[oi] || '';
        });
      }

      modal.querySelectorAll('[data-opt-index]').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedOpts[parseInt(btn.dataset.optIndex)] = btn.dataset.optValue;
          syncVariant();
        });
      });
      syncVariant();

      // ATC from modal
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
