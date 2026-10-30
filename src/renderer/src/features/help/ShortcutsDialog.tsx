import { Keyboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SHORTCUT_GROUPS } from '@shared/shortcuts'
import { Dialog, Kbd } from '@renderer/components/ui'
import { formatShortcut } from '@renderer/lib/platform'
import styles from './ShortcutsDialog.module.css'

/** Cheat sheet of keyboard shortcuts (platform-aware: ⌘ on macOS, Ctrl elsewhere). */
export function ShortcutsDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <Dialog open wide onClose={onClose} icon={Keyboard} title={t('shortcuts.title')}>
      <div className={styles.grid}>
        {SHORTCUT_GROUPS.map((g) => (
          <section key={g.titleKey}>
            <h3 className={styles.title}>{t(g.titleKey as never)}</h3>
            <dl className={styles.list}>
              {g.items.map(({ keys, labelKey }) => (
                <div key={labelKey} className={styles.row}>
                  <dt className={styles.keys}>
                    {keys.map((key, i) => (
                      <span key={key}>
                        {i > 0 && <span className={styles.or}>/</span>}
                        <Kbd>{formatShortcut(key)}</Kbd>
                      </span>
                    ))}
                  </dt>
                  <dd className={styles.label}>{t(labelKey as never)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Dialog>
  )
}
