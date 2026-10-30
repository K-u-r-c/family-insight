import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { displayName } from '../../model/tree'
import type { FamilyTree, Person } from '../../model/types'
import { formatGedcomDate, parseGedcomDate } from './dates'
import { decodeGedcom } from './encoding'
import { attachMedia, importGedcom } from './import'
import { parseGedcom } from './parser'

const fixture = (name: string): ReturnType<typeof importGedcom> => {
  const { text } = decodeGedcom(new Uint8Array(readFileSync(join(__dirname, 'fixtures', name))))
  return importGedcom(parseGedcom(text))
}
const byName = (tree: FamilyTree, name: string): Person =>
  Object.values(tree.persons).find((p) => displayName(p) === name)!
const links = (tree: FamilyTree) => Object.values(tree.relationships)

describe('GEDCOM dates', () => {
  it.each([
    ['4 NOV 1925', { date: { value: '1925-11-04', qualifier: 'exact' } }],
    ['NOV 1925', { date: { value: '1925-11', qualifier: 'exact' } }],
    ['1925', { date: { value: '1925', qualifier: 'exact' } }],
    ['ABT 1890', { date: { value: '1890', qualifier: 'about' } }],
    ['CAL 1890', { date: { value: '1890', qualifier: 'about' } }],
    ['EST 1890', { date: { value: '1890', qualifier: 'about' } }],
    ['BEF 12 MAR 1890', { date: { value: '1890-03-12', qualifier: 'before' } }],
    ['AFT 1890', { date: { value: '1890', qualifier: 'after' } }],
    [
      'FROM 1914 TO 1918',
      {
        date: { value: '1914', qualifier: 'exact' },
        endDate: { value: '1918', qualifier: 'exact' }
      }
    ],
    [
      'BET 1927 AND 1929',
      {
        date: { value: '1927', qualifier: 'after' },
        endDate: { value: '1929', qualifier: 'before' }
      }
    ]
  ])('%s', (text, expected) => {
    expect(parseGedcomDate(text)).toMatchObject({ ...expected, original: text })
    expect(parseGedcomDate(text)!.lossy).toBeFalsy()
  })

  it.each([
    ['1700/01', '1700'],
    ['@#DJULIAN@ 12 MAR 1702', '1702-03-12'],
    ['INT 1919 (around Easter)', '1919'],
    ['FROM 1914', '1914']
  ])('%s is approximated and reported as lossy', (text, value) => {
    expect(parseGedcomDate(text)).toMatchObject({ date: { value }, lossy: true })
  })

  it('keeps phrases and nonsense as lossy without a date', () => {
    expect(parseGedcomDate('(zimą 1760)')).toEqual({ original: '(zimą 1760)', lossy: true })
    expect(parseGedcomDate('32 NOV 1900')).toMatchObject({ lossy: true })
    expect(parseGedcomDate('soon')).toMatchObject({ lossy: true })
    expect(parseGedcomDate('')).toBeNull()
  })

  it('formats fuzzy dates with English months', () => {
    expect(formatGedcomDate({ value: '1925-11-04', qualifier: 'exact' })).toBe('4 NOV 1925')
    expect(formatGedcomDate({ value: '1890', qualifier: 'about' })).toBe('ABT 1890')
    expect(formatGedcomDate({ value: '1890-03', qualifier: 'before' })).toBe('BEF MAR 1890')
  })
})

