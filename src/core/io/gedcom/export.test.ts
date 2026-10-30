import { describe, expect, it } from 'vitest'
import { importCsv } from '../csv/import'
import { addMedia, addPersonMedia, setPortrait } from '../../model/media'
import {
  addPersonEvent,
  addParentChild,
  addPartnership,
  addPerson,
  updatePerson
} from '../../model/operations'
import { setPlace } from '../../model/places'
import { addCitation, addRepository, addSource } from '../../model/sources'
import { displayName } from '../../model/tree'
import type { FamilyTree, Relationship } from '../../model/types'
import { exportGedcom } from './export'
import { attachMedia, importGedcom, type LoadedMedia } from './import'
import { parseGedcom } from './parser'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const d = (value: string, qualifier: 'exact' | 'about' | 'before' | 'after' = 'exact') => ({
  value,
  qualifier
})

/** The sample family plus everything else GEDCOM can carry. */
function richTree(): FamilyTree {
  const csv = readFileSync(join(__dirname, '../../../../resources/samples/example-pl.csv'), 'utf8')
  let tree = importCsv(csv, { name: 'Kowalscy' }).tree
  const find = (name: string) => Object.values(tree.persons).find((p) => displayName(p) === name)!
  const jan = find('Jan Kowalski')
  const anna = find('Anna Kowalska')
  tree = addPersonEvent(tree, jan.id, {
    type: 'military-service',
    date: d('1944'),
    endDate: d('1945'),
    description: '1 Armia Wojska Polskiego',
    place: 'Warszawa'
  }).tree
  tree = addPersonEvent(tree, jan.id, {
    type: 'occupation',
    description: 'inżynier',
    date: d('1950', 'about')
  }).tree
  tree = addPersonEvent(tree, jan.id, {
    type: 'baptism',
    date: d('1925-11-22'),
    place: 'Łódź',
    description: 'chrzest z wody'
  }).tree
  tree = addPersonEvent(tree, anna.id, {
    type: 'custom',
    customType: 'Pielgrzymka',
    date: d('1957'),
    place: 'Częstochowa',
    notes: 'Z całą parafią'
  }).tree
  tree = addRepository(
    tree,
    {
      name: 'Archiwum Państwowe w Łodzi',
      address: 'ul. Wólczańska 82',
      url: 'https://lodz.ap.gov.pl'
    },
    { id: 'r1' }
  ).tree
  tree = addSource(
    tree,
    {
      title: 'Księga urodzeń 1925',
      author: 'Parafia św. Józefa',
      publication: 'tom 3',
      repositoryId: 'r1',
      callNumber: '1234/56'
    },
    { id: 's1' }
  ).tree
  tree = addCitation(
    tree,
    { kind: 'birth', personId: jan.id },
    {
      sourceId: 's1',
      page: 'akt 345',
      quality: 'primary',
      text: 'Jan, syn Józefa',
      date: d('1925-11-05'),
      notes: 'Czytelne'
    }
  ).tree
  tree = addCitation(
    tree,
    { kind: 'person', personId: anna.id },
    { sourceId: 's1', quality: 'questionable' }
  ).tree
  tree = setPlace(tree, 'Łódź', { lat: 51.7592, lon: 19.456, source: 'manual' })
  tree = setPlace(tree, 'Warszawa', { lat: 52.2297, lon: -21.0118, source: 'manual' })
  tree = addMedia(
    tree,
    {
      hash: 'a'.repeat(64),
      mime: 'image/jpeg',
      fileName: 'slub.jpg',
      title: 'Ślub',
      description: 'Przed kościołem'
    },
    { id: 'm1' }
  ).tree
  tree = addMedia(
    tree,
    { hash: 'b'.repeat(64), mime: 'image/webp', fileName: 'portrait.webp' },
    { id: 'm2' }
  ).tree
  tree = addPersonMedia(tree, jan.id, ['m1'])
  tree = addPersonMedia(tree, anna.id, ['m1'])
  tree = setPortrait(tree, jan.id, 'm2')
  // A step-parent and an adoptive child, a partnership that ended in separation.
  const step = addPerson(tree, { givenNames: 'Karol', surname: 'Zieliński', sex: 'male' })
  tree = step.tree
  const zofia = find('Zofia Kowalska')
  tree = addPartnership(tree, step.person.id, anna.id, {
    kind: 'partnership',
    start: { date: d('2005') },
    end: { date: d('2010'), reason: 'separation' }
  }).tree
  tree = addParentChild(tree, step.person.id, zofia.id, 'step').tree
  const adopted = addPerson(tree, {
    givenNames: 'Hanna',
    surname: 'Kowalska',
    sex: 'female',
    birth: { date: d('1960', 'before') }
  })
  tree = adopted.tree
  tree = addParentChild(tree, jan.id, adopted.person.id, 'adoptive').tree
  tree = addParentChild(tree, anna.id, adopted.person.id, 'adoptive').tree
  tree = updatePerson(tree, find('Józef Kowalski').id, {
    notes: 'Linia 1\nLinia 2 – „cudzysłów” i @ znak'
  })
  return tree
}

