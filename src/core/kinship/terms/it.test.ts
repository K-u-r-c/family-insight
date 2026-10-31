import { describe, expect, it } from 'vitest'
import { italian } from './it'
import { namerTable, type Table } from './table'

// Written from Treccani and genealogical references (see the kinship sources notes), not from
// the namer's output. Cousins are numbered by generation of the common ancestors (children of
// two first cousins are "di secondo grado"), the generation gap is spelled out.
const IT: Table = {
  f: ['padre', 'madre'],
  m: ['madre', 'padre'],
  gf: ['nonno', 'nonna'],
  mgm: ['nonna', 'nonno'],
  ggf: ['bisnonno', 'bisnonna'],
  gggf: ['trisnonno', 'trisnonna'],
  son: ['figlio', 'figlia'],
  gs: ['nipote', 'nipote'],
  ggs: ['pronipote', 'pronipote'],
  ad: ['figlia adottiva', 'figlio adottivo'],
  br: ['fratello', 'sorella'],
  hb: ['fratellastro', 'sorellastra'],
  u: ['zio', 'zia'],
  mt: ['zia', 'zio'],
  hs: ['zia unilaterale', 'zio unilaterale'],
  gu: ['prozio', 'prozia'],
  nep: ['nipote (figlio del fratello)', 'nipote (figlia del fratello)'],
  gnep: ['pronipote (nipote del fratello)', 'pronipote (nipote del fratello)'],
  c1: ['cugino di primo grado', 'cugina di primo grado'],
  mc: ['cugino di primo grado', 'cugina di primo grado'],
  c1d: [
    'cugina di primo grado (una generazione sotto)',
    'cugino di primo grado (una generazione sotto)'
  ],
  gu1: [
    'cugino di primo grado (una generazione sopra)',
    'cugina di primo grado (una generazione sopra)'
  ],
  sc2: ['cugino di secondo grado', 'cugina di secondo grado'],
  sc3: [
    'cugina di secondo grado (una generazione sotto)',
    'cugino di secondo grado (una generazione sotto)'
  ],
  h: ['marito', 'moglie'],
  hf: ['suocero', 'suocera'],
  hm: ['suocera', 'suocero'],
  hbr: ['cognato', 'cognata'],
  sil: ['cognata', 'cognato'],
  dil: ['nuora', 'genero'],
  hbrw: ['cognata', 'cognato'],
  sm: ['matrigna', 'patrigno'],
  sb: ['fratello acquisito', 'sorella acquisita']
}

namerTable('it', italian, IT)

describe('sentences: it', () => {
  it('put the name of the relationship between the two names with the right article', () => {
    expect(italian.sentence('Maria', 'Anna', { term: 'zia', gender: 'f' })).toBe(
      'Anna è la zia di Maria.'
    )
    expect(italian.sentence('Maria', 'Luca', { term: 'zio', gender: 'm' })).toBe(
      'Luca è lo zio di Maria.'
    )
    expect(italian.sentence('Maria', 'Luca', { term: 'suocero', gender: 'm' })).toBe(
      'Luca è il suocero di Maria.'
    )
    expect(italian.sentence('Maria', 'Luca', { term: 'ex marito', gender: 'm' })).toBe(
      'Luca è l’ex marito di Maria.'
    )
    expect(italian.sentence('Maria', 'Anna', { term: 'ex moglie', gender: 'f' })).toBe(
      'Anna è l’ex moglie di Maria.'
    )
    expect(italian.sentence('Maria', 'Anna', { term: 'sorella', gender: 'f' })).toBe(
      'Anna è la sorella di Maria.'
    )
  })
})
