/**
 * Languages of the documentation website and their texts (navigation, sidebar, search, theme
 * components). The user guide exists in every language under `docs/<code>/guide/` (English at the
 * root); the developer docs are English only. Texts live in `locales/<code>.json`.
 */
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import it from './locales/it.json'
import pl from './locales/pl.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'

export interface SiteLanguage {
  code: string
  /** Name in the language itself, as the language menu shows it. */
  label: string
  /** URL prefix: '' for English (the root), '/pl' … */
  prefix: string
  /** Open Graph locale. */
  og: string
}

export const SITE_LANGUAGES: SiteLanguage[] = [
  { code: 'en', label: 'English', prefix: '', og: 'en_GB' },
  { code: 'pl', label: 'Polski', prefix: '/pl', og: 'pl_PL' },
  { code: 'de', label: 'Deutsch', prefix: '/de', og: 'de_DE' },
  { code: 'fr', label: 'Français', prefix: '/fr', og: 'fr_FR' },
  { code: 'es', label: 'Español', prefix: '/es', og: 'es_ES' },
  { code: 'it', label: 'Italiano', prefix: '/it', og: 'it_IT' },
  { code: 'pt', label: 'Português', prefix: '/pt', og: 'pt_BR' },
  { code: 'ru', label: 'Русский', prefix: '/ru', og: 'ru_RU' }
]

const TEXTS: Record<string, Record<string, string>> = { en, pl, de, fr, es, it, pt, ru }

/** The site language of a page language (`lang` from VitePress, e.g. `pt-BR`) – English otherwise. */
export function siteLanguage(lang: string): string {
  const code = lang.toLowerCase().split('-')[0]!
  return code in TEXTS ? code : 'en'
}

/** A text of the site in a language, with `{name}` placeholders filled in. */
export function siteText(code: string, key: string, vars: Record<string, string> = {}): string {
  const text = TEXTS[code]?.[key] ?? TEXTS.en![key] ?? key
  return text.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? '')
}
