/*
 * Quality checks for the built documentation website (`npm run docs:build && npm run docs:test`):
 * every page loads cleanly, links/anchors/images resolve, no serious accessibility violations in
 * light and dark mode, no horizontal overflow on phones, search works in every language and the
 * guides of all languages have the same pages.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { extname, join } from 'node:path'
import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page
} from '@playwright/test'
import { SITE_LANGUAGES, siteText } from '../.vitepress/siteLocales'

const DIST = join(__dirname, '..', '.vitepress', 'dist')
const BASE = '/family-insight/'
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.csv': 'text/csv; charset=utf-8',
  '.xml': 'application/xml'
}

/** Maps a site path (`/family-insight/guide/install`) to a file in dist, like GitHub Pages. */
function fileFor(path: string): string | null {
  if (!path.startsWith(BASE)) return null
  const rel = decodeURIComponent(path.slice(BASE.length))
  const candidates = rel === '' || rel.endsWith('/') ? [`${rel}index.html`] : [rel, `${rel}.html`]
  for (const c of candidates) {
    const full = join(DIST, c)
    if (existsSync(full) && statSync(full).isFile()) return full
  }
  return null
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name)
    if (e.isDirectory()) return e.name === 'assets' ? [] : htmlFiles(full)
    return e.name.endsWith('.html') && e.name !== '404.html' ? [full] : []
  })
}

/** Every page as a site path, from the generated sitemap. */
function pages(): string[] {
  const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8')
  return [...xml.matchAll(/<loc>https:\/\/k-u-r-c\.github\.io(\/family-insight\/[^<]*)<\/loc>/g)]
    .map((m) => m[1]!)
    .sort()
}

/** Pages to open in the slower browser checks: the translated developer placeholders share one
 * template, so only the first of each language. */
function browserPages(): string[] {
  const seen = new Set<string>()
  return pages().filter((path) => {
    const section = /^(.*\/[a-z]{2}\/developer\/).+/.exec(path)?.[1]
    if (!section) return true
    if (seen.has(section)) return false
    seen.add(section)
    return true
  })
}

let server: Server
let origin = ''
let app: ElectronApplication
let page: Page

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const path = (req.url ?? '/').split(/[?#]/)[0]!
    const file = fileFor(path)
    if (!file) {
      res.writeHead(404, { 'content-type': TYPES['.html']! })
      res.end(readFileSync(join(DIST, '404.html')))
      return
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  app = await electron.launch({
    args: [join(__dirname, 'browser.mjs')],
    env: { ...process.env, ELECTRON_ENABLE_LOGGING: '0' }
  })
  page = await app.firstWindow()
})

test.afterAll(async () => {
  await app?.close()
  server?.close()
})

async function open(path: string, theme: 'light' | 'dark' = 'light'): Promise<string[]> {
  const problems: string[] = []
  const onConsole = (m: { type: () => string; text: () => string }): void => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`)
  }
  const onResponse = (r: { status: () => number; url: () => string }): void => {
    if (r.status() >= 400 && r.url().startsWith(origin)) problems.push(`${r.status()} ${r.url()}`)
  }
  page.on('console', onConsole)
  page.on('response', onResponse)
  await page.goto(`${origin}${path}`)
  await page.evaluate((t) => localStorage.setItem('vitepress-theme-appearance', t), theme)
  await page.reload({ waitUntil: 'load' })
  await page.waitForFunction(() => document.querySelector('#app')?.childElementCount)
  // Diagrams render after load (Mermaid measures them in a temporary element on the page).
  await page.waitForFunction(() => !document.querySelector('.fi-mermaid__source'), null, {
    timeout: 20_000
  })
  await page.waitForTimeout(100)
  page.off('console', onConsole)
  page.off('response', onResponse)
  return problems
}

test('the guide has the same pages in every language', () => {
  const all = pages()
  const en = all.filter((p) => p.startsWith(`${BASE}guide/`)).map((p) => p.slice(BASE.length))
  expect(en.length).toBeGreaterThan(20)
  for (const { prefix } of SITE_LANGUAGES.filter((l) => l.prefix)) {
    const translated = all
      .filter((p) => p.startsWith(`${BASE}${prefix.slice(1)}/guide/`))
      .map((p) => p.slice(BASE.length + prefix.length))
    expect(translated, prefix).toEqual(en)
  }
})

test('every link, anchor and image points to something that exists', () => {
  const broken: string[] = []
  const idsOf = new Map<string, Set<string>>()
  const ids = (file: string): Set<string> => {
    let set = idsOf.get(file)
    if (!set) {
      set = new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!))
      idsOf.set(file, set)
    }
    return set
  }
  for (const file of htmlFiles(DIST)) {
    const html = readFileSync(file, 'utf8')
    const self = `${BASE}${file.slice(DIST.length + 1).replace(/(index)?\.html$/, '')}`
    for (const [, attr, raw] of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
      const url = raw!.replace(/&amp;/g, '&')
      if (/^(https?:|mailto:|data:|javascript:)/.test(url)) continue
      const resolved = new URL(url, `http://site${self}`)
      const target = resolved.pathname
      const hash = resolved.hash.slice(1)
      const targetFile = fileFor(target)
      if (!targetFile) {
        broken.push(`${self}: ${attr} ${url}`)
        continue
      }
      if (hash && targetFile.endsWith('.html') && !ids(targetFile).has(decodeURIComponent(hash))) {
        broken.push(`${self}: missing anchor ${url}`)
      }
    }
  }
  expect(broken).toEqual([])
})

