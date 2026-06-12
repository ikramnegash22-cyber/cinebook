/**
 * CineBook – movies.js
 * Handles movie listing, filtering, detail pages, showtimes display
 */

'use strict';

/* ============================================================
   RENDER MOVIE CARD
   ============================================================ */
function renderMovieCard(movie, showBookBtn = true, isAccessible = false) {
  const genres = Array.isArray(movie.genre) ? movie.genre.slice(0, 2).join(', ') : movie.genre;
  const price = movie.price ? `ab ${formatPrice(movie.price.student || movie.price.normal)}` : '';

  const posterHtml = movie.poster
    ? `<img src="${movie.poster}" alt="${escapeHtml(movie.title)} Poster" class="movie-card-poster" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="movie-card-poster-placeholder" style="display:none" aria-hidden="true">🎬</div>`
    : `<div class="movie-card-poster-placeholder" aria-hidden="true">🎬</div>`;

  return `
    <article class="movie-card" role="listitem" data-movie-id="${movie.id}">
      <a href="${BASE}movie-details.html?id=${movie.id}" aria-label="${movie.title} - Details ansehen">
        ${posterHtml}
      </a>
      <div class="movie-card-body">
        <div class="movie-card-title">${escapeHtml(movie.title)}</div>
        <div class="movie-card-meta">
          <span class="badge badge-rating">${movie.rating}</span>
          ${movie.genre ? `<span class="badge badge-genre">${escapeHtml(genres)}</span>` : ''}
          ${isAccessible ? '<span class="badge badge-info" title="Barrierefreie Vorstellung verfuegbar">♿</span>' : ''}
          <span class="tmdb-card-rating badge badge-warning" style="display:none;"></span>
        </div>
        <div class="movie-card-duration">⏱ ${formatDuration(movie.duration)}</div>
        ${price ? `<div class="movie-card-price">${price}</div>` : ''}
      </div>
      ${showBookBtn ? `
      <div class="movie-card-actions">
        <a href="${BASE}movie-details.html?id=${movie.id}" class="btn btn-outline btn-sm" style="flex:1">Details</a>
        <a href="${BASE}showtimes.html?movieId=${movie.id}" class="btn btn-primary btn-sm" style="flex:1">Buchen</a>
      </div>` : ''}
    </article>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   MOVIES LIST PAGE (movies.html)
   ============================================================ */
async function initMoviesPage() {
  const grid = document.getElementById('moviesGrid');
  if (!grid) return;

  const [movies, showtimes] = await Promise.all([getMovies(), getShowtimes()]);
  let filtered = [...movies];

  // Welche Film-IDs haben mindestens eine barrierefreie Vorstellung?
  const accessibleMovieIds = new Set(
    showtimes.filter(st => st.accessible).map(st => st.movieId)
  );

  const searchInput = document.getElementById('movieSearch');
  const genreFilter = document.getElementById('genreFilter');
  const ratingFilter = document.getElementById('ratingFilter');
  const sortFilter = document.getElementById('sortFilter');
  const accessibleBtn = document.getElementById('accessibleMovieFilter');
  const resetBtn = document.getElementById('resetFilter');
  const resultsInfo = document.getElementById('resultsInfo');

  let accessibleOnly = false;

  // Toggle-Button Styling
  function updateAccessibleBtn() {
    if (!accessibleBtn) return;
    if (accessibleOnly) {
      accessibleBtn.classList.remove('btn-outline');
      accessibleBtn.classList.add('btn-primary');
      accessibleBtn.setAttribute('aria-pressed', 'true');
    } else {
      accessibleBtn.classList.add('btn-outline');
      accessibleBtn.classList.remove('btn-primary');
      accessibleBtn.setAttribute('aria-pressed', 'false');
    }
  }

  if (accessibleBtn) {
    accessibleBtn.addEventListener('click', () => {
      accessibleOnly = !accessibleOnly;
      updateAccessibleBtn();
      applyFilters();
    });
  }

  function applyFilters() {
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const genre = genreFilter ? genreFilter.value : '';
    const rating = ratingFilter ? ratingFilter.value : '';
    const sort = sortFilter ? sortFilter.value : 'title';

    filtered = movies.filter(m => {
      if (search && !m.title.toLowerCase().includes(search) &&
          !m.director?.toLowerCase().includes(search)) return false;
      if (genre && (!m.genre || !m.genre.includes(genre))) return false;
      if (rating && m.rating !== rating) return false;
      if (accessibleOnly && !accessibleMovieIds.has(m.id)) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'title-desc') return b.title.localeCompare(a.title);
      if (sort === 'duration') return a.duration - b.duration;
      if (sort === 'release') return new Date(b.releaseDate) - new Date(a.releaseDate);
      return 0;
    });

    renderGrid();
  }

  function renderGrid() {
    if (resultsInfo) {
      resultsInfo.textContent = `${filtered.length} Film${filtered.length !== 1 ? 'e' : ''} gefunden`;
    }
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="no-results">
        <div class="no-results-icon">🎬</div>
        <p>Keine Filme mit barrierefreien Vorstellungen gefunden.</p>
      </div>`;
      return;
    }
    grid.innerHTML = filtered.map(m => renderMovieCard(m, true, accessibleMovieIds.has(m.id))).join('');
    // TMDB-Bewertungen laden
    if (typeof addTmdbRatingsToCards === 'function') {
      setTimeout(addTmdbRatingsToCards, 500);
    }
  }

  [searchInput, genreFilter, ratingFilter, sortFilter].forEach(el => {
    if (el) el.addEventListener('change', applyFilters);
  });
  if (searchInput) searchInput.addEventListener('input', applyFilters);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (genreFilter) genreFilter.value = '';
      if (ratingFilter) ratingFilter.value = '';
      if (sortFilter) sortFilter.value = 'title';
      accessibleOnly = false;
      updateAccessibleBtn();
      applyFilters();
    });
  }

  applyFilters();
}

