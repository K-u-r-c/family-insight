import { addMediaBytes, dataUrlToBytes } from '@renderer/services/media'
import { setPortraitCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'

/**
 * Stores a cropped portrait (a canvas data URL) in the media library and sets it as the
 * person's portrait. Resolves to the error code when the library refused it.
 */
export async function savePortrait(
  personId: string,
  dataUrl: string
): Promise<'too-large' | 'unsupported' | 'io' | null> {
  const bytes = dataUrlToBytes(dataUrl)
  const fileName = `portrait.${bytes[0] === 0xff ? 'jpg' : 'webp'}`
  const added = await addMediaBytes(bytes, fileName)
  if (!added.ok) return added.error
  const { hash, mime, size, width, height } = added
  useDocument
    .getState()
    .dispatch(setPortraitCommand(personId, { hash, mime, fileName, size, width, height }))
  return null
}
