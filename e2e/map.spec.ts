import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, mockDialogs, tempDir } from './app'
import { startTileServer } from './tileServer'

/** The Kowalski family with coordinates for most of its places (Wieliczka stays without). */
export function locatedFamily(dir: string): string {
  const doc = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), 'utf8'))
  doc.places = {
    krakow: { lat: 50.0619, lon: 19.9369, source: 'manual' },
    lodz: { lat: 51.7592, lon: 19.456, source: 'manual' },
    gdansk: { lat: 54.352, lon: 18.6466, source: 'manual' },
    poznan: { lat: 52.4064, lon: 16.9252, source: 'manual' },
    warszawa: { lat: 52.2297, lon: 21.0118, source: 'manual' }
  }
  const file = join(dir, 'kowalscy.finsight')
  writeFileSync(file, JSON.stringify(doc))
  return file
}

test('map: markers from a local tile server, filters, picking a person, PNG export', async () => {
  const tiles = await startTileServer()
  const dir = tempDir()
  const { app, page } = await launch({ args: [locatedFamily(dir)] })
  try {
    await page.getByRole('radio', { name: 'Map' }).click()
    const map = page.getByTestId('map')
    await expect(map).toBeVisible()
    // Online maps are off: no tile is requested, the markers are still there.
    await expect(
      page.getByText(/comes from OpenStreetMap on the internet and is off/)
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /^Łódź: \d+ people$/ })).toBeVisible()
    expect(tiles.requests).toEqual([])
    await expect(page.getByText('1 place without a location')).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Wieliczka' })).toBeVisible()

    // Allow online maps with the local tile server.
    await page.evaluate(
      (url) =>
        (
          window as unknown as {
            familyInsight: { updateSettings: (p: object) => Promise<unknown> }
          }
        ).familyInsight.updateSettings({ mapTileUrl: url }),
      tiles.url
    )
    await page.getByRole('button', { name: 'Load maps online' }).click()
    await page.getByRole('button', { name: 'Allow' }).click()
    await expect.poll(() => tiles.requests.length).toBeGreaterThan(0)
    await expect(map.locator('img.leaflet-tile-loaded').first()).toBeVisible()

    // Filtering: only deaths.
    const panel = page.getByRole('complementary', { name: 'Map filters and places' })
    const markers = map.locator('.leaflet-marker-icon')
    const all = await markers.count()
    for (const kind of ['Births', 'Marriages', 'Other events']) {
      await panel.getByRole('checkbox', { name: kind }).uncheck()
    }
    await expect.poll(() => markers.count()).toBeLessThan(all)

    // Clicking a marker lists the people there; picking one selects them.
    await panel.getByRole('checkbox', { name: 'Births' }).check()
    await page.getByRole('button', { name: /^Gdańsk: / }).click()
    await expect(panel.getByRole('heading', { name: 'Gdańsk' })).toBeVisible()
    await panel.getByRole('button', { name: 'Tomasz Lis' }).first().click()
    await expect(
      page.getByRole('heading', { name: 'Tomasz Lis', exact: true }).first()
    ).toBeVisible()

    // Export the map as PNG.
    const png = join(dir, 'map.png')
    await mockDialogs(app, { save: png })
    await panel.getByRole('button', { name: 'Export map as PNG…' }).click()
    await expect(page.getByText('Map exported')).toBeVisible()
    expect(readFileSync(png).subarray(1, 4).toString('ascii')).toBe('PNG')
  } finally {
    await closeApp(app)
    await tiles.close()
  }
})
