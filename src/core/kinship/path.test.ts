import { describe, expect, it } from 'vitest'
import { layoutFamily } from '../layout/layout'
import { kinshipFixture } from './fixture'
import { findRelationships } from './kinship'
import { pathRelationships } from './path'

const tree = kinshipFixture()
const SIZES = { nodeWidth: 220, nodeHeight: 64, partnerGap: 28, siblingGap: 32, generationGap: 76 }

describe('pathRelationships', () => {
  it('links every step of the path', () => {
    for (const b of ['c1', 'mc', 'sc3', 'hbrw', 'sm', 'dil']) {
      const [k] = findRelationships(tree, 'me', b)
      const ids = pathRelationships(tree, k!.path)
      expect(ids.size, b).toBeGreaterThanOrEqual(k!.path.length - 1)
    }
  })

  it('matches the drawn lines, also through the mother of a couple', () => {
    // me → m → mgf/mgm → mt → mc: the line from f + m to me is drawn from the couple.
    const [k] = findRelationships(tree, 'me', 'mc')
    const ids = pathRelationships(tree, k!.path)
    const layout = layoutFamily(tree, { ...SIZES, mode: 'family' })
    const drawn = layout.edges.filter((e) => e.relationshipIds.some((id) => ids.has(id)))
    const covered = new Set(drawn.flatMap((e) => e.relationshipIds.filter((id) => ids.has(id))))
    expect(covered).toEqual(ids)
    expect(drawn.some((e) => e.target === 'me' && e.source === 'f')).toBe(true)
  })
})
