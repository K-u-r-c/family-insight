import { useEffect } from 'react'
import type { MenuAction } from '@shared/ipc'
import { selectCanRedo, selectCanUndo, useDocument } from '@renderer/store/document'
import { useTreeView } from '@renderer/store/treeView'

export function isTextInput(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName
  if (tag === 'TEXTAREA') return true
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type
    return ['text', 'search', 'email', 'url', 'tel', 'number', 'password'].includes(type)
  }
  return (el as HTMLElement).isContentEditable
}

type Handlers = Partial<Record<MenuAction, () => void>>

/**
 * Keeps native menu items in sync with the document and routes menu actions to handlers.
 * Undo/redo inside a text field act on the text, not on the document.
 */
export function useMenuIntegration(handlers: Handlers): void {
  const hasDocument = useDocument((s) => s.tree !== null)
  const canUndo = useDocument(selectCanUndo)
  const canRedo = useDocument(selectCanRedo)
  const hasSelection = useDocument((s) => s.selectedPersonId !== null)
  const viewMode = useTreeView((s) => s.mode)

  useEffect(() => {
    void window.familyInsight.setMenuState({
      hasDocument,
      canUndo,
      canRedo,
      hasSelection,
      viewMode
    })
  }, [hasDocument, canUndo, canRedo, hasSelection, viewMode])

  useEffect(
    () =>
      window.familyInsight.onMenuAction((action) => {
        if (action === 'edit:undo' || action === 'edit:redo') {
          if (isTextInput(document.activeElement)) {
            document.execCommand(action === 'edit:undo' ? 'undo' : 'redo')
            return
          }
          const doc = useDocument.getState()
          if (action === 'edit:undo') doc.undo()
          else doc.redo()
          return
        }
        handlers[action]?.()
      }),
    [handlers]
  )
}
