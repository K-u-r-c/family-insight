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
      if (p.living !== undefined && typeof p.living !== 'boolean')
        errors.push(`${path}.living: expected boolean`)
      if (!optStr(p.notes)) errors.push(`${path}.notes: expected text`)
      if (p.photo !== undefined && !(isStr(p.photo) && p.photo.startsWith('data:image/'))) {
        errors.push(`${path}.photo: expected image data URL`)
      }
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
    }
  }
  return errors
}
