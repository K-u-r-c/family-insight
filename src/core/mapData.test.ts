import { describe, expect, it } from 'vitest'
import {
  filterFacts,
  generations,
  groupByPlace,
  MAP_KINDS,
  mapFacts,
  markerGeneration,
  migrationPath,
  unlocatedPlaces,
  yearRange
} from './mapData'
import { addPersonEvent, updatePerson, updateRelationship } from './model/operations'
import { setPlace } from './model/places'
import type { FamilyTree } from './model/types'
import { remarriageFixture } from './test/fixtures'

const d = (value: string) => ({ value, qualifier: 'exact' as const })

function tree(): FamilyTree {
  let t = remarriageFixture()
  t = updatePerson(t, 'jan', {
    birth: { date: d('1890'), place: 'Kraków' },
    death: { date: d('1960'), place: 'Łódź' }
  })
  t = addPersonEvent(t, 'jan', { type: 'emigration', date: d('1920'), place: 'Hamburg' }).tree
  t = addPersonEvent(t, 'jan', { type: 'residence', date: d('1930'), place: 'Łódź' }).tree
  t = updatePerson(t, 'anna', { birth: { date: d('1895'), place: 'Krakow' } })
  t = updatePerson(t, 'piotr', { birth: { place: 'Gdańsk' } })
  const marriage = Object.values(t.relationships).find(
    (r) => r.type === 'partnership' && r.partnerIds.includes('anna')
  )!
  t = updateRelationship(t, marriage.id, { start: { date: d('1915'), place: 'Kraków' } })
  t = setPlace(t, 'Kraków', { lat: 50.06, lon: 19.94, source: 'manual' })
  t = setPlace(t, 'Łódź', { lat: 51.76, lon: 19.46, source: 'manual' })
  t = setPlace(t, 'Hamburg', { lat: 53.55, lon: 9.99, source: 'manual' })
  t.meta.rootPersonId = 'jan'
  return t
}

const all = { kinds: new Set(MAP_KINDS) }

describe('map data', () => {
  it('collects located facts and lists places without coordinates', () => {
    const facts = mapFacts(tree())
    expect(facts.map((f) => `${f.personId}:${f.kind}:${f.placeKey}`).sort()).toEqual(
      [
        'anna:birth:krakow',
        'anna:marriage:krakow',
        'jan:birth:krakow',
        'jan:death:lodz',
        'jan:event:hamburg',
        'jan:event:lodz',
        'jan:marriage:krakow'
      ].sort()
    )
    expect(unlocatedPlaces(tree()).map((p) => p.name)).toEqual(['Gdańsk'])
  })

  it('filters by kind and period', () => {
    const facts = mapFacts(tree())
    expect(filterFacts(facts, { kinds: new Set(['birth']) })).toHaveLength(2)
    const period = filterFacts(facts, { ...all, from: 1900, to: 1930 })
    expect(period.map((f) => f.year).sort()).toEqual([1915, 1915, 1920, 1930])
    expect(yearRange(facts)).toEqual({ min: 1890, max: 1960 })
  })

  it('groups facts into one marker per place', () => {
    const markers = groupByPlace(mapFacts(tree()))
    expect(markers.map((m) => [m.name, m.facts.length, m.personIds.length])).toEqual([
      ['Kraków', 4, 2],
      ['Łódź', 2, 1],
      ['Hamburg', 1, 1]
    ])
  })

  it('orders a migration path by date and merges consecutive stays', () => {
    const path = migrationPath(mapFacts(tree()), 'jan')
    expect(path.map((f) => f.placeKey)).toEqual(['krakow', 'hamburg', 'lodz'])
  })

  it('colours by generation relative to the root', () => {
    const t = tree()
    const gens = generations(t, 'jan')
    expect(gens.get('jan')).toBe(0)
    expect(gens.get('anna')).toBe(0)
    expect(gens.get('piotr')).toBe(1)
    const [krakow] = groupByPlace(mapFacts(t))
    expect(markerGeneration(krakow!, gens)).toBe(0)
    expect(generations(t, undefined).size).toBe(0)
  })
})
