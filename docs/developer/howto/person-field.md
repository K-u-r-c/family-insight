---
description: Add a new field to people in Family Insight – model, file format and migrations, CSV, editor, details and tests.
---

# Add a field to a person

A new field touches every layer: the model, the `.finsight` file, CSV, the editor and the details
panel. The example adds an optional **occupation** (`occupation?: string`).

## 1. Model – `src/core/model/types.ts`

```ts
export interface Person {
  // …
  notes?: string
  /** Job or profession, free text. */
  occupation?: string
  photo?: string
  // …
}
```

`PersonInput` and `PersonPatch` in `operations.ts` are derived from `Person`, so `addPerson` and
`updatePerson` accept the field automatically.

## 2. File format – validation and versions

Add a check to `checkTreeShape` in `src/core/file/schema.ts`, next to the other optional strings:

```ts
if (!optStr(p.occupation)) errors.push(`${path}.occupation: expected text`)
```

**Do you need a new schema version?**

- **No**, for a new _optional_ field like this one. Older files simply don't have it, and older
  versions of the app ignore unknown fields and keep them when they save.
- **Yes**, when the meaning or shape of existing data changes – a renamed field, a field that becomes
  required, a different structure. Then:
  1. bump `SCHEMA_VERSION` in `types.ts`;
  2. add a migration from the previous version to `MIGRATIONS` in `src/core/file/migrations.ts`:

     ```ts
     export const MIGRATIONS: Record<number, Migration> = {
       // 1 → 2: notes used to hold "Occupation: …" on the first line
       1: (doc) => ({ ...doc, persons: upgradePersons(doc.persons) })
     }
     ```

  3. add a test that a version-1 file opens correctly (see `src/core/file/format.test.ts`).

  Older versions of the app refuse files with a newer `schemaVersion` with a friendly message instead
  of damaging them.

Update the [file format reference](../reference/file-format).

## 3. CSV

In `src/core/io/csv/columns.ts`:

```ts
export const CSV_COLUMNS = [/* … */ 'notes', 'occupation'] as const

export const POLISH_HEADERS: Record<CsvColumn, string> = { /* … */ occupation: 'zawod' }

export const HEADER_ALIASES: Record<CsvColumn, string[]> = {
  // …
  occupation: ['occupation', 'job', 'profession', 'zawod']
}
```

Then read it in `import.ts` (where the person is built from the row:
`...(raw('occupation').trim() ? { occupation: raw('occupation').trim() } : {})`) and write it in
`export.ts` (`occupation: p.occupation ?? ''`). The empty template (`template.ts`) picks the new column
up by itself. Add import/export tests in `src/core/io/csv/*.test.ts` and update the
[CSV format reference](../reference/csv-format) – the specification and the code must match.

## 4. Editor and details

- **Editor** – `src/renderer/src/features/person/PersonEditor.tsx`, for example after the notes:

  ```tsx
  <CommitTextField
    label={t('person.occupation')}
    value={person.occupation ?? ''}
    onCommit={(v) => update({ occupation: v.trim() || undefined })}
  />
  ```

  `update` dispatches an `updatePersonCommand`, so the change is undoable and edits coalesce while
  typing.

- **Details** – show it in `PersonDetails.tsx` (and in the card in `tree/PersonCard.tsx` only if it's
  essential – cards are small).
- **Search and statistics** – if users should find people by it, add it to `searchableText` in
  `src/core/search.ts`.

## 5. Text, tests and docs

- Labels in both locale files ([UI text](./ui-text)).
- Unit tests for schema, CSV and search; an E2E step that edits the field if the UI flow is new.
- Update the [user guide](/guide/editing) (EN and PL), the CSV pages, and regenerate the
  `person-editor` screenshot (`npm run docs:screenshots -- -g person-editor`).
