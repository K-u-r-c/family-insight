import { Download, RefreshCw, Sparkles, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, IconButton } from '@renderer/components/ui'
import { Markdown } from './markdown'
import { dismissUpdate, downloadUpdate, restartToUpdate, skipVersion, useUpdates } from './updates'
import styles from './Updates.module.css'

/** Non-intrusive notice in the corner: update available, downloading, ready, failed. */
export function UpdateNotice(): React.JSX.Element | null {
  const { t } = useTranslation()
  const status = useUpdates((s) => s.status)
  const dismissed = useUpdates((s) => s.dismissed)
  const notesOpen = useUpdates((s) => s.notesOpen)
  if (!status) return null
  const version = status.version ?? ''
  const hidden = dismissed !== null && (dismissed === version || dismissed === status.state)
  const show =
    !hidden &&
    (status.state === 'available' ||
      status.state === 'downloading' ||
      status.state === 'ready' ||
      (status.state === 'error' && !status.manual))
  const notes = notesOpen && status.notes && (
    <Dialog
      open
      wide
      onClose={() => useUpdates.setState({ notesOpen: false })}
      icon={Sparkles}
      title={t('updates.notesTitle', { version })}
    >
      <div className={styles.notes}>
        <Markdown
          source={status.notes}
          onLink={(url) => void window.open(url, '_blank', 'noopener')}
        />
      </div>
    </Dialog>
  )
  if (!show) return notes || null

  return (
    <>
      <section
        className={styles.notice}
        role="status"
        aria-live="polite"
        aria-label={t('updates.title')}
      >
        <div className={styles.head}>
          <Sparkles size={18} aria-hidden="true" className={styles.icon} />
          <p className={styles.message}>
            {status.state === 'available' && t('updates.available', { version })}
            {status.state === 'downloading' && t('updates.downloading', { version })}
            {status.state === 'ready' && t('updates.ready', { version })}
            {status.state === 'error' && t('updates.downloadFailed')}
          </p>
          {status.state !== 'downloading' && (
            <IconButton icon={X} size="sm" label={t('updates.later')} onClick={dismissUpdate} />
          )}
        </div>
        {status.state === 'downloading' && (
          <div
            className={styles.progress}
            role="progressbar"
            aria-label={t('updates.progress')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={status.progress ?? 0}
          >
            <span style={{ width: `${status.progress ?? 0}%` }} />
          </div>
        )}
        {status.state === 'available' && (
          <div className={styles.actions}>
            <Button size="sm" variant="primary" icon={Download} onClick={downloadUpdate}>
              {status.support === 'auto' ? t('updates.download') : t('updates.openDownload')}
            </Button>
            {status.notes && (
              <Button size="sm" onClick={() => useUpdates.setState({ notesOpen: true })}>
                {t('updates.releaseNotes')}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={dismissUpdate}>
              {t('updates.later')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => skipVersion(version)}>
              {t('updates.skip')}
            </Button>
          </div>
        )}
        {status.state === 'ready' && (
          <div className={styles.actions}>
            <Button
              size="sm"
              variant="primary"
              icon={RefreshCw}
              onClick={() => void restartToUpdate()}
            >
              {t('updates.restart')}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissUpdate}>
              {t('updates.onQuit')}
            </Button>
          </div>
        )}
        {status.state === 'error' && (
          <div className={styles.actions}>
            <Button size="sm" icon={RefreshCw} onClick={downloadUpdate}>
              {t('updates.retry')}
            </Button>
          </div>
        )}
      </section>
      {notes}
    </>
  )
}
