import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ElectronApplication, Locator, Page } from '@playwright/test'
import { LOCALES as APP_LOCALES, SUPPORTED_LANGUAGES } from '../../src/shared/i18n'
import en from '../../src/shared/locales/en.json'
import { pseudoLocalize } from '../../src/shared/pseudo'
import { test } from '@playwright/test'
import { closeApp, launch, type Launched } from '../../e2e/app'

/** A UI language code, or `xx` for the pseudo-locale. */
export type Lang = string
export type Theme = 'light' | 'dark'
export interface Variant {
  lang: Lang
  theme: Theme
}

/**
 * `PSEUDO_SHOTS=1` renders every scene in the development pseudo-locale instead (accented,
 * 40 % longer texts) into `test-results/pseudo/`, and `SHOTS_LANG=de` in another UI language in
 * both themes into `test-results/lang-check/` – layout checks, not documentation.
 */
const PSEUDO = process.env.PSEUDO_SHOTS === '1'
const CHECK_LANG = process.env.SHOTS_LANG
const CHECK = PSEUDO || Boolean(CHECK_LANG)

export const VARIANTS: Variant[] = PSEUDO
  ? [{ lang: 'xx', theme: 'light' }]
  : CHECK_LANG
    ? [
        { lang: CHECK_LANG, theme: 'light' },
        { lang: CHECK_LANG, theme: 'dark' }
      ]
    : SUPPORTED_LANGUAGES.flatMap((lang) =>
        (['light', 'dark'] as const).map((theme): Variant => ({ lang, theme }))
      )

/** Window content size of every screenshot session. */
export const WINDOW = { width: 1280, height: 800 }
const OUT_DIR = CHECK
  ? join(__dirname, '..', '..', 'test-results', PSEUDO ? 'pseudo' : 'lang-check')
  : join(__dirname, '..', 'public', 'screenshots')
const MANIFEST = join(__dirname, '..', '.vitepress', 'screenshots.json')
/** Annotation colour: high contrast on both themes and distinct from the app's palette. */
const MARK = '#e8590c'

const LOCALES: Record<Lang, unknown> = {
  ...Object.fromEntries(SUPPORTED_LANGUAGES.map((l) => [l, APP_LOCALES[l].translation])),
  xx: pseudoLocalize(en)
}

/** Translates like the app (i18next keys, `{{var}}` interpolation, `_one/_other` plurals). */
export function translate(
  lang: Lang,
  key: string,
  vars: Record<string, string | number> = {}
): string {
  let k = key
  if (typeof vars.count === 'number') {
    const form = new Intl.PluralRules(lang).select(vars.count)
    const base = lookup(lang, `${key}_${form}`) ?? lookup(lang, `${key}_other`)
    if (base !== undefined) return interpolate(base, vars)
    k = key
  }
  const value = lookup(lang, k)
  if (value === undefined) throw new Error(`Missing translation: ${lang}:${key}`)
  return interpolate(value, vars)
}

function lookup(lang: Lang, key: string): string | undefined {
  let node: unknown = LOCALES[lang]
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(vars[name] ?? ''))
}

export interface Session extends Launched {
  variant: Variant
  t: (key: string, vars?: Record<string, string | number>) => string
}

/** Starts the built app for one language/theme with a fixed window size. */
export interface StartOptions {
  args?: string[]
  settings?: Record<string, unknown>
  /** Writes extra files (recovery snapshots, …) into the fresh profile before launch. */
  prepare?: (userData: string) => void
}

