import type { CitationTarget } from '@core/model/sources'
import { displayName } from '@core/model/tree'
import type { FamilyTree } from '@core/model/types'
import { eventName } from '@renderer/features/person/eventTypes'

type T = (key: string, options?: Record<string, unknown>) => string

/** Human-readable name of the fact a citation supports, e.g. "Jan Kowalski – Birth". */
export function factLabel(tree: FamilyTree, target: CitationTarget, t: T): string {
  const person = (id: string): string => {
    const p = tree.persons[id]
    return (p && displayName(p)) || t('person.unnamed')
  }
  switch (target.kind) {
    case 'person':
      return person(target.personId)
    case 'birth':
      return `${person(target.personId)} – ${t('timeline.birth')}`
    case 'death':
      return `${person(target.personId)} – ${t('timeline.death')}`
    case 'event': {
      const event = tree.persons[target.personId]?.events.find((e) => e.id === target.eventId)
      return `${person(target.personId)} – ${event ? eventName(event, t) : '?'}`
    }
    case 'relationship':
    case 'partnership-start':
    case 'partnership-end': {
      const rel = tree.relationships[target.relationshipId]
      if (!rel) return '?'
      if (rel.type === 'parent-child') {
        return t('sources.fact.parentChild', {
          parent: person(rel.parentId),
          child: person(rel.childId)
        })
      }
      const couple = `${person(rel.partnerIds[0])} & ${person(rel.partnerIds[1])}`
      if (target.kind === 'relationship')
        return `${couple} – ${t(`relations.partnership.${rel.kind}`)}`
      return `${couple} – ${t(target.kind === 'partnership-start' ? 'relations.startDate' : 'relations.endDate')}`
    }
  }
}

/** The person to select when a citation's fact is clicked. */
export function factPerson(tree: FamilyTree, target: CitationTarget): string | null {
  if ('personId' in target) return target.personId
  const rel = tree.relationships[target.relationshipId]
  if (!rel) return null
  return rel.type === 'parent-child' ? rel.childId : rel.partnerIds[0]
}
