# Accessible card carousel

A refactor of the original NSW Design System card slider. Users can browse up to
10 news/event cards (4 visible on desktop), move through them with arrows and
pagination dots, and open a card to read the full story in an accessible modal.

## Running it

Plain HTML, CSS and JavaScript — no build step. It loads its content with
`fetch()`, so it needs to be served over HTTP rather than opened from disk
(a `file://` page will be blocked from reading `cards.json`).

The easiest way in VS Code is the **Live Server** extension: right-click
`index.html` → *Open with Live Server*. Any static HTTP server works just as
well if you prefer.

## Layout

```
solution/
├── index.html              # markup + ARIA structure
└── assets/
    ├── css/carousel.css     # styles, breakpoints, focus, reduced-motion
    ├── js/
    │   ├── carousel.js      # createCarousel() — browsing + pagination
    │   ├── modal.js         # createModal() — dialog behaviour
    │   └── main.js          # wires the two together
    └── data/cards.json      # the content (stands in for an API)
```

The original is kept in `../original/index.html` for comparison.

## What changed from the original

- **Content is separate from code.** Cards come from `cards.json` via `fetch()`
  instead of being hand-written into the HTML. Adding a card is a data change,
  not a markup change.
- **Behaviour is configured, not coded.** How many cards show per breakpoint and
  where the data comes from are set with `data-*` attributes on the section.
- **Two small modules** (`createCarousel`, `createModal`) plus a `main.js` that
  connects them. Each is written as a factory function, keeps its state in a
  closure, and can be reused on its own.
- **Accessibility was rebuilt**.

## Accessibility

Built to the WAI-ARIA carousel and dialog patterns, aiming at WCAG 2.2 AA.

- Keyboard operable: Tab to every control; arrow keys / Home / End move pages
  from the nav buttons; Enter on a card opens it.
- Card titles are real headings (`<h2>` under the page `<h1>`), so screen-reader
  users can jump between cards with the heading key.
- Each card keeps the NSW markup — the title is a real link, stretched over the
  whole card so the surface is one large target with a single tab stop (no
  nested controls). The `href` doubles as a no-JS fallback.
- Off-screen cards are taken out of the tab order with `inert` so focus can't
  land on a card you can't see; focus is moved off a nav button when it disables.
- A polite live region announces "Showing items 1 to 4 of 10" as you navigate.
- The modal moves focus in on open, traps Tab inside, closes on Esc or an
  overlay click, and returns focus to the card that opened it.
- Visible focus ring on everything; nav buttons are 44px, pagination 40px.
- Decorative icons are `aria-hidden`; every image has descriptive alt text that
  doesn't just repeat the title.
- Honours `prefers-reduced-motion`.

## Notes for integration (e.g. AEM)

The card shape in `cards.json` maps directly to a content fragment / component
dialog — a Sling model can emit the same JSON, or render the cards server-side
and let the script enhance them. The `data-*` config already mirrors what an
author dialog would expose. The CSS and JS modules drop into a clientlib as-is.
