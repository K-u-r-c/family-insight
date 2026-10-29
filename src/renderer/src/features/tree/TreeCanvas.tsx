import { Sprout, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState } from '@renderer/components/ui'
import { useDocument } from '@renderer/store/document'
import styles from './TreeCanvas.module.css'

export function TreeCanvas({ onAddPerson }: { onAddPerson: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const count = useDocument((s) => (s.tree ? Object.keys(s.tree.persons).length : 0))
  return (
    <div className={styles.canvas}>
      {count === 0 && (
        <EmptyState
          icon={Sprout}
          title={t('tree.emptyTitle')}
          description={t('tree.emptyText')}
          action={
            <Button variant="primary" size="lg" icon={UserPlus} onClick={onAddPerson}>
              {t('tree.addFirst')}
            </Button>
          }
        />
      )}
    </div>
  )
}
