---
description: The .finsight file format – a zip container with a versioned JSON document and the media library, its fields, validation and migration policy.
---

# `.finsight` file format

A Family Insight tree is a single file with the extension `.finsight`. It contains everything –
people, relationships, sources, photos and scanned documents, the root person and the view – so it
can be copied, backed up and opened anywhere. Since version 1.1 (schema 3) the file is a **zip
container**; Family Insight 1.0 wrote plain UTF-8 JSON, which still opens.

## Container

| Entry                  | Compression | Content                                                           |
| ---------------------- | ----------- | ----------------------------------------------------------------- |
| `tree.json`            | deflate     | The document described below (UTF-8 JSON).                        |
| `media/<sha256>.<ext>` | stored      | One file per distinct content of the media library (see `media`). |
| `thumbs/<sha256>.webp` | stored      | Thumbnail of an image (longest side 256 px), for cards and lists. |

- `<sha256>` is the lowercase hex SHA-256 of the file's bytes, `<ext>` follows its type (`jpg`,
  `png`, `webp`, `gif`, `pdf`). The same scan used by two media items is stored once.
- Only media listed in `tree.json` are written: files nothing refers to any more are
  **garbage-collected on save**. Unknown entries are ignored when reading.
- Media are stored uncompressed (they are compressed formats already). Saving reuses each file's
  CRC-32 from when it was read or added, so a save only compresses `tree.json` and writes bytes the
  app already has – 205 MB with 500 photos in about 85 ms on an NVMe disk (including `fsync`), see
  the performance test in `src/core/file/container.test.ts`.
- No zip64: a container is limited to 4 GiB (the app opens files up to 2 GiB) and 65 535 entries.
- A file is a container when it starts with the zip signature `PK\x03\x04`; anything else is read
  as legacy JSON. A damaged zip (bad CRC, truncated, encrypted) is reported as
  `corrupt-container`, a zip without `tree.json` as `missing-tree`.