/* ============================================================
   HOME PAGE – FEATURED MOVIES & UPCOMING SHOWTIMES
   ============================================================ */
async function initHomePage() {
  const featuredEl = document.getElementById('featuredMovies');
  const showtimesEl = document.getElementById('upcomingShowtimes');

  if (featuredEl) {
    const movies = await getMovies();
    const featured = movies.slice(0, 4);
    if (featured.length === 0) {
      featuredEl.innerHTML = '<p class="loading">Keine Filme verfügbar.</p>';
    } else {
      featuredEl.innerHTML = featured.map(m => renderMovieCard(m)).join('');
    }
  }

  if (showtimesEl) {
    const [showtimes, movies] = await Promise.all([getShowtimes(), getMovies()]);
    const upcoming = showtimes.slice(0, 4);
    if (upcoming.length === 0) {
      showtimesEl.innerHTML = '<p class="loading">Keine Spielzeiten verfügbar.</p>';
    } else {
      showtimesEl.innerHTML = upcoming.map(st => {
        const movie = movies.find(m => m.id === st.movieId);
        if (!movie) return '';
        return `
          <div class="showtime-card">
            <div class="showtime-movie-title">${escapeHtml(movie.title)}</div>
            <div class="showtime-meta">
              <span>📅 ${formatDateShort(st.date)}</span>
              <span>🕐 ${st.time}</span>
              <span class="badge badge-format">${st.format}</span>
              <span class="badge badge-genre">${st.language}</span>
              <span>🏛 ${st.hall}</span>
            </div>
            <div class="showtime-time-badge">${st.time} Uhr</div>
            <div>
              <a href="${BASE}seat-selection.html?showtimeId=${st.id}" class="btn btn-primary btn-sm">Tickets buchen</a>
            </div>
          </div>`;
      }).join('');
    }
  }
}

/* ============================================================
   MOVIE DETAIL PAGE (movie-details.html)
   ============================================================ */
