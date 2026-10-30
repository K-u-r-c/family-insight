import type { Person } from '@core/model/types'
import { Avatar } from '@renderer/components/ui'
import { usePortraitUrl } from '@renderer/services/media'

/** Avatar of a person: their portrait thumbnail from the media library, or initials. */
export function PersonAvatar({
  person,
  size,
  deceased,
  className
}: {
  person: Person
  size?: number
  deceased?: boolean
  className?: string
}): React.JSX.Element {
  return (
    <Avatar
      givenNames={person.givenNames}
      surname={person.surname}
      sex={person.sex}
      photo={usePortraitUrl(person)}
      size={size}
      deceased={deceased}
      className={className}
    />
  )
}
