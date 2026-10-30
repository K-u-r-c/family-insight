import { describe, expect, it } from 'vitest'
import { clampCrop, sourceRect } from './crop'

describe('crop math', () => {
  it('centres the largest square at zoom 1', () => {
    expect(sourceRect({ zoom: 1, x: 0, y: 0 }, 400, 200)).toEqual({ size: 200, sx: 100, sy: 0 })
  })

  it('zooms into the centre', () => {
    expect(sourceRect({ zoom: 2, x: 0, y: 0 }, 400, 200)).toEqual({ size: 100, sx: 150, sy: 50 })
  })

  it('never shows empty edges', () => {
    // A wide image can only move horizontally at zoom 1.
    expect(clampCrop({ zoom: 1, x: 5, y: 5 }, 400, 200)).toEqual({ zoom: 1, x: 0.5, y: 0 })
    const r = sourceRect({ zoom: 1, x: 5, y: 0 }, 400, 200)
    expect(r.sx).toBe(0)
    expect(clampCrop({ zoom: 0.2, x: 0, y: 0 }, 100, 100).zoom).toBe(1)
  })
})
