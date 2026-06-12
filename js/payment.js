/**
 * CineBook – payment.js
 * Payment form validation and card formatting
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initPaymentForm();
});

function initPaymentForm() {
  // Card number formatting
  const cardNumber = document.getElementById('cardNumber');
  if (cardNumber) {
    cardNumber.addEventListener('input', e => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  // Expiry formatting
  const cardExpiry = document.getElementById('cardExpiry');
  if (cardExpiry) {
    cardExpiry.addEventListener('input', e => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2);
      e.target.value = val;
    });
  }

  // CVV - only digits
  const cardCvv = document.getElementById('cardCvv');
  if (cardCvv) {
    cardCvv.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });
  }

  // Payment method toggle
  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-fields').forEach(f => f.classList.add('hidden'));
      const target = document.getElementById(radio.value + 'Fields');
      if (target) target.classList.remove('hidden');
    });
  });

  // Validate credit card fields
  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) {
    paymentForm.addEventListener('submit', e => {
      const method = document.querySelector('input[name="paymentMethod"]:checked')?.value;
      if (method === 'creditcard') {
        const name = document.getElementById('cardName')?.value.trim();
        const number = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
        const expiry = document.getElementById('cardExpiry')?.value;
        const cvv = document.getElementById('cardCvv')?.value;
        const errDiv = document.getElementById('paymentError');

        let error = '';
        if (!name) error = 'Bitte geben Sie den Namen auf der Karte ein.';
        else if (number.length < 13) error = 'Bitte geben Sie eine gültige Kartennummer ein.';
        else if (!/^\d{2}\/\d{2}$/.test(expiry)) error = 'Bitte geben Sie ein gültiges Ablaufdatum ein (MM/JJ).';
        else if (cvv.length < 3) error = 'Bitte geben Sie einen gültigen CVV-Code ein.';

        if (error) {
          e.stopImmediatePropagation();
          if (errDiv) {
            errDiv.textContent = error;
            errDiv.classList.remove('hidden');
          }
        } else {
          if (errDiv) errDiv.classList.add('hidden');
        }
      }
    }, true); // capture phase so it runs before booking.js submit
  }
}