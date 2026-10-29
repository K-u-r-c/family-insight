import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from '@shared/i18n'

/** Initialises i18next synchronously for component tests. */
export function setupI18n(language: 'en' | 'pl' = 'en'): typeof i18next {
  if (!i18next.isInitialized) {
    void i18next.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'en',
      initAsync: false,
      interpolation: { escapeValue: false }
    })
  } else {
    void i18next.changeLanguage(language)
  }
  return i18next
}
