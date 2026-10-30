/** Locale-aware text helpers (pure; take the language explicitly). */

const collators = new Map<string, Intl.Collator>()

/** Collator for sorting names: case-insensitive, Polish letters in Polish order (Ł after L). */
export function collator(language: string): Intl.Collator {
  let c = collators.get(language)
  if (!c) {
    c = new Intl.Collator(language, { sensitivity: 'base', numeric: true })
    collators.set(language, c)
  }
  return c
}

export function compareText(a: string, b: string, language: string): number {
  return collator(language).compare(a, b)
}

/** Lower-case particles that do not count for sorting surnames ("van der Berg" sorts under B). */
const SURNAME_PARTICLES = new Set([
  'von',
  'van',
  'der',
  'den',
  'zu',
  'de',
  'la',
  'le',
  'du',
  'des',
  'da',
  'das',
  'do',
  'dos',
  'di',
  'del',
  'della',
  'dei'
])

/**
 * The part of a surname it is sorted by: leading particles (von, van, de, da, dos, di, del,
 * le …) are skipped while something follows them, so "Le" alone stays "Le".
 */
export function surnameSortKey(surname: string): string {
  const words = surname.trim().split(/\s+/)
  let i = 0
  while (i < words.length - 1 && SURNAME_PARTICLES.has(words[i]!.toLowerCase())) i++
  return words.slice(i).join(' ')
}

/** Compares surnames by their sort key, then in full ("de Vries" next to "Vries"). */
export function compareSurnames(a: string, b: string, language: string): number {
  return compareText(surnameSortKey(a), surnameSortKey(b), language) || compareText(a, b, language)
}

/**
 * Folds text for search: lower-case, strip diacritics. `ł`/`Ł` are mapped explicitly because
 * NFD normalisation does not decompose them.
 */
export function foldText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/** Latin transliteration of Russian, Ukrainian and Belarusian letters (BGN/PCGN-like). */
const CYRILLIC_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  ґ: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  є: 'ye',
  ж: 'zh',
  з: 'z',
  и: 'i',
  і: 'i',
  ї: 'yi',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ў: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya'
}

const hasCyrillic = (text: string): boolean => /\p{Script=Cyrillic}/u.test(text)

/** Folds like `foldText` and also writes `ß` as `ss` – how a search query is compared. */
export function foldQuery(text: string): string {
  return foldText(text).replace(/ß/g, 'ss')
}

/**
 * Forms of a text a search query is compared with: the folded text, German umlauts written
 * out (`Müller` → `mueller`, so "Mueller" finds it while "Muller" still does), and a Latin
 * transliteration of Cyrillic (`Иванов` → `ivanov`).
 */
export function searchForms(text: string): string[] {
  const lower = text.toLowerCase()
  const forms = [foldQuery(text)]
  if (/[äöüß]/.test(lower)) {
    forms.push(foldQuery(lower.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')))
  }
  if (hasCyrillic(lower)) {
    // Before folding: folding turns й into и.
    forms.push(foldQuery([...lower].map((c) => CYRILLIC_LATIN[c] ?? c).join('')))
  }
  return forms
}

/**
 * Whether every word of the query occurs in the text (in any of its search forms); a Cyrillic
 * query also matches Latin transliterations ("Иванов" finds "Ivanov").
 */
export function matchesQuery(text: string, query: string): boolean {
  const words = foldQuery(query).split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const forms = searchForms(text)
  return words.every((word) => {
    const variants = hasCyrillic(word) ? searchForms(word) : [word]
    return variants.some((v) => forms.some((f) => f.includes(v)))
  })
}

export function formatList(
  items: string[],
  language: string,
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  return new Intl.ListFormat(language, { style: 'long', type }).format(items)
}

export function formatNumber(value: number, language: string): string {
  return new Intl.NumberFormat(language).format(value)
}

/** File size with a unit, e.g. "340 kB", "2.4 MB" (decimal units, as file managers show). */
export function formatFileSize(bytes: number, language: string): string {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const
  let value = bytes
  let unit = 0
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000
    unit++
  }
  return new Intl.NumberFormat(language, {
    style: 'unit',
    unit: units[unit],
    unitDisplay: 'short',
    maximumFractionDigits: value < 10 && unit > 0 ? 1 : 0
  }).format(value)
}

/**
 * Masculine form of a Polish surname with a gendered ending (Kowalska → Kowalski,
 * Nowicka → Nowicki, Zawadzka → Zawadzki), part by part for double-barrelled names.
 * Other surnames are returned unchanged.
 */
export function masculineSurname(surname: string): string {
  return surname
    .split('-')
    .map((part) => part.replace(/(sk|ck|dzk)a$/u, '$1i').replace(/(SK|CK|DZK)A$/u, '$1I'))
    .join('-')
}
