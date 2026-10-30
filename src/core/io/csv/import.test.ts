import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { decodeText } from '../../file/encoding'
import { displayName, getParents, getPartners } from '../../model/tree'
import type { FamilyTree, Person } from '../../model/types'
import { foldText } from '../../text'
import {
  CSV_COLUMNS,
  HEADER_ALIASES,
  HEADER_LANGUAGES,
  HEADERS,
  LIVING_VALUES,
  livingWords,
  SEX_VALUES,
  sexWords
} from './columns'
import { detectDelimiter, importCsv, mapHeaders, parseCsv } from './import'

const NOW = new Date('2026-01-01T00:00:00Z')
const H =
  'id,given_names,surname,birth_surname,sex,birth_date,birth_place,death_date,death_place,living,father_id,mother_id,partner_ids,notes'

function byName(tree: FamilyTree, name: string): Person {
  const p = Object.values(tree.persons).find((x) => displayName(x) === name)
  if (!p) throw new Error(`no ${name}`)
  return p
}
const codes = (issues: { code: string; row?: number }[]): string[] =>
  issues.map((i) => `${i.code}@${i.row ?? '-'}`)

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, delimiters and line breaks inside quotes', () => {
    expect(parseCsv('a,"b,c","say ""hi"""\r\n"multi\nline",x,\n', ',')).toEqual([
      ['a', 'b,c', 'say "hi"'],
      ['multi\nline', 'x', '']
    ])
    expect(parseCsv('a;b\n1;2', ';')).toEqual([
      ['a', 'b'],
      ['1', '2']
    ])
  })

  it('detects the delimiter', () => {
    expect(detectDelimiter('id;imiona;nazwisko\n1;Jan;"Kowalski, J"')).toBe(';')
    expect(detectDelimiter('id,given_names\n1,"a;b"')).toBe(',')
    expect(detectDelimiter('id\tname\n1\tJan')).toBe('\t')
  })

  it('maps English and Polish headers, case- and diacritics-insensitively', () => {
    expect(
      mapHeaders(['ID', 'Imiona', 'Nazwisko', 'Płeć', 'Data śmierci', 'Żyje', 'whatever'])
    ).toEqual(['id', 'given_names', 'surname', 'sex', 'death_date', 'living', null])
  })

  it.each(HEADER_LANGUAGES.map((l) => [l]))('maps the %s header row', (language) => {
    const headers = CSV_COLUMNS.map((c) => HEADERS[language][c].toUpperCase())
    expect(mapHeaders(headers)).toEqual([...CSV_COLUMNS])
  })

  it('maps common header spellings in other languages', () => {
    expect(
      mapHeaders(['Vorname', 'Familienname', 'Mädchenname', 'Geschlecht', 'Geburtsdatum'])
    ).toEqual(['given_names', 'surname', 'birth_surname', 'sex', 'birth_date'])
    expect(mapHeaders(['Prénom', 'Nom de famille', 'Date de décès', 'Lieu de décès'])).toEqual([
      'given_names',
      'surname',
      'death_date',
      'death_place'
    ])
    expect(mapHeaders(['Nombre', 'Apellidos', 'Fecha de nacimiento', 'Padre', 'Madre'])).toEqual([
      'given_names',
      'surname',
      'birth_date',
      'father_id',
      'mother_id'
    ])
    expect(mapHeaders(['Nome', 'Cognome', 'Luogo di nascita', 'Note'])).toEqual([
      'given_names',
      'surname',
      'birth_place',
      'notes'
    ])
    expect(mapHeaders(['Nomes', 'Apelido', 'Mãe', 'Pai'])).toEqual([
      'given_names',
      'surname',
      'mother_id',
      'father_id'
    ])
    expect(
      mapHeaders(['Имя', 'Фамилия', 'Девичья фамилия', 'Дата рождения', 'Партнеры id'])
    ).toEqual(['given_names', 'surname', 'birth_surname', 'birth_date', 'partner_ids'])
  })

  it('never maps one spelling to two columns', () => {
    const owner = new Map<string, string>()
    for (const column of CSV_COLUMNS) {
      for (const alias of HEADER_ALIASES[column]) {
        const key = foldText(alias)
          .trim()
          .replace(/[\s-]+/g, '_')
        expect(owner.get(key) ?? column, `${alias}: ${owner.get(key)} and ${column}`).toBe(column)
        owner.set(key, column)
      }
    }
  })
})

