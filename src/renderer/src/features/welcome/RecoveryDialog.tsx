import { useEffect, useState } from 'react'
import { LifeBuoy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { parseTreeWithWarnings } from '@core/file/format'
import type { RecoveryEntry } from '@shared/ipc'
import { Button, Dialog, toast } from '@renderer/components/ui'
import { attachLibrary } from '@renderer/services/media'
import { useDocument } from '@renderer/store/document'
import styles from './RecoveryDialog.module.css'

/** On start-up, offers to restore documents that were not saved before the app stopped. */
export function RecoveryDialog(): React.JSX.Element | null {
  const { t, i18n } = useTranslation()
  const [entries, setEntries] = useState<RecoveryEntry[]>([])

  useEffect(() => {
    void window.familyInsight.listRecovery().then(setEntries)
  }, [])

  if (!entries.length) return null

  const discardAll = async (): Promise<void> => {
    await Promise.all(entries.map((e) => window.familyInsight.clearRecovery(e.id)))
    setEntries([])
  }
  const restore = async (entry: RecoveryEntry): Promise<void> => {
    const data = await window.familyInsight.readRecovery(entry.id)
    try {
      if (!data) throw new Error('missing')
      const { tree, media } = parseTreeWithWarnings(data.content)
      useDocument.getState().loadDocument(tree, data.originalPath, { dirty: true })
      await attachLibrary(data.library, media)
      toast({ message: t('recovery.restored', { name: entry.name }), tone: 'success' })
    } catch {
      toast({ message: t('recovery.failed'), tone: 'error' })
    }
    await window.familyInsight.clearRecovery(entry.id)
    setEntries((list) => list.filter((e) => e.id !== entry.id))
  }
  const when = (iso: string): string =>
    new Date(iso).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <Dialog
      open
      onClose={() => setEntries([])}
      icon={LifeBuoy}
      title={t('recovery.title')}
      description={t('recovery.text')}
      footer={
        <Button variant="ghost" onClick={() => void discardAll()}>
          {t('recovery.discardAll')}
        </Button>
      }
    >
      <ul className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.id} className={styles.item}>
            <div className={styles.text}>
              <span className={styles.name}>{entry.name}</span>
              <span className={styles.meta}>
                {entry.originalPath ?? t('recovery.untitled')} · {when(entry.savedAt)}
              </span>
            </div>
            <Button variant="primary" size="sm" data-autofocus onClick={() => void restore(entry)}>
              {t('recovery.restore')}
            </Button>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}
