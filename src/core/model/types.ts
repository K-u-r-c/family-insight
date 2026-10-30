/**
 * Family Insight domain model.
 *
 * A family is modelled as a graph, not a strict tree: people are nodes and
 * relationships are edges. This supports remarriage, half-siblings, adoption
 * and other real-world situations a strict tree cannot express.
 */

/** Bump when the persisted document shape changes; add a migration in `src/core/file`. */
export const SCHEMA_VERSION = 2

export type PersonId = string
export type RelationshipId = string

export type Sex = 'female' | 'male' | 'other' | 'unknown'

/** How precise a genealogical date is. */
export type DateQualifier = 'exact' | 'about' | 'before' | 'after'

/**
 * A possibly partial date. `value` is an ISO-8601 prefix:
 * `YYYY`, `YYYY-MM` or `YYYY-MM-DD`.
 */
export interface FuzzyDate {
  value: string
  qualifier: DateQualifier
}

export interface LifeEvent {
  date?: FuzzyDate
  place?: string
  /** Sources supporting this fact. */
  citations?: Citation[]
}

export type SourceId = string
export type RepositoryId = string
export type CitationId = string

/** Where a source is kept: an archive, a library, a parish office, a website. */
export interface Repository {
  id: RepositoryId
  name: string
  address?: string
  url?: string
  notes?: string
}

/** A document or record facts come from: a parish register, a census, a family letter … */
export interface Source {
  id: SourceId
  title: string
  author?: string
  /** Publication or record details (book, volume, year). */
  publication?: string
  repositoryId?: RepositoryId
  /** Shelf mark / signature in the repository. */
  callNumber?: string
  url?: string
  notes?: string
  /** Scans or photos of the source (media library). */
  mediaIds?: string[]
}

export const CITATION_QUALITIES = ['primary', 'secondary', 'questionable', 'unreliable'] as const
export type CitationQuality = (typeof CITATION_QUALITIES)[number]

/** A reference from a fact to a source, stored next to the fact it supports. */
export interface Citation {
  id: CitationId
  sourceId: SourceId
  /** Page, entry or folio within the source. */
  page?: string
  quality?: CitationQuality
  /** When the record was made or the source was consulted. */
  date?: FuzzyDate
  /** A transcription or quotation of the relevant text. */
  text?: string
  notes?: string
}

/** Built-in kinds of life events; `custom` uses `PersonEvent.customType` as its name. */
export const EVENT_TYPES = [
  'baptism',
  'christening',
  'confirmation',
  'first-communion',
  'burial',
  'cremation',
  'emigration',
  'immigration',
  'naturalization',
  'residence',
  'occupation',
  'education',
  'graduation',
  'military-service',
  'religion',
  'census',
  'retirement',
  'award',
  'custom'
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export type PersonEventId = string

/**
 * A life event besides birth and death (baptism, emigration, military service …). `date` and
 * `endDate` together describe a period ("1914–1918").
 */
export interface PersonEvent {
  id: PersonEventId
  type: EventType
  /** Name of a `custom` event, free text. */
  customType?: string
  date?: FuzzyDate
  endDate?: FuzzyDate
  place?: string
  /** Short detail, e.g. the occupation, school or regiment. */
  description?: string
  notes?: string
  citations?: Citation[]
}

export interface Person {
  id: PersonId
  givenNames: string
  surname: string
  /** Surname at birth (maiden name), e.g. Polish "nazwisko rodowe". */
  birthSurname?: string
  sex: Sex
  birth?: LifeEvent
  death?: LifeEvent
  /** Further life events in the order the user arranged them (schema v2). */
  events: PersonEvent[]
  /** Sources about the person in general (not a single fact). */
  citations?: Citation[]
  /** `undefined` means "unknown"; inferred from `death` when absent. */
  living?: boolean
  notes?: string
  /** Portrait as a data URL (see the photos issue for size limits). */
  photo?: string
  createdAt: string
  updatedAt: string
}

export type ParentChildKind = 'biological' | 'adoptive' | 'step' | 'foster'

export interface ParentChildRelationship {
  id: RelationshipId
  type: 'parent-child'
  parentId: PersonId
  childId: PersonId
  kind: ParentChildKind
  citations?: Citation[]
}

export type PartnershipKind = 'marriage' | 'partnership' | 'engagement' | 'other'
export type PartnershipEndReason = 'divorce' | 'separation' | 'death' | 'other'

export interface PartnershipRelationship {
  id: RelationshipId
  type: 'partnership'
  partnerIds: [PersonId, PersonId]
  kind: PartnershipKind
  start?: LifeEvent
  end?: LifeEvent & { reason?: PartnershipEndReason }
  citations?: Citation[]
}

export type Relationship = ParentChildRelationship | PartnershipRelationship

export type TreeViewMode = 'family' | 'ancestors' | 'descendants' | 'hourglass'

/** How the tree was being viewed when saved (restored on open; not part of undo). */
export interface TreeViewMeta {
  mode: TreeViewMode
  depth: number
  collapsed: PersonId[]
}

export interface TreeMeta {
  name: string
  createdAt: string
  updatedAt: string
  /** Person the tree view centres on by default. */
  rootPersonId?: PersonId
  view?: TreeViewMeta
}

/** The whole family tree document, as stored in a `.finsight` file. */
export interface FamilyTree {
  schemaVersion: number
  meta: TreeMeta
  persons: Record<PersonId, Person>
  relationships: Record<RelationshipId, Relationship>
  /** Sources and repositories of the whole tree (schema v2). */
  sources: Record<SourceId, Source>
  repositories: Record<RepositoryId, Repository>
}
