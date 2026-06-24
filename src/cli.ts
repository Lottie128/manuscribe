#!/usr/bin/env node
import { Command } from 'commander'
import { resolve } from 'node:path'
import { runCrawl } from './capture.js'
import { runRender } from './render.js'
import { cropImage, parseBox } from './crop.js'
import { log } from './log.js'

const program = new Command()
program
  .name('manuscribe')
  .description('Turn your running web app into a PDF user manual. Claude Code does the writing (no API key); manuscribe crawls, screenshots, crops close-ups and renders.')
  .version('0.4.0')

// Step 1 — capture (mechanical, no AI)
program
  .command('crawl')
  .description('Crawl a running app: screenshots + capture.json for the agent to read')
  .argument('<url>', 'URL of the running app (e.g. http://localhost:5173)')
  .option('-n, --name <name>', 'app name')
  .option('-p, --pages <n>', 'maximum screens to crawl', '8')
  .option('--headful', 'show the browser while it crawls', false)
  .option('-c, --click <path>', 'SPA flow: a ">"-separated path of button/link labels to a screen, then capture it (repeatable; each path runs from a fresh load)', (v: string, acc: string[]) => { acc.push(v); return acc }, [])
  .option('-d, --out-dir <dir>', 'where to write screenshots + capture.json', 'manuscribe-out')
  .action(async (url: string, o: { name?: string; pages: string; headful: boolean; click: string[]; outDir: string }) => {
    try {
      await runCrawl({
        url, appName: o.name,
        maxPages: Math.max(1, parseInt(o.pages, 10) || 8),
        headful: !!o.headful,
        clicks: o.click,
        outDir: resolve(o.outDir),
      })
    } catch (e) { log.err((e as Error).message); process.exit(1) }
  })

// Step 2 — render (mechanical, no AI). The agent writes manual.json in between.
program
  .command('render')
  .description('Render the manual the agent wrote (manual.json) into a PDF')
  .argument('<manual.json>', 'path to the manual definition written by the agent')
  .option('-o, --out <file>', 'output PDF path', 'manual.pdf')
  .option('-b, --base-dir <dir>', 'base dir for screenshot paths (usually the crawl out-dir)')
  .action(async (manual: string, o: { out: string; baseDir?: string }) => {
    try {
      await runRender(resolve(manual), resolve(o.out), o.baseDir)
    } catch (e) { log.err((e as Error).message); process.exit(1) }
  })

// Helper — crop a close-up from a screenshot to emphasise a control/area.
program
  .command('crop')
  .description('Crop a close-up region from a screenshot (for emphasis in the manual)')
  .argument('<image>', 'source screenshot (PNG)')
  .requiredOption('-b, --box <x,y,w,h>', 'crop region in pixels: x,y,width,height')
  .option('-o, --out <file>', 'output PNG path', 'closeup.png')
  .action(async (image: string, o: { box: string; out: string }) => {
    try {
      await cropImage(resolve(image), parseBox(o.box), resolve(o.out))
    } catch (e) { log.err((e as Error).message); process.exit(1) }
  })

program.parseAsync()
