# Contributing to manuscribe

Thanks for helping make manuscribe better.

## Development

```bash
git clone https://github.com/zeroai-tech/manuscribe.git
cd manuscribe
npm install
npx playwright install chromium
npm run dev -- crawl http://localhost:5173 --pages 3 -d out/   # run from source (tsx)
# …write out/manual.json by hand or via Claude Code…
npm run dev -- render out/manual.json -o manual.pdf -b out/
```

- `npm run typecheck` — strict TypeScript, no emit.
- `npm run build` — compile `src` → `dist`.

## Project layout

| File | Role |
|---|---|
| `src/cli.ts` | Command-line entry (Commander): `crawl` + `render` |
| `src/capture.ts` | `crawl` step — runs the crawl, writes `capture.json` |
| `src/crawl.ts` | Playwright crawl, screenshots, network capture |
| `src/render.ts` | `render` step — reads `manual.json`, makes the PDF |
| `src/manual.ts` | HTML assembly |
| `src/pdf.ts` | HTML → PDF (Playwright) |

## Ground rules

- **manuscribe contains no model calls and no API keys** — the intelligence is
  the calling agent (Claude Code). Keep it that way; don't add an SDK/provider.
- TypeScript stays **strict**; `npm run typecheck` must pass.
- Keep the CLI dependency-light and the PDF self-contained.
- Update `CHANGELOG.md` under **[Unreleased]** with every user-facing change.

## Releasing

1. Move `[Unreleased]` notes into a new version section in `CHANGELOG.md`.
2. Bump `version` in `package.json` (SemVer).
3. Tag: `git tag vX.Y.Z && git push --tags`.
4. Create the GitHub release from the changelog section.
