import type { Issue } from '../../issues'
import { newId } from '../../model/ids'
import { placeKey } from '../../model/places'
import { createEmptyTree, displayName } from '../../model/tree'
import {
  CITATION_QUALITIES,
  type Citation,
  type EventType,
  type FamilyTree,
  type LifeEvent,
  type MediaItem,
  type MediaMime,
  type ParentChildKind,
  type PartnershipRelationship,
  type Person,
  type PersonEvent,
  type Relationship,
  type Repository,
  type Sex,
  type Source
} from '../../model/types'
import { validateTree } from '../../model/validate'
import { parseGedcomDate, type GedcomDate } from './dates'
import { child, children, value, type GedcomDocument, type GedcomNode } from './parser'

/**
 * GEDCOM records → a family tree. Everything Family Insight can represent is kept; anything it
 * can't is counted (unsupported tags, grouped) or noted (lossy dates go into notes), never fatal.
 * Media files are returned as references for the caller to load (they live next to the file).
 */

/** Individual events and attributes that become life events. */
const EVENT_TAGS: Record<string, EventType> = {
  BAPM: 'baptism',
  CHR: 'christening',
  CONF: 'confirmation',
  FCOM: 'first-communion',
  BURI: 'burial',
  CREM: 'cremation',
  EMIG: 'emigration',
  IMMI: 'immigration',
  NATU: 'naturalization',
  RESI: 'residence',
  OCCU: 'occupation',
  EDUC: 'education',
  GRAD: 'graduation',
  RELI: 'religion',
  CENS: 'census',
  RETI: 'retirement',
  _MILT: 'military-service',
  _MILI: 'military-service',
  _MIL: 'military-service'
}

/** `EVEN`/`FACT` types that match a built-in event. */
const EVENT_TYPE_NAMES: Record<string, EventType> = {
  military: 'military-service',
  'military service': 'military-service',
  'służba wojskowa': 'military-service',
  award: 'award',
  medal: 'award'
}

/** Tags handled by the importer; anything else is reported as unsupported. */
const KNOWN_INDI = new Set([
  'NAME',
  'SEX',
  'BIRT',
  'DEAT',
  'FAMC',
  'FAMS',
  'NOTE',
  'SNOTE',
  'SOUR',
  'OBJE',
  'EVEN',
  'FACT',
  'CHAN',
  'RIN',
  'RFN',
  'AFN',
  'REFN',
  'UID',
  '_UID',
  'SUBM',
  'EXID',
  ...Object.keys(EVENT_TAGS)
])
const KNOWN_FAM = new Set([
  'EVEN',
  'HUSB',
  'WIFE',
  'CHIL',
  'MARR',
  'ENGA',
  'DIV',
  'ANUL',
  'NOTE',
  'SNOTE',
  'SOUR',
  'OBJE',
  'CHAN',
  'RIN',
  'REFN',
  'UID',
  '_UID',
  'NCHI',
  'EXID',
  'SUBM'
])
const KNOWN_RECORDS = new Set([
  'HEAD',
  'TRLR',
  'INDI',
  'FAM',
  'SOUR',
  'REPO',
  'OBJE',
  'NOTE',
  'SNOTE',
  'SUBM',
  'SUBN'
])

export interface MediaReference {
  /** Key to match the loaded file with (the file path as written in the GEDCOM). */
  path: string
  title?: string
  description?: string
  /** Media item id in the imported tree, once the file is loaded (`attachMedia`). */
  mediaId: string
  personIds: string[]
  sourceIds: string[]
  /** People whose portrait this is (`OBJE` with `_PRIM Y`). */
  portraitOf: string[]
}

export interface GedcomImportSummary {
  people: number
  families: number
  events: number
  sources: number
  media: number
  /** Program that wrote the file (`HEAD.SOUR`), e.g. `GRAMPS`. */
  program?: string
  version?: string
  /** Unsupported tags and how often they occurred, e.g. `{ "INDI._FSFTID": 12 }`. */
  unsupported: Record<string, number>
}

export interface GedcomImportResult {
  tree: FamilyTree
  media: MediaReference[]
  summary: GedcomImportSummary
  warnings: Issue[]
}

const QUAY: Record<string, Citation['quality']> = {
  '0': 'unreliable',
  '1': 'questionable',
  '2': 'secondary',
  '3': 'primary'
}

