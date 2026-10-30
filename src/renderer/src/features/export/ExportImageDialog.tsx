import { useState } from 'react'
import { ImageDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PdfOptions } from '@shared/ipc'
import {
  alertDialog,
  Button,
  Checkbox,
  Dialog,
  SegmentedControl,
  toast
} from '@renderer/components/ui'
import { useDocument } from '@renderer/store/document'
import styles from '@renderer/features/csv/CsvDialogs.module.css'
import { currentTreeSvg, svgToPngBase64, type ExportScope, type ImageFormat } from './exportImage'

/** Export the tree view as PNG, SVG or PDF. */
export function ExportImageDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const [format, setFormat] = useState<ImageFormat>('png')
  const [scope, setScope] = useState<ExportScope>('all')
  const [scale, setScale] = useState<'1' | '2' | '3'>('2')
  const [pageSize, setPageSize] = useState<PdfOptions['pageSize']>('A4')
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')
  const [withTitle, setWithTitle] = useState(true)
  const [busy, setBusy] = useState(false)

  const run = async (): Promise<void> => {
    const tree = useDocument.getState().tree
    const image = currentTreeSvg({ scope, withTitle })
    if (!tree || !image) return
    setBusy(true)
    try {
      const path = await window.familyInsight.saveFileDialog(format, tree.meta.name)
      if (!path) return
      const result =
        format === 'svg'
          ? await window.familyInsight.writeFile(path, image.svg)
          : format === 'png'
            ? await window.familyInsight.writeFile(
                path,
                await svgToPngBase64(image, Number(scale)),
                { encoding: 'base64' }
              )
            : await window.familyInsight.exportPdf(
                image.svg,
                { pageSize, landscape: orientation === 'landscape' },
                path
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
        message: t('export.done'),
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
      open
      onClose={onClose}
      icon={ImageDown}
      title={t('export.title')}
      description={t('export.description')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" disabled={busy} onClick={() => void run()}>
            {t('export.button')}
          </Button>
        </>
      }
    >
      <div className={styles.options}>
        <div className={styles.option}>
          <span className={styles.label}>{t('export.format')}</span>
          <SegmentedControl
            block
            label={t('export.format')}
            value={format}
            onChange={setFormat}
            options={[
              { value: 'png', label: 'PNG' },
              { value: 'svg', label: 'SVG' },
              { value: 'pdf', label: 'PDF' }
            ]}
          />
          <span className={styles.hint}>{t(`export.${format}Hint`)}</span>
        </div>
        <div className={styles.option}>
          <span className={styles.label}>{t('export.scope')}</span>
          <SegmentedControl
            block
            label={t('export.scope')}
            value={scope}
            onChange={setScope}
            options={[
              { value: 'all', label: t('export.scopeAll') },
              { value: 'visible', label: t('export.scopeVisible') }
            ]}
          />
        </div>
        {format === 'png' && (
          <div className={styles.option}>
            <span className={styles.label}>{t('export.scale')}</span>
            <SegmentedControl
              block
              label={t('export.scale')}
              value={scale}
              onChange={setScale}
              options={[
                { value: '1', label: '1×' },
                { value: '2', label: '2×' },
                { value: '3', label: '3×' }
              ]}
            />
          </div>
        )}
        {format === 'pdf' && (
          <>
            <div className={styles.option}>
              <span className={styles.label}>{t('export.paper')}</span>
              <SegmentedControl
                block
                label={t('export.paper')}
                value={pageSize}
                onChange={setPageSize}
                options={[
                  { value: 'A4', label: 'A4' },
                  { value: 'A3', label: 'A3' },
                  { value: 'Letter', label: 'Letter' }
                ]}
              />
            </div>
            <div className={styles.option}>
              <span className={styles.label}>{t('export.orientation')}</span>
              <SegmentedControl
                block
                label={t('export.orientation')}
                value={orientation}
                onChange={setOrientation}
                options={[
                  { value: 'landscape', label: t('export.landscape') },
                  { value: 'portrait', label: t('export.portrait') }
                ]}
              />
              <span className={styles.hint}>{t('export.fitHint')}</span>
            </div>
          </>
        )}
        <Checkbox checked={withTitle} onChange={setWithTitle} label={t('export.withTitle')} />
      </div>
    </Dialog>
  )
}
