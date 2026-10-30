import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CircleUserRound,
  ImagePlus,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isImage } from '@core/model/media'
import type { MediaItem, Person } from '@core/model/types'
import {
  alertDialog,
  anchorBelow,
  Button,
  IconButton,
  Menu,
  toast,
  type MenuAnchor,
  type MenuEntry
} from '@renderer/components/ui'
import { cx } from '@renderer/lib/cx'
import { addDroppedFiles, mediaDataUrl, pickMediaFiles } from '@renderer/services/media'
import {
  addPersonMediaCommand,
  movePersonMediaCommand,
  removePersonMediaCommand
} from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { PhotoCropDialog } from '@renderer/features/person/PhotoCropDialog'
import { savePortrait } from '@renderer/features/person/portrait'
import { MediaThumb, mediaTitle } from './MediaThumb'
import styles from './Media.module.css'

/** Photos and documents of a person: add (picker or drop), view, reorder, portrait, remove. */
export function GallerySection({ person }: { person: Person }): React.JSX.Element | null {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)
  const dispatch = useDocument((s) => s.dispatch)
  const [over, setOver] = useState(false)
  const [menu, setMenu] = useState<{ item: MediaItem; anchor: MenuAnchor } | null>(null)
  const [cropSource, setCropSource] = useState<string | null>(null)
  if (!tree) return null
  const ids = (person.mediaIds ?? []).filter((id) => tree.media[id])
  const items = ids.map((id) => tree.media[id]!)

  const add = async (inputs: Promise<Parameters<typeof addPersonMediaCommand>[1]>) => {
    const list = await inputs
    if (list.length) dispatch(addPersonMediaCommand(person.id, list))
  }
  const remove = (item: MediaItem): void => {
    dispatch(removePersonMediaCommand(person.id, item.id))
    toast({
      message: t('media.removed', { title: mediaTitle(item) }),
      action: { label: t('common.undo'), onClick: () => useDocument.getState().undo() }
    })
  }
  const cropAsPortrait = async (item: MediaItem): Promise<void> => {
    const url = await mediaDataUrl(item)
    if (url) setCropSource(url)
  }

  const entries = (item: MediaItem): MenuEntry[] => {
    const index = ids.indexOf(item.id)
    return [
      {
        label: t('media.editDetails'),
        icon: Pencil,
        onSelect: () => useWorkspaceUi.getState().setEditingMedia(item.id)
      },
      ...(isImage(item.mime)
        ? [
            {
              label: t('media.setPortrait'),
              icon: CircleUserRound,
              onSelect: () => void cropAsPortrait(item)
            }
          ]
        : []),
      { type: 'separator' as const },
      {
        label: t('media.moveEarlier'),
        icon: ArrowLeft,
        disabled: index === 0,
        onSelect: () => dispatch(movePersonMediaCommand(person.id, item.id, index - 1))
      },
      {
        label: t('media.moveLater'),
        icon: ArrowRight,
        disabled: index === ids.length - 1,
        onSelect: () => dispatch(movePersonMediaCommand(person.id, item.id, index + 1))
      },
      { type: 'separator' as const },
      {
        label: t('media.removeFrom', { name: person.givenNames || t('person.unnamed') }),
        icon: Trash2,
        danger: true,
        onSelect: () => remove(item)
      }
    ]
  }

  return (
    <section
      className={cx(styles.gallery, over && styles.over)}
      aria-labelledby={`gallery-${person.id}`}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return
        e.preventDefault()
        e.stopPropagation()
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setOver(false)
        const files = [...e.dataTransfer.files]
        if (files.length) void add(addDroppedFiles(files))
      }}
    >
      <div className={styles.galleryHeader}>
        <h4 id={`gallery-${person.id}`} className={styles.heading}>
          {t('media.gallery')}
          {items.length > 0 && <span className={styles.count}>{items.length}</span>}
        </h4>
        <Button
          size="sm"
          variant="ghost"
          icon={ImagePlus}
          onClick={() => void add(pickMediaFiles())}
        >
          {t('media.add')}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className={styles.hint}>{t('media.empty')}</p>
      ) : (
        <ul className={styles.grid}>
          {items.map((item, i) => (
            <li key={item.id} className={styles.tile}>
              <button
                type="button"
                className={styles.tileButton}
                aria-label={t('media.open', { title: mediaTitle(item) })}
                onClick={() => useWorkspaceUi.getState().viewMedia(ids, i, person.id)}
              >
                <MediaThumb item={item} />
              </button>
              <span className={styles.caption} title={mediaTitle(item)}>
                {mediaTitle(item)}
              </span>
              <IconButton
                icon={MoreHorizontal}
                size="sm"
                className={styles.tileMenu}
                label={t('media.actions', { title: mediaTitle(item) })}
                aria-haspopup="menu"
                onClick={(e) => setMenu({ item, anchor: anchorBelow(e.currentTarget, true) })}
              />
            </li>
          ))}
        </ul>
      )}
      <Menu
        anchor={menu?.anchor ?? null}
        entries={menu ? entries(menu.item) : []}
        onClose={() => setMenu(null)}
        label={menu ? t('media.actions', { title: mediaTitle(menu.item) }) : ''}
      />
      {cropSource && (
        <PhotoCropDialog
          source={cropSource}
          onClose={() => setCropSource(null)}
          onSave={(photo) => {
            setCropSource(null)
            void savePortrait(person.id, photo).then(
              (error) =>
                error &&
                alertDialog({
                  title: t('photo.errorTitle'),
                  message: t(`photo.error.${error}`),
                  danger: true
                })
            )
          }}
        />
      )}
    </section>
  )
}
