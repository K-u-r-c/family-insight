import { addParentChild, addPartnership, addPerson, type PersonInput } from '../model/operations'
import { createEmptyTree } from '../model/tree'
import type { FamilyTree, Sex } from '../model/types'

export const NOW = new Date('2026-01-01T00:00:00.000Z')

/** Small fluent builder for test trees with readable, deterministic ids. */
export class TreeBuilder {
  tree: FamilyTree = createEmptyTree('Test', NOW)
  private n = 0

  person(
    id: string,
    givenNames: string,
    sex: Sex = 'unknown',
    extra: Partial<PersonInput> = {}
  ): this {
    this.tree = addPerson(
      this.tree,
      { givenNames, surname: 'Kowalski', sex, ...extra },
      { id, now: NOW }
    ).tree
    return this
  }

  child(
    parentId: string,
    childId: string,
    kind: 'biological' | 'adoptive' | 'step' | 'foster' = 'biological'
  ): this {
    this.tree = addParentChild(this.tree, parentId, childId, kind, {
      id: `r${++this.n}`,
      now: NOW
    }).tree
    return this
  }

  couple(a: string, b: string): this {
    this.tree = addPartnership(this.tree, a, b, {}, { id: `r${++this.n}`, now: NOW }).tree
    return this
  }

  build(): FamilyTree {
    return this.tree
  }
}

/** Jan married Anna (son Piotr) and later Ewa (daughter Ola). Ola adopted Kuba. */
export function remarriageFixture(): FamilyTree {
  return new TreeBuilder()
    .person('jan', 'Jan', 'male')
    .person('anna', 'Anna', 'female')
    .person('ewa', 'Ewa', 'female')
    .person('piotr', 'Piotr', 'male')
    .person('ola', 'Ola', 'female')
    .person('kuba', 'Kuba', 'male')
    .couple('jan', 'anna')
    .couple('jan', 'ewa')
    .child('jan', 'piotr')
    .child('anna', 'piotr')
    .child('jan', 'ola')
    .child('ewa', 'ola')
    .child('ola', 'kuba', 'adoptive')
    .build()
}
