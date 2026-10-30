import { createHash } from 'node:crypto'
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, tempDir } from './app'

/** A local update server: serves the files of a folder, records requests. */
async function serve(
  files: Record<string, Buffer | string>
): Promise<{ url: string; requests: string[]; close: () => Promise<void> }> {
  const requests: string[] = []
  const server: Server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url!, 'http://x').pathname.slice(1))
    requests.push(path)
    const body = files[path]
    if (body === undefined) return void res.writeHead(404).end()
    res.writeHead(200, { 'Content-Length': Buffer.byteLength(body) }).end(body)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return {
    url: `http://127.0.0.1:${(server.address() as { port: number }).port}/`,
    requests,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  }
}

test('update (AppImage): notice, download, restart runs the new version', async () => {
  const dir = tempDir()
  const marker = join(dir, 'started-version.txt')
  // The "installed" AppImage the updater replaces, and the "new" one: a script that reports.
  const installed = join(dir, 'family-insight.AppImage')
  writeFileSync(installed, '#!/bin/sh\necho old > "$FAMILY_INSIGHT_TEST_MARKER"\n')
  chmodSync(installed, 0o755)
  const newer = Buffer.from('#!/bin/sh\necho 9.9.9 > "$FAMILY_INSIGHT_TEST_MARKER"\n')
  const sha512 = createHash('sha512').update(newer).digest('base64')
  const server = await serve({
    'latest-linux.yml': [
      'version: 9.9.9',
      'files:',
      '  - url: family-insight-9.9.9.AppImage',
      `    sha512: ${sha512}`,
      `    size: ${newer.length}`,
      'path: family-insight-9.9.9.AppImage',
      `sha512: ${sha512}`,
      "releaseDate: '2026-10-30T12:00:00.000Z'",
      'releaseNotes: |',
      '  ## New',
      '  - A test release'
    ].join('\n'),
    'family-insight-9.9.9.AppImage': newer
  })
  const config = join(dir, 'dev-app-update.yml')
  writeFileSync(
    config,
    `provider: generic\nurl: ${server.url}\nupdaterCacheDirName: family-insight-test-updater\n`
  )
  const { app, page } = await launch({
    env: {
      FAMILY_INSIGHT_UPDATE_TEST: '1',
      FAMILY_INSIGHT_UPDATE_TARGET: 'appimage',
      FAMILY_INSIGHT_UPDATE_CONFIG: config,
      FAMILY_INSIGHT_UPDATE_DELAY: '300',
      FAMILY_INSIGHT_TEST_MARKER: marker,
      APPIMAGE: installed,
      XDG_CACHE_HOME: join(dir, 'cache')
    }
  })
  try {
    const notice = page.getByRole('status', { name: 'Updates' })
    await expect(notice.getByText(/Family Insight 9\.9\.9 is available/)).toBeVisible({
      timeout: 20_000
    })
    expect(server.requests).toContain('latest-linux.yml')
    await notice.getByRole('button', { name: 'Release notes' }).click()
    await expect(page.getByRole('heading', { name: "What's new in 9.9.9" })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
    await notice.getByRole('button', { name: 'Download' }).click()
    await expect(notice.getByText('Family Insight 9.9.9 is ready to install')).toBeVisible({
      timeout: 30_000
    })
    expect(server.requests).toContain('family-insight-9.9.9.AppImage')
    // "Restart now": the downloaded file replaces the installed one and is started.
    await notice.getByRole('button', { name: 'Restart now' }).click()
    await expect
      .poll(() => existsSync(marker) && readFileSync(marker, 'utf8').trim(), { timeout: 20_000 })
      .toBe('9.9.9')
    expect(readFileSync(installed)).toEqual(newer)
  } finally {
    await closeApp(app).catch(() => undefined)
    await server.close()
  }
})

test('update (deb / portable / macOS): the notice opens the release page', async () => {
  const server = await serve({
    'releases/latest': JSON.stringify({
      tag_name: 'v9.9.9',
      html_url: 'https://github.com/K-u-r-c/family-insight/releases/tag/v9.9.9',
      body: '## New\n- A test release'
    })
  })
  const { app, page } = await launch({
    env: {
      FAMILY_INSIGHT_UPDATE_TEST: '1',
      FAMILY_INSIGHT_UPDATE_TARGET: 'deb',
      FAMILY_INSIGHT_UPDATE_API: `${server.url}releases/latest`,
      FAMILY_INSIGHT_UPDATE_DELAY: '600000'
    }
  })
  try {
    await app.evaluate(({ shell }) => {
      const opened: string[] = []
      ;(globalThis as unknown as { opened: string[] }).opened = opened
      shell.openExternal = (async (url: string) => void opened.push(url)) as never
    })
    // A manual check from the Help menu.
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'help:check-updates')
    )
    const notice = page.getByRole('status', { name: 'Updates' })
    await expect(notice.getByText('Family Insight 9.9.9 is available')).toBeVisible()
    await notice.getByRole('button', { name: 'Download page' }).click()
    await expect
      .poll(() => app.evaluate(() => (globalThis as unknown as { opened: string[] }).opened))
      .toEqual(['https://github.com/K-u-r-c/family-insight/releases/tag/v9.9.9'])
    // Skipping the version keeps automatic checks quiet; it is remembered in the settings.
    await notice.getByRole('button', { name: 'Skip this version' }).click()
    await expect(notice).toBeHidden()
  } finally {
    await closeApp(app)
    await server.close()
  }
})
