import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, mockDialogs, tempDir } from './app'
import ru from '../src/shared/locales/ru.json'

test('export the tree as PNG, SVG and PDF', async () => {
  const dir = tempDir()
  const file = join(dir, 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const { app, page } = await launch({ args: [file] })

  const exportAs = async (format: 'PNG' | 'SVG' | 'PDF', target: string): Promise<void> => {
    await mockDialogs(app, { save: target })
    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Export Image…' }).click()
    await page.getByRole('radio', { name: format, exact: true }).click()
    await page.getByRole('button', { name: 'Export…' }).click()
    await expect(page.getByText('Image exported')).toBeVisible()
    await expect.poll(() => existsSync(target), { timeout: 15000 }).toBe(true)
  }

  const png = join(dir, 'tree.png')
  await exportAs('PNG', png)
  const pngBytes = readFileSync(png)
  expect(pngBytes.subarray(1, 4).toString('ascii')).toBe('PNG')
  // 2× by default: wider than the 1× layout.
  expect(pngBytes.readUInt32BE(16)).toBeGreaterThan(1500)

  const svg = join(dir, 'tree.svg')
  await exportAs('SVG', svg)
  const svgText = readFileSync(svg, 'utf8')
  expect(svgText.startsWith('<svg')).toBe(true)
  expect(svgText).toContain('Kowalscy')
  expect(svgText).toContain('Katarzyna Kowalska')

  const pdf = join(dir, 'tree.pdf')
  await exportAs('PDF', pdf)
  expect(readFileSync(pdf).subarray(0, 5).toString('ascii')).toBe('%PDF-')
  await closeApp(app)
})

test('exports in Russian embed the Cyrillic font subset', async () => {
  const dir = tempDir()
  const file = join(dir, 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const { app, page } = await launch({ args: [file], language: 'ru' })
  const exportAs = async (format: 'PNG' | 'SVG' | 'PDF', target: string): Promise<void> => {
    await mockDialogs(app, { save: target })
    await page.getByRole('button', { name: ru.menu.file }).click()
    await page.getByRole('menuitem', { name: ru.menu.exportImage }).click()
    await page.getByRole('radio', { name: format, exact: true }).click()
    await page.getByRole('button', { name: ru.export.button }).click()
    await expect(page.getByText(ru.export.done)).toBeVisible()
    await expect.poll(() => existsSync(target), { timeout: 15000 }).toBe(true)
  }
  const svg = join(dir, 'tree.svg')
  await exportAs('SVG', svg)
  const svgText = readFileSync(svg, 'utf8')
  // The caption has today's date with a Russian month name, so Cyrillic glyphs must be embedded.
  expect(svgText).toMatch(/\p{Script=Cyrillic}/u)
  expect(svgText).toMatch(/@font-face[^}]*unicode-range:[^;}]*U\+400-45F/)
  const png = join(dir, 'tree.png')
  await exportAs('PNG', png)
  expect(readFileSync(png).subarray(1, 4).toString('ascii')).toBe('PNG')
  const pdf = join(dir, 'tree.pdf')
  await exportAs('PDF', pdf)
  expect(readFileSync(pdf).subarray(0, 5).toString('ascii')).toBe('%PDF-')
  await closeApp(app)
})

test('exports in the Tapestry style, also from a Modern window, with its fonts', async () => {
  const dir = tempDir()
  const file = join(dir, 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const { app, page } = await launch({ args: [file], language: 'ru' })
  const exportAs = async (format: 'PNG' | 'SVG' | 'PDF', target: string): Promise<void> => {
    await mockDialogs(app, { save: target })
    await page.getByRole('button', { name: ru.menu.file }).click()
    await page.getByRole('menuitem', { name: ru.menu.exportImage }).click()
    await page.getByRole('radio', { name: format, exact: true }).click()
    // The window is Modern; pick Tapestry for the picture only.
    await page.getByRole('radio', { name: ru.style.tapestry }).click()
    await page.getByRole('button', { name: ru.export.button }).click()
    await expect(page.getByText(ru.export.done)).toBeVisible()
    await expect.poll(() => existsSync(target), { timeout: 15000 }).toBe(true)
  }
  const svg = join(dir, 'tree.svg')
  await exportAs('SVG', svg)
  const svgText = readFileSync(svg, 'utf8')
  expect(svgText).toContain('#efe4cc')
  expect(svgText).toContain('pattern id="weave"')
  // Medallion text in Cormorant and EB Garamond, embedded with Polish and Cyrillic glyphs; no
  // modern fonts.
  expect(svgText).toMatch(/@font-face\{font-family:'Cormorant Variable'[^}]*U\+400-45F/)
  expect(svgText).toMatch(/@font-face\{font-family:'EB Garamond Variable'/)
  expect(svgText).toMatch(/@font-face\{font-family:'Cormorant Variable'[^}]*U\+100-2BA/)
  expect(svgText).not.toContain("font-family:'Inter Variable'")
  expect(svgText).toContain('Katarzyna Kowalska')
  const png = join(dir, 'tree.png')
  await exportAs('PNG', png)
  expect(readFileSync(png).subarray(1, 4).toString('ascii')).toBe('PNG')
  const pdf = join(dir, 'tree.pdf')
  await exportAs('PDF', pdf)
  expect(readFileSync(pdf).subarray(0, 5).toString('ascii')).toBe('%PDF-')
  // The window itself stays Modern.
  expect(await page.evaluate(() => document.documentElement.dataset.style)).toBeUndefined()
  await closeApp(app)
})
