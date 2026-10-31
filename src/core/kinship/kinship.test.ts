import { describe, expect, it } from 'vitest'
import type { FamilyTree } from '../model/types'
import { TreeBuilder } from '../test/fixtures'
import { doubleCousinsFixture, kinshipFixture } from './fixture'
import { cousinDegree, findRelationships, generationDifference, type Kinship } from './kinship'

const tree = kinshipFixture()
const first = (b: string, a = 'me', t: FamilyTree = tree): Kinship => {
  const found = findRelationships(t, a, b)
  expect(found.length, `${a} → ${b}`).toBeGreaterThan(0)
  return found[0]!
}
const shape = (k: Kinship): string =>
  k.kind === 'direct' || k.kind === 'collateral' || k.kind === 'step' || k.kind === 'in-law'
    ? `${k.kind} ${k.up}/${k.down}${'half' in k && k.half ? ' half' : ''}`
    : k.kind

describe('blood relationships', () => {
  it.each([
    ['f', 'direct 1/0'],
    ['gf', 'direct 2/0'],
    ['ggf', 'direct 3/0'],
    ['gggf', 'direct 4/0'],
    ['son', 'direct 0/1'],
    ['ggs', 'direct 0/3'],
    ['br', 'collateral 1/1'],
    ['hb', 'collateral 1/1 half'],
    ['u', 'collateral 2/1'],
    ['hs', 'collateral 2/1 half'],
    ['nep', 'collateral 1/2'],
    ['gnep', 'collateral 1/3'],
    ['gu', 'collateral 3/1'],
    ['c1', 'collateral 2/2'],
    ['c1d', 'collateral 2/3'],
    ['gu1', 'collateral 3/2'],
    ['sc2', 'collateral 3/3'],
    ['sc3', 'collateral 3/4']
  ])('me → %s is %s', (b, expected) => {
    expect(shape(first(b))).toBe(expected)
  })

  it('names the common ancestors, the side and the path', () => {
    const cousin = first('c1')
    expect(cousin).toMatchObject({
      kind: 'collateral',
      commonAncestors: ['gf', 'gm'],
      side: 'paternal',
      lineage: 'biological',
      sexA: 'female',
      sexB: 'male'
    })
    expect(cousin.path[0]).toBe('me')
    expect(cousin.path.at(-1)).toBe('c1')
    expect(cousin.path).toHaveLength(5)
    expect(first('mc')).toMatchObject({
      side: 'maternal',
      commonAncestors: ['mgf', 'mgm'],
      branchSex: 'female'
    })
    expect(first('c1')).toMatchObject({ branchSex: 'male' })
    expect(first('nep')).toMatchObject({ branchSex: 'male', side: 'paternal' })
    expect(first('sc3')).toMatchObject({ commonAncestors: ['ggf', 'ggm'] })
    expect(cousinDegree(first('sc3') as { up: number; down: number })).toEqual({
      degree: 2,
      removed: 1
    })
    expect(generationDifference(first('gu1') as { up: number; down: number })).toBe(1)
  })

  it('is symmetric in distances', () => {
    expect(shape(first('me', 'c1d'))).toBe('collateral 3/2')
    expect(shape(first('me', 'gf'))).toBe('direct 0/2')
  })

  it('finds both lines of double first cousins', () => {
    const found = findRelationships(doubleCousinsFixture(), 'x', 'y')
    expect(found.map(shape)).toEqual(['collateral 2/2', 'collateral 2/2'])
    expect(found.map((k) => (k as { commonAncestors: string[] }).commonAncestors)).toEqual(
      expect.arrayContaining([
        ['pa', 'pb'],
        ['ma', 'mb']
      ])
    )
  })

  it('marks adoptive lines', () => {
    expect(first('ad')).toMatchObject({ kind: 'direct', up: 0, down: 1, lineage: 'adoptive' })
    expect(first('ad', 'son')).toMatchObject({
      kind: 'collateral',
      lineage: 'adoptive',
      half: false
    })
  })

  it('does not call a relationship half when the other parent is unknown', () => {
    const t = new TreeBuilder()
      .person('p', 'Parent')
      .person('x', 'X')
      .person('y', 'Y')
      .child('p', 'x')
      .child('p', 'y')
      .build()
    expect(first('y', 'x', t)).toMatchObject({ kind: 'collateral', half: false })
  })
})

