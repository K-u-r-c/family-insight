import { describe, expect, it } from 'vitest'
import { spanish } from './es'
import { namerTable, type Table } from './table'

// Written from es.wikipedia (Parentesco, Tío, Sobrino, Medio hermano) and Wikcionario: cousins of
// another generation are "tío segundo" (a parent's first cousin) and "sobrino segundo" (a first
// cousin's child).
const ES: Table = {
  f: ['padre', 'madre'],
  m: ['madre', 'padre'],
  gf: ['abuelo', 'abuela'],
  mgm: ['abuela', 'abuelo'],
  ggf: ['bisabuelo', 'bisabuela'],
  gggf: ['tatarabuelo', 'tatarabuela'],
  son: ['hijo', 'hija'],
  gs: ['nieto', 'nieta'],
  ggs: ['bisnieto', 'bisnieta'],
  ad: ['hija adoptiva', 'hijo adoptivo'],
  br: ['hermano', 'hermana'],
  hb: ['medio hermano', 'media hermana'],
  u: ['tío', 'tía'],
  mt: ['tía', 'tío'],
  hs: ['media tía', 'medio tío'],
  gu: ['tío abuelo', 'tía abuela'],
  nep: ['sobrino', 'sobrina'],
  gnep: ['sobrino nieto', 'sobrina nieta'],
  c1: ['primo hermano', 'prima hermana'],
  mc: ['primo hermano', 'prima hermana'],
  c1d: ['sobrina segunda', 'sobrino segundo'],
  gu1: ['tío segundo', 'tía segunda'],
  sc2: ['primo segundo', 'prima segunda'],
  sc3: ['sobrina tercera', 'sobrino tercero'],
  h: ['esposo', 'esposa'],
  hf: ['suegro', 'suegra'],
  hm: ['suegra', 'suegro'],
  hbr: ['cuñado', 'cuñada'],
  sil: ['cuñada', 'cuñado'],
  dil: ['nuera', 'yerno'],
  hbrw: ['concuñada', 'concuñado'],
  sm: ['madrastra', 'padrastro'],
  sb: ['hermanastro', 'hermanastra']
}

namerTable('es', spanish, ES)

describe('Spanish sentences', () => {
  it('put the name of the relationship between the two names with el/la', () => {
    expect(spanish.sentence('Maria', 'Anna', { term: 'tía', gender: 'f' })).toBe(
      'Anna es la tía de Maria.'
    )
    expect(spanish.sentence('Maria', 'Jan', { term: 'tío abuelo', gender: 'm' })).toBe(
      'Jan es el tío abuelo de Maria.'
    )
  })
})
