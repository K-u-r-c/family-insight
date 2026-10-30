import { copyFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { Resvg } from '@resvg/resvg-js'
import { unzipSync } from 'fflate'
import { readFileSync } from 'node:fs'
import { closeApp, launch, mockDialogs, readTree, tempDir } from './app'

/** A small PDF with one page of text. */
export function samplePdf(path: string): string {
  const stream = 'BT /F1 24 Tf 40 100 Td (Akt urodzenia) Tj ET'
  const pdf = [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj',
    `4 0 obj<</Length ${stream.length}>>stream`,
    stream,
    'endstream endobj',
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj',
    'trailer<</Root 1 0 R>>',
    '%%EOF'
  ].join('\n')
  writeFileSync(path, pdf)
  return path
}

/** A drawn picture saved as PNG. */
export function samplePicture(path: string, colour: string, width = 800, height = 600): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="${colour}"/>
    <circle cx="${width / 2}" cy="${height / 2}" r="${height / 4}" fill="#fff8"/></svg>`
  writeFileSync(path, new Resvg(svg).render().asPng())
  return path
}

test('gallery: add two images and a PDF, portrait, link to a second person, save, reopen', async () => {
  const dir = tempDir()
  const file = join(dir, 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const files = [
    samplePicture(join(dir, 'wedding.png'), '#8a6d4b'),
    samplePicture(join(dir, 'house.png'), '#4b6d8a', 600, 900),
    samplePdf(join(dir, 'birth-certificate.pdf'))
  ]
  const { app, page } = await launch({ args: [file] })
  await mockDialogs(app, { open: files })

  await page
    .getByRole('application')
    .getByRole('button', { name: /^Ewa Lis/ })
    .click()
  const gallery = page.getByRole('region', { name: 'Photos and documents' })
  await expect(gallery.getByText('Drop photos or scanned documents here')).toBeVisible()
  await gallery.getByRole('button', { name: 'Add…' }).click()
  await expect(gallery.getByRole('listitem')).toHaveCount(3)
  await expect(gallery.locator('img')).toHaveCount(2) // the PDF shows an icon

  // Viewer: next/previous, the PDF in the built-in viewer.
  await gallery.getByRole('button', { name: 'Open wedding.png' }).click()
  const viewer = page.getByRole('dialog', { name: 'wedding.png' })
  await expect(viewer.getByText('1 of 3')).toBeVisible()
  await expect(viewer.getByRole('img', { name: 'wedding.png' })).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(
    page.getByRole('dialog', { name: 'birth-certificate.pdf' }).locator('iframe')
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // Title, and show the wedding photo on Ewa's husband too.
  await gallery.getByRole('button', { name: 'Actions for wedding.png' }).click()
  await page.getByRole('menuitem', { name: 'Edit details…' }).click()
  const details = page.getByRole('dialog', { name: 'Photo or document' })
  await details.getByLabel('Title').fill('Wedding')
  await details.getByLabel('Title').press('Tab')
  await details.getByRole('button', { name: 'Add person…' }).click()
  await page
    .getByRole('dialog', { name: 'Show on which person?' })
    .getByRole('option', { name: /^Piotr Kowalski/ })
    .click()
  await expect(details.getByText('Piotr Kowalski')).toBeVisible()
  await details.getByRole('button', { name: 'Done' }).click()

  // Use the second image as portrait (crop dialog), move the PDF first.
  await gallery.getByRole('button', { name: 'Actions for house.png' }).click()
  await page.getByRole('menuitem', { name: 'Use as portrait…' }).click()
  await page.getByRole('button', { name: 'Use photo' }).click()
  await expect(page.locator('[data-person-id="ewa"] img')).toHaveAttribute('src', /^blob:/)
  await gallery.getByRole('button', { name: 'Actions for birth-certificate.pdf' }).click()
  await page.getByRole('menuitem', { name: 'Move earlier' }).click()

  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save')
  )
  await expect(page.getByText('All changes saved')).toBeVisible()
  const saved = readTree(file)
  const ewa = saved.persons.ewa
  const titles = ewa.mediaIds.map((id: string) => saved.media[id].title ?? saved.media[id].fileName)
  expect(titles).toEqual(['Wedding', 'birth-certificate.pdf', 'house.png'])
  const wedding = ewa.mediaIds[0]
  const piotr = Object.values(
    saved.persons as Record<string, { givenNames: string; mediaIds?: string[] }>
  ).find((p) => p.givenNames === 'Piotr')!
  expect(piotr.mediaIds).toEqual([wedding])
  expect(saved.media[ewa.portraitMediaId].fileName).toBe('portrait.webp')
  const entries = Object.keys(unzipSync(readFileSync(file)))
  expect(entries.filter((n) => n.startsWith('media/'))).toHaveLength(4)
  expect(entries.filter((n) => n.endsWith('.pdf'))).toHaveLength(1)
  await closeApp(app)

  // Reopen: everything is still there.
  const again = await launch({ args: [file] })
  await again.page
    .getByRole('application')
    .getByRole('button', { name: /^Piotr Kowalski/ })
    .click()
  const piotrGallery = again.page.getByRole('region', { name: 'Photos and documents' })
  await expect(piotrGallery.getByRole('button', { name: 'Open Wedding' })).toBeVisible()
  await expect(piotrGallery.locator('img')).toHaveAttribute('src', /^blob:/)
  await closeApp(again.app)
})