describe('GEDCOM import', () => {
  it('Gramps: names, events, places with coordinates, citations, notes, pedigree', () => {
    const { tree, summary, warnings } = fixture('gramps.ged')
    expect(summary).toMatchObject({
      people: 4,
      families: 1,
      sources: 1,
      program: 'Gramps',
      version: '5.5.1'
    })
    const jan = byName(tree, 'Jan Kowalski')
    expect(jan.sex).toBe('male')
    expect(jan.birth).toMatchObject({
      date: { value: '1925-11-04', qualifier: 'exact' },
      place: 'Łódź, łódzkie, Polska'
    })
    expect(jan.birth!.citations![0]).toMatchObject({
      page: 'akt 345',
      quality: 'primary',
      text: 'Jan, syn Józefa i Marii z Nowaków'
    })
    expect(tree.sources[jan.birth!.citations![0]!.sourceId]).toMatchObject({
      title: 'Księga urodzeń parafii św. Józefa',
      author: 'Parafia św. Józefa',
      callNumber: '1234/56'
    })
    expect(Object.values(tree.repositories)[0]).toMatchObject({
      name: 'Archiwum Państwowe w Łodzi'
    })
    expect(jan.events.map((e) => [e.type, e.description, e.date?.value, e.endDate?.value])).toEqual(
      [
        ['occupation', 'inżynier', '1950', '1985'],
        ['residence', undefined, '1960', undefined]
      ]
    )
    expect(jan.notes).toBe('Inżynier, budował mosty.\nLubił wędkować.')
    expect(tree.places['lodz, lodzkie, polska']).toEqual({
      lat: 51.7592,
      lon: 19.456,
      source: 'manual'
    })
    // Married name becomes the surname, the birth name the birth surname.
    expect(byName(tree, 'Anna Kowalska')).toMatchObject({ birthSurname: 'Nowak' })
    expect(byName(tree, 'Anna Kowalska').birth!.date).toEqual({ value: '1927', qualifier: 'after' })
    expect(byName(tree, 'Zofia Kowalska').living).toBe(false)
    const kinds = links(tree)
      .filter((r) => r.type === 'parent-child')
      .map((r) => r.type === 'parent-child' && [displayName(tree.persons[r.childId]!), r.kind])
    expect(kinds).toContainEqual(['Zofia Kowalska', 'adoptive'])
    expect(kinds).toContainEqual(['Piotr Kowalski', 'biological'])
    const marriage = links(tree).find((r) => r.type === 'partnership')!
    expect(marriage).toMatchObject({ kind: 'marriage', start: { date: { value: '1950-06-10' } } })
    expect(summary.unsupported).toEqual({})
    expect(warnings).toEqual([])
  })

  it('Ancestry: _FREL/_MREL pedigree, divorce, vendor tags counted', () => {
    const { tree, summary } = fixture('ancestry.ged')
    expect(summary).toMatchObject({ people: 5, families: 2 })
    const emma = byName(tree, 'Emma Schröder')
    const kinds = links(tree)
      .filter((r) => r.type === 'parent-child' && r.childId === emma.id)
      .map((r) => r.type === 'parent-child' && r.kind)
    expect(kinds.sort()).toEqual(['biological', 'step'])
    const divorced = links(tree).find(
      (r) => r.type === 'partnership' && r.partnerIds.includes(byName(tree, 'Gertrud Weber').id)
    )!
    expect(divorced).toMatchObject({ end: { reason: 'divorce', date: { value: '1920' } } })
    expect(byName(tree, 'Margarete Müller').events[0]).toMatchObject({
      type: 'immigration',
      place: 'New York, USA'
    })
    expect(summary.unsupported).toEqual({ 'INDI._APID': 1, 'FAM._MSTAT': 1 })
  })

  it('MyHeritage: EVEN types, _MARNM, media references, date phrases in notes', () => {
    const { tree, media, warnings } = fixture('myheritage.ged')
    const wojciech = byName(tree, 'Wojciech Nowicki')
    expect(wojciech.events).toMatchObject([
      { type: 'military-service', description: '1914-1918', place: 'Galicja' },
      { type: 'custom', customType: 'Pielgrzymka', date: { value: '1933' } }
    ])
    expect(byName(tree, 'Helena Nowicka')).toMatchObject({ birthSurname: 'Wiśniewska' })
    expect(media).toEqual([
      expect.objectContaining({
        path: 'photos/wojciech.jpg',
        title: 'Wojciech w mundurze',
        personIds: [wojciech.id]
      })
    ])
    expect(wojciech.notes).toContain('GEDCOM: MARR: INT 1919 (around Easter)')
    expect(warnings.map((w) => w.code)).toContain('gedcom-lossy-date')
  })

  it('attaches loaded media files and reports missing ones', () => {
    const result = fixture('myheritage.ged')
    const hash = 'a'.repeat(64)
    const { tree, missing } = attachMedia(
      result,
      new Map([
        [
          'photos/wojciech.jpg',
          { hash, mime: 'image/jpeg' as const, size: 10, fileName: 'wojciech.jpg' }
        ]
      ])
    )
    const wojciech = byName(tree, 'Wojciech Nowicki')
    expect(tree.media[wojciech.mediaIds![0]!]).toMatchObject({ hash, title: 'Wojciech w mundurze' })
    expect(missing).toEqual([])
    expect(attachMedia(result, new Map()).missing).toEqual(['photos/wojciech.jpg'])
  })

  it('FamilySearch 5.5: Julian dates and phrases noted, dangling references warned', () => {
    const { tree, warnings, summary } = fixture('familysearch.ged')
    const jozef = byName(tree, 'Józef Kowalski')
    expect(jozef.birth!.date).toEqual({ value: '1702-03-12', qualifier: 'exact' })
    expect(jozef.events.map((e) => e.type)).toEqual(['christening', 'burial'])
    expect(jozef.notes).toContain('BIRT: @#DJULIAN@ 12 MAR 1702')
    expect(jozef.notes).toContain('BURI: (zimą 1760)')
    expect(
      warnings.filter((w) => w.code === 'gedcom-dangling-reference').map((w) => w.params?.xref)
    ).toEqual(['@P404@'])
    expect(summary).toMatchObject({ version: '5.5', unsupported: { 'INDI._FSFTID': 1 } })
  })

  it('GEDCOM 7: name types, shared notes, PEDI, MAP, extension tags', () => {
    const { tree, summary } = fixture('gedcom7.ged')
    const maria = byName(tree, 'Maria Nowak')
    expect(maria).toMatchObject({ birthSurname: 'Kowalska', notes: 'Wspólna notatka z @@ znakiem' })
    const pc = links(tree).find((r) => r.type === 'parent-child')!
    expect(pc).toMatchObject({ kind: 'foster' })
    expect(tree.places.wieliczka).toMatchObject({ lat: 49.987, lon: 20.0647 })
    expect(summary).toMatchObject({ version: '7.0', unsupported: { 'INDI._MYTAG': 1 } })
  })

  it('Legacy-style ANSEL file with Polish letters', () => {
    const enc = (s: string) => [...s].map((c) => c.charCodeAt(0))
    const bytes = Uint8Array.from([
      ...enc('0 HEAD\n1 SOUR Legacy\n1 GEDC\n2 VERS 5.5\n1 CHAR ANSEL\n0 @I1@ INDI\n1 NAME Ma'),
      0xb1, // ł
      ...enc('gorzata /Wo'),
      0xe2,
      0x7a, // ź
      ...enc('niak/\n1 BIRT\n2 PLAC '),
      0xa1, // Ł
      0xe2,
      0x6f, // ó
      ...enc('d'),
      0xe2,
      0x7a, // ź
      ...enc('\n0 TRLR\n')
    ])
    const { text, detected } = decodeGedcom(bytes)
    expect(detected.encoding).toBe('ansel')
    const { tree } = importGedcom(parseGedcom(text))
    expect(byName(tree, 'Małgorzata Woźniak').birth!.place).toBe('Łódź')
  })

  it('never fails on broken structures: cycles and too many parents become warnings', () => {
    const text = `0 HEAD\n1 GEDC\n2 VERS 5.5.1\n0 @A@ INDI\n1 NAME A /X/\n0 @B@ INDI\n1 NAME B /X/\n0 @C@ INDI\n1 NAME C /X/\n0 @D@ INDI\n1 NAME D /X/\n0 @E@ INDI\n1 NAME E /X/\n0 @F1@ FAM\n1 HUSB @A@\n1 CHIL @B@\n0 @F2@ FAM\n1 HUSB @B@\n1 CHIL @A@\n0 @F3@ FAM\n1 HUSB @C@\n1 WIFE @D@\n1 CHIL @E@\n0 @F4@ FAM\n1 HUSB @A@\n1 WIFE @B@\n1 CHIL @E@\n0 TRLR\n`
    const { tree, warnings } = importGedcom(parseGedcom(text))
    expect(warnings.map((w) => w.code)).toEqual(
      expect.arrayContaining(['gedcom-ancestry-cycle', 'gedcom-extra-parents'])
    )
    const e = byName(tree, 'E X')
    const kinds = links(tree)
      .filter((r) => r.type === 'parent-child' && r.childId === e.id)
      .map((r) => r.type === 'parent-child' && r.kind)
    expect(kinds.sort()).toEqual(['biological', 'biological', 'step', 'step'])
    // The result is a valid tree.
    expect(Object.keys(tree.persons)).toHaveLength(5)
  })
})
