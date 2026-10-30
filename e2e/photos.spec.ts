import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { unzipSync } from 'fflate'
import { closeApp, launch, mockDialogs, readTree, tempDir } from './app'

test('add, crop, save and remove a portrait', async () => {
  const file = join(tempDir(), 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const { app, page } = await launch({ args: [file] })
  await mockDialogs(app, { open: join(__dirname, 'fixtures', 'portrait.png') })

  await page
    .getByRole('application')
    .getByRole('button', { name: /^Ewa Lis/ })
    .dblclick()
  await page.getByRole('button', { name: 'Add photo…' }).click()
  await expect(page.getByRole('heading', { name: 'Crop the photo' })).toBeVisible()
  await page.getByRole('slider', { name: 'Zoom' }).fill('1.5')
  await page.getByRole('button', { name: 'Use photo' }).click()

  const cardImg = page.locator('[data-person-id="ewa"] img')
  await expect(cardImg).toHaveAttribute('src', /^blob:/)
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save')
  )
  await expect(page.getByText('All changes saved')).toBeVisible()
  // The file is now a container: the portrait is a media file next to tree.json.
  const entries = unzipSync(readFileSync(file))
  const saved = JSON.parse(new TextDecoder().decode(entries['tree.json']))
  expect(saved.schemaVersion).toBe(3)
  const portrait = saved.media[saved.persons.ewa.portraitMediaId]
  expect(portrait).toMatchObject({ mime: 'image/webp', fileName: 'portrait.webp' })
  const bytes = entries[`media/${portrait.hash}.webp`]!
  // Resized to at most 512×512 and compressed: well under 100 kB.
  expect(bytes.length).toBeGreaterThan(100)
  expect(bytes.length).toBeLessThan(100_000)
  expect(entries[`thumbs/${portrait.hash}.webp`]!.length).toBeLessThan(bytes.length + 1)

  await page.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(cardImg).toHaveCount(0)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(cardImg).toHaveCount(1)
  await closeApp(app)
})

test('portraits of files from version 1.0 move into the media library', async () => {
  const file = join(tempDir(), 'legacy.finsight')
  const doc = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), 'utf8'))
  const png = readFileSync(join(__dirname, 'fixtures', 'portrait.png'))
  doc.persons.ewa.photo = `data:image/png;base64,${png.toString('base64')}`
  writeFileSync(file, JSON.stringify(doc))
  const { app, page } = await launch({ args: [file] })

  // The thumbnail is generated on open, so the card shows the portrait straight away.
  await expect(page.locator('[data-person-id="ewa"] img')).toHaveAttribute('src', /^blob:/)
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save')
  )
  await expect.poll(() => readFileSync(file).subarray(0, 2).toString('latin1')).toBe('PK')
  const entries = unzipSync(readFileSync(file))
  const saved = readTree(file)
  expect(saved.persons.ewa.photo).toBeUndefined()
  const portrait = saved.media[saved.persons.ewa.portraitMediaId]
  expect(portrait).toMatchObject({ mime: 'image/png', size: png.length })
  expect(Buffer.from(entries[`media/${portrait.hash}.png`]!).equals(png)).toBe(true)
  expect(entries[`thumbs/${portrait.hash}.webp`]).toBeDefined()

  // Reopening the container shows the portrait again, and exported images embed it.
  await closeApp(app)
  const again = await launch({ args: [file] })
  await expect(again.page.locator('[data-person-id="ewa"] img')).toHaveAttribute('src', /^blob:/)
  const svg = join(tempDir(), 'tree.svg')
  await mockDialogs(again.app, { save: svg })
  await again.page.getByRole('button', { name: 'File' }).click()
  await again.page.getByRole('menuitem', { name: 'Export Image…' }).click()
  await again.page.getByRole('radio', { name: 'SVG', exact: true }).click()
  await again.page.getByRole('button', { name: 'Export…' }).click()
  await expect(again.page.getByText('Image exported')).toBeVisible()
  await expect.poll(() => existsSync(svg)).toBe(true)
  expect(readFileSync(svg, 'utf8').match(/href="data:image\/webp;base64,/g)).toHaveLength(1)
  await closeApp(again.app)
})

test('a crash keeps photos of unsaved trees', async () => {
  const first = await launch()
  await mockDialogs(first.app, { open: join(__dirname, 'fixtures', 'portrait.png') })
  await first.page.getByRole('button', { name: 'New family tree' }).click()
  await first.page.getByLabel('Tree name').fill('Photos')
  await first.page.getByRole('button', { name: 'Create' }).click()
  await first.page.getByLabel('Given names').fill('Zofia')
  await first.page.getByLabel('Given names').press('Tab')
  await first.page.getByRole('button', { name: 'Add photo…' }).click()
  await first.page.getByRole('button', { name: 'Use photo' }).click()
  await expect(first.page.locator('[data-person-id] img')).toHaveCount(1)
  await first.page.waitForTimeout(3000)
  first.app.process().kill('SIGKILL')

  const second = await launch({ userData: first.userData })
  await second.page.getByRole('button', { name: 'Restore' }).click()
  await expect(second.page.locator('[data-person-id] img')).toHaveAttribute('src', /^blob:/)
  await closeApp(second.app)
})
