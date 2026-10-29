import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@renderer/components/ui'
import styles from './Panel.module.css'

interface PanelProps {
  title: ReactNode
  actions?: ReactNode
  onClose?: () => void
  children: ReactNode
  label?: string
}

/** Side panel chrome: header with title/actions and a scrollable body. */
export function Panel({ title, actions, onClose, children, label }: PanelProps): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <section className={styles.panel} aria-label={label}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {actions}
        {onClose && <IconButton icon={X} label={t('common.close')} size="sm" onClick={onClose} />}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
