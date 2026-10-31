import { describe, expect, it } from 'vitest'
import { findRelationships, type Kinship } from '../kinship'
import { kinshipFixture } from '../fixture'
import { german } from './de'
import { namerTable, type Table } from './table'

const DE: Table = {
  f: ['Vater', 'Mutter'],
  m: ['Mutter', 'Vater'],
  gf: ['Großvater', 'Großmutter'],
  mgm: ['Großmutter', 'Großvater'],
  ggf: ['Urgroßvater', 'Urgroßmutter'],
  gggf: ['Ururgroßvater', 'Ururgroßmutter'],
  son: ['Sohn', 'Tochter'],
  gs: ['Enkel', 'Enkelin'],
  ggs: ['Urenkel', 'Urenkelin'],
  ad: ['Adoptivtochter', 'Adoptivsohn'],
  br: ['Bruder', 'Schwester'],
  hb: ['Halbbruder', 'Halbschwester'],
  u: ['Onkel', 'Tante'],
  mt: ['Tante', 'Onkel'],
  hs: ['Halbtante', 'Halbonkel'],
  gu: ['Großonkel', 'Großtante'],
  nep: ['Neffe', 'Nichte'],
  gnep: ['Großneffe', 'Großnichte'],
  c1: ['Cousin', 'Cousine'],
  mc: ['Cousin', 'Cousine'],
  c1d: ['Nichte 2. Grades', 'Neffe 2. Grades'],
  gu1: ['Onkel 2. Grades', 'Tante 2. Grades'],
  sc2: ['Cousin 2. Grades', 'Cousine 2. Grades'],
  sc3: ['Nichte 3. Grades', 'Neffe 3. Grades'],
  h: ['Ehemann', 'Ehefrau'],
  hf: ['Schwiegervater', 'Schwiegermutter'],
  hm: ['Schwiegermutter', 'Schwiegervater'],
  hbr: ['Schwager', 'Schwägerin'],
  sil: ['Schwägerin', 'Schwager'],
  dil: ['Schwiegertochter', 'Schwiegersohn'],
  hbrw: ['Schwippschwägerin', 'Schwippschwager'],
  sm: ['Stiefmutter', 'Stiefvater'],
  sb: ['Stiefbruder', 'Stiefschwester']
}

namerTable('de', german, DE)

const first = (id: string): Kinship => findRelationships(kinshipFixture(), 'me', id)[0]!

describe('German kinship names', () => {
  it('use neutral words or both forms for an unknown sex', () => {
    const name = (id: string): string | undefined =>
      german.name({ ...first(id), sexB: 'unknown' })?.term
    expect(name('f')).toBe('Elternteil')
    expect(name('son')).toBe('Kind')
    expect(name('br')).toBe('Geschwister')
    expect(name('u')).toBe('Onkel oder Tante')
    expect(name('hb')).toBe('Halbgeschwister')
    expect(name('sc2')).toBe('Cousin oder Cousine 2. Grades')
  })

  it('name ended partnerships and distant generations', () => {
    expect(german.name({ ...first('h'), ended: true } as Kinship)?.term).toBe('ehemaliger Ehemann')
    const ancestor = { ...first('gggf'), up: 6 } as Kinship
    expect(german.name(ancestor)?.term).toBe('Ururururgroßvater')
    expect(german.name({ ...ancestor, up: 8 } as Kinship)?.term).toBe(
      'Vorfahr in der 8. Generation'
    )
  })
})

describe('German sentences', () => {
  it('put the term with its article between the two names', () => {
    expect(german.sentence('Maria', 'Anna', { term: 'Tante', gender: 'f' })).toBe(
      'Anna ist die Tante von Maria.'
    )
    expect(german.sentence('Maria', 'Jan', { term: 'Onkel', gender: 'm' })).toBe(
      'Jan ist der Onkel von Maria.'
    )
    expect(german.sentence('Maria', 'Kim', { term: 'Kind', gender: 'n' })).toBe(
      'Kim ist das Kind von Maria.'
    )
  })

  it('decline a leading adjective weakly after the article', () => {
    expect(german.sentence('Maria', 'Jan', { term: 'ehemaliger Verlobter', gender: 'm' })).toBe(
      'Jan ist der ehemalige Verlobte von Maria.'
    )
    expect(german.sentence('Maria', 'Kim', { term: 'angeheiratetes Enkelkind', gender: 'n' })).toBe(
      'Kim ist das angeheiratete Enkelkind von Maria.'
    )
  })
})
