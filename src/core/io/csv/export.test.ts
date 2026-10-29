import { describe, expect, it } from 'vitest'
import { exportCsv, parentSlots, quoteField } from './export'
import { TreeBuilder } from '../../test/fixtures'
import { updateRelationship } from '../../model/operations'
import type { Person } from '../../model/types'

const d = (value: string, qualifier: 'exact' | 'about' | 'before' = 'exact') => ({
  value,
  qualifier
})

function fixture() {
  let tree = new TreeBuilder()
    .person('jan', 'Jan', 'male', {
      surname: 'Kowalski',
      birth: { date: d('1890-05-12'), place: 'Kraków' },
      death: { date: d('1955', 'about'), place: 'Łódź' },
      living: false
    })
    .person('anna', 'Anna', 'female', {
      surname: 'Kowalska',
      birthSurname: 'Nowak',
      birth: { date: d('1895') }
    })
    .person('piotr', 'Piotr', 'male', {
      surname: 'Kowalski',
      birth: { date: d('1921-11') },
      living: true,
      notes: 'Lubił "wędkować", grał; śpiewał\nDruga linia'
    })
    .person('adopted', 'Ola', 'female', { surname: 'Kowalska', birth: { date: d('1925') } })
    .couple('jan', 'anna')
    .child('jan', 'piotr')
    .child('anna', 'piotr')
    .child('anna', 'adopted', 'adoptive')
    .build()
  tree = updateRelationship(tree, 'r1', { start: { date: d('1919') } })
  return tree
}

describe('quoteField', () => {
  it('quotes delimiters, quotes and line breaks only', () => {
    expect(quoteField('plain', ',')).toBe('plain')
    expect(quoteField('a,b', ',')).toBe('"a,b"')
    expect(quoteField('a,b', ';')).toBe('a,b')
    expect(quoteField('a;b', ';')).toBe('"a;b"')
    expect(quoteField('say "hi"', ',')).toBe('"say ""hi"""')
    expect(quoteField('a\nb', ',')).toBe('"a\nb"')
  })
})

describe('parentSlots', () => {
  const p = (id: string, sex: Person['sex']) => ({ id, sex }) as Person
  it('puts men in father, women in mother and others in free slots', () => {
    expect(parentSlots([p('m', 'female'), p('f', 'male')])).toEqual({ father: 'f', mother: 'm' })
    expect(parentSlots([p('a', 'unknown'), p('m', 'female')])).toEqual({ father: 'a', mother: 'm' })
    expect(parentSlots([p('a', 'male'), p('b', 'male')])).toEqual({ father: 'a', mother: 'b' })
    expect(parentSlots([p('a', 'other')])).toEqual({ father: 'a' })
  })
})

describe('exportCsv', () => {
  it('writes the documented columns with BOM, CRLF and RFC 4180 quoting', () => {
    const csv = exportCsv(fixture())
    expect(
      csv.startsWith(
        '﻿id,given_names,surname,birth_surname,sex,birth_date,birth_place,death_date,death_place,living,father_id,mother_id,partner_ids,notes\r\n'
      )
    ).toBe(true)
    const lines = csv.slice(1).split('\r\n')
    expect(lines[1]).toBe('p1,Jan,Kowalski,,male,1890-05-12,Kraków,~1955,Łódź,false,,,p2,')
    expect(lines[2]).toBe('p2,Anna,Kowalska,Nowak,female,1895,,,,,,,p1,')
    expect(lines[3]).toBe(
      'p3,Piotr,Kowalski,,male,1921-11,,,,true,p1,p2,,"Lubił ""wędkować"", grał; śpiewał\nDruga linia"'
    )
    // Adoptive parents are not written to father/mother.
    expect(lines[4]).toBe('p4,Ola,Kowalska,,female,1925,,,,,,,,')
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('supports semicolons and Polish headers and values', () => {
    const csv = exportCsv(fixture(), { delimiter: ';', headerLanguage: 'pl' })
    const lines = csv.slice(1).split('\r\n')
    expect(lines[0]).toBe(
      'id;imiona;nazwisko;nazwisko_rodowe;plec;data_urodzenia;miejsce_urodzenia;data_smierci;miejsce_smierci;zyje;ojciec_id;matka_id;partnerzy_id;notatki'
    )
    expect(lines[1]).toBe('p1;Jan;Kowalski;;mężczyzna;1890-05-12;Kraków;~1955;Łódź;nie;;;p2;')
    expect(lines[3]).toContain(';tak;p1;p2;;"Lubił ""wędkować"", grał; śpiewał\nDruga linia"')
  })

  it('exports an empty tree as just the header', () => {
    expect(exportCsv(new TreeBuilder().build())).toBe(
      '﻿id,given_names,surname,birth_surname,sex,birth_date,birth_place,death_date,death_place,living,father_id,mother_id,partner_ids,notes\r\n'
    )
  })
})
