import { describe, expect, it } from 'vitest'
import { compareText, foldText, formatList, formatNumber, masculineSurname } from './text'

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
