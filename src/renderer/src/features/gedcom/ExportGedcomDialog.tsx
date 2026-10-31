import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Hint } from '@renderer/features/hints/Hint'
import { exportGedcom } from '@core/io/gedcom/export'
import { Button, Checkbox, Dialog, SegmentedControl, toast } from '@renderer/components/ui'
import { currentLibrary } from '@renderer/services/media'
import { useDocument } from '@renderer/store/document'
import styles from '@renderer/features/csv/CsvDialogs.module.css'

type Version = '5.5.1' | '7.0'

/** GEDCOM export options: version, media (folder or GEDZIP), living people, notes. */
export function ExportGedcomDialog({ onClose }: { onClose: () => void }): React.JSX.Element | null {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)
  const [version, setVersion] = useState<Version>('5.5.1')
  const [withMedia, setWithMedia] = useState(true)
  const [privatize, setPrivatize] = useState(false)
  const [notes, setNotes] = useState(true)
  if (!tree) return null
  const mediaCount = Object.keys(tree.media).length
  const mode = !withMedia || !mediaCount ? 'none' : version === '7.0' ? 'gedzip' : 'folder'

  const run = async (): Promise<void> => {
    const api = window.familyInsight
    const path = await api.saveFileDialog(mode === 'gedzip' ? 'gedzip' : 'gedcom', tree.meta.name)
    if (!path) return
    const { text, media } = exportGedcom(tree, {
      version,
      privatizeLiving: privatize,
      livingName: t('gedcom.living'),
      notes
    })
    const result = await api.exportGedcom(path, text, {
      mode,
      library: currentLibrary(),
      files: mode === 'none' ? [] : media.map((m) => ({ path: m.path, hash: m.hash }))
    })
    if (!result.ok) {
      toast({ message: t(`files.error.${result.error}`), tone: 'error' })
      return
    }
    onClose()
    toast({ message: t('gedcom.exported', { path: result.path }), tone: 'success' })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      hint={<Hint id="gedcom" />}
      icon={FileDown}
      title={t('gedcom.exportTitle')}
      description={t('gedcom.exportDescription')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={() => void run()}>
            {t('gedcom.exportButton')}
          </Button>
        </>
      }
    >
      <div className={styles.options}>
        <div className={styles.option}>
          <span className={styles.label}>{t('gedcom.version')}</span>
          <SegmentedControl
            label={t('gedcom.version')}
            value={version}
            onChange={setVersion}
            options={[
              { value: '5.5.1', label: t('gedcom.version551') },
              { value: '7.0', label: t('gedcom.version70') }
            ]}
          />
          <span className={styles.hint}>
            {version === '7.0' ? t('gedcom.version70Hint') : t('gedcom.version551Hint')}
          </span>
        </div>
        {mediaCount > 0 && (
          <div className={styles.option}>
            <Checkbox
              label={t('gedcom.includeMedia', { count: mediaCount })}
              checked={withMedia}
              onChange={setWithMedia}
            />
            <span className={styles.hint}>
              {version === '7.0' ? t('gedcom.mediaGedzip') : t('gedcom.mediaFolder')}
            </span>
          </div>
        )}
        <div className={styles.option}>
          <Checkbox label={t('gedcom.privatize')} checked={privatize} onChange={setPrivatize} />
          <span className={styles.hint}>{t('gedcom.privatizeHint')}</span>
        </div>
        <Checkbox label={t('gedcom.notes')} checked={notes} onChange={setNotes} />
      </div>
    </Dialog>
  )
}
