import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import it from './locales/it.json'
import pl from './locales/pl.json'
import { pseudoLocalize } from './pseudo'

/**
 * Languages of the app. Adding one: create `locales/<code>.json`, add it to `LOCALES` and to
 * `SUPPORTED_LANGUAGES` (see docs/developer/howto/language.md).
 */
export const SUPPORTED_LANGUAGES = ['en', 'pl', 'de', 'fr', 'es', 'it'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]
export const DEFAULT_LANGUAGE: Language = 'en'

/** Development-only pseudo-locale: accented, ~40 % longer English to find layout problems. */
export const PSEUDO_LANGUAGE = 'xx'

export interface LocaleInfo {
  code: Language
  /** The language's name in itself, as the language pickers show it. */
  nativeName: string
  translation: Record<string, unknown>
  /** CSV delimiter Excel uses in this language (decimal-comma locales use `;`). */
  csvDelimiter: ',' | ';'
}

export const LOCALES: Record<Language, LocaleInfo> = {
  en: { code: 'en', nativeName: 'English', translation: en, csvDelimiter: ',' },
  pl: { code: 'pl', nativeName: 'Polski', translation: pl, csvDelimiter: ';' },
  de: { code: 'de', nativeName: 'Deutsch', translation: de, csvDelimiter: ';' },
  fr: { code: 'fr', nativeName: 'Français', translation: fr, csvDelimiter: ';' },
  es: { code: 'es', nativeName: 'Español', translation: es, csvDelimiter: ';' },
  it: { code: 'it', nativeName: 'Italiano', translation: it, csvDelimiter: ';' }
}

let pseudoEnabled = false

/** Turns the pseudo-locale on (development builds, or `FAMILY_INSIGHT_PSEUDO=1`). */
export function enablePseudoLocale(): void {
  pseudoEnabled = true
}

export const isPseudoEnabled = (): boolean => pseudoEnabled

/** All translation resources, shared by the main process (native menu) and the renderer. */
export function i18nResources(): Record<string, { translation: Record<string, unknown> }> {
  const out: Record<string, { translation: Record<string, unknown> }> = {}
  for (const locale of Object.values(LOCALES))
    out[locale.code] = { translation: locale.translation }
  if (pseudoEnabled) out[PSEUDO_LANGUAGE] = { translation: pseudoLocalize(en) }
  return out
}

/** Languages the pickers offer, each in its own name. */
export function languageOptions(): { value: string; label: string }[] {
  const options = SUPPORTED_LANGUAGES.map((code) => ({
    value: code,
    label: LOCALES[code].nativeName
  }))
  return pseudoEnabled ? [...options, { value: PSEUDO_LANGUAGE, label: 'Ƥşḗŭḓǿ' }] : options
}

export function isLanguage(value: unknown): value is Language {
  return (
    typeof value === 'string' &&
    ((SUPPORTED_LANGUAGES as readonly string[]).includes(value) ||
      (pseudoEnabled && value === PSEUDO_LANGUAGE))
  )
}

/**
 * Picks the best supported language for a BCP 47 locale (`pl-PL`, `pt-BR`, `de-AT`, `fr-CA`,
 * `zh-Hant-TW` …): the base language when supported, otherwise English.
 */
export function resolveLanguage(locale: string | undefined | null): Language {
  const tag = locale?.trim().toLowerCase().replace(/_/g, '-') ?? ''
  if (pseudoEnabled && tag === PSEUDO_LANGUAGE) return PSEUDO_LANGUAGE as Language
  const base = tag.split('-')[0]
  return isLanguage(base) ? base : DEFAULT_LANGUAGE
}

/** Default CSV delimiter for a language (`;` where Excel uses a decimal comma). */
export const csvDelimiterFor = (language: string): ',' | ';' =>
  isLanguage(language) && language in LOCALES ? LOCALES[language as Language].csvDelimiter : ','

/** The language to use with `Intl` (dates, numbers, sorting): the pseudo-locale formats as English. */
export const intlLanguage = (language: string): string =>
  language === PSEUDO_LANGUAGE ? 'en' : language
