import { useMemo, useState } from 'react'
import { AlertTriangle, FileUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { decodeGedcom, GEDCOM_ENCODINGS, type GedcomEncoding } from '@core/io/gedcom/encoding'
import { readGedzip } from '@core/io/gedcom/gedzip'
import { attachMedia, importGedcom } from '@core/io/gedcom/import'
import { parseGedcom } from '@core/io/gedcom/parser'
import type { MediaPutResult } from '@shared/ipc'
import { Button, Dialog, Icon, SegmentedControl, Select, toast } from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { useIssueText } from '@renderer/i18n/issues'
import { guardUnsaved } from '@renderer/services/documentFiles'
import {
  attachLibrary,
  ensureLibrary,
  prepareMediaFiles,
  reloadThumbnails
} from '@renderer/services/media'
import { mergeTreeCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useGedcomSource } from './importFlow'
import styles from '@renderer/features/csv/CsvDialogs.module.css'

const MAX_LISTED = 50
const ENCODING_LABEL: Record<GedcomEncoding, string> = {
  'utf-8': 'UTF-8',
  'utf-16le': 'UTF-16 LE',
  'utf-16be': 'UTF-16 BE',
  ansel: 'ANSEL',
  ascii: 'ASCII',
  'windows-1252': 'ANSI (Windows-1252)',
  'windows-1250': 'Windows-1250'
}

/** Preview of a GEDCOM import: version, encoding, summary, warnings, new tree or merge. */
export function ImportGedcomDialog({ onClose }: { onClose: () => void }): React.JSX.Element | null {
  const { t } = useTranslation()
  const format = useFormat()
  const issueText = useIssueText()
  const source = useGedcomSource((s) => s.source)
  const hasDocument = useDocument((s) => s.tree !== null)
  const [encoding, setEncoding] = useState<GedcomEncoding | undefined>(undefined)
  const [target, setTarget] = useState<'new' | 'merge'>('new')
  const [busy, setBusy] = useState(false)

  const prepared = useMemo(() => {
    if (!source) return null
    const zip = readGedzip(source.bytes)
    const { text, detected } = decodeGedcom(zip?.gedcom ?? source.bytes, encoding)
    const doc = parseGedcom(text)
    const result = importGedcom(doc, { name: source.name })
    return { zip, detected, doc, result }
  }, [source, encoding])
  if (!source || !prepared) return null
  const { result, detected, doc, zip } = prepared
  const { summary } = result
  const unsupported = Object.entries(summary.unsupported).sort((a, b) => b[1] - a[1])
  const lineWarnings = doc.warnings.filter((w) => w.code !== 'missing-trailer')
  const blocked = summary.people === 0 || busy

  const run = async (): Promise<void> => {
    if (blocked) return
    if (target === 'new' && !(await guardUnsaved())) return
    setBusy(true)
    try {
      // Media files: from the GEDZIP, or next to the GEDCOM file.
      const library =
        target === 'merge' && hasDocument
          ? await ensureLibrary()
          : await window.familyInsight.createMediaLibrary()
      const paths = [...new Set(result.media.map((m) => m.path))]
      let results: Record<string, MediaPutResult> = {}
      if (zip) {
        for (const path of paths) {
          const bytes = zip.files.get(path.replace(/^\.\//, ''))
          const name = path.split('/').pop() ?? path
          results[path] = bytes
            ? ((await window.familyInsight.putMedia(library, bytes, name)) ?? {
                ok: false,
                fileName: name,
                error: 'io'
              })
            : { ok: false, fileName: name, error: 'io' }
        }
      } else if (paths.length) {
        results = await window.familyInsight.importMediaFromPaths(library, source.path, paths)
      }
      const { loaded } = await prepareMediaFiles(library, results)
      const { tree, missing } = attachMedia(result, loaded)
      if (target === 'merge' && hasDocument) {
        useDocument.getState().dispatch(mergeTreeCommand(tree))
        await reloadThumbnails()
      } else {
        useDocument.getState().loadDocument(tree, null, { dirty: true })
        await attachLibrary(library)
      }
      onClose()
      toast({ message: t('gedcom.imported', { count: summary.people }), tone: 'success' })
      if (missing.length) {
        toast({ message: t('gedcom.mediaMissing', { count: missing.length }), tone: 'error' })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      wide
      onClose={onClose}
      icon={FileUp}
      title={t('gedcom.importTitle', { name: source.name })}
      description={t('gedcom.detected', {
        version: summary.version ?? '?',
        program: summary.program ?? t('gedcom.unknownProgram')
      })}
      footer={
        <>
          <span className={styles.summary} role="status">
            {t('gedcom.summary', {
              people: summary.people,
              families: summary.families,
              events: summary.events,
              sources: summary.sources,
              media: summary.media
            })}
          </span>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" disabled={blocked} onClick={() => void run()}>
            {busy ? t('gedcom.importing') : t('gedcom.importButton')}
          </Button>
        </>
      }
    >
      <div className={styles.importBody}>
        <div className={styles.options}>
          {hasDocument && (
            <div className={styles.option}>
              <span className={styles.label}>{t('csv.target')}</span>
              <SegmentedControl
                label={t('csv.target')}
                value={target}
                onChange={setTarget}
                options={[
                  { value: 'new', label: t('csv.targetNew') },
                  { value: 'merge', label: t('csv.targetMerge') }
                ]}
              />
            </div>
          )}
          <Select
            label={t('gedcom.encoding')}
            value={encoding ?? detected.encoding}
            options={GEDCOM_ENCODINGS.map((e) => ({
              value: e,
              label:
                e === detected.encoding && !encoding
                  ? t('gedcom.detectedEncoding', { name: ENCODING_LABEL[e] })
                  : ENCODING_LABEL[e]
            }))}
            onChange={(v) => setEncoding(v as GedcomEncoding)}
          />
          <p className={styles.hint}>{t('gedcom.encodingHint')}</p>
        </div>

        {summary.people === 0 && (
          <p className={styles.errors} role="alert">
            {t('gedcom.nothing')}
          </p>
        )}

        {(result.warnings.length > 0 || lineWarnings.length > 0) && (
          <section>
            <h3 className={styles.sectionTitle}>
              {t('gedcom.warningsTitle', { count: result.warnings.length + lineWarnings.length })}
            </h3>
            <ul className={styles.warnings}>
              {[
                ...lineWarnings.map((w) => ({
                  line: w.line,
                  text: t(`gedcom.line.${w.code}`, { text: w.text ?? '' })
                })),
                ...result.warnings.map((w) => ({ line: w.row, text: issueText(w) }))
              ]
                .slice(0, MAX_LISTED)
                .map((w, i) => (
                  <li key={i}>
                    <Icon icon={AlertTriangle} size={14} />
                    <span>
                      {w.line !== undefined && (
                        <strong>{t('gedcom.lineNo', { line: w.line })} </strong>
                      )}
                      {w.text}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {unsupported.length > 0 && (
          <section>
            <h3 className={styles.sectionTitle}>
              {t('gedcom.unsupportedTitle', {
                count: unsupported.reduce((n, [, c]) => n + c, 0)
              })}
            </h3>
            <p className={styles.hint}>{t('gedcom.unsupportedHint')}</p>
            <ul className={styles.warnings}>
              {unsupported.slice(0, MAX_LISTED).map(([tag, count]) => (
                <li key={tag}>
                  <span className={styles.mono}>{tag}</span>
                  <span>× {format.number(count)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Dialog>
  )
}
