// Crawl a running web app with a headless browser. Two modes that combine:
//   • link mode  — follow same-origin <a href> links breadth-first (good for MPAs)
//   • click flow — click named buttons/links in order, screenshotting each state
//                  (essential for SPAs, where screens live behind buttons/modals)
// For every captured screen we record a full-page screenshot, the interactive UI
// elements, and the XHR/fetch calls observed for that screen (for data-flow).

import { chromium, type Browser, type Page } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { CapturedPage, NetworkCall, UiElement } from './types.js'
import { log } from './log.js'

const slug = (s: string) =>
  s.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'screen'

async function extract(page: Page): Promise<{ text: string; elements: UiElement[] }> {
  return page.evaluate(() => {
    const seen = new Set<string>()
    const els: { kind: string; text: string }[] = []
    const add = (kind: string, text: string) => {
      const t = (text || '').replace(/\s+/g, ' ').trim()
      if (!t || t.length > 80) return
      const key = kind + '|' + t.toLowerCase()
      if (seen.has(key)) return
      seen.add(key); els.push({ kind, text: t })
    }
    document.querySelectorAll('h1,h2,h3').forEach(e => add('heading', e.textContent || ''))
    document.querySelectorAll('button,[role="button"]').forEach(e => add('button', e.textContent || ''))
    document.querySelectorAll('a[href]').forEach(e => add('link', e.textContent || ''))
    document.querySelectorAll('input,textarea,select').forEach(e => {
      const el = e as HTMLInputElement
      add('input', el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.getAttribute('name') || el.type || 'field')
    })
    const text = (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 2500)
    return { text, elements: els.slice(0, 60) }
  })
}

async function sameOriginLinks(page: Page, origin: string): Promise<string[]> {
  return page.evaluate((o) => {
    const out = new Set<string>()
    document.querySelectorAll('a[href]').forEach(a => {
      try {
        const u = new URL((a as HTMLAnchorElement).href, location.href); u.hash = ''
        if (u.origin === o) out.add(u.toString())
      } catch { /* ignore */ }
    })
    return [...out]
  }, origin)
}

// Try to click an element by its visible text (button → link → any text).
async function clickByText(page: Page, text: string): Promise<boolean> {
  const tries = [
    page.getByRole('button', { name: text, exact: false }),
    page.getByRole('link', { name: text, exact: false }),
    page.getByText(text, { exact: false }),
  ]
  for (const loc of tries) {
    const first = loc.first()
    if (await first.count().catch(() => 0)) {
      try { await first.click({ timeout: 5000 }); return true } catch { /* try next */ }
    }
  }
  return false
}

export async function crawlSite(
  startUrl: string, maxPages: number, outDir: string, headful: boolean, clicks: string[] = [],
): Promise<CapturedPage[]> {
  const shotDir = join(outDir, 'screenshots')
  await mkdir(shotDir, { recursive: true })
  const origin = new URL(startUrl).origin

  let browser: Browser | null = null
  try {
    browser = await chromium.launch({ headless: !headful })
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const pages: CapturedPage[] = []

    // shared screen-capture helper
    const snap = async (page: Page, url: string, label: string, requests: NetworkCall[]) => {
      const shot = join(shotDir, `${pages.length + 1}-${slug(label)}.png`)
      await page.screenshot({ path: shot, fullPage: true })
      const { text, elements } = await extract(page)
      pages.push({ url, title: (await page.title()) || label, screenshot: shot, text, elements, requests: [...requests] })
    }

    if (clicks.length) {
      // ── SPA click-flow: one page, click through states ──
      const page = await ctx.newPage()
      const reqs: NetworkCall[] = []
      let mark = 0
      page.on('request', r => { const t = r.resourceType(); if (t === 'xhr' || t === 'fetch') reqs.push({ method: r.method(), url: r.url(), resourceType: t }) })
      log.step(`Visiting ${startUrl}`)
      await page.goto(startUrl, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => page.goto(startUrl, { waitUntil: 'load', timeout: 30000 }))
      await page.waitForTimeout(800)
      await snap(page, page.url(), startUrl, reqs.slice(mark)); mark = reqs.length

      for (const target of clicks) {
        if (pages.length >= maxPages) break
        log.step(`Clicking "${target}"`)
        const ok = await clickByText(page, target)
        if (!ok) { log.warn(`Could not find "${target}" to click — skipping`); continue }
        await page.waitForTimeout(1200)
        await snap(page, page.url(), target, reqs.slice(mark)); mark = reqs.length
      }
      await page.close()
    } else {
      // ── link-crawl (MPA): same-origin BFS ──
      const queue = [startUrl]
      const visited = new Set<string>()
      while (queue.length && pages.length < maxPages) {
        const url = queue.shift()!
        if (visited.has(url)) continue
        visited.add(url)
        const page = await ctx.newPage()
        const reqs: NetworkCall[] = []
        page.on('request', r => { const t = r.resourceType(); if (t === 'xhr' || t === 'fetch') reqs.push({ method: r.method(), url: r.url(), resourceType: t }) })
        try {
          log.step(`Visiting ${url}`)
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => page.goto(url, { waitUntil: 'load', timeout: 30000 }))
          await page.waitForTimeout(800)
          await snap(page, url, url, reqs)
          if (pages.length < maxPages) {
            for (const link of await sameOriginLinks(page, origin)) {
              if (!visited.has(link) && !queue.includes(link)) queue.push(link)
            }
          }
        } catch (e) {
          log.warn(`Skipped ${url}: ${(e as Error).message}`)
        } finally {
          await page.close()
        }
      }
    }
    return pages
  } finally {
    await browser?.close()
  }
}
