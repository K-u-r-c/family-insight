import { describe, expect, it } from 'vitest'
import { createEmptyTree, getChildren, getParents, getPartners, getSiblings } from './tree'
import { SCHEMA_VERSION, type FamilyTree, type Person, type Relationship } from './types'

const NOW = '2026-01-01T00:00:00.000Z'

function person(id: string, givenNames: string, sex: Person['sex']): Person {
  return { id, givenNames, surname: 'Kowalski', sex, createdAt: NOW, updatedAt: NOW }
}

function fixture(): FamilyTree {
  const tree = createEmptyTree('Test', new Date(NOW))
  for (const p of [
    person('jan', 'Jan', 'male'),
    person('anna', 'Anna', 'female'),
    person('ewa', 'Ewa', 'female'),
    person('piotr', 'Piotr', 'male'),
    person('ola', 'Ola', 'female')
  ]) {
    tree.persons[p.id] = p
  }
  const rels: Relationship[] = [
    { id: 'm1', type: 'partnership', partnerIds: ['jan', 'anna'], kind: 'marriage' },
    { id: 'm2', type: 'partnership', partnerIds: ['jan', 'ewa'], kind: 'marriage' },
    { id: 'r1', type: 'parent-child', parentId: 'jan', childId: 'piotr', kind: 'biological' },
    { id: 'r2', type: 'parent-child', parentId: 'anna', childId: 'piotr', kind: 'biological' },
    { id: 'r3', type: 'parent-child', parentId: 'jan', childId: 'ola', kind: 'biological' },
    { id: 'r4', type: 'parent-child', parentId: 'ewa', childId: 'ola', kind: 'biological' }
  ]
  for (const r of rels) tree.relationships[r.id] = r
  return tree
}

const ids = (people: Person[]): string[] => people.map((p) => p.id).sort()

describe('createEmptyTree', () => {
  it('creates a versioned, empty document', () => {
    const tree = createEmptyTree('Rodzina', new Date(NOW))
    expect(tree.schemaVersion).toBe(SCHEMA_VERSION)
    expect(tree.meta).toEqual({ name: 'Rodzina', createdAt: NOW, updatedAt: NOW })
    expect(tree.persons).toEqual({})
    expect(tree.relationships).toEqual({})
  })
})

describe('relationship queries', () => {
  const tree = fixture()

  it('finds parents and children', () => {
    expect(ids(getParents(tree, 'piotr'))).toEqual(['anna', 'jan'])
    expect(ids(getChildren(tree, 'jan'))).toEqual(['ola', 'piotr'])
  })

  it('finds every partner, including remarriages', () => {
    expect(ids(getPartners(tree, 'jan'))).toEqual(['anna', 'ewa'])
    expect(ids(getPartners(tree, 'ewa'))).toEqual(['jan'])
  })

  it('treats half-siblings as siblings', () => {
    expect(ids(getSiblings(tree, 'piotr'))).toEqual(['ola'])
  })
})
