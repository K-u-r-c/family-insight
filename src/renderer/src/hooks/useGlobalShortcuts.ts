import { useEffect } from 'react'
import { deletePersonWithConfirm } from '@renderer/features/person/deletePerson'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { isTextInput } from './useMenuIntegration'

/** True while a modal dialog or menu has focus (shortcuts must not fire then). */
function overlayOpen(): boolean {
  return !!document.querySelector('dialog[open], [role="menu"]')
}

/** App-wide keyboard shortcuts that are not native menu accelerators. */
export function useGlobalShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const mod = e.ctrlKey || e.metaKey
      if (
        (e.key === 'F1' || (e.key === '?' && !mod)) &&
        !isTextInput(document.activeElement) &&
        !overlayOpen()
      ) {
        e.preventDefault()
        useWorkspaceUi.getState().openDialog('shortcuts')
        return
      }
      const selected = useDocument.getState().selectedPersonId
      if (
        (e.key === 'Delete' || (e.key === 'Backspace' && e.metaKey)) &&
        selected &&
        !isTextInput(document.activeElement) &&
        !overlayOpen()
      ) {
        e.preventDefault()
        void deletePersonWithConfirm(selected)
        return
      }
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'f') {
        const search = document.getElementById('workspace-search') as HTMLInputElement | null
        if (search) {
          e.preventDefault()
          search.focus()
          search.select()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
