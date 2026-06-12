/**
 * CineBook – admin.js
 * Admin and Clerk dashboard logic
 */

'use strict';

// escapeHtml wird in movies.js definiert - Fallback fuer Admin-Seiten die movies.js nicht laden
if (typeof escapeHtml === 'undefined') {
  window.escapeHtml = function(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };
}

function setStatValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

document.addEventListener('DOMContentLoaded', async () => {
  const path = window.location.pathname;

  // Beim file://-Protokoll Login-Pruefung überspringen (lokale Entwicklung)
  const isFileProtocol = window.location.protocol === 'file:';

  if (!isFileProtocol) {
    if (path.includes('/admin/')) {
      if (!Auth.requireRole('admin')) return;
    } else if (path.includes('/clerk/')) {
      const user = Auth.getCurrentUser();
      if (!user || (user.role !== 'clerk' && user.role !== 'admin')) {
        alert('Zugriff verweigert.');
        window.location.href = '../index.html';
        return;
      }
    }
  }

  const user = Auth.getCurrentUser();
  const nameEl = document.getElementById('adminUserName');
  if (nameEl && user) nameEl.textContent = user.firstName + ' ' + user.lastName;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());

  if (path.includes('admin/dashboard')) await initAdminDashboard();
  if (path.includes('admin/movies')) await initAdminMovies();
  if (path.includes('admin/showtimes')) await initAdminShowtimes();
  if (path.includes('admin/users')) await initAdminUsers();
  if (path.includes('clerk/dashboard')) await initClerkDashboard();
  if (path.includes('clerk/reservations')) await initClerkReservations();
});

async function initAdminDashboard() {
  const [movies, showtimes, users] = await Promise.all([getMovies(), getShowtimes(), getUsers()]);
  const bookings = BookingStorage.getAll();

  setStatValue('totalMovies', movies.length);
  setStatValue('totalBookings', bookings.length);
  setStatValue('totalUsers', users.length);
  setStatValue('totalShowtimes', showtimes.length);

  const tbody = document.getElementById('recentBookingsTbody');
  if (tbody) {
    const recent = bookings.slice(-5).reverse();
    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Keine Buchungen vorhanden</td></tr>';
    } else {
      tbody.innerHTML = recent.map(b => '<tr><td>' + b.bookingId + '</td><td>' + escapeHtml(b.userName || '-') + '</td><td>' + escapeHtml(b.movieTitle || '-') + '</td><td>' + (b.seats || []).join(', ') + '</td><td>' + formatPrice(b.totalPrice || 0) + '</td><td><span class="badge ' + (b.status === 'confirmed' ? 'badge-success' : 'badge-danger') + '">' + b.status + '</span></td></tr>').join('');
    }
  }

  const upcomingTbody = document.getElementById('upcomingTbody');
  if (upcomingTbody) {
    const upcoming = showtimes.slice(0, 5);
    if (upcoming.length === 0) {
      upcomingTbody.innerHTML = '<tr><td colspan="6" class="table-empty">Keine Vorstellungen</td></tr>';
    } else {
      upcomingTbody.innerHTML = upcoming.map(st => {
        const movie = movies.find(m => m.id === st.movieId);
        return '<tr><td>' + (movie ? escapeHtml(movie.title) : '-') + '</td><td>' + formatDateShort(st.date) + '</td><td>' + st.time + '</td><td>' + st.hall + '</td><td><span class="badge badge-format">' + st.format + '</span></td><td>' + st.availableSeats + ' / ' + st.totalSeats + '</td></tr>';
      }).join('');
    }
  }
}

