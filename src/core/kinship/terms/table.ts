import { describe, expect, it } from 'vitest'
import type { Sex } from '../../model/types'
import { kinshipCases, type KinshipCase } from './cases'
import type { KinshipLanguage } from './common'

/** Expected names: `[as in the fixture, with the other sex]` – written from the references. */
export type Table = Record<KinshipCase, [string, string]>

/** Tests a language's names for every fixture relationship in both sexes (test helper). */
export function namerTable(language: string, namer: KinshipLanguage, table: Table): void {
  describe(`kinship names: ${language}`, () => {
    const cases = kinshipCases()
    it.each(cases.map(([id, sex, k], i) => [id, sex, k, i % 2] as const))(
      '%s (%s)',
      (id, _sex: Sex, k, flipped) => {
        expect(namer.name(k)?.term, `${id} ${flipped ? 'flipped' : ''}`).toBe(table[id][flipped])
      }
    )
  })
}
