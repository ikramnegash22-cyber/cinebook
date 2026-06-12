/**
 * CineBook – app.js
 * Core application logic: auth, theme, font size, shared utilities
 */

'use strict';

/* ============================================================
   DATA LOADING – verwendet eingebettete Daten aus data.js
   (funktioniert ohne Server direkt per file://)
   ============================================================ */

function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/admin/') || path.includes('/clerk/')) return '../';
  return '';
}

const BASE = getBasePath();

async function getMovies() {
  if (typeof MOVIES_DATA !== 'undefined') return JSON.parse(JSON.stringify(MOVIES_DATA));
  try {
    const res = await fetch(BASE + 'data/movies.json');
    return await res.json();
  } catch(e) { return []; }
}

async function getShowtimes() {
  if (typeof SHOWTIMES_DATA !== 'undefined') return JSON.parse(JSON.stringify(SHOWTIMES_DATA));
  try {
    const res = await fetch(BASE + 'data/showtimes.json');
    return await res.json();
  } catch(e) { return []; }
}

async function getUsers() {
  if (typeof USERS_DATA !== 'undefined') return JSON.parse(JSON.stringify(USERS_DATA));
  try {
    const res = await fetch(BASE + 'data/users.json');
    return await res.json();
  } catch(e) { return []; }
}

/* ============================================================
   AUTH
   ============================================================ */
const Auth = {
  STORAGE_KEY: 'cinebook_user',

  login(username, password, users) {
    const user = users.find(u => u.username === username && u.password === password && u.active);
    if (user) {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    window.location.href = BASE + 'index.html';
  },

  getCurrentUser() {
    const data = sessionStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  requireRole(role) {
    const user = this.getCurrentUser();
    if (!user || (role && user.role !== role && !(role === 'clerk' && user.role === 'admin'))) {
      alert('Zugriff verweigert. Bitte melden Sie sich an.');
      window.location.href = BASE + 'index.html';
      return false;
    }
    return true;
  }
};

/* ============================================================
   THEME
   ============================================================ */
const Theme = {
  STORAGE_KEY: 'cinebook_theme',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'light';
    this.apply(saved);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
      this.updateBtn(btn, saved);
    }
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  },

  toggle() {
    const current = localStorage.getItem(this.STORAGE_KEY) || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    this.apply(next);
    const btn = document.getElementById('themeToggle');
    if (btn) this.updateBtn(btn, next);
  },

  updateBtn(btn, theme) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren');
  }
};

/* ============================================================
   FONT SIZE
   ============================================================ */
const FontSize = {
  STORAGE_KEY: 'cinebook_fontsize',
  sizes: ['normal', 'large', 'xlarge'],

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'normal';
    this.apply(saved);
    const btn = document.getElementById('fontIncrease');
    if (btn) btn.addEventListener('click', () => this.cycle());
  },

  apply(size) {
    document.body.classList.remove('font-large', 'font-xlarge');
    if (size === 'large') document.body.classList.add('font-large');
    if (size === 'xlarge') document.body.classList.add('font-xlarge');
    localStorage.setItem(this.STORAGE_KEY, size);
  },

  cycle() {
    const current = localStorage.getItem(this.STORAGE_KEY) || 'normal';
    const idx = this.sizes.indexOf(current);
    const next = this.sizes[(idx + 1) % this.sizes.length];
    this.apply(next);
  }
};

/* ============================================================
   LOGIN MODAL
   ============================================================ */
async function initLoginModal() {
  const modal = document.getElementById('loginModal');
  const loginBtn = document.getElementById('loginBtn');
  const closeBtn = document.getElementById('closeModal');
  const overlay = document.getElementById('modalOverlay');
  const form = document.getElementById('loginForm');
  const errorDiv = document.getElementById('loginError');
  const loggedInDiv = document.getElementById('loggedInUser');
  const greetingSpan = document.getElementById('userGreeting');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!modal) return;

  function openModal() {
    modal.classList.remove('hidden');
    document.getElementById('loginUsername').focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (form) form.reset();
    if (errorDiv) errorDiv.classList.add('hidden');
  }

  // Update UI based on auth state
  function updateAuthUI() {
    const user = Auth.getCurrentUser();
    if (user) {
      loginBtn && loginBtn.classList.add('hidden');
      loggedInDiv && loggedInDiv.classList.remove('hidden');
      if (greetingSpan) greetingSpan.textContent = `👋 ${user.firstName}`;
    } else {
      loginBtn && loginBtn.classList.remove('hidden');
      loggedInDiv && loggedInDiv.classList.add('hidden');
    }
  }

  updateAuthUI();

  if (loginBtn) loginBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      if (errorDiv) errorDiv.classList.add('hidden');

      const users = await getUsers();
      const user = Auth.login(username, password, users);
      if (user) {
        closeModal();
        updateAuthUI();
        // Redirect admin/clerk to their dashboard
        if (user.role === 'admin') {
          window.location.href = BASE + 'admin/dashboard.html';
        } else if (user.role === 'clerk') {
          window.location.href = BASE + 'clerk/dashboard.html';
        }
      } else {
        if (errorDiv) {
          errorDiv.textContent = 'Ungültiger Benutzername oder Passwort.';
          errorDiv.classList.remove('hidden');
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => Auth.logout());
  }
}

/* ============================================================
   UTILITIES
   ============================================================ */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function formatPrice(amount) {
  return amount.toFixed(2).replace('.', ',') + ' €';
}

function generateBookingId() {
  return 'BK-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function getURLParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function showToast(message, type = 'info', duration = 3000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: ${type === 'success' ? '#28a745' : type === 'danger' ? '#dc3545' : '#333'};
    color: #fff; padding: 12px 20px; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 0.875rem;
    max-width: 320px; animation: fadeInUp 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ============================================================
   BOOKING STORAGE (localStorage)
   ============================================================ */
const BookingStorage = {
  KEY: 'cinebook_bookings',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || '[]');
    } catch { return []; }
  },

  save(booking) {
    const all = this.getAll();
    all.push(booking);
    localStorage.setItem(this.KEY, JSON.stringify(all));
  },

  cancel(bookingId) {
    const all = this.getAll().map(b =>
      b.bookingId === bookingId ? { ...b, status: 'cancelled' } : b
    );
    localStorage.setItem(this.KEY, JSON.stringify(all));
  }
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  FontSize.init();
  initLoginModal();

  // Date display in admin
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('de-DE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }
});
