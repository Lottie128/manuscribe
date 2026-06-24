// Assemble the agent-written sections + screenshots into one self-contained,
// A4-precise HTML document (screenshots embedded as base64 so output needs no
// external files). No AI here — this just lays out what the agent produced, with
// a premium ZeroAI-branded design that maps 1:1 to the printed A4 page.

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

// Inline every relative <img src="…"> (e.g. close-ups in section markdown) as a
// base64 data URI so the output is fully self-contained.
async function inlineImages(html: string, baseDir: string): Promise<string> {
  const srcs = [...new Set([...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]).filter(s => !/^(data:|https?:)/.test(s)))]
  let out = html
  for (const src of srcs) {
    const uri = await dataUri(src, baseDir)
    if (uri) out = out.split(`src="${src}"`).join(`src="${uri}"`)
  }
  return out
}

// Turn "_Tip:_ …" / "_Note:_ …" lead lines into styled callout blockquotes.
const CALLOUTS = 'Tip|Note|Why it matters|Behind the scenes|Good to know|Teaching idea|Teaching tip|Heads up|Important'
function calloutize(src: string): string {
  return src.replace(new RegExp(`^_(${CALLOUTS}):_\\s*(.+)$`, 'gim'), (_m, label, rest) => `> **${label} —** ${rest}`)
}
const mdBody = (s: string) => md(calloutize(s))

const CSS = `
  * { box-sizing: border-box; }
  @page { size: A4; }
  html, body { margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2430; line-height: 1.6; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* ── Cover ── */
  .cover { position: relative; width: 210mm; min-height: 273mm; padding: 28mm 22mm; color: #fff; overflow: hidden; display: flex; flex-direction: column; page-break-after: always;
    background: radial-gradient(120% 85% at 82% -5%, #2c1f59 0%, #141734 46%, #0a0c15 100%); }
  .cover .glow { position: absolute; width: 320mm; height: 320mm; right: -130mm; top: -130mm; border-radius: 50%; background: radial-gradient(circle, rgba(124,92,255,0.30), transparent 62%); }
  .cover .logo { position: relative; display: flex; align-items: center; gap: 10px; }
  .cover .mark { width: 30px; height: 30px; border-radius: 9px; background: linear-gradient(135deg,#8f7bff,#5c9eff); box-shadow: 0 0 24px -4px rgba(143,123,255,0.85); }
  .cover .logo b { font-size: 16px; font-weight: 800; letter-spacing: -0.01em; }
  .cover .eyebrow { position: relative; margin-top: 40mm; font-size: 12px; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase; color: #aab0ff; }
  .cover h1 { position: relative; font-size: 64px; line-height: 1.0; margin: 12px 0 0; letter-spacing: -0.035em; }
  .cover .rule { position: relative; width: 78px; height: 5px; border-radius: 4px; background: linear-gradient(90deg,#8f7bff,#5c9eff); margin: 22px 0; }
  .cover .tagline { position: relative; font-size: 15px; color: #c4cadb; max-width: 135mm; line-height: 1.55; }
  .cover .meta { position: relative; margin-top: auto; font-size: 11.5px; color: #8b93a7; }
  .cover .meta b { color: #cdd3ff; }

  /* ── Content ── */
  .doc { padding: 2mm 16mm 6mm; }
  h2 { font-size: 21px; margin: 20px 0 8px; color: #121620; letter-spacing: -0.01em; padding-bottom: 6px; border-bottom: 2px solid #ece9ff; break-after: avoid; }
  h3 { font-size: 11.5px; margin: 14px 0 5px; color: #6b4bff; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 800; break-after: avoid; }
  p, li { font-size: 12px; }
  p { margin: 6px 0; }
  ul, ol { margin: 6px 0; padding-left: 18px; }
  li { margin: 3px 0; }
  strong { color: #14181f; }
  a { color: #5c46cf; }
  code { background: #f2f4f7; padding: 1px 5px; border-radius: 4px; font-size: 11px; }

  /* contents */
  .toc { page-break-after: always; }
  .toc h2 { border: 0; }
  .toc ol { list-style: none; padding: 0; margin: 8px 0 0; }
  .toc li { display: flex; gap: 12px; align-items: baseline; padding: 8px 2px; border-bottom: 1px solid #eef1f5; font-size: 13px; font-weight: 600; color: #2a3140; }
  .toc li .n { color: #7c5cff; font-weight: 800; min-width: 18px; }

  /* chapter label */
  .chip { display: inline-block; font-size: 9px; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; color: #6b4bff; background: #f0ecff; border-radius: 999px; padding: 3px 11px; margin: 14px 0 0; }
  section { break-inside: auto; }

  /* figures — sized by max-width/height with auto so the box hugs the image
     (no object-fit letterbox boxes, no overflow/overlap) */
  .shot { display: block; max-width: 100%; max-height: 120mm; width: auto; height: auto; border: 1px solid #e6e3f5; border-radius: 10px; margin: 8px auto 2px; box-shadow: 0 8px 24px -12px rgba(40,30,90,0.4); break-inside: avoid; }
  p > img, li > img { display: block; max-width: 60%; max-height: 105mm; width: auto; height: auto; margin: 8px auto 2px; border: 1px solid #e6e3f5; border-radius: 8px; box-shadow: 0 8px 24px -14px rgba(40,30,90,0.4); break-inside: avoid; }
  figure, .fig { break-inside: avoid; }
  p:has(> img) { text-align: center; margin: 8px 0; }
  p:has(> em:only-child) { text-align: center; font-size: 10.5px; color: #828aa2; margin: 2px 0 10px; break-before: avoid; }

  /* callouts */
  blockquote { margin: 10px 0; padding: 9px 14px; background: linear-gradient(90deg,#f6f3ff,#f3f7ff); border-left: 3px solid #7c5cff; border-radius: 0 8px 8px 0; break-inside: avoid; }
  blockquote p { margin: 0; font-size: 11.5px; color: #423c5c; }
  blockquote strong { color: #5b3fd6; }

  .credit { margin-top: 16px; padding-top: 10px; border-top: 1px solid #eef1f5; font-size: 9.5px; color: #aab2bd; }
`

