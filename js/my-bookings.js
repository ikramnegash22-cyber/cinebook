'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var user = Auth.getCurrentUser();
  if (user === null || user === undefined) {
    document.getElementById('loginPrompt').classList.remove('hidden');
    document.getElementById('bookingsArea').classList.add('hidden');
    setupGuestArea();
  } else {
    document.getElementById('loginPrompt').classList.add('hidden');
    document.getElementById('bookingsArea').classList.remove('hidden');
    initMyBookings(user);
  }
});

function setupGuestArea() {
  var loginPromptBtn = document.getElementById('loginPromptBtn');
  if (loginPromptBtn) {
    loginPromptBtn.addEventListener('click', function() {
      var lb = document.getElementById('loginBtn');
      if (lb) lb.click();
    });
  }
  var guestToggle = document.getElementById('guestToggle');
  if (guestToggle) {
    guestToggle.addEventListener('click', function(e) {
      e.preventDefault();
      var box = document.getElementById('guestSearchBox');
      box.classList.toggle('hidden');
      if (box.classList.contains('hidden') === false) {
        var gb = document.getElementById('guestBookingId');
        if (gb) gb.focus();
      }
    });
  }
  var guestLookupBtn = document.getElementById('guestLookupBtn');
  if (guestLookupBtn) guestLookupBtn.addEventListener('click', guestLookup);
  var guestBookingId = document.getElementById('guestBookingId');
  if (guestBookingId) {
    guestBookingId.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') guestLookup();
    });
  }
}

function guestLookup() {
  var idEl = document.getElementById('guestBookingId');
  var id = idEl ? idEl.value.trim().toUpperCase() : '';
  var result = document.getElementById('guestLookupResult');
  if (!result) return;
  if (!id) { showToast('Bitte eine Buchungs-ID eingeben.', 'danger'); return; }
  var all = BookingStorage.getAll();
  var booking = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].bookingId === id) { booking = all[i]; break; }
  }
  result.classList.remove('hidden');
  if (!booking) {
    result.innerHTML = '<p style="color:var(--color-danger);padding:8px">Buchung nicht gefunden.</p>';
    return;
  }
  var statusColor = booking.status === 'confirmed' ? '#28a745' : '#dc3545';
  var statusLabel = booking.status === 'confirmed' ? 'Bestaetigt' : 'Storniert';
  result.innerHTML = '<div style="background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:8px;padding:16px;font-size:.875rem">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    + '<strong>' + escapeHtml(booking.bookingId) + '</strong>'
    + '<span style="background:' + statusColor + ';color:#fff;padding:2px 8px;border-radius:20px;font-size:.75rem">' + statusLabel + '</span></div>'
    + '<b>' + escapeHtml(booking.movieTitle) + '</b><br>'
    + '<span style="color:var(--color-text-muted)">' + formatDateShort(booking.date) + ' | ' + booking.time + ' Uhr | ' + escapeHtml(booking.hall || '') + '</span><br>'
    + 'Sitze: ' + (booking.seats || []).join(', ') + '<br>'
    + '<strong style="color:var(--color-primary)">' + formatPrice(booking.totalPrice) + '</strong></div>';
}

function initMyBookings(user) {
  var all = BookingStorage.getAll();
  var myBookings = all.filter(function(b) {
    return (user.id && b.userId === user.id) || (user.email && b.userEmail === user.email);
  });
  renderStats(myBookings);
  var sf = document.getElementById('statusFilter');
  var so = document.getElementById('sortFilter');
  function run() {
    var list = myBookings.slice();
    var status = sf ? sf.value : '';
    var sort = so ? so.value : 'newest';
    if (status) list = list.filter(function(b) { return b.status === status; });
    list.sort(function(a, b) {
      if (sort === 'oldest') return new Date(a.bookedAt) - new Date(b.bookedAt);
      return new Date(b.bookedAt) - new Date(a.bookedAt);
    });
    renderBookings(list);
  }
  if (sf) sf.addEventListener('change', run);
  if (so) so.addEventListener('change', run);
  run();
  setupCancelModal();
}

function renderStats(bookings) {
  var el = document.getElementById('bookingStats');
  if (!el) return;
  var confirmed = bookings.filter(function(b) { return b.status === 'confirmed'; });
  var spent = confirmed.reduce(function(s, b) { return s + (b.totalPrice || 0); }, 0);
  el.innerHTML = [
    [bookings.length, 'Buchungen gesamt'],
    [confirmed.length, 'Bestaetigt'],
    [bookings.length - confirmed.length, 'Storniert'],
    [formatPrice(spent), 'Ausgegeben']
  ].map(function(s) {
    return '<div class="stat-card"><div class="stat-value">' + s[0] + '</div><div class="stat-label">' + s[1] + '</div></div>';
  }).join('');
}

