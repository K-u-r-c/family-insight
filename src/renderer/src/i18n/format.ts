import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { dateLanguage, formatFuzzyDate, type DateLanguage } from '@core/date/fuzzyDate'
import { lifespanLabel } from '@core/date/lifespan'
import type { FuzzyDate, Person } from '@core/model/types'
import { compareSurnames, compareText, formatFileSize, formatList, formatNumber } from '@core/text'
import { intlLanguage, resolveLanguage } from '@shared/i18n'

export interface Formatters {
  /** Language for `Intl` (sorting, numbers, lists). */
  language: string
  /** Language of the date tables (parsing and formatting fuzzy dates). */
  dateLanguage: DateLanguage
  date: (date: FuzzyDate | undefined) => string
  lifespan: (person: Person) => string
  list: (items: string[]) => string
  number: (value: number) => string
  fileSize: (bytes: number) => string
  compare: (a: string, b: string) => number
  /** Surnames, ignoring particles such as von, van, de ("van der Berg" under B). */
  compareSurnames: (a: string, b: string) => number
}

/** Locale-aware formatters bound to the current UI language. */
export function useFormat(): Formatters {
  const { i18n } = useTranslation()
  const language = intlLanguage(resolveLanguage(i18n.language))
  return useMemo(() => {
    const dates = dateLanguage(language)
    return {
      language,
      dateLanguage: dates,
      date: (date) => (date ? formatFuzzyDate(date, dates) : ''),
      lifespan: (person) => lifespanLabel(person, dates),
      list: (items) => formatList(items, language),
      number: (value) => formatNumber(value, language),
      fileSize: (bytes) => formatFileSize(bytes, language),
      compare: (a, b) => compareText(a, b, language),
      compareSurnames: (a, b) => compareSurnames(a, b, language)
    }
  }, [language])
}
