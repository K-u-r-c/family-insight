import { useTranslation } from 'react-i18next'
import { displayName } from '@core/model/tree'
import { Avatar } from '@renderer/components/ui'
import { Panel } from '@renderer/features/workspace/Panel'
import { useDocument } from '@renderer/store/document'
import { PersonEditor } from './PersonEditor'
import styles from './PersonPanel.module.css'

/** Right-hand panel for the selected person. */
export function PersonPanel(): React.JSX.Element | null {
  const { t } = useTranslation()
  const person = useDocument((s) =>
    s.selectedPersonId ? s.tree?.persons[s.selectedPersonId] : undefined
  )
  const select = useDocument((s) => s.select)
  if (!person) return null
  const name = displayName(person) || t('person.unnamed')
  return (
    <Panel label={name} title={t('person.details')} onClose={() => select(null)}>
      <div className={styles.header}>
        <Avatar
          givenNames={person.givenNames}
          surname={person.surname}
          sex={person.sex}
          photo={person.photo}
          size={56}
        />
        <div className={styles.headerText}>
          <h3 className={styles.name}>{name}</h3>
          {person.birthSurname && (
            <p className={styles.sub}>{t('person.born', { surname: person.birthSurname })}</p>
          )}
        </div>
      </div>
      <PersonEditor key={person.id} person={person} />
    </Panel>
  )
}
