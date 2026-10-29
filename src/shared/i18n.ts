import en from './locales/en.json'
import pl from './locales/pl.json'

export const SUPPORTED_LANGUAGES = ['en', 'pl'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]
export const DEFAULT_LANGUAGE: Language = 'en'

/** All translation resources, shared by the main process (native menu) and the renderer. */
export const resources = {
  en: { translation: en },
  pl: { translation: pl }
} as const

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

/** Picks the best supported language for a BCP 47 locale such as `pl-PL`. */
export function resolveLanguage(locale: string | undefined | null): Language {
  const base = locale?.toLowerCase().split(/[-_]/)[0]
  return isLanguage(base) ? base : DEFAULT_LANGUAGE
}
