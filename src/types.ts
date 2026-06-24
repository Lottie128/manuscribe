// Shared types. manuscribe does the mechanical work (crawl + render); the
// *writing* is done by the calling agent (Claude Code), so there are no API keys
// or model calls in this tool.

export interface NetworkCall {
  method: string
  url: string
  resourceType: string // 'xhr' | 'fetch' | ...
}

export interface UiElement {
  kind: string  // 'button' | 'link' | 'input' | 'heading' | ...
  text: string
}

// One screen captured from the running app (in-memory during crawl).
export interface CapturedPage {
  url: string
  title: string
  screenshot: string       // absolute path to the PNG on disk
  text: string
  elements: UiElement[]
  requests: NetworkCall[]
}

// ── capture.json : what `manuscribe crawl` writes for the agent to read ──
export interface CapturePage {
  index: number
  url: string
  title: string
  screenshot: string       // path relative to the capture dir, e.g. "screenshots/1-home.png"
  text: string
  elements: UiElement[]
  requests: NetworkCall[]
}
export interface CaptureManifest {
  appName: string
  baseUrl: string
  generatedAt: string
  pages: CapturePage[]
}

// ── manual.json : what the agent writes for `manuscribe render` ──
export interface ManualSection {
  title: string
  screenshot: string       // relative to --base-dir (usually the capture dir)
  markdown: string
}
export interface ManualInput {
  appName: string
  baseUrl: string
  overview?: string
  sections: ManualSection[]
  dataFlow?: string
  glossary?: string
}

export interface CrawlOptions {
  url: string
  outDir: string
  maxPages: number
  headful: boolean
  appName?: string
  clicks: string[]  // SPA flow: button/link labels to click in order, screenshotting each state
}
