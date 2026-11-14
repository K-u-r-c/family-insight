import { describe, expect, it } from 'vitest'
import { kinshipFixture } from '../kinship/fixture'
import type { FamilyTree } from '../model/types'
import { remarriageFixture, TreeBuilder } from '../test/fixtures'
import { collateralFixture, twoFamiliesFixture } from './fixtures'
import { layoutFamily, type Layout, type LayoutEdge, type LayoutNode } from './layout'
import { ancestorsOf, CANVAS_1440, fitZoom, layoutMetrics, segmentsOf } from './metrics'

/** Canvas sizes for Modern, comfortable cards (`SIZES` in TreeCanvas.tsx). */
const SIZES = { nodeWidth: 220, nodeHeight: 64, partnerGap: 28, siblingGap: 32, generationGap: 76 }

/** The #112 baseline of `collateralFixture()` with SIZES (before #113–#118). */
const BASELINE = { width: 7560, longestHorizontal: 2338 }

const card = (id: string, x: number, y: number): LayoutNode => ({
  id,
  x,
  y,
  width: 100,
  height: 40,
  generation: 0,
  hasChildren: false,
  hasHiddenChildren: false
})
const line = (id: string, people: string[], points: [number, number][]): LayoutEdge => ({
  id,
  type: 'child',
  points: points.map(([x, y]) => ({ x, y })),
  relationshipIds: [id],
  source: people[0]!,
  target: people[people.length - 1]!,
  people
})
const layoutOf = (nodes: LayoutNode[], edges: LayoutEdge[]): Layout => ({
  nodes,
  edges,
  width: 1000,
  height: 400
})
const emptyTree = remarriageFixture()

/** Gaps (#116) for the canvas sizes: siblings, cousins, more distant branches. */
const GAPS = { sibling: 32, cousin: 132, branch: 220 }

/** Gaps between neighbouring blocks (partners, hanging columns) on every row, by relation. */
function neighbourGaps(
  tree: FamilyTree,
  l: Layout
): { gap: number; relation: 'sibling' | 'cousin' | 'branch'; pair: string }[] {
  const parents = new Map<string, string[]>()
  const partners = new Set<string>()
  for (const r of Object.values(tree.relationships)) {
    if (r.type === 'parent-child')
      parents.set(r.childId, [...(parents.get(r.childId) ?? []), r.parentId])
    else partners.add(r.partnerIds.slice().sort().join('|'))
  }
  const up = (id: string, depth: number): Set<string> => {
    let frontier = [id]
    const out = new Set<string>()
    for (let d = 0; d < depth; d++) {
      frontier = frontier.flatMap((x) => parents.get(x) ?? [])
      for (const p of frontier) out.add(p)
    }
    return out
  }
  const rows = new Map<number, LayoutNode[]>()
  for (const n of l.nodes) rows.set(n.generation, [...(rows.get(n.generation) ?? []), n])
  const out: { gap: number; relation: 'sibling' | 'cousin' | 'branch'; pair: string }[] = []
  for (const row of rows.values()) {
    row.sort((a, b) => a.x - b.x || a.y - b.y)
    const blocks: LayoutNode[][] = []
    for (const n of row) {
      const last = blocks[blocks.length - 1]
      const prev = last?.[last.length - 1]
      const joined =
        prev &&
        (prev.x === n.x ||
          (partners.has([prev.id, n.id].sort().join('|')) &&
            n.x - (prev.x + prev.width) <= SIZES.partnerGap + 1))
      if (joined) last!.push(n)
      else blocks.push([n])
    }
    for (let i = 1; i < blocks.length; i++) {
      const a = blocks[i - 1]!
      const b = blocks[i]!
      const near = (depth: number): boolean =>
        a.some((x) => b.some((y) => [...up(x.id, depth)].some((p) => up(y.id, depth).has(p))))
      const relation = near(1) ? 'sibling' : near(2) ? 'cousin' : 'branch'
      const right = Math.max(...a.map((n) => n.x + n.width))
      const left = Math.min(...b.map((n) => n.x))
      // A hanging column's trunk sits left of its cards.
      const trunk = b[0]!.stack ? 12 : 0
      out.push({ gap: left - trunk - right, relation, pair: `${a.at(-1)!.id} / ${b[0]!.id}` })
    }
  }
  return out
}

