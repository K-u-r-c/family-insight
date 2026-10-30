import { create } from 'zustand'
import type { CitationTarget } from '@core/model/sources'

export type PeopleSort = 'surname' | 'givenNames' | 'birth'
export type AppDialog =
  | 'export-csv'
  | 'import-csv'
  | 'export-image'
  | 'new-tree'
  | 'stats'
  | 'shortcuts'
  | 'about'
  | 'sources'
  | 'places'
  | null

/** Transient UI state of the workspace (not part of the document, not undoable). */
interface WorkspaceUiState {
  query: string
  sort: PeopleSort
  /** Person whose panel is in edit mode (others show the read-only details). */
  editingId: string | null
  dialog: AppDialog
  /** Source selected when the sources manager opens. */
  sourceId: string | null
  /** Fact whose citations are being edited (citations dialog), if any. */
  citing: CitationTarget | null
  /** Media shown in the viewer: the list it was opened from and the current position. */
  viewing: { mediaIds: string[]; index: number; personId?: string } | null
  /** Media item whose details dialog is open. */
  editingMedia: string | null
  setQuery: (query: string) => void
  setSort: (sort: PeopleSort) => void
  setEditing: (id: string | null) => void
  openDialog: (dialog: AppDialog) => void
  openSources: (sourceId?: string | null) => void
  setCiting: (target: CitationTarget | null) => void
  /** Opens the viewer at `index` of `mediaIds` (from a person's gallery: `personId`). */
  viewMedia: (mediaIds: string[], index: number, personId?: string) => void
  closeViewer: () => void
  setEditingMedia: (id: string | null) => void
}

export const useWorkspaceUi = create<WorkspaceUiState>((set) => ({
  query: '',
  sort: 'surname',
  editingId: null,
  dialog: null,
  sourceId: null,
  citing: null,
  viewing: null,
  editingMedia: null,
  setQuery: (query) => set({ query }),
  setSort: (sort) => set({ sort }),
  setEditing: (editingId) => set({ editingId }),
  openDialog: (dialog) => set({ dialog }),
  openSources: (sourceId = null) => set({ dialog: 'sources', sourceId, citing: null }),
  setCiting: (citing) => set({ citing }),
  viewMedia: (mediaIds, index, personId) => set({ viewing: { mediaIds, index, personId } }),
  closeViewer: () => set({ viewing: null }),
  setEditingMedia: (editingMedia) => set({ editingMedia })
}))
