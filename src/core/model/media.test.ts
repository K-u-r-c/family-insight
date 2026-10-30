import { describe, expect, it } from 'vitest'
import { remarriageFixture } from '../test/fixtures'
import {
  addMedia,
  addPersonMedia,
  movePersonMedia,
  peopleOfMedia,
  removePersonMedia,
  setMediaPeople,
  mediaEntryName,
  mediaUsage,
  portraitOf,
  referencedHashes,
  removeMedia,
  repairMediaReferences,
  setPortrait,
  sniffMime,
  updateMedia
} from './media'
import { updatePerson } from './operations'
import { addCitation, addSource, getCitations, updateSource } from './sources'
import type { FamilyTree } from './types'

const bytes = (...values: (number | string)[]): Uint8Array =>
  Uint8Array.from(
    values.flatMap((v) => (typeof v === 'string' ? [...v].map((c) => c.charCodeAt(0)) : [v]))
  )

function withScan(): FamilyTree {
  const tree = addMedia(
    remarriageFixture(),
    { hash: 'd'.repeat(64), mime: 'image/jpeg', fileName: 'scan.jpg' },
    { id: 'scan' }
  ).tree
  return addMedia(
    tree,
    { hash: 'e'.repeat(64), mime: 'application/pdf', fileName: 'akt.pdf' },
    { id: 'akt' }
  ).tree
}

