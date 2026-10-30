import { promises as fs } from 'node:fs'
import { dirname, extname, isAbsolute, join, resolve } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { ContainerError, unpackDocument } from '@core/file/container'
import { decodeText } from '@core/file/encoding'
import { writeGedzip } from '@core/io/gedcom/gedzip'
import { FILE_EXTENSION } from '@core/file/format'
import { getFormat, listFormats, type FormatAdapter } from '@core/io/registry'
import {
  IpcChannel,
  type FileErrorCode,
  type FileReadResult,
  type FileWriteResult,
  type PhotoPickResult,
  type UnsavedChoice
} from '@shared/ipc'
import { rotateBackups } from './backups'
import { DocumentTooLargeError, MAX_DOCUMENT_BYTES, saveDocument } from './documentWriter'
import { writeFileAtomic } from './fsUtils'
import { createLibrary, getLibrary } from './media'
import { getSettings } from './settings'
import { t } from './i18n'

const MAX_FILE_BYTES = 200 * 1024 * 1024
const MAX_PHOTO_BYTES = 20 * 1024 * 1024
const PHOTO_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif'
}

/** Paths the user picked in a save dialog or opened this session: the only writable ones. */
const writable = new Set<string>()
let pendingPath: string | null = null

function readable(path: string): boolean {
  const ext = extname(path).toLowerCase().slice(1)
  return listFormats().some((f) => f.extensions.includes(ext))
}

/** Formats that are only written (images of the tree), not registered as tree formats. */
const EXPORT_ONLY: Record<string, { extensions: string[]; labelKey: string }> = {
  png: { extensions: ['png'], labelKey: 'export.png' },
  svg: { extensions: ['svg'], labelKey: 'export.svg' },
  pdf: { extensions: ['pdf'], labelKey: 'export.pdf' },
  gedzip: { extensions: ['gdz'], labelKey: 'files.gedzipFilter' }
}

/** Formats whose importer decodes the bytes itself (GEDCOM: ANSEL, UTF-16, GEDZIP). */
const BINARY_IMPORT = new Set(['ged', 'gdz'])

function formatOrNative(id: unknown): FormatAdapter {
  if (typeof id === 'string' && EXPORT_ONLY[id]) {
    return { id, ...EXPORT_ONLY[id]!, kind: 'native' }
  }
  return (typeof id === 'string' && getFormat(id)) || getFormat('finsight')!
}

export const isWritable = (path: string): boolean => writable.has(resolve(path))

function filters(format: FormatAdapter): Electron.FileFilter[] {
  const own = {
    name: t(format.labelKey as never) as unknown as string,
    extensions: format.extensions
  }
  return format.kind === 'native' ? [own] : [own, { name: t('files.allFiles'), extensions: ['*'] }]
}

function errorCode(error: unknown): FileErrorCode {
  const code = (error as NodeJS.ErrnoException).code
  if (code === 'ENOENT' || code === 'ENOTDIR') return 'not-found'
  if (code === 'EACCES' || code === 'EPERM' || code === 'EROFS') return 'permission'
  return 'io'
}

export async function readFile(path: string): Promise<FileReadResult> {
  const full = resolve(path)
  if (!readable(full)) return { ok: false, path: full, error: 'unsupported' }
  try {
    const isDocument = extname(full).toLowerCase() === `.${FILE_EXTENSION}`
    const stat = await fs.stat(full)
    if (stat.size > (isDocument ? MAX_DOCUMENT_BYTES : MAX_FILE_BYTES)) {
      return { ok: false, path: full, error: 'too-large' }
    }
    const buffer = new Uint8Array(await fs.readFile(full))
    if (isDocument) {
      const { json, store } = unpackDocument(buffer)
      writable.add(full)
      app.addRecentDocument(full)
      return {
        ok: true,
        path: full,
        content: json,
        encoding: 'utf-8',
        library: createLibrary(store)
      }
    }
    if (BINARY_IMPORT.has(extname(full).toLowerCase().slice(1))) {
      return { ok: true, path: full, content: '', encoding: 'utf-8', bytes: buffer }
    }
    const { text, encoding } = decodeText(buffer)
    return { ok: true, path: full, content: text, encoding }
  } catch (error) {
    if (error instanceof ContainerError) return { ok: false, path: full, error: error.code }
    return { ok: false, path: full, error: errorCode(error) }
  }
}

