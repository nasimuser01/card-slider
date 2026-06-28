/**
 * Reusable accessible dialog. Moves focus into the dialog on open, traps Tab
 * inside it, closes on Escape / overlay / close button, and restores focus to
 * the element that opened it.
 *
 * The modal has no knowledge of cards; the caller passes a fill() callback to
 * populate its content.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function createModal(root) {
  const dialog = root.querySelector('[role="dialog"]');
  const overlay = root.querySelector('[data-modal-overlay]');
  const closeBtn = root.querySelector('[data-modal-close]');

  let lastFocused = null;
  let isOpen = false;

  function focusable() {
    return Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null,
    );
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;

    const items = focusable();
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];

    // Wrap focus at the ends so Tab never escapes the dialog.
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function open(trigger, fill) {
    if (isOpen) return;

    lastFocused = trigger || document.activeElement;
    if (typeof fill === 'function') fill(dialog);

    root.hidden = false;
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onKeydown);
    isOpen = true;

    (focusable()[0] || dialog).focus();
  }

  function close() {
    if (!isOpen) return;

    root.hidden = true;
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onKeydown);
    isOpen = false;

    lastFocused?.focus();
  }

  overlay?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);

  return { open, close };
}
