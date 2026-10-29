import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Layout } from '@core/layout/layout'
import { cx } from '@renderer/lib/cx'
import { useDocument } from '@renderer/store/document'
import { centerViewport, useTreeView } from '@renderer/store/treeView'
import styles from './CanvasControls.module.css'

const MAX_W = 200
const MAX_H = 130
const PAD = 8

/** Overview of the whole tree with the visible area; click or drag to move there. */
export function Minimap({ layout }: { layout: Layout }): React.JSX.Element | null {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)
  const selectedId = useDocument((s) => s.selectedPersonId)
  const viewport = useTreeView((s) => s.viewport)
  const size = useTreeView((s) => s.size)
  const dragging = useRef(false)
  if (!tree || !layout.nodes.length || !size.width) return null

  const scale = Math.min((MAX_W - PAD * 2) / layout.width, (MAX_H - PAD * 2) / layout.height)
  const width = Math.round(layout.width * scale + PAD * 2)
  const height = Math.round(layout.height * scale + PAD * 2)
  const view = {
    x: (-viewport.x / viewport.k) * scale + PAD,
    y: (-viewport.y / viewport.k) * scale + PAD,
    width: (size.width / viewport.k) * scale,
    height: (size.height / viewport.k) * scale
  }

  const moveTo = (e: React.PointerEvent<SVGSVGElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    const world = {
      x: (e.clientX - rect.left - PAD) / scale,
      y: (e.clientY - rect.top - PAD) / scale
    }
    const { viewport: vp, size: sz, setViewport } = useTreeView.getState()
    setViewport(centerViewport(world, vp, sz), !dragging.current)
  }

  return (
    <svg
      className={styles.minimap}
      width={width}
      height={height}
      role="img"
      aria-label={t('tree.minimap')}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        dragging.current = false
        moveTo(e)
        dragging.current = true
      }}
      onPointerMove={(e) => {
        if (dragging.current && e.buttons) moveTo(e)
      }}
      onPointerUp={() => (dragging.current = false)}
    >
      {layout.nodes.map((n) => {
        const sex = tree.persons[n.id]?.sex
        return (
          <rect
            key={n.id}
            x={n.x * scale + PAD}
            y={n.y * scale + PAD}
            width={Math.max(n.width * scale, 2)}
            height={Math.max(n.height * scale, 2)}
            rx={1.5}
            className={cx(
              styles.miniNode,
              sex === 'female' && styles.miniFemale,
              sex === 'male' && styles.miniMale,
              n.id === selectedId && styles.miniSelected
            )}
          />
        )
      })}
      <rect {...view} rx={3} className={styles.miniViewport} />
    </svg>
  )
}
