import { useState } from 'react'
import { BookPlus, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { compareText } from '@core/text'
import { getCitations, type CitationTarget } from '@core/model/sources'
import { CITATION_QUALITIES, type Citation, type CitationQuality } from '@core/model/types'
import { Button, Dialog, IconButton, Select, TextField, toast } from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import {
  addCitationCommand,
  addSourceCommand,
  removeCitationCommand,
  updateCitationCommand
} from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { CommitTextArea, CommitTextField } from '@renderer/features/person/CommitField'
import { DateField } from '@renderer/features/person/DateField'
import { factLabel } from './facts'
import styles from './Sources.module.css'

/** Lists, adds, edits and removes the citations of one fact. Changes apply immediately. */
export function CitationsDialog({
  target,
  onClose
}: {
  target: CitationTarget
  onClose: () => void
}): React.JSX.Element | null {
  const { t } = useTranslation()
  const format = useFormat()
  const tree = useDocument((s) => s.tree)
  const dispatch = useDocument((s) => s.dispatch)
  const [openId, setOpenId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  if (!tree) return null
  const citations = getCitations(tree, target)
  const sources = Object.values(tree.sources).sort((a, b) =>
    compareText(a.title, b.title, format.language)
  )

  const cite = (sourceId: string): void => {
    const citation = dispatch(addCitationCommand(target, { sourceId }))
    setOpenId(citation.id)
  }
  const createAndCite = (): void => {
    const title = newTitle.trim()
    if (!title) return
    const source = dispatch(addSourceCommand({ title }))
    setNewTitle('')
    cite(source.id)
  }
  const update = (citation: Citation, patch: Partial<Omit<Citation, 'id'>>): void =>
    void dispatch(updateCitationCommand(target, citation.id, patch))
  const remove = (citation: Citation): void => {
    dispatch(removeCitationCommand(target, citation.id))
    toast({
      message: t('sources.citationRemoved'),
      action: { label: t('common.undo'), onClick: () => useDocument.getState().undo() }
    })
  }
  const qualityLabel = (q: CitationQuality): string => t(`sources.quality.${q}`)

  return (
    <Dialog
      open
      wide
      onClose={onClose}
      icon={BookPlus}
      title={t('sources.citationsTitle')}
      description={factLabel(tree, target, t as never)}
      footer={
        <>
          <Button onClick={() => useWorkspaceUi.getState().openSources()}>
            {t('sources.manage')}
          </Button>
          <Button variant="primary" onClick={onClose}>
            {t('common.done')}
          </Button>
        </>
      }
    >
      <div className={styles.citations}>
        {citations.length === 0 && <p className={styles.muted}>{t('sources.noCitations')}</p>}
        <ol className={styles.list}>
          {citations.map((citation) => {
            const source = tree.sources[citation.sourceId]
            const open = openId === citation.id
            const details = [
              citation.page,
              citation.quality && qualityLabel(citation.quality),
              citation.date && format.date(citation.date)
            ]
              .filter(Boolean)
              .join(' · ')
            return (
              <li key={citation.id} className={styles.item} data-open={open || undefined}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemText}>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => useWorkspaceUi.getState().openSources(citation.sourceId)}
                    >
                      {source?.title ?? '?'}
                    </button>
                    {details && <span className={styles.muted}>{details}</span>}
                  </div>
                  <IconButton
                    icon={Pencil}
                    size="sm"
                    label={t('sources.editCitation', { source: source?.title ?? '' })}
                    onClick={() => setOpenId(open ? null : citation.id)}
                  />
                  <IconButton
                    icon={Trash2}
                    size="sm"
                    label={t('sources.removeCitation', { source: source?.title ?? '' })}
                    onClick={() => remove(citation)}
                  />
                </div>
                {citation.text && !open && (
                  <blockquote className={styles.quote}>{citation.text}</blockquote>
                )}
                {open && (
                  <div className={styles.fields}>
                    <Select
                      label={t('sources.source')}
                      value={citation.sourceId}
                      options={sources.map((s) => ({ value: s.id, label: s.title }))}
                      onChange={(sourceId) => update(citation, { sourceId })}
                    />
                    <div className={styles.row}>
                      <CommitTextField
                        label={t('sources.page')}
                        placeholder={t('sources.pagePlaceholder')}
                        value={citation.page ?? ''}
                        onCommit={(v) => update(citation, { page: v.trim() || undefined })}
                      />
                      <Select
                        label={t('sources.qualityLabel')}
                        value={citation.quality ?? ''}
                        options={[
                          { value: '', label: t('sources.quality.none') },
                          ...CITATION_QUALITIES.map((q) => ({ value: q, label: qualityLabel(q) }))
                        ]}
                        onChange={(q) =>
                          update(citation, {
                            quality: (q || undefined) as CitationQuality | undefined
                          })
                        }
                      />
                    </div>
                    <DateField
                      label={t('sources.date')}
                      value={citation.date}
                      onCommit={(date) => update(citation, { date })}
                    />
                    <CommitTextArea
                      label={t('sources.text')}
                      placeholder={t('sources.textPlaceholder')}
                      value={citation.text ?? ''}
                      onCommit={(v) => update(citation, { text: v.trim() ? v : undefined })}
                    />
                    <CommitTextArea
                      label={t('sources.notes')}
                      value={citation.notes ?? ''}
                      onCommit={(v) => update(citation, { notes: v.trim() ? v : undefined })}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <section className={styles.addCitation} aria-label={t('sources.addCitation')}>
          <h3 className={styles.subheading}>{t('sources.addCitation')}</h3>
          {sources.length > 0 && (
            <Select
              label={t('sources.chooseSource')}
              value=""
              options={[
                { value: '', label: t('sources.choosePlaceholder') },
                ...sources.map((s) => ({ value: s.id, label: s.title }))
              ]}
              onChange={(id) => id && cite(id)}
            />
          )}
          <form
            className={styles.row}
            onSubmit={(e) => {
              e.preventDefault()
              createAndCite()
            }}
          >
            <TextField
              label={sources.length ? t('sources.orNewSource') : t('sources.newSourceTitle')}
              placeholder={t('sources.titlePlaceholder')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Button
              type="submit"
              icon={BookPlus}
              disabled={!newTitle.trim()}
              className={styles.end}
            >
              {t('sources.createAndCite')}
            </Button>
          </form>
        </section>
      </div>
    </Dialog>
  )
}
