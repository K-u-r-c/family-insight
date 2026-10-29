import { describe, expect, it } from 'vitest'
import { layoutFamily } from './layout'
import { navigate } from './navigation'
import { remarriageFixture } from '../test/fixtures'

describe('navigate', () => {
  const tree = remarriageFixture()
  const layout = layoutFamily(tree)

  it('moves to parents and children', () => {
    expect(navigate(tree, layout, 'kuba', 'up')).toBe('ola')
    expect(['jan', 'ewa']).toContain(navigate(tree, layout, 'ola', 'up'))
    expect(navigate(tree, layout, 'ola', 'down')).toBe('kuba')
    expect(navigate(tree, layout, 'kuba', 'down')).toBeNull()
  })

  it('moves sideways along the row', () => {
    const jan = layout.nodes.find((n) => n.id === 'jan')!
    const anna = layout.nodes.find((n) => n.id === 'anna')!
    const dir = anna.x < jan.x ? 'left' : 'right'
    expect(navigate(tree, layout, 'jan', dir)).toBe('anna')
    expect(navigate(tree, layout, 'anna', dir === 'left' ? 'right' : 'left')).toBe('jan')
  })

  it('returns null for unknown people', () => {
    expect(navigate(tree, layout, 'ghost', 'up')).toBeNull()
  })
})
