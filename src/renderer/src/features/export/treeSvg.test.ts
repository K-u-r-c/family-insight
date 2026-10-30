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

  it('escapes XML', () => {
    expect(escapeXml(`a<b>&"c'`)).toBe('a&lt;b&gt;&amp;&quot;c&apos;')
  })
})
