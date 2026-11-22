# Working on this site

## Tag every text change with AIWROTE

The site's words must be the owner's own. They find machine-written text with Find All on `AIWROTE` and rewrite it themselves. So whenever you add or change user-facing text, put one marker on the line above each block you wrote:

- Markdown bodies: `<!-- AIWROTE -->`
- YAML/TOML front matter and config: `# AIWROTE`
- Hugo templates: `{{/* AIWROTE */}}`
- JavaScript: `// AIWROTE`

Never remove a marker yourself; the owner removes it after rewriting the text. Text copied verbatim from the old site is not tagged. `hugo --minify` strips the HTML comments from the build.

Inside Markdown, never put a shortcode call inside an HTML comment to "comment it out": Hugo still runs it. Delete the line and leave a plain-text note instead.
