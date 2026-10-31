import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ChoiceHost, ConfirmHost, Toaster } from './components/ui'
import { useApplyTheme } from './hooks/useApplyTheme'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useFileIntegration } from './hooks/useFileIntegration'
import { useMenuIntegration } from './hooks/useMenuIntegration'
import {
  closeTree,
  createTree,
  newTree,
  openTree,
  saveTree,
  saveTreeAs
} from './services/documentFiles'
import { WelcomeScreen } from './features/welcome/WelcomeScreen'
import { Workspace } from './features/workspace/Workspace'
import { useDocument } from './store/document'
import { useWorkspaceUi } from './store/workspaceUi'
import { ExportCsvDialog } from './features/csv/ExportCsvDialog'
import { ImportCsvDialog } from './features/csv/ImportCsvDialog'
import { NewTreeDialog } from './features/welcome/NewTreeDialog'
import { ExportImageDialog } from './features/export/ExportImageDialog'
import { StatsDialog } from './features/stats/StatsDialog'
import { RelationshipDialog } from './features/kinship/RelationshipDialog'
import { ShortcutsDialog } from './features/help/ShortcutsDialog'
import { AboutDialog } from './features/help/AboutDialog'
import { deletePersonWithConfirm } from './features/person/deletePerson'
import { fitCurrent, resetZoom, zoomBy } from './features/tree/CanvasControls'
import { addPersonAndEdit } from './features/workspace/useAddPerson'
import { useSettings } from './store/settings'
import { useTreeView } from './store/treeView'
import { printTree } from './features/export/exportImage'
import { MediaDetailsDialog } from './features/media/MediaDetailsDialog'
import { MediaViewer } from './features/media/MediaViewer'
import { CitationsDialog } from './features/sources/CitationsDialog'
import { PlacesDialog } from './features/places/PlacesDialog'
import { UpdateNotice } from './features/updates/UpdateNotice'
import { checkForUpdatesManually, initUpdates } from './features/updates/updates'
import { SourcesDialog } from './features/sources/SourcesDialog'
import { RecoveryDialog } from './features/welcome/RecoveryDialog'
import { useAutosave } from './services/autosave'
import { startCsvImport } from './features/csv/importFlow'
import { ExportGedcomDialog } from './features/gedcom/ExportGedcomDialog'
import { ImportGedcomDialog } from './features/gedcom/ImportGedcomDialog'
import { startGedcomImport } from './features/gedcom/importFlow'
import { openCsvFormatDocs, saveCsvTemplate } from './features/csv/csvHelp'
import { TourOverlay } from './features/tour/TourOverlay'
import { useTour } from './features/tour/tourStore'
import { FIRST_RUN } from './features/tour/tours'
import { useStyleHint } from './features/hints/useStyleHint'

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
  useStyleHint()
  useEffect(() => initUpdates(), [])
  useGlobalShortcuts()
  useFileIntegration()
  useAutosave()
  const menuHandlers = useMemo(
    () => ({
      'file:new': () => void newTree(),
      'file:open': () => void openTree(),
      'file:save': () => void saveTree(),
      'file:save-as': () => void saveTreeAs(),
      'file:import-csv': () => void startCsvImport(),
      'file:import-gedcom': () => void startGedcomImport(),
      'file:export-gedcom': () => {
        if (useDocument.getState().tree) useWorkspaceUi.getState().openDialog('export-gedcom')
      },
      'file:export-image': () => {
        if (useDocument.getState().tree) useWorkspaceUi.getState().openDialog('export-image')
      },
      'file:print': () => {
        if (useDocument.getState().tree) void printTree()
      },
      'help:csv-format': openCsvFormatDocs,
      'help:check-updates': () => void checkForUpdatesManually(),
      'help:shortcuts': () => useWorkspaceUi.getState().openDialog('shortcuts'),
      'help:about': () => useWorkspaceUi.getState().openDialog('about'),
      'help:tour': () => useTour.getState().start(FIRST_RUN),
      'file:close': () => void closeTree(),
      'edit:add-person': () => addPersonAndEdit(),
      'edit:delete': () => {
        const id = useDocument.getState().selectedPersonId
        if (id) void deletePersonWithConfirm(id)
      },
      'edit:sources': () => {
        if (useDocument.getState().tree) useWorkspaceUi.getState().openSources()
      },
      'edit:places': () => {
        if (useDocument.getState().tree) useWorkspaceUi.getState().openPlaces()
      },
      'edit:find': () => {
        const search = document.getElementById('workspace-search') as HTMLInputElement | null
        search?.focus()
        search?.select()
      },
      'view:toggle-map': () => {
        const ui = useWorkspaceUi.getState()
        if (useDocument.getState().tree) ui.setView(ui.view === 'map' ? 'tree' : 'map')
      },
      'view:mode-family': () => useTreeView.getState().setMode('family'),
      'view:mode-ancestors': () => useTreeView.getState().setMode('ancestors'),
      'view:mode-descendants': () => useTreeView.getState().setMode('descendants'),
      'view:mode-hourglass': () => useTreeView.getState().setMode('hourglass'),
      'view:fit': () => fitCurrent(),
      'view:zoom-in': () => zoomBy(1.25),
      'view:zoom-out': () => zoomBy(1 / 1.25),
      'view:zoom-reset': () => resetZoom(),
      'view:toggle-sidebar': () => {
        const { settings, update } = useSettings.getState()
        void update({ panels: { ...settings.panels, sidebarOpen: !settings.panels.sidebarOpen } })
      },
      'view:statistics': () => {
        if (useDocument.getState().tree) useWorkspaceUi.getState().openDialog('stats')
      },
      'view:relationship': () => {
        const { tree, selectedPersonId } = useDocument.getState()
        if (tree)
          useWorkspaceUi.getState().openRelationship(tree.meta.rootPersonId, selectedPersonId)
      },
      'help:csv-template': () => void saveCsvTemplate(),
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
  const citing = useWorkspaceUi((s) => s.citing)
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
      {dialog === 'import-gedcom' && <ImportGedcomDialog onClose={() => openDialog(null)} />}
      {dialog === 'export-gedcom' && hasDocument && (
        <ExportGedcomDialog onClose={() => openDialog(null)} />
      )}
      {dialog === 'export-image' && hasDocument && (
        <ExportImageDialog onClose={() => openDialog(null)} />
      )}
      {dialog === 'stats' && hasDocument && <StatsDialog onClose={() => openDialog(null)} />}
      {dialog === 'relationship' && hasDocument && (
        <RelationshipDialog onClose={() => openDialog(null)} />
      )}
      {dialog === 'shortcuts' && <ShortcutsDialog onClose={() => openDialog(null)} />}
      {dialog === 'about' && <AboutDialog onClose={() => openDialog(null)} />}
      {dialog === 'sources' && hasDocument && <SourcesDialog onClose={() => openDialog(null)} />}
      {dialog === 'places' && hasDocument && <PlacesDialog onClose={() => openDialog(null)} />}
      {citing && hasDocument && (
        <CitationsDialog
          target={citing}
          onClose={() => useWorkspaceUi.getState().setCiting(null)}
        />
      )}
      <TourOverlay />
      {hasDocument && <MediaViewer />}
      {hasDocument && <MediaDetailsDialog />}
      {dialog === 'new-tree' && (
        <NewTreeDialog
          onClose={() => openDialog(null)}
          onCreate={(name) => {
            openDialog(null)
            createTree(name)
          }}
        />
      )}
      <RecoveryDialog />
      <ConfirmHost />
      <ChoiceHost />
      <UpdateNotice />
      <Toaster />
    </>
  )
}