/** Horizontal lines of different parent groups at one height that end less than a family gap apart. */
function busEndsTooClose(l: Layout): string[] {
  const hs = l.edges
    .filter((e) => e.type === 'child')
    .flatMap((e) =>
      e.points.slice(1).flatMap((p, i) => {
        const q = e.points[i]!
        return q.y === p.y && q.x !== p.x
          ? [
              {
                y: p.y,
                l: Math.min(p.x, q.x),
                r: Math.max(p.x, q.x),
                g: e.people.slice(0, -1).sort().join('+')
              }
            ]
          : []
      })
    )
  const out: string[] = []
  for (let i = 0; i < hs.length; i++)
    for (let j = i + 1; j < hs.length; j++) {
      const a = hs[i]!
      const b = hs[j]!
      if (a.g === b.g || a.y !== b.y) continue
      const distance = Math.max(a.l, b.l) - Math.min(a.r, b.r)
      if (distance < GAPS.cousin - 0.5) out.push(`${a.g} / ${b.g} at ${a.y}`)
    }
  return out
}

describe('layout metrics (#112)', () => {
  it('counts a crossing between lines of different parents, not within one family', () => {
    const l = layoutOf(
      [],
      [
        line(
          'a',
          ['p', 'c1'],
          [
            [100, 0],
            [100, 100],
            [400, 100]
          ]
        ),
        line(
          'b',
          ['q', 'c2'],
          [
            [250, 50],
            [250, 200]
          ]
        ),
        line(
          'a2',
          ['p', 'c3'],
          [
            [300, 50],
            [300, 200]
          ]
        )
      ]
    )
    const m = layoutMetrics(emptyTree, l)
    expect(m.crossings).toEqual(['a × b @ 250,100'])
  })

  it('treats a mother alone and the mother with her partner as different groups', () => {
    const l = layoutOf(
      [],
      [
        line(
          'alone',
          ['m', 'c1'],
          [
            [100, 100],
            [400, 100]
          ]
        ),
        line(
          'both',
          ['m', 'f', 'c2'],
          [
            [300, 50],
            [300, 200]
          ]
        )
      ]
    )
    expect(layoutMetrics(emptyTree, l).crossings).toHaveLength(1)
  })

  it('finds lines through cards and parallel lines that are too close', () => {
    const l = layoutOf(
      [card('x', 150, 80)],
      [
        line(
          'a',
          ['p', 'c1'],
          [
            [100, 100],
            [400, 100]
          ]
        ),
        line(
          'b',
          ['q', 'c2'],
          [
            [300, 110],
            [600, 110]
          ]
        ),
        line(
          'c',
          ['r', 'c3'],
          [
            [300, 140],
            [600, 140]
          ]
        )
      ]
    )
    const m = layoutMetrics(emptyTree, l)
    expect(m.throughCards).toEqual(['a through x'])
    expect(m.closeParallels).toEqual(['a ∥ b'])
    expect(layoutMetrics(emptyTree, l, { minLaneDistance: 41 }).closeParallels).toHaveLength(3)
  })

  it('measures line lengths, distances to parents and the fit zoom', () => {
    const tree = remarriageFixture()
    const l = layoutFamily(tree, SIZES)
    const m = layoutMetrics(tree, l)
    expect(m.longestHorizontal).toBeGreaterThan(0)
    expect(m.totalChildLength).toBeGreaterThan(m.longestHorizontal)
    expect(m.childOffsets.get('piotr')).toBeGreaterThanOrEqual(0)
    expect(fitZoom({ width: 1031, height: 100 }, CANVAS_1440)).toBeCloseTo(1, 5)
    expect(fitZoom({ width: 4124, height: 100 }, CANVAS_1440)).toBeCloseTo(0.25, 3)
  })

  it('knows the direct line of the root person', () => {
    const tree = collateralFixture()
    const m = layoutMetrics(tree, layoutFamily(tree, SIZES))
    // me ← father + mother ← gf + gm ← 4 ancestor couples (one of them a single parent).
    expect(m.directEdges.length).toBeGreaterThanOrEqual(7)
  })

  it('finds no crossings or lines through cards in the existing fixtures', () => {
    for (const tree of [twoFamiliesFixture(), remarriageFixture(), kinshipFixture()]) {
      const m = layoutMetrics(tree, layoutFamily(tree, SIZES))
      expect(m.throughCards).toEqual([])
    }
  })
})

