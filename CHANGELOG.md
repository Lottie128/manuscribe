# Changelog

All notable changes to manuscribe are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Authenticated crawls (reuse a saved login / storage state).
- Word / SVG output targets.
- Per-section regeneration and an editable review pass.

## [0.6.1] — 2026-06-25

### Fixed
- Embedded close-ups were letterboxed in oversized `object-fit` boxes (grey/lavender padding) that could overlap captions/headings. Images are now sized by max-width/max-height with auto, so each box hugs its image — no letterbox, no overlap.

## [0.6.0] — 2026-06-25

### Changed
- Premium, A4-precise redesign of the output (renders to an exact A4 web page, then exports). Full-bleed ZeroAI-branded cover (logo mark + wordmark, gradient + glow), accent sub-headings, chapter chips, refined callouts and captions, branded footer, and denser flow so chapters fill pages (much less white space).

### Added
- `render --format png` — high-resolution PNG export.
- `render --scale <1-4>` — quality lever for print/PNG sharpness.

## [0.5.0] — 2026-06-24

### Changed
- Polished the PDF design: a branded dark cover with an accent rule + "A ZeroAI product" line; accent section headings; a cleaner numbered Contents page; auto-styled "Tip/Note/Why it matters" callout boxes; centred image captions; chapter tags; softer shadows on screenshots.

## [0.4.0] — 2026-06-24

Textbook mode — everything needed for a long, sales-grade handbook.

### Added
- **`manuscribe crop <image> -b x,y,w,h`** — make cropped **close-ups** of any
  screenshot to emphasise a single control or area. Reuses Chromium, so no image
  library is added. The agent (Claude Code), which can see the full screenshots,
  picks the regions.
- **Inline close-ups in the PDF** — any relative `![](path)` image placed inside
  a section's markdown is embedded (base64) and styled, so close-ups can sit
  exactly where the text needs them. The per-section lead `screenshot` is now
  optional (a section can be led by a close-up instead).

### Verified
- Produced a 13-page ZaiCAD handbook: sign-in, studio tour, shapes, the
  Inspector, holes/cut, DXF Designer, Design with Claude, and a teacher chapter —
  with palette/toolbar/inspector/holes close-ups embedded.

## [0.3.1] — 2026-06-24

### Changed
- **`--click` is now a path** of `>`-separated labels (e.g.
  `--click "Start modeling > DXF Designer"`), and **each path runs in a fresh
  browser context**. This fixes two real-world SPA problems found on ZaiCAD:
  apps that **persist state** (a plain reload skipped the landing screen) and
  **full-screen modals** that covered the next control. Sibling screens are now
  reached reliably from a clean landing each time.

### Verified
- ZaiCAD run captured 4 distinct screens (landing, 3D editor, DXF Designer,
  Design with Claude) → 8-page PDF.

## [0.3.0] — 2026-06-24

### Added
- **SPA click-flow capture** — `crawl --click "<label>"` (repeatable) clicks a
  button/link by its visible text and screenshots the resulting state, in order.
  Single-page apps (where screens live behind buttons/modals, not links) can now
  be documented, not just the landing page. Falls back to same-origin link
  crawling when no `--click` is given.

### Verified
- Full pipeline run end to end against a real app (ZaiCAD): `crawl --click` →
  Claude Code wrote `manual.json` → `render` produced a 7-page PDF manual.

## [0.2.0] — 2026-06-24

### Changed (breaking)
- **manuscribe no longer calls a model and needs no API key.** It is now a pure
  **Claude Code tool**: the agent does the seeing and writing using the session
  the user already pays for — the same model as Claude Code's built-in tools.
- The single `generate` command is split into two mechanical steps:
  - `manuscribe crawl <url>` → `screenshots/` + `capture.json`
  - `manuscribe render <manual.json>` → PDF
  Claude Code reads `capture.json` + screenshots and writes `manual.json` in
  between (see the updated skill).

### Removed
- `@anthropic-ai/sdk` dependency, the embedded Claude calls, and the
  `ANTHROPIC_API_KEY` requirement.

### Added
- `capture.json` / `manual.json` data contracts.
- Rewritten Claude Code skill describing the crawl → write → render workflow.

## [0.1.0] — 2026-06-24

First release. The core pipeline works end to end.

### Added
- `manuscribe generate <url>` CLI (Commander).
- Playwright crawler: same-origin BFS, full-page screenshots, UI-element
  extraction, and XHR/fetch capture per screen.
- Claude analysis (`claude-opus-4-8`, vision + streaming): a manual section per
  screen, plus a synthesis pass for overview, data flow and glossary.
- Self-contained PDF renderer (A4, page numbers, embedded screenshots).
- Claude Code skill (`skills/manuscribe`) so Claude Code can drive it.
- Org scaffolding: README, LICENSE (MIT), CONTRIBUTING, CI, tsconfig.

[Unreleased]: https://github.com/zeroai-tech/manuscribe/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/zeroai-tech/manuscribe/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/zeroai-tech/manuscribe/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/zeroai-tech/manuscribe/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/zeroai-tech/manuscribe/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/zeroai-tech/manuscribe/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/zeroai-tech/manuscribe/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/zeroai-tech/manuscribe/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/zeroai-tech/manuscribe/releases/tag/v0.1.0
