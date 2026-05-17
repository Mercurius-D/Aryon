/* ============================================================
   ARYON PRIVATE — Navigation
   Depends on nav.css for all visual states.
   Exposes window.navGoTo(pageId) — calls window.showPage().
   ============================================================ */

(function () {
  'use strict';

  const navBar               = document.getElementById('navBar');
  const menuTrigger          = document.getElementById('menuTrigger');
  const navOverlay           = document.getElementById('navOverlay');
  const overlayCurtain       = document.getElementById('overlayCurtain');
  const overlayBackdropClose = document.getElementById('overlayBackdropClose');
  const triggerLabel         = document.getElementById('triggerLabel');

  if (!navBar || !menuTrigger || !navOverlay) return;

  let isOpen        = false;
  let isAnimating   = false;
  let lastFocusedEl = null;

  const OPEN_DURATION  = 800;
  const CLOSE_DURATION = 500;

  /* ── Scroll ── */
  function onScroll() {
    navBar.classList.toggle('scrolled', window.scrollY > 80 && !isOpen);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Open ── */
  function openMenu() {
    if (isOpen || isAnimating) return;
    isAnimating   = true;
    isOpen        = true;
    lastFocusedEl = document.activeElement;

    navOverlay.classList.remove('closing');
    navOverlay.classList.add('open');
    navBar.classList.add('menu-open');
    navBar.classList.remove('scrolled');
    document.body.classList.add('nav-open');

    menuTrigger.setAttribute('aria-expanded', 'true');
    navOverlay.setAttribute('aria-hidden', 'false');

    setTriggerLabel('CLOSE');

    setTimeout(() => {
      isAnimating = false;
      trapFocus();
    }, OPEN_DURATION);
  }

  /* ── Close ── */
  function closeMenu() {
    if (!isOpen || isAnimating) return;
    isAnimating = true;
    isOpen      = false;

    navOverlay.classList.add('closing');

    setTimeout(() => {
      navOverlay.classList.remove('open', 'closing');
      navBar.classList.remove('menu-open');
      document.body.classList.remove('nav-open');

      menuTrigger.setAttribute('aria-expanded', 'false');
      navOverlay.setAttribute('aria-hidden', 'true');

      onScroll();
      setTriggerLabel('MENU');

      if (lastFocusedEl) lastFocusedEl.focus();
      isAnimating = false;
    }, CLOSE_DURATION);
  }

  /* ── Toggle ── */
  function toggleMenu() {
    isOpen ? closeMenu() : openMenu();
  }

  /* ── Label swap (letter-by-letter) ── */
  function setTriggerLabel(word) {
    if (!triggerLabel) return;
    triggerLabel.innerHTML = word
      .split('')
      .map((ch, i) => `<span class="trigger-char" style="--i:${i}">${ch}</span>`)
      .join('');
  }

  /* ── Focus trap ── */
  function trapFocus() {
    const focusable = navOverlay.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    first.focus();

    navOverlay._trapHandler = function (e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    };
    navOverlay.addEventListener('keydown', navOverlay._trapHandler);
  }

  function releaseFocusTrap() {
    if (navOverlay._trapHandler) {
      navOverlay.removeEventListener('keydown', navOverlay._trapHandler);
      navOverlay._trapHandler = null;
    }
  }

  /* ── Public API ── */
  window.navGoTo = function (pageId) {
    closeMenu();
    /* +60 ms buffer lets the closing CSS animation fully settle before page swap */
    setTimeout(() => {
      if (typeof window.showPage === 'function') window.showPage(pageId);
    }, CLOSE_DURATION + 60);
  };

  /* ── Events ── */
  menuTrigger.addEventListener('click', toggleMenu);

  if (overlayBackdropClose) {
    overlayBackdropClose.addEventListener('click', closeMenu);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });

  navOverlay.addEventListener('transitionend', function (e) {
    if (!isOpen && e.target === overlayCurtain) releaseFocusTrap();
  });

  /* ── Cursor integration ── */
  function refreshCursorListeners() {
    navOverlay.querySelectorAll('a, button').forEach(function (el) {
      if (el.dataset.cursorInit) return;
      el.dataset.cursorInit = '1';
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  document.addEventListener('DOMContentLoaded', refreshCursorListeners);
  menuTrigger.addEventListener('click', function () {
    if (!isOpen) setTimeout(refreshCursorListeners, 50);
  });

  /* ── Initial ARIA state ── */
  navOverlay.setAttribute('aria-hidden', 'true');
  menuTrigger.setAttribute('aria-expanded', 'false');

})();
