import { describe, expect, it } from 'vitest'
import { TreeBuilder } from '../test/fixtures'
import { describeRelationships } from './describe'
import { doubleCousinsFixture, kinshipFixture } from './fixture'

const tree = kinshipFixture()

describe('describeRelationships', () => {
  // TreeBuilder gives everyone the surname Kowalski.
  it('names the relationship in the language, b relative to a', () => {
    const [first] = describeRelationships(tree, 'me', 'f', 'en', '?')
    expect(first).toMatchObject({
      sentence: 'Father Kowalski is the father of Maria Kowalski.',
      phrase: 'the father of Maria Kowalski'
    })
    expect(describeRelationships(tree, 'f', 'me', 'pl', '?')[0]!.sentence).toBe(
      'Maria Kowalski to córka osoby Father Kowalski.'
    )
  })

  it('lists every line of a double relationship', () => {
    const texts = describeRelationships(doubleCousinsFixture(), 'x', 'y', 'en', '?')
    expect(texts.map((t) => t.sentence)).toEqual([
      'Child of b2 and s2 Kowalski is the first cousin of Child of b1 and s1 Kowalski.',
      'Child of b2 and s2 Kowalski is the first cousin of Child of b1 and s1 Kowalski.'
    ])
  })

  it('describes relationships without a word by their common ancestors', () => {
    const b = new TreeBuilder().person('top', 'Adam Old', 'male')
    let [left, right] = ['top', 'top']
    for (let i = 1; i <= 14; i++) {
      b.person(`l${i}`, `L${i}`, 'female').child(left, `l${i}`)
      b.person(`r${i}`, `R${i}`, 'male').child(right, `r${i}`)
      ;[left, right] = [`l${i}`, `r${i}`]
    }
    const [text] = describeRelationships(b.build(), 'l14', 'r14', 'en', '?')
    expect(text!.phrase).toBeUndefined()
    expect(text!.sentence).toBe(
      'R14 Kowalski and L14 Kowalski are related through the common ancestor Adam Old Kowalski, 14 generations up and 14 down.'
    )
  })

  it('gives nothing for the same person or unrelated people', () => {
    expect(describeRelationships(tree, 'me', 'me', 'en', '?')).toEqual([])
    expect(describeRelationships(tree, 'me', 'stranger', 'en', '?')).toEqual([])
  })
})
