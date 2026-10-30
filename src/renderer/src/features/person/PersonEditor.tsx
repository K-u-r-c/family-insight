import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { checkPersonDates, checkTreeDates } from '@core/date/plausibility'
import type { Issue } from '@core/issues'
import { isLiving } from '@core/model/tree'
import type { LifeEvent, Person, Sex } from '@core/model/types'
import { Button, SegmentedControl } from '@renderer/components/ui'
import { updatePersonCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useIssueText } from '@renderer/i18n/issues'
import { CommitTextArea, CommitTextField } from './CommitField'
import { DateField } from './DateField'
import { EventsSection } from './EventsSection'
import { PhotoField } from './PhotoField'
import { PlaceField } from './PlaceField'
import styles from './PersonEditor.module.css'

const SEXES: Sex[] = ['female', 'male', 'other', 'unknown']
type Living = 'yes' | 'no' | 'unknown'

function mergeEvent(
  event: LifeEvent | undefined,
  patch: Partial<LifeEvent>
): LifeEvent | undefined {
  const next: LifeEvent = { ...event, ...patch }
  if (!next.date) delete next.date
  if (!next.place) delete next.place
  return Object.keys(next).length ? next : undefined
}

export function PersonEditor({ person }: { person: Person }): React.JSX.Element {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)!
  const dispatch = useDocument((s) => s.dispatch)
  const issueText = useIssueText()
  const [showBirthName, setShowBirthName] = useState(false)

  const update = (patch: Parameters<typeof updatePersonCommand>[1]): void => {
    dispatch(updatePersonCommand(person.id, patch))
  }

  const warnings = useMemo(
    () => [
      ...checkPersonDates(person),
      ...checkTreeDates(tree).filter(
        (i) => i.code === 'parent-younger-than-child' && i.personId === person.id
      )
    ],
    [person, tree]
  )
  const warningText = (code: string): string | undefined => {
    const w = warnings.find((i) => i.code === code)
    return w ? issueText(w) : undefined
  }
  const otherWarnings: Issue[] = warnings.filter((w) => w.code === 'parent-younger-than-child')

  const inferred = isLiving(person)
  const living: Living = inferred === true ? 'yes' : inferred === false ? 'no' : 'unknown'
  const birthNameVisible = showBirthName || !!person.birthSurname

  return (
    <form
      className={styles.form}
      onSubmit={(e) => e.preventDefault()}
      aria-label={t('person.editTitle')}
    >
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t('photo.title')}</legend>
        <PhotoField person={person} />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t('person.name')}</legend>
        <CommitTextField
          id="person-given-names"
          label={t('person.givenNames')}
          value={person.givenNames}
          onCommit={(givenNames) => update({ givenNames: givenNames.trim() })}
          autoFocus={!person.givenNames && !person.surname}
        />
        <CommitTextField
          label={t('person.surname')}
          value={person.surname}
          onCommit={(surname) => update({ surname: surname.trim() })}
        />
        {birthNameVisible ? (
          <CommitTextField
            label={t('person.birthSurname')}
            hint={t('person.birthSurnameHint')}
            value={person.birthSurname ?? ''}
            onCommit={(v) => update({ birthSurname: v.trim() || undefined })}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon={Plus}
            className={styles.inlineAdd}
            onClick={() => setShowBirthName(true)}
          >
            {t('person.addBirthSurname')}
          </Button>
        )}
        <div className={styles.field}>
          <span className={styles.label} aria-hidden="true">
            {t('person.sex')}
          </span>
          <SegmentedControl
            block
            label={t('person.sex')}
            value={person.sex}
            options={SEXES.map((value) => ({ value, label: t(`sex.${value}`) }))}
            onChange={(sex) => update({ sex })}
          />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t('person.birth')}</legend>
        <DateField
          label={t('person.birthDate')}
          value={person.birth?.date}
          onCommit={(date) => update({ birth: mergeEvent(person.birth, { date }) })}
        />
        <PlaceField
          label={t('person.birthPlace')}
          value={person.birth?.place ?? ''}
          onCommit={(place) => update({ birth: mergeEvent(person.birth, { place: place.trim() }) })}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t('person.lifeStatus')}</legend>
        <div className={styles.field}>
          <SegmentedControl
            block
            label={t('person.living')}
            value={living}
            options={[
              { value: 'yes', label: t('person.livingYes') },
              { value: 'no', label: t('person.livingNo') },
              { value: 'unknown', label: t('person.livingUnknown') }
            ]}
            onChange={(v: Living) =>
              update({ living: v === 'yes' ? true : v === 'no' ? false : undefined })
            }
          />
        </div>
        {person.living !== true && (
          <>
            <DateField
              label={t('person.deathDate')}
              value={person.death?.date}
              warning={warningText('death-before-birth') ?? warningText('unrealistic-age')}
              onCommit={(date) => update({ death: mergeEvent(person.death, { date }) })}
            />
            <PlaceField
              label={t('person.deathPlace')}
              value={person.death?.place ?? ''}
              onCommit={(place) =>
                update({ death: mergeEvent(person.death, { place: place.trim() }) })
              }
            />
          </>
        )}
        {person.living === true && warningText('unrealistic-age') && (
          <p className={styles.warning}>{warningText('unrealistic-age')}</p>
        )}
      </fieldset>

      {otherWarnings.length > 0 && (
        <div className={styles.warningBox} role="status">
          {otherWarnings.map((w, i) => (
            <p key={i}>{issueText(w)}</p>
          ))}
        </div>
      )}

      <EventsSection person={person} warnings={warnings} />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t('person.notes')}</legend>
        <CommitTextArea
          label={t('person.notes')}
          value={person.notes ?? ''}
          placeholder={t('person.notesPlaceholder')}
          onCommit={(notes) => update({ notes: notes.trim() ? notes : undefined })}
        />
      </fieldset>
    </form>
  )
}
