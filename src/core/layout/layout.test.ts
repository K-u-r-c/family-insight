import { describe, expect, it } from 'vitest'
import { layoutFamily, selectPeople, type Layout, type LayoutNode } from './layout'
import { remarriageFixture, TreeBuilder } from '../test/fixtures'
import type { FamilyTree } from '../model/types'
import { twoFamiliesFixture } from './fixtures'
import { kinshipFixture } from '../kinship/fixture'

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

/** Parent → child links whose rows differ by more than one (the child row minus the parent row). */
function stretchedLinks(tree: FamilyTree, layout: Layout): string[] {
  const gen = new Map(layout.nodes.map((n) => [n.id, n.generation]))
  const out: string[] = []
  for (const r of Object.values(tree.relationships)) {
    if (r.type !== 'parent-child' || !gen.has(r.parentId) || !gen.has(r.childId)) continue
    const d = gen.get(r.childId)! - gen.get(r.parentId)!
    if (d !== 1) out.push(`${r.parentId}→${r.childId}:${d}`)
  }
  return out
}
function partnersApart(tree: FamilyTree, layout: Layout): string[] {
  const gen = new Map(layout.nodes.map((n) => [n.id, n.generation]))
  return Object.values(tree.relationships)
    .filter((r) => r.type === 'partnership')
    .map((r) => r.partnerIds)
    .filter(([a, b]) => gen.has(a) && gen.has(b) && gen.get(a) !== gen.get(b))
    .map(([a, b]) => `${a}+${b}`)
}

describe('generations across families (#100)', () => {
  const tree = twoFamiliesFixture()

  it('keeps every parent → child link at one row when one side is known deeper', () => {
    const l = layoutFamily(tree)
    expect(stretchedLinks(tree, l)).toEqual([])
    expect(partnersApart(tree, l)).toEqual([])
    const row = (id: string): number => node(l, id).generation
    // The father moves down to the mother's row – and his whole family moves with him.
    for (const id of ['father', 'mother', 'uncle1', 'uncle2', 'uncle3', 'uncle1Wife', 'mUncle'])
      expect(row(id), id).toBe(3)
    for (const id of ['me', 'sister', 'pCousin1', 'pCousin4', 'mCousin1'])
      expect(row(id), id).toBe(4)
    for (const id of ['pgf', 'pgm', 'mgf', 'mgm', 'halfUncle']) expect(row(id), id).toBe(2)
    for (const id of ['pggf', 'pggm', 'mgfMother', 'stepGf', 'mgmFather'])
      expect(row(id), id).toBe(1)
    expect(row('mgfGrandfather')).toBe(0)
    assertNoOverlap(l)
  })

  it('keeps the other view modes exact', () => {
    for (const mode of ['ancestors', 'descendants', 'hourglass'] as const) {
      for (const focusId of ['me', 'pgf', 'mgfMother']) {
        const l = layoutFamily(tree, { mode, focusId })
        expect(stretchedLinks(tree, l), `${mode} from ${focusId}`).toEqual([])
        expect(partnersApart(tree, l), `${mode} from ${focusId}`).toEqual([])
      }
    }
  })

  it('stretches only the links the data forces', () => {
    // x's son y marries x's granddaughter w: y must share w's row, two below x.
    const t = new TreeBuilder()
      .person('x', 'X', 'male')
      .person('xw', 'XW', 'female')
      .person('y', 'Y', 'male')
      .person('z', 'Z', 'male')
      .person('w', 'W', 'female')
      .person('k', 'K')
      .couple('x', 'xw')
      .child('x', 'y')
      .child('xw', 'y')
      .child('x', 'z')
      .child('xw', 'z')
      .child('z', 'w')
      .couple('y', 'w')
      .child('y', 'k')
      .child('w', 'k')
      .build()
    const l = layoutFamily(t)
    expect(new Set(stretchedLinks(t, l))).toEqual(new Set(['x→y:2', 'xw→y:2']))
    expect(partnersApart(t, l)).toEqual([])
  })

  it('needs no stretched links whenever an exact layering exists (generated trees)', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const t = familiesOfDifferentDepth(seed)
      const l = layoutFamily(t)
      expect(stretchedLinks(t, l), `seed ${seed}`).toEqual([])
      expect(partnersApart(t, l), `seed ${seed}`).toEqual([])
      assertNoOverlap(l)
    }
  })

  it('falls back to a best-effort layout for impossible data', () => {
    // A parent who is also the partner of their child cannot satisfy both rules.
    const t = new TreeBuilder()
      .person('a', 'A')
      .person('b', 'B')
      .person('c', 'C')
      .child('a', 'b')
      .couple('a', 'b')
      .child('b', 'c')
      .build()
    const l = layoutFamily(t)
    expect(l.nodes).toHaveLength(3)
    assertNoOverlap(l)
  })
})

