---
name: manuscribe
description: Generate a polished PDF user manual from a running web app. Use when the user wants documentation, a user guide/manual, onboarding docs, or a UX/data-flow walkthrough of an app reachable by URL (e.g. a localhost dev server). manuscribe crawls + screenshots + renders; YOU (Claude Code) do the seeing and writing — no separate API key.
---

# manuscribe — auto user manuals (Claude Code drives it)

manuscribe is a **mechanical** tool: it crawls the app, takes screenshots, and
renders a PDF. **You, Claude Code, are the intelligence** — you read the
screenshots with your own vision and write the manual. There is **no API key and
no model call inside manuscribe**; it runs on the Claude Code session the user
already pays for.

## When to use

The user says "make a user manual / user guide / docs for this app", "document
the UX", "explain how this works for end users", and the app is reachable by URL
(often `http://localhost:<port>`).

## The three steps

### 1. Crawl (mechanical)

Make sure the app is running first. Then:

```bash
manuscribe crawl <url> --name "<App Name>" --pages <n> -d <work-dir>
```

This writes `<work-dir>/capture.json` and `<work-dir>/screenshots/*.png`.

**If it captures only 1 screen, it's a single-page app** — the real screens are
behind buttons/modals, not links. Re-run with `--click "<label>"` (repeatable, in
order) to step through them, e.g.:

```bash
manuscribe crawl <url> -d <work-dir> \
  --click "Start modeling" --click "DXF Designer"
```

Look at the first screenshot to choose which labels to click.

### 2. Write the manual (this is you)

- Read `<work-dir>/capture.json`. It lists each page: `index`, `url`, `title`,
  `screenshot` (path relative to `<work-dir>`), `elements`, `requests`, `text`.
- **For each page: open the screenshot with your Read tool** (you can see images)
  and, using the screenshot + that page's `elements` and `requests`, write a
  manual section in Markdown:
  - `## <Human screen name>`
  - one plain-language paragraph: what this screen is for
  - `### What you see` — bulleted tour of the key controls (use real labels)
  - `### How to use it` — numbered walkthrough of the main task
  - optional `_Behind the scenes:_` line if `requests` reveal what loads/saves
- Then write an **overview** (getting started), a **data flow** section (trace
  what happens to data across the app, citing the observed endpoints), and a
  short **glossary**.
- Assemble everything into `manual.json` (see schema) and save it in `<work-dir>`.
  Use the **same `screenshot` paths** that came from `capture.json`.

#### manual.json schema

```json
{
  "appName": "My App",
  "baseUrl": "http://localhost:5173",
  "overview": "markdown…",
  "sections": [
    { "title": "Home", "screenshot": "screenshots/1-localhost.png", "markdown": "## Home\n…" }
  ],
  "dataFlow": "markdown…",
  "glossary": "markdown…"
}
```

### 3. Render (mechanical)

```bash
manuscribe render <work-dir>/manual.json -o <app>-manual.pdf -b <work-dir>
```

Then tell the user the PDF path and offer to open it or re-crawl with more
`--pages`.

## Notes

- Write only what you can actually see/observe in the screenshots and capture
  data — do not invent features.
- Auth-gated apps may need `--headful` and a manual login during the crawl.
- Bigger app → raise `--pages`.
