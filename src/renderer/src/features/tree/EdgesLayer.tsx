import { memo } from 'react'
import type { LayoutEdge, Point } from '@core/layout/layout'
import { cx } from '@renderer/lib/cx'
import styles from './TreeCanvas.module.css'

/** Orthogonal polyline with rounded corners as an SVG path. */
export function roundedPath(points: Point[], radius = 10): string {
  if (points.length < 2) return ''
  let d = `M${points[0]!.x},${points[0]!.y}`
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!
    const cur = points[i]!
    const next = points[i + 1]!
    const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y)
    const outLen = Math.hypot(next.x - cur.x, next.y - cur.y)
    const r = Math.min(radius, inLen / 2, outLen / 2)
    if (r < 0.5) {
      d += ` L${cur.x},${cur.y}`
      continue
    }
    const a = {
      x: cur.x - ((cur.x - prev.x) / inLen) * r,
      y: cur.y - ((cur.y - prev.y) / inLen) * r
    }
    const b = {
      x: cur.x + ((next.x - cur.x) / outLen) * r,
      y: cur.y + ((next.y - cur.y) / outLen) * r
    }
    d += ` L${a.x},${a.y} Q${cur.x},${cur.y} ${b.x},${b.y}`
  }
  const last = points[points.length - 1]!
  return `${d} L${last.x},${last.y}`
}

const isActive = (e: LayoutEdge, highlight: string | null): boolean =>
  highlight !== null && e.people.includes(highlight)
const isOnPath = (e: LayoutEdge, path: ReadonlySet<string> | null): boolean =>
  path !== null && e.relationshipIds.some((id) => path.has(id))

interface EdgesLayerProps {
  edges: LayoutEdge[]
  bounds: { minX: number; minY: number; width: number; height: number }
  /** Selected (or hovered) person: their lines stand out and the others step back. */
  highlight: string | null
  dimmed: boolean
  /** Relationships of the highlighted path: their lines stand out, the others fade. */
  path: ReadonlySet<string> | null
}

export const EdgesLayer = memo(function EdgesLayer({
  edges,
  bounds,
  highlight,
  dimmed,
  path
}: EdgesLayerProps): React.JSX.Element {
  return (
    <svg
      className={cx(styles.edges, dimmed && !path && styles.edgesDimmed)}
      style={{ left: bounds.minX, top: bounds.minY }}
      width={bounds.width}
      height={bounds.height}
      viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
      aria-hidden="true"
    >
      {/* Edges touching the selected person (or on the path) are drawn last, on top. */}
      {[...edges]
        .sort(
          (a, b) =>
            Number(isOnPath(a, path)) * 2 +
            Number(isActive(a, highlight)) -
            Number(isOnPath(b, path)) * 2 -
            Number(isActive(b, highlight))
        )
        .map((e) => {
          const onPath = isOnPath(e, path)
          const active = !path && isActive(e, highlight)
          return (
            <path
              key={e.id}
              d={roundedPath(e.points)}
              data-people={e.people.join(' ')}
              data-active={active || undefined}
              className={cx(
                styles.edge,
                e.type === 'partner' && styles.partnerEdge,
                (e.kind && e.kind !== 'biological') || e.ended ? styles.dashed : undefined,
                active && styles.activeEdge,
                !path && highlight !== null && !active && styles.quietEdge,
                onPath && styles.pathEdge,
                path && !onPath && styles.offPathEdge
              )}
            />
          )
        })}
    </svg>
  )
})