describe('half-siblings (#113)', () => {
  /** Jan: three children with Anna, two of his own, three with Ewa; Ewa also has one of her own. */
  const blended = (): FamilyTree => {
    const b = new TreeBuilder()
      .person('jan', 'Jan', 'male')
      .person('anna', 'Anna', 'female')
      .person('ewa', 'Ewa', 'female')
      .couple('jan', 'anna')
      .couple('jan', 'ewa')
    const kids = (parents: string[], ids: string[]): void => {
      for (const id of ids) {
        b.person(id, id)
        for (const p of parents) b.child(p, id)
      }
    }
    kids(['jan', 'anna'], ['a1', 'a2', 'a3'])
    kids(['jan'], ['j1', 'j2'])
    kids(['jan', 'ewa'], ['e1', 'e2', 'e3'])
    kids(['ewa'], ['w1'])
    return b.build()
  }
  /**
   * Children of one person's different parent sets (alone, with each partner) do not interleave:
   * between two children of one set there is no child of another set of the same person.
   */
  function runsBroken(tree: FamilyTree, l: Layout): string[] {
    const parents = new Map<string, string[]>()
    for (const r of Object.values(tree.relationships)) {
      if (r.type === 'parent-child')
        parents.set(r.childId, [...(parents.get(r.childId) ?? []), r.parentId].sort())
    }
    const rows = new Map<number, LayoutNode[]>()
    for (const n of l.nodes) rows.set(n.generation, [...(rows.get(n.generation) ?? []), n])
    const out: string[] = []
    for (const row of rows.values()) {
      const sets = row
        .sort((a, b) => a.x - b.x)
        .map((n) => parents.get(n.id))
        .filter((k): k is string[] => !!k)
      sets.forEach((a, i) => {
        for (let j = i + 2; j < sets.length; j++) {
          if (sets[j]!.join('+') !== a.join('+')) continue
          for (let k = i + 1; k < j; k++) {
            const b = sets[k]!
            if (b.join('+') !== a.join('+') && b.some((p) => a.includes(p)))
              out.push(`${a.join('+')} / ${b.join('+')}`)
          }
        }
      })
    }
    return out
  }

  it('keeps each parent set together and their lines apart', () => {
    for (const tree of [blended(), collateralFixture(), remarriageFixture()]) {
      expect(runsBroken(tree, layoutFamily(tree, SIZES))).toEqual([])
    }
    for (const tree of [blended(), remarriageFixture()]) {
      const m = layoutMetrics(tree, layoutFamily(tree, SIZES))
      expect(m.crossings).toEqual([])
      expect(m.closeParallels).toEqual([])
      expect(m.throughCards).toEqual([])
    }
  })

  it('gives a parent alone and the same parent with a partner separate lanes when they meet', () => {
    const tree = blended()
    const l = layoutFamily(tree, SIZES)
    const bus = (target: string): number =>
      l.edges.find((e) => e.target === target)!.points.at(-2)!.y
    const right = (target: string): number =>
      Math.max(...l.edges.find((e) => e.target === target)!.points.map((p) => p.x))
    const left = (target: string): number =>
      Math.min(...l.edges.find((e) => e.target === target)!.points.map((p) => p.x))
    // Jan's own children and the children with Ewa: either different lanes or a family gap apart.
    if (bus('j2') === bus('e1')) expect(left('e1') - right('j2')).toBeGreaterThanOrEqual(80)
  })
})

