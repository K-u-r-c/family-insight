import type { DateQualifier, FuzzyDate } from '../../model/types'

/**
 * GEDCOM dates → fuzzy dates. Exact dates, `ABT`/`CAL`/`EST`, `BEF`, `AFT` map directly;
 * ranges and periods (`BET … AND …`, `FROM … TO …`) give a start and an end; phrases and other
 * calendars can't be represented exactly and are reported as lossy with the original text.
 */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export interface GedcomDate {
  date?: FuzzyDate
  /** End of a period or range (`FROM 1914 TO 1918`, `BET 1900 AND 1910`). */
  endDate?: FuzzyDate
  /** The value couldn't be represented exactly; keep `original` somewhere (notes). */
  lossy?: boolean
  original: string
}

const pad = (n: number): string => String(n).padStart(2, '0')

/** `4 NOV 1925`, `NOV 1925`, `1925`, `1700/01` (dual year), optionally `BC` → ISO prefix. */
function parseSimple(text: string): { value: string; lossy: boolean } | null {
  const t = text.trim().toUpperCase()
  const m = /^(?:(\d{1,2})\s+)?(?:([A-Z]{3})\s+)?(\d{3,4})(?:\/(\d{1,4}))?(\s+B\.?C\.?)?$/.exec(t)
  if (!m) return null
  if (m[5]) return null // dates before Christ aren't supported
  const day = m[1] ? Number(m[1]) : undefined
  const month = m[2] ? MONTHS.indexOf(m[2]) + 1 : undefined
  if (m[2] && !month) return null
  if (day && !month) return null
  const year = Number(m[3])
  if (day !== undefined && (day < 1 || day > 31)) return null
  let value = String(year).padStart(4, '0')
  if (month) value += `-${pad(month)}`
  if (day) value += `-${pad(day)}`
  // A dual year (1700/01) is reported as the first year, which is how it was written.
  return { value, lossy: Boolean(m[4]) }
}

export function parseGedcomDate(raw: string | undefined): GedcomDate | null {
  if (!raw?.trim()) return null
  const original = raw.trim()
  let text = original
  let lossy = false
  // Calendar escapes: Gregorian is the default; others can't be converted reliably.
  const calendar = /^@#D([A-Z ]+)@\s*/i.exec(text)
  if (calendar) {
    if (!/GREGORIAN/i.test(calendar[1]!)) lossy = true
    text = text.slice(calendar[0].length)
  }
  // GEDCOM 7 calendar names.
  const cal7 = /^(GREGORIAN|JULIAN|HEBREW|FRENCH_R)\s+/i.exec(text)
  if (cal7) {
    if (cal7[1]!.toUpperCase() !== 'GREGORIAN') lossy = true
    text = text.slice(cal7[0].length)
  }
  // A phrase in parentheses: 5.5 `(…)` alone, or `INT date (…)`.
  const phrase = /\(([^)]*)\)\s*$/.exec(text)
  if (phrase) text = text.slice(0, phrase.index).trim()
  const upper = text.toUpperCase()
  if (upper.startsWith('INT ')) {
    text = text.slice(4)
    lossy = true
  }
  if (!text) return { original, lossy: true }

  const single = (q: DateQualifier, s: string): GedcomDate | null => {
    const d = parseSimple(s)
    return d ? { date: { value: d.value, qualifier: q }, lossy: lossy || d.lossy, original } : null
  }
  const range = /^(BET|FROM)\s+(.+?)\s+(AND|TO)\s+(.+)$/i.exec(text)
  if (range) {
    const a = parseSimple(range[2]!)
    const b = parseSimple(range[4]!)
    if (!a || !b) return { original, lossy: true }
    const between = range[1]!.toUpperCase() === 'BET'
    return {
      date: { value: a.value, qualifier: between ? 'after' : 'exact' },
      endDate: { value: b.value, qualifier: between ? 'before' : 'exact' },
      lossy: lossy || a.lossy || b.lossy,
      original
    }
  }
  const prefixed = /^(ABT|CAL|EST|BEF|AFT|FROM|TO)\.?\s+(.+)$/i.exec(text)
  if (prefixed) {
    const p = prefixed[1]!.toUpperCase()
    const q: DateQualifier =
      p === 'BEF' || p === 'TO' ? 'before' : p === 'AFT' || p === 'FROM' ? 'after' : 'about'
    const parsed = single(q, prefixed[2]!)
    // `FROM 1914` (no end) and `TO 1918` are periods; as single dates they are approximations.
    if (parsed && (p === 'FROM' || p === 'TO')) parsed.lossy = true
    return parsed ?? { original, lossy: true }
  }
  return single('exact', text) ?? { original, lossy: true }
}

/** Fuzzy date → GEDCOM date (`ABT 1890`, `4 NOV 1925`); months are always English. */
export function formatGedcomDate(date: FuzzyDate): string {
  const [y, m, d] = date.value.split('-')
  const parts = [d ? String(Number(d)) : '', m ? MONTHS[Number(m) - 1]! : '', y!]
  const simple = parts.filter(Boolean).join(' ')
  const prefix = { exact: '', about: 'ABT ', before: 'BEF ', after: 'AFT ' }[date.qualifier]
  return prefix + simple
}

/** A period or range for events with an end date. */
export function formatGedcomPeriod(start: FuzzyDate | undefined, end: FuzzyDate): string {
  if (!start) return `TO ${formatGedcomDate({ ...end, qualifier: 'exact' })}`
  return `FROM ${formatGedcomDate({ ...start, qualifier: 'exact' })} TO ${formatGedcomDate({ ...end, qualifier: 'exact' })}`
}
