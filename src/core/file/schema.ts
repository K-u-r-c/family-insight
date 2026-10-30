import { CITATION_QUALITIES, EVENT_TYPES, MEDIA_TYPES } from '../model/types'

/**
 * Hand-written shape validation for `.finsight` documents (no runtime dependency).
 * Returns human-readable paths of problems; empty array = valid.
 */

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const optStr = (v: unknown): boolean => v === undefined || isStr(v)
const oneOf = (v: unknown, values: readonly string[]): boolean => isStr(v) && values.includes(v)

const SEX = ['female', 'male', 'other', 'unknown'] as const
const QUALIFIER = ['exact', 'about', 'before', 'after'] as const
const PC_KIND = ['biological', 'adoptive', 'step', 'foster'] as const
const P_KIND = ['marriage', 'partnership', 'engagement', 'other'] as const
const END_REASON = ['divorce', 'separation', 'death', 'other'] as const
const HASH = /^[0-9a-f]{64}$/

function checkIds(v: unknown, path: string, errors: string[]): void {
  if (v !== undefined && !(Array.isArray(v) && v.every(isStr))) {
    errors.push(`${path}: expected a list of ids`)
  }
}

function checkMedia(doc: Obj, errors: string[]): void {
  if (!isObj(doc.media)) {
    errors.push('media: expected object')
    return
  }
  for (const [id, m] of Object.entries(doc.media)) {
    const path = `media.${id}`
    if (!isObj(m) || m.id !== id || !isStr(m.fileName)) {
      errors.push(`${path}: needs id and fileName`)
      continue
    }
    if (!isStr(m.hash) || !HASH.test(m.hash)) errors.push(`${path}.hash: expected SHA-256 hex`)
    if (!isStr(m.mime) || !(m.mime in MEDIA_TYPES)) errors.push(`${path}.mime: unsupported`)
    checkDate(m.date, `${path}.date`, errors)
    for (const key of ['title', 'place', 'description'] as const) {
      if (!optStr(m[key])) errors.push(`${path}.${key}: expected text`)
    }
    for (const key of ['size', 'width', 'height'] as const) {
      const n = m[key]
      if (n !== undefined && !(typeof n === 'number' && Number.isFinite(n) && n >= 0)) {
        errors.push(`${path}.${key}: expected a number`)
      }
    }
  }
}

function checkCitations(v: unknown, path: string, errors: string[]): void {
  if (v === undefined) return
  if (!Array.isArray(v)) {
    errors.push(`${path}: expected a list`)
    return
  }
  v.forEach((c, i) => {
    const at = `${path}[${i}]`
    if (!isObj(c) || !isStr(c.id) || !isStr(c.sourceId)) {
      errors.push(`${at}: needs id and sourceId`)
      return
    }
    if (c.quality !== undefined && !oneOf(c.quality, CITATION_QUALITIES)) {
      errors.push(`${at}.quality: invalid`)
    }
    checkDate(c.date, `${at}.date`, errors)
    for (const key of ['page', 'text', 'notes'] as const) {
      if (!optStr(c[key])) errors.push(`${at}.${key}: expected text`)
    }
    checkIds(c.mediaIds, `${at}.mediaIds`, errors)
  })
}

function checkSources(doc: Obj, errors: string[]): void {
  if (!isObj(doc.sources)) errors.push('sources: expected object')
  else {
    for (const [id, s] of Object.entries(doc.sources)) {
      const path = `sources.${id}`
      if (!isObj(s) || s.id !== id || !isStr(s.title)) {
        errors.push(`${path}: needs id and title`)
        continue
      }
      for (const key of [
        'author',
        'publication',
        'repositoryId',
        'callNumber',
        'url',
        'notes'
      ] as const) {
        if (!optStr(s[key])) errors.push(`${path}.${key}: expected text`)
      }
      checkIds(s.mediaIds, `${path}.mediaIds`, errors)
    }
  }
  if (!isObj(doc.repositories)) errors.push('repositories: expected object')
  else {
    for (const [id, r] of Object.entries(doc.repositories)) {
      const path = `repositories.${id}`
      if (!isObj(r) || r.id !== id || !isStr(r.name)) {
        errors.push(`${path}: needs id and name`)
        continue
      }
      for (const key of ['address', 'url', 'notes'] as const) {
        if (!optStr(r[key])) errors.push(`${path}.${key}: expected text`)
      }
    }
  }
}

function checkEvents(v: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(v)) {
    errors.push(`${path}: expected a list`)
    return
  }
  const ids = new Set<string>()
  v.forEach((e, i) => {
    const at = `${path}[${i}]`
    if (!isObj(e)) {
      errors.push(`${at}: expected object`)
      return
    }
    if (!isStr(e.id) || ids.has(e.id)) errors.push(`${at}.id: missing or duplicate`)
    else ids.add(e.id)
    if (!oneOf(e.type, EVENT_TYPES)) errors.push(`${at}.type: invalid`)
    checkDate(e.date, `${at}.date`, errors)
    checkDate(e.endDate, `${at}.endDate`, errors)
    for (const key of ['customType', 'place', 'description', 'notes'] as const) {
      if (!optStr(e[key])) errors.push(`${at}.${key}: expected text`)
    }
    checkCitations(e.citations, `${at}.citations`, errors)
  })
}