describe('family groups (#101)', () => {
  const SIZES = {
    nodeWidth: 220,
    nodeHeight: 64,
    partnerGap: 28,
    siblingGap: 32,
    generationGap: 76
  }
  const FAMILY_GAP = 80 // 2.5 × siblingGap

  /** Parents (in the row above) of everyone in a run of partners. */
  function parentsOfRun(tree: FamilyTree, l: Layout, run: LayoutNode[]): Set<string> {
    const gen = new Map(l.nodes.map((n) => [n.id, n.generation]))
    const out = new Set<string>()
    for (const n of run) {
      for (const r of Object.values(tree.relationships)) {
        if (
          r.type === 'parent-child' &&
          r.childId === n.id &&
          gen.get(r.parentId) === n.generation - 1
        )
          out.add(r.parentId)
      }
    }
    return out
  }
  /** Gaps between neighbouring units (runs of partners) on every row, with whether they share a parent. */
  function unitGaps(
    tree: FamilyTree,
    l: Layout
  ): { gap: number; related: boolean; pair: string }[] {
    const partners = new Set(
      Object.values(tree.relationships)
        .filter((r) => r.type === 'partnership')
        .flatMap((r) => [
          `${r.partnerIds[0]}|${r.partnerIds[1]}`,
          `${r.partnerIds[1]}|${r.partnerIds[0]}`
        ])
    )
    const rows = new Map<number, LayoutNode[]>()
    for (const n of l.nodes) rows.set(n.y, [...(rows.get(n.y) ?? []), n])
    const out: { gap: number; related: boolean; pair: string }[] = []
    for (const row of rows.values()) {
      row.sort((a, b) => a.x - b.x)
      const runs: LayoutNode[][] = []
      for (const n of row) {
        const last = runs[runs.length - 1]
        const prev = last?.[last.length - 1]
        if (
          prev &&
          partners.has(`${prev.id}|${n.id}`) &&
          n.x - (prev.x + prev.width) <= SIZES.partnerGap + 1
        )
          last!.push(n)
        else runs.push([n])
      }
      for (let i = 1; i < runs.length; i++) {
        const a = runs[i - 1]!
        const b = runs[i]!
        const pa = parentsOfRun(tree, l, a)
        const related = [...parentsOfRun(tree, l, b)].some((p) => pa.has(p))
        const left = a[a.length - 1]!
        out.push({
          gap: b[0]!.x - (left.x + left.width),
          related,
          pair: `${left.id} / ${b[0]!.id}`
        })
      }
    }
    return out
  }
  /** Sibling groups whose span does not overlap their parents' span. */
  function groupsAway(tree: FamilyTree, l: Layout): string[] {
    const pos = new Map(l.nodes.map((n) => [n.id, n]))
    const groups = new Map<string, string[]>()
    for (const n of l.nodes) {
      const ps = Object.values(tree.relationships)
        .filter((r) => r.type === 'parent-child' && r.childId === n.id && pos.has(r.parentId))
        .map((r) => (r as { parentId: string }).parentId)
        .sort()
      if (ps.length) groups.set(ps.join('+'), [...(groups.get(ps.join('+')) ?? []), n.id])
    }
    const out: string[] = []
    for (const [key, kids] of groups) {
      const span = (ids: string[]): [number, number] => [
        Math.min(...ids.map((id) => pos.get(id)!.x)),
        Math.max(...ids.map((id) => pos.get(id)!.x + pos.get(id)!.width))
      ]
      const [k1, k2] = span(kids)
      const [p1, p2] = span(key.split('+'))
      if (k2 < p1 || k1 > p2) out.push(`${key} → ${kids.join(',')}`)
    }
    return out
  }

  it('separates families by familyGap and keeps siblings at siblingGap', () => {
    for (const tree of [twoFamiliesFixture(), remarriageFixture(), randomTree(300, 7)]) {
      const l = layoutFamily(tree, SIZES)
      const gaps = unitGaps(tree, l)
      for (const g of gaps) {
        expect(g.gap + 0.5, g.pair).toBeGreaterThanOrEqual(
          g.related ? SIZES.siblingGap : FAMILY_GAP
        )
      }
      // Some siblings are packed tightly (the gap is not just inflated everywhere).
      expect(gaps.some((g) => g.related && Math.abs(g.gap - SIZES.siblingGap) < 1)).toBe(true)
      assertNoOverlap(l)
    }
  })

  it('derives familyGap from siblingGap and accepts an explicit value', () => {
    const tree = twoFamiliesFixture()
    const wide = layoutFamily(tree, { ...SIZES, familyGap: 200 })
    for (const g of unitGaps(tree, wide))
      if (!g.related) expect(g.gap + 0.5).toBeGreaterThanOrEqual(200)
  })

  it('keeps sibling groups under their parents', () => {
    const tree = twoFamiliesFixture()
    const l = layoutFamily(tree, SIZES)
    // Only the child pulled between both of his parents' families and his wife's may drift.
    expect(groupsAway(tree, l).length).toBeLessThanOrEqual(1)
    const sample = layoutFamily(remarriageFixture(), SIZES)
    expect(groupsAway(remarriageFixture(), sample)).toEqual([])
  })

  it('does not put a child under a neighbouring couple (the reported case)', () => {
    const tree = twoFamiliesFixture()
    const l = layoutFamily(tree, SIZES)
    const child = node(l, 'halfUncleChild2')
    const span = (ids: string[]): [number, number] => [
      Math.min(...ids.map((id) => node(l, id).x)),
      Math.max(...ids.map((id) => node(l, id).x + node(l, id).width))
    ]
    const [n1, n2] = span(['mgf', 'mgm'])
    expect(cx(child) < n1 || cx(child) > n2).toBe(true)
    const [k1, k2] = span(['halfUncleChild1', 'halfUncleChild2', 'halfUncleChild3'])
    const [p1, p2] = span(['halfUncle', 'halfUncleWife'])
    expect(k2 >= p1 && k1 <= p2).toBe(true)
  })
})

