import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { exportCsv, type Delimiter } from '@core/io/csv/export'
import type { HeaderLanguage } from '@core/io/csv/columns'
import { resolveLanguage } from '@shared/i18n'
import { alertDialog, Button, Dialog, SegmentedControl, toast } from '@renderer/components/ui'
import { useDocument } from '@renderer/store/document'
import { useSettings } from '@renderer/store/settings'
import styles from './CsvDialogs.module.css'

/** Options for CSV export (delimiter, header language), then a save dialog. */
export function ExportCsvDialog({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}): React.JSX.Element | null {
  const { t, i18n } = useTranslation()
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const [delimiter, setDelimiter] = useState<Delimiter>(settings.csvDelimiter)
  const [headerLanguage, setHeaderLanguage] = useState<HeaderLanguage>(
    resolveLanguage(i18n.language)
  )
  const [busy, setBusy] = useState(false)

  const run = async (): Promise<void> => {
    const tree = useDocument.getState().tree
    if (!tree) return
    setBusy(true)
    try {
      void update({ csvDelimiter: delimiter })
      const path = await window.familyInsight.saveFileDialog('csv', tree.meta.name)
      if (!path) return
      const result = await window.familyInsight.writeFile(
        path,
        exportCsv(tree, { delimiter, headerLanguage })
      )
      if (!result.ok) {
        await alertDialog({
          title: t('files.error.saveTitle'),
          message: t(`files.error.${result.error}`),
          danger: true
        })
        return
      }
      onClose()
      toast({
        message: t('csv.exported', { count: Object.keys(tree.persons).length }),
        tone: 'success',
        action: {
          label: t('csv.showInFolder'),
          onClick: () => void window.familyInsight.showInFolder(result.path)
        }
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={FileDown}
      title={t('csv.exportTitle')}
      description={t('csv.exportDescription')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={() => void run()} disabled={busy}>
            {t('csv.exportButton')}
          </Button>
        </>
      }
    >
      <div className={styles.options}>
        <div className={styles.option}>
          <span className={styles.label}>{t('csv.delimiter')}</span>
          <SegmentedControl
            block
            label={t('csv.delimiter')}
            value={delimiter}
            onChange={setDelimiter}
            options={[
              { value: ',', label: t('csv.comma') },
              { value: ';', label: t('csv.semicolon') }
            ]}
          />
          <span className={styles.hint}>{t('csv.delimiterHint')}</span>
        </div>
        <div className={styles.option}>
          <span className={styles.label}>{t('csv.headerLanguage')}</span>
          <SegmentedControl
            block
            label={t('csv.headerLanguage')}
            value={headerLanguage}
            onChange={setHeaderLanguage}
            options={[
              { value: 'en', label: t('language.en') },
              { value: 'pl', label: t('language.pl') }
            ]}
          />
        </div>
      </div>
    </Dialog>
  )
}
