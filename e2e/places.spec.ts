import { copyFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, readTree, tempDir } from './app'

test('places: consent, lookup with a local geocoder, manual coordinates, saved with the tree', async () => {
  const queries: string[] = []
  const agents: string[] = []
  const server = createServer((req, res) => {
    const url = new URL(req.url!, 'http://localhost')
    queries.push(url.searchParams.get('q') ?? '')
    agents.push(req.headers['user-agent'] ?? '')
    res
      .writeHead(200, { 'Content-Type': 'application/json' })
      .end(
        JSON.stringify([{ lat: '52.2297700', lon: '21.0117800', display_name: 'Warszawa, Poland' }])
      )
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  process.env.FAMILY_INSIGHT_GEOCODER_URL = `http://127.0.0.1:${(server.address() as { port: number }).port}/search`
  const file = join(tempDir(), 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const { app, page } = await launch({ args: [file] })
  try {
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'edit:places')
    )
    const dialog = page.getByRole('dialog', { name: 'Places' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: /^Warszawa/ }).click()

    // Nothing is sent before the user agrees.
    await dialog.getByRole('button', { name: 'Look up online' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()
    expect(queries).toEqual([])
    await dialog.getByRole('button', { name: 'Look up online' }).click()
    await page.getByRole('button', { name: 'Allow' }).click()
    await dialog.getByRole('button', { name: /Warszawa, Poland/ }).click()
    expect(queries).toEqual(['Warszawa'])
    expect(agents[0]).toMatch(/^FamilyInsight\/\d/)
    await expect(dialog.getByText(/52\.2298° N, 21\.0118° E/)).toBeVisible()

    // A second place by hand.
    await dialog.getByRole('button', { name: /^Kraków/ }).click()
    await dialog.getByLabel('Latitude').fill('50.0619')
    await dialog.getByLabel('Longitude').fill('19.9369')
    await dialog.getByRole('button', { name: 'Save location' }).click()
    await expect(dialog.getByText(/entered by you/)).toBeVisible()
    await dialog.getByRole('button', { name: 'Done' }).click()

    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save')
    )
    await expect(page.getByText('All changes saved')).toBeVisible()
    expect(readTree(file).places).toEqual({
      warszawa: {
        lat: 52.22977,
        lon: 21.01178,
        source: 'geocoded',
        displayName: 'Warszawa, Poland'
      },
      krakow: { lat: 50.0619, lon: 19.9369, source: 'manual' }
    })
  } finally {
    await closeApp(app)
    delete process.env.FAMILY_INSIGHT_GEOCODER_URL
    server.close()
  }
})
