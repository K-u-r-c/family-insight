import type { FamilyTree } from '../model/types'
import { TreeBuilder } from '../test/fixtures'

/**
 * A family for kinship tests, seen from `me` (Maria):
 *
 * - great-great-grandfather `gggf`, father of `ggf`
 * - great-grandparents `ggf` + `ggm`; their sons `gf` (grandfather) and `gu` (great-uncle)
 * - grandparents `gf` + `gm` (father's side) and `mgf` + `mgm` (mother's side)
 * - father `f` (son of gf + gm) and mother `m` (daughter of mgf + mgm)
 * - father's brother `u` (uncle) with wife `uw`; their son `c1` (first cousin), whose daughter
 *   `c1d` is a first cousin once removed
 * - mother's sister `mt` (maternal aunt) with son `mc`
 * - father's half-sister `hs` (gf + `gm2`)
 * - siblings: brother `br` (f + m), half-brother `hb` (f + `fw1`), brother's wife `sil`, brother's
 *   son `nep`, nephew's son `gnep`
 * - great-uncle's son `gu1` (first cousin once removed), his son `sc2` (second cousin) and
 *   grandson `sc3` (second cousin once removed)
 * - father's second wife `sm` (step-mother) and her son `sb` from `smh` (step-brother)
 * - me's husband `h`, his parents `hf` + `hm`, his brother `hbr` and hbr's wife `hbrw`
 * - children: `son` (me + h), `ad` (adopted by me), son's wife `dil`, son's son `gs`,
 *   great-grandson `ggs`
 * - `stranger`, unrelated
 */
export function kinshipFixture(): FamilyTree {
  const b = new TreeBuilder()
  const people: [string, string, 'male' | 'female'][] = [
    ['gggf', 'Great-great-grandfather', 'male'],
    ['ggf', 'Great-grandfather', 'male'],
    ['ggm', 'Great-grandmother', 'female'],
    ['gf', 'Grandfather', 'male'],
    ['gm', 'Grandmother', 'female'],
    ['gm2', 'Grandfather’s second wife', 'female'],
    ['gu', 'Great-uncle', 'male'],
    ['mgf', 'Maternal grandfather', 'male'],
    ['mgm', 'Maternal grandmother', 'female'],
    ['f', 'Father', 'male'],
    ['m', 'Mother', 'female'],
    ['fw1', 'Father’s first wife', 'female'],
    ['sm', 'Step-mother', 'female'],
    ['smh', 'Step-mother’s first husband', 'male'],
    ['sb', 'Step-brother', 'male'],
    ['u', 'Uncle', 'male'],
    ['uw', 'Uncle’s wife', 'female'],
    ['c1', 'Cousin', 'male'],
    ['c1d', 'Cousin’s daughter', 'female'],
    ['mt', 'Maternal aunt', 'female'],
    ['mc', 'Maternal cousin', 'male'],
    ['hs', 'Half-aunt', 'female'],
    ['gu1', 'Great-uncle’s son', 'male'],
    ['sc2', 'Second cousin', 'male'],
    ['sc3', 'Second cousin once removed', 'female'],
    ['me', 'Maria', 'female'],
    ['br', 'Brother', 'male'],
    ['hb', 'Half-brother', 'male'],
    ['sil', 'Sister-in-law', 'female'],
    ['nep', 'Nephew', 'male'],
    ['gnep', 'Grand-nephew', 'male'],
    ['h', 'Husband', 'male'],
    ['hf', 'Father-in-law', 'male'],
    ['hm', 'Mother-in-law', 'female'],
    ['hbr', 'Brother-in-law', 'male'],
    ['hbrw', 'Co-sister-in-law', 'female'],
    ['son', 'Son', 'male'],
    ['ad', 'Adopted daughter', 'female'],
    ['dil', 'Daughter-in-law', 'female'],
    ['gs', 'Grandson', 'male'],
    ['ggs', 'Great-grandson', 'male'],
    ['stranger', 'Stranger', 'male']
  ]
  for (const [id, name, sex] of people) b.person(id, name, sex)
  const kids = (parents: string[], children: string[], kind?: 'adoptive'): void => {
    for (const c of children) for (const p of parents) b.child(p, c, kind)
  }
  kids(['gggf'], ['ggf'])
  b.couple('ggf', 'ggm')
  kids(['ggf', 'ggm'], ['gf', 'gu'])
  b.couple('gf', 'gm')
  b.couple('gf', 'gm2')
  kids(['gf', 'gm'], ['f', 'u'])
  kids(['gf', 'gm2'], ['hs'])
  b.couple('mgf', 'mgm')
  kids(['mgf', 'mgm'], ['m', 'mt'])
  b.couple('f', 'fw1')
  kids(['f', 'fw1'], ['hb'])
  b.couple('f', 'm')
  kids(['f', 'm'], ['me', 'br'])
  b.couple('f', 'sm')
  b.couple('smh', 'sm')
  kids(['smh', 'sm'], ['sb'])
  b.couple('u', 'uw')
  kids(['u', 'uw'], ['c1'])
  kids(['c1'], ['c1d'])
  kids(['mt'], ['mc'])
  kids(['gu'], ['gu1'])
  kids(['gu1'], ['sc2'])
  kids(['sc2'], ['sc3'])
  b.couple('br', 'sil')
  kids(['br', 'sil'], ['nep'])
  kids(['nep'], ['gnep'])
  b.couple('hf', 'hm')
  kids(['hf', 'hm'], ['h', 'hbr'])
  b.couple('hbr', 'hbrw')
  b.couple('me', 'h')
  kids(['me', 'h'], ['son'])
  kids(['me'], ['ad'], 'adoptive')
  b.couple('son', 'dil')
  kids(['son', 'dil'], ['gs'])
  kids(['gs'], ['ggs'])
  return b.build()
}

/** Two brothers married two sisters: their children are double first cousins. */
export function doubleCousinsFixture(): FamilyTree {
  return new TreeBuilder()
    .person('pa', 'Paternal grandfather', 'male')
    .person('pb', 'Paternal grandmother', 'female')
    .person('ma', 'Maternal grandfather', 'male')
    .person('mb', 'Maternal grandmother', 'female')
    .person('b1', 'Brother 1', 'male')
    .person('b2', 'Brother 2', 'male')
    .person('s1', 'Sister 1', 'female')
    .person('s2', 'Sister 2', 'female')
    .person('x', 'Child of b1 and s1', 'female')
    .person('y', 'Child of b2 and s2', 'male')
    .couple('pa', 'pb')
    .couple('ma', 'mb')
    .child('pa', 'b1')
    .child('pb', 'b1')
    .child('pa', 'b2')
    .child('pb', 'b2')
    .child('ma', 's1')
    .child('mb', 's1')
    .child('ma', 's2')
    .child('mb', 's2')
    .couple('b1', 's1')
    .couple('b2', 's2')
    .child('b1', 'x')
    .child('s1', 'x')
    .child('b2', 'y')
    .child('s2', 'y')
    .build()
}
