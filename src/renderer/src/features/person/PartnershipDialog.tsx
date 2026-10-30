import { useTranslation } from 'react-i18next'
import { displayName } from '@core/model/tree'
import type {
  LifeEvent,
  PartnershipEndReason,
  PartnershipKind,
  PartnershipRelationship
} from '@core/model/types'
import { Button, Dialog, Select } from '@renderer/components/ui'
import { updateRelationshipCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { CiteButton } from '@renderer/features/sources/CiteButton'
import { DateField } from './DateField'
import { PlaceField } from './PlaceField'
import { runCommand } from './relationActions'
import styles from './PersonEditor.module.css'

const KINDS: PartnershipKind[] = ['marriage', 'partnership', 'engagement', 'other']
const REASONS: (PartnershipEndReason | '')[] = ['', 'divorce', 'separation', 'death', 'other']

function merge<T extends LifeEvent>(event: T | undefined, patch: Partial<T>): T | undefined {
  const next = { ...event, ...patch } as T & Record<string, unknown>
  for (const key of Object.keys(next))
    if (next[key] === undefined || next[key] === '') delete next[key]
  return Object.keys(next).length ? next : undefined
}

/** Edits the details of a partnership (kind, start and end). Changes apply immediately. */
export function PartnershipDialog({
  relationshipId,
  onClose
}: {
  relationshipId: string
  onClose: () => void
}): React.JSX.Element | null {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)
  const rel = tree?.relationships[relationshipId]
  if (!tree || !rel || rel.type !== 'partnership') return null
  const [a, b] = rel.partnerIds.map((id) => displayName(tree.persons[id]!) || t('person.unnamed'))
  const update = (patch: Partial<Omit<PartnershipRelationship, 'id' | 'type'>>): void =>
    void runCommand(updateRelationshipCommand(rel.id, patch))

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('relations.editPartnership')}
      description={`${a} & ${b}`}
      footer={
        <Button variant="primary" onClick={onClose}>
          {t('common.done')}
        </Button>
      }
    >
      <div className={styles.dialogForm}>
        <Select
          label={t('relations.partnershipKind')}
          value={rel.kind}
          options={KINDS.map((k) => ({ value: k, label: t(`relations.partnership.${k}`) }))}
          onChange={(kind) => update({ kind })}
        />
        <DateField
          label={t('relations.startDate')}
          value={rel.start?.date}
          onCommit={(date) => update({ start: merge(rel.start, { date }) })}
        />
        <PlaceField
          label={t('relations.startPlace')}
          value={rel.start?.place ?? ''}
          onCommit={(place) => update({ start: merge(rel.start, { place: place.trim() }) })}
        />
        <p className={styles.citeLine}>
          {t('sources.general')}{' '}
          <CiteButton target={{ kind: 'partnership-start', relationshipId: rel.id }} />
        </p>
        <DateField
          label={t('relations.endDate')}
          value={rel.end?.date}
          onCommit={(date) => update({ end: merge(rel.end, { date }) })}
        />
        <Select
          label={t('relations.endReason')}
          value={rel.end?.reason ?? ''}
          options={REASONS.map((r) => ({
            value: r,
            label: r ? t(`relations.reason.${r}`) : t('relations.reason.none')
          }))}
          onChange={(reason) => update({ end: merge(rel.end, { reason: reason || undefined }) })}
        />
        <p className={styles.citeLine}>
          {t('sources.general')}{' '}
          <CiteButton target={{ kind: 'partnership-end', relationshipId: rel.id }} />
        </p>
      </div>
    </Dialog>
  )
}
