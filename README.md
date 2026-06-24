# manuscribe

**Turn your running web app into a polished PDF user manual — driven by Claude Code.**

manuscribe is a **Claude Code tool**. It does the mechanical work — crawl the
live app, screenshot every screen, capture the network calls, and render a PDF —
while **Claude Code itself does the seeing and the writing**, using the session
you already pay for. **No separate API key. No per-use AI billing.** Just like
Claude Code's built-in browsing and image tools.

Built for small teams that ship fast but have no docs, QA, or design department.
A product of **[ZeroAI](https://zeroaitech.tech)**.

---

## How it works

```
                  manuscribe crawl <url>
running app ───────────────────────────────▶  screenshots/  +  capture.json
                                                      │
                              Claude Code reads the screenshots (its own vision)
                              and writes the manual ──▶ manual.json
                                                      │
                  manuscribe render manual.json
                                                      └───────────▶  manual.pdf
```

manuscribe never calls a model. The two CLI steps are pure mechanics; the
intelligence is the Claude Code agent in the middle.

## Install

```bash
npm install -g manuscribe          # or: npx manuscribe
npx playwright install chromium    # one-time: the browser engine
```

No API key. No `.env`. If you can run Claude Code, you can run this.

## Use it (the easy way: just ask Claude Code)

With the bundled skill (`skills/manuscribe`), say to Claude Code:

> "Make a user manual for the app running on http://localhost:5173"

Claude Code will: crawl it, read the screenshots, write each section, and render
the PDF — end to end.

## Use it (manually)

```bash
# 1. Capture (mechanical)
manuscribe crawl http://localhost:5173 --name "My App" --pages 8 -d out/

# 2. …Claude Code reads out/capture.json + screenshots and writes out/manual.json…

# 3. Render (mechanical)
manuscribe render out/manual.json -o my-app-manual.pdf -b out/
```

### `crawl` options

| Option | Default | Description |
|---|---|---|
| `-n, --name <name>` | page title | App name |
| `-p, --pages <n>` | `8` | Max screens to crawl |
| `-c, --click <path>` | — | **SPA flow:** a `>`-separated path of button/link labels to reach a screen, then screenshot it. Repeatable (one per screen). Each path runs from a fresh load. |
| `--headful` | off | Show the browser (useful for logging in) |
| `-d, --out-dir <dir>` | `manuscribe-out` | Where screenshots + `capture.json` go |

> **Single-page apps:** if screens live behind buttons/modals (not links), give a
> `--click` **path** per screen — each runs in a fresh browser context (so
> persisted state or a covering modal never interferes):
> ```bash
> manuscribe crawl http://localhost:5174 \
>   -c "Start modeling" \
>   -c "Start modeling > DXF Designer" \
>   -c "Start modeling > Design with Claude"
> ```

### `render` options

| Option | Default | Description |
|---|---|---|
| `-o, --out <file>` | `manual.pdf` | Output PDF path |
| `-b, --base-dir <dir>` | manual.json's dir | Base for screenshot paths (the crawl out-dir) |

## Data contracts

- **`capture.json`** (written by `crawl`) — one entry per screen: `url`, `title`,
  `screenshot` (relative path), `elements`, `requests`, `text`.
- **`manual.json`** (written by the agent, read by `render`) — `appName`,
  `baseUrl`, `overview`, `sections[] {title, screenshot, markdown}`, `dataFlow`,
  `glossary`.

## Requirements

- Node ≥ 18
- A running app reachable by URL (localhost is fine)
- Chromium via `npx playwright install chromium`
- Claude Code (it provides the writing)

## Notes & limits

- Crawls **same-origin** links breadth-first; auth-gated flows may need
  `--headful` plus a manual login (cookie reuse is on the roadmap).
- The agent writes only from what it can **see and observe** — review before you ship.

## License

MIT © ZeroAI (Lottie Mukuka). See [LICENSE](LICENSE).
