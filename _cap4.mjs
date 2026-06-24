import { chromium } from 'playwright'
const BASE = process.env.BASE, OUT = '/tmp/zaicad-live'
const T_EMAIL = process.env.TEACHER_EMAIL, T_PASS = process.env.TEACHER_PASS
const S_USER = process.env.STUDENT_USER, S_PASS = process.env.STUDENT_PASS
const b = await chromium.launch({ headless: false })
const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png`, fullPage: true })
async function click(s, t) { for (const l of [s.getByRole('button', { name: t, exact: false }), s.getByRole('link', { name: t, exact: false }), s.getByText(t, { exact: false })]) { const f = l.first(); if (await f.count().catch(() => 0)) { try { await f.click({ timeout: 6000 }); return true } catch {} } } return false }

// Student connects first and stays
const sctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const sp = await sctx.newPage()
await sp.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {})
await sp.waitForTimeout(1500)
await click(sp, 'Sign in'); await sp.waitForTimeout(700)
const sm = sp.locator('.modal'); await click(sm, 'Student'); await sp.waitForTimeout(400)
await sm.getByPlaceholder('your-username').fill(S_USER)
await sm.locator('input[type="password"]').fill(S_PASS)
await sm.getByRole('button', { name: /^sign in$/i }).click(); await sp.waitForTimeout(3000)
await click(sp, 'Start modeling'); await sp.waitForTimeout(2500)
console.log('student connected')

// Teacher logs in, builds a model, opens panel, finds student class
const tctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const tp = await tctx.newPage()
await tp.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {})
await tp.waitForTimeout(1500)
await click(tp, 'Sign in'); await tp.waitForTimeout(700)
const tm = tp.locator('.modal'); await click(tm, 'Teacher'); await tp.waitForTimeout(400)
await tm.getByPlaceholder('you@school.edu').fill(T_EMAIL)
await tm.locator('input[type="password"]').fill(T_PASS)
await tm.getByRole('button', { name: /^sign in$/i }).click(); await tp.waitForTimeout(4000)
await click(tp, 'Start modeling'); await tp.waitForTimeout(1500)
// build a small model so the cast shows something
await click(tp, 'Cube'); await tp.waitForTimeout(700); await click(tp, 'Sphere'); await tp.waitForTimeout(700); await click(tp, 'Cylinder'); await tp.waitForTimeout(700)
await shot(tp, 'teacher-model')
await click(tp, 'Teach'); await tp.waitForTimeout(600)
await click(tp, 'Teacher panel'); await tp.waitForTimeout(1500)
const sel = tp.locator('.modal select').first()
const opts = await sel.locator('option').count()
let found = false
for (let i = 1; i < opts; i++) { await sel.selectOption({ index: i }); await tp.waitForTimeout(2600); if (!/No students connected yet/i.test(await tp.locator('.modal').innerText())) { found = true; break } }
console.log('found student class:', found)
await shot(tp, 'teacher-panel-students')

// LOCK → student
await click(tp, 'Lock screens'); await tp.waitForTimeout(1500)
await sp.bringToFront(); await sp.waitForTimeout(3500)
await shot(sp, 'student-locked')
console.log('student locked overlay?', /eyes on the teacher/i.test(await sp.locator('body').innerText()))
await shot(tp, 'teacher-locked')

// UNLOCK then CAST → student
await tp.bringToFront(); await tp.waitForTimeout(500)
await click(tp, 'Unlock'); await tp.waitForTimeout(1200)
await click(tp, 'Present my model'); await tp.waitForTimeout(1500)
await sp.bringToFront(); await sp.waitForTimeout(6500)
await shot(sp, 'student-cast')
console.log('student cast LIVE banner?', /live.*teacher|teacher.*model/i.test(await sp.locator('body').innerText()))
await b.close()
