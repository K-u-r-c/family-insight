# `.finsight` file format

The native file is UTF-8 JSON with the extension `.finsight`. Its TypeScript shape is
`FamilyTree` in [`src/core/model/types.ts`](../src/core/model/types.ts).

```jsonc
{
  "schemaVersion": 1,
  "meta": { "name": "Kowalscy", "createdAt": "…", "updatedAt": "…", "rootPersonId": "p1" },
  "persons": { "p1": { "id": "p1", "givenNames": "Jan", "surname": "Kowalski", "sex": "male", … } },
  "relationships": {
    "r1": { "id": "r1", "type": "parent-child", "parentId": "p1", "childId": "p3", "kind": "biological" },
    "r2": { "id": "r2", "type": "partnership", "partnerIds": ["p1", "p2"], "kind": "marriage" }
  }
}
```

## Rules

- `schemaVersion` is required. When the shape changes, bump `SCHEMA_VERSION` and add a
  migration `vN → vN+1`. Files are migrated on open; files from a **newer** version are refused
  with a friendly message instead of being corrupted.
- IDs are opaque strings (generated with `crypto.randomUUID()`).
- Dates use `FuzzyDate` (`{ "value": "1890-05", "qualifier": "about" }`).
- Photos are stored inline as data URLs (resized, see the photos issue) so a tree is one
  self-contained file that is easy to back up and share.
- `meta.view` (optional) stores how the tree was being viewed (`mode`, `depth`, `collapsed`
  person ids). It is restored on open and is not part of undo.
- Files are written atomically (write to a temp file, then rename) to avoid corruption.
