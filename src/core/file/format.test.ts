import { describe, expect, it } from 'vitest'
import { FileParseError, parseTree, parseTreeWithWarnings, serializeTree } from './format'
import { addCitation, addRepository, addSource } from '../model/sources'
import { migrate } from './migrations'
import { remarriageFixture } from '../test/fixtures'
import { addPersonEvent, updatePerson } from '../model/operations'
import { SCHEMA_VERSION } from '../model/types'

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
    expect(text.startsWith('{\n  "format": "family-insight",\n  "schemaVersion": 2')).toBe(true)
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
      '"schemaVersion": 2',
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

/** The tree as a schema-v1 file (before life events existed). */
function asVersion1(tree: ReturnType<typeof remarriageFixture>): string {
  const doc = JSON.parse(serializeTree(tree))
  doc.schemaVersion = 1
  for (const p of Object.values(doc.persons) as Record<string, unknown>[]) delete p.events
  return JSON.stringify(doc, null, 2)
}

describe('schema v2: life events', () => {
  it('migrates v1 files: every person gets an empty event list', () => {
    const tree = parseTree(asVersion1(remarriageFixture()))
    expect(tree.schemaVersion).toBe(SCHEMA_VERSION)
    for (const person of Object.values(tree.persons)) expect(person.events).toEqual([])
    expect(tree).toEqual(remarriageFixture())
  })

  it('opens a v1 file, saves it as v2 and re-opens it identically', () => {
    const fromV1 = parseTree(asVersion1(remarriageFixture()))
    const saved = serializeTree(fromV1)
    expect(JSON.parse(saved).schemaVersion).toBe(2)
    expect(parseTree(saved)).toEqual(fromV1)
  })

  it('round-trips people with events', () => {
    const tree = addPersonEvent(remarriageFixture(), 'jan', {
      type: 'military-service',
      date: { value: '1914', qualifier: 'exact' },
      endDate: { value: '1918', qualifier: 'exact' },
      place: 'Kraków',
      description: '13th Infantry Regiment'
    }).tree
    expect(parseTree(serializeTree(tree))).toEqual(tree)
  })

  it('validates events', () => {
    const bad = (mutate: (events: unknown[]) => void): string | undefined => {
      const doc = JSON.parse(serializeTree(remarriageFixture()))
      doc.persons.jan.events = [{ id: 'e1', type: 'baptism' }]
      mutate(doc.persons.jan.events)
      return code(() => parseTree(JSON.stringify(doc)))
    }
    expect(bad(() => {})).toBeUndefined()
    expect(bad((e) => ((e[0] as Record<string, unknown>).type = 'coronation'))).toBe('invalid-data')
    expect(
      bad((e) => ((e[0] as Record<string, unknown>).date = { value: '19', qualifier: 'exact' }))
    ).toBe('invalid-data')
    expect(bad((e) => e.push({ id: 'e1', type: 'burial' }))).toBe('invalid-data')
    expect(bad((e) => ((e[0] as Record<string, unknown>).place = 5))).toBe('invalid-data')
    const doc = JSON.parse(serializeTree(remarriageFixture()))
    doc.persons.jan.events = 'none'
    expect(code(() => parseTree(JSON.stringify(doc)))).toBe('invalid-data')
  })

  it('an app that only knows v1 refuses v2 files as "newer version"', () => {
    // A v1.0.x app has SCHEMA_VERSION 1; a v2 file is newer for it, like v3 is for this one.
    const text = serializeTree(remarriageFixture()).replace(
      '"schemaVersion": 2',
      `"schemaVersion": ${SCHEMA_VERSION + 1}`
    )
    expect(code(() => parseTree(text))).toBe('newer-version')
  })
})

describe('schema v2: sources and citations', () => {
  it('migrates v1 files to empty sources and repositories', () => {
    const doc = JSON.parse(asVersion1(remarriageFixture()))
    delete doc.sources
    delete doc.repositories
    const tree = parseTree(JSON.stringify(doc))
    expect(tree.sources).toEqual({})
    expect(tree.repositories).toEqual({})
  })

  it('round-trips sources, repositories and citations', () => {
    let tree = addRepository(remarriageFixture(), { name: 'Archive', url: 'https://x.pl' }).tree
    const repositoryId = Object.keys(tree.repositories)[0]!
    const { tree: withSource, source } = addSource(tree, { title: 'Census 1921', repositoryId })
    tree = addCitation(
      withSource,
      { kind: 'birth', personId: 'jan' },
      {
        sourceId: source.id,
        page: '12',
        quality: 'primary'
      }
    ).tree
    expect(parseTree(serializeTree(tree))).toEqual(tree)
  })

  it('validates sources and citations', () => {
    const doc = JSON.parse(serializeTree(remarriageFixture()))
    doc.sources = { s1: { id: 's1' } }
    expect(code(() => parseTree(JSON.stringify(doc)))).toBe('invalid-data')
    const doc2 = JSON.parse(serializeTree(remarriageFixture()))
    doc2.sources = { s1: { id: 's1', title: 'Register' } }
    doc2.persons.jan.citations = [{ id: 'c1', sourceId: 's1', quality: 'excellent' }]
    expect(code(() => parseTree(JSON.stringify(doc2)))).toBe('invalid-data')
  })

  it('drops citations of missing sources on load and reports it', () => {
    const doc = JSON.parse(serializeTree(remarriageFixture()))
    doc.persons.jan.citations = [{ id: 'c1', sourceId: 'missing' }]
    const { tree, warnings } = parseTreeWithWarnings(JSON.stringify(doc))
    expect(tree.persons.jan!.citations).toBeUndefined()
    expect(warnings).toEqual([
      { severity: 'warning', code: 'dangling-citations-removed', params: { count: 1 } }
    ])
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