describe('csv-format.md', () => {
  const doc = readFileSync(
    join(__dirname, '../../../../docs/developer/reference/csv-format.md'),
    'utf8'
  )
  it('lists every header and value of every language', () => {
    for (const language of HEADER_LANGUAGES) {
      for (const name of Object.values(HEADERS[language])) expect(doc).toContain(`\`${name}\``)
      for (const word of Object.values(SEX_VALUES[language])) expect(doc).toContain(`\`${word}\``)
      expect(doc).toContain(`\`${LIVING_VALUES[language].yes}\``)
      expect(doc).toContain(`\`${LIVING_VALUES[language].no}\``)
    }
  })
})

describe('values in every language', () => {
  const header = 'id,given_names,surname,sex,living'
  const sexOf = (value: string, living = ''): { sex: string; living?: boolean } => {
    const r = importCsv(`${header}\r\np1,A,B,${value},${living}`, { now: NOW })
    expect(r.warnings, value).toEqual([])
    const p = Object.values(r.tree.persons)[0]!
    return { sex: p.sex, living: p.living }
  }

  it('reads sex and living words of every header language', () => {
    for (const language of HEADER_LANGUAGES) {
      for (const [sex, word] of Object.entries(SEX_VALUES[language])) {
        expect(sexOf(word).sex, `${language} ${word}`).toBe(sex)
        expect(sexOf(word.toUpperCase()).sex, `${language} ${word}`).toBe(sex)
      }
      expect(sexOf('', LIVING_VALUES[language].yes).living, language).toBe(true)
      expect(sexOf('', LIVING_VALUES[language].no).living, language).toBe(false)
    }
    expect(sexOf('männlich', 'Ja')).toEqual({ sex: 'male', living: true })
    expect(sexOf('Ж', 'нет')).toEqual({ sex: 'female', living: false })
    expect(sexOf('H', 'não')).toEqual({ sex: 'male', living: false })
  })

  it('never reads one word as two values', () => {
    const owner = new Map<string, string>()
    for (const [word, sex] of sexWords()) {
      const key = foldText(word)
      expect(owner.get(key) ?? sex, word).toBe(sex)
      owner.set(key, sex)
    }
    const yesNo = new Map<string, boolean>()
    for (const [word, living] of livingWords()) {
      const key = foldText(word)
      expect(yesNo.get(key) ?? living, word).toBe(living)
      yesNo.set(key, living)
    }
  })
})