async function initMovieDetailPage() {
  const detailEl = document.getElementById('movieDetail');
  if (!detailEl) return;

  const movieId = parseInt(getURLParam('id'));
  if (!movieId) {
    detailEl.innerHTML = '<p>Film nicht gefunden.</p>';
    return;
  }

  const [movies, showtimes] = await Promise.all([getMovies(), getShowtimes()]);
  const movie = movies.find(m => m.id === movieId);

  if (!movie) {
    detailEl.innerHTML = '<p>Film nicht gefunden.</p>';
    return;
  }

  // Update page title & breadcrumb
  document.title = `${movie.title} – CineBook`;
  const breadcrumb = document.getElementById('breadcrumbMovie');
  if (breadcrumb) breadcrumb.textContent = movie.title;

  // Render detail
  detailEl.innerHTML = `
    <div class="movie-detail">
      <div class="movie-detail-poster">
        ${movie.poster
          ? `<img src="${movie.poster}" alt="${escapeHtml(movie.title)} Poster" style="width:100%;border-radius:8px;" onerror="this.style.display='none'"/>`
          : `<div class="movie-detail-poster-placeholder" aria-label="Poster fuer ${escapeHtml(movie.title)}">🎬</div>`
        }
      </div>
      <div class="movie-detail-info">
        <h1 class="movie-detail-title">${escapeHtml(movie.title)}</h1>
        <div class="movie-detail-meta">
          <span class="badge badge-rating">${movie.rating}</span>
          ${(movie.genre || []).map(g => `<span class="badge badge-genre">${escapeHtml(g)}</span>`).join('')}
          <span>⏱ ${formatDuration(movie.duration)}</span>
        </div>
        <p class="movie-detail-description">${escapeHtml(movie.description)}</p>
        <div class="movie-detail-credits">
          <div class="credit-item">
            <label>Regie</label>
            <span>${escapeHtml(movie.director)}</span>
          </div>
          <div class="credit-item">
            <label>Besetzung</label>
            <span>${(movie.cast || []).join(', ')}</span>
          </div>
          <div class="credit-item">
            <label>Sprache</label>
            <span>${movie.language}</span>
          </div>
          <div class="credit-item">
            <label>Erscheinungsjahr</label>
            <span>${movie.releaseDate ? movie.releaseDate.split('-')[0] : '-'}</span>
          </div>
        </div>
        <div class="movie-detail-actions">
          <a href="${BASE}showtimes.html?movieId=${movie.id}" class="btn btn-primary btn-lg">🎟️ Tickets buchen</a>
          ${movie.trailer ? `<button class="btn btn-outline" id="trailerBtn" aria-haspopup="dialog">▶ Trailer</button>` : ''}
        </div>
        <div class="movie-detail-credits">
          <div class="credit-item"><label>Normal</label><span>${movie.price ? formatPrice(movie.price.normal) : '-'}</span></div>
          <div class="credit-item"><label>Student</label><span>${movie.price ? formatPrice(movie.price.student) : '-'}</span></div>
          <div class="credit-item"><label>Senior</label><span>${movie.price ? formatPrice(movie.price.senior) : '-'}</span></div>
          <div class="credit-item"><label>VIP</label><span>${movie.price ? formatPrice(movie.price.vip) : '-'}</span></div>
        </div>
      </div>
    </div>`;

  // Trailer button - öffnet YouTube direkt wenn file:// Protokoll
  const trailerBtn = document.getElementById('trailerBtn');
  if (trailerBtn && movie.trailer) {
    const ytId = movie.trailer.includes('v=') ? movie.trailer.split('v=')[1].split('&')[0] : '';
    const isFileProtocol = window.location.protocol === 'file:';
    trailerBtn.dataset.ytId = ytId;

    trailerBtn.onclick = function() {
      if (isFileProtocol) {
        // file:// Protokoll: YouTube direkt im neuen Tab öffnen
        window.open('https://www.youtube.com/watch?v=' + ytId, '_blank');
      } else {
        // http/https: Embed-Modal
        const modal = document.getElementById('trailerModal');
        const frame = document.getElementById('trailerFrame');
        if (modal && frame && ytId) {
          frame.src = 'https://www.youtube.com/embed/' + ytId + '?autoplay=1';
          modal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      }
    };

    const closeTrailer = document.getElementById('closeTrailer');
    const trailerOverlay = document.getElementById('trailerOverlay');
    [closeTrailer, trailerOverlay].forEach(el => {
      if (el) el.onclick = function() {
        document.getElementById('trailerModal').classList.add('hidden');
        document.getElementById('trailerFrame').src = '';
        document.body.style.overflow = '';
      };
    });
  }

  // --- BEWERTUNGEN ---
  const RATINGS_KEY = 'cinebook_ratings';
  function getRatings(movieId) {
    try { return (JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}')||{})[movieId] || []; } catch { return []; }
  }
  function saveRating(movieId, rating) {
    const all = JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}') || {};
    if (!all[movieId]) all[movieId] = [];
    all[movieId].push(rating);
    localStorage.setItem(RATINGS_KEY, JSON.stringify(all));
  }

  function renderRatings() {
    const ratings = getRatings(movieId);
    const summaryEl = document.getElementById('ratingsSummary');
    const listEl = document.getElementById('ratingsList');
    if (!summaryEl || !listEl) return;

    if (ratings.length === 0) {
      summaryEl.innerHTML = '<span style="color:var(--color-text-muted)">Noch keine Bewertungen. Seien Sie der Erste!</span>';
      listEl.innerHTML = '';
    } else {
      const avg = (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1);
      const stars = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
      summaryEl.innerHTML = '<span style="font-size:2rem;color:#f5c518">' + stars + '</span><span style="font-size:1.5rem;font-weight:700">' + avg + '</span><span style="color:var(--color-text-muted)">/ 5 (' + ratings.length + ' Bewertung' + (ratings.length !== 1 ? 'en' : '') + ')</span>';
      listEl.innerHTML = ratings.slice().reverse().map(r => {
        const s = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
        return '<div style="background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:12px 16px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<span style="font-weight:600">' + escapeHtml(r.user) + '</span>' +
          '<span style="color:#f5c518;font-size:1.1rem">' + s + '</span></div>' +
          (r.text ? '<p style="font-size:0.875rem;color:var(--color-text-muted);margin:0">' + escapeHtml(r.text) + '</p>' : '') +
          '<span style="font-size:0.75rem;color:var(--color-text-muted)">' + new Date(r.date).toLocaleDateString('de-DE') + '</span>' +
          '</div>';
      }).join('');
    }
  }

  // Rating Form Setup
  const ratingForm = document.getElementById('ratingForm');
  const ratingLoginHint = document.getElementById('ratingLoginHint');
  const ratingLoginLink = document.getElementById('ratingLoginLink');
  const starSelector = document.getElementById('starSelector');

  const user = Auth.getCurrentUser();
  if (user) {
    if (ratingForm) ratingForm.classList.remove('hidden');
    if (ratingLoginHint) ratingLoginHint.classList.add('hidden');
  } else {
    if (ratingForm) ratingForm.classList.add('hidden');
    if (ratingLoginHint) ratingLoginHint.classList.remove('hidden');
    if (ratingLoginLink) ratingLoginLink.addEventListener('click', e => { e.preventDefault(); document.getElementById('loginBtn')?.click(); });
  }

  let selectedStars = 0;
  if (starSelector) {
    const stars = starSelector.querySelectorAll('[data-star]');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        selectedStars = parseInt(star.dataset.star);
        document.getElementById('selectedStars').value = selectedStars;
        stars.forEach(s => s.textContent = parseInt(s.dataset.star) <= selectedStars ? '★' : '☆');
        stars.forEach(s => s.style.color = parseInt(s.dataset.star) <= selectedStars ? '#f5c518' : 'inherit');
      });
      star.addEventListener('mouseenter', () => {
        const hov = parseInt(star.dataset.star);
        stars.forEach(s => s.textContent = parseInt(s.dataset.star) <= hov ? '★' : '☆');
      });
      star.addEventListener('mouseleave', () => {
        stars.forEach(s => s.textContent = parseInt(s.dataset.star) <= selectedStars ? '★' : '☆');
      });
      star.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') star.click(); });
    });
  }

  if (ratingForm) {
    ratingForm.addEventListener('submit', e => {
      e.preventDefault();
      if (selectedStars === 0) { showToast('Bitte waehlen Sie eine Sternanzahl.', 'danger'); return; }
      const currentUser = Auth.getCurrentUser();
      if (!currentUser) { showToast('Bitte anmelden.', 'danger'); return; }
      saveRating(movieId, { stars: selectedStars, text: document.getElementById('ratingText').value.trim(), user: currentUser.firstName + ' ' + currentUser.lastName, date: new Date().toISOString() });
      document.getElementById('ratingText').value = '';
      selectedStars = 0;
      if (starSelector) starSelector.querySelectorAll('[data-star]').forEach(s => { s.textContent = '☆'; s.style.color = ''; });
      document.getElementById('selectedStars').value = '0';
      showToast('Bewertung gespeichert!', 'success');
      renderRatings();
    });
  }

  renderRatings();

  // TMDB-Daten laden (Bewertung, Cast, Aehnliches, Backdrop)
  if (typeof enrichMovieDetailPage === 'function') {
    enrichMovieDetailPage(movie);
  }

  // Render showtimes for this movie
  const showtimesList = document.getElementById('movieShowtimesList');
  if (showtimesList) {
    const movieShowtimes = showtimes.filter(st => st.movieId === movieId);
    if (movieShowtimes.length === 0) {
      showtimesList.innerHTML = '<p>Keine Spielzeiten verfügbar.</p>';
    } else {
      showtimesList.innerHTML = `<div class="showtimes-grid">${movieShowtimes.map(st => `
        <div class="showtime-item">
          <div class="showtime-item-left">
            <div class="showtime-item-time">${st.time} Uhr</div>
            <div class="showtime-item-info">
              <span class="badge badge-format">${st.format}</span>
              <span class="badge badge-genre">${st.language}</span>
              <span>📅 ${formatDateShort(st.date)}</span>
              <span>🏛 ${st.hall}</span>
              ${st.accessible ? '<span class="badge badge-info">♿</span>' : ''}
            </div>
            <div class="showtime-item-seats ${st.availableSeats < 10 ? 'low' : ''}">
              ${st.availableSeats} Plätze frei
            </div>
          </div>
          <a href="${BASE}seat-selection.html?showtimeId=${st.id}" class="btn btn-primary">Buchen</a>
        </div>`).join('')}</div>`;
    }
  }
}