export async function start(variant: Variant, options: StartOptions = {}): Promise<Session> {
  let userData: string | undefined
  if (options.settings || options.prepare) {
    const { mkdtempSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    userData = mkdtempSync(join(tmpdir(), 'fi-shots-'))
    writeFileSync(
      join(userData, 'settings.json'),
      JSON.stringify({
        language: variant.lang,
        theme: variant.theme,
        tours: ['first-run'],
        showTips: false,
        ...options.settings
      })
    )
    options.prepare?.(userData)
  }
  const launched = await launch({
    language: variant.lang,
    theme: variant.theme,
    userData,
    args: ['--force-device-scale-factor=1', ...(options.args ?? [])],
    env: PSEUDO ? { FAMILY_INSIGHT_PSEUDO: '1' } : undefined
  })
  await resize(launched.app)
  return { ...launched, variant, t: (key, vars) => translate(variant.lang, key, vars) }
}

async function resize(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ BrowserWindow }, size) => {
    BrowserWindow.getAllWindows()[0]?.setContentSize(size.width, size.height)
  }, WINDOW)
  await new Promise((resolve) => setTimeout(resolve, 300))
}

/** Where the step number sits relative to the marked element. */
export type BadgePlacement = 'corner' | 'left' | 'right' | 'above'
export type Step = Locator | { target: Locator; badge: BadgePlacement }

export interface ShotOptions {
  /** Crop to the union of these elements (plus `pad`); the whole window when omitted. */
  clip?: Locator | Locator[]
  pad?: number
  /** Elements to mark with numbered rings, in step order. */
  steps?: Step[]
  /** Replace the dimmed app behind an open dialog with a plain background. */
  isolate?: boolean
  /** Extra time for the UI to settle before capturing. */
  settle?: number
}

/**
 * Captures the window (or a part of it) as WebP into
 * `docs/public/screenshots/<lang>/<theme>/<name>.webp` and records its size in the manifest
 * used by the `<Screenshot>` component.
 */
