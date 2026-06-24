// `manuscribe render <manual.json>` — the mechanical render step. No AI, no key.
// Takes the manual the agent wrote and produces a self-contained PDF.

import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { buildHtml } from './manual.js'
import { htmlToPdf } from './pdf.js'
import { log } from './log.js'
import type { ManualInput } from './types.js'

export async function runRender(manualPath: string, out: string, baseDir?: string): Promise<void> {
  const manual = JSON.parse(await readFile(manualPath, 'utf8')) as ManualInput
  if (!manual.sections?.length) throw new Error('manual.json has no sections.')
  const base = baseDir ? resolve(baseDir) : dirname(resolve(manualPath))

  log.step(`Rendering ${manual.sections.length} section(s) → PDF…`)
  const html = await buildHtml(manual, base)
  await htmlToPdf(html, out)
  log.ok(`Manual written to ${out}`)
}
