import type { Sex } from '../../model/types'
import { findRelationships, type Kinship } from '../kinship'
import { kinshipFixture } from '../fixture'

/**
 * The relationships of the kinship fixture, seen from `me`, for the namer tests: the first
 * relationship to each person, and the same with the other sex of `b` (side, branch and partner
 * sex unchanged). Shared by every language's tests.
 */
export const KINSHIP_CASES = [
  'f',
  'm',
  'gf',
  'mgm',
  'ggf',
  'gggf',
  'son',
  'gs',
  'ggs',
  'ad',
  'br',
  'hb',
  'u',
  'mt',
  'hs',
  'gu',
  'nep',
  'gnep',
  'c1',
  'mc',
  'c1d',
  'gu1',
  'sc2',
  'sc3',
  'h',
  'hf',
  'hm',
  'hbr',
  'sil',
  'dil',
  'hbrw',
  'sm',
  'sb'
] as const

export type KinshipCase = (typeof KINSHIP_CASES)[number]

const OTHER: Record<Sex, Sex> = {
  male: 'female',
  female: 'male',
  other: 'other',
  unknown: 'unknown'
}

/** `[case, sex of b, descriptor]` for every case in both sexes. */
export function kinshipCases(): [KinshipCase, Sex, Kinship][] {
  const tree = kinshipFixture()
  return KINSHIP_CASES.flatMap((id) => {
    const k = findRelationships(tree, 'me', id)[0]!
    return [
      [id, k.sexB, k],
      [id, OTHER[k.sexB], { ...k, sexB: OTHER[k.sexB] }]
    ] as [KinshipCase, Sex, Kinship][]
  })
}
