import { promises as fs } from 'node:fs'
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { emptyMediaStore, hashBytes, type MediaStore } from '@core/file/container'
import { MAX_MEDIA_BYTES, sniffMime } from '@core/model/media'
import { MEDIA_TYPES } from '@core/model/types'
import { IpcChannel, type MediaImportResult, type MediaPutResult } from '@shared/ipc'
import { writeFileAtomic } from './fsUtils'
import { t } from './i18n'

/**
 * Media libraries of open documents. The renderer refers to a library by id; main keeps the
 * bytes (so saving sends only JSON over IPC) and packs them into the container on save.
 * A library only grows during a session: undo may bring a removed item back, and garbage
 * collection happens when the container is written.
 */
const libraries = new Map<string, MediaStore>()
const MAX_THUMB_BYTES = 512 * 1024
const SAFE_ID = /^[a-zA-Z0-9-]{1,64}$/
const HASH = /^[0-9a-f]{64}$/

export function createLibrary(store: MediaStore = emptyMediaStore()): string {
  const id = randomUUID()
  libraries.set(id, store)
  return id
}

export function getLibrary(id: unknown): MediaStore | undefined {
  return typeof id === 'string' && SAFE_ID.test(id) ? libraries.get(id) : undefined
}

function put(store: MediaStore, data: Uint8Array, fileName: string): MediaPutResult {
  if (data.length > MAX_MEDIA_BYTES) return { ok: false, fileName, error: 'too-large' }
  const mime = sniffMime(data)
  if (!mime) return { ok: false, fileName, error: 'unsupported' }
  const hash = hashBytes(data)
  if (!store.media.has(hash)) store.media.set(hash, { bytes: data })
  return { ok: true, hash, mime, size: data.length, fileName }
}

