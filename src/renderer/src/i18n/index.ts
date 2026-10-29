import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LANGUAGE, resources, resolveLanguage, type Language } from '@shared/i18n'

const STORAGE_KEY = 'familyInsight.language'

// TODO(settings issue): move persistence to the main-process settings store.
function initialLanguage(): Language {
  return resolveLanguage(localStorage.getItem(STORAGE_KEY) ?? navigator.language)
}

void i18next.use(initReactI18next).init({
  resources,
  lng: initialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false }
})

i18next.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})
document.documentElement.lang = i18next.language

export async function changeLanguage(language: Language): Promise<void> {
  localStorage.setItem(STORAGE_KEY, language)
  await i18next.changeLanguage(language)
  await window.familyInsight.setLanguage(language)
}

export default i18next
