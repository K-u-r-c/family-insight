import { useRef, useState } from 'react'
import { ImageIcon, ZoomIn, ZoomOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, Icon } from '@renderer/components/ui'
import { clampCrop, sourceRect, type CropState } from '@renderer/lib/crop'
import styles from './PhotoCropDialog.module.css'

const VIEW = 280
export const PHOTO_SIZE = 512

/** Renders the crop to a square WebP data URL (JPEG if WebP is unavailable). */
export function renderCrop(img: HTMLImageElement, state: CropState, size = PHOTO_SIZE): string {
  const canvas = document.createElement('canvas')
  const out = Math.min(size, Math.min(img.naturalWidth, img.naturalHeight))
  canvas.width = out
  canvas.height = out
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  const { sx, sy, size: s } = sourceRect(state, img.naturalWidth, img.naturalHeight)
  ctx.drawImage(img, sx, sy, s, s, 0, 0, out, out)
  const webp = canvas.toDataURL('image/webp', 0.82)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85)
}

interface PhotoCropDialogProps {
  source: string
  onSave: (dataUrl: string) => void
  onClose: () => void
}

/** Square crop with drag-to-move and zoom; the circle shows how avatars will look. */
export function PhotoCropDialog({
  source,
  onSave,
  onClose
}: PhotoCropDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const imgRef = useRef<HTMLImageElement>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [state, setState] = useState<CropState>({ zoom: 1, x: 0, y: 0 })
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null)
  const [failed, setFailed] = useState(false)

  const update = (next: CropState): void =>
    setState(natural ? clampCrop(next, natural.w, natural.h) : next)
  const scale = natural ? (VIEW * state.zoom) / Math.min(natural.w, natural.h) : 1

  return (
    <Dialog
      open
      onClose={onClose}
      icon={ImageIcon}
      title={t('photo.cropTitle')}
      description={t('photo.cropText')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="primary"
            disabled={!natural || failed}
            onClick={() => imgRef.current && onSave(renderCrop(imgRef.current, state))}
          >
            {t('photo.use')}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <div
          className={styles.viewport}
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            drag.current = { px: e.clientX, py: e.clientY, x: state.x, y: state.y }
          }}
          onPointerMove={(e) => {
            const d = drag.current
            if (!d) return
            update({
              zoom: state.zoom,
              x: d.x + (e.clientX - d.px) / VIEW,
              y: d.y + (e.clientY - d.py) / VIEW
            })
          }}
          onPointerUp={() => (drag.current = null)}
          onWheel={(e) => update({ ...state, zoom: state.zoom * Math.exp(-e.deltaY * 0.002) })}
          role="img"
          aria-label={t('photo.cropArea')}
        >
          <img
            ref={imgRef}
            src={source}
            alt=""
            draggable={false}
            className={styles.image}
            onLoad={(e) => {
              const w = e.currentTarget.naturalWidth
              const h = e.currentTarget.naturalHeight
              setNatural({ w, h })
              setState((current) => clampCrop(current, w, h))
            }}
            onError={() => setFailed(true)}
            style={
              natural
                ? {
                    width: natural.w * scale,
                    height: natural.h * scale,
                    transform: `translate(-50%, -50%) translate(${state.x * VIEW}px, ${state.y * VIEW}px)`
                  }
                : { opacity: 0 }
            }
          />
          <div className={styles.mask} />
        </div>
        {failed ? (
          <p className={styles.error}>{t('photo.unreadable')}</p>
        ) : (
          <label className={styles.zoom}>
            <Icon icon={ZoomOut} size={16} />
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={state.zoom}
              aria-label={t('photo.zoom')}
              onChange={(e) => update({ ...state, zoom: Number(e.target.value) })}
            />
            <Icon icon={ZoomIn} size={16} />
          </label>
        )}
      </div>
    </Dialog>
  )
}
