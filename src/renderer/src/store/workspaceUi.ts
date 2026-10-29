import { create } from 'zustand'

/** Transient UI state of the workspace (not part of the document, not undoable). */
interface WorkspaceUiState {
  query: string
  setQuery: (query: string) => void
}

export const useWorkspaceUi = create<WorkspaceUiState>((set) => ({
  query: '',
  setQuery: (query) => set({ query })
}))
