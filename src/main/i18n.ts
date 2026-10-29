import i18next, { type i18n, type TFunction } from 'i18next'
import { resources, type Language } from '@shared/i18n'

/** Separate i18next instance for the main process (native menu, dialogs). */
const instance: i18n = i18next.createInstance()

export async function initMainI18n(language: Language): Promise<void> {
  await instance.init({
    resources,
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  })
}

export async function setMainLanguage(language: Language): Promise<void> {
  await instance.changeLanguage(language)
}

export const t: TFunction = ((...args: Parameters<TFunction>) => instance.t(...args)) as TFunction
