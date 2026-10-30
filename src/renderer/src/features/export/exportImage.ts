import { layoutFamily } from '@core/layout/layout'
import { dateLanguage } from '@core/date/fuzzyDate'
import { resolveLanguage } from '@shared/i18n'
import type { PdfOptions } from '@shared/ipc'
import i18n from '@renderer/i18n'
import { layoutOptions } from '@renderer/features/tree/TreeCanvas'
import { useDocument } from '@renderer/store/document'
import { useTreeView } from '@renderer/store/treeView'
import { portraitDataUrl } from '@renderer/services/media'
import { embedFonts } from './fonts'
import { buildTreeSvg, canvasMeasure, type TreeSvg } from './treeSvg'

export type ImageFormat = 'png' | 'svg' | 'pdf'
export type ExportScope = 'all' | 'visible'

export interface ImageExportOptions {
  scope: ExportScope
  withTitle: boolean
}

const t = (key: string, options?: Record<string, unknown>): string =>
  i18n.t(key as never, options as never) as unknown as string

/** SVG of the current view of the tree (whole layout or just the visible area). */
export function currentTreeSvg(options: ImageExportOptions): TreeSvg | null {
  const tree = useDocument.getState().tree
  const opts = layoutOptions()
  if (!tree || !opts) return null
  const layout = layoutFamily(tree, opts)
  const language = dateLanguage(resolveLanguage(i18n.language))
  const { viewport, size } = useTreeView.getState()
  const crop =
    options.scope === 'visible' && size.width
      ? {
          x: -viewport.x / viewport.k,
          y: -viewport.y / viewport.k,
          width: size.width / viewport.k,
          height: size.height / viewport.k
        }
      : undefined
  const date = new Date().toLocaleDateString(i18n.language, { dateStyle: 'long' })
  return buildTreeSvg(tree, layout, {
    language,
    crop,
    measure: canvasMeasure(),
    title: options.withTitle ? tree.meta.name : undefined,
    subtitle: options.withTitle ? t('export.subtitle', { date }) : undefined,
    unnamed: t('person.unnamed'),
    bornLabel: (surname) => t('tree.born', { surname }),
    portrait: (person) => portraitDataUrl(tree, person)
  })
}

/** The tree as SVG for export: with the fonts embedded, so it looks the same everywhere. */
export async function exportableTreeSvg(options: ImageExportOptions): Promise<TreeSvg | null> {
  const result = currentTreeSvg(options)
  return result && { ...result, svg: await embedFonts(result.svg) }
}

/** Rasterises SVG markup to a base64 PNG at the given scale. */
export async function svgToPngBase64(
  { svg, width, height }: TreeSvg,
  scale: number
): Promise<string> {
  const img = new Image()
  img.decoding = 'async'
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    // Browsers cap canvas size; shrink the scale for huge trees.
    const max = 16384
    const s = Math.min(scale, max / width, max / height)
    canvas.width = Math.round(width * s)
    canvas.height = Math.round(height * s)
    const ctx = canvas.getContext('2d')!
    ctx.scale(s, s)
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/png').split(',')[1]!
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function printTree(
  options: PdfOptions = { pageSize: 'A4', landscape: true }
): Promise<void> {
  const result = await exportableTreeSvg({ scope: 'all', withTitle: true })
  if (result) await window.familyInsight.print(result.svg, options)
}
