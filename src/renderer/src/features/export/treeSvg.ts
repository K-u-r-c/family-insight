import type { Layout, LayoutNode } from '@core/layout/layout'
import { lifespanLabel } from '@core/date/lifespan'
import type { DateLanguage } from '@core/date/fuzzyDate'
import { displayName, isLiving } from '@core/model/tree'
import type { FamilyTree, Person, Sex } from '@core/model/types'
import { roundedPath } from '@renderer/features/tree/EdgesLayer'

/** Print palette: always light, high contrast. */
const PALETTE = {
  background: '#ffffff',
  card: '#ffffff',
  border: '#d8d1c6',
  text: '#23201c',
  muted: '#665e54',
  edge: '#9a9083',
  title: '#23201c',
  sex: { female: '#bf5476', male: '#3f6fae', other: '#7d5cab', unknown: '#b5ac9f' } as Record<
    Sex,
    string
  >,
  soft: { female: '#f7e4ea', male: '#e3ebf6', other: '#eee7f6', unknown: '#ece9e4' } as Record<
    Sex,
    string
  >
}

const FONT = "'Inter Variable', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
const SERIF = "'Source Serif 4 Variable', Georgia, 'Times New Roman', serif"

export type Measure = (text: string, font: string) => number

/** Rough text width when no canvas is available (tests). */
export const approximateMeasure: Measure = (text, font) => {
  const size = Number(/(\d+)px/.exec(font)?.[1] ?? 14)
  return text.length * size * 0.56
}

/** Canvas-based text measurement (renderer). */
export function canvasMeasure(): Measure {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return approximateMeasure
  return (text, font) => {
    ctx.font = font
    return ctx.measureText(text).width
  }
}

export function escapeXml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!
  )
}

function ellipsize(text: string, max: number, font: string, measure: Measure): string {
  if (measure(text, font) <= max) return text
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (measure(`${text.slice(0, mid)}…`, font) <= max) lo = mid
    else hi = mid - 1
  }
  return `${text.slice(0, lo).trimEnd()}…`
}

export interface TreeSvgOptions {
  language: DateLanguage
  title?: string
  subtitle?: string
  /** Only this world rectangle (e.g. the visible area). */
  crop?: { x: number; y: number; width: number; height: number }
  measure?: Measure
  unnamed?: string
  bornLabel?: (surname: string) => string
}

export interface TreeSvg {
  svg: string
  width: number
  height: number
}

