import { useEffect } from 'react'
import { serializeTree } from '@core/file/format'
import { selectIsDirty, useDocument } from '@renderer/store/document'
import { useSettings } from '@renderer/store/settings'

export const AUTOSAVE_DELAY = 2000

let sessionId = ''
let sessionDoc = -1

/** Recovery snapshot id of the open document (changes whenever another document is opened). */
export function recoverySession(): string {
  const { documentId } = useDocument.getState()
  if (documentId !== sessionDoc) {
    sessionDoc = documentId
    sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
  return sessionId
}

/** Forgets the recovery snapshot of the open document (saved, discarded or closed cleanly). */
export async function clearRecovery(): Promise<void> {
  if (sessionId) await window.familyInsight.clearRecovery(sessionId)
}

/**
 * Keeps unsaved work safe: 2 s after the last change, documents with a file are saved
 * (if autosave is on) and every unsaved document gets a crash-recovery snapshot.
 */
export function useAutosave(): void {
  useEffect(() => {
    let timer: number | undefined
    let previousSession = ''
    const run = async (): Promise<void> => {
      const state = useDocument.getState()
      const { tree, filePath } = state
      if (!tree || !selectIsDirty(state)) return
      const id = recoverySession()
      const content = serializeTree(tree)
      if (filePath && useSettings.getState().settings.autosave) {
        const result = await window.familyInsight.writeFile(filePath, content)
        if (result.ok) {
          useDocument.getState().markSaved(result.path, tree)
          await window.familyInsight.clearRecovery(id)
          return
        }
      }
      await window.familyInsight.writeRecovery(id, filePath, tree.meta.name, content)
    }
    const unsubscribe = useDocument.subscribe((state, prev) => {
      if (state.documentId !== prev.documentId && previousSession) {
        // Another document was opened (the user already decided about the old one).
        void window.familyInsight.clearRecovery(previousSession)
      }
      if (state.tree === prev.tree && state.savedTree === prev.savedTree) return
      previousSession = recoverySession()
      window.clearTimeout(timer)
      if (!selectIsDirty(state)) {
        void window.familyInsight.clearRecovery(previousSession)
        return
      }
      timer = window.setTimeout(() => void run(), AUTOSAVE_DELAY)
    })
    return () => {
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [])
}
