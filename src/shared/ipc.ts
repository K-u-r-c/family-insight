import type { Settings } from '@core/settings'

/** IPC channel names. Every channel used between main and renderer is declared here. */
export const IpcChannel = {
  AppGetInfo: 'app:get-info',
  SettingsGet: 'settings:get',
  SettingsUpdate: 'settings:update',
  SettingsChanged: 'settings:changed',
  WindowSetDocumentEdited: 'window:set-document-edited',
  MenuSetState: 'menu:set-state',
  MenuAction: 'menu:action'
} as const

export interface AppInfo {
  name: string
  version: string
  platform: string
  locale: string
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
  | 'edit:undo'
  | 'edit:redo'
  | 'help:about'

/** The API exposed to the renderer as `window.familyInsight` by the preload script. */
export interface FamilyInsightApi {
  getAppInfo(): Promise<AppInfo>
  getSettings(): Promise<Settings>
  /** Merges a partial update; main validates it and broadcasts the result. */
  updateSettings(patch: Partial<Settings>): Promise<Settings>
  onSettingsChanged(listener: (settings: Settings) => void): () => void
  /** Marks the window as having unsaved changes (macOS close-button dot). */
  setDocumentEdited(edited: boolean): Promise<void>
  setMenuState(state: MenuState): Promise<void>
  onMenuAction(listener: (action: MenuAction) => void): () => void
}