function card(
  person: Person,
  node: LayoutNode,
  o: Required<Pick<TreeSvgOptions, 'language' | 'measure' | 'unnamed'>> & TreeSvgOptions
): string {
  const { x, y, width: w, height: h } = node
  const compact = h < 56
  const avatar = compact ? 30 : 40
  const pad = compact ? 8 : 12
  const ax = x + pad + 2
  const ay = y + (h - avatar) / 2
  const tx = ax + avatar + (compact ? 8 : 12)
  const maxText = x + w - tx - 8
  const nameFont = `600 ${compact ? 13 : 14}px ${FONT}`
  const metaFont = `400 ${compact ? 11 : 12}px ${FONT}`
  const name = ellipsize(displayName(person) || o.unnamed, maxText, nameFont, o.measure)
  const lifespan = lifespanLabel(person, o.language)
  const deceased = isLiving(person) === false
  const meta = [
    lifespan + (deceased && lifespan ? ' †' : ''),
    person.birthSurname && o.bornLabel ? o.bornLabel(person.birthSurname) : ''
  ]
    .filter(Boolean)
    .join(' · ')
  const metaText = meta ? ellipsize(meta, maxText, metaFont, o.measure) : ''
  const initials =
    ((person.givenNames.trim()[0] ?? '') + (person.surname.trim()[0] ?? '')).toLocaleUpperCase() ||
    '?'
  const clipId = `clip-${node.id.replace(/[^a-zA-Z0-9-]/g, '')}`
  const nameY = metaText ? y + h / 2 - 2 : y + h / 2 + 5
  return [
    `<g>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${compact ? 10 : 14}" fill="${PALETTE.card}" stroke="${PALETTE.border}"/>`,
    `<rect x="${x}" y="${y + 10}" width="3" height="${h - 20}" rx="1.5" fill="${PALETTE.sex[person.sex]}"/>`,
    person.photo
      ? `<clipPath id="${clipId}"><circle cx="${ax + avatar / 2}" cy="${ay + avatar / 2}" r="${avatar / 2}"/></clipPath><image href="${person.photo}" x="${ax}" y="${ay}" width="${avatar}" height="${avatar}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`
      : `<circle cx="${ax + avatar / 2}" cy="${ay + avatar / 2}" r="${avatar / 2}" fill="${PALETTE.soft[person.sex]}"/><text x="${ax + avatar / 2}" y="${ay + avatar / 2 + avatar * 0.14}" text-anchor="middle" font-family="${escapeXml(FONT)}" font-size="${Math.round(avatar * 0.38)}" font-weight="650" fill="${PALETTE.sex[person.sex]}">${escapeXml(initials)}</text>`,
    `<text x="${tx}" y="${nameY}" font-family="${escapeXml(FONT)}" font-size="${compact ? 13 : 14}" font-weight="600" fill="${deceased ? PALETTE.muted : PALETTE.text}">${escapeXml(name)}</text>`,
    metaText
      ? `<text x="${tx}" y="${y + h / 2 + (compact ? 12 : 14)}" font-family="${escapeXml(FONT)}" font-size="${compact ? 11 : 12}" fill="${PALETTE.muted}">${escapeXml(metaText)}</text>`
      : '',
    `</g>`
  ].join('')
}

/** A self-contained SVG of the laid-out tree (print palette, optional title). */
export function buildTreeSvg(tree: FamilyTree, layout: Layout, options: TreeSvgOptions): TreeSvg {
  const o = { measure: approximateMeasure, unnamed: '?', ...options }
  const margin = 32
  const header = o.title ? 64 : 0
  // A few pixels of breathing room so card borders at the edges aren't clipped.
  const bleed = 4
  const area = o.crop ?? {
    x: -bleed,
    y: -bleed,
    width: layout.width + bleed * 2,
    height: layout.height + bleed * 2
  }
  const width = Math.ceil(area.width + margin * 2)
  const height = Math.ceil(area.height + margin * 2 + header)
  const visible = (n: { x: number; y: number; width: number; height: number }): boolean =>
    n.x + n.width >= area.x &&
    n.x <= area.x + area.width &&
    n.y + n.height >= area.y &&
    n.y <= area.y + area.height

  const edges = layout.edges
    .map(
      (e) =>
        `<path d="${roundedPath(e.points)}" fill="none" stroke="${PALETTE.edge}" stroke-width="${e.type === 'partner' ? 2.2 : 1.6}"${
          (e.kind && e.kind !== 'biological') || e.ended ? ' stroke-dasharray="5 5"' : ''
        }/>`
    )
    .join('')
  const cards = layout.nodes
    .filter(visible)
    .map((n) => (tree.persons[n.id] ? card(tree.persons[n.id]!, n, o) : ''))
    .join('')

  const title = o.title
    ? `<text x="${margin}" y="${margin + 26}" font-family="${escapeXml(SERIF)}" font-size="26" font-weight="600" fill="${PALETTE.title}">${escapeXml(o.title)}</text>` +
      (o.subtitle
        ? `<text x="${margin}" y="${margin + 48}" font-family="${escapeXml(FONT)}" font-size="13" fill="${PALETTE.muted}">${escapeXml(o.subtitle)}</text>`
        : '')
    : ''

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${PALETTE.background}"/>`,
    title,
    `<svg x="${margin}" y="${margin + header}" width="${area.width}" height="${area.height}" viewBox="${area.x} ${area.y} ${area.width} ${area.height}" overflow="hidden">`,
    edges,
    cards,
    `</svg>`,
    `</svg>`
  ].join('')
  return { svg, width, height }
}
