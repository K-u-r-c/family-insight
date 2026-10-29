import { isModelError } from '@core/model/errors'
import {
  displayName,
  getParentLinks,
  getPartnershipBetween,
  getPartnerships,
  otherPartner
} from '@core/model/tree'
import type { FamilyTree, Person, PersonId, Sex } from '@core/model/types'
import { choose, toast } from '@renderer/components/ui'
import i18n from '@renderer/i18n'
import {
  addParentChildCommand,
  addPartnershipCommand,
  addPersonCommand,
  composeCommands,
  removeRelationshipCommand,
  type Command
} from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'

export type Role = 'father' | 'mother' | 'parent' | 'partner' | 'child' | 'sibling'

const t = (key: string, options?: Record<string, unknown>): string =>
  i18n.t(key as never, options as never) as unknown as string

/** Runs a command, translating model errors into a friendly toast. Returns success. */
export function runCommand<R>(command: Command<R>): R | undefined {
  try {
    return useDocument.getState().dispatch(command)
  } catch (error) {
    if (isModelError(error)) {
      toast({ message: t(`errors.model.${error.code}`), tone: 'error' })
      return undefined
    }
    throw error
  }
}

function biologicalParents(tree: FamilyTree, id: PersonId): PersonId[] {
  return getParentLinks(tree, id)
    .filter((r) => r.kind === 'biological')
    .map((r) => r.parentId)
}

/** If the child has exactly one other biological parent, partner them with the new parent. */
function partnerWithOtherParent(
  tree: FamilyTree,
  childId: PersonId,
  newParentId: PersonId,
  run: <T>(cmd: Command<T>) => T
): void {
  const others = biologicalParents(tree, childId).filter((id) => id !== newParentId)
  const [other] = others
  if (others.length === 1 && other && !getPartnershipBetween(tree, other, newParentId)) {
    run(addPartnershipCommand(other, newParentId))
  }
}

function familySurname(person: Person): string {
  return person.birthSurname || person.surname
}

/** Which partner is the other parent of a new child? Asks when there are several. */
async function pickOtherParent(
  tree: FamilyTree,
  person: Person
): Promise<PersonId | null | undefined> {
  const partners = getPartnerships(tree, person.id).map(
    (r) => tree.persons[otherPartner(r, person.id)]!
  )
  if (partners.length === 0) return null
  if (partners.length === 1) return partners[0]!.id
  const choice = await choose({
    title: t('relations.whichParent'),
    message: t('relations.whichParentText', { name: displayName(person) }),
    options: [
      ...partners.map((p) => ({ value: p.id, label: displayName(p) || t('person.unnamed') })),
      { value: '__none__', label: t('relations.noOtherParent') }
    ]
  })
  if (choice === null) return undefined
  return choice === '__none__' ? null : choice
}

function childSurname(person: Person, other: Person | undefined): string {
  if (person.sex === 'male') return person.surname
  if (other?.sex === 'male') return other.surname
  return person.surname
}

const SEX_FOR_ROLE: Partial<Record<Role, Sex>> = { father: 'male', mother: 'female' }

function oppositeSex(sex: Sex): Sex {
  return sex === 'male' ? 'female' : sex === 'female' ? 'male' : 'unknown'
}

/** Creates a new relative of `person` in one undoable step and selects them for editing. */
export async function addNewRelative(person: Person, role: Role): Promise<void> {
  const tree = useDocument.getState().tree
  if (!tree) return
  let otherParentId: PersonId | null | undefined = null
  if (role === 'child') {
    otherParentId = await pickOtherParent(tree, person)
    if (otherParentId === undefined) return
  }

  runCommand(
    composeCommands(`relations.add.${role}`, (initial, run) => {
      if (role === 'father' || role === 'mother' || role === 'parent') {
        const parent = run(
          addPersonCommand({
            givenNames: '',
            surname: role === 'father' ? familySurname(person) : '',
            sex: SEX_FOR_ROLE[role] ?? 'unknown'
          })
        )
        run(addParentChildCommand(parent.id, person.id))
        partnerWithOtherParent(initial, person.id, parent.id, run)
      } else if (role === 'partner') {
        const partner = run(
          addPersonCommand({ givenNames: '', surname: '', sex: oppositeSex(person.sex) })
        )
        run(addPartnershipCommand(person.id, partner.id))
      } else if (role === 'child') {
        const other = otherParentId ? initial.persons[otherParentId] : undefined
        const child = run(
          addPersonCommand({ givenNames: '', surname: childSurname(person, other), sex: 'unknown' })
        )
        run(addParentChildCommand(person.id, child.id))
        if (other) run(addParentChildCommand(other.id, child.id))
      } else if (role === 'sibling') {
        const sibling = run(
          addPersonCommand({ givenNames: '', surname: familySurname(person), sex: 'unknown' })
        )
        for (const link of getParentLinks(initial, person.id)) {
          run(addParentChildCommand(link.parentId, sibling.id, link.kind))
        }
      }
    })
  )
}

/** Links an existing person as a relative of `person` (one undoable step). */
export async function linkExistingRelative(
  person: Person,
  role: Role,
  other: Person
): Promise<void> {
  const tree = useDocument.getState().tree
  if (!tree) return
  let otherParentId: PersonId | null | undefined = null
  if (role === 'child') {
    otherParentId = await pickOtherParent(tree, person)
    if (otherParentId === undefined) return
  }
  const linked = runCommand(
    composeCommands(`relations.add.${role}`, (initial, run) => {
      if (role === 'father' || role === 'mother' || role === 'parent') {
        run(addParentChildCommand(other.id, person.id))
        partnerWithOtherParent(initial, person.id, other.id, run)
      } else if (role === 'partner') {
        run(addPartnershipCommand(person.id, other.id))
      } else if (role === 'child') {
        run(addParentChildCommand(person.id, other.id))
        const existing = new Set(getParentLinks(initial, other.id).map((r) => r.parentId))
        if (otherParentId && !existing.has(otherParentId))
          run(addParentChildCommand(otherParentId, other.id))
      } else if (role === 'sibling') {
        const existing = new Set(getParentLinks(initial, other.id).map((r) => r.parentId))
        for (const link of getParentLinks(initial, person.id)) {
          if (!existing.has(link.parentId))
            run(addParentChildCommand(link.parentId, other.id, link.kind))
        }
      }
      return true
    })
  )
  if (linked)
    toast({ message: t('relations.linked', { name: displayName(other) }), tone: 'success' })
}

/** Removes a relationship with an Undo toast. */
export function removeRelationshipWithUndo(id: string): void {
  runCommand(removeRelationshipCommand(id))
  if (!useDocument.getState().tree?.relationships[id]) {
    toast({
      message: t('relations.removed'),
      action: { label: t('common.undo'), onClick: () => useDocument.getState().undo() }
    })
  }
}
