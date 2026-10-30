import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { i18nResources } from '@shared/i18n'

/** Initialises i18next synchronously for component tests. */
export function setupI18n(language = 'en'): typeof i18next {
  if (!i18next.isInitialized) {
    void i18next.use(initReactI18next).init({
      resources: i18nResources(),
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