describe('lines (#102)', () => {
  const SIZES = {
    nodeWidth: 220,
    nodeHeight: 64,
    partnerGap: 28,
    siblingGap: 32,
    generationGap: 76
  }
  type Seg = { x1: number; y1: number; x2: number; y2: number }
  const segments = (e: Layout['edges'][number]): Seg[] =>
    e.points.slice(1).map((p, i) => ({ x1: e.points[i]!.x, y1: e.points[i]!.y, x2: p.x, y2: p.y }))

  /** Horizontal stretches of child lines from different parent groups that overlap at one height. */
  function sharedStretches(l: Layout): string[] {
    const hs = l.edges
      .filter((e) => e.type === 'child')
      .flatMap((e) =>
        segments(e)
          .filter((s) => s.y1 === s.y2 && s.x1 !== s.x2)
          .map((s) => ({ ...s, group: e.people.slice(0, -1).join('+'), id: e.id }))
      )
    const out: string[] = []
    for (let i = 0; i < hs.length; i++) {
      for (let j = i + 1; j < hs.length; j++) {
        const a = hs[i]!
        const b = hs[j]!
        if (a.y1 !== b.y1 || a.group === b.group) continue
        const overlap =
          Math.min(Math.max(a.x1, a.x2), Math.max(b.x1, b.x2)) -
          Math.max(Math.min(a.x1, a.x2), Math.min(b.x1, b.x2))
        if (overlap > 1) out.push(`${a.id} / ${b.id}`)
      }
    }
    return out
  }
  /** Lines that pass through a card of someone they do not connect. */
  function linesThroughCards(l: Layout): string[] {
    const out: string[] = []
    for (const e of l.edges) {
      for (const s of segments(e)) {
        for (const n of l.nodes) {
          if (e.people.includes(n.id)) continue
          const [x1, x2] = [Math.min(s.x1, s.x2), Math.max(s.x1, s.x2)]
          const [y1, y2] = [Math.min(s.y1, s.y2), Math.max(s.y1, s.y2)]
          if (
            x2 > n.x + 0.5 &&
            x1 < n.x + n.width - 0.5 &&
            y2 > n.y + 0.5 &&
            y1 < n.y + n.height - 0.5
          )
            out.push(`${e.id} through ${n.id}`)
        }
      }
    }
    return out
  }

  // x's son y marries x's granddaughter w (a link over two rows); h has three partners.
  const awkward = (): FamilyTree =>
    new TreeBuilder()
      .person('x', 'X', 'male')
      .person('xw', 'XW', 'female')
      .person('y', 'Y', 'male')
      .person('z', 'Z', 'male')
      .person('zw', 'ZW', 'female')
      .person('w', 'W', 'female')
      .person('k', 'K')
      .person('h', 'H', 'male')
      .person('p1', 'P1', 'female')
      .person('p2', 'P2', 'female')
      .person('p3', 'P3', 'female')
      .person('hk', 'HK')
      .couple('x', 'xw')
      .child('x', 'y')
      .child('xw', 'y')
      .child('x', 'z')
      .child('xw', 'z')
      .couple('z', 'zw')
      .child('z', 'w')
      .child('zw', 'w')
      .couple('y', 'w')
      .child('y', 'k')
      .child('w', 'k')
      .child('x', 'h')
      .child('xw', 'h')
      .couple('h', 'p1')
      .couple('h', 'p2')
      .couple('h', 'p3')
      .child('h', 'hk')
      .child('p3', 'hk')
      .build()
  const trees = (): [string, FamilyTree][] => [
    ['two families', twoFamiliesFixture()],
    ['kinship', kinshipFixture()],
    ['remarriage', remarriageFixture()],
    ['awkward', awkward()],
    ['random', randomTree(300, 3)]
  ]

  it('never lets two families share a horizontal stretch', () => {
    for (const [name, tree] of trees()) {
      for (const generationGap of [76, 30]) {
        expect(sharedStretches(layoutFamily(tree, { ...SIZES, generationGap })), name).toEqual([])
      }
    }
  })

  it('never draws a line through someone else’s card', () => {
    for (const [name, tree] of trees()) {
      const l = layoutFamily(tree, SIZES)
      expect(linesThroughCards(l), name).toEqual([])
      assertNoOverlap(l)
    }
  })

  it('keeps one family on one lane whatever order the parents were entered in', () => {
    const tree = new TreeBuilder()
      .person('f', 'F', 'male')
      .person('m', 'M', 'female')
      .person('a', 'A')
      .person('b', 'B')
      .person('c', 'C')
      .couple('f', 'm')
      .child('f', 'a')
      .child('m', 'a')
      .child('m', 'b')
      .child('f', 'b')
      .child('f', 'c')
      .child('m', 'c')
      .build()
    const l = layoutFamily(tree, SIZES)
    const buses = new Set(l.edges.filter((e) => e.type === 'child').map((e) => e.points.at(-2)!.y))
    expect(buses.size).toBe(1)
  })

  it('keeps a single-lane gap exactly as before', () => {
    const tree = remarriageFixture()
    const l = layoutFamily(tree, SIZES)
    const row = SIZES.nodeHeight + SIZES.generationGap
    for (const n of l.nodes) expect(n.y).toBe(n.generation * row)
    for (const e of l.edges.filter((x) => x.type === 'child')) {
      const child = node(l, e.target)
      expect(e.points.at(-2)!.y).toBe(child.y - SIZES.generationGap / 2)
    }
  })

  it('grows a gap that needs more lanes than fit', () => {
    const tree = kinshipFixture()
    const tight = layoutFamily(tree, { ...SIZES, generationGap: 30 })
    const rows = Math.max(...tight.nodes.map((n) => n.generation))
    // Without growing, the height would be exactly rows × (card + gap) + card.
    expect(tight.height).toBeGreaterThan(rows * (SIZES.nodeHeight + 30) + SIZES.nodeHeight)
    expect(sharedStretches(tight)).toEqual([])
  })

  it('routes a link over two rows through a free channel and partners around cards', () => {
    const tree = awkward()
    const l = layoutFamily(tree, SIZES)
    const long = l.edges.find((e) => e.target === 'y')!
    expect(long.people).toEqual(expect.arrayContaining(['x', 'xw', 'y']))
    expect(long.points.length).toBeGreaterThan(4)
    expect(linesThroughCards(l)).toEqual([])
  })

  it('lists everyone a line connects', () => {
    const l = layoutFamily(remarriageFixture(), SIZES)
    const toPiotr = l.edges.find((e) => e.type === 'child' && e.target === 'piotr')!
    expect(new Set(toPiotr.people)).toEqual(new Set(['jan', 'anna', 'piotr']))
    const partner = l.edges.find((e) => e.type === 'partner' && e.people.includes('ewa'))!
    expect(new Set(partner.people)).toEqual(new Set(['jan', 'ewa']))
  })
})