function checkDate(v: unknown, path: string, errors: string[]): void {
  if (v === undefined) return
  if (
    !isObj(v) ||
    !isStr(v.value) ||
    !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(v.value) ||
    !oneOf(v.qualifier, QUALIFIER)
  ) {
    errors.push(`${path}: invalid date`)
  }
}

function checkEvent(v: unknown, path: string, errors: string[], extra?: (o: Obj) => void): void {
  if (v === undefined) return
  if (!isObj(v)) {
    errors.push(`${path}: expected object`)
    return
  }
  checkDate(v.date, `${path}.date`, errors)
  if (!optStr(v.place)) errors.push(`${path}.place: expected text`)
  checkCitations(v.citations, `${path}.citations`, errors)
  extra?.(v)
}

export function checkTreeShape(doc: unknown): string[] {
  const errors: string[] = []
  if (!isObj(doc)) return ['document: expected object']
  const meta = doc.meta
  if (
    !isObj(meta) ||
    !isStr(meta.name) ||
    !isStr(meta.createdAt) ||
    !isStr(meta.updatedAt) ||
    !optStr(meta.rootPersonId)
  ) {
    errors.push('meta: invalid')
  }
  if (isObj(meta) && meta.view !== undefined) {
    const v = meta.view
    if (
      !isObj(v) ||
      !oneOf(v.mode, ['family', 'ancestors', 'descendants', 'hourglass']) ||
      typeof v.depth !== 'number' ||
      !Array.isArray(v.collapsed) ||
      !v.collapsed.every(isStr)
    ) {
      errors.push('meta.view: invalid')
    }
  }
  if (!isObj(doc.persons)) errors.push('persons: expected object')
  else {
    for (const [id, p] of Object.entries(doc.persons)) {
      const path = `persons.${id}`
      if (!isObj(p)) {
        errors.push(`${path}: expected object`)
        continue
      }
      if (!isStr(p.id)) errors.push(`${path}.id: expected text`)
      if (!isStr(p.givenNames)) errors.push(`${path}.givenNames: expected text`)
      if (!isStr(p.surname)) errors.push(`${path}.surname: expected text`)
      if (!optStr(p.birthSurname)) errors.push(`${path}.birthSurname: expected text`)
      if (!oneOf(p.sex, SEX)) errors.push(`${path}.sex: invalid`)
      checkEvent(p.birth, `${path}.birth`, errors)
      checkEvent(p.death, `${path}.death`, errors)
      checkEvents(p.events, `${path}.events`, errors)
      checkCitations(p.citations, `${path}.citations`, errors)
      if (p.living !== undefined && typeof p.living !== 'boolean')
        errors.push(`${path}.living: expected boolean`)
      if (!optStr(p.notes)) errors.push(`${path}.notes: expected text`)
      checkIds(p.mediaIds, `${path}.mediaIds`, errors)
      if (!optStr(p.portraitMediaId)) errors.push(`${path}.portraitMediaId: expected text`)
      if (!isStr(p.createdAt) || !isStr(p.updatedAt)) errors.push(`${path}: missing timestamps`)
    }
  }
  if (!isObj(doc.relationships)) errors.push('relationships: expected object')
  else {
    for (const [id, r] of Object.entries(doc.relationships)) {
      const path = `relationships.${id}`
      if (!isObj(r) || !isStr(r.id)) {
        errors.push(`${path}: invalid`)
        continue
      }
      if (r.type === 'parent-child') {
        if (!isStr(r.parentId) || !isStr(r.childId)) errors.push(`${path}: missing parent/child`)
        if (!oneOf(r.kind, PC_KIND)) errors.push(`${path}.kind: invalid`)
      } else if (r.type === 'partnership') {
        if (
          !Array.isArray(r.partnerIds) ||
          r.partnerIds.length !== 2 ||
          !r.partnerIds.every(isStr)
        ) {
          errors.push(`${path}.partnerIds: expected two ids`)
        }
        if (!oneOf(r.kind, P_KIND)) errors.push(`${path}.kind: invalid`)
        checkEvent(r.start, `${path}.start`, errors)
        checkEvent(r.end, `${path}.end`, errors, (o) => {
          if (o.reason !== undefined && !oneOf(o.reason, END_REASON))
            errors.push(`${path}.end.reason: invalid`)
        })
      } else {
        errors.push(`${path}.type: invalid`)
      }
      checkCitations(r.citations, `${path}.citations`, errors)
    }
  }
  checkSources(doc, errors)
  checkMedia(doc, errors)
  return errors
}
