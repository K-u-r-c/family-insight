import { describe, expect, it } from 'vitest'
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  redoLabel,
  undoHistory,
  undoLabel
} from './history'

describe('history', () => {
  it('pushes, undoes and redoes', () => {
    let h = createHistory('a')
    h = pushHistory(h, 'b', { label: 'B', now: 0 })
    h = pushHistory(h, 'c', { label: 'C', now: 5000 })
    expect(h.present).toBe('c')
    expect(undoLabel(h)).toBe('C')
    h = undoHistory(h)
    expect(h.present).toBe('b')
    expect(redoLabel(h)).toBe('C')
    h = undoHistory(h)
    expect(h.present).toBe('a')
    expect(canUndo(h)).toBe(false)
    expect(undoHistory(h)).toBe(h)
    h = redoHistory(h)
    h = redoHistory(h)
    expect(h.present).toBe('c')
    expect(canRedo(h)).toBe(false)
    expect(redoHistory(h)).toBe(h)
  })

  it('drops the redo stack on a new change', () => {
    let h = pushHistory(createHistory(1), 2, { label: 'x', now: 0 })
    h = undoHistory(h)
    h = pushHistory(h, 3, { label: 'y', now: 10 })
    expect(canRedo(h)).toBe(false)
    expect(undoHistory(h).present).toBe(1)
  })

  it('ignores no-op changes', () => {
    const h = createHistory({ a: 1 })
    expect(pushHistory(h, h.present, { label: 'same' })).toBe(h)
  })

  it('coalesces rapid edits with the same key', () => {
    let h = createHistory('')
    h = pushHistory(h, 'J', { label: 'name', coalesceKey: 'p1.name', now: 0 })
    h = pushHistory(h, 'Ja', { label: 'name', coalesceKey: 'p1.name', now: 500 })
    h = pushHistory(h, 'Jan', { label: 'name', coalesceKey: 'p1.name', now: 1000 })
    expect(h.past).toHaveLength(1)
    expect(undoHistory(h).present).toBe('')
    // A pause, or a different key, starts a new step.
    h = pushHistory(h, 'Jan K', { label: 'name', coalesceKey: 'p1.name', now: 5000 })
    h = pushHistory(h, 'X', { label: 'other', coalesceKey: 'p1.surname', now: 5100 })
    expect(h.past).toHaveLength(3)
  })

  it('does not coalesce right after an undo', () => {
    let h = pushHistory(createHistory(0), 1, { label: 'a', coalesceKey: 'k', now: 0 })
    h = pushHistory(h, 2, { label: 'a', coalesceKey: 'k', now: 3000 })
    h = undoHistory(h)
    h = pushHistory(h, 5, { label: 'a', coalesceKey: 'k', now: 3100 })
    expect(h.past).toHaveLength(2)
  })

  it('caps the number of steps', () => {
    let h = createHistory(0)
    for (let i = 1; i <= 10; i++)
      h = pushHistory(h, i, { label: String(i), now: i * 10000, limit: 3 })
    expect(h.past.map((e) => e.state)).toEqual([7, 8, 9])
  })
})