/** A file name safe to create: no folders, no reserved characters. */
function safeName(fileName: unknown, fallback: string): string {
  const name = typeof fileName === 'string' && fileName.trim() ? basename(fileName) : fallback
  // eslint-disable-next-line no-control-regex -- control characters are invalid in file names
  return name.replace(/[\\/:*?"<>|\x00-\x1f]+/g, '-').slice(0, 150)
}

/**
 * Finds a file a GEDCOM references: the path as written (relative to the GEDCOM file or
 * absolute), else the same name next to the file or in its `media` folder – trees moved from
 * another computer keep absolute paths that no longer exist.
 */
async function locate(dir: string, raw: string): Promise<string | null> {
  const cleaned = raw
    .trim()
    .replace(/^file:\/\//i, '')
    .replace(/\\/g, '/')
  const name = basename(cleaned)
  const candidates = [
    isAbsolute(cleaned) ? cleaned : resolve(dir, cleaned),
    join(dir, name),
    join(dir, 'media', name)
  ]
  for (const candidate of candidates) {
    const stat = await fs.stat(candidate).catch(() => null)
    if (stat?.isFile()) return candidate
  }
  return null
}

const FILTER_EXTENSIONS = Object.values(MEDIA_TYPES).flatMap((ext) =>
  ext === 'jpg' ? ['jpg', 'jpeg'] : [ext]
)

export function registerMediaHandlers(): void {
  ipcMain.handle(IpcChannel.MediaCreateLibrary, () => createLibrary())

  ipcMain.handle(IpcChannel.MediaReleaseLibrary, (_e, id: unknown) => {
    if (typeof id === 'string') libraries.delete(id)
  })

  ipcMain.handle(
    IpcChannel.MediaImport,
    async (event, id: unknown, multiple: unknown): Promise<MediaImportResult | null> => {
      const store = getLibrary(id)
      if (!store) return null
      const window = BrowserWindow.fromWebContents(event.sender)
      const options: Electron.OpenDialogOptions = {
        properties: multiple === true ? ['openFile', 'multiSelections'] : ['openFile'],
        filters: [{ name: t('media.filter'), extensions: FILTER_EXTENSIONS }]
      }
      const result = window
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options)
      if (result.canceled || !result.filePaths.length) return null
      const items: MediaPutResult[] = []
      for (const path of result.filePaths.slice(0, 200)) {
        const fileName = basename(path)
        try {
          const stat = await fs.stat(path)
          if (stat.size > MAX_MEDIA_BYTES) {
            items.push({ ok: false, fileName, error: 'too-large' })
            continue
          }
          items.push(put(store, new Uint8Array(await fs.readFile(path)), fileName))
        } catch {
          items.push({ ok: false, fileName, error: 'io' })
        }
      }
      return { items }
    }
  )

  ipcMain.handle(
    IpcChannel.MediaImportPaths,
    async (
      _e,
      id: unknown,
      basePath: unknown,
      paths: unknown
    ): Promise<Record<string, MediaPutResult>> => {
      const store = getLibrary(id)
      if (!store || typeof basePath !== 'string' || !Array.isArray(paths)) return {}
      const dir = dirname(resolve(basePath))
      const out: Record<string, MediaPutResult> = {}
      for (const raw of paths.slice(0, 5000)) {
        if (typeof raw !== 'string' || out[raw]) continue
        const fileName = basename(raw.replace(/\\/g, '/'))
        const found = await locate(dir, raw)
        if (!found) {
          out[raw] = { ok: false, fileName, error: 'io' }
          continue
        }
        try {
          const stat = await fs.stat(found)
          out[raw] =
            stat.size > MAX_MEDIA_BYTES
              ? { ok: false, fileName, error: 'too-large' }
              : put(store, new Uint8Array(await fs.readFile(found)), fileName)
        } catch {
          out[raw] = { ok: false, fileName, error: 'io' }
        }
      }
      return out
    }
  )

  ipcMain.handle(
    IpcChannel.MediaPut,
    (_e, id: unknown, data: unknown, fileName: unknown): MediaPutResult | null => {
      const store = getLibrary(id)
      const name = typeof fileName === 'string' ? basename(fileName).slice(0, 200) : ''
      if (!store || !(data instanceof Uint8Array)) return null
      return put(store, data, name)
    }
  )

  ipcMain.handle(IpcChannel.MediaGet, (_e, id: unknown, hash: unknown) => {
    const store = getLibrary(id)
    return typeof hash === 'string' ? (store?.media.get(hash)?.bytes ?? null) : null
  })

  ipcMain.handle(IpcChannel.MediaThumbs, (_e, id: unknown) => {
    const store = getLibrary(id)
    if (!store) return {}
    return Object.fromEntries([...store.thumbs].map(([hash, t]) => [hash, t.bytes]))
  })

  ipcMain.handle(IpcChannel.MediaHashes, (_e, id: unknown) => [
    ...(getLibrary(id)?.media.keys() ?? [])
  ])

  ipcMain.handle(IpcChannel.MediaPutThumb, (_e, id: unknown, hash: unknown, data: unknown) => {
    const store = getLibrary(id)
    if (
      !store ||
      typeof hash !== 'string' ||
      !HASH.test(hash) ||
      !store.media.has(hash) ||
      !(data instanceof Uint8Array) ||
      data.length > MAX_THUMB_BYTES ||
      sniffMime(data) !== 'image/webp'
    )
      return false
    store.thumbs.set(hash, { bytes: data })
    return true
  })

  ipcMain.handle(
    IpcChannel.MediaExport,
    async (event, id: unknown, hash: unknown, fileName: unknown): Promise<boolean> => {
      const bytes = typeof hash === 'string' ? getLibrary(id)?.media.get(hash)?.bytes : undefined
      if (!bytes) return false
      const name = safeName(fileName, 'media')
      const window = BrowserWindow.fromWebContents(event.sender)
      const ext = extname(name).slice(1)
      const options: Electron.SaveDialogOptions = {
        defaultPath: name,
        filters: ext ? [{ name: ext.toUpperCase(), extensions: [ext] }] : []
      }
      const result = window
        ? await dialog.showSaveDialog(window, options)
        : await dialog.showSaveDialog(options)
      if (result.canceled || !result.filePath) return false
      await writeFileAtomic(resolve(result.filePath), bytes)
      return true
    }
  )

  ipcMain.handle(
    IpcChannel.MediaOpenExternal,
    async (_e, id: unknown, hash: unknown, fileName: unknown): Promise<boolean> => {
      const store = getLibrary(id)
      const bytes = typeof hash === 'string' ? store?.media.get(hash)?.bytes : undefined
      const mime = bytes && sniffMime(bytes)
      if (!bytes || !mime) return false
      // The extension follows the content, so the system never runs a disguised file.
      const ext = MEDIA_TYPES[mime]
      const base = safeName(fileName, 'document').replace(/\.[^.]*$/, '')
      const folder = join(app.getPath('temp'), 'family-insight-media', randomUUID())
      const path = join(folder, `${base || 'document'}.${ext}`)
      await writeFileAtomic(path, bytes)
      return (await shell.openPath(path)) === ''
    }
  )
}
