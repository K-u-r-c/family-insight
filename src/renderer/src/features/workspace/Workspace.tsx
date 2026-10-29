import { useState } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ResizeHandle } from '@renderer/components/ResizeHandle'
import { IconButton } from '@renderer/components/ui'
import { PeopleSidebar } from '@renderer/features/people/PeopleSidebar'
import { TreeCanvas } from '@renderer/features/tree/TreeCanvas'
import { useWindowWidth } from '@renderer/hooks/useWindowWidth'
import { cx } from '@renderer/lib/cx'
import { selectCanRedo, selectCanUndo, useDocument } from '@renderer/store/document'
import { useSettings } from '@renderer/store/settings'
import { Panel } from './Panel'
import { StatusBar } from './StatusBar'
import { Toolbar } from './Toolbar'
import { useWindowTitle } from './useWindowTitle'
import styles from './Workspace.module.css'

const NARROW = 1100

export function Workspace(): React.JSX.Element {
  const { t } = useTranslation()
  useWindowTitle()
  const width = useWindowWidth()
  const panels = useSettings((s) => s.settings.panels)
  const updateSettings = useSettings((s) => s.update)
  const selectedId = useDocument((s) => s.selectedPersonId)
  const select = useDocument((s) => s.select)
  const canUndo = useDocument(selectCanUndo)
  const canRedo = useDocument(selectCanRedo)
  const undo = useDocument((s) => s.undo)
  const redo = useDocument((s) => s.redo)

  const [sidebarWidth, setSidebarWidth] = useState(panels.sidebarWidth)
  const [detailsWidth, setDetailsWidth] = useState(panels.detailsWidth)
  const narrow = width < NARROW
  const sidebarOpen = panels.sidebarOpen
  const savePanels = (patch: Partial<typeof panels>): void =>
    void updateSettings({ panels: { ...panels, ...patch } })

  const addPerson = (): void => {
    // Wired up by the person editor issue.
  }

  return (
    <div className={styles.root}>
      <Toolbar
        onAddPerson={addPerson}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      <div className={styles.body}>
        {sidebarOpen && (
          <>
            <aside className={styles.sidebar} style={{ width: sidebarWidth }}>
              <PeopleSidebar onCollapse={() => savePanels({ sidebarOpen: false })} />
            </aside>
            <ResizeHandle
              side="left"
              label={t('workspace.resizeSidebar')}
              value={sidebarWidth}
              min={200}
              max={480}
              onChange={setSidebarWidth}
              onCommit={(v) => savePanels({ sidebarWidth: v })}
            />
          </>
        )}
        <main className={styles.main}>
          <TreeCanvas onAddPerson={addPerson} />
          {!sidebarOpen && (
            <div className={styles.floatingTopLeft}>
              <IconButton
                icon={PanelLeftOpen}
                variant="secondary"
                label={t('workspace.showSidebar')}
                onClick={() => savePanels({ sidebarOpen: true })}
              />
            </div>
          )}
        </main>
        {selectedId && (
          <>
            {!narrow && (
              <ResizeHandle
                side="right"
                label={t('workspace.resizeDetails')}
                value={detailsWidth}
                min={320}
                max={640}
                onChange={setDetailsWidth}
                onCommit={(v) => savePanels({ detailsWidth: v })}
              />
            )}
            <aside
              className={cx(styles.details, narrow && styles.overlay)}
              style={{ width: narrow ? Math.min(detailsWidth, 380) : detailsWidth }}
            >
              <Panel title={t('person.details')} onClose={() => select(null)}>
                {null}
              </Panel>
            </aside>
          </>
        )}
      </div>
      <StatusBar />
    </div>
  )
}
