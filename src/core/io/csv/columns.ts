/** CSV columns as specified in docs/CSV_FORMAT.md, in export order. */
export const CSV_COLUMNS = [
  'id',
  'given_names',
  'surname',
  'birth_surname',
  'sex',
  'birth_date',
  'birth_place',
  'death_date',
  'death_place',
  'living',
  'father_id',
  'mother_id',
  'partner_ids',
  'notes'
] as const

export type CsvColumn = (typeof CSV_COLUMNS)[number]
export type HeaderLanguage = 'en' | 'pl'

/** Polish header written on export (ASCII, so it survives any spreadsheet). */
export const POLISH_HEADERS: Record<CsvColumn, string> = {
  id: 'id',
  given_names: 'imiona',
  surname: 'nazwisko',
  birth_surname: 'nazwisko_rodowe',
  sex: 'plec',
  birth_date: 'data_urodzenia',
  birth_place: 'miejsce_urodzenia',
  death_date: 'data_smierci',
  death_place: 'miejsce_smierci',
  living: 'zyje',
  father_id: 'ojciec_id',
  mother_id: 'matka_id',
  partner_ids: 'partnerzy_id',
  notes: 'notatki'
}

/** Extra spellings accepted on import (compared after folding case and diacritics). */
export const HEADER_ALIASES: Record<CsvColumn, string[]> = {
  id: ['id', 'identyfikator'],
  given_names: [
    'given_names',
    'given name',
    'given names',
    'first name',
    'first_name',
    'imiona',
    'imie'
  ],
  surname: ['surname', 'last name', 'last_name', 'family name', 'nazwisko'],
  birth_surname: [
    'birth_surname',
    'maiden name',
    'maiden_name',
    'nazwisko_rodowe',
    'nazwisko rodowe'
  ],
  sex: ['sex', 'gender', 'plec'],
  birth_date: ['birth_date', 'birth date', 'born', 'data_urodzenia', 'data urodzenia'],
  birth_place: ['birth_place', 'birth place', 'miejsce_urodzenia', 'miejsce urodzenia'],
  death_date: ['death_date', 'death date', 'died', 'data_smierci', 'data smierci'],
  death_place: ['death_place', 'death place', 'miejsce_smierci', 'miejsce smierci'],
  living: ['living', 'alive', 'zyje'],
  father_id: ['father_id', 'father', 'ojciec_id', 'ojciec'],
  mother_id: ['mother_id', 'mother', 'matka_id', 'matka'],
  partner_ids: [
    'partner_ids',
    'partners',
    'spouse_ids',
    'partnerzy_id',
    'partnerzy',
    'malzonkowie'
  ],
  notes: ['notes', 'note', 'notatki', 'uwagi']
}

/** Separator for several values in one cell (e.g. partner ids). */
export const MULTI_SEPARATOR = '|'