describe('importCsv', () => {
  it('imports people, parents and partners (deduplicated) with all value forms', () => {
    const csv = [
      H,
      'p1,Jan,Kowalski,,M,12.05.1890,Kraków,~1955,Łódź,nie,,,p2,',
      'p2,Anna,Kowalska,Nowak,kobieta,1895,,,,nie,,,p1,',
      'p3,Piotr,Kowalski,,male,1921-11,Łódź,,,tak,p1,p2,,"Lubił ""wędkować""\r\nDruga linia"'
    ].join('\r\n')
    const r = importCsv(csv, { now: NOW, name: 'Test' })
    expect(r.errors).toEqual([])
    expect(r.warnings).toEqual([])
    expect(r.stats).toEqual({ people: 3, relationships: 3 })
    expect(r.tree.meta.name).toBe('Test')
    const jan = byName(r.tree, 'Jan Kowalski')
    expect(jan).toMatchObject({
      sex: 'male',
      living: false,
      birth: { date: { value: '1890-05-12', qualifier: 'exact' }, place: 'Kraków' },
      death: { date: { value: '1955', qualifier: 'about' }, place: 'Łódź' }
    })
    const anna = byName(r.tree, 'Anna Kowalska')
    expect(anna).toMatchObject({ sex: 'female', birthSurname: 'Nowak' })
    const piotr = byName(r.tree, 'Piotr Kowalski')
    expect(piotr.notes).toBe('Lubił "wędkować"\nDruga linia')
    expect(
      getParents(r.tree, piotr.id)
        .map((p) => p.givenNames)
        .sort()
    ).toEqual(['Anna', 'Jan'])
    expect(getPartners(r.tree, jan.id).map((p) => p.givenNames)).toEqual(['Anna'])
  })

  it('reports every blocking error with spreadsheet line numbers', () => {
    const csv = [
      H,
      ',NoId,X,,,,,,,,,,,',
      'p1,Jan,K,,,,,,,,,,,',
      'p1,Dup,K,,,,,,,,,,,',
      'p2,,,,,,,,,,,,,',
      'p3,Ola,K,,,,,,,,ghost,,,',
      'p4,Self,K,,,,,,,,,,p4,',
      'p5,A,K,,,,,,,,p6,,,',
      'p6,B,K,,,,,,,,p5,,,',
      'p7,Same,K,,,,,,,,p1,p1,,'
    ].join('\n')
    const r = importCsv(csv, { now: NOW })
    expect(codes(r.errors)).toEqual([
      'missing-id@2',
      'duplicate-id@4',
      'row-without-name@5',
      'unknown-reference@6',
      'self-reference@7',
      expect.stringMatching(/^ancestry-cycle@(8|9)$/),
      'same-parents@10'
    ])
  })

  it('collects warnings without blocking', () => {
    const csv = [
      'id,given_names,surname,sex,birth_date,death_date,living,father_id,shoe_size',
      'p1,Jan,K,dragon,1950,1940,maybe,,44',
      'p2,Kid,K,,1930,soon,,p1,'
    ].join('\n')
    const r = importCsv(csv, { now: NOW })
    expect(r.errors).toEqual([])
    expect(codes(r.warnings)).toEqual([
      'unknown-column@-',
      'invalid-sex@2',
      'invalid-living@2',
      'death-before-birth@2',
      'invalid-date@3',
      'parent-younger-than-child@3'
    ])
    // The unparseable date is kept in the notes.
    expect(byName(r.tree, 'Kid K').notes).toBe('death_date: soon')
  })

  it('reads a Polish Excel file: semicolons, Polish headers and Windows-1250', () => {
    const text =
      'id;imiona;nazwisko;płeć;data_urodzenia;miejsce_urodzenia;ojciec_id;matka_id;partnerzy_id\r\n' +
      'a;Łucja;Żółć;kobieta;ok. 1900;Łódź;;;b\r\n' +
      'b;Jerzy;Żółć;mężczyzna;przed 1899;Gdańsk;;;a\r\n' +
      'c;Ewa;Żółć;K;12.05.1925;Łódź;b;a;\r\n'
    // Encode as Windows-1250 bytes.
    const table: Record<string, number> = {
      Ł: 0xa3,
      ł: 0xb3,
      Ż: 0xaf,
      ż: 0xbf,
      ó: 0xf3,
      ć: 0xe6,
      ę: 0xea,
      ń: 0xf1,
      ź: 0x9f,
      ą: 0xb9,
      ś: 0x9c
    }
    const bytes = new Uint8Array([...text].map((ch) => table[ch] ?? ch.charCodeAt(0)))
    const { text: decoded, encoding } = decodeText(bytes)
    expect(encoding).toBe('windows-1250')
    const r = importCsv(decoded, { now: NOW })
    expect(r.delimiter).toBe(';')
    expect(r.errors).toEqual([])
    expect(r.stats).toEqual({ people: 3, relationships: 3 })
    const lucja = byName(r.tree, 'Łucja Żółć')
    expect(lucja.birth).toEqual({ date: { value: '1900', qualifier: 'about' }, place: 'Łódź' })
    expect(byName(r.tree, 'Jerzy Żółć').birth?.date).toEqual({ value: '1899', qualifier: 'before' })
  })

  it('never throws on malformed input', () => {
    for (const bad of ['', '\n\n', '"unterminated', 'just,a,header', 'a;b;c\n"x', '\u0000\u0001']) {
      expect(() => importCsv(bad, { now: NOW })).not.toThrow()
    }
    expect(codes(importCsv('', { now: NOW }).errors)).toEqual(['empty-file@-'])
    expect(codes(importCsv('name,age\nJan,4', { now: NOW }).errors)).toEqual([
      'missing-id-column@-'
    ])
    expect(codes(importCsv('id,age\n1,4', { now: NOW }).errors)).toEqual(['missing-name-column@-'])
  })

  it('accepts a manual header mapping', () => {
    const r = importCsv('nr,imie_i_nazwisko\n1,Jan', { now: NOW, mapping: ['id', 'given_names'] })
    expect(r.errors).toEqual([])
    expect(Object.values(r.tree.persons)[0]?.givenNames).toBe('Jan')
  })
})
