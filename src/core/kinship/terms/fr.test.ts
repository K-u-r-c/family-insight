import { describe, expect, it } from 'vitest'
import { french } from './fr'
import { namerTable, type Table } from './table'

// Written from the references (Académie française, Larousse, OQLF, Wikipédia), not from the namer.
const FR: Table = {
  f: ['père', 'mère'],
  m: ['mère', 'père'],
  gf: ['grand-père', 'grand-mère'],
  mgm: ['grand-mère', 'grand-père'],
  ggf: ['arrière-grand-père', 'arrière-grand-mère'],
  gggf: ['arrière-arrière-grand-père', 'arrière-arrière-grand-mère'],
  son: ['fils', 'fille'],
  gs: ['petit-fils', 'petite-fille'],
  ggs: ['arrière-petit-fils', 'arrière-petite-fille'],
  ad: ['fille adoptive', 'fils adoptif'],
  br: ['frère', 'sœur'],
  hb: ['demi-frère', 'demi-sœur'],
  u: ['oncle', 'tante'],
  mt: ['tante', 'oncle'],
  hs: ['demi-tante', 'demi-oncle'],
  gu: ['grand-oncle', 'grand-tante'],
  nep: ['neveu', 'nièce'],
  gnep: ['petit-neveu', 'petite-nièce'],
  c1: ['cousin germain', 'cousine germaine'],
  mc: ['cousin germain', 'cousine germaine'],
  c1d: ['nièce à la mode de Bretagne', 'neveu à la mode de Bretagne'],
  gu1: ['oncle à la mode de Bretagne', 'tante à la mode de Bretagne'],
  sc2: ['cousin issu de germain', 'cousine issue de germain'],
  sc3: [
    'cousine issue de germain (une génération en dessous)',
    'cousin issu de germain (une génération en dessous)'
  ],
  h: ['mari', 'épouse'],
  hf: ['beau-père (père du conjoint)', 'belle-mère (mère du conjoint)'],
  hm: ['belle-mère (mère du conjoint)', 'beau-père (père du conjoint)'],
  hbr: ['beau-frère', 'belle-sœur'],
  sil: ['belle-sœur', 'beau-frère'],
  dil: ['belle-fille (conjointe du fils)', 'gendre'],
  hbrw: ['belle-sœur', 'beau-frère'],
  sm: ['belle-mère (conjointe du père)', 'beau-père (conjoint du père)'],
  sb: ['quasi-frère', 'quasi-sœur']
}

namerTable('fr', french, FR)

describe('French sentences', () => {
  it('put the name of the relationship between the two names, with le/la/l’', () => {
    expect(french.sentence('Maria', 'Anna', { term: 'tante', gender: 'f' })).toBe(
      'Anna est la tante de Maria.'
    )
    expect(french.sentence('Maria', 'Marc', { term: 'grand-oncle', gender: 'm' })).toBe(
      'Marc est le grand-oncle de Maria.'
    )
    expect(french.sentence('Maria', 'Marc', { term: 'arrière-grand-père', gender: 'm' })).toBe(
      'Marc est l’arrière-grand-père de Maria.'
    )
    expect(french.sentence('Anna', 'Marc', { term: 'oncle', gender: 'm' })).toBe(
      'Marc est l’oncle d’Anna.'
    )
    expect(french.sentence('Yann', 'Marc', { term: 'oncle', gender: 'm' })).toBe(
      'Marc est l’oncle de Yann.'
    )
  })
})
