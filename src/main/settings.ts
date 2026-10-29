import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { app, BrowserWindow, nativeTheme } from 'electron'
import { defaultSettings, sanitizeSettings, type Settings } from '@core/settings'
import { isLanguage, resolveLanguage } from '@shared/i18n'
import { IpcChannel } from '@shared/ipc'
import { writeFileAtomic } from './fsUtils'

type Listener = (next: Settings, previous: Settings) => void

let current: Settings | null = null
let writeQueue: Promise<void> = Promise.resolve()
const listeners = new Set<Listener>()

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

/** Loads settings once at startup. A corrupt file is kept as `settings.corrupt-<time>.json`. */
export async function loadSettings(): Promise<Settings> {
  const defaults = defaultSettings(resolveLanguage(app.getLocale()))
  let raw: unknown = undefined
  try {
    raw = JSON.parse(await fs.readFile(settingsPath(), 'utf8'))
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') {
      const backup = join(app.getPath('userData'), `settings.corrupt-${Date.now()}.json`)
      await fs.rename(settingsPath(), backup).catch(() => undefined)
    }
  }
  current = sanitizeSettings(raw, defaults, isLanguage)
  nativeTheme.themeSource = current.theme
  return current
}

export function getSettings(): Settings {
  if (!current) throw new Error('Settings not loaded')
  return current
}

function persist(settings: Settings): void {
  const data = JSON.stringify(settings, null, 2)
  writeQueue = writeQueue
    .then(() => writeFileAtomic(settingsPath(), data))
    .catch((error) => console.error('Failed to save settings', error))
}

/** Applies an untrusted patch, persists it and notifies main-process listeners and all windows. */
export function updateSettings(patch: unknown): Settings {
  const previous = getSettings()
  const merged = typeof patch === 'object' && patch !== null ? { ...previous, ...patch } : previous
  const next = sanitizeSettings(merged, previous, isLanguage)
  if (JSON.stringify(next) === JSON.stringify(previous)) return previous
  current = next
  nativeTheme.themeSource = next.theme
  persist(next)
  for (const listener of listeners) listener(next, previous)
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IpcChannel.SettingsChanged, next)
  }
  return next
}

export function onSettingsChanged(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Waits for pending writes (call before quitting). */
export function flushSettings(): Promise<void> {
  return writeQueue
}