describe('the reported 78-person tree (#112 fixture)', () => {
  const tree = collateralFixture()
  const layout = (): Layout =>
    layoutFamily(tree, { ...SIZES, focusId: 'me', compactSiblings: true })

  it('has the shape of the report', () => {
    expect(Object.keys(tree.persons)).toHaveLength(78)
    const rows = new Map<number, number>()
    for (const n of layout().nodes) rows.set(n.generation, (rows.get(n.generation) ?? 0) + 1)
    expect([...rows.entries()].sort((a, b) => a[0] - b[0]).map((r) => r[1])).toEqual([
      7, 30, 13, 16, 12
    ])
  })

  // Budgets: each issue turns its own `it.fails` into `it`.
  it('#113: lines of one person with different partners never cross or run close', () => {
    const m = layoutMetrics(tree, layout())
    const mine = new Set(
      layout()
        .edges.filter((e) => e.type === 'child' && e.people.includes('d3'))
        .map((e) => e.id)
    )
    const touches = (s: string): boolean =>
      s
        .split(' @ ')[0]!
        .split(/ [×∥] /)
        .every((id) => mine.has(id))
    expect(m.crossings.filter(touches)).toEqual([])
    expect(m.closeParallels.filter(touches)).toEqual([])
  })

  it('#115: the tree is compact enough to read when fitted to the window', () => {
    const m = layoutMetrics(tree, layout())
    expect(m.width).toBeLessThanOrEqual(BASELINE.width * 0.55)
    expect(fitZoom(layout(), CANVAS_1440)).toBeGreaterThanOrEqual(0.25)
  })

  it('#115/#117: no horizontal line longer than half the baseline', () => {
    const m = layoutMetrics(tree, layout())
    expect(m.longestHorizontal).toBeLessThanOrEqual(BASELINE.longestHorizontal * 0.5)
    expect(m.directMaxRun).toBeLessThanOrEqual(BASELINE.longestHorizontal * 0.5)
    // Total line length grows by at most 10 % against #116 (29 572 px).
    expect(m.totalChildLength).toBeLessThanOrEqual(29572 * 1.1)
  })

  // Direct-line links run at most 1.5 card widths sideways where the rows allow it. Three cannot:
  // the father's place is fixed by the widest row (packed to the frame, #115) and the
  // great-grandparents' drop points by the next widest, so the grandparents – between the two –
  // keep the longest of {grandfather ← parents, father ← grandparents} at its minimum (~1 150 px).
  it('#117: direct-line links stay within 1.5 cards wherever the rows allow it', () => {
    const l = layout()
    const anc = ancestorsOf(tree, 'me')
    const runs = l.edges
      .filter(
        (e) =>
          e.type === 'child' &&
          (e.target === 'me' || anc.has(e.target)) &&
          e.people.slice(0, -1).every((p) => anc.has(p))
      )
      .map((e) => ({
        to: e.target,
        run: segmentsOf(e).reduce((sum, x) => sum + Math.abs(x.x2 - x.x1), 0)
      }))
    const long = runs.filter((r) => r.run > 1.5 * SIZES.nodeWidth).map((r) => r.to)
    expect(long.sort()).toEqual(['father', 'gf', 'gm'])
    const gf = runs.find((r) => r.to === 'gf')!.run
    const father = runs.find((r) => r.to === 'father')!.run
    // Balanced at the minimum of the longer one.
    expect(Math.abs(gf - father)).toBeLessThan(60)
  })

  // Why three links cannot be within 1.5 cards, for any order of the families (#117): the
  // grandparents are a couple (their centres 1 card + partner gap apart), and of each
  // great-grandparent couple one family's other children stand between the two drop points (a
  // sibling group split around the couple would cross lines). Even the narrowest choice – B's
  // four siblings in one column, and C's or D's married sibling plus two columns – puts the
  // drop points ≥ D apart, so the longer of the grandparents' links is ≥ (D − 248) / 2.
  it('#117: the grandparents’ longer link has an order-independent lower bound above 1.5 cards', () => {
    const w = SIZES.nodeWidth
    const column = 24 + w // a hanging column: trunk indent + card
    const couple = 2 * w + SIZES.partnerGap
    const half = SIZES.partnerGap / 2
    const between =
      half +
      w +
      SIZES.siblingGap +
      column + // gmMother, then B's one column
      w + // branch gap (B | C, nodeWidth)
      2 * column +
      SIZES.siblingGap +
      couple +
      SIZES.siblingGap + // C's others (narrowest of C, D)
      w +
      half // gfMother up to the partner gap
    const bound = (between - (w + SIZES.partnerGap)) / 2
    expect(bound).toBeGreaterThan(1.5 * w)
    // The layout's longer grandparent link respects the bound and is within 35 % of it.
    const l = layout()
    const anc = ancestorsOf(tree, 'me')
    const run = (to: string): number =>
      segmentsOf(
        l.edges.find(
          (e) =>
            e.type === 'child' && e.target === to && e.people.slice(0, -1).every((p) => anc.has(p))
        )!
      ).reduce((sum, x) => sum + Math.abs(x.x2 - x.x1), 0)
    const longer = Math.max(run('gm'), run('gf'))
    expect(longer).toBeGreaterThanOrEqual(bound)
    expect(longer).toBeLessThanOrEqual(bound * 1.35)
  })

  it('#117: a child without a family whose line would cross the direct line hangs below the parents', () => {
    const l = layout()
    const son = l.nodes.find((n) => n.id === 'c5Son')!
    const mother = l.nodes.find((n) => n.id === 'c5')!
    expect(son.hang).toEqual({ index: 0, count: 1 })
    expect(son.y).toBeGreaterThan(mother.y + mother.height)
    expect(son.y + son.height).toBeLessThan(
      Math.min(...l.nodes.filter((n) => n.generation === son.generation && !n.hang).map((n) => n.y))
    )
    const line = l.edges.find((e) => e.target === 'c5Son')!
    expect(line.points).toHaveLength(3)
    // Without compact siblings nobody hangs.
    const plain = layoutFamily(tree, { ...SIZES, focusId: 'me' })
    expect(plain.nodes.some((n) => n.hang)).toBe(false)
  })

  it('#116: neighbours from different families and branches keep their gaps', () => {
    for (const [name, t] of [
      ['collateral', tree],
      ['two families', twoFamiliesFixture()],
      ['remarriage', remarriageFixture()]
    ] as const) {
      const l = layoutFamily(t, { ...SIZES, compactSiblings: true })
      for (const g of neighbourGaps(t, l)) {
        expect(g.gap + 0.5, `${name}: ${g.pair} (${g.relation})`).toBeGreaterThanOrEqual(
          GAPS[g.relation]
        )
      }
      expect(busEndsTooClose(l), name).toEqual([])
    }
    const gaps = neighbourGaps(tree, layout())
    expect(
      gaps.some((g) => g.relation === 'sibling' && Math.abs(g.gap - SIZES.siblingGap) < 1)
    ).toBe(true)
    expect(gaps.some((g) => g.relation === 'cousin')).toBe(true)
    expect(gaps.some((g) => g.relation === 'branch')).toBe(true)
  })

  it('#116: a couple without ancestors stands within its child’s block', () => {
    const l = layout()
    const span = (ids: string[]): [number, number] => {
      const ns = l.nodes.filter((n) => ids.includes(n.id))
      return [Math.min(...ns.map((n) => n.x)), Math.max(...ns.map((n) => n.x + n.width))]
    }
    const [p1, p2] = span(['mF', 'mM'])
    const [c1, c2] = span(['mother', 'father'])
    expect(p2 > c1 && p1 < c2).toBe(true)
  })

  it('#116: the width stays within the #115 budget + 15 %', () => {
    expect(layoutMetrics(tree, layout()).width).toBeLessThanOrEqual(4016 * 1.15)
    expect(fitZoom(layout(), CANVAS_1440)).toBeGreaterThanOrEqual(0.25)
  })

  it('#117: no line crosses the home person’s direct line', () => {
    expect(layoutMetrics(tree, layout()).directCrossings).toEqual([])
  })

  it('#118: no crossings and no parallel lines closer than 16 px', () => {
    const m = layoutMetrics(tree, layout())
    expect(m.crossings).toEqual([])
    expect(m.closeParallels).toEqual([])
  })

  it('never draws a line through a card', () => {
    expect(layoutMetrics(tree, layout()).throughCards).toEqual([])
  })
})

