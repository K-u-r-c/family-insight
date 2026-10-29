import type { Sex } from '@core/model/types'
import { cx } from '@renderer/lib/cx'
import styles from './Avatar.module.css'

interface AvatarProps {
  givenNames: string
  surname: string
  sex: Sex
  photo?: string
  size?: number
  deceased?: boolean
  className?: string
}

export function initials(givenNames: string, surname: string): string {
  const first = givenNames.trim()[0] ?? ''
  const last = surname.trim()[0] ?? ''
  return (first + last).toLocaleUpperCase() || '?'
}

/** Portrait or coloured initials (colour by sex token). Decorative: names are shown next to it. */
export function Avatar({
  givenNames,
  surname,
  sex,
  photo,
  size = 36,
  deceased,
  className
}: AvatarProps): React.JSX.Element {
  return (
    <span
      className={cx(styles.avatar, styles[sex], deceased && styles.deceased, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {photo ? <img src={photo} alt="" draggable={false} /> : initials(givenNames, surname)}
    </span>
  )
}
