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
