<p align="center">
  <img src="assets/fit-logo.png" alt="FIT — Fastrack into Information Technology" width="220">
</p>

# FIT Website — Redesign

This folder is the live site: a **redo of the original [fit.ie](https://fit.ie)** website for FIT (Fastrack into Information Technology), an Irish non-profit building inclusive pathways into the tech sector for learners, employers, funders and partners.

It's published as-is via GitHub Pages — no build step, framework or bundler. Every page is a self-contained HTML file sharing one global stylesheet (`styles.css`) and one global script (`script.js`).

## Driving the site

Serve this folder statically and open it in a browser — that's it:

```bash
cd docs
python -m http.server 8000
# then open http://localhost:8000
```

Opening the `.html` files directly (`file://`) also works for most pages. There's no install step and nothing to compile.

## What's here

| File / folder | Purpose |
|---|---|
| `index.html` | Homepage |
| `about.html`, `contact.html`, ... | One HTML file per page (41 total) |
| `styles.css` | Shared design system — colour/spacing tokens, layout primitives, every reusable component (~2,000 lines) |
| `script.js` | Shared behaviour — scroll header, nav dropdowns/accordion, homepage carousel, FAQ accordions, back-to-top, form confirmation |
| `assets/` | Logos, favicon, and all page imagery (`img/`, `img/ka/`, `img/alumni/`, `img/logos/`, `council/`) |

A handful of pages (`ai-training.html`, `choosetech.html`, `cuimsiu-programme.html`, the `faq-*.html` pages, `fit-northern-ireland.html`, `hire-a-tech-apprentice.html`, `publications.html`, `tech-apprenticeships.html`) layer an extra page-scoped `<style>` block on top of `styles.css` for bespoke sections that aren't reused elsewhere.

## Design system

- **Tokens** — CSS custom properties for colour (`--fit-navy`, `--fit-blue`, `--fit-yellow`, ...), spacing, radius and shadow.
- **Layout** — `.fit-container` / `.container`, `.fit-section`, `.fit-grid`, `.fit-card-grid`.
- **Components** — buttons (`.fit-btn--yellow`, `--ghost`, `--outline`, ...), cards, the audience gateway, feature carousel, stats bands, impact bands.
- Every page shares an **identical header (nav) and footer** — keep them byte-for-byte in sync if you edit either.

## Editing conventions

- Keep the header/nav and footer blocks identical across every page; the site relies on this for consistent navigation.
- Prefer the shared classes in `styles.css` over new one-off CSS; only add a page-scoped `<style>` block for genuinely page-specific sections.
- Every `<img>` needs `alt` text; every external `target="_blank"` link needs `rel="noopener"`.
- In-page anchors (`#section-id`) must match a real `id` on the target page.

See the [repo-level README](../README.md) for branch layout and how the live deployment works.
