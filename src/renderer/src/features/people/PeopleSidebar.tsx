import { PanelLeftClose } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@renderer/components/ui'
import { Panel } from '@renderer/features/workspace/Panel'
import { useDocument } from '@renderer/store/document'
import styles from './PeopleSidebar.module.css'

export function PeopleSidebar({ onCollapse }: { onCollapse: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const count = useDocument((s) => (s.tree ? Object.keys(s.tree.persons).length : 0))
  return (
    <Panel
      label={t('people.title')}
      title={`${t('people.title')} · ${count}`}
      actions={
        <IconButton
          icon={PanelLeftClose}
          label={t('workspace.hideSidebar')}
          size="sm"
          onClick={onCollapse}
        />
      }
    >
      {count === 0 && <p className={styles.empty}>{t('people.empty')}</p>}
    </Panel>
  )
}
