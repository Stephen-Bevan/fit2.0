<p align="center">
  <img src="docs/assets/fit-logo.png" alt="FIT — Fastrack into Information Technology" width="220">
</p>

# FIT — Website Redesign

This is a **redo of the original [FIT (Fastrack into Information Technology)](https://fit.ie) website** — a full redesign of the site for the Irish non-profit that builds inclusive pathways into the tech sector for learners, employers, funders and partners.

It's a static, hand-built site: no build step, framework or bundler. Every page is a self-contained HTML file sharing one global stylesheet and one global script.

## Live site

Served straight from this repo's `docs/` folder via **GitHub Pages**: https://stephen-bevan.github.io/fit2.0/

Deployed via **Settings → Pages → Source: GitHub Actions**, which runs a Jekyll build over `docs/` before publishing. A `docs/.nojekyll` marker is present, but this build path still runs the files through Jekyll rather than serving them completely raw — that's a known source of occasional build hiccups on a plain static site like this one. If deployments start failing intermittently, switching **Source** to **Deploy from a branch** (`main` / `docs`) skips Jekyll entirely and serves the files as-is, which is simpler for a site with no Jekyll content in it.

## Driving the site (running it locally)

No build tools needed — just serve the `docs/` folder statically:

```bash
cd docs
python -m http.server 8000
# then open http://localhost:8000
```

Opening the HTML files directly (`file://`) also works for most pages.

## Structure

```
docs/
  index.html              Homepage
  about.html, contact.html, ...   One HTML file per page (41 total)
  styles.css               Shared design system — tokens, layout, components (~2,000 lines)
  script.js                Shared behaviour — nav, dropdowns, carousel, FAQ accordions, back-to-top
  assets/
    fit-logo.png, fit-logo-white.png, favicon.png, ...
    img/                    Page imagery
    img/ka/                 FIT Knowledge Arena logos
    img/alumni/, img/logos/ Alumni and partner logos
    council/                Board/council-related assets
```

See [docs/README.md](docs/README.md) for details on the site itself — the design system, shared behaviour, and editing conventions.

## Branches

- `main` — the live, production version of the redesign.
- `test-branch` — a preview branch, kept in sync with `main` for trying out changes before they go live.

Each shows a small "Main" / "Test Branch" watermark badge in the header so you can tell which deployment you're looking at.
