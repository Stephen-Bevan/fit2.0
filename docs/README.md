# FIT website redesign — static site

Plain HTML/CSS/JS. No build step, no dependencies. Everything uses relative
paths, so it works at a repo subpath (`user.github.io/repo/`) as well as at a
domain root.

- `index.html` — home page (GitHub Pages serves this automatically)
- 41 pages in total, all at the top level
- `styles.css`, `script.js` — site-wide styles and behaviour
- `assets/` — logos, favicon, `img/` photography, `council/` partner logos
- `.nojekyll` — tells GitHub Pages to serve the files as-is

## Publishing to GitHub Pages

1. Create a new repository on github.com (public, no README needed).
2. Upload the contents of this folder to the repository root — `index.html`
   must sit at the top level, not inside a subfolder.
   - Browser: **Add file → Upload files**, drag everything in, Commit.
   - Command line, from inside this folder:
     ```
     git init
     git add -A
     git commit -m "FIT site"
     git branch -M main
     git remote add origin https://github.com/USER/REPO.git
     git push -u origin main
     ```
3. In the repository: **Settings → Pages**.
4. Under **Build and deployment**, set Source to **Deploy from a branch**,
   branch **main**, folder **/ (root)**. Save.
5. Wait 1–2 minutes. The URL appears at the top of the same Settings → Pages
   screen: `https://USER.github.io/REPO/`

Updating later: commit a change to `main` and Pages redeploys on its own.

## Notes

- **Filenames are case-sensitive on GitHub Pages** (they may not be on your
  laptop). All references in this folder have been checked and match.
- Every page is reachable at `.../page-name.html`. GitHub Pages also resolves
  the extensionless form (`.../about`) automatically.
- The internal review pages (audit notes, Elementor build guide, brand lab, the
  alternate bold home page) are deliberately excluded from this folder.
- The brand Tweaks panel and its React/Babel CDN scripts have been removed from
  every page, so visitors get a clean, fast site.

## Custom domain (optional)

Add a file named `CNAME` at the root containing just the hostname, e.g.
`redesign.fit.ie`, then point a DNS CNAME record at `USER.github.io`.
