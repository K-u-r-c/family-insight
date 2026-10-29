import { describe, expect, it } from 'vitest'
import { validateTree } from './validate'
import type { FamilyTree } from './types'
import { remarriageFixture } from '../test/fixtures'

const codes = (tree: FamilyTree): string[] =>
  validateTree(tree)
    .map((i) => i.code)
    .sort()

describe('validateTree', () => {
  it('accepts a valid tree', () => {
    expect(validateTree(remarriageFixture())).toEqual([])
  })

  it('reports dangling references, self links, duplicates and too many parents', () => {
    const tree = remarriageFixture()
    tree.relationships.x1 = {
      id: 'x1',
      type: 'parent-child',
      parentId: 'ghost',
      childId: 'jan',
      kind: 'biological'
    }
    tree.relationships.x2 = {
      id: 'x2',
      type: 'partnership',
      partnerIds: ['ewa', 'ewa'],
      kind: 'marriage'
    }
    tree.relationships.x3 = {
      id: 'x3',
      type: 'partnership',
      partnerIds: ['anna', 'jan'],
      kind: 'marriage'
    }
    tree.relationships.x4 = {
      id: 'x4',
      type: 'parent-child',
      parentId: 'kuba',
      childId: 'piotr',
      kind: 'biological'
    }
    expect(codes(tree)).toEqual([
      'dangling-reference',
      'duplicate-relationship',
      'self-relationship',
      'too-many-biological-parents'
    ])
  })

  it('detects ancestry cycles', () => {
    const tree = remarriageFixture()
    tree.relationships.c = {
      id: 'c',
      type: 'parent-child',
      parentId: 'kuba',
      childId: 'jan',
      kind: 'adoptive'
    }
    expect(codes(tree)).toContain('ancestry-cycle')
  })

  it('warns about a missing root', () => {
    const tree = remarriageFixture()
    tree.meta.rootPersonId = 'ghost'
    expect(validateTree(tree)).toEqual([
      { severity: 'warning', code: 'missing-root', params: { id: 'ghost' } }
    ])
  })
})