async function initAdminMovies() {
  let movies = await getMovies();
  const tbody = document.getElementById('moviesTbody');
  const searchInput = document.getElementById('movieSearch');
  const modal = document.getElementById('movieModal');
  const form = document.getElementById('movieForm');
  const modalTitle = document.getElementById('movieModalTitle');

  function renderTable(list) {
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Keine Filme gefunden</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(m => '<tr><td>' + m.id + '</td><td><strong>' + escapeHtml(m.title) + '</strong></td><td>' + (m.genre || []).join(', ') + '</td><td>' + formatDuration(m.duration) + '</td><td><span class="badge badge-rating">' + m.rating + '</span></td><td>' + (m.price ? formatPrice(m.price.normal) : '-') + '</td><td class="table-actions"><button class="btn btn-sm btn-outline" onclick="editMovie(' + m.id + ')">✏️ Bearbeiten</button> <button class="btn btn-sm btn-danger" onclick="deleteMovie(' + m.id + ')">🗑️ Löschen</button></td></tr>').join('');
  }

  function openMovieModal(movie) {
    if (!modal || !form) return;
    if (movie) {
      if (modalTitle) modalTitle.textContent = 'Film bearbeiten';
      document.getElementById('movieId').value = movie.id;
      document.getElementById('movieTitle').value = movie.title || '';
      document.getElementById('movieDirector').value = movie.director || '';
      document.getElementById('movieDuration').value = movie.duration || '';
      document.getElementById('movieRating').value = movie.rating || 'PG-13';
      document.getElementById('movieDescription').value = movie.description || '';
      document.getElementById('movieGenre').value = (movie.genre || []).join(', ');
      document.getElementById('movieCast').value = (movie.cast || []).join(', ');
      document.getElementById('moviePriceNormal').value = movie.price ? movie.price.normal : '';
      document.getElementById('moviePriceStudent').value = movie.price ? movie.price.student : '';
      document.getElementById('moviePriceSenior').value = movie.price ? movie.price.senior : '';
      document.getElementById('moviePriceVip').value = movie.price ? movie.price.vip : '';
    } else {
      if (modalTitle) modalTitle.textContent = 'Film hinzufügen';
      form.reset();
    }
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('movieTitle').focus();
  }

  function closeMovieModal() {
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (form) form.reset();
  }

  window.editMovie = function(id) {
    const m = movies.find(x => x.id === id);
    if (m) openMovieModal(m);
  };

  window.deleteMovie = function(id) {
    const deleteModal = document.getElementById('deleteModal');
    if (!deleteModal) return;
    const m = movies.find(x => x.id === id);
    const textEl = document.getElementById('deleteModalText');
    if (textEl) textEl.textContent = 'Film "' + (m ? m.title : id) + '" wirklich loeschen?';
    deleteModal.classList.remove('hidden');
    document.getElementById('confirmDelete').onclick = function() {
      movies = movies.filter(x => x.id !== id);
      showToast('Film geloescht (Demo)', 'success');
      deleteModal.classList.add('hidden');
      renderTable(movies);
    };
    document.getElementById('cancelDelete').onclick = function() {
      deleteModal.classList.add('hidden');
    };
  };

  document.getElementById('addMovieBtn') && document.getElementById('addMovieBtn').addEventListener('click', () => openMovieModal(null));
  document.getElementById('closeMovieModal') && document.getElementById('closeMovieModal').addEventListener('click', closeMovieModal);
  document.getElementById('cancelMovieModal') && document.getElementById('cancelMovieModal').addEventListener('click', closeMovieModal);
  document.getElementById('movieModalOverlay') && document.getElementById('movieModalOverlay').addEventListener('click', closeMovieModal);

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const id = document.getElementById('movieId').value;
      const updated = {
        id: id ? parseInt(id) : Date.now(),
        title: document.getElementById('movieTitle').value,
        director: document.getElementById('movieDirector').value,
        duration: parseInt(document.getElementById('movieDuration').value) || 0,
        rating: document.getElementById('movieRating').value,
        description: document.getElementById('movieDescription').value,
        genre: document.getElementById('movieGenre').value.split(',').map(s => s.trim()).filter(Boolean),
        cast: document.getElementById('movieCast').value.split(',').map(s => s.trim()).filter(Boolean),
        price: {
          normal: parseFloat(document.getElementById('moviePriceNormal').value) || 0,
          student: parseFloat(document.getElementById('moviePriceStudent').value) || 0,
          senior: parseFloat(document.getElementById('moviePriceSenior').value) || 0,
          vip: parseFloat(document.getElementById('moviePriceVip').value) || 0
        }
      };
      if (id) {
        movies = movies.map(m => m.id === updated.id ? updated : m);
      } else {
        movies.push(updated);
      }
      showToast('Film gespeichert (Demo)', 'success');
      closeMovieModal();
      renderTable(movies);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const q = searchInput.value.toLowerCase();
      renderTable(movies.filter(m => m.title.toLowerCase().includes(q)));
    });
  }

  renderTable(movies);
}

