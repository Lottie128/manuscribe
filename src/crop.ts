// `manuscribe crop <image> -b x,y,w,h` — make a cropped close-up of a full
// screenshot to emphasise one control or area in the manual. Reuses Chromium
// (already a dependency) so there's no image library to add.

import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import { log } from './log.js'

export interface Box { x: number; y: number; width: number; height: number }

export function parseBox(s: string): Box {
  const n = s.split(',').map(v => Number(v.trim()))
  if (n.length !== 4 || n.some(v => !Number.isFinite(v))) throw new Error('--box must be "x,y,width,height" (pixels)')
  return { x: n[0], y: n[1], width: n[2], height: n[3] }
}

export async function cropImage(input: string, box: Box, out: string): Promise<void> {
  const b64 = (await readFile(input)).toString('base64')
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent(`<style>html,body{margin:0;padding:0}img{display:block}</style><img id="i" src="data:image/png;base64,${b64}">`)
    const dim = await page.locator('#i').evaluate(e => ({ w: (e as HTMLImageElement).naturalWidth, h: (e as HTMLImageElement).naturalHeight }))
    await page.setViewportSize({ width: Math.min(Math.max(dim.w, 1), 4000), height: Math.min(Math.max(dim.h, 1), 16000) })
    await page.waitForTimeout(80)
    const clip = {
      x: Math.max(0, box.x), y: Math.max(0, box.y),
      width: Math.min(box.width, dim.w - box.x), height: Math.min(box.height, dim.h - box.y),
    }
    if (clip.width <= 0 || clip.height <= 0) throw new Error('crop box is outside the image')
    await page.screenshot({ path: out, clip })
    log.ok(`Close-up → ${out}`)
  } finally {
    await browser.close()
  }
}
