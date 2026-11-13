import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { unpackDocument } from '../src/core/file/container'
import { parseTree } from '../src/core/file/format'
import { collateralFixture } from '../src/core/layout/fixtures'
import { layoutFamily, type Layout } from '../src/core/layout/layout'
import { CANVAS_1280, CANVAS_1440, fitZoom, layoutMetrics } from '../src/core/layout/metrics'
import { cardSizes } from '../src/core/layout/sizes'
import { displayName } from '../src/core/model/tree'
import type { FamilyTree, TreeViewMode } from '../src/core/model/types'
import type { AppStyle, CardDensity } from '../src/core/settings'

const USAGE = `Usage: npm run layout:preview -- <file.finsight | fixture:collateral> [options]

  --style modern|tapestry       card sizes of a visual style (default modern)
  --density comfortable|compact (default comfortable)
  --mode family|ancestors|descendants|hourglass (default family)
  --out <dir>                   output directory (default: a temp directory)
  --anonymous                   draw ids instead of names in the images
  --list                        also list every crossing and every pair of close lines`

/** Card fills by sex; the preview is a developer tool, not app UI. */
const FILL: Record<string, string> = { male: '#dbe9ff', female: '#ffe0ea', unknown: '#eeeeee' }

function svgOf(tree: FamilyTree, l: Layout, anonymous: boolean): string {
  const pad = 40
  const minX = Math.min(...l.nodes.map((n) => n.x)) - pad
  const w = l.width + pad * 2
  const h = l.height + pad * 2
  const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${minX} ${-pad} ${w} ${h}">`,
    `<rect x="${minX}" y="${-pad}" width="${w}" height="${h}" fill="#ffffff"/>`
  ]
  for (const e of l.edges) {
    const dashed = e.ended || (e.kind && e.kind !== 'biological') ? ' stroke-dasharray="6 4"' : ''
    const colour = e.type === 'partner' ? '#b03030' : '#406080'
    parts.push(
      `<polyline fill="none" stroke="${colour}" stroke-width="2"${dashed} points="${e.points.map((p) => `${p.x},${p.y}`).join(' ')}"/>`
    )
  }
  for (const n of l.nodes) {
    const p = tree.persons[n.id]!
    const root = tree.meta.rootPersonId === n.id
    const label = anonymous ? n.id.slice(0, 8) : displayName(p) || n.id.slice(0, 8)
    parts.push(
      `<rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="8" fill="${root ? '#ffe9a8' : FILL[p.sex ?? 'unknown']}" stroke="#333333"/>`,
      `<text x="${n.x + 10}" y="${n.y + n.height / 2 + 5}" font-family="sans-serif" font-size="15">${esc(label)}</text>`
    )
  }
  parts.push('</svg>')
  return parts.join('\n')
}

export async function main(args: string[]): Promise<number> {
  const opts = new Map<string, string>()
  const flags = new Set<string>()
  let file: string | undefined
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!
    if (a === '--anonymous' || a === '--list') flags.add(a)
    else if (a.startsWith('--')) opts.set(a.slice(2), args[++i] ?? '')
    else file = a
  }
  if (!file) {
    console.error(USAGE)
    return 1
  }
  const style = (opts.get('style') ?? 'modern') as AppStyle
  const density = (opts.get('density') ?? 'comfortable') as CardDensity
  const mode = (opts.get('mode') ?? 'family') as TreeViewMode
  const tree =
    file === 'fixture:collateral'
      ? collateralFixture()
      : parseTree(unpackDocument(new Uint8Array(readFileSync(file))).json)
  const root = tree.meta.rootPersonId
  const layout = layoutFamily(tree, {
    ...cardSizes(style, density),
    mode,
    focusId: root,
    depth: tree.meta.view?.depth
  })
  const m = layoutMetrics(tree, layout)
  const rows: [string, string | number][] = [
    ['people shown', layout.nodes.length],
    ['size (px)', `${layout.width} × ${layout.height}`],
    ['fit zoom, 1440 × 900 window', `${Math.round(fitZoom(layout, CANVAS_1440) * 100)} %`],
    ['fit zoom, 1280 × 800 window', `${Math.round(fitZoom(layout, CANVAS_1280) * 100)} %`],
    ['crossings', m.crossings.length],
    ['crossings on the direct line', m.directCrossings.length],
    ['lines through cards', m.throughCards.length],
    ['parallel lines closer than 16 px', m.closeParallels.length],
    ['longest horizontal segment (px)', Math.round(m.longestHorizontal)],
    ['longest direct-line run (px)', Math.round(m.directMaxRun)],
    ['largest child–parents offset (px)', Math.round(m.maxChildOffset)],
    ['total child-line length (px)', Math.round(m.totalChildLength)]
  ]
  console.log(`${basename(file)} · ${style} ${density} · ${mode}`)
  for (const [k, v] of rows) console.log(`  ${k.padEnd(36)} ${v}`)
  if (flags.has('--list')) {
    for (const c of m.crossings) console.log(`  crossing      ${c}`)
    for (const c of m.closeParallels) console.log(`  close lines   ${c}`)
  }
  const out = opts.get('out') ?? join(tmpdir(), 'family-insight-preview')
  mkdirSync(out, { recursive: true })
  const stem = join(
    out,
    `${basename(file.replace(':', '-')).replace(/\.[^.]+$/, '')}-${style}-${density}-${mode}`
  )
  const svg = svgOf(tree, layout, flags.has('--anonymous'))
  writeFileSync(`${stem}.svg`, svg)
  const png = new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng()
  writeFileSync(`${stem}.png`, png)
  console.log(`  images: ${stem}.svg, ${stem}.png`)
  return 0
}
