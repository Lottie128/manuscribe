// Assemble the agent-written sections + screenshots into a single self-contained
// HTML document (screenshots embedded as base64 so the PDF needs no external
// files). No AI here — this just lays out what the agent produced.

import { readFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { marked } from 'marked'
import type { ManualInput } from './types.js'

const md = (s: string) => marked.parse(s, { async: false }) as string
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function dataUri(path: string, baseDir: string): Promise<string | null> {
  try {
    const abs = isAbsolute(path) ? path : join(baseDir, path)
    return `data:image/png;base64,${(await readFile(abs)).toString('base64')}`
  } catch { return null }
}

async function imgTag(screenshot: string, baseDir: string): Promise<string> {
  const uri = await dataUri(screenshot, baseDir)
  return uri ? `<img class="shot" src="${uri}" alt="screenshot" />` : ''
}

// Inline every relative <img src="…"> (e.g. close-ups dropped into a section's
// markdown) as a base64 data URI, so the PDF is fully self-contained.
async function inlineImages(html: string, baseDir: string): Promise<string> {
  const srcs = [...new Set([...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]).filter(s => !/^(data:|https?:)/.test(s)))]
  let out = html
  for (const src of srcs) {
    const uri = await dataUri(src, baseDir)
    if (uri) out = out.split(`src="${src}"`).join(`src="${uri}"`)
  }
  return out
}

// Turn "_Tip:_ …" / "_Note:_ …" style lead lines into styled callout blockquotes.
const CALLOUTS = 'Tip|Note|Why it matters|Behind the scenes|Good to know|Teaching idea|Teaching tip|Heads up|Important'
function calloutize(src: string): string {
  return src.replace(new RegExp(`^_(${CALLOUTS}):_\\s*(.+)$`, 'gim'), (_m, label, rest) => `> **${label} —** ${rest}`)
}
const mdBody = (s: string) => md(calloutize(s))

const CSS = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #20242c; line-height: 1.65; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { padding: 0 9mm; }
  h1 { font-size: 30px; margin: 0 0 6px; letter-spacing: -0.02em; }
  h2 { font-size: 22px; margin: 28px 0 10px; padding-bottom: 7px; border-bottom: 2px solid #ece9ff; color: #161a22; letter-spacing: -0.01em; page-break-after: avoid; }
  h3 { font-size: 13px; margin: 16px 0 6px; color: #7c5cff; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 800; }
  p, li { font-size: 12.5px; }
  strong { color: #14181f; }
  code { background: #f2f4f7; padding: 1px 5px; border-radius: 4px; font-size: 11.5px; }
  a { color: #5c46cf; }
  /* Cover */
  .cover { height: 250mm; margin: 0 -9mm; padding: 0 18mm; background: linear-gradient(155deg,#0b0d14 0%,#15182a 52%,#241a3c 100%); color: #fff; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
  .cover .eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: #aab0ff; }
  .cover h1 { font-size: 56px; margin: 12px 0 8px; color: #fff; letter-spacing: -0.03em; }
  .cover .sub { font-size: 15px; color: #aeb6c8; }
  .cover .rule { width: 70px; height: 5px; border-radius: 4px; background: linear-gradient(90deg,#7c5cff,#5c9eff); margin: 24px 0; }
  .cover .brand { margin-top: auto; font-size: 12px; color: #8a93a6; }
  .cover .brand b { color: #cdd3ff; }
  /* Contents */
  .toc { page-break-after: always; }
  .toc h2 { border: 0; margin-bottom: 6px; }
  .toc ol { list-style: none; padding: 0; margin: 10px 0 0; }
  .toc li { display: flex; gap: 12px; align-items: baseline; padding: 9px 2px; border-bottom: 1px solid #eef1f5; font-size: 13.5px; font-weight: 600; color: #2a3140; }
  .toc li .n { color: #7c5cff; font-weight: 800; min-width: 20px; }
  /* Content */
  .shot { width: 100%; border: 1px solid #e3e8ef; border-radius: 10px; margin: 10px 0 4px; box-shadow: 0 2px 10px rgba(20,20,45,0.07); page-break-inside: avoid; }
  .section { margin-bottom: 10px; }
  p > img, li > img { display: block; max-width: 80%; margin: 10px auto 2px; border: 1px solid #e3e8ef; border-radius: 8px; box-shadow: 0 2px 10px rgba(20,20,45,0.08); page-break-inside: avoid; }
  p:has(> em:only-child) { text-align: center; font-size: 11px; color: #7a8290; margin-top: 3px; }
  blockquote { margin: 12px 0; padding: 9px 14px; background: #f5f3ff; border-left: 3px solid #7c5cff; border-radius: 0 8px 8px 0; page-break-inside: avoid; }
  blockquote p { margin: 0; font-size: 12px; color: #423c5c; }
  blockquote strong { color: #5b3fd6; }
  .tag { display: inline-block; font-size: 9.5px; font-weight: 700; letter-spacing: 0.03em; color: #7c5cff; background: #f1eeff; border-radius: 999px; padding: 2px 10px; margin-bottom: 8px; }
  .credit { margin-top: 16px; padding-top: 10px; border-top: 1px solid #eef1f5; font-size: 10px; color: #aab2bd; }
`

export async function buildHtml(manual: ManualInput, baseDir: string): Promise<string> {
  const now = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  const toc = manual.sections.map((s, i) => `<li><span class="n">${i + 1}</span><span>${esc(s.title)}</span></li>`).join('')
  const body: string[] = []
  for (const [i, s] of manual.sections.entries()) {
    const lead = s.screenshot ? await imgTag(s.screenshot, baseDir) : ''
    body.push(`<div class="section"><div class="tag">Chapter ${i + 1}</div>${lead}${mdBody(s.markdown)}</div>`)
  }
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
  <div class="page">
    <div class="cover">
      <div class="eyebrow">User Handbook</div>
      <h1>${esc(manual.appName)}</h1>
      <div class="rule"></div>
      <div class="sub">${esc(manual.baseUrl)}</div>
      <div class="brand">A <b>ZeroAI</b> product · ${esc(now)}<br/>Generated by manuscribe, written by Claude Code</div>
    </div>

    <div class="toc">
      <h2>Contents</h2>
      <ol>${toc}</ol>
    </div>

    ${manual.overview ? mdBody(manual.overview) : ''}
    ${body.join('\n')}
    ${manual.dataFlow ? mdBody(manual.dataFlow) : ''}
    ${manual.glossary ? mdBody(manual.glossary) : ''}

    <p class="credit">Generated automatically from the live application by manuscribe (ZeroAI), written by Claude Code. Review for accuracy before distribution.</p>
  </div>
  </body></html>`
  return inlineImages(html, baseDir)
}
