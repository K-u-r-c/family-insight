import { useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Person } from '@core/model/types'
import { alertDialog, Avatar, Button } from '@renderer/components/ui'
import { cx } from '@renderer/lib/cx'
import { updatePersonCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { PhotoCropDialog } from './PhotoCropDialog'
import styles from './PhotoField.module.css'

const MAX_BYTES = 20 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Portrait: pick or drop an image, crop it, or remove it. */
export function PhotoField({ person }: { person: Person }): React.JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDocument((s) => s.dispatch)
  const [source, setSource] = useState<string | null>(null)
  const [over, setOver] = useState(false)

  const fail = (key: string): Promise<void> =>
    alertDialog({
      title: t('photo.errorTitle'),
      message: t(key as never) as unknown as string,
      danger: true
    })

  const pick = async (): Promise<void> => {
    const result = await window.familyInsight.pickPhoto()
    if (!result) return
    if (!result.ok) return fail(`photo.error.${result.error}`)
    setSource(result.dataUrl)
  }

  const onDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault()
    e.stopPropagation()
    setOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (/\.(heic|heif)$/i.test(file.name) || !ACCEPTED.includes(file.type))
      return fail('photo.error.unsupported')
    if (file.size > MAX_BYTES) return fail('photo.error.too-large')
    setSource(await readFile(file))
  }

  return (
    <div className={styles.field}>
      <div
        className={cx(styles.drop, over && styles.over)}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            e.stopPropagation()
            setOver(true)
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => void onDrop(e)}
      >
        <Avatar
          givenNames={person.givenNames}
          surname={person.surname}
          sex={person.sex}
          photo={person.photo}
          size={72}
        />
      </div>
      <div className={styles.actions}>
        <Button size="sm" icon={Camera} onClick={() => void pick()}>
          {person.photo ? t('photo.change') : t('photo.add')}
        </Button>
        {person.photo && (
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            onClick={() => dispatch(updatePersonCommand(person.id, { photo: undefined }))}
          >
            {t('photo.remove')}
          </Button>
        )}
        <span className={styles.hint}>{t('photo.hint')}</span>
      </div>
      {source && (
        <PhotoCropDialog
          source={source}
          onClose={() => setSource(null)}
          onSave={(photo) => {
            setSource(null)
            dispatch(updatePersonCommand(person.id, { photo }))
          }}
        />
      )}
    </div>
  )
}
