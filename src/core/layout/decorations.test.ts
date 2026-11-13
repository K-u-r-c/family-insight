import { describe, expect, it } from 'vitest'
import { TreeBuilder } from '../test/fixtures'
import { junctions, jumps, splitAtJumps } from './decorations'
import { layoutFamily, type LayoutEdge } from './layout'

const line = (id: string, people: string[], points: [number, number][]): LayoutEdge => ({
  id,
  type: 'child',
  points: points.map(([x, y]) => ({ x, y })),
  relationshipIds: [id],
  source: people[0]!,
  target: people.at(-1)!,
  people
})

describe('line decorations (#118)', () => {
  it('puts a dot at every branching point and none at plain corners', () => {
    // Stem at x 200 down to the bus at y 100; children at x 0, 200 and 400.
    const edges = [
      line(
        'a',
        ['p', 'q', 'a'],
        [
          [200, 0],
          [200, 100],
          [0, 100],
          [0, 200]
        ]
      ),
      line(
        'b',
        ['p', 'q', 'b'],
        [
          [200, 0],
          [200, 100],
          [200, 200]
        ]
      ),
      line(
        'c',
        ['p', 'q', 'c'],
        [
          [200, 0],
          [200, 100],
          [400, 100],
          [400, 200]
        ]
      )
    ]
    expect(junctions(edges).map((j) => [j.x, j.y])).toEqual([[200, 100]])
    // Without the middle child the stem still meets a bus going both ways.
    expect(junctions([edges[0]!, edges[2]!]).map((j) => [j.x, j.y])).toEqual([[200, 100]])
    // One child: just corners.
    expect(junctions([edges[0]!])).toEqual([])
  })

  it('marks where a child leaves the bus between its siblings', () => {
    const b = new TreeBuilder().person('f', 'F', 'male').person('m', 'M', 'female').couple('f', 'm')
    for (const id of ['a', 'b', 'c', 'd']) b.person(id, id).child('f', id).child('m', id)
    const l = layoutFamily(b.build())
    const dots = junctions(l.edges)
    // The stem's T and the two inner children's drops (the outer two are corners).
    expect(dots.length).toBeGreaterThanOrEqual(2)
    for (const d of dots) expect(d.people).toEqual(expect.arrayContaining(['f', 'm']))
  })

  it('makes a jump where lines of different families cross, and splits the line there', () => {
    const edges = [
      line(
        'h',
        ['p', 'x'],
        [
          [0, 100],
          [400, 100]
        ]
      ),
      line(
        'v',
        ['q', 'y'],
        [
          [200, 0],
          [200, 300]
        ]
      ),
      line(
        'own',
        ['p', 'z'],
        [
          [100, 0],
          [100, 300]
        ]
      )
    ]
    expect(jumps(edges)).toEqual([{ x: 200, y: 100, edgeId: 'v' }])
    const pieces = splitAtJumps(edges[1]!.points, jumps(edges), 5)
    expect(pieces).toEqual([
      [
        { x: 200, y: 0 },
        { x: 200, y: 95 }
      ],
      [
        { x: 200, y: 105 },
        { x: 200, y: 300 }
      ]
    ])
    expect(splitAtJumps(edges[0]!.points, [])).toEqual([edges[0]!.points])
  })
})
