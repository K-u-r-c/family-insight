import { describe, expect, it } from 'vitest'
import { layoutFamily, selectPeople, type Layout, type LayoutNode } from './layout'
import { remarriageFixture, TreeBuilder } from '../test/fixtures'
import type { FamilyTree } from '../model/types'

const node = (layout: Layout, id: string): LayoutNode => {
  const n = layout.nodes.find((x) => x.id === id)
  if (!n) throw new Error(`no node ${id}`)
  return n
}
const cx = (n: LayoutNode): number => n.x + n.width / 2

function assertNoOverlap(layout: Layout): void {
  const byRow = new Map<number, LayoutNode[]>()
  for (const n of layout.nodes) byRow.set(n.y, [...(byRow.get(n.y) ?? []), n])
  for (const row of byRow.values()) {
    row.sort((a, b) => a.x - b.x)
    for (let i = 1; i < row.length; i++) {
      expect(row[i]!.x, `${row[i - 1]!.id} / ${row[i]!.id}`).toBeGreaterThanOrEqual(
        row[i - 1]!.x + row[i - 1]!.width
      )
    }
  }
}

describe('layoutFamily', () => {
  it('lays out a nuclear family: couple side by side, children centred below', () => {
    const tree = new TreeBuilder()
      .person('f', 'Father', 'male')
      .person('m', 'Mother', 'female')
      .person('a', 'A', 'female', { birth: { date: { value: '1950', qualifier: 'exact' } } })
      .person('b', 'B', 'male', { birth: { date: { value: '1952', qualifier: 'exact' } } })
      .couple('f', 'm')
      .child('f', 'a')
      .child('m', 'a')
      .child('f', 'b')
      .child('m', 'b')
      .build()
    const l = layoutFamily(tree)
    const [f, m, a, b] = ['f', 'm', 'a', 'b'].map((id) => node(l, id))
    expect(f!.y).toBe(m!.y)
    expect(a!.y).toBe(b!.y)
    expect(a!.y).toBeGreaterThan(f!.y)
    expect(Math.abs(f!.x - m!.x)).toBe(f!.width + 28)
    // Children centred under the couple, older child first.
    const coupleCentre = (cx(f!) + cx(m!)) / 2
    expect(Math.abs((cx(a!) + cx(b!)) / 2 - coupleCentre)).toBeLessThan(1)
    expect(a!.x).toBeLessThan(b!.x)
    assertNoOverlap(l)
    expect(l.edges.filter((e) => e.type === 'partner')).toHaveLength(1)
    const childEdges = l.edges.filter((e) => e.type === 'child')
    expect(childEdges).toHaveLength(2)
    // Child lines start from the middle of the partner line.
    expect(childEdges[0]!.points[0]!.x).toBeCloseTo(coupleCentre, 0)
  })

  it('places multiple partners on both sides with their own children (half-siblings)', () => {
    const l = layoutFamily(remarriageFixture())
    const jan = node(l, 'jan')
    const anna = node(l, 'anna')
    const ewa = node(l, 'ewa')
    expect(anna.y).toBe(jan.y)
    expect(ewa.y).toBe(jan.y)
    // Jan is between his two wives.
    expect((anna.x - jan.x) * (ewa.x - jan.x)).toBeLessThan(0)
    // Piotr is under Jan+Anna, Ola under Jan+Ewa.
    const piotr = node(l, 'piotr')
    const ola = node(l, 'ola')
    expect(Math.sign(cx(piotr) - cx(jan))).toBe(Math.sign(cx(anna) - cx(jan)))
    expect(Math.sign(cx(ola) - cx(jan))).toBe(Math.sign(cx(ewa) - cx(jan)))
    // Adoption is drawn with its kind.
    expect(l.edges.find((e) => e.target === 'kuba')?.kind).toBe('adoptive')
    expect(node(l, 'kuba').generation).toBe(2)
    assertNoOverlap(l)
  })

  it('aligns a five-generation pedigree with each child below its parents', () => {
    let b = new TreeBuilder().person('p0', 'Root')
    let level = ['p0']
    for (let g = 1; g <= 4; g++) {
      const next: string[] = []
      for (const child of level) {
        const f = `${child}f`
        const m = `${child}m`
        b = b
          .person(f, f, 'male')
          .person(m, m, 'female')
          .couple(f, m)
          .child(f, child)
          .child(m, child)
        next.push(f, m)
      }
      level = next
    }
    const tree = b.build()
    const l = layoutFamily(tree, { mode: 'ancestors', focusId: 'p0' })
    expect(l.nodes).toHaveLength(31)
    expect(node(l, 'p0').generation).toBe(4)
    assertNoOverlap(l)
    const parentsMid = (n: LayoutNode): number | undefined => {
      const f = l.nodes.find((x) => x.id === `${n.id}f`)
      const m = l.nodes.find((x) => x.id === `${n.id}m`)
      return f && m ? (cx(f) + cx(m)) / 2 : undefined
    }
    // The focus person is centred under their parents and the chart is symmetric.
    expect(Math.abs(parentsMid(node(l, 'p0'))! - cx(node(l, 'p0')))).toBeLessThan(1)
    const top = l.nodes.filter((n) => n.generation === 0)
    const topMid = (Math.min(...top.map(cx)) + Math.max(...top.map(cx))) / 2
    expect(Math.abs(topMid - cx(node(l, 'p0')))).toBeLessThan(1)
    // No crossing lines: within a row, people are ordered like their parents.
    for (let g = 1; g <= 4; g++) {
      const row = l.nodes
        .filter((n) => n.generation === g && parentsMid(n) !== undefined)
        .sort((a, b) => a.x - b.x)
      const mids = row.map((n) => parentsMid(n)!)
      expect(mids).toEqual([...mids].sort((a, b) => a - b))
    }
  })

  it('puts in-laws on the row of their partner and their parents above', () => {
    const tree = new TreeBuilder()
      .person('gp', 'Grandpa', 'male')
      .person('dad', 'Dad', 'male')
      .person('mum', 'Mum', 'female')
      .person('mgp', 'Mum grandpa', 'male')
      .person('kid', 'Kid')
      .child('gp', 'dad')
      .child('mgp', 'mum')
      .couple('dad', 'mum')
      .child('dad', 'kid')
      .child('mum', 'kid')
      .build()
    const l = layoutFamily(tree)
    expect(node(l, 'mum').generation).toBe(node(l, 'dad').generation)
    expect(node(l, 'mgp').generation).toBe(node(l, 'gp').generation)
    // Each partner sits on the side of their own parents.
    expect(Math.sign(cx(node(l, 'mum')) - cx(node(l, 'dad')))).toBe(
      Math.sign(cx(node(l, 'mgp')) - cx(node(l, 'gp')))
    )
    assertNoOverlap(l)
  })

  it('places disconnected groups side by side', () => {
    const tree = new TreeBuilder()
      .person('a', 'A')
      .person('b', 'B')
      .person('c', 'C')
      .couple('a', 'b')
      .build()
    const l = layoutFamily(tree)
    expect(l.nodes.map((n) => n.y)).toEqual([0, 0, 0])
    assertNoOverlap(l)
    expect(Math.min(...l.nodes.map((n) => n.x))).toBe(0)
  })

  it('is deterministic', () => {
    const tree = remarriageFixture()
    expect(layoutFamily(tree)).toEqual(layoutFamily(structuredClone(tree)))
  })

  it('handles an empty tree', () => {
    expect(layoutFamily(new TreeBuilder().build())).toEqual({
      nodes: [],
      edges: [],
      width: 0,
      height: 0
    })
  })

  it('lays out 1000 people quickly without overlaps', () => {
    const tree = randomTree(1000, 42)
    const start = performance.now()
    const l = layoutFamily(tree)
    const ms = performance.now() - start
    expect(l.nodes).toHaveLength(1000)
    assertNoOverlap(l)
    expect(ms).toBeLessThan(process.env.CI ? 1000 : 200)
  })
})

