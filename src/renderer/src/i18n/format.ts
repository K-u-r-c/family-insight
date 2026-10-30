import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatFuzzyDate, type DateLanguage } from '@core/date/fuzzyDate'
import { lifespanLabel } from '@core/date/lifespan'
import type { FuzzyDate, Person } from '@core/model/types'
import { compareText, formatFileSize, formatList, formatNumber } from '@core/text'
import { resolveLanguage } from '@shared/i18n'

export interface Formatters {
  language: DateLanguage
  date: (date: FuzzyDate | undefined) => string
  lifespan: (person: Person) => string
  list: (items: string[]) => string
  number: (value: number) => string
  fileSize: (bytes: number) => string
  compare: (a: string, b: string) => number
}

/** Locale-aware formatters bound to the current UI language. */
export function useFormat(): Formatters {
  const { i18n } = useTranslation()
  const language = resolveLanguage(i18n.language)
  return useMemo(
    () => ({
      language,
      date: (date) => (date ? formatFuzzyDate(date, language) : ''),
      lifespan: (person) => lifespanLabel(person, language),
      list: (items) => formatList(items, language),
      number: (value) => formatNumber(value, language),
      fileSize: (bytes) => formatFileSize(bytes, language),
      compare: (a, b) => compareText(a, b, language)
    }),
    [language]
  )
}
