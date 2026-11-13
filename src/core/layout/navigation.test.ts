import { describe, expect, it } from 'vitest'
import { layoutFamily } from './layout'
import { navigate } from './navigation'
import { remarriageFixture, TreeBuilder } from '../test/fixtures'

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

describe('navigation in hanging columns (#115)', () => {
  it('moves within a column with ↑/↓ and between columns with ←/→', () => {
    const b = new TreeBuilder().person('f', 'F', 'male').person('m', 'M', 'female').couple('f', 'm')
    for (let i = 0; i < 6; i++) {
      b.person(`c${i}`, `C${i}`, 'unknown', {
        birth: { date: { value: `${1950 + i}`, qualifier: 'exact' } }
      })
      b.child('f', `c${i}`).child('m', `c${i}`)
    }
    const tree = b.build()
    const layout = layoutFamily(tree, { compactSiblings: true })
    // Columns: c0 c1 c2 | c3 c4 c5.
    expect(navigate(tree, layout, 'c0', 'down')).toBe('c1')
    expect(navigate(tree, layout, 'c1', 'up')).toBe('c0')
    expect(navigate(tree, layout, 'c0', 'up')).toMatch(/^[fm]$/)
    expect(navigate(tree, layout, 'c1', 'right')).toBe('c4')
    expect(navigate(tree, layout, 'c4', 'left')).toBe('c1')
  })
})