test('every page loads without errors and has a title, description and navigation', async () => {
  const issues: string[] = []
  const defaults = new Set(SITE_LANGUAGES.map((l) => siteText(l.code, 'description')))
  const homes = new Set(
    SITE_LANGUAGES.map((l) => `${BASE}${l.prefix.slice(1)}${l.prefix ? '/' : ''}`)
  )
  for (const path of pages()) {
    issues.push(...(await open(path)).map((p) => `${path}: ${p}`))
    const info = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      description:
        document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      pager: document.querySelectorAll('.pager-link').length,
      brokenImages: [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0 && img.offsetParent !== null)
        .map((img) => img.src)
    }))
    const home = homes.has(path)
    const placeholder = /\/[a-z]{2}\/developer\/.+/.test(path)
    if (!info.title || (!home && !info.h1)) issues.push(`${path}: no title or heading`)
    if (!home && !placeholder && defaults.has(info.description)) {
      issues.push(`${path}: no page description`)
    }
    if (!home && !placeholder && info.pager === 0) issues.push(`${path}: no previous/next links`)
    for (const src of info.brokenImages) issues.push(`${path}: image failed ${src}`)
  }
  expect(issues).toEqual([])
})

for (const theme of ['light', 'dark'] as const) {
  test(`no serious accessibility violations (${theme})`, async () => {
    const violations: string[] = []
    for (const path of browserPages()) {
      await open(path, theme)
      await page.addScriptTag({ content: AXE })
      const found = await page.evaluate(async () => {
        const axe = (
          window as unknown as {
            axe: {
              run: (
                ctx: Document,
                opts: object
              ) => Promise<{
                violations: { id: string; impact: string; nodes: { target: string[] }[] }[]
              }>
            }
          }
        ).axe
        const result = await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
        })
        return result.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map(
            (v) =>
              `${v.id} (${v.nodes
                .map((n) => n.target.join(' '))
                .slice(0, 3)
                .join(', ')})`
          )
      })
      violations.push(...found.map((v) => `${path}: ${v}`))
    }
    expect(violations).toEqual([])
  })
}

test('pages fit a phone screen and the menu opens', async () => {
  await page.setViewportSize({ width: 375, height: 800 })
  const overflowing: string[] = []
  for (const path of browserPages()) {
    await open(path)
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth
    }))
    if (widths.scroll > widths.client + 1) overflowing.push(`${path}: ${widths.scroll}px`)
  }
  expect(overflowing).toEqual([])

  await open(`${BASE}guide/`)
  await page.locator('.VPNavBarHamburger').click()
  await expect(page.locator('.VPNavScreen')).toBeVisible()
  await page.setViewportSize({ width: 1280, height: 800 })
})

for (const [path, query] of [
  [`${BASE}guide/`, 'CSV'],
  [`${BASE}guide/`, 'backup'],
  [`${BASE}pl/guide/`, 'kopia zapasowa'],
  [`${BASE}pl/guide/`, 'import'],
  [`${BASE}de/guide/`, 'Sicherungskopie'],
  [`${BASE}fr/guide/`, 'sauvegarde'],
  [`${BASE}es/guide/`, 'copia de seguridad'],
  [`${BASE}it/guide/`, 'backup'],
  [`${BASE}pt/guide/`, 'segurança'],
  [`${BASE}ru/guide/`, 'резервные']
] as const) {
  test(`search finds "${query}" (${path.slice(BASE.length).split('/')[0]})`, async () => {
    await open(path)
    await page.locator('#local-search button').click()
    const input = page.locator('.VPLocalSearchBox input')
    await input.waitFor()
    await input.pressSequentially(query, { delay: 30 })
    await expect(page.locator('.VPLocalSearchBox .result').first()).toBeVisible({ timeout: 15_000 })
  })
}
