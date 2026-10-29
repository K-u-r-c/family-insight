import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { create } from 'zustand'
import { cx } from '@renderer/lib/cx'
import { Icon } from './Icon'
import styles from './Toast.module.css'

export interface ToastOptions {
  message: string
  tone?: 'info' | 'success' | 'error'
  action?: { label: string; onClick: () => void }
  /** Milliseconds; 0 keeps it until dismissed. */
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: number
}

interface ToastState {
  toasts: ToastItem[]
}

const useToastStore = create<ToastState>(() => ({ toasts: [] }))
let counter = 0

export function dismissToast(id: number): void {
  useToastStore.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}

/** Shows a transient notification; returns its id. At most 3 are visible. */
export function toast(options: ToastOptions): number {
  const id = ++counter
  useToastStore.setState((s) => ({ toasts: [...s.toasts.slice(-2), { ...options, id }] }))
  const duration = options.duration ?? (options.action ? 6000 : 3500)
  if (duration > 0) window.setTimeout(() => dismissToast(id), duration)
  return id
}

const ICONS = { info: Info, success: CheckCircle2, error: XCircle }

export function Toaster(): React.JSX.Element {
  const { t } = useTranslation()
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div
      className={styles.region}
      role="region"
      aria-live="polite"
      aria-label={t('common.notifications')}
    >
      {toasts.map((item) => {
        const tone = item.tone ?? 'info'
        return (
          <div key={item.id} className={cx(styles.toast, styles[tone])} role="status">
            <Icon icon={ICONS[tone]} className={styles.icon} size={18} />
            <span className={styles.message}>{item.message}</span>
            {item.action && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  item.action!.onClick()
                  dismissToast(item.id)
                }}
              >
                {item.action.label}
              </button>
            )}
            <button
              type="button"
              className={styles.close}
              aria-label={t('common.dismiss')}
              onClick={() => dismissToast(item.id)}
            >
              <Icon icon={X} size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
