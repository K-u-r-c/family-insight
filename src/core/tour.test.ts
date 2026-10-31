import { describe, expect, it } from 'vitest'
import { advanceTour, markTourSeen, startTour, type TourStep } from './tour'

interface Ctx {
  people: number
}

const steps: TourStep<Ctx>[] = [
  { id: 'hello' },
  { id: 'add', target: 'add-person', waitFor: (c) => c.people > 0 },
  { id: 'bye' }
]

describe('guided tours', () => {
  it('goes forward and back, and finishes after the last step', () => {
    let pos = startTour('basics')
    expect(pos).toEqual({ tourId: 'basics', index: 0 })
    expect(advanceTour(steps, pos, { type: 'back' })).toEqual({
      kind: 'step',
      position: { ...pos, manual: true }
    })
    const next = advanceTour(steps, pos, { type: 'next' })
    expect(next).toEqual({ kind: 'step', position: { tourId: 'basics', index: 1 } })
    pos = { tourId: 'basics', index: 2 }
    expect(advanceTour(steps, pos, { type: 'back' })).toEqual({
      kind: 'step',
      position: { tourId: 'basics', index: 1, manual: true }
    })
    expect(advanceTour(steps, pos, { type: 'next' })).toEqual({ kind: 'done', tourId: 'basics' })
  })

  it('advances by itself once a step’s condition holds', () => {
    const pos = { tourId: 'basics', index: 1 }
    expect(advanceTour(steps, pos, { type: 'check', context: { people: 0 } })).toEqual({
      kind: 'step',
      position: pos
    })
    expect(advanceTour(steps, pos, { type: 'check', context: { people: 1 } })).toEqual({
      kind: 'step',
      position: { tourId: 'basics', index: 2 }
    })
    // Steps without a condition wait for the user.
    expect(
      advanceTour(steps, { tourId: 'basics', index: 0 }, { type: 'check', context: { people: 9 } })
    ).toEqual({ kind: 'step', position: { tourId: 'basics', index: 0 } })
  })

  it('does not bounce forward from a step the user went back to', () => {
    const back = advanceTour(steps, { tourId: 'basics', index: 2 }, { type: 'back' })
    expect(back.kind).toBe('step')
    const pos = (back as { position: { tourId: string; index: number } }).position
    expect(advanceTour(steps, pos, { type: 'check', context: { people: 5 } })).toEqual({
      kind: 'step',
      position: pos
    })
    expect(advanceTour(steps, pos, { type: 'next' })).toEqual({
      kind: 'step',
      position: { tourId: 'basics', index: 2 }
    })
  })

  it('can be skipped at any step', () => {
    expect(advanceTour(steps, { tourId: 'basics', index: 1 }, { type: 'skip' })).toEqual({
      kind: 'skipped',
      tourId: 'basics'
    })
  })

  it('remembers each tour once', () => {
    expect(markTourSeen([], 'basics')).toEqual(['basics'])
    expect(markTourSeen(['basics'], 'basics')).toEqual(['basics'])
    expect(markTourSeen(['a'], 'b')).toEqual(['a', 'b'])
  })
})
