import { create } from 'zustand'

export type PeopleSort = 'surname' | 'givenNames' | 'birth'
export type AppDialog = 'export-csv' | 'import-csv' | null

/** Transient UI state of the workspace (not part of the document, not undoable). */
interface WorkspaceUiState {
  query: string
  sort: PeopleSort
  /** Person whose panel is in edit mode (others show the read-only details). */
  editingId: string | null
  dialog: AppDialog
  setQuery: (query: string) => void
  setSort: (sort: PeopleSort) => void
  setEditing: (id: string | null) => void
  openDialog: (dialog: AppDialog) => void
}

export const useWorkspaceUi = create<WorkspaceUiState>((set) => ({
  query: '',
  sort: 'surname',
  editingId: null,
  dialog: null,
  setQuery: (query) => set({ query }),
  setSort: (sort) => set({ sort }),
  setEditing: (editingId) => set({ editingId }),
  openDialog: (dialog) => set({ dialog })
}))
