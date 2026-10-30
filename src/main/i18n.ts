import i18next, { type i18n, type TFunction } from 'i18next'
import { i18nResources } from '@shared/i18n'

/** Separate i18next instance for the main process (native menu, dialogs). */
const instance: i18n = i18next.createInstance()

export async function initMainI18n(language: string): Promise<void> {
  await instance.init({
    resources: i18nResources(),
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  })
}

export async function setMainLanguage(language: string): Promise<void> {
  await instance.changeLanguage(language)
}

export const t: TFunction = ((...args: Parameters<TFunction>) => instance.t(...args)) as TFunction
