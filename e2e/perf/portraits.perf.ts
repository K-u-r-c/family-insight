/*
 * Manual performance check (not run in CI): a tree of ~1 000 people, each
 * with a portrait, is opened and panned; reports frame times. Run with
 *   npm run test:perf
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { Resvg } from '@resvg/resvg-js'
import { strToU8, zipSync } from 'fflate'
import { createHash } from 'node:crypto'
import { closeApp, launch, tempDir } from '../app'

function buildTree(): Uint8Array {
  const persons: Record<string, unknown> = {}
  const relationships: Record<string, unknown> = {}
  const media: Record<string, unknown> = {}
  const files: Record<string, Uint8Array> = {}
  const now = '2026-01-01T00:00:00.000Z'
  let n = 0
  const person = (sex: 'male' | 'female', year: number): string => {
    const id = `p${n++}`
    const hue = (n * 47) % 360
    const png = new Resvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="hsl(${hue},40%,60%)"/><circle cx="128" cy="110" r="60" fill="hsl(${hue},30%,85%)"/><text x="128" y="230" font-size="40" text-anchor="middle">${n}</text></svg>`
    )
      .render()
      .asPng()
    const hash = createHash('sha256').update(png).digest('hex')
    files[`media/${hash}.png`] = png
    files[`thumbs/${hash}.webp`] = png // decoded by content; real thumbnails are WebP
    media[`m${id}`] = { id: `m${id}`, hash, mime: 'image/png', fileName: 'portrait.png' }
    persons[id] = {
      id,
      givenNames: sex === 'male' ? 'Jan' : 'Anna',
      surname: `Nowak ${n}`,
      sex,
      birth: { date: { value: String(year), qualifier: 'exact' } },
      events: [],
      portraitMediaId: `m${id}`,
      createdAt: now,
      updatedAt: now
    }
    return id
  }
  let r = 0
  const couple = (a: string, b: string) => {
    relationships[`r${r}`] = {
      id: `r${r++}`,
      type: 'partnership',
      partnerIds: [a, b],
      kind: 'marriage'
    }
  }
  const child = (parent: string, kid: string) => {
    relationships[`r${r}`] = {
      id: `r${r++}`,
      type: 'parent-child',
      parentId: parent,
      childId: kid,
      kind: 'biological'
    }
  }
  const root = person('male', 1800)
  let generation = [[root, person('female', 1802)]]
  couple(generation[0]![0]!, generation[0]![1]!)
  for (let g = 1; g <= 8; g++) {
    const next: string[][] = []
    for (const [a, b] of generation) {
      for (let k = 0; k < 2; k++) {
        const kid = person(k ? 'female' : 'male', 1800 + g * 25)
        child(a!, kid)
        child(b!, kid)
        const spouse = person(k ? 'male' : 'female', 1800 + g * 25)
        couple(kid, spouse)
        next.push([kid, spouse])
      }
    }
    generation = next
  }
  const doc = {
    format: 'family-insight',
    schemaVersion: 3,
    meta: {
      name: 'Portraits',
      createdAt: now,
      updatedAt: now,
      rootPersonId: root,
      view: { mode: 'descendants', depth: 9, collapsed: [] }
    },
    persons,
    relationships,
    sources: {},
    repositories: {},
    media
  }
  console.info(`${n} people with portraits`)
  return zipSync({
    'tree.json': strToU8(JSON.stringify(doc)),
    ...Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: 0 }]]))
  })
}

for (const style of ['modern', 'tapestry'] as const)
  test(`portraits: panning a tree of ~1 000 people with portraits (${style})`, async () => {
    test.setTimeout(180_000)
    const file = join(tempDir(), 'portraits.finsight')
    writeFileSync(file, buildTree())
    const t0 = Date.now()
    const log = (m: string) => console.info(`${((Date.now() - t0) / 1000).toFixed(1)} s: ${m}`)
    const { app, page } = await launch({ args: [file], visible: true, style })
    log('launched')
    await expect(page.locator('[data-person-id] img').first()).toBeVisible({ timeout: 60_000 })
    log('first portrait visible')
    // The whole family, zoomed out so that every card is on screen at once (worst case).
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'view:fit')
    )
    await page.waitForTimeout(1500)
    log('fitted')
    const cards = await page.locator('[data-person-id]').count()
    const images = await page.locator('[data-person-id] img').count()
    const box = (await page.getByRole('application').boundingBox())!
    const frames = page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const times: number[] = []
          let last = performance.now()
          const end = last + 4000
          const tick = (now: number) => {
            times.push(now - last)
            last = now
            if (now < end) requestAnimationFrame(tick)
            else resolve(times)
          }
          requestAnimationFrame(tick)
        })
    )
    // Pan back and forth while frames are recorded.
    for (let i = 0; i < 6; i++) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(
        box.x + box.width / 2 + (i % 2 ? 400 : -400),
        box.y + box.height / 2 + 150,
        { steps: 25 }
      )
      await page.mouse.up()
    }
    const times = (await frames).slice(1).sort((a, b) => a - b)
    const avg = times.reduce((s, t) => s + t, 0) / times.length
    const p95 = times[Math.floor(times.length * 0.95)]!
    const max = times[times.length - 1]!
    console.info(
      `${style}: ${cards} cards rendered, ${images} portraits; ${times.length} frames in 4 s: ` +
        `${(1000 / avg).toFixed(0)} fps average, p95 frame ${p95.toFixed(1)} ms, worst ${max.toFixed(1)} ms`
    )
    await closeApp(app)
  })
