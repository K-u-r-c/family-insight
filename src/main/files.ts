import { promises as fs } from 'node:fs'
import { extname, resolve } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { decodeText } from '@core/file/encoding'
import { FILE_EXTENSION } from '@core/file/format'
import {
  IpcChannel,
  type FileErrorCode,
  type FileKind,
  type FileReadResult,
  type FileWriteResult,
  type UnsavedChoice
} from '@shared/ipc'
import { writeFileAtomic } from './fsUtils'
import { t } from './i18n'

const MAX_FILE_BYTES = 200 * 1024 * 1024
const READABLE = new Set([`.${FILE_EXTENSION}`, '.csv', '.txt', '.tsv'])

/** Paths the user picked in a save dialog or opened this session: the only writable ones. */
const writable = new Set<string>()
let pendingPath: string | null = null

function filters(kind: FileKind): Electron.FileFilter[] {
  return kind === 'tree'
    ? [{ name: t('files.treeFilter'), extensions: [FILE_EXTENSION] }]
    : [
        { name: t('files.csvFilter'), extensions: ['csv', 'txt', 'tsv'] },
        { name: t('files.allFiles'), extensions: ['*'] }
      ]
}

function errorCode(error: unknown): FileErrorCode {
  const code = (error as NodeJS.ErrnoException).code
  if (code === 'ENOENT' || code === 'ENOTDIR') return 'not-found'
  if (code === 'EACCES' || code === 'EPERM' || code === 'EROFS') return 'permission'
  return 'io'
}

export async function readFile(path: string): Promise<FileReadResult> {
  const full = resolve(path)
  if (!READABLE.has(extname(full).toLowerCase()))
    return { ok: false, path: full, error: 'unsupported' }
  try {
    const stat = await fs.stat(full)
    if (stat.size > MAX_FILE_BYTES) return { ok: false, path: full, error: 'too-large' }
    const buffer = await fs.readFile(full)
    if (extname(full).toLowerCase() === `.${FILE_EXTENSION}`) writable.add(full)
    const { text, encoding } = decodeText(buffer)
    return { ok: true, path: full, content: text, encoding }
  } catch (error) {
    return { ok: false, path: full, error: errorCode(error) }
  }
}

function isFilePathArg(arg: string): boolean {
  return extname(arg).toLowerCase() === `.${FILE_EXTENSION}` && !arg.startsWith('-')
}

/** Extracts a `.finsight` path from command-line arguments. */
export function pathFromArgv(argv: string[]): string | null {
  return argv.slice(1).find(isFilePathArg) ?? null
}

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
    async (event, kind: unknown): Promise<FileReadResult | null> => {
      const fileKind: FileKind = kind === 'csv' ? 'csv' : 'tree'
      const window = BrowserWindow.fromWebContents(event.sender)
      const options: Electron.OpenDialogOptions = {
        properties: ['openFile'],
        filters: filters(fileKind)
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

  ipcMain.handle(IpcChannel.FileSaveDialog, async (event, kind: unknown, suggested: unknown) => {
    const fileKind: FileKind = kind === 'csv' ? 'csv' : 'tree'
    const ext = fileKind === 'tree' ? FILE_EXTENSION : 'csv'
    const base = (typeof suggested === 'string' && suggested.trim() ? suggested.trim() : 'family')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .slice(0, 100)
    const window = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.SaveDialogOptions = {
      defaultPath: resolve(app.getPath('documents'), `${base}.${ext}`),
      filters: [filters(fileKind)[0]!]
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
    async (_event, path: unknown, content: unknown): Promise<FileWriteResult> => {
      if (typeof path !== 'string' || typeof content !== 'string') return { ok: false, error: 'io' }
      const full = resolve(path)
      if (!writable.has(full)) return { ok: false, error: 'permission' }
      try {
        await writeFileAtomic(full, content)
        return { ok: true, path: full }
      } catch (error) {
        return { ok: false, error: errorCode(error) }
      }
    }
  )

  ipcMain.handle(IpcChannel.FileShowInFolder, (_event, path: unknown) => {
    if (typeof path === 'string') shell.showItemInFolder(resolve(path))
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