export async function shot(
  session: Session,
  name: string,
  options: ShotOptions = {}
): Promise<void> {
  const { page, variant } = session
  await page.waitForTimeout(options.settle ?? 900)
  if (options.isolate) {
    await page.addStyleTag({
      content:
        'dialog::backdrop{background:var(--color-bg)!important;backdrop-filter:none!important}'
    })
  }
  const marks = await placeMarks(options.steps ?? [])
  if (marks.length) await drawMarks(page, marks)

  let clip: Box | undefined
  if (options.clip) {
    const targets = Array.isArray(options.clip) ? options.clip : [options.clip]
    const boxes = await Promise.all(targets.map((l) => l.boundingBox()))
    const pad = options.pad ?? 16
    const valid = boxes.filter((b): b is Box => b !== null)
    if (!valid.length) throw new Error(`${name}: clip target not visible`)
    const area = [...valid.map((b) => grow(b, pad)), ...marks.map((m) => grow(m.extent, 6))]
    const x1 = Math.max(0, Math.min(...area.map((b) => b.x)))
    const y1 = Math.max(0, Math.min(...area.map((b) => b.y)))
    const x2 = Math.min(WINDOW.width, Math.max(...area.map((b) => b.x + b.width)))
    const y2 = Math.min(WINDOW.height, Math.max(...area.map((b) => b.y + b.height)))
    clip = {
      x: Math.round(x1),
      y: Math.round(y1),
      width: Math.round(x2 - x1),
      height: Math.round(y2 - y1)
    }
  }

  // Capturing stops requestAnimationFrame in the hidden window for good, so every screenshot
  // is the last action of its app session (see `scene`).
  const area = clip ?? { x: 0, y: 0, ...WINDOW }
  const cdp = await page.context().newCDPSession(page)
  const { data: base64 } = await cdp.send('Page.captureScreenshot', {
    format: 'webp',
    quality: 90,
    clip: { ...area, scale: 1 }
  })
  const data = Buffer.from(base64, 'base64')
  const { width, height } = area

  const dir = join(OUT_DIR, variant.lang, variant.theme)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.webp`), data)
  record(name, variant, width, height)
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

interface Mark {
  ring: Box
  badge: { x: number; y: number }
  /** Ring and badge together, so a cropped screenshot can include both. */
  extent: Box
}

const BADGE = 26
const RING_GAP = 4

function grow(b: Box, by: number): Box {
  return { x: b.x - by, y: b.y - by, width: b.width + 2 * by, height: b.height + 2 * by }
}

async function placeMarks(steps: Step[]): Promise<Mark[]> {
  const marks: Mark[] = []
  for (const step of steps) {
    const { target, badge } = 'target' in step ? step : { target: step, badge: 'corner' as const }
    const box = await target.boundingBox()
    if (!box) throw new Error(`Annotation target not visible: ${target}`)
    const ring = grow(box, RING_GAP)
    const midY = ring.y + ring.height / 2 - BADGE / 2
    const position = {
      corner: { x: ring.x - BADGE / 2, y: ring.y - BADGE / 2 },
      left: { x: ring.x - BADGE - 6, y: midY },
      right: { x: ring.x + ring.width + 6, y: midY },
      above: { x: ring.x + ring.width / 2 - BADGE / 2, y: ring.y - BADGE - 6 }
    }[badge]
    const at = { x: Math.max(2, position.x), y: Math.max(2, position.y) }
    const x1 = Math.min(ring.x, at.x)
    const y1 = Math.min(ring.y, at.y)
    const x2 = Math.max(ring.x + ring.width, at.x + BADGE)
    const y2 = Math.max(ring.y + ring.height, at.y + BADGE)
    marks.push({ ring, badge: at, extent: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } })
  }
  return marks
}

/** Draws numbered rings over the marked elements. */
async function drawMarks(page: Page, marks: Mark[]): Promise<void> {
  await page.evaluate(
    ({ marks, color, size }) => {
      const layer = document.createElement('div')
      // A popover joins the top layer above open <dialog>s, which z-index cannot do.
      layer.popover = 'manual'
      layer.style.cssText =
        'position:fixed;inset:0;width:100vw;height:100vh;margin:0;padding:0;border:0;background:transparent;overflow:visible;pointer-events:none'
      marks.forEach(({ ring: r, badge: b }, i) => {
        const ring = document.createElement('div')
        ring.style.cssText = `position:absolute;left:${r.x}px;top:${r.y}px;width:${r.width}px;height:${r.height}px;border:3px solid ${color};border-radius:10px;box-sizing:border-box;box-shadow:0 0 0 2px rgb(255 255 255 / 85%),0 0 12px rgb(0 0 0 / 25%)`
        const badge = document.createElement('div')
        badge.textContent = String(i + 1)
        badge.style.cssText = `position:absolute;left:${b.x}px;top:${b.y}px;width:${size}px;height:${size}px;border-radius:50%;background:${color};color:#fff;font:700 14px/${size}px Inter Variable,system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff,0 2px 6px rgb(0 0 0 / 35%)`
        layer.append(ring, badge)
      })
      document.body.append(layer)
      layer.showPopover()
    },
    { marks, color: MARK, size: BADGE }
  )
}

type Manifest = Record<string, Record<string, [number, number]>>

function record(name: string, variant: Variant, width: number, height: number): void {
  if (CHECK) return
  let manifest: Manifest = {}
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest
  } catch {
    // First screenshot.
  }
  manifest[name] = { ...manifest[name], [`${variant.lang}-${variant.theme}`]: [width, height] }
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
  // Same layout as Prettier ([width, height] on one line), so regenerating keeps format:check green.
  const json = JSON.stringify(sorted, null, 2).replace(/\[\s+(\d+),\s+(\d+)\s+\]/g, '[$1, $2]')
  writeFileSync(MANIFEST, `${json}\n`)
}

/**
 * Registers one screenshot in every language and theme. `run` brings a fresh app session into
 * the right state and returns what to capture; the capture is always its last step.
 */
export function scene(
  name: string,
  run: (session: Session) => Promise<ShotOptions | void>,
  options: StartOptions | ((variant: Variant) => StartOptions) = {}
): void {
  for (const variant of VARIANTS) {
    test(`${name} · ${variant.lang}-${variant.theme}`, async () => {
      const session = await start(
        variant,
        typeof options === 'function' ? options(variant) : options
      )
      try {
        await shot(session, name, (await run(session)) ?? {})
      } finally {
        await closeApp(session.app)
      }
    })
  }
}
