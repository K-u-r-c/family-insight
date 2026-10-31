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
