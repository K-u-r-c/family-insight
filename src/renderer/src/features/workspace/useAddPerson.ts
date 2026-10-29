import { useCallback, useEffect } from 'react'
import { addPersonCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'

/** Creates an empty person and opens the editor (toolbar button, Ctrl/Cmd+Shift+N). */
export function useAddPerson(): () => void {
  const dispatch = useDocument((s) => s.dispatch)
  const add = useCallback(() => {
    dispatch(addPersonCommand({ givenNames: '', surname: '', sex: 'unknown' }))
  }, [dispatch])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        add()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [add])
  return add
}
