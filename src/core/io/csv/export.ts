import { compareFuzzyDates, serializeFuzzyDate } from '../../date/fuzzyDate'
import { compareText } from '../../text'
import type { FamilyTree, ParentChildRelationship, Person, PersonId, Sex } from '../../model/types'
import {
  CSV_COLUMNS,
  MULTI_SEPARATOR,
  POLISH_HEADERS,
  type CsvColumn,
  type HeaderLanguage
} from './columns'

/** Byte order mark: makes Excel read the file as UTF-8 (Polish letters intact). */
export const BOM = String.fromCharCode(0xfeff)

export type Delimiter = ',' | ';'

export interface CsvExportOptions {
  delimiter?: Delimiter
  headerLanguage?: HeaderLanguage
}

const SEX_PL: Record<Sex, string> = {
  female: 'kobieta',
  male: 'mężczyzna',
  other: 'inna',
  unknown: 'nieznana'
}

/** RFC 4180 field quoting. */
export function quoteField(value: string, delimiter: string): string {
  return value.includes(delimiter) || /["\r\n]/.test(value)
    ? `"${value.replace(/"/g, '""')}"`
    : value
}

/**
 * Assigns biological parents to the father/mother columns: men to father, women to mother,
 * everyone else (and any surplus) to whichever slot is free, father first.
 */
export function parentSlots(parents: Person[]): { father?: PersonId; mother?: PersonId } {
  const slots: { father?: PersonId; mother?: PersonId } = {}
  const rest: Person[] = []
  for (const p of parents) {
    if (p.sex === 'male' && !slots.father) slots.father = p.id
    else if (p.sex === 'female' && !slots.mother) slots.mother = p.id
    else rest.push(p)
  }
  for (const p of rest) {
    if (!slots.father) slots.father = p.id
    else if (!slots.mother) slots.mother = p.id
  }
  return slots
}

/** Exports a tree as CSV text (UTF-8 BOM, CRLF line endings) per docs/CSV_FORMAT.md. */
export function exportCsv(tree: FamilyTree, options: CsvExportOptions = {}): string {
  const delimiter = options.delimiter ?? ','
  const lang = options.headerLanguage ?? 'en'
  const language = lang === 'pl' ? 'pl' : 'en'

  // Rows: oldest first, then by surname/given name; short readable ids p1, p2, …
  const people = Object.values(tree.persons).sort(
    (a, b) =>
      compareFuzzyDates(a.birth?.date, b.birth?.date) ||
      compareText(a.surname, b.surname, language) ||
      compareText(a.givenNames, b.givenNames, language) ||
      (a.id < b.id ? -1 : 1)
  )
  const csvId = new Map(people.map((p, i) => [p.id, `p${i + 1}`]))

  const bioParents = new Map<PersonId, Person[]>()
  const partners = new Map<PersonId, { id: PersonId; start?: string }[]>()
  for (const r of Object.values(tree.relationships)) {
    if (r.type === 'parent-child') {
      if ((r as ParentChildRelationship).kind !== 'biological') continue
      const parent = tree.persons[r.parentId]
      if (parent) bioParents.set(r.childId, [...(bioParents.get(r.childId) ?? []), parent])
    } else {
      const [a, b] = r.partnerIds
      const start = r.start?.date?.value
      partners.set(a, [...(partners.get(a) ?? []), { id: b, start }])
      partners.set(b, [...(partners.get(b) ?? []), { id: a, start }])
    }
  }

  const header = CSV_COLUMNS.map((c) => (lang === 'pl' ? POLISH_HEADERS[c] : c))
  const lines = [header.join(delimiter)]
  for (const p of people) {
    const slots = parentSlots(bioParents.get(p.id) ?? [])
    const partnerIds = (partners.get(p.id) ?? [])
      .sort((a, b) => (a.start ?? '9999').localeCompare(b.start ?? '9999'))
      .map((x) => csvId.get(x.id))
      .filter(Boolean)
      .join(MULTI_SEPARATOR)
    const living =
      p.living === undefined ? '' : lang === 'pl' ? (p.living ? 'tak' : 'nie') : String(p.living)
    const row: Record<CsvColumn, string> = {
      id: csvId.get(p.id)!,
      given_names: p.givenNames,
      surname: p.surname,
      birth_surname: p.birthSurname ?? '',
      sex: lang === 'pl' ? SEX_PL[p.sex] : p.sex,
      birth_date: p.birth?.date ? serializeFuzzyDate(p.birth.date) : '',
      birth_place: p.birth?.place ?? '',
      death_date: p.death?.date ? serializeFuzzyDate(p.death.date) : '',
      death_place: p.death?.place ?? '',
      living,
      father_id: slots.father ? csvId.get(slots.father)! : '',
      mother_id: slots.mother ? csvId.get(slots.mother)! : '',
      partner_ids: partnerIds,
      notes: p.notes ?? ''
    }
    lines.push(CSV_COLUMNS.map((c) => quoteField(row[c], delimiter)).join(delimiter))
  }
  return `${BOM}${lines.join('\r\n')}\r\n`
}
