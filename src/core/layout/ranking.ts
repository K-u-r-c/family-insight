/**
 * Optimal layering of a directed acyclic graph: integer ranks with `rank[to] - rank[from] >= 1`
 * for every edge, minimising Σ weight · (rank[to] - rank[from]). This is the network simplex
 * method of Gansner et al., "A Technique for Drawing Directed Graphs" (1993), the same
 * formulation dagre and Graphviz use.
 *
 * Unlike longest-path layering it moves whole groups: when one node has to sit lower, everything
 * hanging off it that is not held elsewhere moves with it, so edges stay as short as possible.
 */

export interface RankEdge {
  from: number
  to: number
  weight: number
}

interface Edge extends RankEdge {
  tree: boolean
  cut: number
}

/**
 * Ranks for nodes `0 … count-1` of a connected graph, normalised so the smallest is 0.
 * Returns `null` when the edges contain a cycle (no valid layering exists).
 */
export function rankGraph(count: number, input: readonly RankEdge[]): number[] | null {
  if (count === 0) return []
  // Merge parallel edges; self-loops carry no constraint.
  const merged = new Map<string, Edge>()
  for (const e of input) {
    if (e.from === e.to) continue
    const key = `${e.from}>${e.to}`
    const found = merged.get(key)
    if (found) found.weight += e.weight
    else merged.set(key, { from: e.from, to: e.to, weight: e.weight, tree: false, cut: 0 })
  }
  const edges = [...merged.values()]
  const incident: number[][] = Array.from({ length: count }, () => [])
  edges.forEach((e, i) => {
    incident[e.from]!.push(i)
    incident[e.to]!.push(i)
  })

  const rank = longestPath(count, edges, incident)
  if (!rank) return null
  const slack = (e: Edge): number => rank[e.to]! - rank[e.from]! - 1

  // 1. Feasible spanning tree of tight edges (slack 0), shifting the tree to tighten one more edge.
  const inTree = new Array<boolean>(count).fill(false)
  inTree[0] = true
  let size = 1
  const grow = (): void => {
    const stack: number[] = []
    for (let v = 0; v < count; v++) if (inTree[v]) stack.push(v)
    while (stack.length) {
      const v = stack.pop()!
      for (const i of incident[v]!) {
        const e = edges[i]!
        const w = e.from === v ? e.to : e.from
        if (!inTree[w] && slack(e) === 0) {
          inTree[w] = true
          e.tree = true
          size++
          stack.push(w)
        }
      }
    }
  }
  grow()
  while (size < count) {
    let best = -1
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i]!
      if (inTree[e.from] === inTree[e.to]) continue
      if (best < 0 || slack(e) < slack(edges[best]!)) best = i
    }
    if (best < 0) break // disconnected input: callers pass connected components
    const e = edges[best]!
    const delta = inTree[e.from] ? slack(e) : -slack(e)
    for (let v = 0; v < count; v++) if (inTree[v]) rank[v]! += delta
    grow()
  }

  // 2. Low/lim numbering of the rooted tree and cut values, as in dagre's network simplex.
  const low = new Array<number>(count).fill(0)
  const lim = new Array<number>(count).fill(0)
  const parentEdge = new Array<number>(count).fill(-1)
  const postorder: number[] = []
  const number = (): void => {
    postorder.length = 0
    parentEdge.fill(-1)
    const visited = new Array<boolean>(count).fill(false)
    let next = 1
    // Iterative DFS: [node, index into incident list, low].
    const stack: [number, number, number][] = [[0, 0, next]]
    visited[0] = true
    while (stack.length) {
      const top = stack[stack.length - 1]!
      const [v, i] = top
      if (i < incident[v]!.length) {
        top[1]++
        const ei = incident[v]![i]!
        const e = edges[ei]!
        if (!e.tree) continue
        const w = e.from === v ? e.to : e.from
        if (visited[w]) continue
        visited[w] = true
        parentEdge[w] = ei
        stack.push([w, 0, next])
      } else {
        stack.pop()
        low[v] = top[2]
        lim[v] = next++
        postorder.push(v)
      }
    }
  }
  const other = (e: Edge, v: number): number => (e.from === v ? e.to : e.from)
  const cutValues = (): void => {
    for (const child of postorder) {
      const pe = parentEdge[child]!
      if (pe < 0) continue
      const pEdge = edges[pe]!
      const parent = other(pEdge, child)
      const childIsTail = pEdge.from === child
      let cut = pEdge.weight
      for (const i of incident[child]!) {
        if (i === pe) continue
        const e = edges[i]!
        const isOut = e.from === child
        const w = other(e, child)
        if (w === parent) continue
        const towardsHead = isOut === childIsTail
        cut += towardsHead ? e.weight : -e.weight
        if (e.tree && parentEdge[w] === i) cut += towardsHead ? -e.cut : e.cut
      }
      pEdge.cut = cut
    }
  }
  const descendant = (v: number, root: number): boolean =>
    low[root]! <= lim[v]! && lim[v]! <= lim[root]!
  const reRank = (): void => {
    // Preorder = reverse postorder.
    for (let k = postorder.length - 1; k >= 0; k--) {
      const v = postorder[k]!
      const pe = parentEdge[v]!
      if (pe < 0) continue
      const e = edges[pe]!
      const parent = other(e, v)
      rank[v] = e.from === v ? rank[parent]! - 1 : rank[parent]! + 1
    }
  }

  number()
  cutValues()
  // 3. Exchange tree edges with negative cut values for the tightest edge across the cut.
  for (let guard = 0; guard < count * 10; guard++) {
    const leaving = edges.findIndex((e) => e.tree && e.cut < 0)
    if (leaving < 0) break
    const e = edges[leaving]!
    let tail = e.from
    let flip = false
    if (lim[e.from]! > lim[e.to]!) {
      tail = e.to
      flip = true
    }
    let entering = -1
    for (let i = 0; i < edges.length; i++) {
      const f = edges[i]!
      if (flip !== descendant(f.from, tail) || flip === descendant(f.to, tail)) continue
      if (entering < 0 || slack(f) < slack(edges[entering]!)) entering = i
    }
    if (entering < 0) break
    e.tree = false
    edges[entering]!.tree = true
    number()
    cutValues()
    reRank()
  }

  const min = Math.min(...rank)
  return rank.map((r) => r - min)
}

/** Initial feasible ranks: each node one below its lowest predecessor; `null` on a cycle. */
function longestPath(count: number, edges: Edge[], incident: number[][]): number[] | null {
  const indegree = new Array<number>(count).fill(0)
  for (const e of edges) indegree[e.to]!++
  const rank = new Array<number>(count).fill(0)
  const queue: number[] = []
  for (let v = 0; v < count; v++) if (indegree[v] === 0) queue.push(v)
  let seen = 0
  while (seen < queue.length) {
    const v = queue[seen++]!
    for (const i of incident[v]!) {
      const e = edges[i]!
      if (e.from !== v) continue
      rank[e.to] = Math.max(rank[e.to]!, rank[v]! + 1)
      if (--indegree[e.to]! === 0) queue.push(e.to)
    }
  }
  return seen === count ? rank : null
}
