import { useEffect } from 'react'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { displayName, isLiving } from '@core/model/tree'
import { Button, IconButton } from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { Panel } from '@renderer/features/workspace/Panel'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { deletePersonWithConfirm } from './deletePerson'
import { FamilySection } from './FamilySection'
import { PersonDetails, useAgeLabel } from './PersonDetails'
import { PersonEditor } from './PersonEditor'
import { RootRelationship } from '@renderer/features/kinship/RootRelationship'
import styles from './PersonPanel.module.css'
import { PersonAvatar } from '@renderer/features/person/PersonAvatar'

/** Right-hand panel for the selected person: read-only details or the editor. */
export function PersonPanel(): React.JSX.Element | null {
  const { t } = useTranslation()
  const format = useFormat()
  const person = useDocument((s) =>
    s.selectedPersonId ? s.tree?.persons[s.selectedPersonId] : undefined
  )
  const select = useDocument((s) => s.select)
  const editingId = useWorkspaceUi((s) => s.editingId)
  const setEditing = useWorkspaceUi((s) => s.setEditing)
  const age = useAgeLabel(
    person ?? {
      id: '',
      givenNames: '',
      surname: '',
      sex: 'unknown',
      events: [],
      createdAt: '',
      updatedAt: ''
    }
  )
  // A new (unnamed) person opens in edit mode and stays there while being named.
  const unnamedId = person && !person.givenNames && !person.surname ? person.id : null
  useEffect(() => {
    if (unnamedId && useWorkspaceUi.getState().editingId !== unnamedId) setEditing(unnamedId)
  }, [unnamedId, setEditing])
  if (!person) return null

  const unnamed = !person.givenNames && !person.surname
  const editing = editingId === person.id || unnamed
  const name = displayName(person) || t('person.unnamed')
  const lifespan = format.lifespan(person)

  return (
    <Panel
      label={name}
      title={editing ? t('person.editTitle') : t('person.details')}
      onClose={() => select(null)}
      actions={
        <IconButton
          icon={Trash2}
          size="sm"
          label={t('person.delete')}
          shortcut="Del"
          onClick={() => void deletePersonWithConfirm(person.id)}
        />
      }
    >
      <div className={styles.header}>
        <PersonAvatar person={person} size={64} deceased={isLiving(person) === false} />
        <div className={styles.headerText}>
          <h3 className={styles.name}>{name}</h3>
          {person.birthSurname && (
            <p className={styles.sub}>{t('person.born', { surname: person.birthSurname })}</p>
          )}
          {(lifespan || age) && (
            <p className={styles.sub}>{[lifespan, age].filter(Boolean).join(' · ')}</p>
          )}
          <RootRelationship person={person} />
        </div>
        {editing ? (
          !unnamed && (
            <Button size="sm" variant="primary" icon={Check} onClick={() => setEditing(null)}>
              {t('common.done')}
            </Button>
          )
        ) : (
          <Button size="sm" icon={Pencil} onClick={() => setEditing(person.id)}>
            {t('common.edit')}
          </Button>
        )}
      </div>
      {editing && <PersonEditor key={person.id} person={person} />}
      <FamilySection person={person} />
      {!editing && <PersonDetails person={person} />}
    </Panel>
  )
}
