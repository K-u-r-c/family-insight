import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Ornaments } from './Ornaments'
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
  // Unique, so a dialog opened from another one (e.g. a person picker) gets its own name.
  const titleId = useId()

  // Remember the trigger while open and give focus back to it when the dialog goes away.
  useEffect(() => {
    if (!open) return
    const trigger = document.activeElement as HTMLElement | null
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    if (initialFocus?.current) initialFocus.current.focus()
    else {
      // Prefer the first field or the primary action over the close button.
      const target =
        dialog?.querySelector<HTMLElement>('[data-autofocus], [autofocus]') ??
        dialog?.querySelector<HTMLElement>(
          '[data-dialog-body] :is(input, select, textarea, [role="radio"][aria-checked="true"], button)'
        ) ??
        dialog?.querySelector<HTMLElement>('[data-dialog-footer] button:last-child')
      target?.focus()
    }
    return () => {
      if (trigger?.isConnected) trigger.focus()
    }
  }, [open, initialFocus])

  if (!open) return null
  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, wide && styles.wide)}
      aria-labelledby={titleId}
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
      <Ornaments />
      <div className={styles.header}>
        {icon && (
          <div className={cx(styles.icon, tone === 'danger' ? styles.iconDanger : styles.iconInfo)}>
            <Icon icon={icon} size={20} />
          </div>
        )}
        <div className={styles.titles}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        <IconButton icon={X} label={t('common.close')} size="sm" onClick={onClose} />
      </div>
      {children && (
        <div className={styles.body} data-dialog-body>
          {children}
        </div>
      )}
      {footer && (
        <div className={styles.footer} data-dialog-footer>
          {footer}
        </div>
      )}
    </dialog>
  )
}