describe('lane spacing (#118)', () => {
  it('keeps parallel lines of different families at least 16 px apart in every fixture', () => {
    for (const [name, tree] of [
      ['collateral', collateralFixture()],
      ['two families', twoFamiliesFixture()],
      ['remarriage', remarriageFixture()],
      ['kinship', kinshipFixture()]
    ] as const) {
      for (const compactSiblings of [false, true]) {
        for (const generationGap of [76, 30]) {
          const l = layoutFamily(tree, { ...SIZES, generationGap, compactSiblings })
          expect(layoutMetrics(tree, l).closeParallels, `${name} ${generationGap}`).toEqual([])
        }
      }
    }
  })
})

describe('compact siblings (#115)', () => {
  const COMPACT = { ...SIZES, compactSiblings: true }
  /** Parents with `n` children who have no partners or children; the first one is the root. */
  const family = (n: number, more?: (b: TreeBuilder) => void): FamilyTree => {
    const b = new TreeBuilder().person('f', 'F', 'male').person('m', 'M', 'female').couple('f', 'm')
    for (let i = 0; i < n; i++) {
      const id = `c${i}`
      b.person(id, id, 'unknown', { birth: { date: { value: `${1950 + i}`, qualifier: 'exact' } } })
      b.child('f', id).child('m', id)
    }
    more?.(b)
    return b.build()
  }
  const columns = (l: Layout): string[][] => {
    const byX = new Map<number, LayoutNode[]>()
    for (const n of l.nodes.filter((x) => x.stack)) byX.set(n.x, [...(byX.get(n.x) ?? []), n])
    return [...byX.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, ns]) => ns.sort((a, b) => a.y - b.y).map((n) => n.id))
  }
  const overlaps = (l: Layout): string[] => {
    const out: string[] = []
    for (const a of l.nodes)
      for (const b of l.nodes)
        if (
          a.id < b.id &&
          a.x < b.x + b.width &&
          b.x < a.x + a.width &&
          a.y < b.y + b.height &&
          b.y < a.y + a.height
        )
          out.push(`${a.id}/${b.id}`)
    return out
  }

  it('hangs three or more such siblings in balanced columns of up to four, oldest first', () => {
    expect(columns(layoutFamily(family(2), COMPACT))).toEqual([])
    expect(columns(layoutFamily(family(3), COMPACT))).toEqual([['c0', 'c1', 'c2']])
    expect(columns(layoutFamily(family(5), COMPACT))).toEqual([
      ['c0', 'c1', 'c2'],
      ['c3', 'c4']
    ])
    expect(columns(layoutFamily(family(9), COMPACT)).map((c) => c.length)).toEqual([3, 3, 3])
  })

  it('keeps siblings with families, the root and collapsed branches out of columns', () => {
    const t = family(4)
    const tree = { ...t, meta: { ...t.meta, rootPersonId: 'c1' } }
    expect(columns(layoutFamily(tree, COMPACT))).toEqual([['c0', 'c2', 'c3']])
    // A collapsed sibling with hidden children keeps its place (its expand button shows).
    const withChild = family(4, (b) => b.person('k', 'K').child('c0', 'k'))
    const collapsed = layoutFamily(withChild, { ...COMPACT, collapsed: new Set(['c0']) })
    expect(collapsed.nodes.find((n) => n.id === 'c0')!.stack).toBeUndefined()
    expect(columns(collapsed)).toEqual([['c1', 'c2', 'c3']])
  })

  it('draws a trunk beside the column and never overlaps cards or lines', () => {
    for (const tree of [family(6), collateralFixture(), twoFamiliesFixture()]) {
      const l = layoutFamily(tree, COMPACT)
      expect(overlaps(l)).toEqual([])
      const m = layoutMetrics(tree, l)
      expect(m.throughCards).toEqual([])
    }
    const l = layoutFamily(family(3), COMPACT)
    const c1 = l.nodes.find((n) => n.id === 'c1')!
    const line = l.edges.find((e) => e.target === 'c1')!
    expect(line.points.at(-1)).toEqual({ x: c1.x, y: c1.y + c1.height / 2 })
    expect(line.points.at(-2)!.x).toBeLessThan(c1.x)
  })

  it('makes a row with columns taller and moves the rows below', () => {
    const tree = family(4, (b) =>
      b.person('w', 'W').couple('c0', 'w').person('g', 'G').child('c0', 'g').child('w', 'g')
    )
    const l = layoutFamily(tree, COMPACT)
    const g = l.nodes.find((n) => n.id === 'g')!
    const lowest = Math.max(...l.nodes.filter((n) => n.stack).map((n) => n.y + n.height))
    expect(g.y).toBeGreaterThan(lowest)
  })

  it('leaves the layout unchanged when off', () => {
    for (const tree of [collateralFixture(), twoFamiliesFixture(), remarriageFixture()]) {
      const l = layoutFamily(tree, SIZES)
      expect(l.nodes.some((n) => n.stack)).toBe(false)
      expect(l.nodes.map((n) => [n.id, n.x, n.y])).toMatchSnapshot()
    }
  })
})
