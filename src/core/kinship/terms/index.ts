import type { KinshipLanguage } from './common'
import { german } from './de'
import { english } from './en'
import { spanish } from './es'
import { french } from './fr'
import { italian } from './it'
import { polish } from './pl'
import { portuguese } from './pt'
import { russian } from './ru'

export type { KinshipLanguage, KinshipTerm } from './common'

const LANGUAGES: Record<string, KinshipLanguage> = {
  en: english,
  pl: polish,
  de: german,
  fr: french,
  es: spanish,
  it: italian,
  pt: portuguese,
  ru: russian
}

/** Kinship names in a UI language (English for languages without their own). */
export function kinshipLanguage(language: string): KinshipLanguage {
  return LANGUAGES[language] ?? english
}
