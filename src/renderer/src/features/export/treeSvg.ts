import type { Layout, LayoutNode } from '@core/layout/layout'
import { lifespanLabel } from '@core/date/lifespan'
import type { DateLanguage } from '@core/date/fuzzyDate'
import { displayName, isLiving } from '@core/model/tree'
import type { FamilyTree, Person, Sex } from '@core/model/types'
import type { AppStyle } from '@core/settings'
import { roundedPath } from '@renderer/features/tree/EdgesLayer'
import flourishSvg from '@renderer/assets/ornaments/flourish.svg?raw'
import weaveSvg from '@renderer/assets/ornaments/weave.svg?raw'

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

/** Tapestry on paper: always the parchment variant (a dark cloth would waste ink). */
const TAPESTRY = {
  background: '#efe4cc',
  weave: '#d8c7a2',
  vignette: '#5e4a33',
  cardTop: '#fbf5e6',
  card: '#f8f0dc',
  gold: '#a8874a',
  sheen: '#d4a72c',
  text: '#2b1d12',
  muted: '#5e4a33',
  sex: { female: '#9c3f5c', male: '#2f5583', other: '#6a4a8f', unknown: '#7a6b55' } as Record<
    Sex,
    string
  >,
  soft: { female: '#f0dbe0', male: '#dde4ee', other: '#e7def0', unknown: '#e8e0d2' } as Record<
    Sex,
    string
  >,
  initials: { female: '#8a3450', male: '#2a4c78', other: '#5c3f80', unknown: '#5a4f40' } as Record<
    Sex,
    string
  >
}
const T_SERIF = "'Cormorant Variable', 'EB Garamond Variable', Georgia, serif"
const T_BODY = "'EB Garamond Variable', Georgia, 'Times New Roman', serif"

/** One of our ornament SVGs, recoloured and placed (`mirror` flips it horizontally). */
function ornament(
  source: string,
  color: string,
  box: { x: number; y: number; width: number; height: number },
  mirror = false
): string {
  const inner = source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/#000/g, color)
    .replace(
      /<svg([^>]*)>/,
      `<svg$1 x="${mirror ? -box.x - box.width : box.x}" y="${box.y}" width="${box.width}" height="${box.height}">`
    )
    .trim()
  return mirror ? `<g transform="scale(-1 1)">${inner}</g>` : inner
}

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
  /** Portrait to embed as a data URL (exports can't load the app's object URLs). */
  portrait?: (person: Person) => string | undefined
  /** Visual style of the export (default: modern). */
  style?: AppStyle
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
  const photo = o.portrait?.(person)
  const clipId = `clip-${node.id.replace(/[^a-zA-Z0-9-]/g, '')}`
  const nameY = metaText ? y + h / 2 - 2 : y + h / 2 + 5
  return [
    `<g>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${compact ? 10 : 14}" fill="${PALETTE.card}" stroke="${PALETTE.border}"/>`,
    `<rect x="${x}" y="${y + 10}" width="3" height="${h - 20}" rx="1.5" fill="${PALETTE.sex[person.sex]}"/>`,
    photo
      ? `<clipPath id="${clipId}"><circle cx="${ax + avatar / 2}" cy="${ay + avatar / 2}" r="${avatar / 2}"/></clipPath><image href="${photo}" x="${ax}" y="${ay}" width="${avatar}" height="${avatar}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`
      : `<circle cx="${ax + avatar / 2}" cy="${ay + avatar / 2}" r="${avatar / 2}" fill="${PALETTE.soft[person.sex]}"/><text x="${ax + avatar / 2}" y="${ay + avatar / 2 + avatar * 0.14}" text-anchor="middle" font-family="${escapeXml(FONT)}" font-size="${Math.round(avatar * 0.38)}" font-weight="650" fill="${PALETTE.sex[person.sex]}">${escapeXml(initials)}</text>`,
    `<text x="${tx}" y="${nameY}" font-family="${escapeXml(FONT)}" font-size="${compact ? 13 : 14}" font-weight="600" fill="${deceased ? PALETTE.muted : PALETTE.text}">${escapeXml(name)}</text>`,
    metaText
      ? `<text x="${tx}" y="${y + h / 2 + (compact ? 12 : 14)}" font-family="${escapeXml(FONT)}" font-size="${compact ? 11 : 12}" fill="${PALETTE.muted}">${escapeXml(metaText)}</text>`
      : '',
    `</g>`
  ].join('')
}

function initialsOf(person: Person): string {
  return (
    ((person.givenNames.trim()[0] ?? '') + (person.surname.trim()[0] ?? '')).toLocaleUpperCase() ||
    '?'
  )
}

