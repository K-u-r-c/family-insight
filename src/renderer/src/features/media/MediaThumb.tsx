import { FileText, ImageOff } from 'lucide-react'
import { isImage } from '@core/model/media'
import type { MediaItem } from '@core/model/types'
import { Icon } from '@renderer/components/ui'
import { useMedia } from '@renderer/services/media'
import styles from './Media.module.css'

/** Thumbnail of a media item: the image, or an icon for documents and missing files. */
export function MediaThumb({ item }: { item: MediaItem }): React.JSX.Element {
  const url = useMedia((s) => s.thumbs[item.hash])
  if (url) return <img className={styles.thumbImage} src={url} alt="" draggable={false} />
  return (
    <span className={styles.thumbIcon}>
      <Icon icon={isImage(item.mime) ? ImageOff : FileText} size={22} />
      {!isImage(item.mime) && <span className={styles.thumbExt}>PDF</span>}
    </span>
  )
}

/** Title of a media item for lists and the viewer. */
export const mediaTitle = (item: MediaItem): string => item.title?.trim() || item.fileName
