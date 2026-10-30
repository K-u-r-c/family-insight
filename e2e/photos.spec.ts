import { copyFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, mockDialogs, tempDir } from './app'

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
  await expect(cardImg).toHaveAttribute('src', /^data:image\/webp;base64,/)
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save')
  )
  await expect(page.getByText('All changes saved')).toBeVisible()
  const saved = JSON.parse(readFileSync(file, 'utf8'))
  const photo: string = saved.persons.ewa.photo
  expect(photo.startsWith('data:image/webp;base64,')).toBe(true)
  // Resized to at most 512×512 and compressed: well under 100 kB.
  expect(photo.length).toBeLessThan(100_000)

  await page.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(cardImg).toHaveCount(0)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(cardImg).toHaveCount(1)
  await closeApp(app)
})
