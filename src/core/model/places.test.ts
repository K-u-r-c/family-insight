import { describe, expect, it } from 'vitest'
import { remarriageFixture } from '../test/fixtures'
import { addMedia } from './media'
import { addPersonEvent, updatePerson, updateRelationship } from './operations'
import {
  listPlaces,
  mergePlaces,
  normalizePlaceKeys,
  placeKey,
  placeUses,
  setPlace
} from './places'
import type { FamilyTree } from './types'

function withPlaces(): FamilyTree {
  let tree = remarriageFixture()
  tree = updatePerson(tree, 'jan', {
    birth: { place: 'Kraków' },
    death: { place: 'Warszawa' }
  })
  tree = updatePerson(tree, 'anna', { birth: { place: ' krakow ' } })
  tree = updatePerson(tree, 'ewa', { birth: { place: 'Cracow' } })
  tree = addPersonEvent(tree, 'piotr', { type: 'residence', place: 'Kraków' }).tree
  const marriage = Object.values(tree.relationships).find((r) => r.type === 'partnership')!
  tree = updateRelationship(tree, marriage.id, { start: { place: 'Kraków' } })
  tree = addMedia(tree, {
    hash: 'a'.repeat(64),
    mime: 'image/jpeg',
    fileName: 'a.jpg',
    place: 'Cracow'
  }).tree
  return tree
}

describe('places', () => {
  it('normalises place names for the gazetteer', () => {
    expect(placeKey('  Kraków ')).toBe('krakow')
    expect(placeKey('Łódź')).toBe('lodz')
    expect(placeKey('Nowy   Sącz')).toBe('nowy sacz')
  })

  it('lists distinct places with spellings, counts and people', () => {
    const tree = setPlace(withPlaces(), 'Krakow', { lat: 50.06, lon: 19.94, source: 'manual' })
    expect(placeUses(tree)).toHaveLength(7)
    const [krakow, ...rest] = listPlaces(tree)
    expect(krakow).toMatchObject({
      key: 'krakow',
      name: 'Kraków',
      spellings: ['Kraków', 'krakow'],
      count: 4,
      place: { lat: 50.06, lon: 19.94, source: 'manual' }
    })
    expect(new Set(krakow!.personIds)).toEqual(new Set(['jan', 'anna', 'piotr']))
    expect(rest.map((p) => [p.name, p.count])).toEqual([
      ['Cracow', 2],
      ['Warszawa', 1]
    ])
  })

  it('sets and clears coordinates, rejecting impossible ones', () => {
    let tree = setPlace(withPlaces(), 'Warszawa', { lat: 52.23, lon: 21.01, source: 'geocoded' })
    expect(tree.places.warszawa).toEqual({ lat: 52.23, lon: 21.01, source: 'geocoded' })
    tree = setPlace(tree, 'warszawa', undefined)
    expect(tree.places).toEqual({})
    expect(() => setPlace(tree, 'X', { lat: 91, lon: 0, source: 'manual' })).toThrow(RangeError)
  })

  it('merges spellings into one place everywhere, keeping coordinates', () => {
    let tree = setPlace(withPlaces(), 'Cracow', { lat: 50, lon: 20, source: 'manual' })
    tree = mergePlaces(tree, ['Cracow', 'krakow'], 'Kraków')
    const places = listPlaces(tree)
    expect(places.map((p) => [p.name, p.count])).toEqual([
      ['Kraków', 6],
      ['Warszawa', 1]
    ])
    expect(tree.persons.ewa!.birth!.place).toBe('Kraków')
    expect(Object.values(tree.media)[0]!.place).toBe('Kraków')
    expect(tree.places).toEqual({ krakow: { lat: 50, lon: 20, source: 'manual' } })
    // Untouched facts keep their objects.
    const before = withPlaces()
    const after = mergePlaces(before, ['Cracow'], 'Kraków')
    expect(after.persons.jan!.death).toBe(before.persons.jan!.death)
  })

  it('re-keys gazetteer entries written with other spellings', () => {
    const tree = {
      ...withPlaces(),
      places: { 'Kraków ': { lat: 1, lon: 2, source: 'manual' as const } }
    }
    expect(normalizePlaceKeys(tree).places).toEqual({
      krakow: { lat: 1, lon: 2, source: 'manual' }
    })
    const clean = normalizePlaceKeys(tree)
    expect(normalizePlaceKeys(clean)).toBe(clean)
  })
})
