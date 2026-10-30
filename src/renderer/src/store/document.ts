import { create } from 'zustand'
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type History
} from '@core/history'
import { createEmptyTree } from '@core/model/tree'
import type { FamilyTree, PersonId } from '@core/model/types'
import { applyViewMeta } from '@renderer/services/viewMeta'
import { renameTreeCommand, type Command } from './commands'

interface DocumentState {
  /** The open document (= `history.present`), or `null` when the welcome screen is shown. */
  tree: FamilyTree | null
  history: History<FamilyTree> | null
  filePath: string | null
  /** Snapshot at the last save; the document is dirty when `tree !== savedTree`. */
  savedTree: FamilyTree | null
  selectedPersonId: PersonId | null
  /** Increments whenever a different document is opened (views reset on change). */
  documentId: number

  newDocument: (name: string) => void
  /** Opens a tree (from a file or an import) with a fresh history. */
  loadDocument: (tree: FamilyTree, filePath: string | null, options?: { dirty?: boolean }) => void
  closeDocument: () => void
  markSaved: (filePath: string, tree?: FamilyTree) => void
  /** Applies a command as one undoable step. Throws `ModelError` if it is not allowed. */
  dispatch: <R>(command: Command<R>) => R
  undo: () => void
  redo: () => void
  select: (id: PersonId | null) => void
  rename: (name: string) => void
}

export const useDocument = create<DocumentState>((set, get) => ({
  tree: null,
  history: null,
  filePath: null,
  savedTree: null,
  selectedPersonId: null,
  documentId: 0,

  newDocument: (name) => get().loadDocument(createEmptyTree(name), null),

  loadDocument: (tree, filePath, options) => {
    applyViewMeta(tree)
    set({
      tree,
      history: createHistory(tree),
      filePath,
      savedTree: options?.dirty ? null : tree,
      selectedPersonId: null,
      documentId: get().documentId + 1
    })
  },

  closeDocument: () =>
    set({ tree: null, history: null, filePath: null, savedTree: null, selectedPersonId: null }),

  markSaved: (filePath, tree) => set({ filePath, savedTree: tree ?? get().tree }),

  dispatch: (command) => {
    const { history, selectedPersonId } = get()
    if (!history) throw new Error('No open document')
    const { tree, result, select } = command.run(history.present)
    const next = pushHistory(history, tree, {
      label: command.label,
      coalesceKey: command.coalesceKey
    })
    const selected = select !== undefined ? select : selectedPersonId
    set({
      history: next,
      tree: next.present,
      selectedPersonId: selected && next.present.persons[selected] ? selected : null
    })
    return result
  },

  undo: () => {
    const { history, selectedPersonId } = get()
    if (!history || !canUndo(history)) return
    const next = undoHistory(history)
    set({
      history: next,
      tree: next.present,
      selectedPersonId:
        selectedPersonId && next.present.persons[selectedPersonId] ? selectedPersonId : null
    })
  },

  redo: () => {
    const { history, selectedPersonId } = get()
    if (!history || !canRedo(history)) return
    const next = redoHistory(history)
    set({
      history: next,
      tree: next.present,
      selectedPersonId:
        selectedPersonId && next.present.persons[selectedPersonId] ? selectedPersonId : null
    })
  },

  select: (id) => set({ selectedPersonId: id }),

  rename: (name) => {
    const { tree, dispatch } = get()
    if (tree && name.trim() && name.trim() !== tree.meta.name)
      dispatch(renameTreeCommand(name.trim()))
  }
}))

export const selectIsDirty = (s: DocumentState): boolean =>
  s.tree !== null && s.tree !== s.savedTree
export const selectCanUndo = (s: DocumentState): boolean => !!s.history && canUndo(s.history)
export const selectCanRedo = (s: DocumentState): boolean => !!s.history && canRedo(s.history)
