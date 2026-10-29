import { create } from 'zustand'
import { createEmptyTree } from '@core/model/tree'
import { renameTree } from '@core/model/operations'
import type { FamilyTree, PersonId } from '@core/model/types'

interface DocumentState {
  /** The open document, or `null` when the welcome screen is shown. */
  tree: FamilyTree | null
  filePath: string | null
  /** Snapshot at the last save; the document is dirty when `tree !== savedTree`. */
  savedTree: FamilyTree | null
  selectedPersonId: PersonId | null

  newDocument: (name: string) => void
  closeDocument: () => void
  select: (id: PersonId | null) => void
  rename: (name: string) => void
}

export const useDocument = create<DocumentState>((set, get) => ({
  tree: null,
  filePath: null,
  savedTree: null,
  selectedPersonId: null,

  newDocument: (name) => {
    const tree = createEmptyTree(name)
    set({ tree, filePath: null, savedTree: tree, selectedPersonId: null })
  },
  closeDocument: () => set({ tree: null, filePath: null, savedTree: null, selectedPersonId: null }),
  select: (id) => set({ selectedPersonId: id }),
  rename: (name) => {
    const { tree } = get()
    if (tree && name.trim() && name !== tree.meta.name) set({ tree: renameTree(tree, name.trim()) })
  }
}))

export const selectIsDirty = (s: DocumentState): boolean =>
  s.tree !== null && s.tree !== s.savedTree
