import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import {
  FIRST_CHECK_DELAY_MS,
  isCheckDue,
  shouldOffer,
  updateSupport,
  type UpdateTarget
} from '@core/updates'
import { IpcChannel, type UpdateStatus } from '@shared/ipc'
import { allowWindowClose } from './files'
import { getSettings, updateSettings } from './settings'

/**
 * Updates: electron-updater (GitHub provider) where the app can replace itself (Windows
 * installer, AppImage); elsewhere a check of the latest GitHub release that points the user to
 * the download page. Nothing is downloaded without consent; installing happens on "Restart
 * now" after the renderer dealt with unsaved changes, or when the app quits.
 */

const RELEASES_API = 'https://api.github.com/repos/K-u-r-c/family-insight/releases/latest'
const HOURLY = 60 * 60 * 1000

function detectTarget(): UpdateTarget {
  const forced = process.env.FAMILY_INSIGHT_UPDATE_TARGET as UpdateTarget | undefined
  if (forced && ['nsis', 'portable', 'appimage', 'deb', 'mac', 'dev'].includes(forced))
    return forced
  if (!app.isPackaged) return 'dev'
  if (process.platform === 'win32') return process.env.PORTABLE_EXECUTABLE_DIR ? 'portable' : 'nsis'
  if (process.platform === 'darwin') return 'mac'
  return process.env.APPIMAGE ? 'appimage' : 'deb'
}

const target = detectTarget()
const support = updateSupport(target)
let status: UpdateStatus = { state: 'idle', support }

function publish(next: UpdateStatus): void {
  status = next
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IpcChannel.UpdatesStatus, status)
  }
}

/** Automated tests run with an isolated profile; the updater stays off unless they ask for it. */
function enabled(): boolean {
  if (process.env.FAMILY_INSIGHT_UPDATE_TEST === '1') return true
  if (process.env.FAMILY_INSIGHT_USER_DATA) return false
  return support !== 'none'
}

function rememberCheck(): void {
  updateSettings({ updates: { ...getSettings().updates, lastCheck: new Date().toISOString() } })
}

function notesOf(raw: unknown): string | undefined {
  if (typeof raw === 'string') return raw.slice(0, 50_000)
  if (Array.isArray(raw)) {
    return raw
      .map((n: { version?: string; note?: string | null }) => n.note ?? '')
      .join('\n\n')
      .slice(0, 50_000)
  }
  return undefined
}

/** The latest release from the GitHub API (builds that can't update themselves). */
async function latestRelease(): Promise<{ version: string; notes?: string; url: string }> {
  const response = await fetch(process.env.FAMILY_INSIGHT_UPDATE_API || RELEASES_API, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': `FamilyInsight/${app.getVersion()}`
    },
    signal: AbortSignal.timeout(15_000)
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = (await response.json()) as { tag_name?: unknown; body?: unknown; html_url?: unknown }
  if (typeof data.tag_name !== 'string') throw new Error('No release')
  const url =
    typeof data.html_url === 'string' && data.html_url.startsWith('https://github.com/')
      ? data.html_url
      : 'https://github.com/K-u-r-c/family-insight/releases/latest'
  return { version: data.tag_name.replace(/^v/, ''), notes: notesOf(data.body), url }
}

let checking: Promise<UpdateStatus> | null = null

/** Checks for an update. Automatic checks fail silently; manual ones report errors. */
export function checkForUpdates(manual: boolean): Promise<UpdateStatus> {
  if (!enabled()) {
    publish({ state: manual ? 'not-available' : 'idle', support, manual })
    return Promise.resolve(status)
  }
  if (status.state === 'downloading' || status.state === 'ready') return Promise.resolve(status)
  checking ??= (async (): Promise<UpdateStatus> => {
    publish({ state: 'checking', support, manual })
    const current = app.getVersion()
    const skipped = getSettings().updates.skippedVersion
    try {
      let version: string | undefined
      let notes: string | undefined
      let releaseUrl: string | undefined
      if (support === 'auto') {
        const result = await autoUpdater.checkForUpdates()
        version = result?.updateInfo.version
        notes = notesOf(result?.updateInfo.releaseNotes)
      } else {
        const release = await latestRelease()
        version = release.version
        notes = release.notes
        releaseUrl = release.url
      }
      rememberCheck()
      if (version && shouldOffer(current, version, skipped, manual)) {
        publish({ state: 'available', support, version, notes, releaseUrl, manual })
      } else {
        publish({ state: manual ? 'not-available' : 'idle', support, manual })
      }
    } catch (error) {
      publish(
        manual
          ? { state: 'error', support, manual, error: (error as Error).message.slice(0, 300) }
          : { state: 'idle', support }
      )
    }
    return status
  })().finally(() => {
    checking = null
  })
  return checking
}

export function registerUpdateHandlers(): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.logger = null
  if (process.env.FAMILY_INSIGHT_UPDATE_TEST === '1') {
    // Tests point the updater at a local server (`provider: generic`).
    autoUpdater.forceDevUpdateConfig = true
    if (process.env.FAMILY_INSIGHT_UPDATE_CONFIG) {
      autoUpdater.updateConfigPath = process.env.FAMILY_INSIGHT_UPDATE_CONFIG
    }
  }
  autoUpdater.on('download-progress', (p) =>
    publish({ ...status, state: 'downloading', progress: Math.round(p.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    publish({ ...status, state: 'ready', version: info.version, progress: 100 })
  )
  autoUpdater.on('error', (error) => {
    if (status.state === 'downloading') {
      publish({ ...status, state: 'error', error: error.message.slice(0, 300) })
    }
  })

  ipcMain.handle(IpcChannel.UpdatesCheck, () => checkForUpdates(true))
  ipcMain.handle(IpcChannel.UpdatesGetStatus, () => status)
  ipcMain.handle(IpcChannel.UpdatesDownload, async () => {
    if (status.state !== 'available' && status.state !== 'error') return
    if (status.support !== 'auto') {
      await shell.openExternal(
        status.releaseUrl ?? 'https://github.com/K-u-r-c/family-insight/releases/latest'
      )
      return
    }
    publish({ ...status, state: 'downloading', progress: 0, error: undefined })
    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      publish({ ...status, state: 'error', error: (error as Error).message.slice(0, 300) })
    }
  })
  ipcMain.handle(IpcChannel.UpdatesInstall, () => {
    if (status.state !== 'ready') return
    allowWindowClose()
    setImmediate(() => autoUpdater.quitAndInstall(false, true))
  })
}

/** Automatic checks: 10 s after start, then whenever a day has passed (if enabled). */
export function scheduleUpdateChecks(): void {
  if (!enabled()) return
  const tick = (): void => {
    const { checkAutomatically, lastCheck } = getSettings().updates
    if (checkAutomatically && isCheckDue(lastCheck, new Date())) void checkForUpdates(false)
  }
  setTimeout(tick, Number(process.env.FAMILY_INSIGHT_UPDATE_DELAY) || FIRST_CHECK_DELAY_MS)
  setInterval(tick, HOURLY).unref()
}
