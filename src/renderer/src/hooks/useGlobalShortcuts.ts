import { useEffect } from 'react'

/** App-wide keyboard shortcuts that are not native menu accelerators. */
export function useGlobalShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const mod = e.ctrlKey || e.metaKey
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
