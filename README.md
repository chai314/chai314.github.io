# unpossible cathexis

Homepage of Chaitanya Chhabra. Built with [Hugo](https://gohugo.io) (extended, 0.169.0) and the [Blowfish](https://blowfish.page) theme. Two appearances live in `assets/css/schemes/latte.css`: the navy of the original site (the light toggle) and cream-and-cocoa (the dark toggle).

## Local preview

```sh
hugo server
```

Then open http://localhost:1313/.

## What is where

| Path | What it is |
|---|---|
| `content/_index.md` | Home page text. The layout is `layouts/partials/home/custom.html` |
| `content/research/index.md` | Research |
| `content/mathy/` | Maths notes, the Polygon course, Monte Carlo lab work |
| `content/vitae/index.md` | The long-form CV. Layout: `layouts/_default/cv.html` |
| `data/courses.yaml` | The full transcript, which drives the grade map and course lists |
| `assets/css/custom.css` | All custom styling |
| `assets/js/site.js` | The lattice knot lab, the Monte Carlo pi backdrop, the reader, vitae tools |
| `layouts/shortcodes/` | `cv`, `mn` (margin note), `unfold`, `hand`, `claim`, `courses`, `grademap`, `surfaces`, `pdfpages`; and, verbatim from the original site, `randomstring`, `sos`, `swatches-click` |

## Adding things

Every custom element is a shortcode, usable from any page's Markdown. **`/kit/` on the running site shows each one next to the line that makes it** (source: `content/kit/index.md`; it is not in the menu).

- **A vitae entry:** `{{</* cv title="…" org="…" when="…" kind="math|code|words|life" */>}}…{{</* /cv */>}}`.
- **A margin note:** `{{</* mn tilt="-2" */>}}…{{</* /mn */>}}` right after the paragraph it belongs to.
- **A PDF, readable in the page:** make the post a folder, drop the PDF in as `course.pdf`, render its pages next to it with `pdftoppm -r 130 -png course.pdf page`, then use `{{</* pdfpages pdf="course.pdf" */>}}`. Links inside the PDF are listed per page from the `links:` front matter (get them with `pdfinfo -url course.pdf`).

## Deploying

The workflow in `.github/workflows/hugo.yml` builds and deploys on every push to `main` once the repository's **Settings → Pages → Source** is set to **GitHub Actions**. `baseURL` in `config/_default/hugo.toml` must match where it is served from.