/** A Tapestry card: a framed medallion (portrait above the name), or a framed row when compact. */
function tapestryCard(
  person: Person,
  node: LayoutNode,
  o: Required<Pick<TreeSvgOptions, 'language' | 'measure' | 'unnamed'>> & TreeSvgOptions
): string {
  const P = TAPESTRY
  const { x, y, width: w, height: h } = node
  const upright = h >= 90
  const avatar = upright ? 40 : 30
  const ax = upright ? x + w / 2 - avatar / 2 : x + 12
  const ay = upright ? y + 10 : y + (h - avatar) / 2
  const nameSize = upright ? 17 : 15
  const nameFont = `650 ${nameSize}px ${T_SERIF}`
  const metaFont = `400 12px ${T_BODY}`
  const textWidth = upright ? w - 24 : x + w - (ax + avatar + 10) - 8
  const name = ellipsize(displayName(person) || o.unnamed, textWidth, nameFont, o.measure)
  const lifespan = lifespanLabel(person, o.language)
  const deceased = isLiving(person) === false
  const meta = [
    lifespan + (deceased && lifespan ? ' †' : ''),
    person.birthSurname && o.bornLabel ? o.bornLabel(person.birthSurname) : ''
  ]
    .filter(Boolean)
    .join(' · ')
  const metaText = meta ? ellipsize(meta, textWidth, metaFont, o.measure) : ''
  const photo = o.portrait?.(person)
  const clipId = `clip-${node.id.replace(/[^a-zA-Z0-9-]/g, '')}`
  const gradId = `card-${node.id.replace(/[^a-zA-Z0-9-]/g, '')}`
  const cx = ax + avatar / 2
  const cy = ay + avatar / 2
  const tx = upright ? x + w / 2 : ax + avatar + 10
  const anchor = upright ? ' text-anchor="middle"' : ''
  const nameY = upright ? ay + avatar + 22 : metaText ? y + h / 2 - 1 : y + h / 2 + 5
  const metaY = upright ? nameY + 16 : y + h / 2 + 15
  return [
    `<g>`,
    `<linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.cardTop}"/><stop offset="1" stop-color="${P.card}"/></linearGradient>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#${gradId})" stroke="${P.gold}"/>`,
    `<rect x="${x + 4.5}" y="${y + 4.5}" width="${w - 9}" height="${h - 9}" rx="7" fill="none" stroke="${P.gold}" stroke-width="1"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${avatar / 2 + 3}" fill="none" stroke="${P.sex[person.sex]}" stroke-width="2"/>`,
    photo
      ? `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${avatar / 2}"/></clipPath><image href="${photo}" x="${ax}" y="${ay}" width="${avatar}" height="${avatar}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`
      : `<circle cx="${cx}" cy="${cy}" r="${avatar / 2}" fill="${P.soft[person.sex]}"/><text x="${cx}" y="${cy + avatar * 0.15}" text-anchor="middle" font-family="${escapeXml(T_SERIF)}" font-size="${Math.round(avatar * 0.42)}" font-weight="650" fill="${P.initials[person.sex]}">${escapeXml(initialsOf(person))}</text>`,
    `<text x="${tx}" y="${nameY}"${anchor} font-family="${escapeXml(T_SERIF)}" font-size="${nameSize}" font-weight="650" fill="${deceased ? P.muted : P.text}">${escapeXml(name)}</text>`,
    metaText
      ? `<text x="${tx}" y="${metaY}"${anchor} font-family="${escapeXml(T_BODY)}" font-size="12" fill="${P.muted}">${escapeXml(metaText)}</text>`
      : '',
    `</g>`
  ].join('')
}

/** Gold thread lines with a sheen, and a knot between neighbouring partners. */
function tapestryEdges(layout: Layout): string {
  const P = TAPESTRY
  return layout.edges
    .map((e) => {
      const d = roundedPath(e.points, 24)
      const dashed = (e.kind && e.kind !== 'biological') || e.ended
      const base = `<path d="${d}" fill="none" stroke="${P.gold}" stroke-width="${e.type === 'partner' ? 2.8 : 2.4}" stroke-linecap="round"${dashed ? ' stroke-dasharray="7 5"' : ''}/>`
      const sheen = dashed
        ? ''
        : `<path d="${d}" fill="none" stroke="${P.sheen}" stroke-width="0.8" stroke-linecap="round" opacity="0.55"/>`
      const knot =
        e.type === 'partner' && e.points.length === 2
          ? `<circle cx="${(e.points[0]!.x + e.points[1]!.x) / 2}" cy="${(e.points[0]!.y + e.points[1]!.y) / 2}" r="5" fill="${P.cardTop}" stroke="${P.gold}" stroke-width="2.2"${dashed ? ' stroke-dasharray="3 2"' : ''}/>`
          : ''
      return base + sheen + knot
    })
    .join('')
}

