import { useState } from 'react'
import { Download, ImageIcon, Trash2, UserPlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Hint } from '@renderer/features/hints/Hint'
import { mediaUsage, peopleOfMedia } from '@core/model/media'
import { displayName } from '@core/model/tree'
import type { MediaItem } from '@core/model/types'
import { Button, confirm, Dialog, IconButton, toast } from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { exportMediaFile } from '@renderer/services/media'
import {
  removeMediaCommand,
  setMediaPeopleCommand,
  updateMediaCommand
} from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { CommitTextArea, CommitTextField } from '@renderer/features/person/CommitField'
import { DateField } from '@renderer/features/person/DateField'
import { PersonPickerDialog } from '@renderer/features/person/PersonPickerDialog'
import { mediaTitle } from './MediaThumb'
import styles from './Media.module.css'

/** Title, date, place and description of a media item, and the people it is shown on. */
export function MediaDetailsDialog(): React.JSX.Element | null {
  const id = useWorkspaceUi((s) => s.editingMedia)
  const item = useDocument((s) => (id ? s.tree?.media[id] : undefined))
  if (!item) return null
  return <DetailsDialog key={item.id} item={item} />
}

function DetailsDialog({ item }: { item: MediaItem }): React.JSX.Element | null {
  const { t } = useTranslation()
  const format = useFormat()
  const tree = useDocument((s) => s.tree)
  const dispatch = useDocument((s) => s.dispatch)
  const [picking, setPicking] = useState(false)
  if (!tree) return null
  const close = (): void => useWorkspaceUi.getState().setEditingMedia(null)
  const people = peopleOfMedia(tree, item.id)
  // The last reference can't be removed here (the item would be unreachable): delete it instead.
  const canHide = mediaUsage(tree, item.id) > 1
  const update = (patch: Parameters<typeof updateMediaCommand>[1]): void =>
    void dispatch(updateMediaCommand(item.id, patch))
  const setPeople = (ids: string[]): void => void dispatch(setMediaPeopleCommand(item.id, ids))
  const name = (personId: string): string =>
    displayName(tree.persons[personId]!) || t('person.unnamed')

  const remove = async (): Promise<void> => {
    const used = mediaUsage(tree, item.id)
    if (used) {
      const ok = await confirm({
        title: t('media.deleteTitle', { title: mediaTitle(item) }),
        message: t('media.deleteUsed', { count: used }),
        confirmLabel: t('common.delete'),
        danger: true
      })
      if (!ok) return
    }
    close()
    useWorkspaceUi.getState().closeViewer()
    dispatch(removeMediaCommand(item.id))
    toast({
      message: t('media.deleted', { title: mediaTitle(item) }),
      action: { label: t('common.undo'), onClick: () => useDocument.getState().undo() }
    })
  }

  const info = [
    item.mime === 'application/pdf' ? 'PDF' : item.mime.slice(6).toUpperCase(),
    item.width && item.height ? `${item.width} × ${item.height}` : '',
    item.size ? format.fileSize(item.size) : ''
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Dialog
      hint={<Hint id="media" />}
      open
      wide
      onClose={close}
      icon={ImageIcon}
      title={t('media.detailsTitle')}
      description={`${item.fileName} · ${info}`}
      footer={
        <Button variant="primary" onClick={close}>
          {t('common.done')}
        </Button>
      }
    >
      <div className={styles.fields}>
        <CommitTextField
          label={t('media.title')}
          placeholder={t('media.titlePlaceholder')}
          value={item.title ?? ''}
          onCommit={(v) => update({ title: v.trim() || undefined })}
        />
        <div className={styles.row}>
          <DateField
            label={t('media.date')}
            value={item.date}
            onCommit={(date) => update({ date })}
          />
          <CommitTextField
            label={t('media.place')}
            value={item.place ?? ''}
            onCommit={(v) => update({ place: v.trim() || undefined })}
          />
        </div>
        <CommitTextArea
          label={t('media.description')}
          placeholder={t('media.descriptionPlaceholder')}
          value={item.description ?? ''}
          onCommit={(v) => update({ description: v.trim() ? v : undefined })}
        />
        <section aria-labelledby="media-people">
          <h3 id="media-people" className={styles.subheading}>
            {t('media.shownOn')}
          </h3>
          <div className={styles.people}>
            {people.map((p) => (
              <span key={p.id} className={styles.chip}>
                {name(p.id)}
                {canHide && (
                  <IconButton
                    icon={X}
                    size="sm"
                    label={t('media.hideFrom', { name: name(p.id) })}
                    onClick={() => setPeople(people.filter((o) => o.id !== p.id).map((o) => o.id))}
                  />
                )}
              </span>
            ))}
            <Button size="sm" variant="ghost" icon={UserPlus} onClick={() => setPicking(true)}>
              {t('media.addPerson')}
            </Button>
          </div>
          {people.length === 0 && <p className={styles.fileInfo}>{t('media.shownOnNobody')}</p>}
        </section>
        <div className={styles.people}>
          <Button size="sm" icon={Download} onClick={() => void exportMediaFile(item)}>
            {t('media.export')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            className={styles.danger}
            onClick={() => void remove()}
          >
            {t('media.delete')}
          </Button>
        </div>
      </div>
      <PersonPickerDialog
        open={picking}
        title={t('media.addPersonTitle')}
        exclude={new Set(people.map((p) => p.id))}
        onPick={(person) => {
          setPicking(false)
          setPeople([...people.map((p) => p.id), person.id])
        }}
        onClose={() => setPicking(false)}
      />
    </Dialog>
  )
}
