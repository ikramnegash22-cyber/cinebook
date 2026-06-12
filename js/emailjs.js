/**
 * CineBook – emailjs.js
 * E-Mail Buchungsbestaetigung via EmailJS
 */

'use strict';

// EmailJS Konfiguration
var EMAILJS_SERVICE_ID = 'service_gcn7jqp';
var EMAILJS_TEMPLATE_ID = 'template_3i5yi2z';
var EMAILJS_PUBLIC_KEY = 'JOMa_hKToE7Q8TTFh';

/**
 * Sendet eine Buchungsbestaetigung per E-Mail
 * @param {Object} booking - Das Buchungsobjekt
 * @returns {Promise}
 */
async function sendBookingConfirmationEmail(booking) {
  if (typeof emailjs === 'undefined') {
    console.warn('EmailJS nicht geladen.');
    return false;
  }

  try {
    const ticketTypeLabels = { normal: 'Normal', student: 'Student', senior: 'Senior', vip: 'VIP' };

    // QR-Code URL generieren
    const qrContent = encodeURIComponent(
      'CineBook Ticket\nID: ' + booking.bookingId +
      '\nFilm: ' + booking.movieTitle +
      '\nDatum: ' + booking.date + ' ' + booking.time +
      '\nSaal: ' + booking.hall +
      '\nSitze: ' + (Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats) +
      '\nPreis: ' + booking.totalPrice + ' EUR'
    );
    const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + qrContent;

    const ticketLabel = ticketTypeLabels[booking.ticketType] || booking.ticketType;
    const dateFormatted = formatDateShort ? formatDateShort(booking.date) : booking.date;
    const priceFormatted = formatPrice ? formatPrice(booking.totalPrice) : booking.totalPrice + ' EUR';
    const seatsFormatted = Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats;

    // HTML-E-Mail im KINOPOLIS-Stil
    const htmlEmail = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f4f4f4;padding:20px 0;">
  <div style="max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">

    <!-- HEADER: roter Balken -->
    <div style="background:#e2000a;padding:16px 24px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:1.8rem;">🎬</span>
      <div>
        <div style="color:#fff;font-size:1.1rem;font-weight:700;letter-spacing:1px;">CineBook</div>
        <div style="color:rgba(255,255,255,0.85);font-size:0.8rem;">Ihr Kinobuchungssystem</div>
      </div>
    </div>

    <!-- BEGRÜSSUNG: dunkelgrau -->
    <div style="background:#2c2c2c;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="color:#fff;font-size:1.1rem;line-height:1.4;">Hallo <strong>${booking.userName},</strong></div>
        <div style="color:rgba(255,255,255,0.75);font-size:0.875rem;margin-top:4px;">Vielen Dank fuer Ihre Buchung.<br/>Wir freuen uns auf Ihren Besuch!</div>
      </div>
      <span style="font-size:3rem;opacity:0.4;">🎟️</span>
    </div>

    <!-- FILM-INFO: schwarz -->
    <div style="background:#131313;padding:20px 24px;">
      <div style="color:#fff;font-size:1.2rem;font-weight:700;margin-bottom:6px;">${booking.movieTitle}</div>
      <div style="color:rgba(255,255,255,0.8);font-size:0.95rem;font-weight:600;margin-bottom:4px;">
        ${dateFormatted} &nbsp;|&nbsp; ${booking.time} Uhr &nbsp;|&nbsp; CineBook
      </div>
      <div style="color:rgba(255,255,255,0.7);font-size:0.875rem;">
        ${booking.hall} &nbsp;|&nbsp; ${booking.format} &nbsp;|&nbsp; Sitze: ${seatsFormatted}
      </div>
    </div>

    <!-- TICKET + QR: schwarz -->
    <div style="background:#131313;padding:0 24px 24px;display:flex;gap:16px;align-items:flex-start;border-bottom:3px dashed #333;">
      <div style="flex:1;">
        <div style="color:rgba(255,255,255,0.5);font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;padding-top:8px;">Ihre Kinotickets</div>
        <div style="background:#222;border-radius:8px;padding:10px 14px;margin-bottom:8px;">
          <div style="color:rgba(255,255,255,0.5);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Ticketart</div>
          <div style="color:#fff;font-size:0.95rem;font-weight:600;">${ticketLabel}</div>
        </div>
        <div style="background:#222;border-radius:8px;padding:10px 14px;margin-bottom:8px;">
          <div style="color:rgba(255,255,255,0.5);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Plaetze</div>
          <div style="color:#fff;font-size:0.95rem;font-weight:600;">${seatsFormatted}</div>
        </div>
        <div style="background:#e2000a;border-radius:8px;padding:10px 14px;">
          <div style="color:rgba(255,255,255,0.8);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;">Gesamtpreis</div>
          <div style="color:#fff;font-size:1.2rem;font-weight:700;">${priceFormatted}</div>
        </div>
      </div>
      <div style="text-align:center;flex-shrink:0;padding-top:8px;">
        <img src="${qrCodeUrl}" alt="QR-Code" width="140" height="140" style="display:block;border-radius:4px;"/>
        <div style="color:rgba(255,255,255,0.6);font-size:0.7rem;margin-top:6px;line-height:1.3;">An der Kasse<br/>vorzeigen</div>
        <div style="color:#f5c518;font-size:0.7rem;font-weight:700;margin-top:4px;">${booking.bookingId}</div>
      </div>
    </div>

    <!-- DETAILS: weiss -->
    <div style="background:#fff;padding:20px 24px;">
      <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:12px;">Buchungsdetails</div>
      <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
        <tr style="border-bottom:1px solid #eee;"><td style="padding:7px 0;color:#666;">Buchungs-ID</td><td style="padding:7px 0;font-weight:600;text-align:right;">${booking.bookingId}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:7px 0;color:#666;">Film</td><td style="padding:7px 0;font-weight:600;text-align:right;">${booking.movieTitle}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:7px 0;color:#666;">Datum &amp; Uhrzeit</td><td style="padding:7px 0;font-weight:600;text-align:right;">${dateFormatted}, ${booking.time} Uhr</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:7px 0;color:#666;">Saal &amp; Format</td><td style="padding:7px 0;font-weight:600;text-align:right;">${booking.hall} | ${booking.format}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:7px 0;color:#666;">Sitzplaetze</td><td style="padding:7px 0;font-weight:600;text-align:right;">${seatsFormatted}</td></tr>
        <tr><td style="padding:12px 0 4px;font-weight:700;font-size:1rem;">Gesamtpreis</td><td style="padding:12px 0 4px;font-weight:700;font-size:1rem;text-align:right;color:#e2000a;">${priceFormatted}</td></tr>
      </table>
    </div>

    <!-- FOOTER -->
    <div style="background:#131313;padding:14px 24px;text-align:center;">
      <div style="color:rgba(255,255,255,0.4);font-size:0.75rem;">CineBook &copy; 2026 &nbsp;|&nbsp; Ihr Kinobuchungssystem &nbsp;|&nbsp; noreply@cinebook.de</div>
    </div>
  </div>
</div>`;

    const templateParams = {
      // Empfaenger
      user_email: booking.userEmail,
      user_name: booking.userName,

      // HTML-E-Mail Inhalt
      html_content: htmlEmail,

      // Auch als Plaintext (Fallback)
      booking_id: booking.bookingId,
      movie_title: booking.movieTitle,
      date: dateFormatted,
      time: booking.time + ' Uhr',
      hall: booking.hall,
      format: booking.format,
      seats: seatsFormatted,
      ticket_type: ticketLabel,
      total_price: priceFormatted,
      qr_code_url: qrCodeUrl,

      // Meta
      reply_to: 'noreply@cinebook.de'
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('E-Mail gesendet:', response.status, response.text);
    return true;

  } catch (error) {
    console.error('E-Mail Fehler:', error);
    return false;
  }
}