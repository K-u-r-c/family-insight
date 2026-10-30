import { describe, expect, it } from 'vitest'
import { isModelError } from './errors'
import { addPersonEvent } from './operations'
import {
  addCitation,
  addRepository,
  addSource,
  factsWithoutSource,
  getCitations,
  getCitationsForSource,
  removeCitation,
  removeRepository,
  removeSource,
  repairSourceReferences,
  sourcesOfPerson,
  updateCitation,
  updateSource,
  type CitationTarget
} from './sources'
import type { FamilyTree } from './types'
import { validateTree } from './validate'
import { TreeBuilder } from '../test/fixtures'

function code(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (e) {
    return isModelError(e) ? e.code : 'other'
  }
  return undefined
}

const d = (value: string) => ({ value, qualifier: 'exact' as const })

/** Jan (born 1890) and Anna, married; one event; a parish register in an archive. */
function base(): FamilyTree {
  let tree = new TreeBuilder()
    .person('jan', 'Jan', 'male', { birth: { date: d('1890') } })
    .person('anna', 'Anna', 'female')
    .couple('jan', 'anna').tree
  tree = addPersonEvent(tree, 'jan', { type: 'baptism', date: d('1890') }, { id: 'e1' }).tree
  tree = addRepository(tree, { name: 'Archdiocesan Archive' }, { id: 'a1' }).tree
  tree = addSource(tree, { title: 'Parish register 1890', repositoryId: 'a1' }, { id: 's1' }).tree
  return tree
}

const partnership = (tree: FamilyTree): string =>
  Object.values(tree.relationships).find((r) => r.type === 'partnership')!.id

describe('citations', () => {
  it('attaches citations to every kind of fact and reads them back', () => {
    let tree = base()
    const rel = partnership(tree)
    const targets: CitationTarget[] = [
      { kind: 'person', personId: 'jan' },
      { kind: 'birth', personId: 'jan' },
      { kind: 'death', personId: 'jan' },
      { kind: 'event', personId: 'jan', eventId: 'e1' },
      { kind: 'relationship', relationshipId: rel },
      { kind: 'partnership-start', relationshipId: rel },
      { kind: 'partnership-end', relationshipId: rel }
    ]
    targets.forEach((target, i) => {
      tree = addCitation(tree, target, { sourceId: 's1', page: `p. ${i}` }, { id: `c${i}` }).tree
    })
    targets.forEach((target, i) =>
      expect(getCitations(tree, target)).toEqual([{ id: `c${i}`, sourceId: 's1', page: `p. ${i}` }])
    )
    expect(tree.persons.jan!.birth).toEqual({ date: d('1890'), citations: [expect.anything()] })
    expect(getCitationsForSource(tree, 's1')).toHaveLength(targets.length)
    expect(validateTree(tree)).toEqual([])
  })

  it('edits and removes citations; an empty list disappears from the data', () => {
    let tree = addCitation(
      base(),
      { kind: 'death', personId: 'jan' },
      { sourceId: 's1' },
      { id: 'c1' }
    ).tree
    tree = updateCitation(tree, { kind: 'death', personId: 'jan' }, 'c1', {
      quality: 'primary',
      text: 'Zmarł'
    })
    expect(tree.persons.jan!.death!.citations![0]).toMatchObject({
      quality: 'primary',
      text: 'Zmarł'
    })
    tree = removeCitation(tree, { kind: 'death', personId: 'jan' }, 'c1')
    expect(tree.persons.jan!.death).toBeUndefined()
  })

  it('rejects unknown sources, facts and citations', () => {
    const tree = base()
    expect(
      code(() => addCitation(tree, { kind: 'person', personId: 'jan' }, { sourceId: 'x' }))
    ).toBe('source-not-found')
    expect(
      code(() => addCitation(tree, { kind: 'person', personId: 'ghost' }, { sourceId: 's1' }))
    ).toBe('person-not-found')
    expect(
      code(() =>
        addCitation(tree, { kind: 'event', personId: 'jan', eventId: 'x' }, { sourceId: 's1' })
      )
    ).toBe('event-not-found')
    expect(code(() => removeCitation(tree, { kind: 'person', personId: 'jan' }, 'nope'))).toBe(
      'citation-not-found'
    )
  })
})

describe('sources and repositories', () => {
  it('deleting a source removes all its citations', () => {
    let tree = base()
    tree = addSource(tree, { title: 'Census 1921' }, { id: 's2' }).tree
    tree = addCitation(tree, { kind: 'birth', personId: 'jan' }, { sourceId: 's1' }).tree
    tree = addCitation(
      tree,
      { kind: 'event', personId: 'jan', eventId: 'e1' },
      { sourceId: 's1' }
    ).tree
    tree = addCitation(tree, { kind: 'person', personId: 'anna' }, { sourceId: 's2' }).tree
    tree = removeSource(tree, 's1')
    expect(tree.sources.s1).toBeUndefined()
    expect(getCitationsForSource(tree, 's1')).toEqual([])
    expect(getCitationsForSource(tree, 's2')).toHaveLength(1)
    expect(tree.persons.jan!.birth).toEqual({ date: d('1890') })
  })

  it('edits sources and keeps repository links valid', () => {
    let tree = updateSource(base(), 's1', { callNumber: 'Sygn. 12', author: undefined })
    expect(tree.sources.s1).toEqual({
      id: 's1',
      title: 'Parish register 1890',
      repositoryId: 'a1',
      callNumber: 'Sygn. 12'
    })
    expect(code(() => updateSource(tree, 's1', { repositoryId: 'nowhere' }))).toBe(
      'repository-not-found'
    )
    tree = removeRepository(tree, 'a1')
    expect(tree.sources.s1!.repositoryId).toBeUndefined()
  })

  it('lists facts without a source and the sources of a person', () => {
    let tree = base()
    // Jan's birth, his baptism and the partnership are recorded facts without sources.
    expect(
      factsWithoutSource(tree)
        .map((t) => t.kind)
        .sort()
    ).toEqual(['birth', 'event', 'relationship'])
    tree = addCitation(tree, { kind: 'birth', personId: 'jan' }, { sourceId: 's1' }).tree
    expect(
      factsWithoutSource(tree)
        .map((t) => t.kind)
        .sort()
    ).toEqual(['event', 'relationship'])
    expect([...sourcesOfPerson(tree, 'jan')]).toEqual(['s1'])
    expect([...sourcesOfPerson(tree, 'anna')]).toEqual([])
  })

  it('reports and repairs dangling references', () => {
    let tree = addCitation(base(), { kind: 'birth', personId: 'jan' }, { sourceId: 's1' }).tree
    tree = { ...tree, sources: { s9: { id: 's9', title: 'Lost', repositoryId: 'gone' } } }
    expect(
      validateTree(tree)
        .map((i) => i.code)
        .sort()
    ).toEqual(['dangling-citation', 'dangling-repository'])
    const { tree: fixed, removedCitations } = repairSourceReferences(tree)
    expect(removedCitations).toBe(1)
    expect(fixed.persons.jan!.birth).toEqual({ date: d('1890') })
    expect(fixed.sources.s9).toEqual({ id: 's9', title: 'Lost' })
    expect(validateTree(fixed)).toEqual([])
  })
})
