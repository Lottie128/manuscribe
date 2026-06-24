// `manuscribe crawl <url>` — the mechanical capture step. No AI, no API key.
// Crawls the running app, screenshots every screen, and writes capture.json for
// the agent (Claude Code) to read and turn into a manual.

import { writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { crawlSite } from './crawl.js'
import { log } from './log.js'
import type { CaptureManifest, CrawlOptions } from './types.js'

export async function runCrawl(opts: CrawlOptions): Promise<string> {
  log.step(`Crawling ${opts.url} (up to ${opts.maxPages} screens)…`)
  const pages = await crawlSite(opts.url, opts.maxPages, opts.outDir, opts.headful, opts.clicks)
  if (!pages.length) throw new Error('No screens captured — is the app actually running at that URL?')

  const manifest: CaptureManifest = {
    appName: opts.appName || pages[0].title || new URL(opts.url).hostname,
    baseUrl: opts.url,
    generatedAt: new Date().toISOString(),
    pages: pages.map((p, i) => ({
      index: i + 1,
      url: p.url,
      title: p.title,
      screenshot: relative(opts.outDir, p.screenshot),
      text: p.text,
      elements: p.elements,
      requests: p.requests,
    })),
  }
  const manifestPath = join(opts.outDir, 'capture.json')
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2))

  log.ok(`Captured ${pages.length} screen(s) → ${manifestPath}`)
  log.info('Next: read capture.json + the screenshots, write manual.json, then `manuscribe render`.')
  return manifestPath
}
