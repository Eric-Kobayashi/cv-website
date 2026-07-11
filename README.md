# May Chim — CV website

Static site for [maychim.site](https://maychim.site), hosted on GitHub Pages.

Content lives in **`site-data.json`**. The page reads a generated JS blob; after you edit the JSON, bake it.

## Update content

1. Edit `site-data.json` (name, summary, publications, projects, featured links, etc.).
2. Bake the data into JS:

```bash
make bake
```

This writes `assets/js/site-data.js` from `site-data.json`.

3. Commit both files and push to `main`. GitHub Pages deploys automatically.

HTML/CSS/layout: edit `index.html`, `assets/css/`, `assets/js/app.js` as needed. Profile photo: `assets/img/profile.jpg`.

## Local preview

```bash
make serve
```

Open http://localhost:8008

## Other make targets

| Command | What it does |
|--------|----------------|
| `make bake` | Regenerate `assets/js/site-data.js` from `site-data.json` |
| `make serve` | Local static server on port 8008 |
| `make feature-images` | Fetch og:image thumbnails for featured links, then bake |
| `make favicons` | Rebuild PNG favicons from the SVG (`uv` required) |
| `make extract` | Pull text from a local CV PDF into `cv_raw.txt` (PDF not in git) |

## Setup (optional scripts)

Python 3.11+. Use [uv](https://github.com/astral-sh/uv) for deps:

```bash
uv sync
```

Needed for `make favicons` and PDF extract (`pypdf`, `cairosvg`). Plain content edits only need `make bake` + a browser.
