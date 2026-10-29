import { describe, expect, it } from 'vitest'
import { isModelError, ModelError } from './errors'
import {
  addParentChild,
  addPartnership,
  addPerson,
  removePerson,
  removeRelationship,
  renameTree,
  setRootPerson,
  updatePerson,
  updateRelationship
} from './operations'
import { createEmptyTree, getChildren, getParents } from './tree'
import { NOW, remarriageFixture, TreeBuilder } from '../test/fixtures'

function code(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (e) {
    return isModelError(e) ? e.code : 'other'
  }
  return undefined
}

describe('addPerson / updatePerson', () => {
  it('adds a person immutably with timestamps', () => {
    const empty = createEmptyTree('T', NOW)
    const { tree, person } = addPerson(
      empty,
      { givenNames: 'Jan', surname: 'Nowak', sex: 'male' },
      { now: NOW }
    )
    expect(empty.persons).toEqual({})
    expect(tree.persons[person.id]).toEqual({
      id: person.id,
      givenNames: 'Jan',
      surname: 'Nowak',
      sex: 'male',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString()
    })
    expect(person.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('rejects duplicate ids', () => {
    const tree = new TreeBuilder().person('a', 'A').build()
    expect(
      code(() => addPerson(tree, { givenNames: 'B', surname: '', sex: 'unknown' }, { id: 'a' }))
    ).toBe('duplicate-id')
  })

  it('patches fields and clears explicit undefined', () => {
    const tree = new TreeBuilder().person('a', 'A', 'male', { notes: 'x' }).build()
    const later = new Date('2026-02-01T00:00:00Z')
    const next = updatePerson(tree, 'a', { surname: 'Nowak', notes: undefined }, { now: later })
    expect(next.persons.a).toMatchObject({ surname: 'Nowak', updatedAt: later.toISOString() })
    expect(next.persons.a).not.toHaveProperty('notes')
    expect(tree.persons.a?.notes).toBe('x')
    expect(code(() => updatePerson(tree, 'zzz', {}))).toBe('person-not-found')
  })
})

describe('relationship invariants', () => {
  const base = (): TreeBuilder =>
    new TreeBuilder().person('a', 'A').person('b', 'B').person('c', 'C').person('d', 'D')

  it('rejects self relationships', () => {
    const tree = base().build()
    expect(code(() => addParentChild(tree, 'a', 'a'))).toBe('self-relationship')
    expect(code(() => addPartnership(tree, 'a', 'a'))).toBe('self-relationship')
  })

  it('rejects duplicates, including reversed partnerships', () => {
    const tree = base().child('a', 'b').couple('a', 'c').build()
    expect(code(() => addParentChild(tree, 'a', 'b', 'adoptive'))).toBe('duplicate-relationship')
    expect(code(() => addPartnership(tree, 'c', 'a'))).toBe('duplicate-relationship')
  })

  it('rejects ancestry cycles', () => {
    const tree = base().child('a', 'b').child('b', 'c').build()
    expect(code(() => addParentChild(tree, 'c', 'a'))).toBe('ancestry-cycle')
    expect(code(() => addParentChild(tree, 'b', 'a'))).toBe('ancestry-cycle')
  })

  it('allows at most two biological parents but extra adoptive ones', () => {
    const tree = base().child('a', 'd').child('b', 'd').build()
    expect(code(() => addParentChild(tree, 'c', 'd'))).toBe('too-many-biological-parents')
    const adopted = addParentChild(tree, 'c', 'd', 'adoptive').tree
    expect(getParents(adopted, 'd')).toHaveLength(3)
  })

  it('rejects unknown persons', () => {
    expect(code(() => addParentChild(base().build(), 'a', 'nope'))).toBe('person-not-found')
  })

  it('validates updates to relationships', () => {
    const tree = base().child('a', 'b').child('c', 'b').child('d', 'b', 'adoptive').build()
    expect(code(() => updateRelationship(tree, 'r3', { kind: 'biological' }))).toBe(
      'too-many-biological-parents'
    )
    const next = updateRelationship(tree, 'r3', { kind: 'step' })
    expect(next.relationships.r3).toMatchObject({ kind: 'step' })
    expect(code(() => updateRelationship(tree, 'missing', {}))).toBe('relationship-not-found')
  })
})

describe('removal', () => {
  it('removes a person and cascades to their relationships', () => {
    const tree = setRootPerson(remarriageFixture(), 'jan')
    const next = removePerson(tree, 'jan', { now: NOW })
    expect(next.persons.jan).toBeUndefined()
    expect(Object.values(next.relationships).some((r) => JSON.stringify(r).includes('"jan"'))).toBe(
      false
    )
    expect(getParents(next, 'piotr').map((p) => p.id)).toEqual(['anna'])
    expect(next.meta.rootPersonId).toBeUndefined()
    expect(tree.persons.jan).toBeDefined()
  })

  it('removes a single relationship', () => {
    const tree = remarriageFixture()
    const next = removeRelationship(tree, 'r3')
    expect(getChildren(next, 'jan').map((p) => p.id)).toEqual(['ola'])
  })
})

describe('meta', () => {
  it('renames and sets root', () => {
    const tree = renameTree(remarriageFixture(), 'Kowalscy')
    expect(tree.meta.name).toBe('Kowalscy')
    expect(() => setRootPerson(tree, 'ghost')).toThrow(ModelError)
  })
})
