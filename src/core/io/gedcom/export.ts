import {
  MEDIA_TYPES,
  type Citation,
  type FamilyTree,
  type LifeEvent,
  type MediaItem,
  type Person,
  type PersonEvent
} from '../../model/types'
import { placeKey } from '../../model/places'
import { formatGedcomDate, formatGedcomPeriod } from './dates'
import { node, writeGedcom, type GedcomNode } from './parser'

/**
 * A family tree → GEDCOM 5.5.1 (default, widest compatibility) or 7.0. Cross-references are
 * numbered in tree order (`@I1@`, `@F1@` …), so the same tree always gives the same file.
 * Fields GEDCOM can't carry are listed in the developer reference (round-trip test).
 */

export interface GedcomExportOptions {
  version?: '5.5.1' | '7.0'
  /** Replace living people's names with "Living" and leave out their details. */
  privatizeLiving?: boolean
  /** Name used for privatised people (translated by the caller). */
  livingName?: string
  notes?: boolean
  /** Folder of the media files relative to the GEDCOM file (`media`). */
  mediaFolder?: string
  /** For reproducible files (tests). */
  date?: Date
  appVersion?: string
}

export interface ExportedMediaFile {
  /** Path written in the GEDCOM file, relative to it. */
  path: string
  hash: string
  item: MediaItem
}

/** Tags of built-in events; `military-service`, `award` and `custom` use `EVEN` + `TYPE`. */
const EVENT_TAG: Partial<Record<PersonEvent['type'], string>> = {
  baptism: 'BAPM',
  christening: 'CHR',
  confirmation: 'CONF',
  'first-communion': 'FCOM',
  burial: 'BURI',
  cremation: 'CREM',
  emigration: 'EMIG',
  immigration: 'IMMI',
  naturalization: 'NATU',
  residence: 'RESI',
  occupation: 'OCCU',
  education: 'EDUC',
  graduation: 'GRAD',
  religion: 'RELI',
  census: 'CENS',
  retirement: 'RETI'
}
const EVEN_TYPE: Partial<Record<PersonEvent['type'], string>> = {
  'military-service': 'Military service',
  award: 'Award'
}
/** Attributes carry their text as the value; events take it as `TYPE`. */
const ATTRIBUTES = new Set(['OCCU', 'EDUC', 'RELI'])
const QUAY: Record<NonNullable<Citation['quality']>, string> = {
  primary: '3',
  secondary: '2',
  questionable: '1',
  unreliable: '0'
}
const MONTH_LIMIT = 110

function isPrivate(person: Person, now: Date): boolean {
  if (person.living === false || person.death) return false
  if (person.living === true) return true
  const year = Number(person.birth?.date?.value.slice(0, 4))
  return !year || now.getFullYear() - year < MONTH_LIMIT
}

