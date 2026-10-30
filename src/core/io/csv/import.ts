import { checkTreeDates } from '../../date/plausibility'
import { parseFuzzyDate } from '../../date/fuzzyDate'
import type { Issue } from '../../issues'
import { newId } from '../../model/ids'
import { createEmptyTree } from '../../model/tree'
import { validateTree } from '../../model/validate'
import type { FamilyTree, FuzzyDate, Person, PersonId, Relationship, Sex } from '../../model/types'
import { foldText } from '../../text'
import {
  CSV_COLUMNS,
  HEADER_ALIASES,
  livingWords,
  MULTI_SEPARATOR,
  sexWords,
  type CsvColumn
} from './columns'

export type CsvDelimiter = ',' | ';' | '\t'

const stripBom = (text: string): string => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text)

/** RFC 4180 parser (quoted fields, escaped quotes, CRLF/LF, line breaks inside quotes). */
export function parseCsv(text: string, delimiter: CsvDelimiter): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let i = 0
  const src = stripBom(text)
  while (i < src.length) {
    const c = src[i]!
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        quoted = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"' && field === '') {
      quoted = true
      i++
    } else if (c === delimiter) {
      row.push(field)
      field = ''
      i++
    } else if (c === '\r' || c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i += c === '\r' && src[i + 1] === '\n' ? 2 : 1
    } else {
      field += c
      i++
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** Picks `,`, `;` or tab by counting them (outside quotes) in the first non-empty line. */
export function detectDelimiter(text: string): CsvDelimiter {
  const src = stripBom(text)
  const counts: Record<CsvDelimiter, number> = { ',': 0, ';': 0, '\t': 0 }
  let quoted = false
  for (const c of src) {
    if (c === '"') quoted = !quoted
    else if (!quoted && (c === '\n' || c === '\r')) {
      if (counts[','] + counts[';'] + counts['\t'] > 0) break
    } else if (!quoted && c in counts) counts[c as CsvDelimiter]++
  }
  if (counts[';'] > counts[','] && counts[';'] >= counts['\t']) return ';'
  if (counts['\t'] > counts[','] && counts['\t'] > counts[';']) return '\t'
  return ','
}

const normaliseHeader = (h: string): string =>
  foldText(h)
    .trim()
    .replace(/[\s-]+/g, '_')

/** Maps each header to a known column (or `null` = ignored). */
export function mapHeaders(headers: string[]): (CsvColumn | null)[] {
  const used = new Set<CsvColumn>()
  return headers.map((h) => {
    const key = normaliseHeader(h)
    const column = CSV_COLUMNS.find(
      (c) => !used.has(c) && HEADER_ALIASES[c].some((alias) => normaliseHeader(alias) === key)
    )
    if (column) used.add(column)
    return column ?? null
  })
}

const SEX_WORDS: Record<string, Sex> = Object.fromEntries(
  sexWords().map(([word, sex]) => [foldText(word), sex])
)

const LIVING_WORDS: Record<string, boolean> = Object.fromEntries(
  livingWords().map(([word, living]) => [foldText(word), living])
)

export interface CsvImportOptions {
  delimiter?: CsvDelimiter
  /** Overrides the automatic header mapping (same length as the header row). */
  mapping?: (CsvColumn | null)[]
  /** Name for the new tree. */
  name?: string
  now?: Date
}

export interface CsvImportResult {
  tree: FamilyTree
  errors: Issue[]
  warnings: Issue[]
  delimiter: CsvDelimiter
  headers: string[]
  mapping: (CsvColumn | null)[]
  /** Data rows as parsed (for the preview). */
  rows: string[][]
  stats: { people: number; relationships: number }
}

/**
 * Imports CSV text into a new tree per docs/developer/reference/csv-format.md. Never throws for bad input:
 * problems are returned as `errors` (block the import) and `warnings` (may be accepted).
 * Issue rows are spreadsheet line numbers (the header is line 1).
 */
export function importCsv(text: string, options: CsvImportOptions = {}): CsvImportResult {
  const delimiter = options.delimiter ?? detectDelimiter(text)
  const all = parseCsv(text, delimiter)
  const errors: Issue[] = []
  const warnings: Issue[] = []
  const now = options.now ?? new Date()
  const timestamp = now.toISOString()
  const tree = createEmptyTree(options.name ?? 'Import', now)
  const headerRow = all.find((r) => r.some((c) => c.trim() !== '')) ?? []
  const headerIndex = all.indexOf(headerRow)
  const headers = headerRow.map((h) => h.trim())
  const mapping = options.mapping ?? mapHeaders(headers)
  const dataRows = all.slice(headerIndex + 1)
  const result = (): CsvImportResult => ({
    tree,
    errors,
    warnings,
    delimiter,
    headers,
    mapping,
    rows: dataRows.filter((r) => r.some((c) => c.trim() !== '')),
    stats: {
      people: Object.keys(tree.persons).length,
      relationships: Object.keys(tree.relationships).length
    }
  })

  if (!headers.length) {
    errors.push({ severity: 'error', code: 'empty-file' })
    return result()
  }
  headers.forEach((h, i) => {
    if (!mapping[i] && h)
      warnings.push({ severity: 'warning', code: 'unknown-column', params: { column: h } })
  })
  const col = new Map<CsvColumn, number>()
  mapping.forEach((c, i) => c && col.set(c, i))
  if (!col.has('id')) {
    errors.push({ severity: 'error', code: 'missing-id-column' })
    return result()
  }
  if (!col.has('given_names') && !col.has('surname')) {
    errors.push({ severity: 'error', code: 'missing-name-column' })
    return result()
  }

  interface Pending {
    line: number
    person: Person
    father: string
    mother: string
    partners: string[]
  }
  const byCsvId = new Map<string, Pending>()
  const pending: Pending[] = []

  dataRows.forEach((cells, index) => {
    const line = headerIndex + index + 2
    if (!cells.some((c) => c.trim() !== '')) return
    const get = (c: CsvColumn): string => (col.has(c) ? (cells[col.get(c)!] ?? '').trim() : '')
    const raw = (c: CsvColumn): string => (col.has(c) ? (cells[col.get(c)!] ?? '') : '')
    const csvId = get('id')
    if (!csvId) {
      errors.push({ severity: 'error', code: 'missing-id', row: line })
      return
    }
    if (byCsvId.has(csvId)) {
      errors.push({ severity: 'error', code: 'duplicate-id', row: line, params: { id: csvId } })
      return
    }
    const givenNames = get('given_names')
    const surname = get('surname')
    if (!givenNames && !surname) {
      errors.push({ severity: 'error', code: 'row-without-name', row: line, params: { id: csvId } })
      return
    }
    const extraNotes: string[] = []
    const date = (c: CsvColumn): FuzzyDate | undefined => {
      const value = get(c)
      if (!value) return undefined
      const parsed = parseFuzzyDate(value)
      if (!parsed) {
        warnings.push({
          severity: 'warning',
          code: 'invalid-date',
          row: line,
          field: c,
          params: { value }
        })
        extraNotes.push(`${c}: ${value}`)
        return undefined
      }
      return parsed
    }
    const sexText = foldText(get('sex'))
    let sex: Sex = 'unknown'
    if (sexText in SEX_WORDS) sex = SEX_WORDS[sexText]!
    else
      warnings.push({
        severity: 'warning',
        code: 'invalid-sex',
        row: line,
        params: { value: get('sex') }
      })
    const livingText = foldText(get('living'))
    let living: boolean | undefined
    if (livingText in LIVING_WORDS) living = LIVING_WORDS[livingText]
    else if (livingText)
      warnings.push({
        severity: 'warning',
        code: 'invalid-living',
        row: line,
        params: { value: get('living') }
      })

    const birthDate = date('birth_date')
    const deathDate = date('death_date')
    const birthPlace = get('birth_place')
    const deathPlace = get('death_place')
    const notes = [raw('notes').replace(/\r\n/g, '\n').trim(), ...extraNotes]
      .filter(Boolean)
      .join('\n')
    const person: Person = {
      id: newId(),
      givenNames,
      surname,
      sex,
      events: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(get('birth_surname') ? { birthSurname: get('birth_surname') } : {}),
      ...(birthDate || birthPlace
        ? {
            birth: {
              ...(birthDate ? { date: birthDate } : {}),
              ...(birthPlace ? { place: birthPlace } : {})
            }
          }
        : {}),
      ...(deathDate || deathPlace
        ? {
            death: {
              ...(deathDate ? { date: deathDate } : {}),
              ...(deathPlace ? { place: deathPlace } : {})
            }
          }
        : {}),
      ...(living !== undefined ? { living } : {}),
      ...(notes ? { notes } : {})
    }
    const entry: Pending = {
      line,
      person,
      father: get('father_id'),
      mother: get('mother_id'),
      partners: get('partner_ids')
        .split(MULTI_SEPARATOR)
        .map((s) => s.trim())
        .filter(Boolean)
    }
    byCsvId.set(csvId, entry)
    pending.push(entry)
    tree.persons[person.id] = person
  })

  const lineOf = new Map<PersonId, number>(pending.map((p) => [p.person.id, p.line]))
  const pairs = new Set<string>()
  const add = (r: Relationship): void => {
    tree.relationships[r.id] = r
  }
  for (const [csvId, entry] of byCsvId) {
    const resolve = (ref: string, field: CsvColumn): Pending | undefined => {
      if (!ref) return undefined
      if (ref === csvId) {
        errors.push({
          severity: 'error',
          code: 'self-reference',
          row: entry.line,
          field,
          params: { id: ref }
        })
        return undefined
      }
      const target = byCsvId.get(ref)
      if (!target)
        errors.push({
          severity: 'error',
          code: 'unknown-reference',
          row: entry.line,
          field,
          params: { id: ref }
        })
      return target
    }
    const father = resolve(entry.father, 'father_id')
    const mother = resolve(entry.mother, 'mother_id')
    if (father && mother && father === mother) {
      errors.push({
        severity: 'error',
        code: 'same-parents',
        row: entry.line,
        params: { id: entry.father }
      })
    } else {
      for (const parent of [father, mother]) {
        if (parent) {
          add({
            id: newId(),
            type: 'parent-child',
            parentId: parent.person.id,
            childId: entry.person.id,
            kind: 'biological'
          })
        }
      }
    }
    for (const ref of entry.partners) {
      const partner = resolve(ref, 'partner_ids')
      if (!partner) continue
      const key = [entry.person.id, partner.person.id].sort().join('|')
      if (pairs.has(key)) continue
      pairs.add(key)
      add({
        id: newId(),
        type: 'partnership',
        partnerIds: [entry.person.id, partner.person.id],
        kind: 'marriage'
      })
    }
  }

  // Structural problems (cycles) and soft date warnings, reported with their rows.
  for (const issue of validateTree(tree)) {
    if (issue.code === 'ancestry-cycle') {
      errors.push({ ...issue, row: issue.personId ? lineOf.get(issue.personId) : undefined })
    }
  }
  for (const issue of checkTreeDates(tree, now)) {
    warnings.push({ ...issue, row: issue.personId ? lineOf.get(issue.personId) : undefined })
  }
  errors.sort((a, b) => (a.row ?? 0) - (b.row ?? 0))
  warnings.sort((a, b) => (a.row ?? 0) - (b.row ?? 0))
  return result()
}
