import type { Person } from '../model/types'
import { isLiving } from '../model/tree'
import { shortFuzzyDate, type DateLanguage } from './fuzzyDate'

// Genealogical abbreviations (French uses the symbols ° and †).
const BORN: Record<DateLanguage, string> = {
  en: 'b.',
  pl: 'ur.',
  de: 'geb.',
  fr: '°',
  es: 'n.',
  it: 'n.',
  pt: 'n.',
  ru: 'род.'
}
const DIED: Record<DateLanguage, string> = {
  en: 'd.',
  pl: 'zm.',
  de: 'gest.',
  fr: '†',
  es: 'f.',
  it: 'm.',
  pt: 'f.',
  ru: 'ум.'
}

/** Compact lifespan label: `1890 – 1955`, `b. 1921` / `ur. 1921`, `d. 1955` / `zm. 1955`. */
export function lifespanLabel(person: Person, language: DateLanguage): string {
  const birth = person.birth?.date ? shortFuzzyDate(person.birth.date) : undefined
  const death = person.death?.date ? shortFuzzyDate(person.death.date) : undefined
  if (birth && death) return `${birth} – ${death}`
  if (birth) return isLiving(person) === false ? `${birth} – ?` : `${BORN[language]} ${birth}`
  if (death) return `${DIED[language]} ${death}`
  return ''
}
