import { useState } from 'react'
import { ArrowLeftRight, ChevronRight, Waypoints } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Hint } from '@renderer/features/hints/Hint'
import { displayName, isLiving } from '@core/model/tree'
import type { Person, PersonId } from '@core/model/types'
import { Button, Dialog, IconButton } from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { cx } from '@renderer/lib/cx'
import { PersonAvatar } from '@renderer/features/person/PersonAvatar'
import { PersonPickerDialog } from '@renderer/features/person/PersonPickerDialog'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { showPathOnTree } from './showPath'
import { useRelationships } from './useRelationships'
import styles from './RelationshipDialog.module.css'

const NONE = new Set<PersonId>()

/** One of the two people: shows who is chosen and opens the person picker. */
function PersonSlot({
  id,
  label,
  person,
  onPick
}: {
  id: string
  label: string
  person: Person | undefined
  onPick: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const format = useFormat()
  return (
    <div className={styles.slot}>
      <span id={id} className={styles.slotLabel}>
        {label}
      </span>
      <button
        type="button"
        className={cx(styles.slotButton, !person && styles.slotEmpty)}
        aria-labelledby={id}
        aria-describedby={`${id}-value`}
        onClick={onPick}
      >
        {person && <PersonAvatar person={person} size={36} deceased={isLiving(person) === false} />}
        <span id={`${id}-value`} className={styles.slotText}>
          <span className={styles.slotName}>
            {person ? displayName(person) || t('person.unnamed') : t('kinship.choose')}
          </span>
          {person && <span className={styles.slotMeta}>{format.lifespan(person)}</span>}
        </span>
      </button>
    </div>
  )
}

/** Relationship calculator: how is `b` (the person) related to `a` (the reference)? */
export function RelationshipDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)!
  const initial = useWorkspaceUi((s) => s.relationship)
  const [a, setA] = useState<PersonId | null>(initial.a)
  const [b, setB] = useState<PersonId | null>(initial.b)
  const [picking, setPicking] = useState<'a' | 'b' | null>(null)
  // Which of several relationships is shown (back to the first when the people change).
  const pair = `${a}\n${b}`
  const [choice, setChoice] = useState({ pair, index: 0 })
  const shown = choice.pair === pair ? choice.index : 0
  const setShown = (index: number): void => setChoice({ pair, index })
  const results = useRelationships(a, b)
  const current = results[shown] ?? results[0]
  // From the person to the reference, in the order of the sentence.
  const path = current ? [...current.kinship.path].reverse() : []
  const personA = a ? tree.persons[a] : undefined
  const personB = b ? tree.persons[b] : undefined
  const nameOf = (id: PersonId): string => {
    const person = tree.persons[id]
    return (person && displayName(person)) || t('person.unnamed')
  }

  const message =
    !personA || !personB
      ? t('kinship.hint')
      : a === b
        ? t('kinship.same')
        : !current
          ? t('kinship.unrelated', { a: nameOf(a!), b: nameOf(b!) })
          : current.sentence

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        icon={Waypoints}
        title={t('kinship.title')}
        description={t('kinship.description')}
        wide
        hint={<Hint id="kinship" />}
        footer={
          <>
            <Button onClick={onClose}>{t('common.close')}</Button>
            <Button
              variant="primary"
              icon={Waypoints}
              disabled={!current}
              onClick={() => {
                if (!current) return
                showPathOnTree(path)
                onClose()
              }}
            >
              {t('kinship.showOnTree')}
            </Button>
          </>
        }
      >
        {/* Read left to right like the result: "[person] is the cousin of [reference]". */}
        <div className={styles.people}>
          <PersonSlot
            id="kinship-person"
            label={t('kinship.person')}
            person={personB}
            onPick={() => setPicking('b')}
          />
          <IconButton
            className={styles.swap}
            icon={ArrowLeftRight}
            label={t('kinship.swap')}
            disabled={!a && !b}
            onClick={() => {
              setA(b)
              setB(a)
            }}
          />
          <PersonSlot
            id="kinship-reference"
            label={t('kinship.reference')}
            person={personA}
            onPick={() => setPicking('a')}
          />
        </div>
        <div className={styles.result}>
          <p
            className={cx(styles.sentence, !current && styles.sentenceMuted)}
            role="status"
            aria-live="polite"
            data-testid="kinship-sentence"
          >
            {message}
          </p>
          {path.length > 1 && (
            <ol className={styles.path} aria-label={t('kinship.path')}>
              {path.map((id, i) => {
                const person = tree.persons[id]
                return (
                  <li key={`${id}-${i}`} className={styles.step}>
                    {i > 0 && (
                      <ChevronRight className={styles.arrow} size={14} aria-hidden="true" />
                    )}
                    {person && (
                      <PersonAvatar
                        person={person}
                        size={24}
                        deceased={isLiving(person) === false}
                      />
                    )}
                    <span className={styles.stepName}>{nameOf(id)}</span>
                  </li>
                )
              })}
            </ol>
          )}
          {results.length > 1 && (
            <div className={styles.alternatives}>
              <h3 className={styles.alternativesTitle}>{t('kinship.alternatives')}</h3>
              <ul>
                {results.map((r, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={cx(styles.alternative, i === shown && styles.alternativeShown)}
                      aria-pressed={i === shown}
                      onClick={() => setShown(i)}
                    >
                      {r.sentence}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Dialog>
      <PersonPickerDialog
        open={picking !== null}
        title={picking === 'a' ? t('kinship.reference') : t('kinship.person')}
        exclude={NONE}
        onPick={(person) => {
          if (picking === 'a') setA(person.id)
          else setB(person.id)
          setPicking(null)
        }}
        onClose={() => setPicking(null)}
      />
    </>
  )
}
