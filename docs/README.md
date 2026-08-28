# FIT website redesign — static site

Plain HTML/CSS/JS. No build step, no dependencies. Everything uses relative
paths, so it works at a repo subpath (`user.github.io/repo/`) as well as at a
domain root.

- `index.html` — home page (GitHub Pages serves this automatically)
- 46 pages in total, all at the top level of this folder
- `styles.css`, `script.js` — site-wide styles and behaviour
- `assets/` — logos, favicon, `img/` photography, `council/` partner logos
- `.nojekyll` — tells GitHub Pages to serve the files as-is

## Publishing this build

This folder is the contents of `docs/` in `Stephen-Bevan/fit2.0`, on the
`stephen-fit` branch.

Command line, from a clone of the repo:

```
git checkout stephen-fit
rm -rf docs
# copy this folder in as docs/
git add -A
git commit -m "Latest build: 46 pages"
git push origin stephen-fit
```

Browser: open the repo, switch to the `stephen-fit` branch, delete the old
`docs` folder, then **Add file → Upload files** and drag this folder in.

To serve it: **Settings → Pages**, Source **Deploy from a branch**, branch
**stephen-fit**, folder **/docs**. The URL appears at the top of the same
screen.

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

Add a file named `CNAME` at the root of the repo containing just the hostname,
e.g. `redesign.fit.ie`, then point a DNS CNAME record at `USER.github.io`.
