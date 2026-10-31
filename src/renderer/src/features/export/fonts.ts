/**
 * Embeds the app's fonts into an exported SVG. An SVG drawn as an image (PNG export), printed or
 * opened elsewhere can't use the page's fonts, so the `@font-face` rules of the fonts the SVG
 * uses are copied in with their files as data URLs – only the subsets (Latin, Cyrillic …) whose
 * characters appear in the text.
 */

const FAMILIES = [
  'Inter Variable',
  'Source Serif 4 Variable',
  'Cormorant Variable',
  'EB Garamond Variable'
]
const cache = new Map<string, Promise<string | null>>()

/** Whether any character of `text` falls into a CSS `unicode-range`. */
export function coversText(range: string, text: string): boolean {
  if (!range.trim()) return true
  const spans = range.split(',').map((part) => {
    const [from, to] = part.trim().replace(/^U\+/i, '').split('-')
    const start = parseInt(from!.replace(/\?/g, '0'), 16)
    const end = to ? parseInt(to, 16) : parseInt(from!.replace(/\?/g, 'F'), 16)
    return [start, end] as const
  })
  for (const char of text) {
    const code = char.codePointAt(0)!
    if (spans.some(([a, b]) => code >= a && code <= b)) return true
  }
  return false
}

async function dataUrl(url: string): Promise<string | null> {
  let pending = cache.get(url)
  if (!pending) {
    pending = fetch(url)
      .then((r) => (r.ok ? r.blob() : null))
      .then(
        (blob) =>
          blob &&
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
          })
      )
      .catch(() => null)
    cache.set(url, pending)
  }
  return pending
}

/** The text content of an SVG document (all `<text>` elements). */
function svgText(svg: string): string {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(' ')
}

export async function embedFonts(svg: string): Promise<string> {
  if (typeof document === 'undefined') return svg
  const text = svgText(svg)
  const rules: string[] = []
  for (const sheet of [...document.styleSheets]) {
    let cssRules: CSSRuleList
    try {
      cssRules = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of [...cssRules]) {
      if (!(rule instanceof CSSFontFaceRule)) continue
      const family = rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim()
      // Only the families the picture uses (each style has its own).
      if (!FAMILIES.includes(family) || !svg.includes(family)) continue
      if (!coversText(rule.style.getPropertyValue('unicode-range'), text)) continue
      const src = /url\(["']?([^"')]+)["']?\)/.exec(rule.style.getPropertyValue('src'))?.[1]
      if (!src) continue
      const data = await dataUrl(new URL(src, sheet.href ?? location.href).href)
      if (!data) continue
      rules.push(
        `@font-face{font-family:'${family}';font-style:${rule.style.getPropertyValue('font-style') || 'normal'};font-weight:${rule.style.getPropertyValue('font-weight') || '100 900'};src:url(${data}) format('woff2');unicode-range:${rule.style.getPropertyValue('unicode-range') || 'U+0-10FFFF'}}`
      )
    }
  }
  if (!rules.length) return svg
  return svg.replace(/(<svg[^>]*>)/, `$1<defs><style>${rules.join('')}</style></defs>`)
}
