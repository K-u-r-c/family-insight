import { copyFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { closeApp, launch, tempDir } from './app'

// AxeBuilder needs to open extra pages, which Electron doesn't support: inject axe directly.
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

interface AxeViolation {
  id: string
  impact: string | null
  nodes: { target: string[] }[]
}

async function seriousViolations(page: Page): Promise<string[]> {
  // Let entrance animations finish so colours are final.
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)))
  )
  await page.evaluate(AXE)
  const violations = await page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: { run: (ctx: unknown, opts: unknown) => Promise<{ violations: AxeViolation[] }> }
      }
    ).axe
    const result = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }
    })
    return result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ target: n.target }))
    }))
  })
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map(
      (v) =>
        `${v.id}: ${v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 3)
          .join(' | ')}`
    )
}

for (const theme of ['light', 'dark'] as const) {
  test(`no serious accessibility violations (${theme})`, async () => {
    const file = join(tempDir(), 'kowalscy.finsight')
    copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
    const { app, page } = await launch({ theme })
    expect(await seriousViolations(page)).toEqual([])
    await closeApp(app)

    const second = await launch({ args: [file], theme })
    await second.page
      .getByRole('application')
      .getByRole('button', { name: /^Jan Kowalski/ })
      .click()
    expect(await seriousViolations(second.page)).toEqual([])
    await second.page.getByRole('button', { name: 'Edit', exact: true }).click()
    expect(await seriousViolations(second.page)).toEqual([])
    await second.page.getByRole('button', { name: 'Statistics' }).click()
    expect(await seriousViolations(second.page)).toEqual([])
    await closeApp(second.app)
  })
}

test('keyboard: shortcut help, skip link and screen reader announcements', async () => {
  const file = join(tempDir(), 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const { app, page } = await launch({ args: [file], language: 'pl' })
  await page.locator('body').press('?')
  await expect(page.getByRole('heading', { name: 'Skróty klawiszowe' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Skróty klawiszowe' })).toBeHidden()

  // The first Tab stop is the skip link; it moves focus to the tree.
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Przejdź do drzewa' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('application')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowUp')
  await expect(page.getByRole('application').getByRole('status')).toContainText(
    /Dzieci: Jan Kowalski, Zofia Kowalska/
  )
  await closeApp(app)
})
