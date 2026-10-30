import { describe, expect, it } from 'vitest'
import {
  compareSurnames,
  compareText,
  foldText,
  formatFileSize,
  formatList,
  formatNumber,
  masculineSurname,
  matchesQuery,
  searchForms,
  surnameSortKey
} from './text'

describe('text helpers', () => {
  it('sorts Polish names in Polish order', () => {
    const names = ['Łukasz', 'Lucyna', 'Żaneta', 'Zenon', 'Ćwik', 'Celina', 'adam']
    expect([...names].sort((a, b) => compareText(a, b, 'pl'))).toEqual([
      'adam',
      'Celina',
      'Ćwik',
      'Lucyna',
      'Łukasz',
      'Zenon',
      'Żaneta'
    ])
  })

  it('folds case and every Polish diacritic', () => {
    expect(foldText('ĄĆĘŁŃÓŚŹŻ ąćęłńóśźż')).toBe('acelnoszz acelnoszz')
    expect(foldText('Łódź')).toBe('lodz')
  })

  it('formats lists and numbers per language', () => {
    expect(formatList(['Anna', 'Jan', 'Ewa'], 'en')).toBe('Anna, Jan, and Ewa')
    expect(formatList(['Anna', 'Jan', 'Ewa'], 'pl')).toBe('Anna, Jan i Ewa')
    expect(formatNumber(12345, 'en')).toBe('12,345')
    expect(formatNumber(12345, 'pl').replace(/\s/g, ' ')).toBe('12 345')
    expect(formatFileSize(340_123, 'en')).toBe('340 kB')
    expect(formatFileSize(2_412_000, 'en')).toBe('2.4 MB')
    expect(formatFileSize(2_412_000, 'pl').replace(/\s/g, ' ')).toBe('2,4 MB')
    expect(formatFileSize(512, 'en')).toBe('512 byte')
  })
})

describe('masculineSurname', () => {
  it('turns Polish feminine endings into masculine ones', () => {
    expect(masculineSurname('Kowalska')).toBe('Kowalski')
    expect(masculineSurname('Nowicka')).toBe('Nowicki')
    expect(masculineSurname('Zawadzka')).toBe('Zawadzki')
    expect(masculineSurname('Kowalska-Nowicka')).toBe('Kowalski-Nowicki')
    expect(masculineSurname('WIŚNIEWSKA')).toBe('WIŚNIEWSKI')
  })

  it('leaves other surnames alone', () => {
    for (const name of ['Nowak', 'Lis', 'Smith', 'Kowalski', 'Zając', '']) {
      expect(masculineSurname(name)).toBe(name)
    }
  })
})

describe('search forms', () => {
  it('folds Cyrillic case and ё', () => {
    expect(matchesQuery('Алёна Щукина', 'алена')).toBe(true)
    expect(matchesQuery('АЛЁНА', 'алёна')).toBe(true)
    // Folding also drops the breve of й (as diacritics are dropped everywhere).
    expect(matchesQuery('Андрей', 'андреи')).toBe(true)
  })

  it('finds Cyrillic names written in Latin letters and the other way round', () => {
    expect(matchesQuery('Иванов Пётр', 'ivanov')).toBe(true)
    expect(matchesQuery('Андрей Хрущёв', 'andrey khrushchev')).toBe(true)
    expect(matchesQuery('Ivanov', 'Иванов')).toBe(true)
    expect(matchesQuery('Иванов', 'petrov')).toBe(false)
  })

  it('matches German spellings both ways', () => {
    expect(matchesQuery('Müller', 'mueller')).toBe(true)
    expect(matchesQuery('Müller', 'muller')).toBe(true)
    expect(matchesQuery('Straße', 'strasse')).toBe(true)
    expect(matchesQuery('Strasse', 'straße')).toBe(true)
    expect(matchesQuery('Weiß', 'weiss')).toBe(true)
    expect(matchesQuery('Göbel', 'goebel')).toBe(true)
  })

  it('does not merge ae/ue/oe outside umlauts', () => {
    expect(matchesQuery('Michał', 'michael')).toBe(false)
    expect(matchesQuery('Samuel', 'samul')).toBe(false)
    expect(searchForms('Kowalski')).toEqual(['kowalski'])
  })

  it('needs every word, ignores Polish diacritics, and matches everything for an empty query', () => {
    expect(matchesQuery('Łucja Żółkiewska', 'zolk luc')).toBe(true)
    expect(matchesQuery('Łucja Żółkiewska', 'zolk anna')).toBe(false)
    expect(matchesQuery('anything', '  ')).toBe(true)
  })
})

describe('surname sorting', () => {
  it('skips leading particles while something follows them', () => {
    expect(surnameSortKey('van der Berg')).toBe('Berg')
    expect(surnameSortKey('von Goethe')).toBe('Goethe')
    expect(surnameSortKey('de la Cruz')).toBe('Cruz')
    expect(surnameSortKey('dos Santos')).toBe('Santos')
    expect(surnameSortKey('Di Stefano')).toBe('Stefano')
    expect(surnameSortKey('Le')).toBe('Le')
    expect(surnameSortKey('Vandenberg')).toBe('Vandenberg')
    expect(surnameSortKey('Kowalski')).toBe('Kowalski')
  })

  it('sorts by the key with the full surname kept for display', () => {
    const names = ['Vries', 'van der Berg', 'Adler', 'de Vries', 'von Goethe', 'Le', 'Cruz']
    expect([...names].sort((a, b) => compareSurnames(a, b, 'de'))).toEqual([
      'Adler',
      'van der Berg',
      'Cruz',
      'von Goethe',
      'Le',
      'de Vries',
      'Vries'
    ])
  })

  it('uses the collation of the language', () => {
    expect(['Lis', 'Łoś', 'Mazur'].sort((a, b) => compareSurnames(a, b, 'pl'))).toEqual([
      'Lis',
      'Łoś',
      'Mazur'
    ])
    expect(['Яковлев', 'Ёлкин', 'Аксёнов'].sort((a, b) => compareSurnames(a, b, 'ru'))).toEqual([
      'Аксёнов',
      'Ёлкин',
      'Яковлев'
    ])
  })
})
