/**
 * Data-driven card carousel. Written as a factory so all state stays in the
 * closure rather than on `this` or the global scope. Pages a screenful at a
 * time (4 desktop / 2 tablet / 1 mobile) and delegates "card opened" back to
 * the caller via the onCardOpen callback.
 */

function escape(value = '') {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function createCarousel(root, { onCardOpen = () => {} } = {}) {
  const track = root.querySelector('[data-carousel-track]');
  const dots = root.querySelector('[data-carousel-dots]');
  const prevBtn = root.querySelector('[data-carousel-prev]');
  const nextBtn = root.querySelector('[data-carousel-next]');
  const status = root.querySelector('[data-carousel-status]');

  // Behaviour is configured from data-* attributes so the component is
  // reusable and CMS-friendly without code changes.
  const source = root.dataset.source;
  const perViewByWidth = {
    desktop: Number(root.dataset.perViewDesktop) || 4,
    tablet: Number(root.dataset.perViewTablet) || 2,
    mobile: Number(root.dataset.perViewMobile) || 1,
  };

  let cards = [];
  let page = 0;
  let perView = perViewByWidth.desktop;

  function currentPerView() {
    const w = window.innerWidth;
    if (w < 768) return perViewByWidth.mobile;
    if (w < 1024) return perViewByWidth.tablet;
    return perViewByWidth.desktop;
  }

  function pageCount() {
    return Math.max(1, Math.ceil(cards.length / perView));
  }

  async function loadCards() {
    const res = await fetch(source, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Cards not found: ${res.status}`);
    const data = await res.json();
    return data.cards || [];
  }

  // The title link is the card's single focusable element; CSS stretches it
  // over the whole card so the entire surface is the target without nesting
  // controls. The href is a genuine no-JS fallback — when JS runs we intercept
  // the click and open the modal instead.
  function renderCards() {
    track.innerHTML = '';
    const frag = document.createDocumentFragment();

    cards.forEach((card, i) => {
      const li = document.createElement('li');
      li.className = 'nsw-carousel__item';
      li.setAttribute('role', 'group');
      li.setAttribute('aria-roledescription', 'slide');
      li.setAttribute('aria-label', `${i + 1} of ${cards.length}`);

      li.innerHTML = `
        <div class="nsw-card">
          <div class="nsw-card__image">
            <img src="${escape(card.image)}" alt="${escape(card.imageAlt || '')}" loading="lazy">
          </div>
          <div class="nsw-card__content">
            <h2 class="nsw-card__title">
              <a href="${escape(card.url || '#')}" data-card-link>${escape(card.title)}</a>
            </h2>
            <div class="nsw-card__copy">
              <p>${escape(card.summary)}</p>
            </div>
            <span class="material-icons nsw-material-icons" aria-hidden="true">east</span>
          </div>
        </div>`;

      const link = li.querySelector('[data-card-link]');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        onCardOpen(card, link);
      });

      frag.appendChild(li);
    });

    track.appendChild(frag);
  }

  function renderDots() {
    dots.innerHTML = '';
    for (let i = 0; i < pageCount(); i++) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nsw-carousel__page';
      btn.textContent = String(i + 1);
      btn.setAttribute('aria-label', `Go to slide ${i + 1} of ${pageCount()}`);
      btn.addEventListener('click', () => goTo(i));
      li.appendChild(btn);
      dots.appendChild(li);
    }
  }

  function goTo(index) {
    page = Math.max(0, Math.min(index, pageCount() - 1));
    update();
  }

  function update() {
    root.style.setProperty('--per-view', perView);
    track.style.transform = `translateX(-${page * 100}%)`;

    // Stop at the ends rather than looping — more predictable to navigate.
    if (prevBtn) prevBtn.disabled = page === 0;
    if (nextBtn) nextBtn.disabled = page >= pageCount() - 1;

    // A disabled button loses focus, so hand it to the other control before
    // it disables — otherwise keyboard users get dropped to the top of the page.
    if (prevBtn?.disabled && document.activeElement === prevBtn)
      nextBtn?.focus();
    if (nextBtn?.disabled && document.activeElement === nextBtn)
      prevBtn?.focus();

    dots.querySelectorAll('.nsw-carousel__page').forEach((btn, i) => {
      btn.setAttribute('aria-current', String(i === page));
    });

    // Take off-screen cards out of the tab order and the accessibility tree so
    // focus can't land on a card the user can't see.
    const start = page * perView;
    const end = start + perView;
    Array.from(track.children).forEach((item, i) => {
      const visible = i >= start && i < end;
      item.toggleAttribute('inert', !visible);
      item.setAttribute('aria-hidden', String(!visible));
    });

    announce();
  }

  // Announce the visible range to screen readers without moving focus.
  function announce() {
    if (!status) return;
    const first = page * perView + 1;
    const last = Math.min(first + perView - 1, cards.length);
    status.textContent = `Showing items ${first} to ${last} of ${cards.length}`;
  }

  // The page count changes with the breakpoint, so recompute and re-clamp the
  // current page on resize. Debounced to avoid running on every resize event.
  const handleResize = debounce(() => {
    const next = currentPerView();
    if (next !== perView) {
      perView = next;
      renderDots();
      page = Math.min(page, pageCount() - 1);
      update();
    }
  }, 150);

  function bindEvents() {
    prevBtn?.addEventListener('click', () => goTo(page - 1));
    nextBtn?.addEventListener('click', () => goTo(page + 1));

    // Arrow / Home / End paging is ignored while a card is focused: changing
    // page makes that card inert, which would drop the focus. These work from
    // the prev/next and pagination controls.
    root.addEventListener('keydown', (e) => {
      if (e.target.closest('.nsw-card')) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(page - 1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(page + 1);
      }
      if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        goTo(pageCount() - 1);
      }
    });

    window.addEventListener('resize', handleResize);
  }

  async function init() {
    try {
      cards = await loadCards();
    } catch (err) {
      track.innerHTML =
        '<li class="nsw-carousel__item"><p>Sorry, the latest items could not be loaded.</p></li>';
      console.error('[carousel]', err);
      return;
    }

    cards = cards.slice(0, 10); // Brief: show up to 10 cards.
    perView = currentPerView();
    renderCards();
    renderDots();
    bindEvents();
    update();
  }

  return { init, goTo };
}
