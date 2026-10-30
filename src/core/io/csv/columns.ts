import type { Sex } from '../../model/types'

/** CSV columns as specified in docs/developer/reference/csv-format.md, in export order. */
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

/** Languages with their own column names and values (header row, sex, living). */
export const HEADER_LANGUAGES = ['en', 'pl', 'de', 'fr', 'es', 'it', 'pt', 'ru'] as const
export type HeaderLanguage = (typeof HEADER_LANGUAGES)[number]

/** Header language for a UI language (English where there is no own header set). */
export const headerLanguage = (language: string): HeaderLanguage =>
  (HEADER_LANGUAGES as readonly string[]).includes(language) ? (language as HeaderLanguage) : 'en'

/** Delimiter Excel expects in each language: `;` where the decimal separator is a comma. */
export const csvDelimiterOf = (language: HeaderLanguage): ',' | ';' =>
  language === 'en' ? ',' : ';'

/**
 * Header row written on export, per language. Latin-script names are ASCII without
 * diacritics, so they survive any spreadsheet; Russian names are Cyrillic (the file has a BOM).
 */
export const HEADERS: Record<HeaderLanguage, Record<CsvColumn, string>> = {
  en: Object.fromEntries(CSV_COLUMNS.map((c) => [c, c])) as Record<CsvColumn, string>,
  pl: {
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
  },
  de: {
    id: 'id',
    given_names: 'vornamen',
    surname: 'nachname',
    birth_surname: 'geburtsname',
    sex: 'geschlecht',
    birth_date: 'geburtsdatum',
    birth_place: 'geburtsort',
    death_date: 'sterbedatum',
    death_place: 'sterbeort',
    living: 'lebend',
    father_id: 'vater_id',
    mother_id: 'mutter_id',
    partner_ids: 'partner_ids',
    notes: 'notizen'
  },
  fr: {
    id: 'id',
    given_names: 'prenoms',
    surname: 'nom',
    birth_surname: 'nom_de_naissance',
    sex: 'sexe',
    birth_date: 'date_de_naissance',
    birth_place: 'lieu_de_naissance',
    death_date: 'date_de_deces',
    death_place: 'lieu_de_deces',
    living: 'vivant',
    father_id: 'pere_id',
    mother_id: 'mere_id',
    partner_ids: 'partenaires_id',
    notes: 'notes'
  },
  es: {
    id: 'id',
    given_names: 'nombres',
    surname: 'apellidos',
    birth_surname: 'apellidos_de_nacimiento',
    sex: 'sexo',
    birth_date: 'fecha_de_nacimiento',
    birth_place: 'lugar_de_nacimiento',
    death_date: 'fecha_de_defuncion',
    death_place: 'lugar_de_defuncion',
    living: 'vivo',
    father_id: 'padre_id',
    mother_id: 'madre_id',
    partner_ids: 'parejas_id',
    notes: 'notas'
  },
  it: {
    id: 'id',
    given_names: 'nomi',
    surname: 'cognome',
    birth_surname: 'cognome_di_nascita',
    sex: 'sesso',
    birth_date: 'data_di_nascita',
    birth_place: 'luogo_di_nascita',
    death_date: 'data_di_morte',
    death_place: 'luogo_di_morte',
    living: 'vivente',
    father_id: 'padre_id',
    mother_id: 'madre_id',
    partner_ids: 'partner_id',
    notes: 'note'
  },
  pt: {
    id: 'id',
    given_names: 'nomes',
    surname: 'sobrenome',
    birth_surname: 'sobrenome_de_nascimento',
    sex: 'sexo',
    birth_date: 'data_de_nascimento',
    birth_place: 'local_de_nascimento',
    death_date: 'data_de_falecimento',
    death_place: 'local_de_falecimento',
    living: 'vivo',
    father_id: 'pai_id',
    mother_id: 'mae_id',
    partner_ids: 'parceiros_id',
    notes: 'notas'
  },
  ru: {
    id: 'id',
    given_names: 'имя',
    surname: 'фамилия',
    birth_surname: 'фамилия_при_рождении',
    sex: 'пол',
    birth_date: 'дата_рождения',
    birth_place: 'место_рождения',
    death_date: 'дата_смерти',
    death_place: 'место_смерти',
    living: 'жив',
    father_id: 'отец_id',
    mother_id: 'мать_id',
    partner_ids: 'партнёры_id',
    notes: 'заметки'
  }
}

/** Polish header row (kept for existing callers). */
export const POLISH_HEADERS = HEADERS.pl

/**
 * Further spellings accepted on import, besides every language's header. Headers are compared
 * after folding case and diacritics, with spaces and hyphens read as `_`.
 */
