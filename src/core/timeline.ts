import { compareFuzzyDates } from './date/fuzzyDate'
import { getChildLinks, getPartnerships, otherPartner } from './model/tree'
import type {
  FamilyTree,
  FuzzyDate,
  PartnershipEndReason,
  PartnershipKind,
  PersonId
} from './model/types'

export type TimelineEvent =
  | { type: 'birth'; date?: FuzzyDate; place?: string }
  | { type: 'death'; date?: FuzzyDate; place?: string }
  | {
      type: 'partnership'
      date?: FuzzyDate
      place?: string
      partnerId: PersonId
      kind: PartnershipKind
    }
  | {
      type: 'partnership-end'
      date?: FuzzyDate
      place?: string
      partnerId: PersonId
      reason?: PartnershipEndReason
    }
  | { type: 'child'; date?: FuzzyDate; place?: string; childId: PersonId }

const ORDER: Record<TimelineEvent['type'], number> = {
  birth: 0,
  partnership: 1,
  child: 2,
  'partnership-end': 3,
  death: 4
}

/**
 * Life events of a person in chronological order. Birth is always first and death last;
 * events without a date keep a natural order between them.
 */
export function buildTimeline(tree: FamilyTree, personId: PersonId): TimelineEvent[] {
  const person = tree.persons[personId]
  if (!person) return []
  const events: TimelineEvent[] = []
  for (const r of getPartnerships(tree, personId)) {
    const partnerId = otherPartner(r, personId)
    events.push({
      type: 'partnership',
      date: r.start?.date,
      place: r.start?.place,
      partnerId,
      kind: r.kind
    })
    if (r.end) {
      events.push({
        type: 'partnership-end',
        date: r.end.date,
        place: r.end.place,
        partnerId,
        reason: r.end.reason
      })
    }
  }
  for (const r of getChildLinks(tree, personId)) {
    const child = tree.persons[r.childId]
    if (child)
      events.push({
        type: 'child',
        date: child.birth?.date,
        place: child.birth?.place,
        childId: child.id
      })
  }
  events.sort((a, b) => {
    if (a.date && b.date) return compareFuzzyDates(a.date, b.date) || ORDER[a.type] - ORDER[b.type]
    if (a.date || b.date) return a.date ? -1 : 1
    return ORDER[a.type] - ORDER[b.type]
  })
  const birth: TimelineEvent[] =
    person.birth?.date || person.birth?.place
      ? [{ type: 'birth', date: person.birth.date, place: person.birth.place }]
      : []
  const death: TimelineEvent[] =
    person.death?.date || person.death?.place
      ? [{ type: 'death', date: person.death.date, place: person.death.place }]
      : []
  return [...birth, ...events, ...death]
}
