import {
  Baby,
  CalendarDays,
  Cross,
  Heart,
  HeartCrack,
  Sparkles,
  type LucideIcon
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ageAt } from '@core/date/fuzzyDate'
import { compareText } from '@core/text'
import { displayName, isLiving } from '@core/model/tree'
import type { Person } from '@core/model/types'
import { buildTimeline, type TimelineEvent } from '@core/timeline'
import { getCitations, sourcesOfPerson, type CitationTarget } from '@core/model/sources'
import { Icon } from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { EVENT_ICONS, eventName } from './eventTypes'
import styles from './PersonDetails.module.css'
import sourceStyles from '@renderer/features/sources/Sources.module.css'

const ICONS: Record<TimelineEvent['type'], LucideIcon> = {
  birth: Sparkles,
  partnership: Heart,
  'partnership-end': HeartCrack,
  child: Baby,
  event: CalendarDays,
  death: Cross
}

/** "78 years" / "aged 78 at death", localized and pluralised. */
export function useAgeLabel(person: Person): string {
  const { t } = useTranslation()
  const living = isLiving(person)
  const birth = person.birth?.date
  if (!birth) return ''
  if (living === false) {
    const age = person.death?.date ? ageAt(birth, person.death.date) : undefined
    if (!age) return ''
    return t(age.approximate ? 'person.ageAtDeathApprox' : 'person.ageAtDeath', {
      count: age.years
    })
  }
  if (living === undefined && !person.death) {
    const age = ageAt(birth)
    if (!age || age.years > 110) return ''
    return t(age.approximate ? 'person.ageApprox' : 'person.age', { count: age.years })
  }
  const age = ageAt(birth)
  return age ? t(age.approximate ? 'person.ageApprox' : 'person.age', { count: age.years }) : ''
}

/** Read-only life overview: timeline of events and notes. */
export function PersonDetails({ person }: { person: Person }): React.JSX.Element {
  const { t } = useTranslation()
  const format = useFormat()
  const tree = useDocument((s) => s.tree)!
  const select = useDocument((s) => s.select)
  const events = buildTimeline(tree, person.id)
  const sources = [...sourcesOfPerson(tree, person.id)]
    .map((id) => tree.sources[id])
    .filter((s) => s !== undefined)
    .sort((a, b) => compareText(a.title, b.title, format.language))

  const nameOf = (id: string): string =>
    displayName(tree.persons[id] ?? { givenNames: '', surname: '' }) || t('person.unnamed')
  const Link = ({ id }: { id: string }): React.JSX.Element => (
    <button type="button" className={styles.link} onClick={() => select(id)}>
      {nameOf(id)}
    </button>
  )

  const label = (e: TimelineEvent): React.ReactNode => {
    switch (e.type) {
      case 'birth':
        return t('timeline.birth')
      case 'death':
        return t('timeline.death')
      case 'partnership':
        return (
          <>
            {t(`timeline.partnership.${e.kind}`)} <Link id={e.partnerId} />
          </>
        )
      case 'partnership-end':
        return (
          <>
            {e.reason ? t(`timeline.end.${e.reason}`) : t('timeline.end.other')}{' '}
            <Link id={e.partnerId} />
          </>
        )
      case 'child':
        return (
          <>
            {t('timeline.child')} <Link id={e.childId} />
          </>
        )
      case 'event':
        return [
          eventName(e.event, (key) => t(key as never) as unknown as string),
          e.event.description
        ]
          .filter(Boolean)
          .join(': ')
    }
  }

  return (
    <div className={styles.details}>
      {events.length > 0 ? (
        <section>
          <h4 className={styles.heading}>{t('timeline.title')}</h4>
          <ol className={styles.timeline}>
            {events.map((e, i) => (
              <li key={i} className={styles.event} data-type={e.type}>
                <span className={styles.dot}>
                  <Icon
                    icon={e.type === 'event' ? EVENT_ICONS[e.event.type] : ICONS[e.type]}
                    size={13}
                  />
                </span>
                <div className={styles.eventBody}>
                  <span className={styles.eventDate}>
                    {e.type === 'event' && e.event.endDate
                      ? `${e.date ? format.date(e.date) : '…'} – ${format.date(e.event.endDate)}`
                      : e.date
                        ? format.date(e.date)
                        : t('timeline.unknownDate')}
                  </span>
                  <span className={styles.eventLabel}>
                    {label(e)}
                    <Marker target={targetOf(e, person.id)} />
                  </span>
                  {e.place && <span className={styles.eventPlace}>{e.place}</span>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <p className={styles.hint}>{t('timeline.empty')}</p>
      )}
      {person.notes && (
        <section>
          <h4 className={styles.heading}>{t('person.notes')}</h4>
          <p className={`${styles.notes} selectable`}>{person.notes}</p>
        </section>
      )}
      {sources.length > 0 && (
        <section>
          <h4 className={styles.heading}>
            {t('sources.general')} <Marker target={{ kind: 'person', personId: person.id }} />
          </h4>
          <ul className={styles.sources}>
            {sources.map((source) => (
              <li key={source.id}>
                <button
                  type="button"
                  className={sourceStyles.linkButton}
                  onClick={() => useWorkspaceUi.getState().openSources(source.id)}
                >
                  {source.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/** The fact behind a timeline entry, for its citations (children are other people's facts). */
function targetOf(e: TimelineEvent, personId: string): CitationTarget | null {
  switch (e.type) {
    case 'birth':
    case 'death':
      return { kind: e.type, personId }
    case 'event':
      return { kind: 'event', personId, eventId: e.event.id }
    case 'partnership':
      return { kind: 'partnership-start', relationshipId: e.relationshipId }
    case 'partnership-end':
      return { kind: 'partnership-end', relationshipId: e.relationshipId }
    case 'child':
      return null
  }
}

/** Superscript count of a fact's sources; opens them. Nothing when the fact has none. */
function Marker({ target }: { target: CitationTarget | null }): React.JSX.Element | null {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)
  if (!tree || !target) return null
  const count = getCitations(tree, target).length
  if (!count) return null
  return (
    <button
      type="button"
      className={sourceStyles.marker}
      aria-label={t('sources.markerLabel', { count })}
      title={t('sources.markerLabel', { count })}
      onClick={() => useWorkspaceUi.getState().setCiting(target)}
    >
      {count}
    </button>
  )
}