export { pathFromArgv } from './argv'

/** Opens a file requested by the OS: forwards it to the window or keeps it until the UI asks. */
export function requestOpen(path: string): void {
  const window = BrowserWindow.getAllWindows()[0]
  if (window && !window.webContents.isLoading()) {
    window.webContents.send(IpcChannel.FileOpenRequest, resolve(path))
    if (window.isMinimized()) window.restore()
    window.focus()
  } else {
    pendingPath = resolve(path)
  }
}

export function registerFileHandlers(): void {
  ipcMain.handle(
    IpcChannel.FileOpenDialog,
    async (event, id: unknown): Promise<FileReadResult | null> => {
      const format = formatOrNative(id)
      const window = BrowserWindow.fromWebContents(event.sender)
      const options: Electron.OpenDialogOptions = {
        properties: ['openFile'],
        filters: filters(format)
      }
      const result = window
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options)
      const [path] = result.filePaths
      if (result.canceled || !path) return null
      return readFile(path)
    }
  )

  ipcMain.handle(IpcChannel.FileRead, (_event, path: unknown) =>
    typeof path === 'string' && path.length > 0 ? readFile(path) : { ok: false, error: 'not-found' }
  )

  ipcMain.handle(IpcChannel.FileSaveDialog, async (event, id: unknown, suggested: unknown) => {
    const format = formatOrNative(id)
    const ext = format.extensions[0]!
    const base = (typeof suggested === 'string' && suggested.trim() ? suggested.trim() : 'family')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .slice(0, 100)
    const window = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.SaveDialogOptions = {
      defaultPath: resolve(app.getPath('documents'), `${base}.${ext}`),
      filters: [filters(format)[0]!]
    }
    const result = window
      ? await dialog.showSaveDialog(window, options)
      : await dialog.showSaveDialog(options)
    if (result.canceled || !result.filePath) return null
    let path = resolve(result.filePath)
    if (extname(path).toLowerCase() !== `.${ext}`) path += `.${ext}`
    writable.add(path)
    return path
  })

  ipcMain.handle(
    IpcChannel.FileWrite,
    async (_event, path: unknown, content: unknown, options: unknown): Promise<FileWriteResult> => {
      if (typeof path !== 'string' || typeof content !== 'string') return { ok: false, error: 'io' }
      const full = resolve(path)
      if (!writable.has(full)) return { ok: false, error: 'permission' }
      const opts = (options ?? {}) as { backup?: unknown; encoding?: unknown }
      const backup = opts.backup === true
      try {
        if (
          backup &&
          getSettings().backups &&
          extname(full).toLowerCase() === `.${FILE_EXTENSION}`
        ) {
          await rotateBackups(full).catch((error) => console.warn('Backup failed', error))
        }
        await writeFileAtomic(
          full,
          opts.encoding === 'base64' ? Buffer.from(content, 'base64') : content
        )
        if (extname(full).toLowerCase() === `.${FILE_EXTENSION}`) app.addRecentDocument(full)
        return { ok: true, path: full }
      } catch (error) {
        return { ok: false, error: errorCode(error) }
      }
    }
  )

  ipcMain.handle(
    IpcChannel.FileWriteDocument,
    async (
      _event,
      path: unknown,
      json: unknown,
      library: unknown,
      options: unknown
    ): Promise<FileWriteResult> => {
      if (typeof path !== 'string' || typeof json !== 'string') return { ok: false, error: 'io' }
      const full = resolve(path)
      if (!writable.has(full) || extname(full).toLowerCase() !== `.${FILE_EXTENSION}`) {
        return { ok: false, error: 'permission' }
      }
      try {
        const backup =
          (options as { backup?: unknown } | undefined)?.backup === true && getSettings().backups
        const { missing } = await saveDocument(full, json, getLibrary(library), { backup })
        if (missing.length) console.warn(`Saved without ${missing.length} missing media files`)
        app.addRecentDocument(full)
        return { ok: true, path: full }
      } catch (error) {
        if (error instanceof DocumentTooLargeError) return { ok: false, error: 'too-large' }
        return { ok: false, error: errorCode(error) }
      }
    }
  )

  ipcMain.handle(
    IpcChannel.FileExportGedcom,
    async (_event, path: unknown, text: unknown, media: unknown): Promise<FileWriteResult> => {
      if (typeof path !== 'string' || typeof text !== 'string') return { ok: false, error: 'io' }
      const full = resolve(path)
      if (!writable.has(full)) return { ok: false, error: 'permission' }
      const m = (typeof media === 'object' && media !== null ? media : {}) as Record<
        string,
        unknown
      >
      const mode = m.mode === 'folder' || m.mode === 'gedzip' ? m.mode : 'none'
      const store = getLibrary(m.library)
      const files = (Array.isArray(m.files) ? m.files : [])
        .filter(
          (f): f is { path: string; hash: string } =>
            typeof f?.path === 'string' && typeof f?.hash === 'string'
        )
        // Only plain relative paths inside the export folder.
        .filter(
          (f) =>
            !f.path.split('/').some((part) => part === '..' || part === '') && !isAbsolute(f.path)
        )
        .map((f) => ({ path: f.path, bytes: store?.media.get(f.hash)?.bytes }))
        .filter((f): f is { path: string; bytes: Uint8Array } => !!f.bytes)
      try {
        if (mode === 'gedzip') {
          await writeFileAtomic(full, writeGedzip(text, files))
        } else {
          await writeFileAtomic(full, text)
          if (mode === 'folder') {
            for (const f of files) await writeFileAtomic(join(dirname(full), f.path), f.bytes)
          }
        }
        return { ok: true, path: full }
      } catch (error) {
        return { ok: false, error: errorCode(error) }
      }
    }
  )

  ipcMain.handle(IpcChannel.FileShowInFolder, (_event, path: unknown) => {
    if (typeof path === 'string') shell.showItemInFolder(resolve(path))
  })

  ipcMain.handle(IpcChannel.FileExists, async (_event, paths: unknown) => {
    if (!Array.isArray(paths)) return []
    return Promise.all(
      paths.slice(0, 50).map((p) =>
        typeof p === 'string'
          ? fs.access(resolve(p)).then(
              () => true,
              () => false
            )
          : false
      )
    )
  })

  ipcMain.handle(IpcChannel.PhotoPick, async (event): Promise<PhotoPickResult | null> => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.OpenDialogOptions = {
      properties: ['openFile'],
      filters: [
        {
          name: t('photo.filter'),
          extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']
        }
      ]
    }
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)
    const [path] = result.filePaths
    if (result.canceled || !path) return null
    const ext = extname(path).toLowerCase().slice(1)
    const mime = PHOTO_TYPES[ext]
    if (!mime) return { ok: false, error: 'unsupported' }
    try {
      const stat = await fs.stat(path)
      if (stat.size > MAX_PHOTO_BYTES) return { ok: false, error: 'too-large' }
      const data = await fs.readFile(path)
      return { ok: true, dataUrl: `data:${mime};base64,${data.toString('base64')}` }
    } catch {
      return { ok: false, error: 'io' }
    }
  })

  ipcMain.handle(IpcChannel.FileTakePending, () => {
    const path = pendingPath
    pendingPath = null
    return path
  })

  ipcMain.handle(IpcChannel.DialogUnsaved, async (event, name: unknown): Promise<UnsavedChoice> => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.MessageBoxOptions = {
      type: 'warning',
      message: t('files.unsavedTitle', { name: typeof name === 'string' ? name : '' }),
      detail: t('files.unsavedDetail'),
      buttons: [t('files.save'), t('files.dontSave'), t('files.cancel')],
      defaultId: 0,
      cancelId: 2,
      noLink: true
    }
    const { response } = window
      ? await dialog.showMessageBox(window, options)
      : await dialog.showMessageBox(options)
    return response === 0 ? 'save' : response === 1 ? 'discard' : 'cancel'
  })
}

/**
 * Lets the renderer veto closing (unsaved changes). The first close is cancelled and the
 * renderer is asked; it calls `window:close` when it is safe to close.
 */
export function guardWindowClose(window: BrowserWindow): void {
  let allowed = false
  window.on('close', (event) => {
    if (allowed || window.webContents.isCrashed()) return
    event.preventDefault()
    window.webContents.send(IpcChannel.WindowCloseRequest)
  })
  ipcMain.removeHandler(IpcChannel.WindowClose)
  ipcMain.handle(IpcChannel.WindowClose, (event) => {
    const target = BrowserWindow.fromWebContents(event.sender)
    if (!target) return
    allowed = true
    target.close()
  })
}
