import { useState } from 'react'
import { CalendarPlus, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Issue } from '@core/issues'
import { EVENT_TYPES, type EventType, type Person, type PersonEvent } from '@core/model/types'
import {
  anchorBelow,
  Button,
  Icon,
  IconButton,
  Menu,
  Select,
  toast,
  type MenuAnchor,
  type MenuEntry
} from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { useIssueText } from '@renderer/i18n/issues'
import {
  addEventCommand,
  moveEventCommand,
  removeEventCommand,
  updateEventCommand
} from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { CommitTextArea, CommitTextField } from './CommitField'
import { DateField } from './DateField'
import { EVENT_CATEGORIES, EVENT_ICONS, eventName } from './eventTypes'
import { PlaceField } from './PlaceField'
import styles from './EventsSection.module.css'

interface EventsSectionProps {
  person: Person
  /** Plausibility warnings of the person (event warnings carry `params.eventId`). */
  warnings: Issue[]
}

/**
 * The life events of a person in the editor: add (type menu grouped by category), edit inline,
 * reorder with buttons and delete with undo. Every change is one undoable command.
 */
export function EventsSection({ person, warnings }: EventsSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const tr = (key: string): string => t(key as never) as unknown as string
  const format = useFormat()
  const issueText = useIssueText()
  const dispatch = useDocument((s) => s.dispatch)
  const [menu, setMenu] = useState<MenuAnchor | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const add = (type: EventType): void => {
    const event = dispatch(addEventCommand(person.id, { type }))
    setOpenId(event.id)
    requestAnimationFrame(() =>
      document.getElementById(`event-${event.id}-date`)?.querySelector('input')?.focus()
    )
  }
  const update = (event: PersonEvent, patch: Partial<Omit<PersonEvent, 'id'>>): void =>
    void dispatch(updateEventCommand(person.id, event.id, patch))
  const remove = (event: PersonEvent): void => {
    dispatch(removeEventCommand(person.id, event.id))
    toast({
      message: t('events.removed', { name: eventName(event, tr) }),
      action: { label: t('common.undo'), onClick: () => useDocument.getState().undo() }
    })
  }

  const entries: MenuEntry[] = EVENT_CATEGORIES.flatMap(({ key, types }, i) => [
    ...(i > 0 ? [{ type: 'separator' as const }] : []),
    { type: 'heading' as const, label: tr(`events.category.${key}`) },
    ...types.map((type) => ({
      label: tr(`events.type.${type}`),
      icon: EVENT_ICONS[type],
      onSelect: () => add(type)
    }))
  ])

  const summary = (event: PersonEvent): string =>
    [
      event.date && event.endDate
        ? `${format.date(event.date)} – ${format.date(event.endDate)}`
        : event.date
          ? format.date(event.date)
          : event.endDate
            ? `– ${format.date(event.endDate)}`
            : '',
      event.place,
      event.description
    ]
      .filter(Boolean)
      .join(' · ')

  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>{t('events.title')}</legend>
      {person.events.length === 0 && <p className={styles.empty}>{t('events.empty')}</p>}
      <ol className={styles.list}>
        {person.events.map((event, index) => {
          const open = openId === event.id
          const name = eventName(event, tr)
          const eventWarnings = warnings.filter((w) => w.params?.eventId === event.id)
          return (
            <li key={event.id} className={styles.event} data-open={open || undefined}>
              <div className={styles.header}>
                <span className={styles.icon}>
                  <Icon icon={EVENT_ICONS[event.type]} size={15} />
                </span>
                <button
                  type="button"
                  className={styles.title}
                  aria-expanded={open}
                  aria-controls={`event-${event.id}`}
                  onClick={() => setOpenId(open ? null : event.id)}
                >
                  <span className={styles.name}>{name}</span>
                  <span className={styles.summary}>{summary(event)}</span>
                </button>
                <div className={styles.actions}>
                  <IconButton
                    icon={ChevronUp}
                    size="sm"
                    label={t('events.moveUp', { name })}
                    disabled={index === 0}
                    onClick={() => dispatch(moveEventCommand(person.id, event.id, index - 1))}
                  />
                  <IconButton
                    icon={ChevronDown}
                    size="sm"
                    label={t('events.moveDown', { name })}
                    disabled={index === person.events.length - 1}
                    onClick={() => dispatch(moveEventCommand(person.id, event.id, index + 1))}
                  />
                  <IconButton
                    icon={Pencil}
                    size="sm"
                    label={t('events.edit', { name })}
                    onClick={() => setOpenId(open ? null : event.id)}
                  />
                  <IconButton
                    icon={Trash2}
                    size="sm"
                    label={t('events.remove', { name })}
                    onClick={() => remove(event)}
                  />
                </div>
              </div>
              {eventWarnings.map((w, i) => (
                <p key={i} className={styles.warning} role="status">
                  {issueText(w)}
                </p>
              ))}
              {open && (
                <div id={`event-${event.id}`} className={styles.fields}>
                  <Select
                    label={t('events.typeLabel')}
                    value={event.type}
                    options={EVENT_TYPES.map((type) => ({
                      value: type,
                      label: tr(`events.type.${type}`)
                    }))}
                    onChange={(type) => update(event, { type })}
                  />
                  {event.type === 'custom' && (
                    <CommitTextField
                      label={t('events.customType')}
                      placeholder={t('events.customTypePlaceholder')}
                      value={event.customType ?? ''}
                      onCommit={(v) => update(event, { customType: v.trim() || undefined })}
                    />
                  )}
                  <div id={`event-${event.id}-date`}>
                    <DateField
                      label={t('events.date')}
                      value={event.date}
                      onCommit={(date) => update(event, { date })}
                    />
                  </div>
                  <DateField
                    label={t('events.endDate')}
                    value={event.endDate}
                    onCommit={(endDate) => update(event, { endDate })}
                  />
                  <PlaceField
                    label={t('events.place')}
                    value={event.place ?? ''}
                    onCommit={(place) => update(event, { place: place.trim() || undefined })}
                  />
                  <CommitTextField
                    label={t('events.description')}
                    placeholder={t('events.descriptionPlaceholder')}
                    value={event.description ?? ''}
                    onCommit={(v) => update(event, { description: v.trim() || undefined })}
                  />
                  <CommitTextArea
                    label={t('events.notes')}
                    value={event.notes ?? ''}
                    onCommit={(v) => update(event, { notes: v.trim() ? v : undefined })}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <Button
        variant="ghost"
        size="sm"
        icon={CalendarPlus}
        className={styles.add}
        aria-haspopup="menu"
        aria-expanded={menu !== null}
        onClick={(e) => setMenu(anchorBelow(e.currentTarget))}
      >
        {t('events.add')}
      </Button>
      <Menu anchor={menu} entries={entries} onClose={() => setMenu(null)} label={t('events.add')} />
    </fieldset>
  )
}
