# Presentation notes

Talking points for the walkthrough. Each section maps to one of the questions
in the brief. Keep it conversational — these are prompts, not a script.

---

## 1. Approach, key decisions and improvements

**Where I started.** The original was a single HTML file: ten cards hand-written
into the markup, all behaviour coming from the NSW Design System's bundled
`main.js`. It worked, but content and code were tangled together, there were no
real carousel semantics, and there was no detail view.

**The three decisions I'd lead with:**

1. **Separate content from code.** Cards now live in `cards.json` and are loaded
   with `fetch()`. Adding or editing a card is a data change — nobody touches the
   HTML or JS. This is the change everything else builds on.
2. **Configure behaviour with `data-*` attributes.** How many cards show per
   breakpoint, and where the data comes from, are set on the `<section>` in the
   HTML — not buried in JavaScript. Same component, retuned without code edits.
3. **Split the logic into small functional modules.** `createCarousel` handles
   browsing and pagination, `createModal` handles the dialog, and `main.js` wires
   them together. They don't know about each other, so each can be reused or
   tested on its own.

**Why functional (factory functions, not classes).** Each module returns a small
set of methods and keeps its state in a closure. There's no `this` to track and
nothing on the global scope. For a component this size it's less ceremony than a
class and reads top-to-bottom.

**Improvements over the original, in one line each:** real keyboard support,
a modal detail view, pagination, responsive card counts, an error state, a
no-JS fallback, and reduced-motion support.

---

## 2. Accessibility improvements (the part to demo live)

Built to the WAI-ARIA carousel and dialog patterns, targeting WCAG 2.2 AA.
Good things to actually show on screen:

- **Keyboard only.** Tab through the controls. The prev/next and pagination
  buttons are real `<button>`s; arrow keys / Home / End move pages from there.
  Enter on a card opens it. (Demonstrates 2.1.1 Keyboard.)
- **One tab stop per card, no nested controls.** Each card keeps the NSW
  structure — the title is a real link (`<a href>`). I stretch that link over
  the whole card with a CSS `::after`, so the entire surface is clickable but
  there's only one focusable element. Good "how" answer: it avoids a button
  inside a link (an accessibility no-no) and the `href` is a genuine no-JS
  fallback — JS intercepts the click to open the modal instead.
- **Focus is managed in the modal.** Open a card — focus moves into the dialog,
  Tab is trapped inside it, Esc closes it, and focus returns to the exact card
  you opened. (2.4.3 Focus Order, ARIA dialog pattern.)
- **Off-screen cards are inert.** Tab through the carousel and show that hidden
  cards are skipped — you never focus something you can't see. (I also move focus
  off a nav button at the moment it becomes disabled, so you don't get dropped.)
- **Screen-reader announcement.** There's a polite live region that says
  "Showing items 1 to 4 of 10" as you navigate, without stealing focus.
  (4.1.3 Status Messages.) Demo with VoiceOver/NVDA if you can.
- **Visible focus** ring on every control; **target sizes** — 44px arrows and
  40px pagination buttons (2.5.8 Target Size).
- **Not dependent on dragging** (2.5.7, new in 2.2) — everything works by click
  and keyboard, dragging is never the only path.
- **Decorative icons** are `aria-hidden`; every image has meaningful alt text.
- **Reduced motion** — the slide animation is switched off if the OS setting is on.

If asked "how did you test it": keyboard pass, browser dev-tools accessibility
tree, and a screen reader. Honest answer: automated tools (axe) catch the
mechanical issues; the focus/announcement behaviour you have to test by hand.

---

## 3. Biggest challenges

- **Hiding off-screen cards properly.** Visually clipping them with
  `overflow: hidden` isn't enough — a keyboard user can still Tab into a card
  that's scrolled out of view. `inert` solves it, but I had to make sure it's
  re-applied every time the page changes and after a resize.
- **Pagination that survives a resize.** The number of pages changes when the
  breakpoint changes (4-per-page becomes 1-per-page). The current page has to be
  re-clamped so you don't end up "past the end" and looking at blank space.
- **Deciding how much to build.** It's tempting to add autoplay, looping, swipe,
  etc. I deliberately kept the scope to the brief and left those as "if I had more
  time", so the core stays solid and easy to explain.

---

## 4. Integrating into a CMS like AEM

The component was built to make this a short hop:

- **The card shape is the content model.** Each object in `cards.json`
  (tag, title, summary, image, date, detail, url) maps directly to an AEM content
  fragment or a component dialog. A Sling model can serialise authored content to
  the exact same JSON the carousel already consumes — or render the cards
  server-side with HTL and let the script enhance them.
- **The `data-*` config is already an author dialog.** "Cards visible on
  desktop", the data source — those are authoring options today, not code.
- **CSS and JS drop into a clientlib** as-is; they're framework-agnostic and
  scoped, so the component can appear multiple times on a page without clashing.
- **For real scale** I'd add a typed content contract (schema/TypeScript),
  swap the static JSON for the real content API, and pull the colours into the
  shared design tokens rather than the local custom properties.

---

## 5. Working with designers, PMs and other developers

- **Designers:** lean on the design system as the shared language — components,
  tokens, spacing. I'd confirm the interaction and accessibility details early
  (focus order, what the modal contains, motion) because those are cheap to agree
  up front and expensive to retrofit.
- **PMs:** keep scope explicit. The brief had a clear must-have set; I built that
  and parked the nice-to-haves in a visible list so trade-offs are a conversation,
  not a surprise.
- **Other developers:** small modules with clear seams, content separated from
  code, and a short README so someone can pick it up without me explaining it.
  In a team this would go through PR review and ideally have tests on the paging
  logic.

---

## 6. If I had more time

- Autoplay with a pause/play control and pause-on-hover/focus.
- Swipe gestures as an enhancement, keeping full keyboard parity.
- A couple of unit tests around the paging maths (page count, clamping on resize)
  and a quick axe check in CI.
- TypeScript types for the card data and the module APIs.
- Wire the colours to the full NSW theme tokens instead of local variables.
- Lazy-load or virtualise if the set ever grew well beyond ten cards.
