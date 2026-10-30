import { describe, expect, it } from 'vitest'
import {
  createEmptyTree,
  displayName,
  getAncestors,
  getChildren,
  getDescendants,
  getParents,
  getPartners,
  getPartnershipBetween,
  getSiblingGroups,
  getSiblings,
  isLiving
} from './tree'
import { SCHEMA_VERSION, type Person } from './types'
import { NOW, remarriageFixture, TreeBuilder } from '../test/fixtures'

const ids = (people: Person[]): string[] => people.map((p) => p.id).sort()

describe('createEmptyTree', () => {
  it('creates a versioned, empty document', () => {
    const tree = createEmptyTree('Rodzina', NOW)
    expect(tree.schemaVersion).toBe(SCHEMA_VERSION)
    expect(tree.meta).toEqual({
      name: 'Rodzina',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString()
    })
    expect(tree.persons).toEqual({})
    expect(tree.relationships).toEqual({})
  })
})

describe('relationship queries', () => {
  const tree = remarriageFixture()

  it('finds parents and children (incl. adoption)', () => {
    expect(ids(getParents(tree, 'piotr'))).toEqual(['anna', 'jan'])
    expect(ids(getChildren(tree, 'jan'))).toEqual(['ola', 'piotr'])
    expect(ids(getParents(tree, 'kuba'))).toEqual(['ola'])
  })

  it('finds every partner, including remarriages', () => {
    expect(ids(getPartners(tree, 'jan'))).toEqual(['anna', 'ewa'])
    expect(ids(getPartners(tree, 'ewa'))).toEqual(['jan'])
    expect(getPartnershipBetween(tree, 'ewa', 'jan')?.id).toBe('r2')
    expect(getPartnershipBetween(tree, 'ewa', 'anna')).toBeUndefined()
  })

  it('distinguishes full and half siblings', () => {
    expect(ids(getSiblings(tree, 'piotr'))).toEqual(['ola'])
    const t2 = new TreeBuilder()
      .person('m', 'M')
      .person('f', 'F')
      .person('x', 'X')
      .person('y', 'Y')
      .person('z', 'Z')
      .child('m', 'x')
      .child('f', 'x')
      .child('m', 'y')
      .child('f', 'y')
      .child('m', 'z')
      .build()
    const groups = getSiblingGroups(t2, 'x')
    expect(ids(groups.full)).toEqual(['y'])
    expect(ids(groups.half)).toEqual(['z'])
  })

  it('walks ancestors and descendants with depth limits', () => {
    expect(ids(getAncestors(tree, 'kuba'))).toEqual(['ewa', 'jan', 'ola'])
    expect(ids(getAncestors(tree, 'kuba', 1))).toEqual(['ola'])
    expect(ids(getDescendants(tree, 'jan'))).toEqual(['kuba', 'ola', 'piotr'])
    expect(ids(getDescendants(tree, 'jan', 1))).toEqual(['ola', 'piotr'])
  })
})

describe('person helpers', () => {
  const base: Person = {
    id: 'p',
    givenNames: ' Jan ',
    surname: 'Kowalski',
    sex: 'male',
    events: [],
    createdAt: '',
    updatedAt: ''
  }

  it('builds display names', () => {
    expect(displayName(base)).toBe('Jan Kowalski')
    expect(displayName({ givenNames: '', surname: 'Nowak' })).toBe('Nowak')
  })

  it('infers living status', () => {
    expect(isLiving(base)).toBeUndefined()
    expect(isLiving({ ...base, living: true })).toBe(true)
    expect(isLiving({ ...base, death: { place: 'Łódź' } })).toBe(false)
  })
})
