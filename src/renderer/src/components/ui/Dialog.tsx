import { useEffect, useRef, type ReactNode } from 'react'
import { X, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cx } from '@renderer/lib/cx'
import { IconButton } from './Button'
import { Icon } from './Icon'
import styles from './Dialog.module.css'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  tone?: 'info' | 'danger'
  footer?: ReactNode
  wide?: boolean
  children?: ReactNode
  /** Element to focus on open (defaults to the first focusable element). */
  initialFocus?: React.RefObject<HTMLElement | null>
}

/**
 * Modal dialog built on the native `<dialog>` element: focus is trapped, the page behind is
 * inert, Esc closes it and focus returns to the trigger.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  tone = 'info',
  footer,
  wide,
  children,
  initialFocus
}: DialogProps): React.JSX.Element | null {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)

  // Remember the trigger while open and give focus back to it when the dialog goes away.
  useEffect(() => {
    if (!open) return
    const trigger = document.activeElement as HTMLElement | null
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    initialFocus?.current?.focus()
    return () => {
      if (trigger?.isConnected) trigger.focus()
    }
  }, [open, initialFocus])

  if (!open) return null
  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, wide && styles.wide)}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className={styles.header}>
        {icon && (
          <div className={cx(styles.icon, tone === 'danger' ? styles.iconDanger : styles.iconInfo)}>
            <Icon icon={icon} size={20} />
          </div>
        )}
        <div className={styles.titles}>
          <h2 id="dialog-title" className={styles.title}>
            {title}
          </h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        <IconButton icon={X} label={t('common.close')} size="sm" onClick={onClose} />
      </div>
      {children && <div className={styles.body}>{children}</div>}
      {footer && <div className={styles.footer}>{footer}</div>}
    </dialog>
  )
}
