/**
 * CineBook – accessibility.js
 * Keyboard navigation enhancements, ARIA updates, focus management
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── Hamburger Menu ─────────────────────────────────────────
  const hamburger = document.getElementById('hamburgerBtn');
  const mainNav = document.getElementById('mainNav');
  const navOverlay = document.getElementById('navOverlay');

  function openMenu() {
    if (!hamburger || !mainNav) return;
    mainNav.classList.add('is-open');
    hamburger.classList.add('is-active');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Menue schliessen');
    if (navOverlay) navOverlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!hamburger || !mainNav) return;
    mainNav.classList.remove('is-open');
    hamburger.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Menue oeffnen');
    if (navOverlay) navOverlay.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      if (mainNav.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
  }

  if (navOverlay) {
    navOverlay.addEventListener('click', closeMenu);
  }

  // Close menu when a nav link is clicked
  if (mainNav) {
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav && mainNav.classList.contains('is-open')) {
      closeMenu();
      hamburger.focus();
    }
  });

  // ── Keyboard navigation for seat map ──────────────────────
  document.addEventListener('keydown', (e) => {
    const focused = document.activeElement;
    if (!focused || !focused.classList.contains('seat')) return;

    const row = focused.closest('.seat-row');
    if (!row) return;
    const seats = Array.from(row.querySelectorAll('.seat:not([disabled])'));
    const allRows = Array.from(document.querySelectorAll('.seat-row'));
    const idx = seats.indexOf(focused);
    const rowIdx = allRows.indexOf(row);

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (idx < seats.length - 1) seats[idx + 1].focus();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (idx > 0) seats[idx - 1].focus();
        break;
      case 'ArrowDown': {
        e.preventDefault();
        if (rowIdx < allRows.length - 1) {
          const nextSeats = allRows[rowIdx + 1].querySelectorAll('.seat:not([disabled])');
          if (nextSeats[idx]) nextSeats[idx].focus();
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (rowIdx > 0) {
          const prevSeats = allRows[rowIdx - 1].querySelectorAll('.seat:not([disabled])');
          if (prevSeats[idx]) prevSeats[idx].focus();
        }
        break;
      }
    }
  });

  // ── Focus trap in modals ───────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const openModal = document.querySelector('.modal:not(.hidden)');
    if (!openModal) return;

    const focusable = openModal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // ── Announce dynamic content changes ──────────────────────
  function announceChange(message) {
    let liveRegion = document.getElementById('a11y-live');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'a11y-live';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = '';
    setTimeout(() => { liveRegion.textContent = message; }, 50);
  }

  // Expose globally
  window.announceChange = announceChange;

  // ── High contrast toggle (optional button #highContrastToggle) ──
  const hcBtn = document.getElementById('highContrastToggle');
  if (hcBtn) {
    const hcKey = 'cinebook_highcontrast';
    const saved = localStorage.getItem(hcKey) === 'true';
    if (saved) document.body.classList.add('high-contrast');

    hcBtn.addEventListener('click', () => {
      const active = document.body.classList.toggle('high-contrast');
      localStorage.setItem(hcKey, active);
      announceChange(active ? 'Hoher Kontrast aktiviert' : 'Hoher Kontrast deaktiviert');
    });
  }

  // ── Smooth scroll for anchor links ────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        target.focus({ preventScroll: true });
      }
    });
  });

});