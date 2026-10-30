import type { DateQualifier, FuzzyDate } from '../model/types'
import { DATE_LANGUAGES, DATE_LOCALES, type DateLanguage } from './dateLocales'

export { DATE_LANGUAGES, type DateLanguage } from './dateLocales'

/** The date tables to use for a UI language (English for languages without their own). */
export function dateLanguage(language: string): DateLanguage {
  return (DATE_LANGUAGES as readonly string[]).includes(language)
    ? (language as DateLanguage)
    : 'en'
}

/** Lower case without diacritics, so `März`, `marz` and `MÄRZ` read alike (й → и too). */
const fold = (text: string): string =>
  text
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

const escapeRe = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Qualifier phrases of every language, longest first, matched at the start of the input. */
const QUALIFIER_PATTERNS: [RegExp, DateQualifier][] = (() => {
  const phrases: [string, DateQualifier][] = []
  for (const locale of Object.values(DATE_LOCALES)) {
    for (const [q, words] of Object.entries(locale.qualifiers)) {
      for (const w of words) phrases.push([fold(w), q as DateQualifier])
    }
  }
  phrases.sort((a, b) => b[0].length - a[0].length)
  return [
    [/^~\s*/, 'about'],
    [/^<\s*/, 'before'],
    [/^>\s*/, 'after'],
    // A phrase ending in a dot may touch the number ("ok.1890"); words need a space.
    ...phrases.map(([w, q]): [RegExp, DateQualifier] => [
      new RegExp(`^${escapeRe(w)}${w.endsWith('.') ? '\\s*' : '\\s+'}`, 'u'),
      q
    ])
  ]
})()

/** Every month name form of every language (folded) with its number. */
const MONTH_NAMES: Map<string, number> = (() => {
  const names = new Map<string, number>()
  for (const locale of Object.values(DATE_LOCALES)) {
    for (const list of Object.values(locale.months)) {
      list.forEach((name, i) => names.set(fold(name), i + 1))
    }
    for (const [name, month] of Object.entries(locale.aliases ?? {})) names.set(fold(name), month)
  }
  return names
})()

