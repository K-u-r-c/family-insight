/**
 * Family Insight domain model.
 *
 * A family is modelled as a graph, not a strict tree: people are nodes and
 * relationships are edges. This supports remarriage, half-siblings, adoption
 * and other real-world situations a strict tree cannot express.
 */

/** Bump when the persisted document shape changes; add a migration in `src/core/file`. */
export const SCHEMA_VERSION = 3

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
  mediaIds?: MediaId[]
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
  /** Scans of the record (media library). */
  mediaIds?: MediaId[]
}

export type MediaId = string

/** File types the media library accepts, with the extension used inside the container. */
export const MEDIA_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf'
} as const

export type MediaMime = keyof typeof MEDIA_TYPES

/**
 * A photo or scanned document. The bytes are stored once per SHA-256 `hash` in the
 * `.finsight` container (`media/<hash>.<ext>`), not in the JSON (schema v3).
 */
export interface MediaItem {
  id: MediaId
  hash: string
  mime: MediaMime
  /** Original file name, used when exporting the file again. */
  fileName: string
  /** Size in bytes. */
  size?: number
  title?: string
  date?: FuzzyDate
  place?: string
  description?: string
  width?: number
  height?: number
}

/** Coordinates of a place name (gazetteer entry, schema v3). */
export interface Place {
  lat: number
  lon: number
  /** Set by the user, or found by the online place lookup. */
  source: 'manual' | 'geocoded'
  /** The name the lookup service gave, e.g. "Kraków, Lesser Poland, Poland". */
  displayName?: string
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
  /** Photos and documents of the person, in the order the user arranged them. */
  mediaIds?: MediaId[]
  /** Portrait shown on the card (schema v3; replaces the v1/v2 `photo` data URL). */
  portraitMediaId?: MediaId
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
  /** Media library: photos and scanned documents (schema v3). */
  media: Record<MediaId, MediaItem>
  /**
   * Gazetteer: coordinates by normalised place name (`placeKey`), so free-text places get a
   * location without changing the facts (schema v3).
   */
  places: Record<string, Place>
}