/** Everything comparable of a tree, keyed by names instead of ids. */
function canonical(tree: FamilyTree) {
  const name = (id: string) => displayName(tree.persons[id]!)
  const stripIds = <T>(value: T): T =>
    value === undefined
      ? value
      : JSON.parse(
          JSON.stringify(value, (k, v) => (k === 'id' || k === 'sourceId' ? undefined : v))
        )
  const media = (id: string) => {
    const m = tree.media[id]!
    return { hash: m.hash, title: m.title, description: m.description }
  }
  const persons = Object.values(tree.persons)
    .map((p) => ({
      name: displayName(p),
      birthSurname: p.birthSurname,
      sex: p.sex,
      birth: stripIds(p.birth),
      death: stripIds(p.death),
      living: p.living,
      notes: p.notes,
      events: stripIds(p.events),
      citations: stripIds(p.citations),
      media: (p.mediaIds ?? []).map(media),
      portrait: p.portraitMediaId ? media(p.portraitMediaId).hash : undefined
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const rel = (r: Relationship) =>
    r.type === 'parent-child'
      ? `${name(r.parentId)} → ${name(r.childId)} (${r.kind})`
      : `${[name(r.partnerIds[0]), name(r.partnerIds[1])].sort().join(' + ')} ${r.kind} ${JSON.stringify(stripIds({ start: r.start, end: r.end }))}`
  return {
    persons,
    relationships: Object.values(tree.relationships).map(rel).sort(),
    sources: Object.values(tree.sources)
      .map((s) => ({ ...stripIds(s), repositoryId: undefined, mediaIds: undefined }))
      .sort((a, b) => a.title.localeCompare(b.title)),
    repositories: Object.values(tree.repositories).map(stripIds),
    places: tree.places
  }
}

function roundTrip(tree: FamilyTree, version: '5.5.1' | '7.0'): FamilyTree {
  const { text, media } = exportGedcom(tree, { version, date: new Date('2026-10-30') })
  const result = importGedcom(parseGedcom(text))
  const loaded = new Map<string, LoadedMedia>(
    media.map((f) => [
      f.path,
      { hash: f.hash, mime: f.item.mime, size: 1, fileName: f.item.fileName }
    ])
  )
  return attachMedia(result, loaded).tree
}

/**
 * Fields GEDCOM can't carry (documented in the developer reference): a source's URL becomes a
 * note line; "living" (GEDCOM only records death) becomes unknown.
 */
function withoutKnownLosses(tree: FamilyTree): FamilyTree {
  const persons = Object.fromEntries(
    Object.entries(tree.persons).map(([id, p]) => {
      if (p.living !== true) return [id, p]
      const { living: _living, ...rest } = p
      return [id, rest]
    })
  )
  const sources = Object.fromEntries(
    Object.entries(tree.sources).map(([id, s]) => {
      const { url, ...rest } = s
      return [
        id,
        url ? { ...rest, notes: [s.notes, `URL: ${url}`].filter(Boolean).join('\n\n') } : rest
      ]
    })
  )
  return { ...tree, persons, sources }
}

describe('GEDCOM export', () => {
  for (const version of ['5.5.1', '7.0'] as const) {
    it(`round-trips the sample tree through GEDCOM ${version}`, () => {
      const tree = richTree()
      expect(canonical(roundTrip(tree, version))).toEqual(canonical(withoutKnownLosses(tree)))
    })
  }

  it('writes a valid header, stable cross-references and English month names', () => {
    const tree = richTree()
    const a = exportGedcom(tree, { date: new Date('2026-10-30') }).text
    const b = exportGedcom(tree, { date: new Date('2026-10-30') }).text
    expect(a).toBe(b)
    expect(
      a.startsWith('0 HEAD\n1 GEDC\n2 VERS 5.5.1\n2 FORM LINEAGE-LINKED\n1 SOUR FAMILY_INSIGHT\n')
    ).toBe(true)
    expect(a).toContain('1 CHAR UTF-8')
    expect(a).toContain('0 @I1@ INDI')
    expect(a).toContain('2 DATE 4 NOV 1925')
    expect(a).toContain('2 DATE FROM 1944 TO 1945')
    expect(a).toContain('4 LONG W21.0118')
    expect(a.trimEnd().endsWith('0 TRLR')).toBe(true)
    const v7 = exportGedcom(tree, { version: '7.0' }).text
    expect(v7).not.toContain('CHAR')
    expect(v7).not.toContain('CONC')
    expect(v7).toContain('2 FORM image/jpeg')
  })

  it('privatises living people on request', () => {
    const tree = richTree()
    const { text } = exportGedcom(tree, { privatizeLiving: true, livingName: 'Żyjący' })
    expect(text).toContain('1 NAME Żyjący //')
    expect(text).not.toContain('Lena') // born 2021
    expect(text).toContain('Jan /Kowalski/') // died 2001
  })

  it('round-trips a large random tree', () => {
    let tree: FamilyTree = importCsv('id;imiona;nazwisko\n', { name: 'Big' }).tree
    const ids: string[] = []
    let seed = 7
    const rnd = (n: number) => {
      seed = (seed * 1103515245 + 12345) >>> 0
      return seed % n
    }
    for (let i = 0; i < 400; i++) {
      const added = addPerson(tree, {
        givenNames: `Imię${i}`,
        surname: `Nazwisko${i % 37}`,
        sex: i % 2 ? 'female' : 'male',
        birth: {
          date: d(
            String(1800 + rnd(200)),
            (['exact', 'about', 'before', 'after'] as const)[rnd(4)]
          ),
          place: `Miasto ${rnd(20)}`
        }
      })
      tree = added.tree
      ids.push(added.person.id)
      if (i > 2 && rnd(3)) {
        const parent = ids[rnd(i)]!
        try {
          tree = addParentChild(tree, parent, added.person.id).tree
        } catch {
          // cycles and third parents are refused; skip
        }
      }
    }
    for (const version of ['5.5.1', '7.0'] as const) {
      expect(canonical(roundTrip(tree, version))).toEqual(canonical(tree))
    }
  })
})
