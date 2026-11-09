# Snoh — Simon Coxon's portfolio

A static HTML, CSS and JavaScript website. `build.py` generates Home, four case studies, a 404 page and legacy redirects using Python 3's standard library. No packages, secrets or environment files are required.

## Preview and edit

Double-click `preview.command` or run `sh preview.command`. Open http://localhost:8000. Press Control-C to stop. The launcher uses Codex's bundled Python when available, otherwise Python 3.

Alternatively:

```sh
python3 build.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory _site
```

Edit `content/*.html` for page text, `content/site.json` for projects and social links, and `assets/styles.css` or `assets/site.js` for styling and interactions. Rebuild and refresh after changes. `_site` is generated and excluded from Git. The original dated export is retained locally and excluded from Git.

## GitHub Pages

Repository: https://github.com/simon-png/snoh

`.github/workflows/pages.yml` builds and deploys automatically on pushes to `main`, or via **Actions → Deploy portfolio to GitHub Pages → Run workflow**. In repository **Settings → Pages**, select **GitHub Actions** as the build source.

The intended custom domain is **snoh.co.uk**. Set it in **Settings → Pages → Custom domain**. `CNAME` records that intent and is copied into the build, but GitHub Actions deployments require the domain setting in GitHub itself. DNS is managed separately; this setup does not change DNS. Enable **Enforce HTTPS** once GitHub makes the certificate available.

Relative asset and page links support both the repository URL and custom domain. The workflow passes the Pages base path into the build for the 404 page. For a manual repository-subpath build use `BASE_PATH=/snoh python3 build.py`; for the custom domain the base path is empty.

Self-hosted Poppins fonts and their licence are in `assets/fonts`. Images, slideshow, case-study section themes, social links and legacy redirects are preserved.