describe('view modes', () => {
  const tree = remarriageFixture()

  it('ancestors: the person and their ancestors only', () => {
    expect([...selectPeople(tree, { mode: 'ancestors', focusId: 'kuba' })].sort()).toEqual([
      'ewa',
      'jan',
      'kuba',
      'ola'
    ])
    expect(
      [...selectPeople(tree, { mode: 'ancestors', focusId: 'kuba', depth: 1 })].sort()
    ).toEqual(['kuba', 'ola'])
  })

  it('descendants: descendants plus their partners', () => {
    expect([...selectPeople(tree, { mode: 'descendants', focusId: 'jan' })].sort()).toEqual(
      ['anna', 'ewa', 'jan', 'kuba', 'ola', 'piotr'].sort()
    )
  })

  it('hourglass: both directions', () => {
    expect([...selectPeople(tree, { mode: 'hourglass', focusId: 'ola', depth: 1 })].sort()).toEqual(
      ['ewa', 'jan', 'kuba', 'ola'].sort()
    )
  })

  it.each(['family', 'ancestors', 'descendants', 'hourglass'] as const)(
    '%s mode lays out the selection without overlaps',
    (mode) => {
      const l = layoutFamily(tree, { mode, focusId: 'ola', depth: 3 })
      const ids = selectPeople(tree, { mode, focusId: 'ola', depth: 3 })
      expect(l.nodes.map((n) => n.id).sort()).toEqual([...ids].sort())
      expect(l.nodes.some((n) => n.id === 'ola')).toBe(true)
      assertNoOverlap(l)
      // Every edge connects two visible people.
      for (const e of l.edges) {
        expect(ids.has(e.source) && ids.has(e.target)).toBe(true)
      }
    }
  )

  it('collapsed branches hide descendants', () => {
    const ids = selectPeople(tree, { mode: 'family', collapsed: new Set(['ola']) })
    expect(ids.has('kuba')).toBe(false)
    expect(ids.has('ola')).toBe(true)
    const l = layoutFamily(tree, { collapsed: new Set(['ola']) })
    expect(l.nodes.find((n) => n.id === 'ola')?.hasHiddenChildren).toBe(true)
  })
})

/** Seeded random family: generations of couples with 0–4 children, some remarriages. */
function randomTree(size: number, seed: number): FamilyTree {
  let s = seed
  const rand = (): number => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
  const b = new TreeBuilder()
  let count = 0
  const add = (sex: 'male' | 'female'): string => {
    const id = `p${count++}`
    b.person(id, id, sex)
    return id
  }
  let generation = [add('male'), add('female')]
  b.couple(generation[0]!, generation[1]!)
  while (count < size) {
    const next: string[] = []
    for (let i = 0; i + 1 < generation.length && count < size; i += 2) {
      const kids = Math.floor(rand() * 4) + 1
      for (let k = 0; k < kids && count < size; k++) {
        const child = add(rand() < 0.5 ? 'male' : 'female')
        b.child(generation[i]!, child).child(generation[i + 1]!, child)
        if (count < size) {
          const spouse = add('female')
          b.couple(child, spouse)
          next.push(child, spouse)
          if (rand() < 0.05 && count < size) {
            const second = add('female')
            b.couple(child, second)
          }
        }
      }
    }
    if (!next.length) break
    generation = next
  }
  while (count < size) add('male')
  return b.build()
}