function renderBookings(bookings) {
  var grid = document.getElementById('bookingsGrid');
  var cnt = document.getElementById('bookingsCount');
  if (!grid) return;
  if (cnt) cnt.textContent = bookings.length + ' Buchung' + (bookings.length !== 1 ? 'en' : '');
  if (bookings.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🎟️</div><h2>Keine Buchungen</h2><p>Noch keine Buchungen vorhanden.</p><a href="movies.html" class="btn btn-primary" style="margin-top:16px">Filme entdecken</a></div>';
    return;
  }
  var today = new Date().toISOString().split('T')[0];
  grid.innerHTML = bookings.map(function(b) {
    var cancelled = b.status === 'cancelled';
    var upcoming = !cancelled && b.date >= today;
    var label = cancelled ? 'Storniert' : (upcoming ? 'Bestaetigt' : 'Vergangen');
    var seats = (b.seats || []).map(function(s) { return '<span class="seat-chip">' + escapeHtml(s) + '</span>'; }).join('');
    var card = '<article class="booking-card' + (cancelled ? ' is-cancelled' : '') + '" role="listitem">';
    card += '<div class="booking-card-header' + (cancelled ? ' cancelled' : '') + '">';
    card += '<span class="booking-card-id">' + escapeHtml(b.bookingId) + '</span>';
    card += '<span class="booking-card-status">' + label + '</span></div>';
    card += '<div class="booking-card-body">';
    card += '<div class="booking-card-title">' + escapeHtml(b.movieTitle || '-') + '</div>';
    card += '<div class="booking-card-meta">';
    card += '<span>📅 ' + formatDateShort(b.date) + ' | 🕐 ' + (b.time || '') + ' Uhr</span>';
    card += '<span>🏛 ' + escapeHtml(b.hall || '') + ' | ' + escapeHtml(b.format || '') + '</span>';
    card += '<span>Ticket: ' + escapeHtml(b.ticketType || '-') + '</span>';
    card += '</div><div class="booking-card-seats">' + seats + '</div></div>';
    card += '<div class="booking-card-footer">';
    card += '<span class="booking-price">' + formatPrice(b.totalPrice || 0) + '</span>';
    card += '<div style="display:flex;gap:8px;align-items:center">';
    if (upcoming) card += '<button class="btn btn-sm btn-danger" onclick="window.openCancelModal(\'' + b.bookingId + '\')">Stornieren</button>';
    if (cancelled) card += '<span style="font-size:.75rem;color:var(--color-text-muted)">Storniert</span>';
    card += '</div></div></article>';
    return card;
  }).join('');
}

var _cancelId = null;

window.openCancelModal = function(id) {
  _cancelId = id;
  var all = BookingStorage.getAll();
  var b = null;
  for (var i = 0; i < all.length; i++) { if (all[i].bookingId === id) { b = all[i]; break; } }
  if (!b) return;
  var info = document.getElementById('cancelBookingInfo');
  if (info) {
    info.innerHTML = '<strong>' + escapeHtml(b.movieTitle) + '</strong><br>'
      + formatDateShort(b.date) + ' | ' + b.time + ' Uhr | ' + escapeHtml(b.hall || '') + '<br>'
      + 'Sitze: ' + (b.seats || []).join(', ') + ' | <strong>' + formatPrice(b.totalPrice) + '</strong>';
  }
  var modal = document.getElementById('cancelModal');
  if (modal) { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
};

function setupCancelModal() {
  function closeModal() {
    var modal = document.getElementById('cancelModal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
    _cancelId = null;
  }
  var closeBtn = document.getElementById('closeCancelModal');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  var cancelNo = document.getElementById('cancelNo');
  if (cancelNo) cancelNo.addEventListener('click', closeModal);
  var overlay = document.getElementById('cancelModalOverlay');
  if (overlay) overlay.addEventListener('click', closeModal);
  var cancelYes = document.getElementById('cancelYes');
  if (cancelYes) {
    cancelYes.addEventListener('click', function() {
      if (!_cancelId) return;
      var id = _cancelId;
      BookingStorage.cancel(id);
      closeModal();
      showToast('Buchung ' + id + ' wurde storniert.', 'success');
      setTimeout(function() { location.reload(); }, 900);
    });
  }
}
