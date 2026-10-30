import { FileParseError, parseTree, serializeTree } from '@core/file/format'
import { pushRecentFile, removeRecentFile } from '@core/settings'
import type { FamilyTree } from '@core/model/types'
import type { FileErrorCode, FileReadResult } from '@shared/ipc'
import { alertDialog, toast } from '@renderer/components/ui'
import i18n from '@renderer/i18n'
import { selectIsDirty, useDocument } from '@renderer/store/document'
import { useSettings } from '@renderer/store/settings'
import { addPersonCommand } from '@renderer/store/commands'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { clearRecovery } from './autosave'
import { treeForSave } from './viewMeta'

const api = (): typeof window.familyInsight => window.familyInsight
const t = (key: string, options?: Record<string, unknown>): string =>
  i18n.t(key as never, options as never) as unknown as string

async function rememberRecent(path: string, name: string): Promise<void> {
  const { settings, update } = useSettings.getState()
  await update({
    recentFiles: pushRecentFile(settings.recentFiles, {
      path,
      name,
      openedAt: new Date().toISOString()
    })
  })
}

async function forgetRecent(path: string): Promise<void> {
  const { settings, update } = useSettings.getState()
  await update({ recentFiles: removeRecentFile(settings.recentFiles, path) })
}

function showFileError(
  code: FileErrorCode | FileParseError['code'],
  saving = false
): Promise<void> {
  return alertDialog({
    title: t(saving ? 'files.error.saveTitle' : 'files.error.title'),
    message: t(`files.error.${code}`),
    danger: true
  })
}

/**
 * Asks to save unsaved changes. Resolves `true` when it is safe to discard the current
 * document (saved, discarded, or nothing to save) and `false` when the user cancelled.
 */
export async function guardUnsaved(): Promise<boolean> {
  const state = useDocument.getState()
  if (!selectIsDirty(state) || !state.tree) return true
  const choice = await api().askUnsaved(state.tree.meta.name)
  if (choice === 'cancel') return false
  if (choice === 'discard') {
    await clearRecovery()
    return true
  }
  return saveTree()
}

/** Starts a new tree: asks to save the current one, then asks for the new tree's name. */
export async function newTree(): Promise<void> {
  if (!(await guardUnsaved())) return
  useWorkspaceUi.getState().openDialog('new-tree')
}

/** Creates the tree and its first person, opening the editor straight away. */
export function createTree(name: string): void {
  const doc = useDocument.getState()
  doc.newDocument(name)
  const person = useDocument
    .getState()
    .dispatch(addPersonCommand({ givenNames: '', surname: '', sex: 'unknown' }))
  useWorkspaceUi.getState().setEditing(person.id)
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.getElementById('person-given-names')?.focus())
  )
}

/** Loads the result of reading a `.finsight` file into the editor. */
export async function loadTreeFile(result: FileReadResult): Promise<boolean> {
  if (!result.ok) {
    if (result.error === 'not-found' && result.path) await forgetRecent(result.path)
    await showFileError(result.error)
    return false
  }
  let tree: FamilyTree
  try {
    tree = parseTree(result.content)
  } catch (error) {
    await showFileError(error instanceof FileParseError ? error.code : 'invalid-data')
    return false
  }
  useDocument.getState().loadDocument(tree, result.path)
  await rememberRecent(result.path, tree.meta.name)
  return true
}

export async function openTree(): Promise<void> {
  if (!(await guardUnsaved())) return
  const result = await api().openFileDialog('finsight')
  if (result) await loadTreeFile(result)
}

export async function openTreeAt(path: string): Promise<void> {
  if (useDocument.getState().filePath === path) return
  if (!(await guardUnsaved())) return
  await loadTreeFile(await api().readFile(path))
}

async function writeTo(path: string): Promise<boolean> {
  const tree = useDocument.getState().tree
  if (!tree) return false
  const result = await api().writeFile(path, serializeTree(treeForSave(tree)), { backup: true })
  if (!result.ok) {
    await showFileError(result.error, true)
    return false
  }
  useDocument.getState().markSaved(result.path, tree)
  await rememberRecent(result.path, tree.meta.name)
  return true
}

export async function saveTreeAs(): Promise<boolean> {
  const tree = useDocument.getState().tree
  if (!tree) return false
  const path = await api().saveFileDialog('finsight', tree.meta.name)
  if (!path) return false
  const ok = await writeTo(path)
  if (ok) toast({ message: t('files.savedTo', { path }), tone: 'success' })
  return ok
}

export async function saveTree(): Promise<boolean> {
  const { filePath } = useDocument.getState()
  return filePath ? writeTo(filePath) : saveTreeAs()
}

/** Closes the open tree (asking to save first) and returns to the welcome screen. */
export async function closeTree(): Promise<void> {
  if (!useDocument.getState().tree || !(await guardUnsaved())) return
  await clearRecovery()
  useDocument.getState().closeDocument()
}

/** Main asked to close the window: save/discard/cancel, then let it close. */
export async function handleCloseRequest(): Promise<void> {
  if (await guardUnsaved()) {
    await clearRecovery()
    await api().closeWindow()
  }
}
