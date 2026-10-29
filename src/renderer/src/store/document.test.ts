import { beforeEach, describe, expect, it } from 'vitest'
import { isModelError } from '@core/model/errors'
import {
  addParentChildCommand,
  addPartnershipCommand,
  addPersonCommand,
  composeCommands,
  removePersonCommand,
  updatePersonCommand
} from './commands'
import { selectCanRedo, selectCanUndo, selectIsDirty, useDocument } from './document'

const person = (givenNames: string) => ({ givenNames, surname: 'Nowak', sex: 'unknown' as const })

describe('document store', () => {
  beforeEach(() => useDocument.getState().newDocument('Test'))

  it('starts clean and becomes dirty after a change', () => {
    const s = useDocument.getState()
    expect(selectIsDirty(s)).toBe(false)
    s.dispatch(addPersonCommand(person('Jan')))
    expect(selectIsDirty(useDocument.getState())).toBe(true)
    expect(selectCanUndo(useDocument.getState())).toBe(true)
  })

  it('selects new people and undoes/redoes', () => {
    const jan = useDocument.getState().dispatch(addPersonCommand(person('Jan')))
    expect(useDocument.getState().selectedPersonId).toBe(jan.id)
    useDocument.getState().undo()
    expect(useDocument.getState().tree!.persons[jan.id]).toBeUndefined()
    expect(useDocument.getState().selectedPersonId).toBeNull()
    expect(selectIsDirty(useDocument.getState())).toBe(false)
    expect(selectCanRedo(useDocument.getState())).toBe(true)
    useDocument.getState().redo()
    expect(useDocument.getState().tree!.persons[jan.id]?.givenNames).toBe('Jan')
  })

  it('tracks the saved snapshot', () => {
    const s = useDocument.getState()
    const jan = s.dispatch(addPersonCommand(person('Jan')))
    useDocument.getState().markSaved('/tmp/a.finsight')
    expect(selectIsDirty(useDocument.getState())).toBe(false)
    useDocument.getState().dispatch(updatePersonCommand(jan.id, { givenNames: 'Janek' }))
    expect(selectIsDirty(useDocument.getState())).toBe(true)
    useDocument.getState().undo()
    expect(selectIsDirty(useDocument.getState())).toBe(false)
    expect(useDocument.getState().filePath).toBe('/tmp/a.finsight')
  })

  it('composes several steps into one undo step', () => {
    const child = useDocument.getState().dispatch(addPersonCommand(person('Ola')))
    useDocument.getState().dispatch(
      composeCommands('history.addParent', (_tree, run) => {
        const father = run(addPersonCommand(person('Jan')))
        run(addParentChildCommand(father.id, child.id))
        return father
      })
    )
    expect(Object.keys(useDocument.getState().tree!.persons)).toHaveLength(2)
    useDocument.getState().undo()
    expect(Object.keys(useDocument.getState().tree!.persons)).toEqual([child.id])
    expect(Object.keys(useDocument.getState().tree!.relationships)).toHaveLength(0)
  })

  it('leaves the document untouched when a command is rejected', () => {
    const jan = useDocument.getState().dispatch(addPersonCommand(person('Jan')))
    const before = useDocument.getState().tree
    let error: unknown
    try {
      useDocument.getState().dispatch(addParentChildCommand(jan.id, jan.id))
    } catch (e) {
      error = e
    }
    expect(isModelError(error)).toBe(true)
    expect(useDocument.getState().tree).toBe(before)
  })

  it('deleting a person is one step and undo restores everything exactly', () => {
    const s = useDocument.getState()
    const a = s.dispatch(addPersonCommand(person('Anna')))
    const b = useDocument.getState().dispatch(addPersonCommand(person('Jan')))
    const c = useDocument.getState().dispatch(addPersonCommand(person('Ola')))
    useDocument.getState().dispatch(addPartnershipCommand(a.id, b.id))
    useDocument.getState().dispatch(addParentChildCommand(a.id, c.id))
    const before = useDocument.getState().tree
    useDocument.getState().dispatch(removePersonCommand(a.id))
    const after = useDocument.getState().tree!
    expect(after.persons[a.id]).toBeUndefined()
    expect(Object.keys(after.relationships)).toHaveLength(0)
    expect(useDocument.getState().selectedPersonId).toBeNull()
    useDocument.getState().undo()
    expect(useDocument.getState().tree).toBe(before)
  })

  it('renames the tree as an undoable step', () => {
    useDocument.getState().rename('Kowalscy')
    expect(useDocument.getState().tree!.meta.name).toBe('Kowalscy')
    useDocument.getState().undo()
    expect(useDocument.getState().tree!.meta.name).toBe('Test')
  })
})