const EXTRA_ALIASES: Record<CsvColumn, string[]> = {
  id: ['identyfikator', 'identifiant', 'identificador', 'identificativo', 'идентификатор'],
  given_names: [
    'given name',
    'first name',
    'imie',
    'vorname',
    'prenom',
    'nombre',
    'nome',
    'nome proprio',
    'nomes proprios',
    'имена',
    'имя_отчество'
  ],
  surname: [
    'last name',
    'family name',
    'familienname',
    'nom de famille',
    'apellido',
    'apelido',
    'apelidos',
    'cognomi'
  ],
  birth_surname: [
    'maiden name',
    'nazwisko rodowe',
    'maedchenname',
    'madchenname',
    'nom de jeune fille',
    'apellido de soltera',
    'cognome da nubile',
    'nome de solteira',
    'apelido de solteira',
    'девичья_фамилия'
  ],
  sex: ['gender', 'genre', 'genero', 'genere'],
  birth_date: ['born', 'geboren', 'nacimiento', 'nato', 'nascimento', 'родился'],
  birth_place: [],
  death_date: [
    'died',
    'gestorben',
    'todesdatum',
    'decede',
    'fecha de muerte',
    'morto',
    'data do obito',
    'умер'
  ],
  death_place: ['todesort', 'lugar de muerte', 'local do obito'],
  living: ['alive', 'lebt', 'en vie', 'vivante', 'viva', 'vive', 'в_живых'],
  father_id: ['father', 'ojciec', 'vater', 'pere', 'padre', 'pai', 'отец'],
  mother_id: ['mother', 'matka', 'mutter', 'mere', 'madre', 'mae', 'мать'],
  partner_ids: [
    'partners',
    'spouse_ids',
    'partnerzy',
    'malzonkowie',
    'ehepartner',
    'conjoints',
    'conyuges',
    'coniugi',
    'conjuges',
    'супруги'
  ],
  notes: [
    'note',
    'uwagi',
    'bemerkungen',
    'remarques',
    'observaciones',
    'osservazioni',
    'observacoes',
    'примечания'
  ]
}

/** Every spelling accepted on import for each column. */
export const HEADER_ALIASES: Record<CsvColumn, string[]> = Object.fromEntries(
  CSV_COLUMNS.map((c) => [
    c,
    [...new Set([...HEADER_LANGUAGES.map((l) => HEADERS[l][c]), ...EXTRA_ALIASES[c]])]
  ])
) as Record<CsvColumn, string[]>

/** Values of the `sex` column written on export, per language. */
export const SEX_VALUES: Record<HeaderLanguage, Record<Sex, string>> = {
  en: { female: 'female', male: 'male', other: 'other', unknown: 'unknown' },
  pl: { female: 'kobieta', male: 'mężczyzna', other: 'inna', unknown: 'nieznana' },
  de: { female: 'weiblich', male: 'männlich', other: 'divers', unknown: 'unbekannt' },
  fr: { female: 'femme', male: 'homme', other: 'autre', unknown: 'inconnu' },
  es: { female: 'mujer', male: 'hombre', other: 'otro', unknown: 'desconocido' },
  it: { female: 'donna', male: 'uomo', other: 'altro', unknown: 'sconosciuto' },
  pt: { female: 'mulher', male: 'homem', other: 'outro', unknown: 'desconhecido' },
  ru: { female: 'женщина', male: 'мужчина', other: 'другой', unknown: 'неизвестно' }
}

/** Further `sex` values accepted on import (abbreviations, other word forms). */
const EXTRA_SEX_WORDS: Record<Sex, string[]> = {
  female: [
    'f',
    'k',
    'w',
    'ж',
    'woman',
    'frau',
    'feminin',
    'femenino',
    'femmina',
    'feminino',
    'женский'
  ],
  male: ['m', 'h', 'м', 'man', 'mann', 'masculin', 'masculino', 'varon', 'maschio', 'мужской'],
  other: ['inny', 'andere', 'anderes', 'otra', 'outra', 'другое'],
  unknown: ['?', '', 'nieznany', 'inconnue', 'desconocida', 'sconosciuta', 'desconhecida']
}

/** Values of the `living` column written on export, per language. */
export const LIVING_VALUES: Record<HeaderLanguage, { yes: string; no: string }> = {
  en: { yes: 'true', no: 'false' },
  pl: { yes: 'tak', no: 'nie' },
  de: { yes: 'ja', no: 'nein' },
  fr: { yes: 'oui', no: 'non' },
  es: { yes: 'sí', no: 'no' },
  it: { yes: 'sì', no: 'no' },
  pt: { yes: 'sim', no: 'não' },
  ru: { yes: 'да', no: 'нет' }
}

const EXTRA_LIVING_WORDS = {
  yes: ['yes', 'y', 't', '1', 'j'],
  no: ['no', 'n', '0']
}

/** Every accepted `sex` value (unfolded) with its meaning. */
export function sexWords(): [string, Sex][] {
  return [
    ...HEADER_LANGUAGES.flatMap((l) =>
      Object.entries(SEX_VALUES[l]).map(([sex, word]): [string, Sex] => [word, sex as Sex])
    ),
    ...Object.entries(EXTRA_SEX_WORDS).flatMap(([sex, words]) =>
      words.map((w): [string, Sex] => [w, sex as Sex])
    )
  ]
}

/** Every accepted `living` value (unfolded) with its meaning. */
export function livingWords(): [string, boolean][] {
  return [
    ...HEADER_LANGUAGES.flatMap((l): [string, boolean][] => [
      [LIVING_VALUES[l].yes, true],
      [LIVING_VALUES[l].no, false]
    ]),
    ...EXTRA_LIVING_WORDS.yes.map((w): [string, boolean] => [w, true]),
    ...EXTRA_LIVING_WORDS.no.map((w): [string, boolean] => [w, false])
  ]
}

/** Separator for several values in one cell (e.g. partner ids). */
export const MULTI_SEPARATOR = '|'
