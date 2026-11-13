import { describe, expect, it } from 'vitest'
import { TreeBuilder } from '../test/fixtures'
import { addPartnership } from './operations'
import { childrenWithoutSecondParent, secondParentSuggestions } from './parentage'
import { validateTree } from './validate'

/** Zofia had four children before Wincenty was added; one child was linked to both. */
function family(): TreeBuilder {
  return new TreeBuilder()
    .person('zofia', 'Zofia', 'female')
    .person('wincenty', 'Wincenty', 'male')
    .person('a', 'A', 'unknown', { birth: { date: { value: '1930', qualifier: 'exact' } } })
    .person('b', 'B', 'unknown', { birth: { date: { value: '1932', qualifier: 'exact' } } })
    .person('both', 'Both')
    .person('adopted', 'Adopted')
    .couple('zofia', 'wincenty')
    .child('zofia', 'b')
    .child('zofia', 'a')
    .child('zofia', 'both')
    .child('wincenty', 'both')
    .child('zofia', 'adopted', 'adoptive')
}

describe('second parent (#114)', () => {
  it('finds children linked to one parent only, oldest first', () => {
    expect(childrenWithoutSecondParent(family().build(), 'zofia', 'wincenty')).toEqual(['a', 'b'])
  })

  it('skips non-biological links, children with two parents and non-partners', () => {
    const tree = family().person('x', 'X').build()
    expect(childrenWithoutSecondParent(tree, 'zofia', 'x')).toEqual([])
    expect(childrenWithoutSecondParent(tree, 'wincenty', 'zofia')).toEqual([])
  })

  it('skips children born before the partnership started (likely a step-parent)', () => {
    const b = family()
    const base = b.build()
    const rel = Object.values(base.relationships).find((r) => r.type === 'partnership')!
    const tree = {
      ...base,
      relationships: {
        ...base.relationships,
        [rel.id]: { ...rel, start: { date: { value: '1931', qualifier: 'exact' } } }
      }
    } as typeof base
    expect(childrenWithoutSecondParent(tree, 'zofia', 'wincenty')).toEqual(['b'])
  })

  it('never suggests a partner who descends from the child', () => {
    // The child c is the partner's parent.
    const tree = new TreeBuilder()
      .person('p', 'P')
      .person('c', 'C')
      .person('q', 'Q')
      .child('p', 'c')
      .child('c', 'q')
      .build()
    const withCouple = addPartnership(tree, 'p', 'q').tree
    expect(childrenWithoutSecondParent(withCouple, 'p', 'q')).toEqual([])
  })

  it('suggests from both sides of the couple', () => {
    const tree = family().build()
    expect(secondParentSuggestions(tree, 'zofia')).toEqual([
      { parentId: 'zofia', candidates: ['wincenty'], childIds: ['a', 'b'] }
    ])
    expect(secondParentSuggestions(tree, 'wincenty')).toEqual([
      { parentId: 'zofia', candidates: ['wincenty'], childIds: ['a', 'b'] }
    ])
  })

  it('lets a person with several partners choose, and asks no partner with other partners', () => {
    const tree = family().person('second', 'Second', 'male').couple('zofia', 'second').build()
    expect(secondParentSuggestions(tree, 'zofia')).toEqual([
      { parentId: 'zofia', candidates: ['wincenty', 'second'], childIds: ['a', 'b'] }
    ])
    // Zofia has two partners: Wincenty is not offered her children in his own panel.
    expect(secondParentSuggestions(tree, 'wincenty')).toEqual([])
  })

  it('is a data warning in validateTree', () => {
    const issues = validateTree(family().build()).filter(
      (i) => i.code === 'single-parent-with-partner'
    )
    expect(issues.map((i) => i.personId)).toEqual(['a', 'b'])
    expect(issues[0]!.params).toMatchObject({
      parent: 'Zofia Kowalski',
      partner: 'Wincenty Kowalski'
    })
  })
})