/** Parchment with woven threads and a vignette, and the title in a framed cartouche. */
function tapestryBackdrop(
  width: number,
  margin: number,
  o: TreeSvgOptions & { measure: Measure }
): string {
  const P = TAPESTRY
  const weave = weaveSvg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/#000/g, P.weave)
    .replace(/<svg[^>]*>/, '')
    .replace('</svg>', '')
  const parts = [
    `<defs><pattern id="weave" width="22" height="22" patternUnits="userSpaceOnUse">${weave}</pattern>`,
    `<radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="${P.vignette}" stop-opacity="0"/><stop offset="1" stop-color="${P.vignette}" stop-opacity="0.22"/></radialGradient></defs>`,
    `<rect width="100%" height="100%" fill="${P.background}"/>`,
    `<rect width="100%" height="100%" fill="url(#weave)"/>`,
    `<rect width="100%" height="100%" fill="url(#vignette)"/>`
  ]
  if (o.title) {
    const size = 34
    const textWidth = o.measure(o.title, `600 ${size}px ${T_SERIF}`)
    const boxW = Math.max(textWidth + 72, 220)
    const boxH = 58
    const bx = width / 2 - boxW / 2
    const by = margin
    parts.push(
      `<rect x="${bx}" y="${by}" width="${boxW}" height="${boxH}" rx="6" fill="${P.cardTop}" stroke="${P.gold}"/>`,
      `<rect x="${bx + 5}" y="${by + 5}" width="${boxW - 10}" height="${boxH - 10}" rx="4" fill="none" stroke="${P.gold}"/>`,
      `<text x="${width / 2}" y="${by + boxH / 2 + size * 0.33}" text-anchor="middle" font-family="${escapeXml(T_SERIF)}" font-size="${size}" font-weight="600" fill="${P.text}">${escapeXml(o.title)}</text>`,
      ornament(flourishSvg, P.gold, { x: bx - 86, y: by + boxH / 2 - 20, width: 80, height: 40 }),
      ornament(
        flourishSvg,
        P.gold,
        { x: bx + boxW + 6, y: by + boxH / 2 - 20, width: 80, height: 40 },
        true
      )
    )
    if (o.subtitle) {
      parts.push(
        `<text x="${width / 2}" y="${by + boxH + 22}" text-anchor="middle" font-family="${escapeXml(T_BODY)}" font-size="14" font-style="italic" fill="${P.muted}">${escapeXml(o.subtitle)}</text>`
      )
    }
  }
  return parts.join('')
}

/** A self-contained SVG of the laid-out tree (print palette, optional title). */
export function buildTreeSvg(tree: FamilyTree, layout: Layout, options: TreeSvgOptions): TreeSvg {
  const o = { measure: approximateMeasure, unnamed: '?', ...options }
  const tapestry = o.style === 'tapestry'
  const margin = 32
  const header = o.title ? (tapestry ? (o.subtitle ? 112 : 88) : 64) : 0
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

  const edges = tapestry
    ? tapestryEdges(layout)
    : layout.edges
        .map(
          (e) =>
            `<path d="${roundedPath(e.points)}" fill="none" stroke="${PALETTE.edge}" stroke-width="${e.type === 'partner' ? 2.2 : 1.6}"${
              (e.kind && e.kind !== 'biological') || e.ended ? ' stroke-dasharray="5 5"' : ''
            }/>`
        )
        .join('')
  const cards = layout.nodes
    .filter(visible)
    .map((n) =>
      tree.persons[n.id] ? (tapestry ? tapestryCard : card)(tree.persons[n.id]!, n, o) : ''
    )
    .join('')

  const title = tapestry
    ? tapestryBackdrop(width, margin, o)
    : o.title
      ? `<text x="${margin}" y="${margin + 26}" font-family="${escapeXml(SERIF)}" font-size="26" font-weight="600" fill="${PALETTE.title}">${escapeXml(o.title)}</text>` +
        (o.subtitle
          ? `<text x="${margin}" y="${margin + 48}" font-family="${escapeXml(FONT)}" font-size="13" fill="${PALETTE.muted}">${escapeXml(o.subtitle)}</text>`
          : '')
      : ''

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    tapestry ? '' : `<rect width="100%" height="100%" fill="${PALETTE.background}"/>`,
    title,
    `<svg x="${margin}" y="${margin + header}" width="${area.width}" height="${area.height}" viewBox="${area.x} ${area.y} ${area.width} ${area.height}" overflow="hidden">`,
    edges,
    cards,
    `</svg>`,
    `</svg>`
  ].join('')
  return { svg, width, height }
}