async function initAdminShowtimes() {
  let showtimes = window.SHOWTIMES_DATA ? JSON.parse(JSON.stringify(window.SHOWTIMES_DATA)) : await getShowtimes();
  const movies = await getMovies();
  const tbody = document.getElementById('showtimesTbody');
  const movieFilter = document.getElementById('movieFilterAdmin');
  const dateFilter = document.getElementById('dateFilterAdmin');
  const modal = document.getElementById('showtimeModal');
  const form = document.getElementById('showtimeForm');

  // Populate film dropdowns
  movies.forEach(m => {
    [movieFilter, document.getElementById('stMovieId')].forEach(sel => {
      if (!sel) return;
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.title;
      sel.appendChild(opt);
    });
  });

  function renderTable(list) {
    if (!tbody) return;
    if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="10" class="table-empty">Keine Spielzeiten</td></tr>'; return; }
    tbody.innerHTML = list.map(st => {
      const movie = movies.find(m => m.id === st.movieId);
      return '<tr><td>' + st.id + '</td><td>' + (movie ? escapeHtml(movie.title) : '-') + '</td><td>' + formatDateShort(st.date) + '</td><td>' + st.time + '</td><td>' + st.hall + '</td><td><span class="badge badge-format">' + st.format + '</span></td><td>' + st.language + '</td><td>' + st.availableSeats + '/' + st.totalSeats + '</td><td>' + (st.accessible ? '<span class="badge badge-info">♿</span>' : '-') + '</td><td class="table-actions"><button class="btn btn-sm btn-outline" onclick="editShowtime(' + st.id + ')">✏️</button> <button class="btn btn-sm btn-danger" onclick="deleteShowtime(' + st.id + ')">🗑️</button></td></tr>';
    }).join('');
  }

  function openModal(st) {
    if (!modal || !form) return;
    document.getElementById('showtimeModalTitle').textContent = st ? 'Spielzeit bearbeiten' : 'Spielzeit hinzufuegen';
    document.getElementById('showtimeId').value = st ? st.id : '';
    document.getElementById('stMovieId').value = st ? st.movieId : '';
    document.getElementById('stDate').value = st ? st.date : '';
    document.getElementById('stTime').value = st ? st.time : '';
    document.getElementById('stHall').value = st ? st.hall : 'Saal 1';
    document.getElementById('stFormat').value = st ? st.format : '2D';
    document.getElementById('stLanguage').value = st ? st.language : 'Deutsch';
    document.getElementById('stAccessible').checked = st ? !!st.accessible : false;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() { if (modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; } }

  window.editShowtime = function(id) { openModal(showtimes.find(s => s.id === id)); };
  window.deleteShowtime = function(id) {
    const dm = document.getElementById('deleteModal');
    if (!dm) return;
    document.getElementById('deleteModalText').textContent = 'Spielzeit loeschen?';
    dm.classList.remove('hidden');
    document.getElementById('confirmDelete').onclick = function() { showtimes = showtimes.filter(s => s.id !== id); showToast('Spielzeit geloescht (Demo)', 'success'); dm.classList.add('hidden'); applyFilters(); };
    document.getElementById('cancelDelete').onclick = function() { dm.classList.add('hidden'); };
  };

  document.getElementById('addShowtimeBtn') && document.getElementById('addShowtimeBtn').addEventListener('click', () => openModal(null));
  document.getElementById('closeShowtimeModal') && document.getElementById('closeShowtimeModal').addEventListener('click', closeModal);
  document.getElementById('cancelShowtimeModal') && document.getElementById('cancelShowtimeModal').addEventListener('click', closeModal);
  document.getElementById('showtimeModalOverlay') && document.getElementById('showtimeModalOverlay').addEventListener('click', closeModal);
  document.getElementById('deleteModalOverlay') && document.getElementById('deleteModalOverlay').addEventListener('click', function() { document.getElementById('deleteModal').classList.add('hidden'); });

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const id = document.getElementById('showtimeId').value;
      const movieId = parseInt(document.getElementById('stMovieId').value);
      const movie = movies.find(m => m.id === movieId);
      const hall = document.getElementById('stHall').value;
      const totalSeats = hall === 'Saal 3' ? 100 : 80;
      const updated = {
        id: id ? parseInt(id) : Date.now(),
        movieId: movieId,
        date: document.getElementById('stDate').value,
        time: document.getElementById('stTime').value,
        hall: hall,
        totalSeats: totalSeats,
        availableSeats: id ? (showtimes.find(s => s.id === parseInt(id)) || {}).availableSeats || totalSeats : totalSeats,
        format: document.getElementById('stFormat').value,
        language: document.getElementById('stLanguage').value,
        accessible: document.getElementById('stAccessible').checked,
        seats: { rows: hall === 'Saal 3' ? ['A','B','C','D','E','F','G','H','I','J'] : ['A','B','C','D','E','F','G','H'], seatsPerRow: 10, layout: {} }
      };
      if (id) {
        showtimes = showtimes.map(s => s.id === updated.id ? updated : s);
      } else {
        showtimes.push(updated);
      }
      showToast('Spielzeit gespeichert (Demo)', 'success');
      closeModal();
      applyFilters();
    });
  }

  function applyFilters() {
    const mId = movieFilter ? parseInt(movieFilter.value) || 0 : 0;
    const date = dateFilter ? dateFilter.value : '';
    const filtered = showtimes.filter(st => (!mId || st.movieId === mId) && (!date || st.date === date));
    renderTable(filtered);
  }

  if (movieFilter) movieFilter.addEventListener('change', applyFilters);
  if (dateFilter) dateFilter.addEventListener('change', applyFilters);

  applyFilters();
}

