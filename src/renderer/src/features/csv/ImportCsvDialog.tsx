import { useMemo, useState } from 'react'
import { AlertTriangle, FileUp, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Hint } from '@renderer/features/hints/Hint'
import { decodeText, TEXT_ENCODINGS, type TextEncodingName } from '@core/file/encoding'
import { CSV_COLUMNS, type CsvColumn } from '@core/io/csv/columns'
import { importCsv } from '@core/io/csv/import'
import type { Issue } from '@core/issues'
import { Button, Dialog, Icon, SegmentedControl, Select, toast } from '@renderer/components/ui'
import { useIssueText } from '@renderer/i18n/issues'
import { guardUnsaved } from '@renderer/services/documentFiles'
import { mergeTreeCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { openCsvFormatDocs, saveCsvTemplate } from './csvHelp'
import { useImportSource } from './importFlow'
import styles from './CsvDialogs.module.css'

const MAX_LISTED = 50

const ENCODING_LABEL: Record<TextEncodingName, string> = {
  'utf-8': 'UTF-8',
  'windows-1250': 'Windows-1250',
  'windows-1251': 'Windows-1251',
  'windows-1252': 'Windows-1252'
}
const PREVIEW_ROWS = 5

function IssueList({
  issues,
  tone
}: {
  issues: Issue[]
  tone: 'error' | 'warning'
}): React.JSX.Element {
  const { t } = useTranslation()
  const text = useIssueText()
  return (
    <ul className={tone === 'error' ? styles.errors : styles.warnings}>
      {issues.slice(0, MAX_LISTED).map((issue, i) => (
        <li key={i}>
          <Icon icon={tone === 'error' ? XCircle : AlertTriangle} size={14} />
          <span>
            {issue.row !== undefined && <strong>{t('csv.row', { row: issue.row })} </strong>}
            {text(issue)}
          </span>
        </li>
      ))}
      {issues.length > MAX_LISTED && (
        <li className={styles.more}>{t('csv.more', { count: issues.length - MAX_LISTED })}</li>
      )}
    </ul>
  )
}

/** Preview of a CSV import: detected format, column mapping, sample rows, errors and warnings. */
export function ImportCsvDialog({ onClose }: { onClose: () => void }): React.JSX.Element | null {
  const { t, i18n } = useTranslation()
  const source = useImportSource((s) => s.source)
  const hasDocument = useDocument((s) => s.tree !== null)
  const [mapping, setMapping] = useState<(CsvColumn | null)[] | undefined>(undefined)
  const [target, setTarget] = useState<'new' | 'merge'>('new')
  const [encoding, setEncoding] = useState<TextEncodingName | undefined>(undefined)

  // The file is decoded again when the user picks another code page.
  const decoded = useMemo(() => {
    if (!source?.bytes) return source ? { text: source.content, encoding: source.encoding } : null
    return decodeText(source.bytes, { language: i18n.language, encoding })
  }, [source, encoding, i18n.language])
  const detected = useMemo(
    () => (source?.bytes ? decodeText(source.bytes, { language: i18n.language }).encoding : null),
    [source, i18n.language]
  )
  const result = useMemo(
    () => (source && decoded ? importCsv(decoded.text, { mapping, name: source.name }) : null),
    [source, decoded, mapping]
  )
  if (!source || !result || !decoded) return null

  const blocked = result.errors.length > 0 || result.stats.people === 0
  const effectiveMapping = mapping ?? result.mapping
  const delimiterLabel = t(
    `csv.delimiterName.${result.delimiter === ';' ? 'semicolon' : result.delimiter === ',' ? 'comma' : 'tab'}`
  )

  const run = async (): Promise<void> => {
    if (blocked) return
    if (target === 'merge' && hasDocument) {
      useDocument.getState().dispatch(mergeTreeCommand(result.tree))
    } else {
      if (!(await guardUnsaved())) return
      useDocument.getState().loadDocument(result.tree, null, { dirty: true })
    }
    onClose()
    toast({ message: t('csv.imported', { count: result.stats.people }), tone: 'success' })
  }

  return (
    <Dialog
      open
      wide
      hint={<Hint id="csvImport" />}
      onClose={onClose}
      icon={FileUp}
      title={t('csv.importTitle', { name: source.name })}
      description={t('csv.detected', {
        delimiter: delimiterLabel,
        encoding: ENCODING_LABEL[decoded.encoding]
      })}
      footer={
        <>
          <span className={styles.footerLinks}>
            <button type="button" className={styles.linkButton} onClick={openCsvFormatDocs}>
              {t('csv.formatHelp')}
            </button>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => void saveCsvTemplate()}
            >
              {t('csv.downloadTemplate')}
            </button>
          </span>
          <span className={styles.summary} role="status">
            {[
              t('counts.people', { count: result.stats.people }),
              t('counts.relationships', { count: result.stats.relationships })
            ].join(', ')}
          </span>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" disabled={blocked} onClick={() => void run()}>
            {t('csv.importButton')}
          </Button>
        </>
      }
    >
      <div className={styles.importBody}>
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

        {detected && (
          <Select
            label={t('csv.encoding')}
            hint={t('csv.encodingHint')}
            value={decoded.encoding}
            options={TEXT_ENCODINGS.map((e) => ({
              value: e,
              label:
                e === detected
                  ? t('csv.detectedEncoding', { name: ENCODING_LABEL[e] })
                  : ENCODING_LABEL[e]
            }))}
            onChange={(v) => {
              setEncoding(v as TextEncodingName)
              // Headers read differently in another code page: map them afresh.
              setMapping(undefined)
            }}
          />
        )}

        {result.errors.length > 0 && (
          <section>
            <h3 className={styles.sectionTitle}>
              {t('csv.errorsTitle', { count: result.errors.length })}
            </h3>
            <p className={styles.hint}>{t('csv.errorsHint')}</p>
            <IssueList issues={result.errors} tone="error" />
          </section>
        )}

        <section>
          <h3 className={styles.sectionTitle}>{t('csv.columnsTitle')}</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('csv.fileColumn')}</th>
                  <th>{t('csv.mappedTo')}</th>
                  <th>{t('csv.sample')}</th>
                </tr>
              </thead>
              <tbody>
                {result.headers.map((header, i) => (
                  <tr key={i}>
                    <td className={styles.mono}>{header || '—'}</td>
                    <td>
                      <select
                        className={styles.select}
                        aria-label={t('csv.mappingFor', { column: header })}
                        value={effectiveMapping[i] ?? ''}
                        onChange={(e) => {
                          const next = [...effectiveMapping]
                          const value = (e.target.value || null) as CsvColumn | null
                          // A column can only be mapped once.
                          next.forEach((c, j) => {
                            if (value && c === value && j !== i) next[j] = null
                          })
                          next[i] = value
                          setMapping(next)
                        }}
                      >
                        <option value="">{t('csv.ignore')}</option>
                        {CSV_COLUMNS.map((c) => (
                          <option key={c} value={c}>
                            {t(`csv.column.${c}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={styles.sampleCell}>{result.rows[0]?.[i] ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>
            {t('csv.previewTitle', { count: Math.min(PREVIEW_ROWS, result.rows.length) })}
          </h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {result.headers.map((h, i) => (
                    <th key={i} className={effectiveMapping[i] ? undefined : styles.ignored}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, PREVIEW_ROWS).map((row, r) => (
                  <tr key={r}>
                    {result.headers.map((_, i) => (
                      <td key={i} className={effectiveMapping[i] ? undefined : styles.ignored}>
                        {row[i] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {result.warnings.length > 0 && (
          <details className={styles.details} open={result.warnings.length <= 5}>
            <summary className={styles.sectionTitle}>
              {t('csv.warningsTitle', { count: result.warnings.length })}
            </summary>
            <p className={styles.hint}>{t('csv.warningsHint')}</p>
            <IssueList issues={result.warnings} tone="warning" />
          </details>
        )}
      </div>
    </Dialog>
  )
}
