import { isZip, readZip, writeZip, ZipError } from '../../file/zip'

/**
 * GEDZIP (GEDCOM 7): a zip with `gedcom.ged` and the media files it references by relative
 * path. Returns `null` when the bytes aren't a zip or have no `gedcom.ged`.
 */
export function readGedzip(
  bytes: Uint8Array
): { gedcom: Uint8Array; files: Map<string, Uint8Array> } | null {
  if (!isZip(bytes)) return null
  let entries
  try {
    entries = readZip(bytes)
  } catch (error) {
    if (error instanceof ZipError) return null
    throw error
  }
  const gedcom = entries.get('gedcom.ged')
  if (!gedcom) return null
  const files = new Map<string, Uint8Array>()
  for (const [name, entry] of entries) {
    if (name !== 'gedcom.ged') files.set(name, entry.data)
  }
  return { gedcom: gedcom.data, files }
}

/** Builds a GEDZIP: `gedcom.ged` (UTF-8) and the media files at the paths the file uses. */
export function writeGedzip(
  gedcom: string,
  files: { path: string; bytes: Uint8Array }[]
): Uint8Array[] {
  const seen = new Set<string>()
  return writeZip([
    { name: 'gedcom.ged', data: new TextEncoder().encode(gedcom), compress: true },
    ...files
      .filter((f) => !seen.has(f.path) && seen.add(f.path))
      .map((f) => ({ name: f.path, data: f.bytes }))
  ])
}
