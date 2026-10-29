import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Tooltip.module.css'

interface TooltipProps {
  content: ReactNode
  shortcut?: string
  placement?: 'top' | 'bottom'
  children: ReactNode
}

const DELAY = 450

/**
 * Small hover/keyboard-focus tooltip rendered in a portal. It is a visual aid only:
 * the wrapped control must carry its own accessible name.
 */
export function Tooltip({
  content,
  shortcut,
  placement = 'bottom',
  children
}: TooltipProps): React.JSX.Element {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = (wrapper: HTMLElement): void => {
    window.clearTimeout(timer.current)
    const target = (wrapper.firstElementChild as HTMLElement | null) ?? wrapper
    timer.current = window.setTimeout(() => {
      const r = target.getBoundingClientRect()
      const x = Math.min(Math.max(r.left + r.width / 2, 72), window.innerWidth - 72)
      setPos({ x, y: placement === 'top' ? r.top - 6 : r.bottom + 6 })
    }, DELAY)
  }
  const hide = (): void => {
    window.clearTimeout(timer.current)
    setPos(null)
  }

  return (
    <span
      className={styles.anchor}
      onMouseEnter={(e) => show(e.currentTarget)}
      onMouseLeave={hide}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches(':focus-visible')) show(e.currentTarget)
      }}
      onBlur={hide}
      onMouseDown={hide}
      onKeyDown={hide}
    >
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            className={styles.tooltip}
            style={{
              left: pos.x,
              top: pos.y,
              transform: `translate(-50%, ${placement === 'top' ? '-100%' : '0'})`
            }}
          >
            {content}
            {shortcut && <span className={styles.shortcut}>{shortcut}</span>}
          </div>,
          document.body
        )}
    </span>
  )
}
