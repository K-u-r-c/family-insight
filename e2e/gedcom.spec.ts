import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, mockDialogs, tempDir } from './app'

const FIXTURE = join(__dirname, '../src/core/io/gedcom/fixtures/gramps.ged')

test('GEDCOM: import a file, export it as 7.0, re-import with the same counts', async () => {
  const dir = tempDir()
  const ged = join(dir, 'gramps.ged')
  copyFileSync(FIXTURE, ged)
  const { app, page } = await launch()
  try {
    await mockDialogs(app, { open: ged })
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:import-gedcom')
    )
    const dialog = page.getByRole('dialog', { name: 'Import GEDCOM: gramps' })
    await expect(dialog.getByText('GEDCOM 5.5.1 from Gramps')).toBeVisible()
    await expect(
      dialog.getByText('4 people, 1 family, 2 events, 1 source, 0 media files')
    ).toBeVisible()
    await dialog.getByRole('button', { name: 'Import', exact: true }).click()
    await expect(page.getByText('4 people imported')).toBeVisible()
    await expect(
      page.getByRole('application').getByRole('button', { name: /^Anna Kowalska/ })
    ).toBeVisible()

    // Export as GEDCOM 7.0.
    const exported = join(dir, 'export.ged')
    await mockDialogs(app, { save: exported })
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:export-gedcom')
    )
    const exportDialog = page.getByRole('dialog', { name: 'Export GEDCOM' })
    await exportDialog.getByRole('radio', { name: 'GEDCOM 7.0' }).click()
    await exportDialog.getByRole('button', { name: 'Export…' }).click()
    await expect(page.getByText(`Exported to ${exported}`)).toBeVisible()
    expect(existsSync(exported)).toBe(true)

    // Re-import as a new tree: the same people and families.
    await mockDialogs(app, { open: exported, message: 1 })
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:import-gedcom')
    )
    const again = page.getByRole('dialog', { name: 'Import GEDCOM: export' })
    await expect(again.getByText('GEDCOM 7.0 from Family Insight')).toBeVisible()
    await expect(
      again.getByText('4 people, 1 family, 2 events, 1 source, 0 media files')
    ).toBeVisible()
    await again.getByRole('button', { name: 'Import', exact: true }).click()
    await expect(page.getByText('4 people imported')).toBeVisible()
  } finally {
    await closeApp(app)
  }
})

test('GEDCOM: a damaged file never crashes the app', async () => {
  const dir = tempDir()
  const ged = join(dir, 'broken.ged')
  writeFileSync(
    ged,
    Buffer.from([0x00, 0xff, 0x13, 0x37, ...Buffer.from('not\n1 really\n@@@ gedcom')])
  )
  const { app, page } = await launch({ args: [ged] })
  try {
    const dialog = page.getByRole('dialog', { name: 'Import GEDCOM: broken' })
    await expect(dialog.getByText('No people were found in this file.')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Import', exact: true })).toBeDisabled()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('button', { name: 'New family tree' })).toBeVisible()
  } finally {
    await closeApp(app)
  }
})
