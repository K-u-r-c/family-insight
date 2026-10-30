import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { csvDelimiterFor, DEFAULT_LANGUAGE, i18nResources, resolveLanguage } from '@shared/i18n'
import { useSettings } from '@renderer/store/settings'

export async function initI18n(language: string): Promise<void> {
  await i18next.use(initReactI18next).init({
    resources: i18nResources(),
    lng: resolveLanguage(language),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false }
  })
  document.documentElement.lang = i18next.language
  i18next.on('languageChanged', (lng) => {
    document.documentElement.lang = lng
  })
  // Follow changes coming from main (e.g. another window or the menu).
  useSettings.subscribe((state, prev) => {
    if (state.settings.language !== prev.settings?.language) {
      void i18next.changeLanguage(resolveLanguage(state.settings.language))
    }
  })
}

/** Switches the UI language; main persists it and re-localises the native menu. */
export async function changeLanguage(language: string): Promise<void> {
  await i18next.changeLanguage(language)
  // Sensible CSV default for the language (Excel in decimal-comma locales expects semicolons).
  await useSettings.getState().update({ language, csvDelimiter: csvDelimiterFor(language) })
}

export default i18next
