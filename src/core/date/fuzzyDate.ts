import type { DateQualifier, FuzzyDate } from '../model/types'

export const DATE_LANGUAGES = ['en', 'pl'] as const
export type DateLanguage = (typeof DATE_LANGUAGES)[number]

/** The date tables to use for a UI language (English for languages without their own). */
export function dateLanguage(language: string): DateLanguage {
  return (DATE_LANGUAGES as readonly string[]).includes(language)
    ? (language as DateLanguage)
    : 'en'
}

const QUALIFIER_WORDS: [RegExp, DateQualifier][] = [
  [/^(~|about|abt\.?|circa|ca\.?|c\.|około|okolo|ok\.?)\s*/i, 'about'],
  [/^(<|before|bef\.?|przed)\s*/i, 'before'],
  [/^(after|aft\.?|po)\s+/i, 'after'],
  [/^>\s*/i, 'after']
]

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
 * `1890-05-12`), day-first forms (`12.05.1890`, `05.1890`, `12/05/1890`) and qualifier
 * prefixes (`~`, `<`, `>`, `abt`, `bef`, `aft`, `ok.`, `przed`, `po`).
 * Returns `null` for empty or invalid input.
 */
export function parseFuzzyDate(input: string | null | undefined): FuzzyDate | null {
  let text = (input ?? '').trim()
  if (!text) return null
  let qualifier: DateQualifier = 'exact'
  for (const [pattern, q] of QUALIFIER_WORDS) {
    const match = pattern.exec(text)
    if (match) {
      qualifier = q
      text = text.slice(match[0].length).trim()
      break
    }
  }
  let value: string | null = null
  let m: RegExpExecArray | null
  if ((m = /^(\d{3,4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/.exec(text))) {
    value = build(Number(m[1]), m[2] ? Number(m[2]) : undefined, m[3] ? Number(m[3]) : undefined)
  } else if ((m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{3,4})$/.exec(text))) {
    value = build(Number(m[3]), Number(m[2]), Number(m[1]))
  } else if ((m = /^(\d{1,2})[./-](\d{3,4})$/.exec(text))) {
    value = build(Number(m[2]), Number(m[1]))
  }
  return value ? { value, qualifier } : null
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

// Polish month names by grammatical case (Intl only offers nominative/genitive).
const PL_MONTHS = {
  nom: 'styczeń luty marzec kwiecień maj czerwiec lipiec sierpień wrzesień październik listopad grudzień',
  gen: 'stycznia lutego marca kwietnia maja czerwca lipca sierpnia września października listopada grudnia',
  ins: 'styczniem lutym marcem kwietniem majem czerwcem lipcem sierpniem wrześniem październikiem listopadem grudniem',
  loc: 'styczniu lutym marcu kwietniu maju czerwcu lipcu sierpniu wrześniu październiku listopadzie grudniu'
}
const EN_MONTHS =
  'January February March April May June July August September October November December'.split(' ')

const QUALIFIER_LABEL: Record<DateLanguage, Record<DateQualifier, string>> = {
  en: { exact: '', about: 'about ', before: 'before ', after: 'after ' },
  pl: { exact: '', about: 'ok. ', before: 'przed ', after: 'po ' }
}

/** Human-readable date, e.g. EN `about May 1890`, PL `ok. maja 1890`, `12 maja 1890`. */
export function formatFuzzyDate(date: FuzzyDate, language: DateLanguage): string {
  const { year, month, day } = dateParts(date)
  const q = QUALIFIER_LABEL[language][date.qualifier]
  if (month === undefined) return `${q}${year}`
  const idx = month - 1
  if (language === 'pl') {
    if (day !== undefined) return `${q}${day} ${PL_MONTHS.gen.split(' ')[idx]} ${year}`
    const kase = { exact: 'nom', about: 'gen', before: 'ins', after: 'loc' } as const
    return `${q}${PL_MONTHS[kase[date.qualifier]].split(' ')[idx]} ${year}`
  }
  if (day !== undefined) return `${q}${day} ${EN_MONTHS[idx]} ${year}`
  return `${q}${EN_MONTHS[idx]} ${year}`
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