/* ============================================================
   SHOWTIMES PAGE (showtimes.html)
   ============================================================ */
async function initShowtimesPage() {
  const container = document.getElementById('showtimesContainer');
  if (!container) return;

  const [showtimes, movies] = await Promise.all([getShowtimes(), getMovies()]);

  const dateFilter = document.getElementById('dateFilter');
  const movieFilter = document.getElementById('movieFilter');
  const formatFilter = document.getElementById('formatFilter');
  const langFilter = document.getElementById('langFilter');
  const accessibleFilter = document.getElementById('accessibleFilter');
  const resetBtn = document.getElementById('resetFilter');

  // Pre-filter by movieId from URL
  const preMovieId = getURLParam('movieId');

  // Populate movie filter
  if (movieFilter) {
    movies.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.title;
      movieFilter.appendChild(opt);
    });
    if (preMovieId) movieFilter.value = preMovieId;
  }

  function applyFilters() {
    const date = dateFilter ? dateFilter.value : '';
    const movieId = movieFilter ? movieFilter.value : '';
    const format = formatFilter ? formatFilter.value : '';
    const lang = langFilter ? langFilter.value : '';
    const accessible = accessibleFilter ? accessibleFilter.value : '';

    let filtered = showtimes.filter(st => {
      if (date && st.date !== date) return false;
      if (movieId && st.movieId !== parseInt(movieId)) return false;
      if (format && st.format !== format) return false;
      if (lang && st.language !== lang) return false;
      if (accessible === 'true' && !st.accessible) return false;
      return true;
    });

    // Group by date
    const grouped = {};
    filtered.forEach(st => {
      if (!grouped[st.date]) grouped[st.date] = [];
      grouped[st.date].push(st);
    });

    if (Object.keys(grouped).length === 0) {
      container.innerHTML = '<p class="loading">Keine Spielzeiten gefunden.</p>';
      return;
    }

    container.innerHTML = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, sts]) => `
      <div class="showtime-day-group">
        <h2 class="showtime-day-title">${formatDate(date)}</h2>
        <div class="showtimes-grid">
          ${sts.map(st => {
            const movie = movies.find(m => m.id === st.movieId);
            if (!movie) return '';
            return `
              <div class="showtime-card">
                <div class="showtime-movie-title">${escapeHtml(movie.title)}</div>
                <div class="showtime-meta">
                  <span class="showtime-time-badge">${st.time}</span>
                  <span class="badge badge-format">${st.format}</span>
                  <span class="badge badge-genre">${st.language}</span>
                  <span>🏛 ${st.hall}</span>
                  ${st.accessible ? '<span class="badge badge-info" title="Barrierefreie Plaetze verfuegbar">♿ Barrierefrei</span>' : ''}
                </div>
                <div class="showtime-availability ${st.availableSeats < 10 ? 'low' : ''}">
                  ${st.availableSeats < 10 ? '⚠️ Nur noch ' : '✅ '} ${st.availableSeats} Plaetze frei
                </div>
                <a href="${BASE}seat-selection.html?showtimeId=${st.id}" class="btn btn-primary btn-sm">Tickets buchen</a>
              </div>`;
          }).join('')}
        </div>
      </div>`).join('');
  }

  [dateFilter, movieFilter, formatFilter, langFilter].forEach(el => {
    if (el) el.addEventListener('change', applyFilters);
  });

  if (accessibleFilter) accessibleFilter.addEventListener('change', applyFilters);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (dateFilter) dateFilter.value = '';
      if (movieFilter) movieFilter.value = '';
      if (formatFilter) formatFilter.value = '';
      if (langFilter) langFilter.value = '';
      if (accessibleFilter) accessibleFilter.value = '';
      applyFilters();
    });
  }

  applyFilters();
}

/* ============================================================
   PAGE INIT ROUTER
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const href = window.location.href;

  // Detect page by DOM elements (works with file:// protocol)
  const hasFeaturedMovies = !!document.getElementById('featuredMovies');
  const hasMoviesGrid = !!document.getElementById('moviesGrid');
  const hasMovieDetail = !!document.getElementById('movieDetail');
  const hasShowtimesContainer = !!document.getElementById('showtimesContainer');

  if (hasFeaturedMovies) {
    initHomePage();
  } else if (hasMoviesGrid && !hasMovieDetail) {
    initMoviesPage();
  } else if (hasMovieDetail) {
    initMovieDetailPage();
  } else if (hasShowtimesContainer) {
    initShowtimesPage();
  }
});
