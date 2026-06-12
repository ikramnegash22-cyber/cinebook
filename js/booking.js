/**
 * CineBook – booking.js
 * Seat selection, checkout, confirmation logic
 */

'use strict';

/* ============================================================
   SEAT SELECTION PAGE
   ============================================================ */
async function initSeatSelectionPage() {
  const seatMap = document.getElementById('seatMap');
  const showtimeInfo = document.getElementById('showtimeInfo');
  if (!seatMap) return;

  let showtimeId = parseInt(getURLParam('showtimeId'));
  // Demo-Fallback: wenn keine showtimeId, nimm die erste verfügbare
  if (!showtimeId) {
    const allShowtimes = await getShowtimes();
    if (allShowtimes.length > 0) {
      showtimeId = allShowtimes[0].id;
    } else {
      seatMap.innerHTML = '<p style="padding:2rem;text-align:center">Keine Vorstellung gefunden. <a href="showtimes.html">Zu den Spielzeiten</a></p>';
      return;
    }
  }

  const [showtimes, movies] = await Promise.all([getShowtimes(), getMovies()]);
  const showtime = showtimes.find(s => s.id === showtimeId);
  if (!showtime) { seatMap.innerHTML = '<p>Vorstellung nicht gefunden.</p>'; return; }

  const movie = movies.find(m => m.id === showtime.movieId);
  if (!movie) { seatMap.innerHTML = '<p>Film nicht gefunden.</p>'; return; }

  // Store in session for checkout
  sessionStorage.setItem('cinebook_showtime', JSON.stringify(showtime));
  sessionStorage.setItem('cinebook_movie', JSON.stringify(movie));

  // Show showtime info
  if (showtimeInfo) {
    showtimeInfo.innerHTML = `
      <strong>🎬 ${escapeHtml(movie.title)}</strong>
      &nbsp;|&nbsp; 📅 ${formatDateShort(showtime.date)}
      &nbsp;|&nbsp; 🕐 ${showtime.time} Uhr
      &nbsp;|&nbsp; 🏛 ${showtime.hall}
      &nbsp;|&nbsp; <span class="badge badge-format">${showtime.format}</span>
      &nbsp;|&nbsp; <span class="badge badge-genre">${showtime.language}</span>
    `;
  }

  // Show prices
  ['Normal','Student','Senior','Vip'].forEach(type => {
    const el = document.getElementById('price' + type);
    if (el && movie.price) {
      el.textContent = formatPrice(movie.price[type.toLowerCase()]);
    }
  });

  // Render seat map
  const layout = showtime.seats.layout;
  const rows = showtime.seats.rows;
  let selectedSeats = [];

  // Hilfsfunktion: ist ein Sitz ein VIP-Platz?
  function isVipSeat(seatId) {
    const row = seatId.charAt(0);
    return layout[row] && layout[row].some(s => s === 'vip');
  }

  function getTicketType() {
    const radio = document.querySelector('input[name="ticketType"]:checked');
    return radio ? radio.value : 'normal';
  }

  // Preis für einen einzelnen Sitz (VIP-Sitze immer VIP-Preis)
  function getPriceForSeat(seatId) {
    if (!movie.price) return 0;
    if (isVipSeat(seatId)) return movie.price.vip;
    return movie.price[getTicketType()] || movie.price.normal;
  }

  function getTotalPrice() {
    return selectedSeats.reduce((sum, s) => sum + getPriceForSeat(s), 0);
  }

  function updateSummary() {
    const countEl = document.getElementById('selectedCount');
    const totalEl = document.getElementById('totalPrice');
    const listEl = document.getElementById('selectedSeatsList');
    const checkoutBtn = document.getElementById('proceedToCheckout');

    if (countEl) countEl.textContent = selectedSeats.length;
    if (totalEl) totalEl.textContent = formatPrice(getTotalPrice());
    if (listEl) {
      if (selectedSeats.length === 0) {
        listEl.innerHTML = '<p class="placeholder-text">Noch keine Plätze ausgewählt</p>';
      } else {
        listEl.innerHTML = selectedSeats.map(s => {
          const vip = isVipSeat(s);
          return '<div>' + s + (vip ? ' <span class="badge badge-warning">VIP</span>' : '') +
            ' – ' + formatPrice(getPriceForSeat(s)) + '</div>';
        }).join('');
      }
    }
    if (checkoutBtn) checkoutBtn.disabled = selectedSeats.length === 0;
  }

  function renderMap() {
    seatMap.innerHTML = rows.map(row => {
      const seats = layout[row];
      return `<div class="seat-row">
        <span class="seat-row-label" aria-hidden="true">${row}</span>
        ${seats.map((status, i) => {
          const seatId = `${row}${i + 1}`;
          const isSelected = selectedSeats.includes(seatId);
          let cls = 'seat ';
          let label = `Reihe ${row}, Platz ${i + 1}`;
          let disabled = false;
          if (status === 'booked') {
            cls += 'seat-booked'; disabled = true; label += ' (besetzt)';
          } else if (isSelected) {
            if (status === 'vip') cls += 'seat-selected';
            else if (status === 'accessible') cls += 'seat-selected';
            else cls += 'seat-selected';
            label += ' (ausgewaehlt)';
          } else if (status === 'vip') {
            cls += 'seat-vip'; label += ' VIP';
          } else if (status === 'accessible') {
            cls += 'seat-accessible'; label += ' (Rollstuhlplatz, verfuegbar)';
          } else {
            cls += 'seat-available'; label += ' (verfuegbar)';
          }
          var content = (status === 'accessible' && !isSelected) ? '♿' : (i + 1);
          return '<button class="' + cls + '" data-seat="' + seatId + '" aria-label="' + label + '" aria-pressed="' + isSelected + '" ' + (disabled ? 'disabled aria-disabled="true"' : '') + '>' + content + '</button>';
        }).join('')}
      </div>`;
    }).join('');

    // Attach click handlers
    seatMap.querySelectorAll('.seat:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const seatId = btn.dataset.seat;
        if (selectedSeats.includes(seatId)) {
          selectedSeats = selectedSeats.filter(s => s !== seatId);
        } else {
          selectedSeats.push(seatId);
        }
        renderMap();
        updateSummary();
      });
    });
  }

  renderMap();
  updateSummary();

  // Re-update price on ticket type change
  document.querySelectorAll('input[name="ticketType"]').forEach(r => {
    r.addEventListener('change', updateSummary);
  });

  // Proceed to checkout
  const checkoutBtn = document.getElementById('proceedToCheckout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      // Gast-Buchung erlaubt - kein Login erforderlich
      sessionStorage.setItem('cinebook_seats', JSON.stringify(selectedSeats));
      sessionStorage.setItem('cinebook_ticket_type', getTicketType());
      sessionStorage.setItem('cinebook_total', getTotalPrice());
      const seatPrices = {};
      selectedSeats.forEach(s => { seatPrices[s] = getPriceForSeat(s); });
      sessionStorage.setItem('cinebook_seat_prices', JSON.stringify(seatPrices));
      window.location.href = BASE + 'checkout.html';
    });
  }
}

