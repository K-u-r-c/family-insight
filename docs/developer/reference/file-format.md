---
description: The .finsight file format – a versioned JSON document with people and relationships, its fields, validation and migration policy.
---

# `.finsight` file format

A Family Insight tree is a single **UTF-8 JSON** file with the extension `.finsight`. It contains
everything – people, relationships, photos, the root person and the view – so it can be copied,
backed up and opened anywhere. The TypeScript shape is `FamilyTree` in
[`src/core/model/types.ts`](https://github.com/K-u-r-c/family-insight/blob/main/src/core/model/types.ts);
reading and writing are `parseTree` and `serializeTree` in `src/core/file/format.ts`.

## Example

```json
{
  "format": "family-insight",
  "schemaVersion": 1,
  "meta": {
    "name": "Kowalscy",
    "createdAt": "2026-10-29T18:42:00.000Z",
    "updatedAt": "2026-10-30T09:15:12.345Z",
    "rootPersonId": "5f0c…",
    "view": { "mode": "family", "depth": 4, "collapsed": [] }
  },
  "persons": {
    "5f0c…": {
      "id": "5f0c…",
      "givenNames": "Jan",
      "surname": "Kowalski",
      "sex": "male",
      "birth": { "date": { "value": "1925-11-04", "qualifier": "exact" }, "place": "Łódź" },
      "death": { "date": { "value": "2001-06-30", "qualifier": "exact" }, "place": "Łódź" },
      "living": false,
      "notes": "Engineer who built bridges.",
      "createdAt": "2026-10-29T18:42:00.000Z",
      "updatedAt": "2026-10-29T18:42:00.000Z"
    },
    "a81e…": {
      "id": "a81e…",
      "givenNames": "Anna",
      "surname": "Kowalska",
      "birthSurname": "Wiśniewska",
      "sex": "female",
      "birth": { "date": { "value": "1928", "qualifier": "about" }, "place": "Poznań" },
      "photo": "data:image/webp;base64,UklGR…",
      "createdAt": "2026-10-29T18:42:00.000Z",
      "updatedAt": "2026-10-29T18:42:00.000Z"
    }
  },
  "relationships": {
    "c3d2…": {
      "id": "c3d2…",
      "type": "partnership",
      "partnerIds": ["5f0c…", "a81e…"],
      "kind": "marriage",
      "start": { "date": { "value": "1950-06", "qualifier": "exact" }, "place": "Łódź" }
    },
    "9b47…": {
      "id": "9b47…",
      "type": "parent-child",
      "parentId": "5f0c…",
      "childId": "e6a0…",
      "kind": "biological"
    }
  }
}
```

(Ids are shortened here; real ids are UUIDs.)

## Top level

| Field           | Type    | Required | Description                                                  |
| --------------- | ------- | -------- | ------------------------------------------------------------ |
| `format`        | string  | yes      | Always `"family-insight"`; identifies the file type.         |
| `schemaVersion` | integer | yes      | Version of this format (currently **1**).                    |
| `meta`          | object  | yes      | Tree name, timestamps, root person and view.                 |
| `persons`       | object  | yes      | People keyed by id; each value's `id` equals its key.        |
| `relationships` | object  | yes      | Relationships keyed by id; each value's `id` equals its key. |

### `meta`

| Field          | Type   | Required | Description                                                                                                                                                |
| -------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`         | string | yes      | Tree name shown in the toolbar.                                                                                                                            |
| `createdAt`    | string | yes      | ISO 8601 timestamp.                                                                                                                                        |
| `updatedAt`    | string | yes      | ISO 8601 timestamp of the last change.                                                                                                                     |
| `rootPersonId` | string | no       | Person the ancestor/descendant views start from.                                                                                                           |
| `view`         | object | no       | `mode` (`family`, `ancestors`, `descendants`, `hourglass`), `depth` (number of generations), `collapsed` (person ids). Restored on open; not part of undo. |

### Person

| Field                    | Type      | Required | Description                                                    |
| ------------------------ | --------- | -------- | -------------------------------------------------------------- |
| `id`                     | string    | yes      | Same as the key.                                               |
| `givenNames`             | string    | yes      | May be empty.                                                  |
| `surname`                | string    | yes      | May be empty.                                                  |
| `birthSurname`           | string    | no       | Surname at birth.                                              |
| `sex`                    | string    | yes      | `female`, `male`, `other` or `unknown`.                        |
| `birth`                  | LifeEvent | no       | Date and place of birth.                                       |
| `death`                  | LifeEvent | no       | Date and place of death.                                       |
| `living`                 | boolean   | no       | Absent = unknown.                                              |
| `notes`                  | string    | no       | Free text with line breaks.                                    |
| `photo`                  | string    | no       | Data URL starting with `data:image/` (512 × 512 WebP or JPEG). |
| `createdAt`, `updatedAt` | string    | yes      | ISO 8601 timestamps.                                           |

### Relationship

Parent–child:

| Field      | Type   | Required | Description                                   |
| ---------- | ------ | -------- | --------------------------------------------- |
| `id`       | string | yes      | Same as the key.                              |
| `type`     | string | yes      | `"parent-child"`                              |
| `parentId` | string | yes      | Person id.                                    |
| `childId`  | string | yes      | Person id.                                    |
| `kind`     | string | yes      | `biological`, `adoptive`, `step` or `foster`. |

Partnership:

| Field        | Type             | Required | Description                                                                       |
| ------------ | ---------------- | -------- | --------------------------------------------------------------------------------- |
| `id`         | string           | yes      | Same as the key.                                                                  |
| `type`       | string           | yes      | `"partnership"`                                                                   |
| `partnerIds` | [string, string] | yes      | The two partners.                                                                 |
| `kind`       | string           | yes      | `marriage`, `partnership`, `engagement` or `other`.                               |
| `start`      | LifeEvent        | no       | When and where it started.                                                        |
| `end`        | LifeEvent        | no       | When it ended, plus optional `reason`: `divorce`, `separation`, `death`, `other`. |

### LifeEvent and FuzzyDate

```json
{ "date": { "value": "1890-05", "qualifier": "about" }, "place": "Kraków" }
```

- `value` is an ISO 8601 prefix: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`.
- `qualifier` is `exact`, `about`, `before` or `after`.
- Both `date` and `place` are optional.

## Reading a file

`parseTree` checks, in this order, and throws a `FileParseError` with a code the app translates:

1. valid JSON (a UTF-8 byte-order mark is allowed) – otherwise `invalid-json`;
2. `format` is `"family-insight"` and `schemaVersion` is a non-negative integer – otherwise
   `not-a-family-tree`;
3. the version isn't newer than the app's `SCHEMA_VERSION` – otherwise `newer-version`;
4. migrations bring an older file up to the current version;
5. `checkTreeShape` validates every field listed above – otherwise `invalid-data`;
6. `validateTree` checks the structure (ids match keys, references exist, no ancestry cycles) –
   otherwise `invalid-data`.

Unknown fields are allowed and kept, so a file written by a newer version with an extra optional
field still opens in an older one.

## Writing a file

`serializeTree` writes the fields above with two-space indentation and a final newline; the current
view is stored in `meta.view`. Main writes the file **atomically** (temporary file + rename). Explicit
saves first copy the previous file to `name.finsight.bak1` and rotate older copies up to `.bak5`.

## Versioning and migrations

- **Additive, optional fields** (a new optional property) don't change the version.
- **Anything else** – renaming, restructuring, new required fields, new allowed values that older
  versions would reject – increments `SCHEMA_VERSION` and adds a migration
  `MIGRATIONS[n]: (doc) => doc` from version `n` to `n + 1` in `src/core/file/migrations.ts`, with a test
  that a file of the old version still opens.
- Old files are migrated in memory when opened and saved in the new version on the next save.
- Newer files are refused with a friendly “update the app” message rather than being misread.

See [Add a field to a person](../howto/person-field) for a worked example.
