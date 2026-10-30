/**
 * Application settings shared by main and renderer. Pure helpers so the schema,
 * defaults and sanitising are unit-testable; persistence lives in `src/main/settings.ts`.
 */

export type ThemePreference = 'system' | 'light' | 'dark'
export type CsvDelimiter = ',' | ';'
export type CardDensity = 'comfortable' | 'compact'

export interface RecentFile {
  path: string
  name: string
  openedAt: string
}

export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
  maximized: boolean
}

export interface PanelSettings {
  sidebarOpen: boolean
  sidebarWidth: number
  detailsWidth: number
}

export interface Settings {
  version: 1
  language: string
  theme: ThemePreference
  recentFiles: RecentFile[]
  windowBounds?: WindowBounds
  csvDelimiter: CsvDelimiter
  density: CardDensity
  showMinimap: boolean
  autosave: boolean
  backups: boolean
  /** Send place names to OpenStreetMap Nominatim to find coordinates (opt-in). */
  onlinePlaceLookup: boolean
  /** Load map tiles from the internet for the map view (opt-in). */
  onlineMaps: boolean
  /** Tile server URL template, e.g. `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. */
  mapTileUrl: string
  panels: PanelSettings
}

export const MAX_RECENT_FILES = 10

/** OpenStreetMap's standard tiles (usage policy: identifying User-Agent, caching, no bulk). */
export const DEFAULT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

/** Whether a tile URL template is acceptable: http(s) with {z}, {x} and {y}. */
export function isTileUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 300) return false
  if (!/^https?:\/\/\S+$/.test(value)) return false
  return ['{z}', '{x}', '{y}'].every((p) => value.includes(p))
}

export function defaultSettings(language: string): Settings {
  return {
    version: 1,
    language,
    theme: 'system',
    recentFiles: [],
    csvDelimiter: language === 'pl' ? ';' : ',',
    density: 'comfortable',
    showMinimap: true,
    autosave: true,
    backups: true,
    onlinePlaceLookup: false,
    onlineMaps: false,
    mapTileUrl: DEFAULT_TILE_URL,
    panels: { sidebarOpen: true, sidebarWidth: 280, detailsWidth: 380 }
  }
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(v, min), max) : undefined

/**
 * Builds valid settings from untrusted input (a settings file or an IPC patch merged onto
 * the current settings). Unknown keys are dropped and invalid values fall back to defaults.
 */
export function sanitizeSettings(
  raw: unknown,
  fallback: Settings,
  isLanguage: (v: unknown) => boolean
): Settings {
  const src = isObj(raw) ? raw : {}
  const out: Settings = { ...fallback, panels: { ...fallback.panels } }
  if (isLanguage(src.language)) out.language = src.language as string
  if (typeof src.onlinePlaceLookup === 'boolean') out.onlinePlaceLookup = src.onlinePlaceLookup
  if (typeof src.onlineMaps === 'boolean') out.onlineMaps = src.onlineMaps
  if (isTileUrl(src.mapTileUrl)) out.mapTileUrl = src.mapTileUrl
  if (src.theme === 'system' || src.theme === 'light' || src.theme === 'dark') out.theme = src.theme
  if (src.csvDelimiter === ',' || src.csvDelimiter === ';') out.csvDelimiter = src.csvDelimiter
  if (src.density === 'comfortable' || src.density === 'compact') out.density = src.density
  if (typeof src.showMinimap === 'boolean') out.showMinimap = src.showMinimap
  if (typeof src.autosave === 'boolean') out.autosave = src.autosave
  if (typeof src.backups === 'boolean') out.backups = src.backups
  if (Array.isArray(src.recentFiles)) {
    out.recentFiles = src.recentFiles
      .filter(
        (f): f is RecentFile =>
          isObj(f) &&
          typeof f.path === 'string' &&
          f.path.length > 0 &&
          typeof f.name === 'string' &&
          typeof f.openedAt === 'string'
      )
      .map((f) => ({ path: f.path, name: f.name, openedAt: f.openedAt }))
      .slice(0, MAX_RECENT_FILES)
  }
  if (isObj(src.windowBounds)) {
    const b = src.windowBounds
    const width = num(b.width, 400, 20000)
    const height = num(b.height, 300, 20000)
    if (width && height) {
      out.windowBounds = {
        width,
        height,
        maximized: b.maximized === true,
        ...(num(b.x, -20000, 20000) !== undefined ? { x: num(b.x, -20000, 20000) } : {}),
        ...(num(b.y, -20000, 20000) !== undefined ? { y: num(b.y, -20000, 20000) } : {})
      }
    }
  } else if (src.windowBounds === null) {
    delete out.windowBounds
  }
  if (isObj(src.panels)) {
    const p = src.panels
    if (typeof p.sidebarOpen === 'boolean') out.panels.sidebarOpen = p.sidebarOpen
    out.panels.sidebarWidth = num(p.sidebarWidth, 200, 600) ?? out.panels.sidebarWidth
    out.panels.detailsWidth = num(p.detailsWidth, 300, 720) ?? out.panels.detailsWidth
  }
  return out
}

/** Moves (or inserts) a file to the top of the recent list, de-duplicated by path. */
export function pushRecentFile(
  list: RecentFile[],
  file: RecentFile,
  max = MAX_RECENT_FILES
): RecentFile[] {
  return [file, ...list.filter((f) => f.path !== file.path)].slice(0, max)
}

export function removeRecentFile(list: RecentFile[], path: string): RecentFile[] {
  return list.filter((f) => f.path !== path)
}
