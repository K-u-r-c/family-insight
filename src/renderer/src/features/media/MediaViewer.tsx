import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Maximize,
  Pencil,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isImage } from '@core/model/media'
import type { MediaItem } from '@core/model/types'
import { IconButton } from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { exportMediaFile, fullMediaUrl, openMediaExternally } from '@renderer/services/media'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { mediaTitle } from './MediaThumb'
import styles from './Media.module.css'

const MIN_SCALE = 0.05
const MAX_SCALE = 8

interface View {
  scale: number
  x: number
  y: number
}

/** Full-size viewer for the media list it was opened with: zoom/pan, previous/next, PDFs. */
export function MediaViewer(): React.JSX.Element | null {
  const viewing = useWorkspaceUi((s) => s.viewing)
  const tree = useDocument((s) => s.tree)
  if (!viewing || !tree) return null
  const items = viewing.mediaIds.map((id) => tree.media[id]).filter((m): m is MediaItem => !!m)
  if (!items.length) return null
  const index = Math.min(viewing.index, items.length - 1)
  return <ViewerDialog items={items} index={index} personId={viewing.personId} />
}

function ViewerDialog({
  items,
  index,
  personId
}: {
  items: MediaItem[]
  index: number
  personId?: string
}): React.JSX.Element {
  const { t } = useTranslation()
  const format = useFormat()
  const ref = useRef<HTMLDialogElement>(null)
  const item = items[index]!
  const close = (): void => useWorkspaceUi.getState().closeViewer()
  const go = useCallback(
    (delta: number) => {
      const next = index + delta
      if (next < 0 || next >= items.length) return
      useWorkspaceUi.getState().viewMedia(
        items.map((m) => m.id),
        next,
        personId
      )
    },
    [index, items, personId]
  )

  useEffect(() => {
    const dialog = ref.current
    const trigger = document.activeElement as HTMLElement | null
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (trigger?.isConnected) trigger.focus()
    }
  }, [])

  const meta = [
    items.length > 1 ? t('media.position', { index: index + 1, total: items.length }) : '',
    item.date ? format.date(item.date) : '',
    item.place ?? ''
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <dialog
      ref={ref}
      className={styles.viewer}
      aria-labelledby="media-viewer-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).closest('input, textarea')) return
        if (e.key === 'ArrowLeft') go(-1)
        else if (e.key === 'ArrowRight') go(1)
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className={styles.viewerBar}>
        <div className={styles.viewerTitle}>
          <h2 id="media-viewer-title" className={styles.viewerName}>
            {mediaTitle(item)}
          </h2>
          {meta && <p className={styles.viewerMeta}>{meta}</p>}
        </div>
        <div className={styles.viewerTools}>
          <IconButton
            icon={Pencil}
            size="sm"
            label={t('media.editDetails')}
            onClick={() => useWorkspaceUi.getState().setEditingMedia(item.id)}
          />
          <IconButton
            icon={ExternalLink}
            size="sm"
            label={t('media.openExternally')}
            onClick={() => void openMediaExternally(item)}
          />
          <IconButton
            icon={Download}
            size="sm"
            label={t('media.export')}
            onClick={() => void exportMediaFile(item)}
          />
          <IconButton icon={X} size="sm" label={t('common.close')} onClick={close} />
        </div>
      </div>
      <div className={styles.viewerBody}>
        {items.length > 1 && (
          <>
            <IconButton
              icon={ChevronLeft}
              className={`${styles.nav} ${styles.prev}`}
              label={t('media.previous')}
              disabled={index === 0}
              onClick={() => go(-1)}
            />
            <IconButton
              icon={ChevronRight}
              className={`${styles.nav} ${styles.next}`}
              label={t('media.next')}
              disabled={index === items.length - 1}
              onClick={() => go(1)}
            />
          </>
        )}
        <Content key={item.id} item={item} />
      </div>
      {item.description && <p className={`${styles.description} selectable`}>{item.description}</p>}
    </dialog>
  )
}

/** Loads the full file and shows it: zoomable image, PDF viewer, or a message. */
function Content({ item }: { item: MediaItem }): React.JSX.Element {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    let live = true
    void fullMediaUrl(item).then((u) => live && setUrl(u))
    return () => {
      live = false
    }
  }, [item])

  if (url === undefined) return <div className={styles.stage} aria-busy="true" />
  if (url === null) return <div className={styles.stageMessage}>{t('media.missingFile')}</div>
  if (!isImage(item.mime)) {
    return <iframe className={styles.pdf} src={url} title={mediaTitle(item)} />
  }
  return <ZoomableImage url={url} alt={item.description || mediaTitle(item)} />
}

function ZoomableImage({ url, alt }: { url: string; alt: string }): React.JSX.Element {
  const { t } = useTranslation()
  const stage = useRef<HTMLDivElement>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; view: View } | null>(null)

  const fit = useCallback((): void => {
    const box = stage.current?.getBoundingClientRect()
    if (!box || !natural) return
    const scale = Math.min(1, (box.width - 32) / natural.w, (box.height - 32) / natural.h)
    setView({
      scale,
      x: (box.width - natural.w * scale) / 2,
      y: (box.height - natural.h * scale) / 2
    })
  }, [natural])
  useEffect(fit, [fit])

  /** Zooms by `factor` keeping the point (`cx`, `cy`) of the stage in place. */
  const zoom = (factor: number, cx?: number, cy?: number): void => {
    const box = stage.current?.getBoundingClientRect()
    if (!box) return
    const px = cx ?? box.width / 2
    const py = cy ?? box.height / 2
    setView((v) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor))
      const k = scale / v.scale
      return { scale, x: px - (px - v.x) * k, y: py - (py - v.y) * k }
    })
  }

  return (
    <>
      <div
        ref={stage}
        className={styles.stage}
        onWheel={(e) => {
          const box = e.currentTarget.getBoundingClientRect()
          zoom(Math.exp(-e.deltaY * 0.0015), e.clientX - box.left, e.clientY - box.top)
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, y: e.clientY, view }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          setView({ ...d.view, x: d.view.x + e.clientX - d.x, y: d.view.y + e.clientY - d.y })
        }}
        onPointerUp={() => (drag.current = null)}
        onDoubleClick={(e) => {
          const box = e.currentTarget.getBoundingClientRect()
          zoom(2, e.clientX - box.left, e.clientY - box.top)
        }}
        tabIndex={0}
        role="img"
        aria-label={alt}
        onKeyDown={(e) => {
          if (e.key === '+' || e.key === '=') zoom(1.25)
          else if (e.key === '-') zoom(0.8)
          else if (e.key === '0') fit()
        }}
      >
        <img
          className={styles.stageImage}
          src={url}
          alt=""
          draggable={false}
          onLoad={(e) =>
            setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            visibility: natural ? 'visible' : 'hidden'
          }}
        />
      </div>
      <div className={`${styles.viewerTools} ${styles.zoomTools}`}>
        <IconButton icon={ZoomOut} size="sm" label={t('media.zoomOut')} onClick={() => zoom(0.8)} />
        <span className={styles.zoomLabel}>
          {t('media.zoomLevel', { value: Math.round(view.scale * 100) })}
        </span>
        <IconButton icon={ZoomIn} size="sm" label={t('media.zoomIn')} onClick={() => zoom(1.25)} />
        <IconButton icon={Maximize} size="sm" label={t('media.fit')} onClick={fit} />
      </div>
    </>
  )
}
