import { describe, expect, it } from 'vitest'
import { portuguese } from './pt'
import { namerTable, type Table } from './table'

// Brazilian Portuguese, from dictionaries (Dicio, Aurélio/Houaiss via Dicio) and genealogy usage
// (Gramps rel_pt): trisavô is the father of the bisavô; removed cousins get an explicit
// generation note because colloquial "primo em segundo grau" also means a cousin's child.
const PT: Table = {
  f: ['pai', 'mãe'],
  m: ['mãe', 'pai'],
  gf: ['avô', 'avó'],
  mgm: ['avó', 'avô'],
  ggf: ['bisavô', 'bisavó'],
  gggf: ['trisavô', 'trisavó'],
  son: ['filho', 'filha'],
  gs: ['neto', 'neta'],
  ggs: ['bisneto', 'bisneta'],
  ad: ['filha adotiva', 'filho adotivo'],
  br: ['irmão', 'irmã'],
  hb: ['meio-irmão', 'meia-irmã'],
  u: ['tio', 'tia'],
  mt: ['tia', 'tio'],
  hs: ['meia-tia', 'meio-tio'],
  gu: ['tio-avô', 'tia-avó'],
  nep: ['sobrinho', 'sobrinha'],
  gnep: ['sobrinho-neto', 'sobrinha-neta'],
  c1: ['primo', 'prima'],
  mc: ['primo', 'prima'],
  c1d: ['prima (uma geração abaixo)', 'primo (uma geração abaixo)'],
  gu1: ['primo (uma geração acima)', 'prima (uma geração acima)'],
  sc2: ['primo em segundo grau', 'prima em segundo grau'],
  sc3: ['prima em segundo grau (uma geração abaixo)', 'primo em segundo grau (uma geração abaixo)'],
  h: ['marido', 'esposa'],
  hf: ['sogro', 'sogra'],
  hm: ['sogra', 'sogro'],
  hbr: ['cunhado', 'cunhada'],
  sil: ['cunhada', 'cunhado'],
  dil: ['nora', 'genro'],
  hbrw: ['concunhada', 'concunhado'],
  sm: ['madrasta', 'padrasto'],
  sb: ['irmão postiço', 'irmã postiça']
}

namerTable('pt', portuguese, PT)

describe('sentences: pt', () => {
  it('put the name of the relationship between the two names with an article', () => {
    expect(portuguese.sentence('Maria', 'Anna', { term: 'tia', gender: 'f' })).toBe(
      'Anna é a tia de Maria.'
    )
    expect(portuguese.sentence('Maria', 'João', { term: 'tio-avô', gender: 'm' })).toBe(
      'João é o tio-avô de Maria.'
    )
  })
})
