import { create } from 'zustand'
import { isImage } from '@core/model/media'
import type { FamilyTree, MediaMime, Person } from '@core/model/types'
import type { MediaPutResult } from '@shared/ipc'
import { toast } from '@renderer/components/ui'
import i18n from '@renderer/i18n'
import { useDocument } from '@renderer/store/document'

/**
 * Media of the open document. The bytes live in a library in the main process (addressed by
 * id); the renderer keeps only thumbnails as object URLs, so cards never decode full scans.
 */
interface MediaState {
  /** Document (`useDocument.documentId`) the library belongs to. */
  documentId: number
  library: string | null
  /** Thumbnail object URLs by media hash. */
  thumbs: Record<string, string>
}

export const useMedia = create<MediaState>(() => ({ documentId: -1, library: null, thumbs: {} }))

/** Longest side of generated thumbnails (cards are at most ~80 px, at 2× density). */
export const THUMB_SIZE = 256
const thumbBytes = new Map<string, Uint8Array>()
const api = (): typeof window.familyInsight => window.familyInsight

function forget(): void {
  const { library, thumbs } = useMedia.getState()
  for (const url of Object.values(thumbs)) URL.revokeObjectURL(url)
  thumbBytes.clear()
  if (library) void api().releaseMediaLibrary(library)
}

// A different document was opened: drop the media of the previous one.
useDocument.subscribe((state, prev) => {
  if (state.documentId === prev.documentId) return
  forget()
  useMedia.setState({ documentId: state.documentId, library: null, thumbs: {} })
})

/** Library of the open document, if it has one yet. */
export function currentLibrary(): string | null {
  const { documentId, library } = useMedia.getState()
  return documentId === useDocument.getState().documentId ? library : null
}

/** Library of the open document, created on first use (new trees start without one). */
export async function ensureLibrary(): Promise<string> {
  const existing = currentLibrary()
  if (existing) return existing
  const documentId = useDocument.getState().documentId
  const library = await api().createMediaLibrary()
  if (useDocument.getState().documentId !== documentId) {
    void api().releaseMediaLibrary(library)
    throw new Error('Document changed')
  }
  useMedia.setState({ documentId, library })
  return library
}

function addThumb(hash: string, bytes: Uint8Array): void {
  thumbBytes.set(hash, bytes)
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/webp' }))
  useMedia.setState((s) => ({ thumbs: { ...s.thumbs, [hash]: url } }))
}

/** Scales an image down to a WebP thumbnail; `null` where the platform can't decode it. */
export async function makeThumbnail(
  bytes: Uint8Array,
  mime: MediaMime
): Promise<{ thumb: Uint8Array; width: number; height: number } | null> {
  if (!isImage(mime) || typeof createImageBitmap !== 'function') return null
  try {
    const bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: mime }))
    const { width, height } = bitmap
    const scale = Math.min(1, THUMB_SIZE / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.82)
    )
    if (!blob || blob.type !== 'image/webp') return null
    return { thumb: new Uint8Array(await blob.arrayBuffer()), width, height }
  } catch {
    return null
  }
}

/** Creates missing thumbnails (files from older versions, imports from other platforms). */
export async function ensureThumbnails(tree: FamilyTree): Promise<void> {
  const library = currentLibrary()
  if (!library) return
  const seen = new Set<string>()
  for (const item of Object.values(tree.media)) {
    if (seen.has(item.hash) || useMedia.getState().thumbs[item.hash] || !isImage(item.mime)) {
      continue
    }
    seen.add(item.hash)
    const bytes = await api().getMedia(library, item.hash)
    if (!bytes || currentLibrary() !== library) continue
    const made = await makeThumbnail(bytes, item.mime)
    if (!made || currentLibrary() !== library) continue
    if (await api().putThumbnail(library, item.hash, made.thumb)) addThumb(item.hash, made.thumb)
  }
}

/**
 * Binds the library of a file just loaded into the document store: adds bytes migrations
 * took out of the JSON, loads thumbnails and reports media missing from the file.
 */
export async function attachLibrary(
  library: string,
  extracted: Map<string, Uint8Array> = new Map()
): Promise<void> {
  const documentId = useDocument.getState().documentId
  useMedia.setState({ documentId, library, thumbs: {} })
  for (const [hash, bytes] of extracted) {
    const result = await api().putMedia(library, bytes, `${hash}`)
    if (!result?.ok || result.hash !== hash) console.warn('Could not keep migrated portrait')
  }
  const thumbs = await api().getThumbnails(library)
  if (currentLibrary() !== library) return
  for (const [hash, bytes] of Object.entries(thumbs)) addThumb(hash, bytes)
  const tree = useDocument.getState().tree
  if (!tree) return
  const present = new Set(await api().listMediaHashes(library))
  const missing = new Set(
    Object.values(tree.media)
      .map((m) => m.hash)
      .filter((h) => !present.has(h))
  )
  if (missing.size) {
    toast({
      message: i18n.t(
        'media.missing' as never,
        { count: missing.size } as never
      ) as unknown as string,
      tone: 'error'
    })
  }
  void ensureThumbnails(tree)
}

/** Adds bytes made in the renderer (a cropped portrait, a dropped file) to the library. */
export async function addMediaBytes(
  bytes: Uint8Array,
  fileName: string
): Promise<MediaPutResult & { width?: number; height?: number }> {
  const library = await ensureLibrary()
  const result = await api().putMedia(library, bytes, fileName)
  if (!result) return { ok: false, fileName, error: 'io' }
  if (!result.ok) return result
  const made = await makeThumbnail(bytes, result.mime)
  if (made && (await api().putThumbnail(library, result.hash, made.thumb))) {
    addThumb(result.hash, made.thumb)
  }
  return made ? { ...result, width: made.width, height: made.height } : result
}

/** Thumbnail URL of a person's portrait, if it has one. */
export function usePortraitUrl(person: Person | undefined): string | undefined {
  const id = person?.portraitMediaId
  const hash = useDocument((s) => (id ? s.tree?.media[id]?.hash : undefined))
  return useMedia((s) => (hash ? s.thumbs[hash] : undefined))
}

/** Portrait thumbnail as a data URL, for exported images that must embed it. */
export function portraitDataUrl(tree: FamilyTree, person: Person): string | undefined {
  const hash = person.portraitMediaId ? tree.media[person.portraitMediaId]?.hash : undefined
  const bytes = hash ? thumbBytes.get(hash) : undefined
  if (!bytes) return undefined
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return `data:image/webp;base64,${btoa(binary)}`
}

/** Decodes a `data:` URL made in the renderer (e.g. by a canvas) to bytes. */
export function dataUrlToBytes(url: string): Uint8Array {
  const binary = atob(url.slice(url.indexOf(',') + 1))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}
