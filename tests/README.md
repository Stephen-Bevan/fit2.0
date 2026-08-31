# Tests

Playwright-backed regression tests for the site in `docs/`. This directory is
not part of the deployed site — GitHub Pages only serves `docs/`, so nothing
here ships.

These are structured as unit tests (isolated `describe`/`test` blocks, one
assertion-per-behaviour, no shared state between tests) using Node's built-in
test runner, but each one drives a real Chromium instance rather than a mocked
DOM. That's deliberate: every real bug found in this project this session —
`backdrop-filter` silently breaking the mobile nav's fixed positioning,
`aria-label` doing nothing without a `role`, a hero card overlapping a
"not final image" label — only shows up in an actual layout/rendering engine.
A jsdom-style pure-logic unit test would not have caught any of them.

## Setup (first time only)

```
cd tests
npm install
npm run install-browser   # downloads Chromium for Playwright, ~150MB
```

## Run

```
cd tests
npm test
```

Runs every `*.test.js` file. Each file starts its own local static server on
port 5311 and a fresh Chromium instance, so files can run independently:

```
node --test wip-disclaimer.test.js
node --test mobile-nav.test.js
```

## What's covered

- **wip-disclaimer.test.js** — the homepage popup: shows on first visit,
  correct dialog a11y semantics, all four dismiss paths (X, Esc, backdrop
  click, continue button), the 7-day localStorage dismissal window (and that
  it correctly re-shows once that window has elapsed), the `?showWip=1`
  testing override, keyboard focus trap in both directions, responsive
  layout at narrow/short viewports, and `prefers-reduced-motion`.
- **mobile-nav.test.js** — the hamburger nav fills the full viewport height
  below the header at every relevant breakpoint, dropdown accordions open,
  the hamburger closes the menu again, and — specifically — that the header
  never regains `backdrop-filter`/`transform`/`will-change`, since any of
  those silently break the nav's `position: fixed` sizing again.
- **header-hero.test.js** — the branch/date watermark (present once, text is
  static rather than a live clock, never overlaps the logo or hamburger from
  320px–1280px) and the hero text-card redesign (no gradient wash on the
  photo, correct card styling, breadcrumb stays outside the card, card never
  overflows its container).
- **sitewide.test.js** — sweeps all 47 pages in `docs/` for console errors,
  failed network requests, header height, and watermark presence, plus
  regression checks for the two structural bugs found by the last HTML
  validation pass (the duplicate `<main>` in `ai-training.html`, and the
  `aria-label` elements missing `role="group"`).

## Updating for future changes

- If you add a new page with a hero, add it to the `cases` array in
  `header-hero.test.js`.
- If you change the WIP disclaimer's copy, update the wording assertions in
  `wip-disclaimer.test.js` — copy itself lives in `docs/index.html`, not here.
- `sitewide.test.js` reads `docs/*.html` dynamically, so new pages are picked
  up automatically.
