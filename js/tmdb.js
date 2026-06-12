/**
 * CineBook – tmdb.js
 * TMDB API Integration für erweiterte Filmdaten
 * API Key: 21d1191c3b8b8f832bc896d8b0f40beb
 */

'use strict';

const TMDB = {
  API_KEY: '21d1191c3b8b8f832bc896d8b0f40beb',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMG_W500: 'https://image.tmdb.org/t/p/w500',
  IMG_ORIG: 'https://image.tmdb.org/t/p/original',
  IMG_W1280: 'https://image.tmdb.org/t/p/w1280',
  LANG: 'de-DE',

  // TMDB Film-IDs fuer unsere 12 Filme
  MOVIE_IDS: {
    1: 27205,   // Inception
    2: 155,     // The Dark Knight
    3: 157336,  // Interstellar
    4: 299534,  // Avengers: Endgame
    5: 238,     // Der Pate
    6: 680,     // Pulp Fiction
    7: 603,     // The Matrix
    8: 872585,  // Oppenheimer
    9: 346698,  // Barbie
    10: 693134, // Dune: Part Two
    11: 634649, // Spider-Man: No Way Home
    12: 792307  // Poor Things
  },

  async fetch(endpoint) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const url = this.BASE_URL + endpoint + sep + 'api_key=' + this.API_KEY + '&language=' + this.LANG;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('TMDB ' + res.status);
      return await res.json();
    } catch(e) {
      console.warn('TMDB fetch error:', endpoint, e.message);
      return null;
    }
  },

  // Film-Details (Bewertung, Laufzeit, etc.)
  async getMovieDetails(tmdbId) {
    return await this.fetch('/movie/' + tmdbId);
  },

  // Deutsche Beschreibung
  async getMovieTranslation(tmdbId) {
    return await this.fetch('/movie/' + tmdbId + '?language=de-DE');
  },

  // Trailer
  async getTrailer(tmdbId) {
    const data = await this.fetch('/movie/' + tmdbId + '/videos');
    if (!data || !data.results) return null;
    const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
      || data.results.find(v => v.site === 'YouTube');
    return trailer ? 'https://www.youtube.com/watch?v=' + trailer.key : null;
  },

  // Backdrop-Bild
  async getBackdrop(tmdbId) {
    const data = await this.fetch('/movie/' + tmdbId + '/images?include_image_language=de,en,null');
    if (!data || !data.backdrops || data.backdrops.length === 0) return null;
    return this.IMG_W1280 + data.backdrops[0].file_path;
  },

  // Cast & Crew
  async getCredits(tmdbId) {
    return await this.fetch('/movie/' + tmdbId + '/credits');
  },

  // Aehnliche Filme
  async getSimilar(tmdbId) {
    const data = await this.fetch('/movie/' + tmdbId + '/similar');
    return data ? (data.results || []).slice(0, 6) : [];
  },

  // Alles auf einmal laden
  async getFullMovieData(cinebookId) {
    const tmdbId = this.MOVIE_IDS[cinebookId];
    if (!tmdbId) return null;

    const [details, credits, similar, videos, images] = await Promise.all([
      this.getMovieDetails(tmdbId),
      this.getCredits(tmdbId),
      this.getSimilar(tmdbId),
      this.fetch('/movie/' + tmdbId + '/videos'),
      this.fetch('/movie/' + tmdbId + '/images?include_image_language=de,en,null')
    ]);

    return { details, credits, similar, videos, images, tmdbId };
  }
};

/**
 * Erweitert die Filmdetailseite mit TMDB-Daten
 */
