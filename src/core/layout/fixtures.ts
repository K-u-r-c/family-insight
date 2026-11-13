import type { FamilyTree } from '../model/types'
import { TreeBuilder } from '../test/fixtures'

/**
 * Two families joined by a marriage, where one side is known one generation deeper than the
 * other (the shape of a real user's tree that exposed issue #100; names are invented).
 *
 * Seen from `me` (generation 4):
 * - mother's side, 4 generations up: `mgf` + `mgm` ← `mgfFather` + `mgfMother` and `mgmFather` +
 *   `mgmMother` ← `mgfGrandfather` + `mgfGrandmother`, `mgmGrandfather`, `mgmGrandmother`;
 *   `mgfMother` remarried `stepGf` (half-uncle and half-aunt with spouses and three children
 *   each), `mgm` has a sister and `mother` a brother with three children;
 * - father's side, only 3 generations up: `pggf` + `pggm` ← `pgf` + `pgm` with four sons –
 *   `father` and three uncles, each married with one to three children.
 */
export function twoFamiliesFixture(): FamilyTree {
  const b = new TreeBuilder()
  const kids = (parents: string[], children: string[]): void => {
    for (const c of children) for (const p of parents) b.child(p, c)
  }
  // prettier-ignore
  const men = [
    'me', 'father', 'mgf', 'pgf', 'pggf', 'uncle1', 'uncle2', 'uncle3', 'mUncle', 'mgmFather',
    'mgfFather', 'mgmGrandfather', 'mgfGrandfather', 'stepGf', 'halfUncle', 'halfAuntHusband',
    'mCousin1', 'pCousin1', 'pCousin2', 'pCousin3', 'pCousin4', 'pCousin5', 'pCousin6',
    'halfUncleChild1', 'halfUncleChild2', 'halfUncleChild3Husband'
  ]
  // prettier-ignore
  const women = [
    'mother', 'sister', 'mgm', 'pgm', 'pggm', 'mgmMother', 'mgfMother', 'mgmSister', 'mUncleWife',
    'mgmGrandmother', 'mgfGrandmother', 'uncle1Wife', 'uncle2Wife', 'uncle3Wife', 'halfAunt',
    'halfUncleWife', 'mCousin2', 'mCousin3', 'halfCousin1', 'halfCousin2', 'halfCousin3',
    'halfUncleChild3', 'halfUncleChild1Wife', 'halfUncleChild2Wife'
  ]
  for (const id of men) b.person(id, id, 'male')
  for (const id of women) b.person(id, id, 'female')

  // Mother's side.
  b.couple('mgfGrandfather', 'mgfGrandmother')
  kids(['mgfGrandfather', 'mgfGrandmother'], ['mgfMother'])
  kids(['mgmGrandfather'], ['mgmFather'])
  kids(['mgmGrandmother'], ['mgmMother'])
  b.couple('mgfFather', 'mgfMother')
  kids(['mgfMother', 'mgfFather'], ['mgf'])
  b.couple('mgfMother', 'stepGf')
  kids(['stepGf', 'mgfMother'], ['halfUncle', 'halfAunt'])
  b.couple('mgmFather', 'mgmMother')
  kids(['mgmFather', 'mgmMother'], ['mgm', 'mgmSister'])
  b.couple('mgf', 'mgm')
  kids(['mgf', 'mgm'], ['mother', 'mUncle'])
  b.couple('mUncle', 'mUncleWife')
  kids(['mUncle', 'mUncleWife'], ['mCousin1', 'mCousin2', 'mCousin3'])
  b.couple('halfAunt', 'halfAuntHusband')
  kids(['halfAuntHusband', 'halfAunt'], ['halfCousin1', 'halfCousin2', 'halfCousin3'])
  b.couple('halfUncle', 'halfUncleWife')
  kids(['halfUncle', 'halfUncleWife'], ['halfUncleChild1', 'halfUncleChild2', 'halfUncleChild3'])
  b.couple('halfUncleChild1', 'halfUncleChild1Wife')
  b.couple('halfUncleChild2', 'halfUncleChild2Wife')
  b.couple('halfUncleChild3', 'halfUncleChild3Husband')

  // Father's side.
  b.couple('pggm', 'pggf')
  kids(['pggm', 'pggf'], ['pgf'])
  b.couple('pgf', 'pgm')
  kids(['pgf', 'pgm'], ['father', 'uncle1', 'uncle2', 'uncle3'])
  b.couple('uncle1', 'uncle1Wife')
  kids(['uncle1Wife', 'uncle1'], ['pCousin2', 'pCousin3'])
  b.couple('uncle2', 'uncle2Wife')
  kids(['uncle2Wife', 'uncle2'], ['pCousin1'])
  b.couple('uncle3', 'uncle3Wife')
  kids(['uncle3', 'uncle3Wife'], ['pCousin4', 'pCousin5', 'pCousin6'])

  // The marriage joining them.
  b.couple('father', 'mother')
  kids(['father', 'mother'], ['me', 'sister'])
  return b.build()
}