function parseCoordinate(raw: string | undefined, negative: 'S' | 'W'): number | undefined {
  if (!raw) return undefined
  const m = /^\s*([NSEW])?\s*(-?\d+(?:\.\d+)?)\s*$/i.exec(raw)
  if (!m) return undefined
  const sign = m[1]?.toUpperCase() === negative ? -1 : 1
  return Number(m[2]) * sign
}

export function importGedcom(
  doc: GedcomDocument,
  options: { name?: string } = {}
): GedcomImportResult {
  const warnings: Issue[] = []
  const unsupported: Record<string, number> = {}
  const tree = createEmptyTree(options.name ?? 'GEDCOM')
  const head = doc.records.find((r) => r.tag === 'HEAD')
  const byXref = new Map<string, GedcomNode>()
  for (const r of doc.records) if (r.xref) byXref.set(r.xref, r)
  const ids = new Map<string, string>() // GEDCOM xref → our id
  const idOf = (xref: string): string => {
    let id = ids.get(xref)
    if (!id) ids.set(xref, (id = newId()))
    return id
  }
  const warn = (code: string, line: number, params: Record<string, string | number> = {}): void => {
    warnings.push({ severity: 'warning', code, params, row: line })
  }
  const unsupportedTag = (path: string): void => {
    unsupported[path] = (unsupported[path] ?? 0) + 1
  }
  let eventCount = 0
  const media: MediaReference[] = []
  const mediaByKey = new Map<string, MediaReference>()

  // Notes: inline text, pointers to NOTE records (5.5) or shared notes (SNOTE, 7.0).
  const noteText = (n: GedcomNode): string => {
    const v = n.value ?? ''
    if (/^@[^@]+@$/.test(v)) {
      const rec = byXref.get(v)
      if (!rec) {
        warn('gedcom-dangling-reference', n.line, { xref: v })
        return ''
      }
      return rec.value ?? ''
    }
    return v
  }
  const notesOf = (n: GedcomNode): string[] =>
    [...children(n, 'NOTE'), ...children(n, 'SNOTE')].map(noteText).filter((t) => t.trim())

  // Repositories and sources first, so citations can point to them.
  for (const rec of doc.records.filter((r) => r.tag === 'REPO' && r.xref)) {
    const repo: Repository = { id: idOf(rec.xref!), name: value(rec, 'NAME')?.trim() || '?' }
    const addr = value(rec, 'ADDR')
    if (addr) repo.address = addr
    const url = value(rec, 'WWW') ?? value(rec, 'URL')
    if (url) repo.url = url
    const notes = notesOf(rec)
    if (notes.length) repo.notes = notes.join('\n\n')
    tree.repositories[repo.id] = repo
  }
  const sourceFrom = (rec: GedcomNode, id: string): Source => {
    const source: Source = {
      id,
      title: (value(rec, 'TITL') ?? value(rec, 'ABBR') ?? '').trim() || '?'
    }
    const author = value(rec, 'AUTH')
    if (author) source.author = author
    const publ = value(rec, 'PUBL')
    if (publ) source.publication = publ
    const repoRef = child(rec, 'REPO')
    if (repoRef?.value && /^@[^@]+@$/.test(repoRef.value)) {
      if (byXref.has(repoRef.value)) source.repositoryId = idOf(repoRef.value)
      else warn('gedcom-dangling-reference', repoRef.line, { xref: repoRef.value })
      const caln = value(repoRef, 'CALN')
      if (caln) source.callNumber = caln
    }
    const notes = [...notesOf(rec), ...(value(rec, 'TEXT') ? [value(rec, 'TEXT')!] : [])]
    if (notes.length) source.notes = notes.join('\n\n')
    return source
  }
  for (const rec of doc.records.filter((r) => r.tag === 'SOUR' && r.xref)) {
    const source = sourceFrom(rec, idOf(rec.xref!))
    tree.sources[source.id] = source
  }

  const citationsOf = (n: GedcomNode): Citation[] =>
    children(n, 'SOUR').flatMap((s): Citation[] => {
      let sourceId: string
      if (s.value && /^@[^@]+@$/.test(s.value)) {
        if (!byXref.has(s.value)) {
          warn('gedcom-dangling-reference', s.line, { xref: s.value })
          return []
        }
        sourceId = idOf(s.value)
      } else {
        // An inline source: its text is the title.
        sourceId = newId()
        tree.sources[sourceId] = { id: sourceId, title: (s.value ?? '').trim() || '?' }
      }
      const citation: Citation = { id: newId(), sourceId }
      const page = value(s, 'PAGE')
      if (page) citation.page = page
      const quay = QUAY[value(s, 'QUAY')?.trim() ?? '']
      if (quay && (CITATION_QUALITIES as readonly string[]).includes(quay)) citation.quality = quay
      const data = child(s, 'DATA')
      const text = value(data, 'TEXT')
      if (text) citation.text = text
      const date = parseGedcomDate(value(data, 'DATE'))?.date
      if (date) citation.date = date
      const notes = notesOf(s)
      if (notes.length) citation.notes = notes.join('\n\n')
      return [citation]
    })

  // Places: coordinates go to the gazetteer.
  const placeOf = (n: GedcomNode | undefined): string | undefined => {
    const plac = child(n, 'PLAC')
    const name = plac?.value?.trim()
    if (!plac || !name) return undefined
    const map = child(plac, 'MAP')
    const lat = parseCoordinate(value(map, 'LATI'), 'S')
    const lon = parseCoordinate(value(map, 'LONG'), 'W')
    if (lat !== undefined && lon !== undefined && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      tree.places[placeKey(name)] ??= { lat, lon, source: 'manual' }
    }
    return name
  }

  const lossyNotes = new Map<string, string[]>()
  const noteLossy = (personId: string, label: string, date: GedcomDate): void => {
    const list = lossyNotes.get(personId) ?? []
    list.push(`${label}: ${date.original}`)
    lossyNotes.set(personId, list)
  }

  const lifeEvent = (
    n: GedcomNode | undefined,
    personId: string | null,
    label: string
  ): LifeEvent | undefined => {
    if (!n) return undefined
    const event: LifeEvent = {}
    const parsed = parseGedcomDate(value(n, 'DATE'))
    if (parsed?.date) event.date = parsed.date
    if (parsed?.lossy && personId) {
      noteLossy(personId, label, parsed)
      warn('gedcom-lossy-date', child(n, 'DATE')!.line, { date: parsed.original })
    }
    const place = placeOf(n)
    if (place) event.place = place
    const citations = citationsOf(n)
    if (citations.length) event.citations = citations
    return event
  }

  // Media objects: records and inline OBJE.
  const mediaRef = (n: GedcomNode): MediaReference | null => {
    let rec = n
    if (n.value && /^@[^@]+@$/.test(n.value)) {
      const target = byXref.get(n.value)
      if (!target) {
        warn('gedcom-dangling-reference', n.line, { xref: n.value })
        return null
      }
      rec = target
    }
    const file = child(rec, 'FILE')
    const path = file?.value?.trim()
    if (!path) return null
    const key = rec.xref ?? path
    let ref = mediaByKey.get(key)
    if (!ref) {
      ref = { path, mediaId: newId(), personIds: [], sourceIds: [], portraitOf: [] }
      const title = value(file, 'TITL') ?? value(rec, 'TITL')
      if (title) ref.title = title
      const notes = notesOf(rec)
      if (notes.length) ref.description = notes.join('\n\n')
      mediaByKey.set(key, ref)
      media.push(ref)
    }
    return ref
  }

  // People.
  const personNodes = doc.records.filter((r) => r.tag === 'INDI' && r.xref)
  for (const rec of personNodes) {
    const id = idOf(rec.xref!)
    const now = new Date().toISOString()
    const names = children(rec, 'NAME')
    const primary =
      names.find((n) => !value(n, 'TYPE') || /birth|aka/i.test(value(n, 'TYPE')!)) ?? names[0]
    const split = (n: GedcomNode | undefined): { given: string; surname: string } => {
      const raw = n?.value ?? ''
      const m = /^([^/]*)\/([^/]*)\/?(.*)$/.exec(raw)
      const given = value(n, 'GIVN') ?? (m ? m[1]! : raw)
      const surname = value(n, 'SURN') ?? (m ? m[2]! : '')
      return { given: given.trim().replace(/\s+/g, ' '), surname: surname.trim() }
    }
    const birthName = split(primary)
    const married = names.find((n) => /married/i.test(value(n, 'TYPE') ?? ''))
    const marnm = value(primary, '_MARNM') ?? value(rec, '_MARNM')
    const person: Person = {
      id,
      givenNames: birthName.given,
      surname: birthName.surname,
      sex:
        ({ M: 'male', F: 'female', X: 'other' } as Record<string, Sex>)[
          (value(rec, 'SEX') ?? '').trim().toUpperCase()
        ] ?? 'unknown',
      events: [],
      createdAt: now,
      updatedAt: now
    }
    const marriedSurname = married ? split(married).surname : marnm?.replace(/\//g, '').trim()
    if (marriedSurname && marriedSurname !== birthName.surname) {
      person.surname = marriedSurname
      if (birthName.surname) person.birthSurname = birthName.surname
    }
    const birt = child(rec, 'BIRT')
    const birth = lifeEvent(birt, id, 'BIRT')
    if (birth && Object.keys(birth).length) person.birth = birth
    const deat = child(rec, 'DEAT')
    if (deat) {
      const death = lifeEvent(deat, id, 'DEAT')
      if (death && Object.keys(death).length) person.death = death
      person.living = false // `1 DEAT Y` or any death data
    }
    for (const n of rec.children) {
      let type = EVENT_TAGS[n.tag]
      let customType: string | undefined
      if (!type && (n.tag === 'EVEN' || n.tag === 'FACT')) {
        const t = value(n, 'TYPE')?.trim() ?? ''
        type = EVENT_TYPE_NAMES[t.toLowerCase()] ?? 'custom'
        if (type === 'custom') customType = t || undefined
      }
      if (!type) continue
      const event: PersonEvent = { id: newId(), type }
      if (customType) event.customType = customType
      const parsed = parseGedcomDate(value(n, 'DATE'))
      if (parsed?.date) event.date = parsed.date
      if (parsed?.endDate) event.endDate = parsed.endDate
      if (parsed?.lossy) {
        noteLossy(id, n.tag, parsed)
        warn('gedcom-lossy-date', child(n, 'DATE')!.line, { date: parsed.original })
      }
      const place = placeOf(n)
      if (place) event.place = place
      // OCCU, EDUC, RELI … carry their text as the value (EVEN may have one too); other
      // events classify themselves with TYPE.
      const typeText = n.tag !== 'EVEN' && n.tag !== 'FACT' ? value(n, 'TYPE')?.trim() : undefined
      const description =
        n.value?.trim() && n.value !== 'Y' ? n.value.trim() : typeText || undefined
      if (description) event.description = description
      const notes = notesOf(n)
      if (notes.length) event.notes = notes.join('\n\n')
      const citations = citationsOf(n)
      if (citations.length) event.citations = citations
      person.events.push(event)
      eventCount++
    }
    const notes = notesOf(rec)
    if (notes.length) person.notes = notes.join('\n\n')
    const citations = citationsOf(rec)
    if (citations.length) person.citations = citations
    for (const obje of children(rec, 'OBJE')) {
      const ref = mediaRef(obje)
      if (!ref) continue
      if (/^y/i.test(value(obje, '_PRIM') ?? '')) ref.portraitOf.push(id)
      else if (!ref.personIds.includes(id)) ref.personIds.push(id)
    }
    for (const n of rec.children) {
      if (!KNOWN_INDI.has(n.tag)) unsupportedTag(`INDI.${n.tag}`)
    }
    tree.persons[id] = person
  }

  // Families.
  const pedigree = new Map<string, ParentChildKind>() // "childXref famXref" → kind
  const PEDI: Record<string, ParentChildKind> = {
    birth: 'biological',
    natural: 'biological',
    adopted: 'adoptive',
    foster: 'foster',
    step: 'step',
    sealing: 'biological'
  }
  for (const rec of personNodes) {
    for (const famc of children(rec, 'FAMC')) {
      const pedi = value(famc, 'PEDI')?.trim().toLowerCase()
      if (famc.value && pedi && PEDI[pedi]) pedigree.set(`${rec.xref} ${famc.value}`, PEDI[pedi])
    }
  }
  let familyCount = 0
  const relationships: Relationship[] = []
  for (const rec of doc.records.filter((r) => r.tag === 'FAM' && r.xref)) {
    familyCount++
    const partner = (tag: string): string | undefined => {
      const ref = value(rec, tag)
      if (!ref) return undefined
      if (!byXref.has(ref) || byXref.get(ref)!.tag !== 'INDI') {
        warn('gedcom-dangling-reference', child(rec, tag)!.line, { xref: ref })
        return undefined
      }
      return idOf(ref)
    }
    const husb = partner('HUSB')
    const wife = partner('WIFE')
    const parents = [husb, wife].filter((p): p is string => !!p)
    if (husb && wife && husb !== wife) {
      const marr = child(rec, 'MARR')
      const enga = child(rec, 'ENGA')
      const div = child(rec, 'DIV') ?? child(rec, 'ANUL')
      // Our own export writes other unions and endings as EVEN with a TYPE.
      const evens = children(rec, 'EVEN')
      const union = evens.find((e) => /^(partnership|union)$/i.test(value(e, 'TYPE') ?? ''))
      const ending = evens.find((e) => /^end:/i.test(value(e, 'TYPE') ?? ''))
      const rel: PartnershipRelationship = {
        id: newId(),
        type: 'partnership',
        partnerIds: [husb, wife],
        kind: marr
          ? 'marriage'
          : enga
            ? 'engagement'
            : /union/i.test(value(union, 'TYPE') ?? '')
              ? 'other'
              : 'partnership'
      }
      const start = lifeEvent(marr ?? enga ?? union, husb, marr ? 'MARR' : 'ENGA')
      if (start && Object.keys(start).length) rel.start = start
      if (div) {
        const end = lifeEvent(div, husb, div.tag) ?? {}
        rel.end = { ...end, reason: div.tag === 'DIV' ? 'divorce' : 'other' }
      } else if (ending) {
        const end = lifeEvent(ending, husb, 'EVEN') ?? {}
        const reason = /separation|death|other/i
          .exec(value(ending, 'TYPE') ?? '')?.[0]
          .toLowerCase()
        rel.end = { ...end, reason: (reason ?? 'other') as 'separation' | 'death' | 'other' }
      }
      const citations = citationsOf(rec)
      if (citations.length) rel.citations = citations
      relationships.push(rel)
      const notes = notesOf(rec)
      if (notes.length) {
        for (const p of [husb, wife]) {
          const person = tree.persons[p]!
          person.notes = [person.notes, ...notes].filter(Boolean).join('\n\n')
        }
      }
    }
    for (const chil of children(rec, 'CHIL')) {
      const ref = chil.value
      if (!ref || !byXref.has(ref)) {
        warn('gedcom-dangling-reference', chil.line, { xref: ref ?? '' })
        continue
      }
      const childId = idOf(ref)
      // Pedigree: FAMC.PEDI on the child, or Ancestry/FTM-style _FREL/_MREL on CHIL.
      const fromFamc = pedigree.get(`${ref} ${rec.xref}`)
      for (const parentId of parents) {
        const rel = parentId === husb ? value(chil, '_FREL') : value(chil, '_MREL')
        const kind = fromFamc ?? PEDI[rel?.trim().toLowerCase() ?? ''] ?? 'biological'
        if (parentId === childId) continue
        relationships.push({ id: newId(), type: 'parent-child', parentId, childId, kind })
      }
    }
    for (const obje of children(rec, 'OBJE')) {
      const ref = mediaRef(obje)
      for (const p of parents) if (ref && !ref.personIds.includes(p)) ref.personIds.push(p)
    }
    for (const n of rec.children) {
      if (!KNOWN_FAM.has(n.tag)) unsupportedTag(`FAM.${n.tag}`)
    }
  }
  // Duplicate links (the same parent–child pair from two families) are kept once.
  const seen = new Set<string>()
  for (const rel of relationships) {
    const key =
      rel.type === 'parent-child'
        ? `pc ${rel.parentId} ${rel.childId}`
        : `p ${[...rel.partnerIds].sort().join(' ')} ${rel.id}`
    if (seen.has(key)) continue
    seen.add(key)
    tree.relationships[rel.id] = rel
  }

  // Media referenced from sources.
  for (const rec of doc.records.filter((r) => r.tag === 'SOUR' && r.xref)) {
    for (const obje of children(rec, 'OBJE')) {
      const ref = mediaRef(obje)
      const sourceId = idOf(rec.xref!)
      if (ref && !ref.sourceIds.includes(sourceId)) ref.sourceIds.push(sourceId)
    }
  }

  // Lossy dates are kept word for word in the person's notes.
  for (const [personId, lines] of lossyNotes) {
    const person = tree.persons[personId]
    if (!person) continue
    const block = `GEDCOM: ${lines.join('; ')}`
    person.notes = person.notes ? `${person.notes}\n\n${block}` : block
  }

  for (const rec of doc.records) {
    if (!KNOWN_RECORDS.has(rec.tag) && !rec.tag.startsWith('_')) unsupportedTag(rec.tag)
    else if (rec.tag.startsWith('_')) unsupportedTag(rec.tag)
  }

  // A child in several families with birth pedigree: the first two parents stay biological,
  // the others become step-parents (usually a second marriage without PEDI).
  const bio = new Map<string, number>()
  for (const rel of Object.values(tree.relationships)) {
    if (rel.type !== 'parent-child' || rel.kind !== 'biological') continue
    const n = (bio.get(rel.childId) ?? 0) + 1
    bio.set(rel.childId, n)
    if (n > 2) {
      rel.kind = 'step'
      warnings.push({
        severity: 'warning',
        code: 'gedcom-extra-parents',
        params: { name: displayName(tree.persons[rel.childId]!) || '?' }
      })
    }
  }

  // Remaining structural problems (cycles) become warnings; the offending links go.
  for (const issue of validateTree(tree)) {
    if (issue.severity !== 'error') continue
    warnings.push({ ...issue, severity: 'warning', code: `gedcom-${issue.code}` })
  }
  dropInvalidLinks(tree)

  const root = personNodes[0]?.xref
  if (root) tree.meta.rootPersonId = idOf(root)
  const sourceName = value(head, 'SOUR')
  return {
    tree,
    media,
    warnings,
    summary: {
      people: Object.keys(tree.persons).length,
      families: familyCount,
      events: eventCount,
      sources: Object.keys(tree.sources).length,
      media: media.length,
      ...(sourceName ? { program: value(child(head, 'SOUR'), 'NAME') ?? sourceName } : {}),
      ...(doc.version ? { version: doc.version } : {}),
      unsupported
    }
  }
}

/**
 * Breaks ancestry cycles: for a person in a cycle, the link to a parent who is also one of the
 * person's descendants goes. Other structural errors are left to the caller's validation.
 */
function dropInvalidLinks(tree: FamilyTree): void {
  for (let guard = 0; guard < 1000; guard++) {
    const issue = validateTree(tree).find((i) => i.code === 'ancestry-cycle')
    const personId = issue?.personId
    if (!personId) return
    const pc = Object.values(tree.relationships).filter((r) => r.type === 'parent-child')
    const descendants = new Set<string>()
    const queue = [personId]
    while (queue.length) {
      const id = queue.shift()!
      for (const r of pc) {
        if (r.type === 'parent-child' && r.parentId === id && !descendants.has(r.childId)) {
          descendants.add(r.childId)
          queue.push(r.childId)
        }
      }
    }
    const culprit = pc.find(
      (r) => r.type === 'parent-child' && r.childId === personId && descendants.has(r.parentId)
    )
    if (!culprit) return
    delete tree.relationships[culprit.id]
  }
}

/** A media file of a GEDCOM import after the caller loaded it into the media library. */
export interface LoadedMedia {
  hash: string
  mime: MediaMime
  size: number
  fileName: string
  width?: number
  height?: number
}

/**
 * Adds the loaded media files of an import to its tree (galleries of the people and sources
 * that referenced them). References without a loaded file are returned as missing.
 */
export function attachMedia(
  result: GedcomImportResult,
  loaded: Map<string, LoadedMedia>
): { tree: FamilyTree; missing: string[] } {
  const tree: FamilyTree = {
    ...result.tree,
    media: { ...result.tree.media },
    persons: { ...result.tree.persons },
    sources: { ...result.tree.sources }
  }
  const missing: string[] = []
  for (const ref of result.media) {
    const file = loaded.get(ref.path)
    if (!file) {
      missing.push(ref.path)
      continue
    }
    const item: MediaItem = {
      id: ref.mediaId,
      hash: file.hash,
      mime: file.mime,
      fileName: file.fileName,
      size: file.size,
      ...(file.width ? { width: file.width, height: file.height } : {}),
      ...(ref.title ? { title: ref.title } : {}),
      ...(ref.description ? { description: ref.description } : {})
    }
    tree.media[item.id] = item
    for (const id of ref.personIds) {
      const person = tree.persons[id]
      if (person) tree.persons[id] = { ...person, mediaIds: [...(person.mediaIds ?? []), item.id] }
    }
    for (const id of ref.portraitOf) {
      const person = tree.persons[id]
      if (person) tree.persons[id] = { ...person, portraitMediaId: item.id }
    }
    for (const id of ref.sourceIds) {
      const source = tree.sources[id]
      if (source) tree.sources[id] = { ...source, mediaIds: [...(source.mediaIds ?? []), item.id] }
    }
  }
  return { tree, missing }
}