async function initAdminUsers() {
  let users = await getUsers();
  const tbody = document.getElementById('usersTbody');
  const searchInput = document.getElementById('userSearch');
  const roleFilter = document.getElementById('roleFilter');
  const modal = document.getElementById('userModal');
  const form = document.getElementById('userForm');

  function renderTable(list) {
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Keine Benutzer gefunden</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(u => {
      const roleCls = u.role === 'admin' ? 'badge-danger' : u.role === 'clerk' ? 'badge-warning' : 'badge-success';
      return '<tr><td>' + u.id + '</td><td>' + escapeHtml(u.username) + '</td><td>' + escapeHtml(u.firstName) + ' ' + escapeHtml(u.lastName) + '</td><td>' + escapeHtml(u.email) + '</td><td><span class="badge ' + roleCls + '">' + u.role + '</span></td><td>' + (u.createdAt || '-') + '</td><td><span class="badge ' + (u.active ? 'badge-success' : 'badge-danger') + '">' + (u.active ? 'Aktiv' : 'Inaktiv') + '</span></td><td class="table-actions"><button class="btn btn-sm btn-outline" onclick="editUser(' + u.id + ')">✏️</button> <button class="btn btn-sm btn-danger" onclick="deleteUser(' + u.id + ')">🗑️</button></td></tr>';
    }).join('');
  }

  function openUserModal(user) {
    if (!modal || !form) return;
    const title = document.getElementById('userModalTitle');
    if (user) {
      if (title) title.textContent = 'Benutzer bearbeiten';
      document.getElementById('userId').value = user.id;
      document.getElementById('userFirstName').value = user.firstName || '';
      document.getElementById('userLastName').value = user.lastName || '';
      document.getElementById('userUsername').value = user.username || '';
      document.getElementById('userEmail').value = user.email || '';
      document.getElementById('userRole').value = user.role || 'customer';
      document.getElementById('userActive').checked = user.active !== false;
    } else {
      if (title) title.textContent = 'Benutzer hinzufügen';
      form.reset();
      document.getElementById('userActive').checked = true;
    }
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeUserModal() {
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  window.editUser = function(id) {
    const u = users.find(x => x.id === id);
    if (u) openUserModal(u);
  };

  window.deleteUser = function(id) {
    const deleteModal = document.getElementById('deleteModal');
    if (!deleteModal) return;
    const u = users.find(x => x.id === id);
    const textEl = document.getElementById('deleteModalText');
    if (textEl) textEl.textContent = 'Benutzer "' + (u ? u.username : id) + '" wirklich loeschen?';
    deleteModal.classList.remove('hidden');
    document.getElementById('confirmDelete').onclick = function() {
      users = users.filter(x => x.id !== id);
      showToast('Benutzer geloescht (Demo)', 'success');
      deleteModal.classList.add('hidden');
      renderTable(users);
    };
    document.getElementById('cancelDelete').onclick = function() {
      deleteModal.classList.add('hidden');
    };
  };

  document.getElementById('addUserBtn') && document.getElementById('addUserBtn').addEventListener('click', () => openUserModal(null));
  document.getElementById('closeUserModal') && document.getElementById('closeUserModal').addEventListener('click', closeUserModal);
  document.getElementById('cancelUserModal') && document.getElementById('cancelUserModal').addEventListener('click', closeUserModal);
  document.getElementById('userModalOverlay') && document.getElementById('userModalOverlay').addEventListener('click', closeUserModal);

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      showToast('Benutzer gespeichert (Demo)', 'success');
      closeUserModal();
    });
  }

  function applyFilters() {
    const q = searchInput ? searchInput.value.toLowerCase() : '';
    const role = roleFilter ? roleFilter.value : '';
    renderTable(users.filter(u =>
      (!q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (!role || u.role === role)
    ));
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (roleFilter) roleFilter.addEventListener('change', applyFilters);

  renderTable(users);
}

async function initClerkDashboard() {
  const [showtimes, movies] = await Promise.all([getShowtimes(), getMovies()]);
  const bookings = BookingStorage.getAll();
  const today = new Date().toISOString().split('T')[0];
  const todayShowtimes = showtimes.filter(function(st) { return st.date === today; });
  const todayBookings = bookings.filter(function(b) { return b.date === today; });

  setStatValue('todayBookings', todayBookings.length);
  setStatValue('todayShowtimes', todayShowtimes.length);
  setStatValue('availableSeats', todayShowtimes.reduce(function(sum, st) { return sum + st.availableSeats; }, 0));

  const tbody = document.getElementById('todayTbody');
  if (tbody) {
    if (todayShowtimes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Keine Vorstellungen heute</td></tr>';
    } else {
      tbody.innerHTML = todayShowtimes.map(function(st) {
        const movie = movies.find(function(m) { return m.id === st.movieId; });
        const booked = st.totalSeats - st.availableSeats;
        return '<tr><td>' + (movie ? escapeHtml(movie.title) : '-') + '</td><td>' + st.time + '</td><td>' + st.hall + '</td><td><span class="badge badge-format">' + st.format + '</span></td><td>' + booked + '</td><td>' + st.availableSeats + '</td><td><a href="../clerk/reservations.html" class="btn btn-sm btn-outline">Details</a></td></tr>';
      }).join('');
    }
  }
}

async function initClerkReservations() {
  const bookings = BookingStorage.getAll();

  const lookupInput = document.getElementById('bookingIdSearch');
  const lookupBtn = document.getElementById('lookupBtn');
  const lookupResult = document.getElementById('lookupResult');

  if (lookupBtn) {
    lookupBtn.addEventListener('click', function() {
      const id = lookupInput ? lookupInput.value.trim().toUpperCase() : '';
      const booking = bookings.find(function(b) { return b.bookingId === id; });
      if (!booking) {
        lookupResult.innerHTML = '<p style="color:var(--color-danger)">Buchung nicht gefunden.</p>';
      } else {
        lookupResult.innerHTML = '<strong>' + booking.bookingId + '</strong> – ' + escapeHtml(booking.movieTitle) + ' | ' + formatDateShort(booking.date) + ' ' + booking.time + ' | Sitze: ' + (booking.seats || []).join(', ') + ' | ' + formatPrice(booking.totalPrice) + ' | <span class="badge ' + (booking.status === 'confirmed' ? 'badge-success' : 'badge-danger') + '">' + booking.status + '</span>';
      }
      if (lookupResult) lookupResult.classList.remove('hidden');
    });
  }

  const tbody = document.getElementById('reservationsTbody');
  const searchInput = document.getElementById('reservationSearch');
  const statusFilter = document.getElementById('statusFilter');

  function renderTable(list) {
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="table-empty">Keine Buchungen gefunden</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function(b) {
      return '<tr><td>' + b.bookingId + '</td><td>' + escapeHtml(b.userName || '-') + '</td><td>' + escapeHtml(b.movieTitle || '-') + '</td><td>' + (b.seats || []).join(', ') + '</td><td>' + (b.ticketType || '-') + '</td><td>' + formatPrice(b.totalPrice || 0) + '</td><td>' + (b.date || '-') + '</td><td><span class="badge ' + (b.status === 'confirmed' ? 'badge-success' : 'badge-danger') + '">' + b.status + '</span></td><td><button class="btn btn-sm btn-outline" onclick="viewReservation(\'' + b.bookingId + '\')">Details</button></td></tr>';
    }).join('');
  }

  window.viewReservation = function(id) {
    const b = bookings.find(function(x) { return x.bookingId === id; });
    if (!b) return;
    const modal = document.getElementById('reservationModal');
    const detail = document.getElementById('reservationDetail');
    if (modal && detail) {
      detail.innerHTML = '<div class="reservation-detail-row"><span>Buchungs-ID:</span><strong>' + b.bookingId + '</strong></div><div class="reservation-detail-row"><span>Film:</span><span>' + escapeHtml(b.movieTitle || '-') + '</span></div><div class="reservation-detail-row"><span>Datum:</span><span>' + formatDateShort(b.date) + ' ' + b.time + '</span></div><div class="reservation-detail-row"><span>Sitze:</span><span>' + (b.seats || []).join(', ') + '</span></div><div class="reservation-detail-row"><span>Ticketart:</span><span>' + (b.ticketType || '-') + '</span></div><div class="reservation-detail-row"><span>Preis:</span><strong>' + formatPrice(b.totalPrice || 0) + '</strong></div><div class="reservation-detail-row"><span>Status:</span><span class="badge ' + (b.status === 'confirmed' ? 'badge-success' : 'badge-danger') + '">' + b.status + '</span></div>';
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  };

  document.getElementById('closeReservationModal') && document.getElementById('closeReservationModal').addEventListener('click', function() {
    document.getElementById('reservationModal').classList.add('hidden');
    document.body.style.overflow = '';
  });
  document.getElementById('closeReservationModalBtn') && document.getElementById('closeReservationModalBtn').addEventListener('click', function() {
    document.getElementById('reservationModal').classList.add('hidden');
    document.body.style.overflow = '';
  });
  document.getElementById('reservationModalOverlay') && document.getElementById('reservationModalOverlay').addEventListener('click', function() {
    document.getElementById('reservationModal').classList.add('hidden');
    document.body.style.overflow = '';
  });

  document.getElementById('cancelReservationBtn') && document.getElementById('cancelReservationBtn').addEventListener('click', function() {
    var modal = document.getElementById('reservationModal');
    var detail = document.getElementById('reservationDetail');
    // Buchungs-ID aus dem Detail-Inhalt lesen
    var idMatch = detail ? detail.innerHTML.match(/BK-[A-Z0-9]+/) : null;
    if (idMatch) {
      var bookingId = idMatch[0];
      BookingStorage.cancel(bookingId);
      showToast('Buchung ' + bookingId + ' wurde storniert.', 'success');
      // Tabelle neu laden
      renderTable(bookings.map(function(b) {
        return b.bookingId === bookingId ? Object.assign({}, b, { status: 'cancelled' }) : b;
      }));
    }
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  });

  function applyFilters() {
    const q = searchInput ? searchInput.value.toLowerCase() : '';
    const status = statusFilter ? statusFilter.value : '';
    const date = document.getElementById('dateFilterRes') ? document.getElementById('dateFilterRes').value : '';
    renderTable(bookings.filter(function(b) {
      return (!q || b.bookingId.toLowerCase().includes(q) || (b.movieTitle || '').toLowerCase().includes(q)) &&
             (!status || b.status === status) &&
             (!date || b.date === date);
    }));
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  const dateFilterRes = document.getElementById('dateFilterRes');
  if (dateFilterRes) dateFilterRes.addEventListener('change', applyFilters);

  renderTable(bookings);
}