describe('media library', () => {
  it('detects file types by content, not by name', () => {
    expect(sniffMime(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
    expect(sniffMime(bytes(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe('image/png')
    expect(sniffMime(bytes('GIF89a'))).toBe('image/gif')
    expect(sniffMime(bytes('RIFF', 0, 0, 0, 0, 'WEBPVP8 '))).toBe('image/webp')
    expect(sniffMime(bytes('RIFF', 0, 0, 0, 0, 'WAVEfmt '))).toBeNull()
    expect(sniffMime(bytes('%PDF-1.7'))).toBe('application/pdf')
    expect(sniffMime(bytes('<svg xmlns='))).toBeNull()
    expect(sniffMime(bytes())).toBeNull()
  })

  it('names container entries by hash and type', () => {
    expect(mediaEntryName('a'.repeat(64), 'image/jpeg')).toBe(`media/${'a'.repeat(64)}.jpg`)
    expect(mediaEntryName('a'.repeat(64), 'application/pdf')).toMatch(/\.pdf$/)
  })

  it('adds and updates items; hash and type never change', () => {
    let tree = withScan()
    expect(tree.media.scan).toMatchObject({ fileName: 'scan.jpg', mime: 'image/jpeg' })
    tree = updateMedia(tree, 'scan', {
      title: 'Wedding',
      date: { value: '1921', qualifier: 'about' },
      hash: 'f'.repeat(64),
      mime: 'image/png'
    } as never)
    expect(tree.media.scan).toMatchObject({ title: 'Wedding', hash: 'd'.repeat(64) })
    expect(tree.media.scan!.mime).toBe('image/jpeg')
    expect(() => addMedia(tree, tree.media.scan!, { id: 'scan' })).toThrow('duplicate-id')
    expect(() => updateMedia(tree, 'nope', {})).toThrow('media-not-found')
  })

  it('sets and clears portraits', () => {
    let tree = setPortrait(withScan(), 'jan', 'scan')
    expect(portraitOf(tree, tree.persons.jan!)?.fileName).toBe('scan.jpg')
    tree = setPortrait(tree, 'jan', undefined)
    expect(tree.persons.jan).not.toHaveProperty('portraitMediaId')
    expect(() => setPortrait(tree, 'jan', 'nope')).toThrow('media-not-found')
    expect(() => setPortrait(tree, 'nobody', 'scan')).toThrow('person-not-found')
  })

  it('removing an item unlinks it everywhere', () => {
    let tree = setPortrait(withScan(), 'jan', 'scan')
    tree = updatePerson(tree, 'anna', { mediaIds: ['scan', 'akt'] })
    const { tree: withSource, source } = addSource(tree, { title: 'Register' })
    tree = updateSource(withSource, source.id, { mediaIds: ['scan'] })
    tree = addCitation(
      tree,
      { kind: 'birth', personId: 'ewa' },
      {
        sourceId: source.id,
        mediaIds: ['scan']
      }
    ).tree
    expect(mediaUsage(tree, 'scan')).toBe(4)
    expect(mediaUsage(tree, 'akt')).toBe(1)

    tree = removeMedia(tree, 'scan')
    expect(tree.media.scan).toBeUndefined()
    expect(tree.persons.jan).not.toHaveProperty('portraitMediaId')
    expect(tree.persons.anna!.mediaIds).toEqual(['akt'])
    expect(tree.sources[source.id]).not.toHaveProperty('mediaIds')
    expect(getCitations(tree, { kind: 'birth', personId: 'ewa' })[0]).not.toHaveProperty('mediaIds')
    expect(mediaUsage(tree, 'akt')).toBe(1)
    expect(() => removeMedia(tree, 'scan')).toThrow('media-not-found')
  })

  it('lists the hashes a save must keep', () => {
    const tree = withScan()
    expect(referencedHashes(tree)).toEqual(new Set(['d'.repeat(64), 'e'.repeat(64)]))
  })

  it('repairs references to missing items', () => {
    let tree = withScan()
    tree = updatePerson(tree, 'jan', { mediaIds: ['scan', 'ghost'], portraitMediaId: 'ghost' })
    const { tree: fixed, removed } = repairMediaReferences(tree)
    expect(removed).toBe(1)
    expect(fixed.persons.jan!.mediaIds).toEqual(['scan'])
    expect(fixed.persons.jan).not.toHaveProperty('portraitMediaId')
    expect(repairMediaReferences(fixed).removed).toBe(0)
  })
})

describe('person galleries', () => {
  it('adds, reorders and removes gallery items', () => {
    let tree = addPersonMedia(withScan(), 'jan', ['scan', 'akt'])
    expect(tree.persons.jan!.mediaIds).toEqual(['scan', 'akt'])
    tree = addPersonMedia(tree, 'jan', ['akt'])
    expect(tree.persons.jan!.mediaIds).toEqual(['scan', 'akt'])
    tree = movePersonMedia(tree, 'jan', 'akt', 0)
    expect(tree.persons.jan!.mediaIds).toEqual(['akt', 'scan'])
    expect(movePersonMedia(tree, 'jan', 'akt', -5)).toBe(tree)
    tree = removePersonMedia(tree, 'jan', 'akt')
    expect(tree.persons.jan!.mediaIds).toEqual(['scan'])
    expect(tree.media.akt).toBeDefined()
    tree = removePersonMedia(tree, 'jan', 'scan')
    expect(tree.persons.jan).not.toHaveProperty('mediaIds')
    expect(() => addPersonMedia(tree, 'jan', ['nope'])).toThrow('media-not-found')
    expect(() => movePersonMedia(tree, 'jan', 'scan', 1)).toThrow('media-not-found')
  })

  it('links one item to several people', () => {
    let tree = addPersonMedia(withScan(), 'jan', ['akt', 'scan'])
    tree = setMediaPeople(tree, 'scan', ['jan', 'anna', 'ewa'])
    expect(peopleOfMedia(tree, 'scan').map((p) => p.id)).toEqual(['jan', 'anna', 'ewa'])
    expect(tree.persons.jan!.mediaIds).toEqual(['akt', 'scan'])
    tree = setMediaPeople(tree, 'scan', ['anna'])
    expect(peopleOfMedia(tree, 'scan').map((p) => p.id)).toEqual(['anna'])
    expect(tree.persons.jan!.mediaIds).toEqual(['akt'])
    expect(() => setMediaPeople(tree, 'scan', ['ghost'])).toThrow('person-not-found')
  })
})