export async function buildHtml(manual: ManualInput, baseDir: string): Promise<string> {
  const now = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  const toc = manual.sections.map((s, i) => `<li><span class="n">${i + 1}</span><span>${esc(s.title)}</span></li>`).join('')
  const body: string[] = []
  for (const [i, s] of manual.sections.entries()) {
    const lead = s.screenshot ? await imgTag(s.screenshot, baseDir) : ''
    body.push(`<section><div class="chip">Chapter ${i + 1}</div>${lead}${mdBody(s.markdown)}</section>`)
  }
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
  <section class="cover">
    <div class="glow"></div>
    <div class="logo"><span class="mark"></span><b>ZeroAI</b></div>
    <div class="eyebrow">STEM Suite · User Handbook</div>
    <h1>${esc(manual.appName)}</h1>
    <div class="rule"></div>
    <div class="tagline">${esc(manual.baseUrl)}</div>
    <div class="meta">A <b>ZeroAI</b> product · ${esc(now)}<br/>Generated by manuscribe — written by Claude Code</div>
  </section>
  <main class="doc">
    <section class="toc"><h2>Contents</h2><ol>${toc}</ol></section>
    ${manual.overview ? mdBody(manual.overview) : ''}
    ${body.join('\n')}
    ${manual.dataFlow ? mdBody(manual.dataFlow) : ''}
    ${manual.glossary ? mdBody(manual.glossary) : ''}
    <p class="credit">Generated automatically from the live application by manuscribe (ZeroAI), written by Claude Code. Review for accuracy before distribution.</p>
  </main>
  </body></html>`
  return inlineImages(html, baseDir)
}
