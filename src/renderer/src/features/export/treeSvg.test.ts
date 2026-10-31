import { describe, expect, it } from 'vitest'
import { layoutFamily } from '@core/layout/layout'
import { remarriageFixture } from '@core/test/fixtures'
import { updatePerson } from '@core/model/operations'
import { buildTreeSvg, escapeXml } from './treeSvg'

describe('buildTreeSvg', () => {
  const tree = updatePerson(remarriageFixture(), 'jan', {
    givenNames: 'Jan <"Janek"> & syn',
    birth: { date: { value: '1890', qualifier: 'exact' } },
    death: { date: { value: '1955', qualifier: 'exact' } }
  })
  const layout = layoutFamily(tree)

  it('draws every person and edge with escaped text', () => {
    const { svg, width, height } = buildTreeSvg(tree, layout, {
      language: 'pl',
      title: 'Kowalscy',
      subtitle: '30.10.2026'
    })
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(svg).toContain('Jan &lt;&quot;Janek&quot;&gt;')
    expect(svg).not.toContain('<"Janek">')
    expect(svg).toContain('1890 – 1955 †')
    expect(svg).toContain('>Kowalscy</text>')
    expect((svg.match(/<path /g) ?? []).length).toBe(layout.edges.length)
    expect(width).toBe(Math.ceil(layout.width + 8 + 64))
    expect(height).toBe(Math.ceil(layout.height + 8 + 64 + 64))
    // Adoptive link is dashed.
    expect(svg).toContain('stroke-dasharray="5 5"')
  })

  it('crops to an area', () => {
    const { svg, width } = buildTreeSvg(tree, layout, {
      language: 'en',
      crop: { x: 0, y: 0, width: 300, height: 100 }
    })
    expect(width).toBe(364)
    expect(svg).toContain('viewBox="0 0 300 100"')
  })

  it('draws the Tapestry style: parchment, medallions, gold thread, knots and a cartouche', () => {
    const tapestryLayout = layoutFamily(tree, { nodeWidth: 184, nodeHeight: 104, partnerGap: 40 })
    const { svg, height } = buildTreeSvg(tree, tapestryLayout, {
      language: 'pl',
      title: 'Kowalscy',
      subtitle: '30.10.2026',
      style: 'tapestry'
    })
    expect(svg).toContain('fill="#efe4cc"')
    expect(svg).toContain('<pattern id="weave"')
    expect(svg).toContain('&apos;Cormorant Variable&apos;')
    expect(svg).toContain('&apos;EB Garamond Variable&apos;')
    expect(svg).not.toContain('Inter Variable')
    // Curved gold thread with a sheen on the solid lines, a knot between neighbouring partners.
    const solid = tapestryLayout.edges.filter(
      (e) => !e.ended && (!e.kind || e.kind === 'biological')
    )
    const neighbours = tapestryLayout.edges.filter(
      (e) => e.type === 'partner' && e.points.length === 2
    )
    expect((svg.match(/stroke="#a8874a" stroke-width="2\.[48]"/g) ?? []).length).toBe(
      tapestryLayout.edges.length
    )
    expect((svg.match(/stroke="#d4a72c"/g) ?? []).length).toBe(solid.length)
    expect((svg.match(/<circle [^>]*r="5"/g) ?? []).length).toBe(neighbours.length)
    expect(svg).toContain('Q')
    // Medallions: names centred under the portrait; the title in a cartouche with flourishes.
    expect(svg).toMatch(
      /text-anchor="middle" font-family="&apos;Cormorant Variable[^"]*" font-size="17"/
    )
    expect(svg).toContain('>Kowalscy</text>')
    expect((svg.match(/viewBox="0 0 80 40"/g) ?? []).length).toBe(2)
    expect(height).toBe(Math.ceil(tapestryLayout.height + 8 + 64 + 112))
  })

  it('leaves the modern export unchanged', () => {
    const plain = buildTreeSvg(tree, layout, { language: 'en', title: 'Kowalscy' })
    expect(
      buildTreeSvg(tree, layout, { language: 'en', title: 'Kowalscy', style: 'modern' })
    ).toEqual(plain)
    expect(plain.svg).not.toContain('Cormorant')
  })

  it('escapes XML', () => {
    expect(escapeXml(`a<b>&"c'`)).toBe('a&lt;b&gt;&amp;&quot;c&apos;')
  })
})