The code is in `src/core/file/zip.ts` (a minimal zip reader/writer on top of
[fflate](https://github.com/101arrowz/fflate)'s deflate) and `src/core/file/container.ts`
(`unpackDocument`, `packDocument`). The TypeScript shape of `tree.json` is `FamilyTree` in
[`src/core/model/types.ts`](https://github.com/K-u-r-c/family-insight/blob/main/src/core/model/types.ts);
`parseTreeWithWarnings` and `serializeTree` in `src/core/file/format.ts` read and write it.

## Example `tree.json`

```json
{
  "format": "family-insight",
  "schemaVersion": 3,
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
      "events": [
        {
          "id": "7c1d…",
          "type": "military-service",
          "date": { "value": "1944", "qualifier": "exact" },
          "endDate": { "value": "1945", "qualifier": "exact" },
          "description": "1st Polish Army"
        }
      ],
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
      "portraitMediaId": "m3e1…",
      "mediaIds": ["m9a2…"],
      "events": [],
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
      "kind": "biological",
      "citations": [{ "id": "c41a…", "sourceId": "s7f2…", "page": "No. 12", "quality": "primary" }]
    }
  },
  "sources": {
    "s7f2…": {
      "id": "s7f2…",
      "title": "Parish register of births 1925",
      "repositoryId": "r0b9…",
      "callNumber": "Sygn. 1/25"
    }
  },
  "repositories": {
    "r0b9…": { "id": "r0b9…", "name": "State Archive in Łódź", "url": "https://www.lodz.ap.gov.pl" }
  },
  "media": {
    "m3e1…": {
      "id": "m3e1…",
      "hash": "4f8b0c…",
      "mime": "image/webp",
      "fileName": "portrait.webp",
      "size": 31744,
      "width": 512,
      "height": 512
    },
    "m9a2…": {
      "id": "m9a2…",
      "hash": "b17d55…",
      "mime": "application/pdf",
      "fileName": "akt-malzenstwa.pdf",
      "title": "Marriage certificate",
      "date": { "value": "1950-06", "qualifier": "exact" }
    }
  }
}
```

(Ids are shortened here; real ids are UUIDs.)

## Top level

| Field           | Type    | Required | Description                                                  |
| --------------- | ------- | -------- | ------------------------------------------------------------ |
| `format`        | string  | yes      | Always `"family-insight"`; identifies the file type.         |
| `schemaVersion` | integer | yes      | Version of this format (currently **3**).                    |
| `meta`          | object  | yes      | Tree name, timestamps, root person and view.                 |
| `persons`       | object  | yes      | People keyed by id; each value's `id` equals its key.        |
| `relationships` | object  | yes      | Relationships keyed by id; each value's `id` equals its key. |
| `sources`       | object  | yes (v2) | Sources keyed by id (since v2).                              |
| `repositories`  | object  | yes (v2) | Repositories keyed by id (since v2).                         |
| `media`         | object  | yes (v3) | Media library: photos and documents keyed by id (since v3).  |

### `meta`

| Field          | Type   | Required | Description                                                                                                                                                |
| -------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`         | string | yes      | Tree name shown in the toolbar.                                                                                                                            |
| `createdAt`    | string | yes      | ISO 8601 timestamp.                                                                                                                                        |
| `updatedAt`    | string | yes      | ISO 8601 timestamp of the last change.                                                                                                                     |
| `rootPersonId` | string | no       | Person the ancestor/descendant views start from.                                                                                                           |
| `view`         | object | no       | `mode` (`family`, `ancestors`, `descendants`, `hourglass`), `depth` (number of generations), `collapsed` (person ids). Restored on open; not part of undo. |

### Person

| Field                    | Type          | Required | Description                                                   |
| ------------------------ | ------------- | -------- | ------------------------------------------------------------- |
| `id`                     | string        | yes      | Same as the key.                                              |
| `givenNames`             | string        | yes      | May be empty.                                                 |
| `surname`                | string        | yes      | May be empty.                                                 |
| `birthSurname`           | string        | no       | Surname at birth.                                             |
| `sex`                    | string        | yes      | `female`, `male`, `other` or `unknown`.                       |
| `birth`                  | LifeEvent     | no       | Date and place of birth.                                      |
| `death`                  | LifeEvent     | no       | Date and place of death.                                      |
| `living`                 | boolean       | no       | Absent = unknown.                                             |
| `notes`                  | string        | no       | Free text with line breaks.                                   |
| `events`                 | PersonEvent[] | yes (v2) | Further life events, in the order the user arranged them.     |
| `portraitMediaId`        | string        | no       | Media id of the portrait (v3; replaces the v1/v2 `photo`).    |
| `mediaIds`               | string[]      | no       | Photos and documents of the person, in the user's order (v3). |
| `createdAt`, `updatedAt` | string        | yes      | ISO 8601 timestamps.                                          |

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

### PersonEvent (since v2)

| Field         | Type      | Required | Description                                                                                                                                                                                                                                                           |
| ------------- | --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | string    | yes      | Unique within the person.                                                                                                                                                                                                                                             |
| `type`        | string    | yes      | `baptism`, `christening`, `confirmation`, `first-communion`, `burial`, `cremation`, `emigration`, `immigration`, `naturalization`, `residence`, `occupation`, `education`, `graduation`, `military-service`, `religion`, `census`, `retirement`, `award` or `custom`. |
| `customType`  | string    | no       | Name of a `custom` event (“Pilgrimage”).                                                                                                                                                                                                                              |
| `date`        | FuzzyDate | no       | When it happened, or when a period started.                                                                                                                                                                                                                           |
| `endDate`     | FuzzyDate | no       | End of a period (“1914–1918”).                                                                                                                                                                                                                                        |
| `place`       | string    | no       |                                                                                                                                                                                                                                                                       |
| `description` | string    | no       | Short detail: the occupation, school, regiment …                                                                                                                                                                                                                      |
| `notes`       | string    | no       | Free text.                                                                                                                                                                                                                                                            |

Birth and death stay in `birth` / `death` (they drive the layout, ages and statistics); events are
additional facts.

### Sources, repositories and citations (since v2)

**Source** – `id`, `title` (required), `author`, `publication`, `repositoryId`, `callNumber`, `url`,
`notes` (text) and `mediaIds` (list of media ids).

**Repository** – `id`, `name` (required), `address`, `url`, `notes`.

**Citation** – `{ id, sourceId, page?, quality?, date?, text?, notes? }`; `quality` is `primary`,
`secondary`, `questionable` or `unreliable`, `date` a FuzzyDate. Citations are stored **next to the
fact they support**, as an optional `citations` list on: the person (general sources), `birth`,
`death`, each life event, each relationship, and a partnership's `start` and `end`.

A citation whose `sourceId` doesn't exist is repaired on load: the citation is dropped, the user sees
a warning and the document is marked as changed so the next save stores the fix. A source pointing
to a missing repository loses the link.

### Media items (since v3)

**MediaItem** – `id`, `hash` (SHA-256 hex of the file), `mime` (`image/jpeg`, `image/png`,
`image/webp`, `image/gif` or `application/pdf`) and `fileName` are required; `size` (bytes),
`width`, `height`, `title`, `date` (FuzzyDate), `place` and `description` are optional. The bytes
are the container entry `media/<hash>.<ext>`. People (`portraitMediaId`, `mediaIds`), sources and
citations (`mediaIds`) refer to media by id.

The type is detected from the file's first bytes, never from its name; one file may be at most
25 MB. References to media ids that don't exist are dropped on load (warning
`dangling-media-removed`, the document is marked as changed). A media item whose bytes are missing
from the container stays in the document and the user is told how many files are missing.

### LifeEvent and FuzzyDate

```json
{ "date": { "value": "1890-05", "qualifier": "about" }, "place": "Kraków" }
```

- `value` is an ISO 8601 prefix: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`.
- `qualifier` is `exact`, `about`, `before` or `after`.
- Both `date` and `place` are optional.

## Reading a file

Main reads the bytes and `unpackDocument` takes the container apart (or decodes legacy JSON);
the media go into a media library in the main process (see
[architecture](../architecture#media-library)). `parseTreeWithWarnings` then checks `tree.json`, in
this order, and throws a `FileParseError` with a code the app translates:

1. valid JSON (a UTF-8 byte-order mark is allowed) – otherwise `invalid-json`;
2. `format` is `"family-insight"` and `schemaVersion` is a non-negative integer – otherwise
   `not-a-family-tree`;
3. the version isn't newer than the app's `SCHEMA_VERSION` – otherwise `newer-version`;
4. migrations bring an older file up to the current version;
5. `checkTreeShape` validates every field listed above – otherwise `invalid-data`;
6. dangling source and media references are repaired and reported as warnings;
7. `validateTree` checks the structure (ids match keys, references exist, no ancestry cycles) –
   otherwise `invalid-data`.

Unknown fields are allowed and kept, so a file written by a newer version with an extra optional
field still opens in an older one.

## Writing a file

`serializeTree` writes the fields above with two-space indentation and a final newline; the current
view is stored in `meta.view`. The renderer sends only this JSON to main (`writeDocument`); main
packs it with the media of the document's library (`packDocument`) and writes the chunks
**atomically** (temporary file + `fsync` + rename) without concatenating them in memory. Explicit
saves first copy the previous file to `name.finsight.bak1` and rotate older copies up to `.bak5`.

## Versioning and migrations

| Version | App versions | Change                                                                                                                                                                                                                              |
| ------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | 1.0.x        | First format.                                                                                                                                                                                                                       |
| 2       | –            | `Person.events` (life events), `sources`, `repositories` and citations. Migration 1 → 2 adds `events: []`, `sources: {}`, `repositories: {}`. Development builds only.                                                              |
| 3       | 1.1.0 –      | Zip container and media library (`media`, `portraitMediaId`, `mediaIds`). Migration 2 → 3 adds `media: {}` and moves each `photo` data URL into the library: the bytes become a container entry, the person gets `portraitMediaId`. |

Migrations may move bytes out of the JSON: they receive a context whose `media` map collects them
by hash, and `parseTreeWithWarnings` returns it so the renderer can add them to the library.

**Forward compatibility:** an app refuses files whose `schemaVersion` is higher than its own with
“This tree was saved by a newer version of Family Insight” instead of misreading them. Files from
older versions always open and are upgraded in memory. Family Insight 1.0.x can't read the zip
container at all and reports a damaged file for trees saved by 1.1 – users update to open them.

- **Additive, optional fields** (a new optional property) don't change the version.
- **Anything else** – renaming, restructuring, new required fields, new allowed values that older
  versions would reject – increments `SCHEMA_VERSION` and adds a migration
  `MIGRATIONS[n]: (doc, context) => doc` from version `n` to `n + 1` in `src/core/file/migrations.ts`, with a test
  that a file of the old version still opens.
- Old files are migrated in memory when opened and saved in the new version on the next save.
- Newer files are refused with a friendly “update the app” message rather than being misread.

See [Add a field to a person](../howto/person-field) for a worked example.
