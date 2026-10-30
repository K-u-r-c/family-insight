---
description: Add or change user-visible text in Family Insight – locale keys in English and Polish, plurals, interpolation and the checks that keep them in sync.
---

# Add or change UI text

Every string the user sees comes from `src/shared/locales/en.json` and `pl.json`. Never write text
directly in a component, in the main process or in a dialog.

## 1. Add the key to both files

Group keys by area (`person.*`, `csv.*`, `tree.*` …) and use the same key in both files:

```json
// en.json
"person": {
  "occupation": "Occupation",
  "occupationHint": "For example teacher, farmer, engineer"
}
```

```json
// pl.json
"person": {
  "occupation": "Zawód",
  "occupationHint": "Na przykład nauczyciel, rolnik, inżynier"
}
```

## 2. Use it

In React:

```tsx
const { t } = useTranslation()
return <TextField label={t('person.occupation')} hint={t('person.occupationHint')} />
```

Keys are **type-checked** against `en.json` (`src/renderer/src/i18n/types.d.ts`), so a typo fails
`npm run typecheck`. Outside components use `i18n.t` from `@renderer/i18n`; in main use the helpers in
`src/main/i18n.ts` (the native menu and dialogs).

### Interpolation and plurals

```tsx
t('person.deleteTitle', { name }) // "Delete {{name}}?"
t('people.count', { count: people.length })
```

A plural key needs every form of each language – English `_one`, `_other`; Polish `_one`, `_few`,
`_many`, `_other`:

```json
"count_one": "{{count}} osoba",
"count_few": "{{count}} osoby",
"count_many": "{{count}} osób",
"count_other": "{{count}} osoby"
```

Never build sentences by concatenating translated pieces – word order differs between languages.

### Dynamic keys

When a key is built from a value, write it as a template literal so the unused-key check can see the
prefix: ``t(`sex.${person.sex}`)``.

## 3. Let the tests check you

`npm test` runs `src/shared/i18n.test.ts`, which fails when:

- the two files have different keys, or a value is empty;
- a plural key misses a form;
- a `t('…')` call uses a key that doesn't exist;
- a key isn't used anywhere in `src/` (remove keys you no longer need).

## 4. Check it on screen

Long Polish labels are the usual problem. Look at the change in **both languages** and **both themes**
(switch on the welcome screen or in ⚙). If the text appears in the guide, update the
[user guide](/guide/) pages and regenerate affected [screenshots](../screenshots).

See [Internationalisation](../i18n) for the style guide and glossary.
