import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ChoiceHost, ConfirmHost, Toaster } from './components/ui'
import { useApplyTheme } from './hooks/useApplyTheme'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useFileIntegration } from './hooks/useFileIntegration'
import { useMenuIntegration } from './hooks/useMenuIntegration'
import { newTree, openTree, saveTree, saveTreeAs } from './services/documentFiles'
import { WelcomeScreen } from './features/welcome/WelcomeScreen'
import { Workspace } from './features/workspace/Workspace'
import { useDocument } from './store/document'
import { useWorkspaceUi } from './store/workspaceUi'
import { ExportCsvDialog } from './features/csv/ExportCsvDialog'
import { ImportCsvDialog } from './features/csv/ImportCsvDialog'
import { startCsvImport } from './features/csv/importFlow'

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
  useFileIntegration()
  const menuHandlers = useMemo(
    () => ({
      'file:new': () => void newTree(),
      'file:open': () => void openTree(),
      'file:save': () => void saveTree(),
      'file:save-as': () => void saveTreeAs(),
      'file:import-csv': () => void startCsvImport(),
      'file:export-csv': () => {
        if (useDocument.getState().tree) useWorkspaceUi.getState().openDialog('export-csv')
      }
    }),
    []
  )
  useMenuIntegration(menuHandlers)
  const hash = useHash()
  const hasDocument = useDocument((s) => s.tree !== null)
  const dialog = useWorkspaceUi((s) => s.dialog)
  const openDialog = useWorkspaceUi((s) => s.openDialog)
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
      {dialog === 'export-csv' && hasDocument && (
        <ExportCsvDialog open onClose={() => openDialog(null)} />
      )}
      {dialog === 'import-csv' && <ImportCsvDialog onClose={() => openDialog(null)} />}
      <ConfirmHost />
      <ChoiceHost />
      <Toaster />
    </>
  )
}
