# Nightfolio on kit: what kit builds, and what the copy needs

**Status (12 November 2026): sections 1 and 2 built on branch `nightfolio-sections` (not merged),
with the Design side done (Kit sections file and Kit · Nightfolio). Sections 3–5, the copy, are open.**

chrisgarlick.com's redesign (style: Nightfolio, Chris's own; Hub library, client `chris-garlick`) is
designed in full in Design (file `38bc0169c69841d6a7a0ab1e4bef2e5b`, the `nf_*` pages, 21 of them)
and built from kit's website sections, restyled as the "Kit · Nightfolio" components (`kn_*`).
Every section maps to a kit section except three. This plan lists the kit work those pages need,
then the copy Chris has to write, confirm or approve before the pages can go live. Each page in
Design has a "Build status" panel above it (Build now / Not yet) and red boxes for kit gaps.

A **kit gap** is only a section that needs a brand-new component; a kit section that does the
job with different styling (sizes, colours, type, spacing, a layout variant) is covered.

## 1. Kit: new sections

| Section | Used on | What it is |
|---|---|---|
| `marquee` | Home | One line of large type (the display face, uppercase, with `*italic*` marks) scrolling slowly between sections. Pauses on hover and focus, stops for `prefers-reduced-motion` (then it's a static line that wraps), hidden duplicate for the loop is `aria-hidden`. Content: a list of short phrases. |
| `ruled-list` | Services ("Ways to work together") | Numbered rows between 1px rules: a number, a name, a one-line description, and a right-aligned value (a duration, a size). Optional heading block and link per row. Stacks to two lines on a phone. |
| `prose` | Article body, Privacy | A readable column (about 45rem) of rich content: paragraphs, numbered h2s, a stat pair callout, code blocks, a table, captioned figures, a quote. Content is a list of typed blocks, each escaped like every kit field; no raw HTML. |

## 2. Kit: additions to existing sections

| Section | Addition |
|---|---|
| `header` | Links can be numbered ("01 Services") by a `numbered` option; the current page is marked (`aria-current`, a distinct colour); a `tone` for light pages. (The logo field already exists.) |
| `footer` | An optional oversize wordmark at the bottom, cropped by the bottom edge, decorative (`aria-hidden`; the brand name is already in the footer). |
| `hero` | An icon before the eyebrow; a text-only layout (no image column); a large title size. |
| `stats` | An optional link under each stat ("How I measured"); the number of columns follows the count (it already does) and a three-column layout reads well. |
| `services` (service card) | An optional number label ("01 — Laravel"); titles take `*italic*` for a second line (rich text). |
| `split` FAQ items | An optional number before each question. |
| section-with-grid (`services`, `gallery`) | An optional heavy rule under the heading; a one-column layout. |
| `text-block` | A points list of any length (today three), and a large title size. |
| `cta` | An eyebrow (a short kicker above the heading). |
| `button` (component) | A trailing arrow icon option; the focus outline keeps a 2px offset. |
| `product-grid` (product card) | A label instead of a price (for resources: "Free PDF · checklist", "Email first"). |
| forms | The consent boxes use kit's existing `checkbox`; nothing new. |

Design side (not code): add the three new sections to the Kit sections Design file
(`aaca632a61d340b1a735f13a5c1abce7`) and to Kit · Nightfolio, and give the `kn_*` components their
mobile states (none were carried over).

## 3. Copy: to write

1. Resources: the five guides themselves (website rebuild checklist; WordPress speed and security
   checklist; Laravel takeover audit checklist; how to write a website brief; AI intake for law
   firms guide).
2. The caching article: the rest of the body after the measured section, and its publish date.
3. The Typeset case study: "How it works".
4. Privacy: the whole policy and the "last updated" date.
5. Thanks: the reply time ("[reply time to confirm]").

## 4. Copy: to confirm

6. Do "Why one repeated issue shouldn't zero a score" and "AI client intake for law firms: from
   enquiry to matter open" exist? They're not on the current Writing page.
7. Is Typeset ready to show as a case study?
8. Which guides need an email first (the plan says the brief template and the AI guide)?

## 5. Copy: to approve (written in design, not from the current site)

9. Everywhere: the magazine labels ("Issue 01", "Edit 01/02", "Fig. 01", "Case study 01"), the
   reworded stat labels, "How I measured →", and the italic second lines on card titles.
10. Home: the marquee wording; Kritano heading "Audits a site…" (the site says "website").
11. Services: "One developer for all three", "READ THIS *first*", the resources block.
12. Laravel, WordPress, AI: the call-to-action headings ("START WITH *a written scope.*",
    "*an audit.*", "*one workflow.*"); Laravel's caching block heading and body; WordPress's reworded
    Kritano body; AI's "WHAT I *automate*" and its lede; the resource row titles.
13. Case studies: the headlines ("My Laravel CMS. *Pages in 4.4 ms.*", "This site. *58 pages to
    13.*", Kritano without "on a website"); role lines ("Founder, designer and developer",
    "Designer and developer", Typeset's "Live" line); hard-part headings ("The fast path *skips
    Laravel.*", "Fewer pages, *no broken links.*"); Typeset's "What it makes" block; the "For
    *clients*" and "Next case study" bands.
14. Work: the reworded row headings, the new Kritano row lede, "Every project starts *with an audit.*"
15. How I work: "Four stages… something you can see and sign off" (the site says "four steps"); the
    added Claude Code / Board / Design / Motion / Typeset line; the three "Every week" cards; the
    call-to-action lede.
16. Writing: the "Check a page for free" section; the resource description.
17. Article: "02 How I measured it", the figure captions, the resource card text.
18. About: the stack cards and lede; the "How I deliver" tools row; "Tell me what *needs building.*"
19. Resources: the five one-line guide descriptions; "What should I *write next?*"; the monthly
    email wording.
20. Site audit: the six check-area descriptions; "Free · one page · results on screen…".
21. Start a project: "What I'll build, what's out of scope, and what done looks like".

Also needed before launch, not copy: features (resource PDFs and gating, the monthly email, the
site audit tool and its hand-off, the three-step brief with lead tracking, the Work and Writing
filters, the data deletion form), assets (Typeset screenshots, How I work stage screenshots, a
fresh capture of the old chrisgarlick.com without "nothing locked to me", clips for writing cards
2 and 3), and decisions (reply time, social links, fonts).
