import { Crosshair, Map as MapIcon, Maximize, Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { layoutFamily, type Layout } from '@core/layout/layout'
import { layoutOptions } from './TreeCanvas'
import { IconButton } from '@renderer/components/ui'
import { useDocument } from '@renderer/store/document'
import { useSettings } from '@renderer/store/settings'
import { centerViewport, fitViewport, useTreeView, zoomViewport } from '@renderer/store/treeView'
import styles from './CanvasControls.module.css'

/** Space above the tree for the Tapestry title cartouche (its bottom sits `TITLE_GAP` above). */
export const TITLE_GAP = 48
const TITLE_SPACE = 150

export function fitAll(layout: Layout | null): void {
  const { size, setViewport } = useTreeView.getState()
  if (!layout || !layout.nodes.length || !size.width) return
  const top = useSettings.getState().settings.style === 'tapestry' ? TITLE_SPACE : 0
  setViewport(
    fitViewport({ x: 0, y: -top, width: layout.width, height: layout.height + top }, size),
    true
  )
}

/** Fits the whole current layout (used by the native menu). */
export function fitCurrent(): void {
  const tree = useDocument.getState().tree
  const opts = layoutOptions()
  if (tree && opts) fitAll(layoutFamily(tree, opts))
}

export function zoomBy(factor: number): void {
  const { viewport, size, setViewport } = useTreeView.getState()
  setViewport(zoomViewport(viewport, factor, { x: size.width / 2, y: size.height / 2 }), true)
}

export function resetZoom(): void {
  zoomBy(1 / useTreeView.getState().viewport.k)
}

export function centerOnSelected(layout: Layout | null): void {
  const id = useDocument.getState().selectedPersonId
  const node = layout?.nodes.find((n) => n.id === id)
  const { viewport, size, setViewport } = useTreeView.getState()
  if (node)
    setViewport(
      centerViewport({ x: node.x + node.width / 2, y: node.y + node.height / 2 }, viewport, size),
      true
    )
}

export function CanvasControls({ layout }: { layout: Layout | null }): React.JSX.Element {
  const { t } = useTranslation()
  const k = useTreeView((s) => s.viewport.k)
  const hasSelection = useDocument((s) => s.selectedPersonId !== null)
  const showMinimap = useSettings((s) => s.settings.showMinimap)
  const update = useSettings((s) => s.update)

  return (
    <div
      className={styles.controls}
      data-tour="canvas-controls"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className={styles.group} role="toolbar" aria-label={t('tree.zoomControls')}>
        <IconButton
          icon={Minus}
          size="sm"
          label={t('tree.zoomOut')}
          shortcut="−"
          onClick={() => zoomBy(1 / 1.25)}
        />
        <button
          type="button"
          className={styles.zoom}
          title={t('tree.resetZoom')}
          onClick={resetZoom}
        >
          {Math.round(k * 100)}%
        </button>
        <IconButton
          icon={Plus}
          size="sm"
          label={t('tree.zoomIn')}
          shortcut="+"
          onClick={() => zoomBy(1.25)}
        />
      </div>
      <div className={styles.group}>
        <IconButton
          icon={Maximize}
          size="sm"
          label={t('tree.fit')}
          shortcut="F"
          onClick={() => fitAll(layout)}
        />
        <IconButton
          icon={Crosshair}
          size="sm"
          label={t('tree.centerSelected')}
          disabled={!hasSelection}
          onClick={() => centerOnSelected(layout)}
        />
        <IconButton
          icon={MapIcon}
          size="sm"
          label={t('tree.minimap')}
          aria-pressed={showMinimap}
          onClick={() => void update({ showMinimap: !showMinimap })}
        />
      </div>
    </div>
  )
}
