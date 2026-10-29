import { create } from 'zustand'

export type PeopleSort = 'surname' | 'givenNames' | 'birth'

/** Transient UI state of the workspace (not part of the document, not undoable). */
interface WorkspaceUiState {
  query: string
  sort: PeopleSort
  setQuery: (query: string) => void
  setSort: (sort: PeopleSort) => void
}

export const useWorkspaceUi = create<WorkspaceUiState>((set) => ({
  query: '',
  sort: 'surname',
  setQuery: (query) => set({ query }),
  setSort: (sort) => set({ sort })
}))
