import { afterEach, describe, expect, it } from 'vitest'
import { registerBuiltInFormats } from './formats'
import { formatForPath, getFormat, listFormats, registerFormat, unregisterFormat } from './registry'
import { remarriageFixture } from '../test/fixtures'
import type { FamilyTree } from '../model/types'

afterEach(() => unregisterFormat('dummy'))

describe('format registry', () => {
  it('registers built-in formats idempotently', () => {
    registerBuiltInFormats()
    registerBuiltInFormats()
    expect(getFormat('finsight')?.kind).toBe('native')
    expect(formatForPath('/x/Family.FINSIGHT')?.id).toBe('finsight')
  })

  it('round-trips a tree through a custom adapter', () => {
    registerFormat({
      id: 'dummy',
      extensions: ['dmy'],
      labelKey: 'files.allFiles',
      kind: 'interchange',
      export: (tree: FamilyTree) => JSON.stringify(tree),
      import: (content: string) => ({
        tree: JSON.parse(content) as FamilyTree,
        errors: [],
        warnings: []
      })
    })
    const adapter = formatForPath('a.dmy')!
    const tree = remarriageFixture()
    expect(adapter.import!(adapter.export!(tree)).tree).toEqual(tree)
    expect(listFormats({ canImport: true }).map((f) => f.id)).toContain('dummy')
    expect(() =>
      registerFormat({ id: 'dummy', extensions: [], labelKey: '', kind: 'native' })
    ).toThrow()
  })

  it('round-trips through the native adapter', () => {
    registerBuiltInFormats()
    const tree = remarriageFixture()
    const f = getFormat('finsight')!
    expect(f.import!(f.export!(tree)).tree).toEqual(tree)
  })
})