/* ============================================================
   CHECKOUT PAGE
   ============================================================ */
async function initCheckoutPage() {
  const orderDetails = document.getElementById('orderDetails');
  if (!orderDetails) return;

  // Gast-Checkout erlaubt - kein Login erforderlich
  const isGuest = !Auth.isLoggedIn();

  const showtime = JSON.parse(sessionStorage.getItem('cinebook_showtime') || 'null');
  const movie = JSON.parse(sessionStorage.getItem('cinebook_movie') || 'null');
  const seats = JSON.parse(sessionStorage.getItem('cinebook_seats') || '[]');
  const ticketType = sessionStorage.getItem('cinebook_ticket_type') || 'normal';
  const total = parseFloat(sessionStorage.getItem('cinebook_total') || '0');

  if (!showtime || !movie || seats.length === 0) {
    orderDetails.innerHTML = '<p>Keine Buchungsdaten gefunden. <a href="showtimes.html">Zurück zu Spielzeiten</a></p>';
    return;
  }

  const ticketTypeLabels = { normal: 'Normal', student: 'Student', senior: 'Senior', vip: 'VIP' };

  orderDetails.innerHTML = `
    <div class="order-detail-row"><span>Film:</span><strong>${escapeHtml(movie.title)}</strong></div>
    <div class="order-detail-row"><span>Datum:</span><span>${formatDateShort(showtime.date)}</span></div>
    <div class="order-detail-row"><span>Uhrzeit:</span><span>${showtime.time} Uhr</span></div>
    <div class="order-detail-row"><span>Saal:</span><span>${showtime.hall}</span></div>
    <div class="order-detail-row"><span>Format:</span><span>${showtime.format} | ${showtime.language}</span></div>
    <div class="order-detail-row"><span>Sitze:</span><span>${seats.join(', ')}</span></div>
    <div class="order-detail-row"><span>Ticketart:</span><span>${ticketTypeLabels[ticketType] || ticketType}</span></div>
    <div class="order-detail-row"><span>Anzahl:</span><span>${seats.length}</span></div>
    <div class="order-detail-total"><span>Gesamt:</span><strong>${formatPrice(total)}</strong></div>
    ${isGuest ? '<div class="order-detail-row" style="color:var(--color-info);margin-top:8px"><span>👤 Gast-Buchung</span><span>Kein Account noetig</span></div>' : ''}
  `;

  // Gast-Bereich anzeigen wenn nicht eingeloggt
  const guestSection = document.getElementById('guestSection');
  if (guestSection) {
    if (isGuest) {
      guestSection.classList.remove('hidden');
      const loginLink = document.getElementById('showLoginFromCheckout');
      if (loginLink) loginLink.addEventListener('click', e => { e.preventDefault(); document.getElementById('loginBtn')?.click(); });
    } else {
      guestSection.classList.add('hidden');
    }
  }

  // Pre-fill email for logged-in users
  const emailInput = document.getElementById('bookingEmail');
  if (emailInput && !isGuest) {
    const currentUser = Auth.getCurrentUser();
    if (currentUser && currentUser.email) emailInput.value = currentUser.email;
  }

  // Payment method toggle
  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
  paymentRadios.forEach(r => {
    r.addEventListener('change', () => {
      document.getElementById('creditcardFields')?.classList.add('hidden');
      document.getElementById('paypalFields')?.classList.add('hidden');
      document.getElementById('cashFields')?.classList.add('hidden');
      const target = document.getElementById(r.value + 'Fields');
      if (target) target.classList.remove('hidden');
    });
  });

  // Back button
  const backBtn = document.getElementById('backToSeats');
  if (backBtn) {
    backBtn.href = BASE + 'seat-selection.html?showtimeId=' + showtime.id;
  }

  // Submit
  const form = document.getElementById('paymentForm');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const agreed = document.getElementById('agreeTerms')?.checked;
      if (!agreed) {
        showToast('Bitte akzeptieren Sie die AGB.', 'danger');
        return;
      }

      // Validate email
      const emailEl = document.getElementById('bookingEmail');
      const emailVal = emailEl ? emailEl.value.trim() : '';
      const emailErr = document.getElementById('emailError');
      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        if (emailErr) emailErr.classList.remove('hidden');
        if (emailEl) emailEl.focus();
        return;
      }
      if (emailErr) emailErr.classList.add('hidden');

      const user = Auth.getCurrentUser();
      const guestNameEl = document.getElementById('guestName');
      const guestName = (guestNameEl && guestNameEl.value.trim()) ? guestNameEl.value.trim() : null;
      const userName = user ? (user.firstName + ' ' + user.lastName) : (guestName || 'Gast');

      const booking = {
        bookingId: generateBookingId(),
        showtimeId: showtime.id,
        movieId: movie.id,
        movieTitle: movie.title,
        date: showtime.date,
        time: showtime.time,
        hall: showtime.hall,
        format: showtime.format,
        seats: seats,
        ticketType: ticketType,
        totalPrice: total,
        bookedAt: new Date().toISOString(),
        status: 'confirmed',
        userId: user ? user.id : null,
        userName: userName,
        userEmail: emailVal,
        isGuest: !user
      };

      BookingStorage.save(booking);
      sessionStorage.setItem('cinebook_booking', JSON.stringify(booking));

      // E-Mail Bestaetigung senden
      try {
        const emailSent = await sendBookingConfirmationEmail(booking);
        if (emailSent) {
          showToast('Bestaetigung wurde an ' + emailVal + ' gesendet!', 'success', 4000);
        }
      } catch(e) {
        console.warn('E-Mail konnte nicht gesendet werden:', e);
      }

      // Clear booking session data
      ['cinebook_seats', 'cinebook_ticket_type', 'cinebook_total'].forEach(k =>
        sessionStorage.removeItem(k)
      );

      window.location.href = BASE + 'confirmation.html';
    });
  }
}

