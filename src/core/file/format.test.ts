import { describe, expect, it } from 'vitest'
import { FileParseError, parseTree, serializeTree } from './format'
import { migrate } from './migrations'
import { remarriageFixture } from '../test/fixtures'
import { updatePerson } from '../model/operations'

function code(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (e) {
    return e instanceof FileParseError ? e.code : 'other'
  }
  return undefined
}

describe('.finsight format', () => {
  it('round-trips a tree exactly', () => {
    let tree = remarriageFixture()
    tree = updatePerson(tree, 'jan', {
      birth: { date: { value: '1890-05', qualifier: 'about' }, place: 'Kraków' },
      notes: 'Linia 1\nLinia 2 „cudzysłów"',
      photo: 'data:image/webp;base64,AAAA'
    })
    tree.meta.rootPersonId = 'jan'
    const text = serializeTree(tree)
    expect(text.startsWith('{\n  "format": "family-insight",\n  "schemaVersion": 1')).toBe(true)
    expect(parseTree(text)).toEqual(tree)
    expect(parseTree('\uFEFF' + text)).toEqual(tree)
  })

  it('rejects non-JSON and foreign JSON', () => {
    expect(code(() => parseTree('not json'))).toBe('invalid-json')
    expect(code(() => parseTree('{"hello":1}'))).toBe('not-a-family-tree')
    expect(code(() => parseTree('[]'))).toBe('not-a-family-tree')
    expect(code(() => parseTree('{"format":"family-insight","schemaVersion":"1"}'))).toBe(
      'not-a-family-tree'
    )
  })

  it('refuses files from a newer version', () => {
    const text = serializeTree(remarriageFixture()).replace(
      '"schemaVersion": 1',
      '"schemaVersion": 99'
    )
    expect(code(() => parseTree(text))).toBe('newer-version')
  })

  it('reports invalid shapes and broken references', () => {
    const doc = JSON.parse(serializeTree(remarriageFixture()))
    doc.persons.jan.sex = 'dragon'
    expect(code(() => parseTree(JSON.stringify(doc)))).toBe('invalid-data')
    const doc2 = JSON.parse(serializeTree(remarriageFixture()))
    doc2.relationships.r1.parentId = 'ghost'
    try {
      parseTree(JSON.stringify(doc2))
    } catch (e) {
      expect((e as FileParseError).details[0]).toContain('dangling-reference')
    }
  })
})

describe('migrations', () => {
  it('applies steps in order and stamps the version', () => {
    const steps = {
      0: (d: Record<string, unknown>) => ({ ...d, people: undefined, persons: d.people }),
      1: (d: Record<string, unknown>) => ({ ...d, upgraded: true })
    }
    const out = migrate({ schemaVersion: 0, people: { a: 1 } }, 0, 2, steps)
    expect(out).toMatchObject({ schemaVersion: 2, persons: { a: 1 }, upgraded: true })
  })

  it('fails loudly when a step is missing', () => {
    expect(() => migrate({}, 0, 1, {})).toThrow('Missing migration')
  })
})
