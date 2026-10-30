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

## 3. Dates – `src/core/date/dateLocales.ts`

Each language has an entry in `DATE_LOCALES` (and its code in `DATE_LANGUAGES`):

- `months` – the month names by grammatical form: `day` as written in a day date (`12 marca`,
  `12 марта`), `month` for a month on its own (`marzec 1890`), plus any form other phrases need
  (Polish `before`/`after`: `przed majem`, `po maju`). `aliases` takes regional spellings
  (`Jänner`, `setiembre`).
- `qualifiers` – the phrases people type for _about_, _before_ and _after_, longest form first
  (`vor dem`, `vor`).
- `numeric` – the numeric order for editing: `'.'` (`12.05.1890`), `'/'` (`12/05/1890`) or
  `null` (ISO).
- `write` – how a date is written, with the right prepositions and articles (`avant le 1er mars`,
  `12 de mayo de 1890`).

The parser accepts every language's words at once (there are no clashes; a test checks that each
language reads back what it writes). `src/core/date/lifespan.ts` has the born/died abbreviations
for cards (`b.`, `ur.`, `geb.`). `dateLocales.test.ts` runs every month form, every qualifier and a
round trip `parse(format(d))` for each language automatically.

## 4. Language-specific behaviour

| Place                                                           | What to decide                                                                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/i18n.ts` (`LOCALES`)                                | the CSV delimiter Excel uses in the language (`;` where the decimal separator is a comma)                                                         |
| `src/core/io/csv/columns.ts`                                    | column names and `sex` / `living` values (`HEADERS`, `SEX_VALUES`, `LIVING_VALUES`) if the language isn't there yet; list them in `csv-format.md` |
| `src/renderer/src/services/sampleTree.ts`, `resources/samples/` | optional: a sample family in the new language                                                                                                     |
| `src/core/text.ts`                                              | usually nothing – sorting uses `Intl.Collator`; add search variants if the script needs them (as for Cyrillic)                                    |

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
