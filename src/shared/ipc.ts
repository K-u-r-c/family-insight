import type { Settings } from '@core/settings'

/** IPC channel names. Every channel used between main and renderer is declared here. */
export const IpcChannel = {
  AppGetInfo: 'app:get-info',
  SettingsGet: 'settings:get',
  SettingsUpdate: 'settings:update',
  SettingsChanged: 'settings:changed',
  WindowSetDocumentEdited: 'window:set-document-edited',
  FileOpenDialog: 'file:open-dialog',
  FileRead: 'file:read',
  FileSaveDialog: 'file:save-dialog',
  FileWrite: 'file:write',
  FileTakePending: 'file:take-pending',
  FileOpenRequest: 'file:open-request',
  FileShowInFolder: 'file:show-in-folder',
  FileExists: 'file:exists',
  PhotoPick: 'photo:pick',
  ExportPdf: 'export:pdf',
  Print: 'export:print',
  DialogUnsaved: 'dialog:unsaved',
  RecoveryWrite: 'recovery:write',
  RecoveryClear: 'recovery:clear',
  RecoveryList: 'recovery:list',
  RecoveryRead: 'recovery:read',
  WindowCloseRequest: 'window:close-request',
  WindowClose: 'window:close',
  MenuSetState: 'menu:set-state',
  MenuAction: 'menu:action'
} as const

export interface AppInfo {
  name: string
  version: string
  platform: string
  locale: string
}

/** Id of a registered format (see `src/core/io/registry.ts`), e.g. `finsight` or `csv`. */
export type FormatId = string

export type FileErrorCode = 'not-found' | 'permission' | 'too-large' | 'unsupported' | 'io'

export type FileReadResult =
  | { ok: true; path: string; content: string; encoding: 'utf-8' | 'windows-1250' }
  | { ok: false; path?: string; error: FileErrorCode }

export type FileWriteResult = { ok: true; path: string } | { ok: false; error: FileErrorCode }

export type PhotoPickResult =
  { ok: true; dataUrl: string } | { ok: false; error: 'too-large' | 'unsupported' | 'io' }

export interface PdfOptions {
  pageSize: 'A4' | 'A3' | 'Letter'
  landscape: boolean
}

export type UnsavedChoice = 'save' | 'discard' | 'cancel'

export interface RecoveryEntry {
  id: string
  originalPath: string | null
  name: string
  savedAt: string
}

/** Enabled-state of document-dependent menu items, reported by the renderer. */
export interface MenuState {
  hasDocument: boolean
  canUndo: boolean
  canRedo: boolean
}

/** Actions triggered from the native menu and forwarded to the renderer. */
export type MenuAction =
  | 'file:new'
  | 'file:open'
  | 'file:save'
  | 'file:save-as'
  | 'file:import-csv'
  | 'file:export-csv'
  | 'file:export-image'
  | 'file:print'
  | 'edit:undo'
  | 'edit:redo'
  | 'help:about'
  | 'help:csv-format'
  | 'help:csv-template'
  | 'help:shortcuts'

/** The API exposed to the renderer as `window.familyInsight` by the preload script. */
export interface FamilyInsightApi {
  getAppInfo(): Promise<AppInfo>
  getSettings(): Promise<Settings>
  /** Merges a partial update; main validates it and broadcasts the result. */
  updateSettings(patch: Partial<Settings>): Promise<Settings>
  onSettingsChanged(listener: (settings: Settings) => void): () => void
  /** Marks the window as having unsaved changes (macOS close-button dot). */
  setDocumentEdited(edited: boolean): Promise<void>
  /** Shows an open dialog; resolves to `null` when cancelled. */
  openFileDialog(format: FormatId): Promise<FileReadResult | null>
  readFile(path: string): Promise<FileReadResult>
  /** Shows a save dialog; the returned path becomes writable for this session. */
  saveFileDialog(format: FormatId, suggestedName: string): Promise<string | null>
  /** `backup`: rotate `.bak1…5` copies first (explicit saves, if enabled in settings). */
  writeFile(
    path: string,
    content: string,
    options?: { backup?: boolean; encoding?: 'utf8' | 'base64' }
  ): Promise<FileWriteResult>
  /** Renders SVG markup to a PDF file (path from `saveFileDialog('pdf', …)`). */
  exportPdf(svg: string, options: PdfOptions, path: string): Promise<FileWriteResult>
  /** Opens the system print dialog for SVG markup. */
  print(svg: string, options: PdfOptions): Promise<boolean>
  showInFolder(path: string): Promise<void>
  /** Which of the given paths still exist (for the recent files list). */
  filesExist(paths: string[]): Promise<boolean[]>
  /** Picks an image file; resolves to `null` when cancelled. */
  pickPhoto(): Promise<PhotoPickResult | null>
  /** A file the OS asked us to open before the UI was ready (double-click, argv). */
  takePendingFile(): Promise<string | null>
  onOpenFileRequest(listener: (path: string) => void): () => void
  /** Native "Save changes to …?" dialog. */
  askUnsaved(documentName: string): Promise<UnsavedChoice>
  /** Main asks before closing the window; respond with `closeWindow()` to proceed. */
  onCloseRequest(listener: () => void): () => void
  closeWindow(): Promise<void>
  /** Absolute path of a dropped file (Electron no longer exposes `File.path`). */
  getPathForFile(file: File): string
  /** Crash-recovery snapshots of unsaved documents. */
  writeRecovery(
    id: string,
    originalPath: string | null,
    name: string,
    content: string
  ): Promise<void>
  clearRecovery(id: string): Promise<void>
  listRecovery(): Promise<RecoveryEntry[]>
  readRecovery(id: string): Promise<{ content: string; originalPath: string | null } | null>
  setMenuState(state: MenuState): Promise<void>
  onMenuAction(listener: (action: MenuAction) => void): () => void
}
