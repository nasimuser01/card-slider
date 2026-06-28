/**
 * Entry point. Wires the carousel to the shared modal and keeps the two
 * otherwise independent: the carousel reports which card was opened, and this
 * module decides what to do with it.
 */
import { createCarousel } from './carousel.js';
import { createModal } from './modal.js';

function init() {
  const carouselEl = document.querySelector('[data-carousel]');
  const modalEl = document.querySelector('[data-modal]');
  if (!carouselEl) return;

  const modal = modalEl ? createModal(modalEl) : null;

  const carousel = createCarousel(carouselEl, {
    onCardOpen(card, trigger) {
      if (!modal) return;
      modal.open(trigger, (dialog) => fillModal(dialog, card));
    },
  });

  carousel.init();
}

function fillModal(dialog, card) {
  const img = dialog.querySelector('[data-modal-image]');
  if (img) {
    img.src = card.image || '';
    img.alt = card.imageAlt || '';
  }

  setText(dialog, '[data-modal-tag]', card.tag);
  setText(dialog, '[data-modal-title]', card.title);
  setText(dialog, '[data-modal-date]', card.date);

  // `detail` is our own authored content, so injecting it as HTML is safe.
  // Sanitise here first if this ever comes from an untrusted source.
  const body = dialog.querySelector('[data-modal-body]');
  if (body) body.innerHTML = card.detail || `<p>${card.summary || ''}</p>`;

  const link = dialog.querySelector('[data-modal-link]');
  if (link) link.href = card.url || '#';
}

function setText(scope, selector, value) {
  const el = scope.querySelector(selector);
  if (!el) return;
  el.textContent = value || '';
  el.hidden = !value;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
