import 'i18next'
import type en from '../../../shared/locales/en.json'

// Makes `t()` keys type-checked against the English dictionary.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof en }
  }
}
