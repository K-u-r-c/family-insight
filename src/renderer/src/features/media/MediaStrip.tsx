import { ImagePlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MediaId, MediaItem } from '@core/model/types'
import { Button, IconButton } from '@renderer/components/ui'
import { pickMediaFiles } from '@renderer/services/media'
import {
  addMediaCommand,
  composeCommands,
  removeMediaIfUnusedCommand,
  type Command
} from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { MediaThumb, mediaTitle } from './MediaThumb'
import styles from './Media.module.css'

/**
 * Small row of attached scans (sources, citations): open in the viewer, attach new files,
 * detach. `link` builds the command that stores a new list of ids; attaching and detaching
 * are single undoable steps, and a detached file nothing else uses leaves the library.
 */
export function MediaStrip({
  mediaIds,
  link,
  label
}: {
  mediaIds: MediaId[]
  link?: (mediaIds: MediaId[]) => Command
  label: string
}): React.JSX.Element | null {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)
  const dispatch = useDocument((s) => s.dispatch)
  if (!tree) return null
  const items = mediaIds.map((id) => tree.media[id]).filter((m): m is MediaItem => !!m)
  const ids = items.map((m) => m.id)

  const attach = async (): Promise<void> => {
    const inputs = await pickMediaFiles()
    if (!inputs.length || !link) return
    dispatch(
      composeCommands('history.addMedia', (_tree, run) => {
        const added = inputs.map((input) => run(addMediaCommand(input)))
        run(link([...ids, ...added.map((m) => m.id)]))
      })
    )
  }
  const detach = (id: MediaId): void => {
    if (!link) return
    dispatch(
      composeCommands('history.removeMedia', (_tree, run) => {
        run(link(ids.filter((other) => other !== id)))
        run(removeMediaIfUnusedCommand(id))
      })
    )
  }

  return (
    <div className={styles.strip} role="group" aria-label={label}>
      {items.map((item, i) => (
        <div key={item.id} className={styles.stripItem}>
          <button
            type="button"
            className={styles.tileButton}
            aria-label={t('media.open', { title: mediaTitle(item) })}
            title={mediaTitle(item)}
            onClick={() => useWorkspaceUi.getState().viewMedia(ids, i)}
          >
            <MediaThumb item={item} />
          </button>
          {link && (
            <IconButton
              icon={X}
              size="sm"
              className={styles.stripRemove}
              label={t('media.detach', { title: mediaTitle(item) })}
              onClick={() => detach(item.id)}
            />
          )}
        </div>
      ))}
      {link && (
        <Button size="sm" variant="ghost" icon={ImagePlus} onClick={() => void attach()}>
          {t('media.attach')}
        </Button>
      )}
    </div>
  )
}
