import {
  addParentChild,
  addPartnership,
  addPerson,
  mergeTrees,
  removePerson,
  removeRelationship,
  renameTree,
  setRootPerson,
  updatePerson,
  updateRelationship,
  type PersonInput,
  type PersonPatch,
  type RelationshipPatch
} from '@core/model/operations'
import type {
  FamilyTree,
  ParentChildKind,
  PartnershipRelationship,
  Person,
  PersonId,
  Relationship,
  RelationshipId
} from '@core/model/types'

/**
 * A document change. `run` must be pure: it receives the current tree and returns the next
 * one (plus an optional result and the person to select afterwards).
 */
export interface Command<R = void> {
  /** i18n key describing the change (e.g. for "Undo …" labels). */
  label: string
  coalesceKey?: string
  run: (tree: FamilyTree) => { tree: FamilyTree; result: R; select?: PersonId | null }
}

export const renameTreeCommand = (name: string): Command => ({
  label: 'history.renameTree',
  coalesceKey: 'meta.name',
  run: (tree) => ({ tree: renameTree(tree, name), result: undefined })
})

export const addPersonCommand = (input: PersonInput): Command<Person> => ({
  label: 'history.addPerson',
  run: (tree) => {
    const { tree: next, person } = addPerson(tree, input)
    return { tree: next, result: person, select: person.id }
  }
})

export const updatePersonCommand = (id: PersonId, patch: PersonPatch): Command => ({
  label: 'history.editPerson',
  coalesceKey: `${id}:${Object.keys(patch).sort().join(',')}`,
  run: (tree) => ({ tree: updatePerson(tree, id, patch), result: undefined })
})

export const removePersonCommand = (id: PersonId): Command => ({
  label: 'history.deletePerson',
  run: (tree) => ({ tree: removePerson(tree, id), result: undefined, select: null })
})

export const addParentChildCommand = (
  parentId: PersonId,
  childId: PersonId,
  kind: ParentChildKind = 'biological'
): Command<Relationship> => ({
  label: 'history.addRelationship',
  run: (tree) => {
    const { tree: next, relationship } = addParentChild(tree, parentId, childId, kind)
    return { tree: next, result: relationship }
  }
})

export const addPartnershipCommand = (
  a: PersonId,
  b: PersonId,
  details: Partial<Omit<PartnershipRelationship, 'id' | 'type' | 'partnerIds'>> = {}
): Command<Relationship> => ({
  label: 'history.addRelationship',
  run: (tree) => {
    const { tree: next, relationship } = addPartnership(tree, a, b, details)
    return { tree: next, result: relationship }
  }
})

export const updateRelationshipCommand = (
  id: RelationshipId,
  patch: RelationshipPatch
): Command => ({
  label: 'history.editRelationship',
  coalesceKey: `${id}:${Object.keys(patch).sort().join(',')}`,
  run: (tree) => ({ tree: updateRelationship(tree, id, patch), result: undefined })
})

export const removeRelationshipCommand = (id: RelationshipId): Command => ({
  label: 'history.removeRelationship',
  run: (tree) => ({ tree: removeRelationship(tree, id), result: undefined })
})

export const mergeTreeCommand = (other: FamilyTree): Command => ({
  label: 'history.importCsv',
  run: (tree) => ({ tree: mergeTrees(tree, other), result: undefined })
})

export const setRootCommand = (id: PersonId | undefined): Command => ({
  label: 'history.setRoot',
  run: (tree) => ({ tree: setRootPerson(tree, id), result: undefined })
})

/** Runs several steps as a single undoable command (e.g. "add father" = person + link). */
export function composeCommands<R>(
  label: string,
  build: (tree: FamilyTree, run: <T>(cmd: Command<T>) => T) => R
): Command<R> {
  return {
    label,
    run: (initial) => {
      let tree = initial
      let select: PersonId | null | undefined
      const run = <T>(cmd: Command<T>): T => {
        const out = cmd.run(tree)
        tree = out.tree
        if (out.select !== undefined) select = out.select
        return out.result
      }
      const result = build(initial, run)
      return { tree, result, select }
    }
  }
}
