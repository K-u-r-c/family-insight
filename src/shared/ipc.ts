import type { MediaMime } from '@core/model/types'
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
  FileWriteDocument: 'file:write-document',
  FileTakePending: 'file:take-pending',
  FileOpenRequest: 'file:open-request',
  FileShowInFolder: 'file:show-in-folder',
  FileExists: 'file:exists',
  PhotoPick: 'photo:pick',
  MediaCreateLibrary: 'media:create-library',
  MediaReleaseLibrary: 'media:release-library',
  MediaImport: 'media:import',
  MediaPut: 'media:put',
  MediaGet: 'media:get',
  MediaThumbs: 'media:thumbs',
  MediaHashes: 'media:hashes',
  MediaPutThumb: 'media:put-thumb',
  MediaExport: 'media:export',
  MediaOpenExternal: 'media:open-external',
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

export type FileErrorCode =
  | 'not-found'
  | 'permission'
  | 'too-large'
  | 'unsupported'
  | 'io'
  | 'corrupt-container'
  | 'missing-tree'

export type FileReadResult =
  | {
      ok: true
      path: string
      content: string
      encoding: 'utf-8' | 'windows-1250'
      /** Media library holding the file's photos and documents (`.finsight` files only). */
      library?: string
    }
  | { ok: false; path?: string; error: FileErrorCode }

export type FileWriteResult = { ok: true; path: string } | { ok: false; error: FileErrorCode }

export type PhotoPickResult =
  { ok: true; dataUrl: string } | { ok: false; error: 'too-large' | 'unsupported' | 'io' }

/** A file added to a media library (bytes stay in main, addressed by `hash`). */
export type MediaPutResult =
  | { ok: true; hash: string; mime: MediaMime; size: number; fileName: string }
  | { ok: false; fileName: string; error: 'too-large' | 'unsupported' | 'io' }

export interface MediaImportResult {
  items: MediaPutResult[]
}

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
  hasSelection: boolean
  viewMode: 'family' | 'ancestors' | 'descendants' | 'hourglass'
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
  | 'help:guide'
  | 'file:close'
  | 'edit:add-person'
  | 'edit:delete'
  | 'edit:find'
  | 'edit:sources'
  | 'view:mode-family'
  | 'view:mode-ancestors'
  | 'view:mode-descendants'
  | 'view:mode-hourglass'
  | 'view:fit'
  | 'view:zoom-in'
  | 'view:zoom-out'
  | 'view:zoom-reset'
  | 'view:toggle-sidebar'
  | 'view:toggle-minimap'
  | 'view:statistics'

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
  /**
   * Saves a `.finsight` document: main packs the JSON with the media of `library` into the
   * container (only media the JSON lists). `backup` as for `writeFile`.
   */
  writeDocument(
    path: string,
    json: string,
    library: string | null,
    options?: { backup?: boolean }
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
  /** A new, empty media library for a new document. */
  createMediaLibrary(): Promise<string>
  /** Frees the media of a document that is no longer open. */
  releaseMediaLibrary(library: string): Promise<void>
  /** Picks photos/documents (validated by content) into the library; `null` when cancelled. */
  importMedia(library: string, multiple: boolean): Promise<MediaImportResult | null>
  /** Adds bytes made in the renderer (cropped portrait, dropped file) to the library. */
  putMedia(library: string, data: Uint8Array, fileName: string): Promise<MediaPutResult | null>
  getMedia(library: string, hash: string): Promise<Uint8Array | null>
  /** All thumbnails of the library (WebP), by media hash. */
  getThumbnails(library: string): Promise<Record<string, Uint8Array>>
  /** Hashes of all media bytes the library holds. */
  listMediaHashes(library: string): Promise<string[]>
  putThumbnail(library: string, hash: string, data: Uint8Array): Promise<boolean>
  /** Saves a media file to a place the user picks; `false` when cancelled. */
  exportMedia(library: string, hash: string, fileName: string): Promise<boolean>
  /** Opens a media file in the system's default app (via a temporary copy). */
  openMediaExternally(library: string, hash: string, fileName: string): Promise<boolean>
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
    content: string,
    library: string | null
  ): Promise<void>
  clearRecovery(id: string): Promise<void>
  listRecovery(): Promise<RecoveryEntry[]>
  /** Restores a snapshot; its media are loaded into a new `library`. */
  readRecovery(
    id: string
  ): Promise<{ content: string; originalPath: string | null; library: string } | null>
  setMenuState(state: MenuState): Promise<void>
  onMenuAction(listener: (action: MenuAction) => void): () => void
}
