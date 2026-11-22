---
title: "the kit"
description: "Every custom element on this site, with the line that makes it."
showDate: false
showViews: false
showTableOfContents: true
sitemap:
  disable: true
---
{{< katex >}}


Every custom piece on this site is a Hugo shortcode, so it works in any page's Markdown. Each one is shown here, followed by the line that makes it. Copy the line, change the words. This page is not in the menu.

## Section underline


Nothing to type. Every `## heading` in a page gets the ink underline, drawn when it scrolls into view.

## Margin note


A slanted handwritten aside. Put it right after the paragraph it belongs to. On a wide screen it sits in the right margin, on a narrow one it sits inline.


{{< mn tilt="-2" >}}Like this one. `tilt` is in degrees and is optional.{{< /mn >}}

```text
{{</* mn tilt="-2" */>}}Like this one. `tilt` is in degrees and is optional.{{</* /mn */>}}
```

## Unfolding text


A dotted term that {{< unfold "opens when clicked" >}}and reveals a sentence or two that would otherwise interrupt the paragraph.{{< /unfold >}} Markdown works inside both parts.

```text
A dotted term that {{</* unfold "opens when clicked" */>}}and reveals a sentence or two.{{</* /unfold */>}}
```

## Handwriting, inline

For a word or two {{< hand >}}in the hand font{{< /hand >}} inside ordinary text.

```text
{{</* hand */>}}in the hand font{{</* /hand */>}}
```

## Definition and theorem boxes


{{< claim kind="Definition" name="optional name" >}}
`kind` is the bold word: Definition, Theorem, Problem, Remark, anything. Maths works: \\(e^{i\pi} = -1\\).
{{< /claim >}}

```text
{{</* claim kind="Definition" name="optional name" */>}}
The statement, in Markdown.
{{</* /claim */>}}
```

## Vitae entry

{{< cv title="Title of the thing" org="Who it was with" where="Where" when="2026" kind="math" link="/research/" >}}
The body is Markdown. `kind` is one of `math`, `code`, `words`, `life`, and is what the filter buttons at the top of the vitae use. `org`, `where` and `link` are optional.
{{< /cv >}}

```text
{{</* cv title="Title of the thing" org="Who it was with" where="Where" when="2026" kind="math" link="/research/" */>}}
The body is Markdown.
{{</* /cv */>}}
```

## Courses

Course lists and the grade map are drawn from `data/courses.yaml`. Each course is one line there: `code`, `name`, `grade`, `credits`, `year`, `area`, and optionally `text` (the book that slides out on hover) and `note` (the handwritten remark).

{{< courses area="project" >}}

```text
{{</* courses area="analysis" */>}}     one area: analysis, algebra, probability, computation, foundations, humanities, project
{{</* courses year="2024-25" */>}}      one year
{{</* grademap */>}}                    every course as a coloured cell
```

## The three surfaces

{{< surfaces >}}

```text
{{</* surfaces */>}}
```

## Logo stickers

Tilted logos for the margin (a row on a narrow screen). Each name is a file in `assets/img/skills/`; drop in any transparent SVG or PNG to add one.

{{< stickers "python haskell latex" >}}

```text
{{</* stickers "python haskell latex" */>}}
```

## A PDF, readable in the page

Make the post a folder. Put the PDF in it, render its pages beside it, and call the reader.

```text
pdftoppm -r 130 -png course.pdf page        (run inside the post's folder)
{{</* pdfpages pdf="course.pdf" title="What the document is called" */>}}
```

To list links next to a page, add them to that post's front matter:

```yaml
links:
  - {page: 1, label: "Hofstadter, Gödel, Escher, Bach", url: "https://…"}
```

## Figures on the home page

The row of figures above the name is a list in the front matter of `content/_index.md`. Add as many as you like.

```yaml
figs:
  - kind: photo
    src: "img/mugshot.jpg"        # any image under assets/
    alt: "Portrait"
    caption: "fig. 1: the author,<br>mid-thought"
  - kind: knot
    knot: "trefoil"               # a pulse runs round it on hover; a click passes one crossing through itself
    caption: "a trefoil. <s>23?</s> no."
    flipped: "a trefoil? not!"     # the caption once that crossing has swapped
```

## From Blowfish itself

These ship with the theme and are already dressed to match: `github` (repository card), `steps` and `step`, `tabs` and `tab`, `accordion`, `gallery`, `katex`, `alert`, `badge`, `timeline`. The [Blowfish shortcode docs](https://blowfish.page/docs/shortcodes/) list them all.

{{< github repo="chai314/marco-polo" showThumbnail=false >}}

```text
{{</* github repo="chai314/marco-polo" showThumbnail=false */>}}
```
