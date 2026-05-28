/**
 * Custom Cursor — Maison Noir
 * Gold dot + lagging ring cursor
 */
(function () {
  'use strict';

  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  if (!cursor || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  // Apply cursor style variant from data attribute
  const style = document.body.dataset.cursorStyle || 'dot_ring';
  if (style === 'dot_only') ring.style.display = 'none';

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  // Ring follows with lag
  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover expand on interactive elements
  const interactives = 'a, button, [role="button"], input, select, textarea, label, .product-card, .category-card, .filter-chip, .season-tab, .swatch, .act-btn';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactives)) {
      cursor.classList.add('is-hovering');
      ring.classList.add('is-hovering');
    }
  });

  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactives)) {
      cursor.classList.remove('is-hovering');
      ring.classList.remove('is-hovering');
    }
  });

  // Click shrink
  document.addEventListener('mousedown', () => cursor.classList.add('is-clicking'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('is-clicking'));

  // Hide on touch devices
  document.addEventListener('touchstart', () => {
    cursor.style.display = 'none';
    ring.style.display   = 'none';
  }, { once: true });
})();