export function exportGedcom(
  tree: FamilyTree,
  options: GedcomExportOptions = {}
): { text: string; media: ExportedMediaFile[] } {
  const v7 = options.version === '7.0'
  const now = options.date ?? new Date()
  const notesOn = options.notes ?? true
  const folder = options.mediaFolder ?? 'media'
  const persons = Object.values(tree.persons)
  const hidden = new Set(
    options.privatizeLiving ? persons.filter((p) => isPrivate(p, now)).map((p) => p.id) : []
  )
  const personXref = new Map(persons.map((p, i) => [p.id, `@I${i + 1}@`]))
  const sourceXref = new Map(Object.keys(tree.sources).map((id, i) => [id, `@S${i + 1}@`]))
  const repoXref = new Map(Object.keys(tree.repositories).map((id, i) => [id, `@R${i + 1}@`]))
  const mediaXref = new Map(Object.keys(tree.media).map((id, i) => [id, `@O${i + 1}@`]))

  const dateNode = (date: LifeEvent['date']): GedcomNode[] =>
    date ? [node('DATE', formatGedcomDate(date))] : []
  const placeNode = (place: string | undefined): GedcomNode[] => {
    if (!place?.trim()) return []
    const coords = tree.places[placeKey(place)]
    const map = coords
      ? [
          node('MAP', undefined, [
            node('LATI', `${coords.lat < 0 ? 'S' : 'N'}${Math.abs(coords.lat)}`),
            node('LONG', `${coords.lon < 0 ? 'W' : 'E'}${Math.abs(coords.lon)}`)
          ])
        ]
      : []
    return [node('PLAC', place.trim(), map)]
  }
  const noteNodes = (text: string | undefined): GedcomNode[] =>
    notesOn && text?.trim() ? [node(v7 ? 'NOTE' : 'NOTE', text)] : []
  const citationNodes = (list: Citation[] | undefined): GedcomNode[] =>
    (list ?? [])
      .filter((c) => sourceXref.has(c.sourceId))
      .map((c) => {
        const data: GedcomNode[] = [
          ...(c.date ? [node('DATE', formatGedcomDate(c.date))] : []),
          ...(c.text ? [node('TEXT', c.text)] : [])
        ]
        return node('SOUR', sourceXref.get(c.sourceId), [
          ...(c.page ? [node('PAGE', c.page)] : []),
          ...(data.length ? [node('DATA', undefined, data)] : []),
          ...(c.quality ? [node('QUAY', QUAY[c.quality])] : []),
          ...noteNodes(c.notes),
          ...(c.mediaIds ?? [])
            .filter((m) => mediaXref.has(m))
            .map((m) => node('OBJE', mediaXref.get(m)))
        ])
      })
  const eventNode = (
    tag: string,
    e: LifeEvent | undefined,
    extra: GedcomNode[] = []
  ): GedcomNode[] => {
    if (!e && !extra.length) return []
    const body = [
      ...dateNode(e?.date),
      ...placeNode(e?.place),
      ...extra,
      ...citationNodes(e?.citations)
    ]
    return [node(tag, body.length ? undefined : 'Y', body)]
  }

  const records: GedcomNode[] = []
  const headChildren: GedcomNode[] = [
    node('GEDC', undefined, [
      node('VERS', v7 ? '7.0' : '5.5.1'),
      ...(v7 ? [] : [node('FORM', 'LINEAGE-LINKED')])
    ]),
    node('SOUR', 'FAMILY_INSIGHT', [
      node('NAME', 'Family Insight'),
      ...(options.appVersion ? [node('VERS', options.appVersion)] : [])
    ]),
    node('DATE', formatGedcomDate({ value: now.toISOString().slice(0, 10), qualifier: 'exact' })),
    ...(v7 ? [] : [node('CHAR', 'UTF-8')]),
    node('SUBM', '@U1@')
  ]
  records.push(node('HEAD', undefined, headChildren))
  records.push(node('SUBM', undefined, [node('NAME', 'Family Insight')], '@U1@'))

  // Families: partnerships, plus parent sets of children whose parents aren't partners.
  interface Family {
    xref: string
    partners: string[]
    partnership?: FamilyTree['relationships'][string]
    children: { childId: string; kinds: Map<string, string> }[]
  }
  const families: Family[] = []
  const familyByKey = new Map<string, Family>()
  const familyFor = (partners: string[]): Family => {
    const key = [...partners].sort().join(' ')
    let fam = familyByKey.get(key)
    if (!fam) {
      fam = { xref: `@F${families.length + 1}@`, partners, children: [] }
      familyByKey.set(key, fam)
      families.push(fam)
    }
    return fam
  }
  for (const rel of Object.values(tree.relationships)) {
    if (rel.type !== 'partnership') continue
    const fam = familyFor([...rel.partnerIds])
    fam.partnership ??= rel
  }
  const parentLinks = new Map<string, { parentId: string; kind: string }[]>()
  for (const rel of Object.values(tree.relationships)) {
    if (rel.type !== 'parent-child') continue
    parentLinks.set(rel.childId, [
      ...(parentLinks.get(rel.childId) ?? []),
      { parentId: rel.parentId, kind: rel.kind }
    ])
  }
  const partnersOf = (id: string): Set<string> =>
    new Set(
      Object.values(tree.relationships).flatMap((r) =>
        r.type === 'partnership' && r.partnerIds.includes(id)
          ? r.partnerIds.filter((p) => p !== id)
          : []
      )
    )
  for (const [childId, parents] of parentLinks) {
    // Biological parents form one family; every other parent joins a partner among the
    // parents (a step-parent with the biological parent) or stands alone.
    const groups: string[][] = []
    const bio = parents.filter((p) => p.kind === 'biological').map((p) => p.parentId)
    if (bio.length) groups.push(bio.slice(0, 2))
    for (const p of parents) {
      if (groups.some((g) => g.includes(p.parentId))) continue
      const partner = parents.find(
        (o) => o.parentId !== p.parentId && partnersOf(p.parentId).has(o.parentId)
      )
      groups.push(partner ? [partner.parentId, p.parentId] : [p.parentId])
    }
    for (const group of groups) {
      const fam = familyFor(group)
      const kinds = new Map(
        group.map((id) => [id, parents.find((p) => p.parentId === id)?.kind ?? 'biological'])
      )
      fam.children.push({ childId, kinds })
    }
  }

  const familiesOf = (id: string) => ({
    asChild: families.filter((f) => f.children.some((c) => c.childId === id)),
    asPartner: families.filter((f) => f.partners.includes(id))
  })
  const PEDI: Record<string, string> = {
    biological: 'birth',
    adoptive: 'adopted',
    foster: 'foster'
  }
  const ANCESTRY: Record<string, string> = {
    biological: 'Natural',
    adoptive: 'Adopted',
    foster: 'Foster',
    step: 'Step'
  }

  // People.
  for (const person of persons) {
    const xref = personXref.get(person.id)!
    const fams = familiesOf(person.id)
    const links = [
      ...fams.asChild.map((f) => {
        const kinds = [...f.children.find((c) => c.childId === person.id)!.kinds.values()]
        const same = kinds.every((k) => k === kinds[0])
        const pedi = same ? PEDI[kinds[0]!] : undefined
        return node(
          'FAMC',
          f.xref,
          pedi && pedi !== 'birth' ? [node('PEDI', v7 ? pedi.toUpperCase() : pedi)] : []
        )
      }),
      ...fams.asPartner.map((f) => node('FAMS', f.xref))
    ]
    if (hidden.has(person.id)) {
      const name = options.livingName ?? 'Living'
      records.push(
        node(
          'INDI',
          undefined,
          [node('NAME', `${name} //`), node('SEX', sexCode(person)), ...links],
          xref
        )
      )
      continue
    }
    const nameNodes: GedcomNode[] = []
    const given = person.givenNames.trim()
    const nameOf = (surname: string, type?: string) =>
      node('NAME', `${given} /${surname}/`.trim(), [
        ...(type ? [node('TYPE', v7 ? type.toUpperCase() : type)] : []),
        ...(given ? [node('GIVN', given)] : []),
        ...(surname ? [node('SURN', surname)] : [])
      ])
    if (person.birthSurname && person.birthSurname !== person.surname) {
      nameNodes.push(nameOf(person.birthSurname, v7 ? 'birth' : undefined))
      nameNodes.push(nameOf(person.surname, 'married'))
    } else {
      nameNodes.push(nameOf(person.surname))
    }
    const children: GedcomNode[] = [...nameNodes, node('SEX', sexCode(person))]
    children.push(...eventNode('BIRT', person.birth))
    if (person.death) children.push(...eventNode('DEAT', person.death))
    else if (person.living === false) children.push(node('DEAT', 'Y'))
    for (const e of person.events) {
      const tag = EVENT_TAG[e.type] ?? 'EVEN'
      const type = tag === 'EVEN' ? (EVEN_TYPE[e.type] ?? e.customType ?? 'Event') : undefined
      const date = e.endDate
        ? [node('DATE', formatGedcomPeriod(e.date, e.endDate))]
        : dateNode(e.date)
      const description = e.description?.trim()
      const valueOnTag = tag === 'EVEN' || ATTRIBUTES.has(tag) ? description : undefined
      const body = [
        ...(type ? [node('TYPE', type)] : []),
        ...(!valueOnTag && description ? [node('TYPE', description)] : []),
        ...date,
        ...placeNode(e.place),
        ...noteNodes(e.notes),
        ...citationNodes(e.citations)
      ]
      children.push(node(tag, valueOnTag || (body.length ? undefined : 'Y'), body))
    }
    children.push(...links)
    children.push(...noteNodes(person.notes))
    children.push(...citationNodes(person.citations))
    if (person.portraitMediaId && mediaXref.has(person.portraitMediaId)) {
      children.push(node('OBJE', mediaXref.get(person.portraitMediaId), [node('_PRIM', 'Y')]))
    }
    for (const m of person.mediaIds ?? []) {
      if (mediaXref.has(m)) children.push(node('OBJE', mediaXref.get(m)))
    }
    records.push(node('INDI', undefined, children, xref))
  }

  // Families.
  for (const fam of families) {
    const [a, b] = fam.partners
    const order = [a, b].filter((p): p is string => !!p)
    // HUSB is the man where the sexes say so; otherwise the first partner.
    if (
      order.length === 2 &&
      tree.persons[order[1]!]?.sex === 'male' &&
      tree.persons[order[0]!]?.sex !== 'male'
    )
      order.reverse()
    const children: GedcomNode[] = []
    if (order.length === 1) {
      children.push(
        node(tree.persons[order[0]!]?.sex === 'female' ? 'WIFE' : 'HUSB', personXref.get(order[0]!))
      )
    } else if (order.length === 2) {
      children.push(
        node('HUSB', personXref.get(order[0]!)),
        node('WIFE', personXref.get(order[1]!))
      )
    }
    const rel = fam.partnership
    if (rel?.type === 'partnership' && !order.some((p) => hidden.has(p))) {
      if (rel.kind === 'marriage') children.push(...eventNode('MARR', rel.start ?? {}))
      else if (rel.kind === 'engagement') children.push(...eventNode('ENGA', rel.start ?? {}))
      else if (rel.start)
        children.push(
          ...eventNode('EVEN', rel.start, [
            node('TYPE', rel.kind === 'partnership' ? 'Partnership' : 'Union')
          ])
        )
      if (rel.end) {
        if (rel.end.reason === 'divorce') children.push(...eventNode('DIV', rel.end))
        else
          children.push(
            ...eventNode('EVEN', rel.end, [node('TYPE', `End: ${rel.end.reason ?? 'other'}`)])
          )
      }
      children.push(...citationNodes(rel.citations))
    }
    for (const c of fam.children) {
      const kinds = order.map((p) => c.kinds.get(p) ?? 'biological')
      const same = kinds.every((k) => k === kinds[0])
      const extra =
        !same || kinds[0] === 'step'
          ? order.map((p, i) =>
              node(i === 0 ? '_FREL' : '_MREL', ANCESTRY[c.kinds.get(p) ?? 'biological'])
            )
          : []
      children.push(node('CHIL', personXref.get(c.childId), extra))
    }
    records.push(node('FAM', undefined, children, fam.xref))
  }

  // Sources, repositories, media.
  for (const source of Object.values(tree.sources)) {
    const repo = source.repositoryId && repoXref.get(source.repositoryId)
    records.push(
      node(
        'SOUR',
        undefined,
        [
          node('TITL', source.title),
          ...(source.author ? [node('AUTH', source.author)] : []),
          ...(source.publication ? [node('PUBL', source.publication)] : []),
          ...(repo
            ? [node('REPO', repo, source.callNumber ? [node('CALN', source.callNumber)] : [])]
            : []),
          ...noteNodes(
            [source.notes, source.url && `URL: ${source.url}`].filter(Boolean).join('\n\n')
          ),
          ...(source.mediaIds ?? [])
            .filter((m) => mediaXref.has(m))
            .map((m) => node('OBJE', mediaXref.get(m)))
        ],
        sourceXref.get(source.id)
      )
    )
  }
  for (const repo of Object.values(tree.repositories)) {
    records.push(
      node(
        'REPO',
        undefined,
        [
          node('NAME', repo.name),
          ...(repo.address ? [node('ADDR', repo.address)] : []),
          ...(repo.url ? [node('WWW', repo.url)] : []),
          ...noteNodes(repo.notes)
        ],
        repoXref.get(repo.id)
      )
    )
  }
  const media: ExportedMediaFile[] = []
  const used = new Set<string>()
  for (const item of Object.values(tree.media)) {
    // One file per content; the name stays recognisable and unique.
    let name =
      item.fileName.replace(/[\\/:*?"<>|]+/g, '-') ||
      `${item.hash.slice(0, 12)}.${MEDIA_TYPES[item.mime]}`
    if (used.has(name)) name = `${item.hash.slice(0, 8)}-${name}`
    used.add(name)
    const path = `${folder}/${name}`
    media.push({ path, hash: item.hash, item })
    const form = v7 ? item.mime : MEDIA_TYPES[item.mime]
    records.push(
      node(
        'OBJE',
        undefined,
        [
          node('FILE', path, [
            node('FORM', form),
            ...(item.title ? [node('TITL', item.title)] : [])
          ]),
          ...noteNodes(item.description)
        ],
        mediaXref.get(item.id)
      )
    )
  }
  records.push(node('TRLR'))
  return { text: writeGedcom(records, { version7: v7 }), media }
}

function sexCode(person: Person): string {
  return { male: 'M', female: 'F', other: 'X', unknown: 'U' }[person.sex]
}