/** A month from its name, a name form or an unambiguous prefix of 3+ letters (`mar`, `sept.`). */
function monthFromName(text: string): number | undefined {
  const name = fold(text).replace(/\.$/, '')
  const exact = MONTH_NAMES.get(name)
  if (exact !== undefined || name.length < 3) return exact
  const months = new Set<number>()
  for (const [full, month] of MONTH_NAMES) if (full.startsWith(name)) months.add(month)
  return months.size === 1 ? [...months][0] : undefined
}

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function daysInMonth(year: number, month: number): number {
  return [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0
}

function build(year: number, month?: number, day?: number): string | null {
  if (!Number.isInteger(year) || year < 1 || year > 9999) return null
  const y = String(year).padStart(4, '0')
  if (month === undefined) return y
  if (month < 1 || month > 12) return null
  const m = String(month).padStart(2, '0')
  if (day === undefined) return `${y}-${m}`
  if (day < 1 || day > daysInMonth(year, month)) return null
  return `${y}-${m}-${String(day).padStart(2, '0')}`
}

/**
 * Parses user/CSV input into a FuzzyDate. Accepts ISO prefixes (`1890`, `1890-05`,
 * `1890-05-12`), day-first numbers (`12.05.1890`, `12/05/1890`, `05.1890`), month names in any
 * supported language and form (`12 March 1890`, `12 marca 1890`, `12. März 1890`,
 * `1er mars 1890`, `12 de marzo de 1890`, `12 марта 1890 г.`, `March 12, 1890`, `mar 1890`) and
 * qualifiers (`~`, `<`, `>`, `abt`, `ok.`, `um`, `vers`, `antes de`, `около` …). With English as
 * the language, `MM/DD/YYYY` is read when day-first can't be a date (`05/23/1890`).
 * Returns `null` for empty or invalid input.
 */
export function parseFuzzyDate(
  input: string | null | undefined,
  language?: string
): FuzzyDate | null {
  let text = fold((input ?? '').trim()).replace(/\s+/g, ' ')
  if (!text) return null
  let qualifier: DateQualifier = 'exact'
  for (const [pattern, q] of QUALIFIER_PATTERNS) {
    const match = pattern.exec(text)
    if (match) {
      qualifier = q
      text = text.slice(match[0].length).trim()
      break
    }
  }
  // Year words after the number: "1890 r.", "1890 roku", "1900 г.", "1900 года".
  text = text.replace(/(\d)\s*(r\.?|roku|г\.?|года|год)$/u, '$1').trim()
  const value = parseValue(text, language)
  return value ? { value, qualifier } : null
}

function parseValue(text: string, language?: string): string | null {
  let m: RegExpExecArray | null
  if ((m = /^(\d{3,4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/.exec(text))) {
    return build(Number(m[1]), m[2] ? Number(m[2]) : undefined, m[3] ? Number(m[3]) : undefined)
  }
  if ((m = /^(\d{1,2})([./-])(\d{1,2})\2(\d{3,4})$/.exec(text))) {
    const dayFirst = build(Number(m[4]), Number(m[3]), Number(m[1]))
    if (dayFirst || m[2] !== '/' || (language !== undefined && dateLanguage(language) !== 'en'))
      return dayFirst
    return build(Number(m[4]), Number(m[1]), Number(m[3]))
  }
  if ((m = /^(\d{1,2})[./-](\d{3,4})$/.exec(text))) return build(Number(m[2]), Number(m[1]))
  // Day, month name, year: "12 march 1890", "12. marz 1890", "1er mars", "12 de marzo de 1890".
  const day = String.raw`(\d{1,2})(?:\.|er|º|°|st|nd|rd|th)?`
  const name = String.raw`([\p{L}]+\.?)`
  if (
    (m = new RegExp(`^${day}\\s*(?:de |of )?${name},? (?:de |del )?(\\d{3,4})$`, 'u').exec(text))
  ) {
    const month = monthFromName(m[2]!)
    return month ? build(Number(m[3]), month, Number(m[1])) : null
  }
  // Month name, day, year: "march 12, 1890".
  if ((m = new RegExp(`^${name} ${day},? (\\d{3,4})$`, 'u').exec(text))) {
    const month = monthFromName(m[1]!)
    return month ? build(Number(m[3]), month, Number(m[2])) : null
  }
  // Month name and year: "march 1890", "marzec 1890", "mayo de 1890".
  if ((m = new RegExp(`^${name},? (?:de |del )?(\\d{3,4})$`, 'u').exec(text))) {
    const month = monthFromName(m[1]!)
    return month ? build(Number(m[2]), month) : null
  }
  return null
}

const PREFIX: Record<DateQualifier, string> = { exact: '', about: '~', before: '<', after: '>' }

/** Canonical text form (ISO + symbolic prefix), used by CSV export. */
export function serializeFuzzyDate(date: FuzzyDate): string {
  return PREFIX[date.qualifier] + date.value
}

interface Parts {
  year: number
  month?: number
  day?: number
}

export function dateParts(date: FuzzyDate): Parts {
  const [y, m, d] = date.value.split('-').map(Number)
  return { year: y!, month: m, day: d }
}

export function yearOf(date: FuzzyDate | undefined): number | undefined {
  return date ? dateParts(date).year : undefined
}

/**
 * Human-readable date in a language, e.g. EN `about May 1890`, PL `ok. maja 1890`,
 * DE `12. Mai 1890`, FR `1er mai 1890`, ES `12 de mayo de 1890`, RU `около марта 1900`.
 */
export function formatFuzzyDate(date: FuzzyDate, language: DateLanguage): string {
  const locale = DATE_LOCALES[language]
  return locale.write({ ...dateParts(date), qualifier: date.qualifier }, locale.months)
}

/**
 * Editable text for a date: ISO for English (`1890-05-12`), day first in the language's
 * numeric style otherwise (`12.05.1890`, `12/05/1890`, `05.1890`).
 */
export function dateInputText(date: FuzzyDate, language: DateLanguage): string {
  const separator = DATE_LOCALES[language].numeric
  return separator ? date.value.split('-').reverse().join(separator) : date.value
}

/** Compact form for cards: `~1890`, `<1900`, `1890`. */
export function shortFuzzyDate(date: FuzzyDate): string {
  return PREFIX[date.qualifier] + String(dateParts(date).year)
}

const QUALIFIER_ORDER: Record<DateQualifier, number> = { before: 0, about: 1, exact: 1, after: 2 }

/** Chronological comparison; missing dates sort last. */
export function compareFuzzyDates(a: FuzzyDate | undefined, b: FuzzyDate | undefined): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  const pa = dateParts(a)
  const pb = dateParts(b)
  return (
    pa.year - pb.year ||
    (pa.month ?? 0) - (pb.month ?? 0) ||
    (pa.day ?? 0) - (pb.day ?? 0) ||
    QUALIFIER_ORDER[a.qualifier] - QUALIFIER_ORDER[b.qualifier]
  )
}

export interface Age {
  years: number
  /** True when either date is partial or qualified. */
  approximate: boolean
}

/** Completed years between `birth` and `at` (defaults to today). */
export function ageAt(
  birth: FuzzyDate | undefined,
  at: FuzzyDate | Date = new Date()
): Age | undefined {
  if (!birth) return undefined
  const b = dateParts(birth)
  const end: Parts & { qualifier: DateQualifier } =
    at instanceof Date
      ? { year: at.getFullYear(), month: at.getMonth() + 1, day: at.getDate(), qualifier: 'exact' }
      : { ...dateParts(at), qualifier: at.qualifier }
  let years = end.year - b.year
  const precise = b.month !== undefined && end.month !== undefined
  if (precise) {
    const beforeBirthday =
      end.month! < b.month! ||
      (end.month === b.month && b.day !== undefined && end.day !== undefined && end.day < b.day)
    if (beforeBirthday) years -= 1
  }
  if (years < 0) return undefined
  const approximate =
    birth.qualifier !== 'exact' ||
    end.qualifier !== 'exact' ||
    b.day === undefined ||
    end.day === undefined
  return { years, approximate }
}
