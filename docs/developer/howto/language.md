---
description: Add a new language to Family Insight – translations, registration, plurals, dates, CSV, installers and documentation.
---

# Add a language

Translators are very welcome. The example adds **German** (`de`); replace it with your language's
[ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).

## 1. Translate the strings

1. Copy `src/shared/locales/en.json` to `src/shared/locales/de.json` and translate every value. Keep
   the keys and the `{{placeholders}}` unchanged.
2. Plurals: provide exactly the forms your language needs – the tests read them from
   `Intl.PluralRules` (German `_one`, `_other`; Polish and Russian `_one`, `_few`, `_many`,
   `_other`; French, Spanish, Italian and Portuguese also `_many`, used for large round numbers).
3. Use the approved terms from the [glossary for translators](../i18n-glossary) and add your column
   there.

Follow the [style guide](../i18n#style-guide): short, friendly, the same terms everywhere.

## 2. Register it – `src/shared/i18n.ts`

```ts
import de from './locales/de.json'

export const SUPPORTED_LANGUAGES = ['en', 'pl', 'de'] as const

export const LOCALES: Record<Language, LocaleInfo> = {
  // …
  de: { code: 'de', nativeName: 'Deutsch', translation: de, csvDelimiter: ';' }
}
```

`nativeName` is how the language pickers (welcome screen, ⚙ menu, **View → Language**) show it –
always in the language itself. `csvDelimiter` is the default CSV separator (`;` where Excel uses a
decimal comma). `resolveLanguage` maps system locales such as `de-AT` to `de` automatically.

`src/shared/i18n.test.ts` checks every registered language: the same keys as English, the plural
forms the language needs, the same placeholders per message, no empty texts and nothing left in
English (except an allowlist for names and formats).

**Pseudo-locale:** in development (`npm run dev`, or `FAMILY_INSIGHT_PSEUDO=1`) the pickers offer
_Ƥşḗŭḓǿ_ (`xx`): English with accents and 40 % longer texts. Use it to find cut-off labels and
hard-coded text (anything without accents).

## 3. Dates – `src/core/date/fuzzyDate.ts`

`formatFuzzyDate` has the month names and the qualifier words per language:

- extend `DateLanguage` with `'de'`;
- add `QUALIFIER_LABEL.de` (`{ exact: '', about: 'um ', before: 'vor ', after: 'nach ' }`);
- add the month names and a branch in `formatFuzzyDate` (Polish needs grammatical cases; most
  languages just need one list).

If people write dates in the new language, add its qualifier words to `QUALIFIER_WORDS` in
`parseFuzzyDate` (`um`, `vor`, `nach`) and cover them in `fuzzyDate.test.ts`. `DateField.tsx` shows
dates day-first for Polish (`dateToInput`) – decide the input format for your language there.

## 4. Language-specific behaviour

Search the code for `'pl'` to find the remaining places (dates and CSV fall back to English until
the language has its own tables):

| Place                                                                        | What to decide                                                                                                                       |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/core/settings.ts`, `src/main/menu.ts`, `src/renderer/src/i18n/index.ts` | default CSV separator for the language (`;` where Excel expects it)                                                                  |
| `src/core/io/csv/columns.ts`, `export.ts`, `ExportCsvDialog.tsx`             | optional: column names and values in the new language (`HeaderLanguage`); add header aliases so imports with translated headers work |
| `src/renderer/src/services/sampleTree.ts`, `resources/samples/`              | optional: a sample family in the new language                                                                                        |
| `src/core/text.ts`                                                           | nothing – sorting uses `Intl.Collator` for the language                                                                              |

## 5. Installers and desktop integration

- `electron-builder.yml`: add the NSIS installer language (`de_DE`) to `installerLanguages`, and a
  `Comment[de]` line to the Linux desktop entry.

## 6. Documentation (optional, but lovely)

The website has English and Polish user guides. A new guide language means a new VitePress locale in
`docs/.vitepress/config.mts` (labels, sidebar), translated pages under `docs/de/guide/`, and a new entry
in `VARIANTS` in `docs/.screenshots/shoot.ts` so screenshots are generated in the language.

## 7. Check

Run `npm run check`, start the app, switch to the new language and walk through the main screens and
dialogs – long words break layouts. Then open a pull request; native speakers' reviews are welcome.