/**
 * Seeded families whose founders live in different generations; people only marry within their
 * own (true) generation – into another family or someone from outside – so an exact layering
 * always exists.
 */
function familiesOfDifferentDepth(seed: number): FamilyTree {
  let s = seed
  const rand = (): number => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
  const b = new TreeBuilder()
  let count = 0
  const add = (): string => {
    const id = `p${count++}`
    b.person(id, id, rand() < 0.5 ? 'male' : 'female')
    return id
  }
  // Unmarried people by true generation, and the couples of each generation.
  const single = new Map<number, string[]>()
  const couples: [string, string, number][] = []
  const marry = (a: string, b2: string, g: number): void => {
    b.couple(a, b2)
    couples.push([a, b2, g])
  }
  const families = 3 + Math.floor(rand() * 3)
  for (let f = 0; f < families; f++) {
    const g = Math.floor(rand() * 3)
    marry(add(), add(), g)
  }
  for (let g = 0; g < 5; g++) {
    for (const [a, c, cg] of couples.filter((x) => x[2] === g)) {
      if (cg !== g) continue
      const n = Math.floor(rand() * 4)
      for (let k = 0; k < n; k++) {
        const child = add()
        b.child(a, child).child(c, child)
        single.set(g + 1, [...(single.get(g + 1) ?? []), child])
      }
    }
    // Marry the next generation: within families' pool (other families) or to outsiders.
    const pool = single.get(g + 1) ?? []
    while (pool.length) {
      const p = pool.splice(Math.floor(rand() * pool.length), 1)[0]!
      const r = rand()
      if (r < 0.35 && pool.length) {
        const q = pool.splice(Math.floor(rand() * pool.length), 1)[0]!
        marry(p, q, g + 1)
      } else if (r < 0.8) marry(p, add(), g + 1)
    }
  }
  return b.build()
}

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
