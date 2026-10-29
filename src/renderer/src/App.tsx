import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ConfirmHost, Toaster } from './components/ui'
import { useApplyTheme } from './hooks/useApplyTheme'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useMenuIntegration } from './hooks/useMenuIntegration'
import { WelcomeScreen } from './features/welcome/WelcomeScreen'
import { Workspace } from './features/workspace/Workspace'
import { useDocument } from './store/document'

const Gallery = lazy(() =>
  import('./features/gallery/Gallery').then((m) => ({ default: m.Gallery }))
)

function useHash(): string {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const onChange = (): void => setHash(location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export function App(): React.JSX.Element {
  useApplyTheme()
  useGlobalShortcuts()
  const menuHandlers = useMemo(() => ({}), [])
  useMenuIntegration(menuHandlers)
  const hash = useHash()
  const hasDocument = useDocument((s) => s.tree !== null)
  return (
    <>
      {hash === '#gallery' ? (
        <Suspense fallback={null}>
          <Gallery />
        </Suspense>
      ) : hasDocument ? (
        <Workspace />
      ) : (
        <WelcomeScreen />
      )}
      <ConfirmHost />
      <Toaster />
    </>
  )
}
