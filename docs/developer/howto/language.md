---
description: Add a new language to Family Insight – translations, registration, plurals, dates, CSV, installers and documentation.
---

# Add a language

Translators are very welcome. The example adds **German** (`de`); replace it with your language's
[ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).

## 1. Translate the strings

1. Copy `src/shared/locales/en.json` to `src/shared/locales/de.json` and translate every value. Keep
   the keys and the `{{placeholders}}` unchanged.
2. Plurals: provide the forms your language needs ([CLDR plural rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)) – German needs `_one` and `_other`,
   like English; Polish needs `_one`, `_few`, `_many`, `_other`.
3. Add the language's own name under `language.de` in **every** locale file (`"de": "Deutsch"`), so it
   appears in the language menus.

Follow the [style guide](../i18n#style-guide): short, friendly, the same terms everywhere.

## 2. Register it – `src/shared/i18n.ts`

```ts
import de from './locales/de.json'

export const SUPPORTED_LANGUAGES = ['en', 'pl', 'de'] as const

export const resources = {
  en: { translation: en },
  pl: { translation: pl },
  de: { translation: de }
} as const
```

`resolveLanguage` maps system locales such as `de-AT` to `de` automatically. The welcome screen,
the ⚙ menu and **View → Language** list every supported language.

In `src/shared/i18n.test.ts`, add the plural forms to `REQUIRED_PLURALS`
(`de: ['one', 'other']`) and extend the key-parity checks to the new file.

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

Search the code for `'pl'` to find the remaining places:

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