async function enrichMovieDetailPage(movie) {
  const tmdbId = TMDB.MOVIE_IDS[movie.id];
  if (!tmdbId) return;

  try {
    const [details, credits, similar, videosData, imagesData] = await Promise.all([
      TMDB.getMovieDetails(tmdbId),
      TMDB.getCredits(tmdbId),
      TMDB.getSimilar(tmdbId),
      TMDB.fetch('/movie/' + tmdbId + '/videos'),
      TMDB.fetch('/movie/' + tmdbId + '/images?include_image_language=de,en,null')
    ]);

    // 1. TMDB-Bewertung einfügen
    if (details) {
      const ratingEl = document.getElementById('tmdbRating');
      if (ratingEl) {
        const stars = Math.round(details.vote_average / 2);
        ratingEl.innerHTML =
          '<span style="color:#f5c518;font-size:1.1rem">' + '★'.repeat(stars) + '☆'.repeat(5-stars) + '</span>' +
          ' <strong>' + details.vote_average.toFixed(1) + '</strong>/10' +
          ' <span style="color:var(--color-text-muted);font-size:0.8rem">(' + details.vote_count.toLocaleString('de-DE') + ' Stimmen)</span>';
        ratingEl.style.display = 'flex';
        ratingEl.style.alignItems = 'center';
        ratingEl.style.gap = '6px';
      }

      // Deutsche Beschreibung wenn vorhanden
      if (details.overview) {
        const descEl = document.querySelector('.movie-detail-description');
        if (descEl && details.overview.length > 20) {
          descEl.textContent = details.overview;
        }
      }

      // Budget & Einnahmen
      const extraEl = document.getElementById('tmdbExtra');
      if (extraEl && (details.budget > 0 || details.revenue > 0)) {
        extraEl.innerHTML = '';
        if (details.budget > 0) {
          extraEl.innerHTML += '<div class="credit-item"><label>Budget</label><span>' + formatCurrency(details.budget) + '</span></div>';
        }
        if (details.revenue > 0) {
          extraEl.innerHTML += '<div class="credit-item"><label>Einnahmen</label><span>' + formatCurrency(details.revenue) + '</span></div>';
        }
        if (details.status) {
          extraEl.innerHTML += '<div class="credit-item"><label>Status</label><span>' + details.status + '</span></div>';
        }
      }
    }

    // 2. Backdrop-Bild als Hero-Hintergrund
    if (imagesData && imagesData.backdrops && imagesData.backdrops.length > 0) {
      const backdrop = TMDB.IMG_W1280 + imagesData.backdrops[0].file_path;
      const heroEl = document.getElementById('movieHeroBg');
      if (heroEl) {
        heroEl.style.backgroundImage = 'linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.8)), url(' + backdrop + ')';
        heroEl.style.backgroundSize = 'cover';
        heroEl.style.backgroundPosition = 'center';
      }
    }

    // 3. Offiziellen Trailer via TMDB aktualisieren (nur wenn noch kein Trailer gesetzt)
    if (videosData && videosData.results) {
      const trailer = videosData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
        || videosData.results.find(v => v.site === 'YouTube');
      if (trailer) {
        const trailerBtn = document.getElementById('trailerBtn');
        if (trailerBtn && !trailerBtn.dataset.ytId) {
          // Nur setzen wenn noch kein ytId gesetzt wurde
          trailerBtn.dataset.ytId = trailer.key;
          trailerBtn.onclick = function() {
            const modal = document.getElementById('trailerModal');
            const frame = document.getElementById('trailerFrame');
            if (modal && frame) {
              frame.src = 'https://www.youtube.com/embed/' + trailer.key + '?autoplay=1';
              modal.classList.remove('hidden');
              document.body.style.overflow = 'hidden';
            }
          };
        }
      }
    }

    // 4. Cast mit Fotos
    if (credits && credits.cast) {
      const castEl = document.getElementById('tmdbCast');
      if (castEl) {
        const topCast = credits.cast.slice(0, 6);
        castEl.innerHTML = topCast.map(actor => {
          const photo = actor.profile_path
            ? '<img src="' + TMDB.IMG_W500 + actor.profile_path + '" alt="' + actor.name + '" style="width:60px;height:60px;border-radius:50%;object-fit:cover;" onerror="this.style.display=\'none\'"/>'
            : '<div style="width:60px;height:60px;border-radius:50%;background:#333;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">👤</div>';
          return '<div style="text-align:center;min-width:80px;">' +
            photo +
            '<div style="font-size:0.75rem;font-weight:600;margin-top:4px;color:var(--color-text)">' + actor.name + '</div>' +
            '<div style="font-size:0.7rem;color:var(--color-text-muted)">' + actor.character + '</div>' +
            '</div>';
        }).join('');
      }
    }

    // 5. Aehnliche Filme
    if (similar && similar.length > 0) {
      const similarEl = document.getElementById('tmdbSimilar');
      if (similarEl) {
        similarEl.innerHTML = similar.map(m => {
          const poster = m.poster_path ? TMDB.IMG_W500 + m.poster_path : '';
          return '<div style="min-width:120px;max-width:120px;cursor:pointer;" onclick="window.location.href=\'movies.html\'">' +
            (poster ? '<img src="' + poster + '" alt="' + m.title + '" style="width:120px;height:180px;object-fit:cover;border-radius:8px;" onerror="this.parentElement.style.display=\'none\'"/>' : '') +
            '<div style="font-size:0.75rem;font-weight:600;margin-top:4px;color:var(--color-text);text-overflow:ellipsis;overflow:hidden;white-space:nowrap;">' + m.title + '</div>' +
            '<div style="font-size:0.7rem;color:#f5c518;">★ ' + m.vote_average.toFixed(1) + '</div>' +
            '</div>';
        }).join('');
      }
    }

  } catch(e) {
    console.warn('TMDB enrichment error:', e);
  }
}

/**
 * Laedt TMDB-Bewertungen fuer alle Filmkarten
 */
async function addTmdbRatingsToCards() {
  const cards = document.querySelectorAll('[data-movie-id]');
  if (cards.length === 0) return;

  const promises = Array.from(cards).map(async card => {
    const movieId = parseInt(card.dataset.movieId);
    const tmdbId = TMDB.MOVIE_IDS[movieId];
    if (!tmdbId) return;

    const details = await TMDB.getMovieDetails(tmdbId);
    if (!details) return;

    const ratingEl = card.querySelector('.tmdb-card-rating');
    if (ratingEl) {
      ratingEl.textContent = '⭐ ' + details.vote_average.toFixed(1);
      ratingEl.style.display = 'inline-block';
    }
  });

  await Promise.all(promises);
}

function formatCurrency(amount) {
  if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + ' Mrd. $';
  if (amount >= 1000000) return (amount / 1000000).toFixed(0) + ' Mio. $';
  return amount.toLocaleString('de-DE') + ' $';
}
