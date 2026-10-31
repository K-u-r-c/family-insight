import { describe, expect, it } from 'vitest'
import { canShowHint, HINTS, markHintSeen } from './hints'

describe('feature hints', () => {
  const fresh = { showTips: true, tips: [] }

  it('shows each hint once', () => {
    expect(canShowHint('map', fresh, null)).toBe(true)
    expect(canShowHint('map', { showTips: true, tips: ['map'] }, null)).toBe(false)
    expect(markHintSeen([], 'map')).toEqual(['map'])
    expect(markHintSeen(['map'], 'map')).toEqual(['map'])
  })

  it('shows at most one hint per app start (the same one may stay)', () => {
    expect(canShowHint('kinship', fresh, 'map')).toBe(false)
    expect(canShowHint('map', { showTips: true, tips: ['map'] }, 'map')).toBe(true)
  })

  it('shows nothing when tips are off', () => {
    for (const id of HINTS) expect(canShowHint(id, { showTips: false, tips: [] }, null)).toBe(false)
  })
})
