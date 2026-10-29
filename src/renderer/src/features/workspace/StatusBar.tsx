import { CheckCircle2, CircleDot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@renderer/components/ui'
import { selectIsDirty, useDocument } from '@renderer/store/document'
import styles from './StatusBar.module.css'

export function StatusBar(): React.JSX.Element {
  const { t } = useTranslation()
  const count = useDocument((s) => (s.tree ? Object.keys(s.tree.persons).length : 0))
  const dirty = useDocument(selectIsDirty)
  const filePath = useDocument((s) => s.filePath)

  return (
    <footer className={styles.bar}>
      <span>{t('people.count', { count })}</span>
      <span className={styles.spacer} />
      {filePath && (
        <span className={styles.path} title={filePath}>
          <bdi>{filePath}</bdi>
        </span>
      )}
      <span className={dirty ? styles.unsaved : styles.saved} role="status">
        <Icon icon={dirty ? CircleDot : CheckCircle2} size={13} />
        {dirty ? t('workspace.unsaved') : t('workspace.saved')}
      </span>
    </footer>
  )
}
