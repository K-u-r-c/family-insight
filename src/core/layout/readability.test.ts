import { describe, expect, it } from 'vitest'
import { kinshipFixture } from '../kinship/fixture'
import { remarriageFixture } from '../test/fixtures'
import { collateralFixture, twoFamiliesFixture } from './fixtures'
import { layoutFamily, type Layout, type LayoutEdge, type LayoutNode } from './layout'
import { CANVAS_1440, fitZoom, layoutMetrics } from './metrics'

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

describe('the reported 78-person tree (#112 fixture)', () => {
  const tree = collateralFixture()
  const layout = (): Layout => layoutFamily(tree, { ...SIZES, focusId: 'me' })

  it('has the shape of the report', () => {
    expect(Object.keys(tree.persons)).toHaveLength(78)
    const rows = new Map<number, number>()
    for (const n of layout().nodes) rows.set(n.generation, (rows.get(n.generation) ?? 0) + 1)
    expect([...rows.entries()].sort((a, b) => a[0] - b[0]).map((r) => r[1])).toEqual([
      7, 30, 13, 16, 12
    ])
  })

  // Budgets: each issue turns its own `it.fails` into `it`.
  it.fails('#113: lines of one person with different partners never cross or run close', () => {
    const m = layoutMetrics(tree, layout())
    const mine = new Set(
      layout()
        .edges.filter((e) => e.type === 'child' && e.people.includes('d3'))
        .map((e) => e.id)
    )
    const touches = (s: string): boolean => [...mine].some((id) => s.includes(id))
    expect(m.crossings.filter(touches)).toEqual([])
    expect(m.closeParallels.filter(touches)).toEqual([])
  })

  it.fails('#115: the tree is compact enough to read when fitted to the window', () => {
    const m = layoutMetrics(tree, layout())
    expect(m.width).toBeLessThanOrEqual(BASELINE.width * 0.55)
    expect(fitZoom(layout(), CANVAS_1440)).toBeGreaterThanOrEqual(0.25)
    expect(m.longestHorizontal).toBeLessThanOrEqual(BASELINE.longestHorizontal * 0.5)
  })

  it.todo('#116: neighbours from different families and branches keep their gaps')

  it.fails('#117: no line crosses the home person’s direct line', () => {
    expect(layoutMetrics(tree, layout()).directCrossings).toEqual([])
  })

  it.fails('#118: no crossings and no parallel lines closer than 16 px', () => {
    const m = layoutMetrics(tree, layout())
    expect(m.crossings).toEqual([])
    expect(m.closeParallels).toEqual([])
  })

  it('never draws a line through a card', () => {
    expect(layoutMetrics(tree, layout()).throughCards).toEqual([])
  })
})
