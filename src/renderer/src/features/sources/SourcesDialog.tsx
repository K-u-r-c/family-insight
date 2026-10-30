import { useMemo, useState } from 'react'
import { BookOpen, Library, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getCitationsForSource } from '@core/model/sources'
import type { Source } from '@core/model/types'
import { compareText, matchesQuery } from '@core/text'
import {
  Button,
  confirm,
  Dialog,
  EmptyState,
  Select,
  TextField,
  toast
} from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import {
  addRepositoryCommand,
  addSourceCommand,
  removeSourceCommand,
  updateSourceCommand
} from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { CommitTextArea, CommitTextField } from '@renderer/features/person/CommitField'
import { MediaStrip } from '@renderer/features/media/MediaStrip'
import { factLabel, factPerson } from './facts'
import styles from './Sources.module.css'

/** All sources of the tree: search, create, edit, delete, repositories and what cites them. */
export function SourcesDialog({ onClose }: { onClose: () => void }): React.JSX.Element | null {
  const { t } = useTranslation()
  const format = useFormat()
  const tree = useDocument((s) => s.tree)
  const dispatch = useDocument((s) => s.dispatch)
  const initial = useWorkspaceUi((s) => s.sourceId)
  const [selectedId, setSelectedId] = useState<string | null>(initial)
  const [query, setQuery] = useState('')
  const [newRepository, setNewRepository] = useState('')

  const sources = useMemo(() => {
    if (!tree) return []
    return Object.values(tree.sources)
      .filter((s) => matchesQuery(`${s.title} ${s.author ?? ''}`, query))
      .sort((a, b) => compareText(a.title, b.title, format.language))
  }, [tree, query, format.language])
  if (!tree) return null

  const source: Source | undefined = selectedId ? tree.sources[selectedId] : undefined
  const citedBy = source ? getCitationsForSource(tree, source.id) : []
  const citationMedia = [...new Set(citedBy.flatMap(({ citation }) => citation.mediaIds ?? []))]
  const repositories = Object.values(tree.repositories).sort((a, b) =>
    compareText(a.name, b.name, format.language)
  )

  const create = (): void => {
    const created = dispatch(addSourceCommand({ title: t('sources.untitled') }))
    setQuery('')
    setSelectedId(created.id)
    requestAnimationFrame(() => {
      const input = document.getElementById('source-title') as HTMLInputElement | null
      input?.focus()
      input?.select()
    })
  }
  const update = (patch: Partial<Omit<Source, 'id'>>): void => {
    if (source) dispatch(updateSourceCommand(source.id, patch))
  }
  const addRepository = (): void => {
    const name = newRepository.trim()
    if (!name || !source) return
    const repository = dispatch(addRepositoryCommand({ name }))
    update({ repositoryId: repository.id })
    setNewRepository('')
  }
  const remove = async (): Promise<void> => {
    if (!source) return
    if (citedBy.length) {
      const ok = await confirm({
        title: t('sources.deleteTitle', { title: source.title }),
        message: t('sources.deleteCited', { count: citedBy.length }),
        confirmLabel: t('common.delete'),
        danger: true
      })
      if (!ok) return
    }
    dispatch(removeSourceCommand(source.id))
    setSelectedId(null)
    toast({
      message: t('sources.deleted', { title: source.title }),
      action: { label: t('common.undo'), onClick: () => useDocument.getState().undo() }
    })
  }
  const counts = (id: string): number => getCitationsForSource(tree, id).length

  return (
    <Dialog
      open
      wide
      onClose={onClose}
      icon={Library}
      title={t('sources.title')}
      description={t('sources.description')}
      footer={
        <Button variant="primary" onClick={onClose}>
          {t('common.done')}
        </Button>
      }
    >
      <div className={styles.manager}>
        <div className={styles.sidebar}>
          <TextField
            type="search"
            icon={Search}
            label={t('sources.search')}
            hideLabel
            placeholder={t('sources.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button icon={Plus} size="sm" onClick={create}>
            {t('sources.new')}
          </Button>
          <ul className={styles.sourceList} aria-label={t('sources.title')}>
            {sources.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={styles.sourceRow}
                  aria-current={s.id === selectedId || undefined}
                  onClick={() => setSelectedId(s.id)}
                >
                  <span className={styles.sourceTitle}>{s.title}</span>
                  <span className={styles.muted}>
                    {t('sources.citedCount', { count: counts(s.id) })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {sources.length === 0 && (
            <p className={styles.muted}>
              {query ? t('people.noResults', { query }) : t('sources.empty')}
            </p>
          )}
        </div>
        <div className={styles.editor}>
          {!source ? (
            <EmptyState
              icon={BookOpen}
              title={t('sources.pickTitle')}
              description={t('sources.pickText')}
            />
          ) : (
            <div key={source.id} className={styles.fields}>
              <CommitTextField
                id="source-title"
                label={t('sources.titleLabel')}
                value={source.title}
                onCommit={(v) => v.trim() && update({ title: v.trim() })}
              />
              <div className={styles.row}>
                <CommitTextField
                  label={t('sources.author')}
                  value={source.author ?? ''}
                  onCommit={(v) => update({ author: v.trim() || undefined })}
                />
                <CommitTextField
                  label={t('sources.publication')}
                  placeholder={t('sources.publicationPlaceholder')}
                  value={source.publication ?? ''}
                  onCommit={(v) => update({ publication: v.trim() || undefined })}
                />
              </div>
              <div className={styles.row}>
                <Select
                  label={t('sources.repository')}
                  value={source.repositoryId ?? ''}
                  options={[
                    { value: '', label: t('sources.noRepository') },
                    ...repositories.map((r) => ({ value: r.id, label: r.name }))
                  ]}
                  onChange={(id) => update({ repositoryId: id || undefined })}
                />
                <CommitTextField
                  label={t('sources.callNumber')}
                  value={source.callNumber ?? ''}
                  onCommit={(v) => update({ callNumber: v.trim() || undefined })}
                />
              </div>
              <form
                className={styles.row}
                onSubmit={(e) => {
                  e.preventDefault()
                  addRepository()
                }}
              >
                <TextField
                  label={t('sources.newRepository')}
                  placeholder={t('sources.repositoryPlaceholder')}
                  value={newRepository}
                  onChange={(e) => setNewRepository(e.target.value)}
                />
                <Button
                  type="submit"
                  icon={Plus}
                  disabled={!newRepository.trim()}
                  className={styles.end}
                >
                  {t('sources.addRepository')}
                </Button>
              </form>
              <CommitTextField
                label={t('sources.url')}
                type="url"
                value={source.url ?? ''}
                onCommit={(v) => update({ url: v.trim() || undefined })}
              />
              <CommitTextArea
                label={t('sources.notes')}
                value={source.notes ?? ''}
                onCommit={(v) => update({ notes: v.trim() ? v : undefined })}
              />
              <section>
                <h3 className={styles.subheading}>{t('media.scans')}</h3>
                <MediaStrip
                  label={t('media.scans')}
                  mediaIds={source.mediaIds ?? []}
                  link={(mediaIds) =>
                    updateSourceCommand(source.id, {
                      mediaIds: mediaIds.length ? mediaIds : undefined
                    })
                  }
                />
                {citationMedia.length > 0 && (
                  <>
                    <p className={styles.muted}>{t('media.fromCitations')}</p>
                    <MediaStrip label={t('media.fromCitations')} mediaIds={citationMedia} />
                  </>
                )}
              </section>
              <section>
                <h3 className={styles.subheading}>
                  {t('sources.citedBy', { count: citedBy.length })}
                </h3>
                {citedBy.length === 0 ? (
                  <p className={styles.muted}>{t('sources.notCited')}</p>
                ) : (
                  <ul className={styles.citedBy}>
                    {citedBy.map(({ target, citation }) => (
                      <li key={citation.id}>
                        <button
                          type="button"
                          className={styles.linkButton}
                          onClick={() => {
                            const id = factPerson(tree, target)
                            if (id) useDocument.getState().select(id)
                            onClose()
                          }}
                        >
                          {factLabel(tree, target, t as never)}
                        </button>
                        {citation.page && <span className={styles.muted}> · {citation.page}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <Button
                variant="ghost"
                icon={Trash2}
                className={styles.danger}
                onClick={() => void remove()}
              >
                {t('sources.delete')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
