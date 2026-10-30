/**
 * Pseudo-localisation for development: every letter gets an accent and every string grows by
 * ~40 % (the longest of the real languages, German, is about that much longer than English).
 * Placeholders (`{{count}}`), keys and plural suffixes stay intact, so the app works normally
 * and untranslated (hard-coded) text stands out because it has no accents.
 */

const PLAIN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const FANCY = [...'áƀçḓéƒğĥíĵķļɱñöþǫŕšţüṽŵẋýžÁƁÇḒÉƑĞĤÍĴĶĻṀÑÖÞǪŔŠŢÜṼŴẊÝŽ']
const ACCENTED: Record<string, string> = Object.fromEntries(
  [...PLAIN].map((c, i) => [c, FANCY[i]!])
)

/** Accents letters outside `{{placeholders}}` and pads the string to ~140 % of its length. */
export function pseudoString(text: string): string {
  const accented = text
    .split(/(\{\{[^}]+\}\}|<[^>]+>)/)
    .map((part, i) => (i % 2 ? part : [...part].map((c) => ACCENTED[c] ?? c).join('')))
    .join('')
  const letters = text.replace(/\{\{[^}]+\}\}/g, '').length
  const padding = Math.ceil(letters * 0.4)
  return padding ? `${accented} ${'·'.repeat(Math.max(1, padding - 1))}` : accented
}

export function pseudoLocalize<T>(dict: T): T {
  if (typeof dict === 'string') return pseudoString(dict) as T
  if (typeof dict !== 'object' || dict === null) return dict
  return Object.fromEntries(
    Object.entries(dict as Record<string, unknown>).map(([k, v]) => [k, pseudoLocalize(v)])
  ) as T
}
