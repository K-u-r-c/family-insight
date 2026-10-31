import { describe, expect, it } from 'vitest'
import { rankGraph, type RankEdge } from './ranking'

const e = (from: number, to: number, weight = 1): RankEdge => ({ from, to, weight })
const cost = (ranks: number[], edges: RankEdge[]): number =>
  edges.reduce((s, x) => s + x.weight * (ranks[x.to]! - ranks[x.from]!), 0)

/** Cheapest valid ranking by exhaustive search (tiny graphs only). */
function bruteForce(count: number, edges: RankEdge[]): number {
  let best = Infinity
  const ranks = new Array<number>(count).fill(0)
  const go = (i: number): void => {
    if (i === count) {
      if (edges.every((x) => ranks[x.to]! - ranks[x.from]! >= 1))
        best = Math.min(best, cost(ranks, edges))
      return
    }
    for (let r = 0; r < count; r++) {
      ranks[i] = r
      go(i + 1)
    }
  }
  go(0)
  return best
}

describe('rankGraph', () => {
  it('ranks a chain and a single node', () => {
    expect(rankGraph(1, [])).toEqual([0])
    expect(rankGraph(3, [e(0, 1), e(1, 2)])).toEqual([0, 1, 2])
    expect(rankGraph(0, [])).toEqual([])
  })

  it('returns null for a cycle', () => {
    expect(rankGraph(3, [e(0, 1), e(1, 2), e(2, 0)])).toBeNull()
    expect(rankGraph(2, [e(0, 1), e(1, 0)])).toBeNull()
  })

  it('ignores self-loops and merges parallel edges', () => {
    expect(rankGraph(2, [e(0, 0), e(0, 1), e(0, 1)])).toEqual([0, 1])
  })

  it('moves a whole branch down instead of stretching one edge', () => {
    // 0 → 1 → 2 → 3 (deep side); 4 → 5 → {6, 7}, 6 → 8; 7 must sit with 3's child row: 3 → 7.
    const edges = [e(0, 1), e(1, 2), e(2, 3), e(4, 5), e(5, 6), e(5, 7), e(6, 8), e(3, 7)]
    const r = rankGraph(9, edges)!
    for (const x of edges) expect(r[x.to]! - r[x.from]!, `${x.from}→${x.to}`).toBe(1)
  })

  it('finds the optimum on small random graphs', () => {
    let s = 7
    const rand = (): number => {
      s = (s * 1103515245 + 12345) % 2147483648
      return s / 2147483648
    }
    for (let round = 0; round < 60; round++) {
      const count = 3 + Math.floor(rand() * 4)
      // Random DAG on a hidden order, connected through a spanning path of random edges.
      const edges: RankEdge[] = []
      for (let v = 1; v < count; v++) {
        const u = Math.floor(rand() * v)
        edges.push(rand() < 0.5 ? e(u, v, 1 + Math.floor(rand() * 3)) : e(u, v))
      }
      for (let k = 0; k < count; k++) {
        const a = Math.floor(rand() * count)
        const b = Math.floor(rand() * count)
        if (a < b) edges.push(e(a, b, 1 + Math.floor(rand() * 2)))
      }
      const r = rankGraph(count, edges)!
      for (const x of edges) expect(r[x.to]! - r[x.from]!).toBeGreaterThanOrEqual(1)
      expect(Math.min(...r)).toBe(0)
      expect(cost(r, edges), JSON.stringify(edges)).toBe(bruteForce(count, edges))
    }
  })
})
