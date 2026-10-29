import { useRef } from 'react'
import styles from './ResizeHandle.module.css'

interface ResizeHandleProps {
  /** Current size of the panel in px. */
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  /** Called when dragging ends (persist here). */
  onCommit?: (value: number) => void
  /** `left`: the panel is left of the handle (dragging right grows it). */
  side: 'left' | 'right'
  label: string
}

/** Accessible splitter: drag with the pointer or use arrow keys. */
export function ResizeHandle({
  value,
  min,
  max,
  onChange,
  onCommit,
  side,
  label
}: ResizeHandleProps): React.JSX.Element {
  const start = useRef<{ x: number; value: number } | null>(null)
  const clamp = (v: number): number => Math.round(Math.min(max, Math.max(min, v)))
  const dir = side === 'left' ? 1 : -1

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      className={styles.handle}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        start.current = { x: e.clientX, value }
      }}
      onPointerMove={(e) => {
        if (!start.current) return
        onChange(clamp(start.current.value + dir * (e.clientX - start.current.x)))
      }}
      onPointerUp={(e) => {
        if (!start.current) return
        const next = clamp(start.current.value + dir * (e.clientX - start.current.x))
        start.current = null
        onCommit?.(next)
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 48 : 16
        let next: number | null = null
        if (e.key === 'ArrowLeft') next = clamp(value - dir * step)
        if (e.key === 'ArrowRight') next = clamp(value + dir * step)
        if (next === null) return
        e.preventDefault()
        onChange(next)
        onCommit?.(next)
      }}
    />
  )
}
