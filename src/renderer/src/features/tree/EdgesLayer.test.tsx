// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { layoutFamily, type LayoutEdge } from '@core/layout/layout'
import { remarriageFixture } from '@core/test/fixtures'
import { EdgesLayer, roundedPath } from './EdgesLayer'

afterEach(cleanup)

/** Every number in an SVG path, as [x, y] pairs. */
const coords = (d: string): [number, number][] => {
  const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number)
  return n.flatMap((_, i) => (i % 2 === 0 ? [[n[i]!, n[i + 1]!] as [number, number]] : []))
}

describe('roundedPath', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 0, y: 60 },
    { x: 200, y: 60 },
    { x: 200, y: 120 }
  ]

  it('rounds corners with curves and keeps inside the corner points', () => {
    for (const radius of [10, 24]) {
      const d = roundedPath(points, radius)
      expect(d.match(/Q/g)).toHaveLength(2)
      for (const [x, y] of coords(d)) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(200)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(120)
      }
    }
  })

  it('uses the larger radius where the segments allow it, and never more than half a segment', () => {
    // The curve starts `radius` before the corner (0, 60).
    expect(roundedPath(points, 24)).toContain('L0,36')
    expect(roundedPath(points, 10)).toContain('L0,50')
    // A 30 px segment limits the radius to 15.
    const short = roundedPath(
      [
        { x: 0, y: 0 },
        { x: 0, y: 30 },
        { x: 100, y: 30 }
      ],
      24
    )
    expect(short).toContain('L0,15')
  })
})

describe('EdgesLayer', () => {
  const layout = layoutFamily(remarriageFixture(), { partnerGap: 40 })
  const bounds = { minX: -50, minY: -50, width: 2000, height: 1000 }
  const draw = (tapestry: boolean, highlight: string | null = null) =>
    render(
      <EdgesLayer
        edges={layout.edges}
        bounds={bounds}
        highlight={highlight}
        dimmed={false}
        path={null}
        tapestry={tapestry}
      />
    ).container

  it('draws one path per edge in the modern style', () => {
    const svg = draw(false)
    expect(svg.querySelectorAll('path[data-people]')).toHaveLength(layout.edges.length)
    expect(svg.querySelectorAll('circle')).toHaveLength(0)
  })

  it('adds a thread sheen and a knot between neighbouring partners in the tapestry style', () => {
    const svg = draw(true)
    const solid = layout.edges.filter(
      (e: LayoutEdge) => !e.ended && (!e.kind || e.kind === 'biological')
    )
    const neighbours = layout.edges.filter((e) => e.type === 'partner' && e.points.length === 2)
    expect(svg.querySelectorAll('path[data-people]')).toHaveLength(layout.edges.length)
    expect(svg.querySelectorAll('path:not([data-people])')).toHaveLength(solid.length)
    expect(svg.querySelectorAll('circle')).toHaveLength(neighbours.length)
    expect(neighbours.length).toBeGreaterThan(0)
  })

  it('highlights the knot and sheen with the person’s lines', () => {
    const svg = draw(true, 'jan')
    const active = [...svg.querySelectorAll('g')].filter((g) =>
      g.querySelector('path[data-active]')
    )
    expect(active.length).toBeGreaterThan(0)
    for (const g of active) {
      for (const el of g.querySelectorAll('path, circle')) {
        expect(el.getAttribute('class')).toMatch(/activeEdge/)
      }
    }
  })
})
