import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatFuzzyDate, parseFuzzyDate, type DateLanguage } from '@core/date/fuzzyDate'
import type { DateQualifier, FuzzyDate } from '@core/model/types'
import { useFormat } from '@renderer/i18n/format'
import styles from './PersonEditor.module.css'

const QUALIFIERS: DateQualifier[] = ['exact', 'about', 'before', 'after']

/** Editable text for a date in the user's language: `12.05.1890` (PL) / `1890-05-12` (EN). */
export function dateToInput(date: FuzzyDate | undefined, language: DateLanguage): string {
  if (!date) return ''
  if (language !== 'pl') return date.value
  return date.value.split('-').reverse().join('.')
}

interface DateFieldProps {
  label: string
  value: FuzzyDate | undefined
  onCommit: (value: FuzzyDate | undefined) => void
  warning?: string
}

/**
 * Free-text date input accepting every form `parseFuzzyDate` understands, with a live
 * preview of how it will be displayed and a qualifier selector.
 */
export function DateField({ label, value, onCommit, warning }: DateFieldProps): React.JSX.Element {
  const { t } = useTranslation()
  const { dateLanguage: language } = useFormat()
  const id = useId()
  const initial = dateToInput(value, language)
  const [draft, setDraft] = useState(initial)
  const cancelled = useRef(false)
  const [prev, setPrev] = useState(initial)
  if (initial !== prev) {
    setPrev(initial)
    setDraft(initial)
  }

  const trimmed = draft.trim()
  const parsed = trimmed ? parseFuzzyDate(trimmed) : null
  const invalid = trimmed !== '' && parsed === null
  const qualifier = value?.qualifier ?? 'exact'
  // A qualifier typed in the text (`~1890`) wins; otherwise keep the selected one.
  const effective: FuzzyDate | null = parsed
    ? {
        value: parsed.value,
        qualifier: parsed.qualifier !== 'exact' ? parsed.qualifier : qualifier
      }
    : null

  const commit = (): void => {
    if (cancelled.current) {
      cancelled.current = false
      return
    }
    if (invalid) return
    const next = effective ?? undefined
    if (JSON.stringify(next) !== JSON.stringify(value)) onCommit(next)
    if (next) setDraft(dateToInput(next, language))
  }

  const message = invalid
    ? t('person.dateInvalid')
    : effective && trimmed
      ? formatFuzzyDate(effective, language)
      : t('person.dateHint')

  return (
    <div className={styles.dateField}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.dateRow}>
        <select
          className={styles.qualifier}
          aria-label={t('person.dateQualifier')}
          value={qualifier}
          onChange={(e) => {
            const q = e.target.value as DateQualifier
            if (value) onCommit({ ...value, qualifier: q })
            else if (effective) onCommit({ ...effective, qualifier: q })
          }}
        >
          {QUALIFIERS.map((q) => (
            <option key={q} value={q}>
              {t(`person.qualifier.${q}`)}
            </option>
          ))}
        </select>
        <input
          id={id}
          className={styles.dateInput}
          value={draft}
          placeholder={t('person.datePlaceholder')}
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-msg`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              cancelled.current = true
              setDraft(initial)
              e.currentTarget.blur()
            }
          }}
        />
      </div>
      <span
        id={`${id}-msg`}
        className={invalid ? styles.error : styles.hint}
        role={invalid ? 'alert' : undefined}
      >
        {message}
      </span>
      {warning && !invalid && <span className={styles.warning}>{warning}</span>}
    </div>
  )
}
