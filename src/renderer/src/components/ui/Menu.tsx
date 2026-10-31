import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, type LucideIcon } from 'lucide-react'
import { cx } from '@renderer/lib/cx'
import { Icon } from './Icon'
import styles from './Menu.module.css'

export type MenuEntry =
  | {
      type?: 'item'
      label: string
      icon?: LucideIcon
      shortcut?: string
      danger?: boolean
      disabled?: boolean
      /** Renders a check mark slot; `true` shows it. */
      checked?: boolean
      onSelect: () => void
    }
  | { type: 'separator' }
  | { type: 'heading'; label: string }

export interface MenuAnchor {
  x: number
  y: number
  /** Align the menu's right edge to `x` instead of its left edge. */
  alignRight?: boolean
}

interface MenuProps {
  anchor: MenuAnchor | null
  entries: MenuEntry[]
  onClose: () => void
  label?: string
}

/** Popover menu (dropdowns and context menus) with full keyboard support. */
export function Menu({ anchor, entries, onClose, label }: MenuProps): React.JSX.Element | null {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number; maxHeight?: number } | null>(null)

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return
    const { width, height } = ref.current.getBoundingClientRect()
    let left = anchor.alignRight ? anchor.x - width : anchor.x
    let top = anchor.y
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
    let maxHeight: number | undefined
    if (top + height > window.innerHeight - 8) {
      // Open upwards if it fits there; otherwise as high as possible, scrolling when even the
      // whole window is too short (a long settings menu in a small window).
      top = Math.max(8, anchor.y - height)
      if (top + height > window.innerHeight - 8) maxHeight = window.innerHeight - 8 - top
    }
    setPos({ left, top, maxHeight })
    ref.current.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
  }, [anchor])

  useEffect(() => {
    if (!anchor) return
    const trigger = document.activeElement as HTMLElement | null
    const onDown = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onBlur = (): void => onClose()
    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('blur', onBlur)
    window.addEventListener('resize', onBlur)
    return () => {
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('resize', onBlur)
      if (trigger?.isConnected) trigger.focus()
    }
  }, [anchor, onClose])

  if (!anchor) return null

  const onKeyDown = (e: React.KeyboardEvent): void => {
    const items = [
      ...(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
    ]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    const focus = (i: number): void => items[(i + items.length) % items.length]?.focus()
    if (e.key === 'ArrowDown') focus(index + 1)
    else if (e.key === 'ArrowUp') focus(index - 1)
    else if (e.key === 'Home') focus(0)
    else if (e.key === 'End') focus(items.length - 1)
    else if (e.key === 'Escape' || e.key === 'Tab') onClose()
    else return
    e.preventDefault()
    e.stopPropagation()
  }

  const hasChecks = entries.some(
    (e) => (e.type ?? 'item') === 'item' && 'checked' in e && e.checked !== undefined
  )

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      className={styles.menu}
      style={pos ?? { left: anchor.x, top: anchor.y, visibility: 'hidden' }}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      // Portal events still bubble through the React tree; keep them away from e.g. the canvas.
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {entries.map((entry, i) => {
        if (entry.type === 'separator')
          return <div key={i} className={styles.separator} role="separator" />
        if (entry.type === 'heading')
          return (
            <div key={i} className={styles.heading} role="presentation">
              {entry.label}
            </div>
          )
        return (
          <button
            key={i}
            type="button"
            role={entry.checked !== undefined ? 'menuitemradio' : 'menuitem'}
            aria-checked={entry.checked}
            disabled={entry.disabled}
            className={cx(styles.item, entry.danger && styles.danger)}
            onClick={() => {
              onClose()
              entry.onSelect()
            }}
          >
            {hasChecks && <Icon icon={Check} size={14} className={styles.check} />}
            {entry.icon && <Icon icon={entry.icon} size={15} className={styles.icon} />}
            <span className={styles.label}>{entry.label}</span>
            {entry.shortcut && <span className={styles.shortcut}>{entry.shortcut}</span>}
          </button>
        )
      })}
    </div>,
    document.body
  )
}

/** Opens a menu anchored below a trigger element. */
export function anchorBelow(el: HTMLElement, alignRight = false): MenuAnchor {
  const r = el.getBoundingClientRect()
  return { x: alignRight ? r.right : r.left, y: r.bottom + 6, alignRight }
}
