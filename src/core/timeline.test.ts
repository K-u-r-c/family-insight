import { describe, expect, it } from 'vitest'
import { buildTimeline } from './timeline'
import { TreeBuilder } from './test/fixtures'
import { updateRelationship } from './model/operations'

const d = (value: string) => ({ value, qualifier: 'exact' as const })

describe('buildTimeline', () => {
  it('orders birth, partnerships, children and death chronologically', () => {
    let tree = new TreeBuilder()
      .person('jan', 'Jan', 'male', {
        birth: { date: d('1925'), place: 'Łódź' },
        death: { date: d('2001') }
      })
      .person('anna', 'Anna', 'female')
      .person('ewa', 'Ewa', 'female')
      .person('kid1', 'Kid1', 'female', { birth: { date: d('1952'), place: 'Łódź' } })
      .person('kid2', 'Kid2', 'male', { birth: { date: d('1985') } })
      .person('kid3', 'Kid3', 'male')
      .couple('jan', 'anna')
      .couple('jan', 'ewa')
      .child('jan', 'kid1')
      .child('jan', 'kid2')
      .child('jan', 'kid3')
      .build()
    tree = updateRelationship(tree, 'r1', {
      start: { date: d('1950'), place: 'Łódź' },
      end: { date: d('1980'), reason: 'divorce' }
    })
    tree = updateRelationship(tree, 'r2', { start: { date: d('1983') } })
    const types = buildTimeline(tree, 'jan').map(
      (e) => `${e.type}${'date' in e && e.date ? `@${e.date.value}` : ''}`
    )
    expect(types).toEqual([
      'birth@1925',
      'partnership@1950',
      'child@1952',
      'partnership-end@1980',
      'partnership@1983',
      'child@1985',
      'child',
      'death@2001'
    ])
  })

  it('is empty for unknown people and omits missing birth/death', () => {
    const tree = new TreeBuilder().person('x', 'X').build()
    expect(buildTimeline(tree, 'nope')).toEqual([])
    expect(buildTimeline(tree, 'x')).toEqual([])
  })
})