describe('partners, in-laws and step relationships', () => {
  it.each([
    ['h', 'partner'],
    ['hf', 'in-law 1/0'],
    ['hbr', 'in-law 1/1'],
    ['sil', 'in-law 1/1'],
    ['dil', 'in-law 0/1'],
    ['hbrw', 'in-law 1/1'],
    ['sm', 'step 1/0'],
    ['sb', 'step 1/1']
  ])('me → %s is %s', (b, expected) => {
    expect(shape(first(b))).toBe(expected)
  })

  it('tells in-laws apart by the partnership they go through', () => {
    expect(first('hf')).toMatchObject({ via: 'partner-of-a', partners: ['h'], partnerSex: 'male' })
    expect(first('sil')).toMatchObject({ via: 'partner-of-b', partners: ['br'] })
    expect(first('dil')).toMatchObject({ via: 'partner-of-b', partners: ['son'] })
    expect(first('hbrw')).toMatchObject({ via: 'both', partners: ['h', 'hbr'] })
  })

  it('finds stepchildren and keeps own children direct', () => {
    expect(first('me', 'sm')).toMatchObject({ kind: 'step', up: 0, down: 1, via: 'f' })
    // f's own children are not his stepchildren through m.
    expect(findRelationships(tree, 'm', 'br').map(shape)).toEqual(['direct 0/1'])
    expect(findRelationships(tree, 'me', 'f').map(shape)).toEqual(['direct 1/0'])
  })

  it('lists partner relations with the partnership kind', () => {
    expect(first('h')).toMatchObject({ kind: 'partner', partnership: 'marriage', ended: false })
  })
})

describe('edge cases', () => {
  it('handles the same person, unrelated people and unknown ids', () => {
    expect(findRelationships(tree, 'me', 'me')).toEqual([
      { kind: 'self', path: ['me'], sexA: 'female', sexB: 'female' }
    ])
    expect(findRelationships(tree, 'me', 'stranger')).toEqual([])
    expect(findRelationships(tree, 'me', 'nobody')).toEqual([])
  })

  it('survives cycles in malformed data', () => {
    const t = new TreeBuilder().person('x', 'X').person('y', 'Y').person('z', 'Z').build()
    // x → y → x (a parent cycle the editor would never create)
    for (const [id, parentId, childId] of [
      ['c1', 'x', 'y'],
      ['c2', 'y', 'x'],
      ['c3', 'y', 'z']
    ] as const) {
      t.relationships[id] = { id, type: 'parent-child', parentId, childId, kind: 'biological' }
    }
    expect(() => findRelationships(t, 'x', 'z')).not.toThrow()
    expect(findRelationships(t, 'x', 'z').length).toBeGreaterThan(0)
  })

  it('stays fast on a large tree', () => {
    // A ladder of 12 generations with 1 000+ people.
    const b = new TreeBuilder()
    let level = ['r0']
    b.person('r0', 'Root')
    let n = 0
    for (let g = 1; g <= 12 && n < 1100; g++) {
      const next: string[] = []
      for (const parent of level) {
        for (let k = 0; k < 2 && n < 1100; k++) {
          const id = `p${++n}`
          b.person(id, id).child(parent, id)
          next.push(id)
        }
      }
      level = next
    }
    const t = b.build()
    const ids = Object.keys(t.persons)
    const start = performance.now()
    for (let i = 0; i < 20; i++) findRelationships(t, ids[ids.length - 1 - i]!, ids[600 + i]!)
    const average = (performance.now() - start) / 20
    // Well under the 50 ms target locally (~1 ms); generous for slow CI runners.
    expect(average).toBeLessThan(50)
    if (process.env.KINSHIP_TIMING) console.log(`kinship: ${average.toFixed(2)} ms per pair`)
  })
})
