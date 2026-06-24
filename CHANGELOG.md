# Changelog

All notable changes to manuscribe are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Authenticated crawls (reuse a saved login / storage state).
- Interaction capture (click through flows, not just landing screens).
- Markdown/HTML output targets in addition to PDF.
- Per-section regeneration and an editable review pass.

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

[Unreleased]: https://github.com/Lottie128/manuscribe/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Lottie128/manuscribe/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Lottie128/manuscribe/releases/tag/v0.1.0