/**
 * Four great-grandparent families with large sibling groups, joined by two marriages – the shape
 * of a real user's 78-person tree that exposed issues #112–#118 (names are invented). Seen from
 * `me` (generation 4, the root person):
 *
 * - generation 0: couple `aF` + `aM`, couple `bF` + `bM`, a single father `cF` and couple
 *   `dF` + `dM`;
 * - generation 1: A has 9 children (the ancestor `gmFather` last), B 5 (`gmMother` first), C 7
 *   (`c5` is married with one son, the ancestor `gfMother` last), D 7 (`gfFather` first; `d3` is
 *   married to `d3Husband`, four children are linked to her only and one to both);
 * - generation 2: `gm` (with a brother) is the child of `gmFather` + `gmMother`, `gf` (with a
 *   brother who married into a family of four sons) the child of `gfFather` + `gfMother`; the
 *   mother's parents `mF` + `mM` have no ancestors;
 * - generation 3: `gf` + `gm` have four sons – `father` and three married uncles with children;
 * - generation 4: `me` and `sister`, cousins and their children.
 */
export function collateralFixture(): FamilyTree {
  const b = new TreeBuilder()
  const add = (id: string, sex: 'male' | 'female'): void => {
    b.person(id, id, sex)
  }
  const kids = (parents: string[], children: [string, 'male' | 'female'][]): void => {
    for (const [c, sex] of children) {
      add(c, sex)
      for (const p of parents) b.child(p, c)
    }
  }
  const couple = (a: string, w: string): void => {
    b.couple(a, w)
  }
  const m = (id: string): [string, 'male'] => [id, 'male']
  const f = (id: string): [string, 'female'] => [id, 'female']

  for (const id of ['aF', 'bF', 'cF', 'dF']) add(id, 'male')
  for (const id of ['aM', 'bM', 'dM']) add(id, 'female')
  couple('aF', 'aM')
  couple('bF', 'bM')
  couple('dF', 'dM')

  // Generation 1.
  kids(['aF', 'aM'], [f('a1'), f('a2'), f('a3'), m('a4'), f('a5'), f('a6'), m('a7'), f('a8')])
  kids(['aF', 'aM'], [m('gmFather')])
  kids(['bF', 'bM'], [f('gmMother'), m('b2'), m('b3'), f('b4'), m('b5')])
  kids(['cF'], [f('c1'), m('c2'), m('c3'), m('c4'), f('c5'), f('c6'), f('gfMother')])
  add('c5Husband', 'male')
  couple('c5', 'c5Husband')
  kids(['c5', 'c5Husband'], [m('c5Son')])
  kids(['dF', 'dM'], [m('gfFather'), m('d2'), f('d3'), f('d4'), f('d5'), m('d6'), f('d7')])
  add('d3Husband', 'male')
  couple('d3Husband', 'd3')
  kids(['d3'], [m('d3a'), f('d3b'), m('d3c'), m('d3d')])
  kids(['d3Husband', 'd3'], [m('d3e')])

  // Generation 2.
  couple('gmFather', 'gmMother')
  kids(['gmFather', 'gmMother'], [m('gmBrother'), f('gm')])
  couple('gfFather', 'gfMother')
  kids(['gfFather', 'gfMother'], [m('gf'), m('gfBrother')])
  add('gfBrotherWife', 'female')
  couple('gfBrother', 'gfBrotherWife')
  kids(['gfBrother', 'gfBrotherWife'], [m('pc1'), m('pc2'), m('pc3'), m('pc4')])
  for (const [c, n] of [
    ['pc1', 2],
    ['pc2', 1],
    ['pc3', 1],
    ['pc4', 0]
  ] as const) {
    add(`${c}Wife`, 'female')
    couple(c, `${c}Wife`)
    kids(
      [c, `${c}Wife`],
      Array.from({ length: n }, (_, i) => m(`${c}Child${i + 1}`))
    )
  }
  add('mF', 'male')
  add('mM', 'female')
  couple('mF', 'mM')

  // Generation 3.
  couple('gf', 'gm')
  kids(['gf', 'gm'], [m('father'), m('uncle1'), m('uncle2'), m('uncle3')])
  kids(['mF', 'mM'], [f('mother')])
  for (const [u, n] of [
    ['uncle1', 1],
    ['uncle2', 2],
    ['uncle3', 3]
  ] as const) {
    add(`${u}Wife`, 'female')
    couple(`${u}Wife`, u)
    kids(
      [u, `${u}Wife`],
      Array.from({ length: n }, (_, i) => m(`${u}Child${i + 1}`))
    )
  }

  // Generation 4.
  couple('father', 'mother')
  kids(['father', 'mother'], [m('me'), f('sister')])

  const tree = b.build()
  return { ...tree, meta: { ...tree.meta, rootPersonId: 'me' } }
}