/* ============================================================
   CONFIRMATION PAGE
   ============================================================ */
function initConfirmationPage() {
  const detailsEl = document.getElementById('confirmationDetails');
  if (!detailsEl) return;

  const booking = JSON.parse(sessionStorage.getItem('cinebook_booking') || 'null');
  if (!booking) {
    detailsEl.innerHTML = '<p>Keine Buchungsdaten gefunden.</p>';
    return;
  }

  const ticketTypeLabels = { normal: 'Normal', student: 'Student', senior: 'Senior', vip: 'VIP' };

  // QR-Code generieren
  const qrContent = encodeURIComponent(
    'CineBook Ticket | ID: ' + booking.bookingId +
    ' | Film: ' + booking.movieTitle +
    ' | ' + booking.date + ' ' + booking.time +
    ' | ' + booking.hall +
    ' | Sitze: ' + booking.seats.join(', ')
  );
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=ffffff&bgcolor=131313&data=' + qrContent;

  detailsEl.style.padding = '0';
  detailsEl.style.overflow = 'hidden';
  detailsEl.style.border = 'none';
  detailsEl.style.background = 'none';
  detailsEl.style.boxShadow = 'none';

  detailsEl.innerHTML = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">

      <!-- HEADER: roter Balken wie Kinopolis -->
      <div style="background:#e2000a;padding:16px 24px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:1.8rem;">🎬</span>
        <div>
          <div style="color:#fff;font-size:1.1rem;font-weight:700;letter-spacing:1px;">CineBook</div>
          <div style="color:rgba(255,255,255,0.85);font-size:0.8rem;">Ihr Kinobuchungssystem</div>
        </div>
      </div>

      <!-- BEGRÜSSUNG: dunkelgrau wie Kinopolis -->
      <div style="background:#2c2c2c;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="color:#fff;font-size:1.1rem;line-height:1.4;">Hallo <strong>${escapeHtml(booking.userName)},</strong></div>
          <div style="color:rgba(255,255,255,0.75);font-size:0.875rem;margin-top:4px;">Vielen Dank fuer Ihre Buchung.<br/>Wir freuen uns auf Ihren Besuch!</div>
        </div>
        <span style="font-size:3rem;opacity:0.4;">🎟️</span>
      </div>

      <!-- FILM-INFO BLOCK: schwarz wie Kinopolis -->
      <div style="background:#131313;padding:20px 24px;">
        <div style="color:#fff;font-size:1.2rem;font-weight:700;margin-bottom:6px;">${escapeHtml(booking.movieTitle)}</div>
        <div style="color:rgba(255,255,255,0.8);font-size:0.95rem;font-weight:600;margin-bottom:4px;">
          ${formatDateShort(booking.date)} &nbsp;|&nbsp; ${booking.time} Uhr &nbsp;|&nbsp; CineBook
        </div>
        <div style="color:rgba(255,255,255,0.7);font-size:0.875rem;">
          ${booking.hall} &nbsp;|&nbsp; ${booking.format} &nbsp;|&nbsp; Reihe/Sitz: ${booking.seats.join(', ')}
        </div>
      </div>

      <!-- TICKET-BEREICH: schwarz mit Film-Poster links, QR rechts -->
      <div style="background:#131313;padding:0 24px 24px;display:flex;gap:16px;align-items:flex-start;border-bottom:3px dashed #333;">
        <!-- links: Ticket-Info -->
        <div style="flex:1;">
          <div style="color:rgba(255,255,255,0.5);font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Ihre Kinotickets</div>

          <!-- Ticketart -->
          <div style="background:#222;border-radius:8px;padding:10px 14px;margin-bottom:8px;">
            <div style="color:rgba(255,255,255,0.5);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Ticketart</div>
            <div style="color:#fff;font-size:0.95rem;font-weight:600;">${ticketTypeLabels[booking.ticketType] || booking.ticketType}</div>
          </div>

          <!-- Anzahl Sitze -->
          <div style="background:#222;border-radius:8px;padding:10px 14px;margin-bottom:8px;">
            <div style="color:rgba(255,255,255,0.5);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Plaetze</div>
            <div style="color:#fff;font-size:0.95rem;font-weight:600;">${booking.seats.join(' &nbsp; ')}</div>
          </div>

          <!-- Preis -->
          <div style="background:#e2000a;border-radius:8px;padding:10px 14px;">
            <div style="color:rgba(255,255,255,0.8);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Gesamtpreis</div>
            <div style="color:#fff;font-size:1.2rem;font-weight:700;">${formatPrice(booking.totalPrice)}</div>
          </div>
        </div>

        <!-- rechts: QR-Code -->
        <div style="text-align:center;flex-shrink:0;">
          <img src="${qrUrl}" alt="QR-Code ${booking.bookingId}" width="140" height="140" style="display:block;border-radius:4px;"/>
          <div style="color:rgba(255,255,255,0.6);font-size:0.7rem;margin-top:6px;line-height:1.3;">An der Kasse<br/>vorzeigen</div>
          <div style="color:#f5c518;font-size:0.7rem;font-weight:700;margin-top:4px;">${booking.bookingId}</div>
        </div>
      </div>

      <!-- BUCHUNGS-DETAILS: weiss wie Kinopolis -->
      <div style="background:#fff;padding:20px 24px;">
        <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:12px;">Buchungsdetails</div>
        <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:7px 0;color:#666;">Buchungs-ID</td>
            <td style="padding:7px 0;font-weight:600;text-align:right;">${booking.bookingId}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:7px 0;color:#666;">Film</td>
            <td style="padding:7px 0;font-weight:600;text-align:right;">${escapeHtml(booking.movieTitle)}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:7px 0;color:#666;">Datum & Uhrzeit</td>
            <td style="padding:7px 0;font-weight:600;text-align:right;">${formatDateShort(booking.date)}, ${booking.time} Uhr</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:7px 0;color:#666;">Saal & Format</td>
            <td style="padding:7px 0;font-weight:600;text-align:right;">${booking.hall} &nbsp;|&nbsp; ${booking.format}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:7px 0;color:#666;">Sitzplaetze</td>
            <td style="padding:7px 0;font-weight:600;text-align:right;">${booking.seats.join(', ')}</td>
          </tr>
          ${booking.userEmail ? `<tr style="border-bottom:1px solid #eee;">
            <td style="padding:7px 0;color:#666;">E-Mail</td>
            <td style="padding:7px 0;font-weight:600;text-align:right;">${escapeHtml(booking.userEmail)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:12px 0 4px;font-weight:700;font-size:1rem;">Gesamtpreis</td>
            <td style="padding:12px 0 4px;font-weight:700;font-size:1rem;text-align:right;color:#e2000a;">${formatPrice(booking.totalPrice)}</td>
          </tr>
        </table>
      </div>

      <!-- E-MAIL STATUS -->
      ${booking.userEmail ? `
      <div style="background:#e8f5e9;padding:14px 24px;display:flex;align-items:center;gap:10px;border-top:1px solid #c8e6c9;">
        <span style="font-size:1.3rem;">📧</span>
        <div>
          <div style="font-size:0.875rem;font-weight:600;color:#2e7d32;">Bestaetigungs-E-Mail gesendet</div>
          <div style="font-size:0.8rem;color:#388e3c;">${escapeHtml(booking.userEmail)}</div>
        </div>
      </div>` : ''}

      <!-- FOOTER -->
      <div style="background:#131313;padding:14px 24px;text-align:center;">
        <div style="color:rgba(255,255,255,0.4);font-size:0.75rem;">CineBook &copy; 2026 &nbsp;|&nbsp; Ihr Kinobuchungssystem</div>
      </div>
    </div>
  `;

  // Clear booking session
  sessionStorage.removeItem('cinebook_booking');
}

/* ============================================================
   PAGE INIT ROUTER
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const href = window.location.href;

  // Detect page by pathname OR by presence of key elements
  const hasSeatMap = !!document.getElementById('seatMap');
  const hasOrderDetails = !!document.getElementById('orderDetails');
  const hasConfirmationDetails = !!document.getElementById('confirmationDetails');

  if (path.includes('seat-selection') || href.includes('seat-selection') || hasSeatMap) {
    initSeatSelectionPage();
  } else if (path.includes('checkout') || href.includes('checkout') || hasOrderDetails) {
    initCheckoutPage();
  } else if (path.includes('confirmation') || href.includes('confirmation') || hasConfirmationDetails) {
    initConfirmationPage();
  }
});
