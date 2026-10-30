---
description: Add an import or export format to Family Insight through the FormatAdapter registry – with a complete Markdown export example.
---

# Add a file format

Formats are pluggable: an adapter in `src/core/io` describes a format, and registering it makes the
main process accept its extension and the file dialogs offer it. This guide adds a **Markdown
“family book” export** as a complete, working example (it was compiled and tested while writing
this page). The GEDCOM format (`src/core/io/gedcom`, see [GEDCOM](../reference/gedcom)) is registered
the same way.

## 1. The adapter interface

`src/core/io/registry.ts`:

```ts
export interface FormatAdapter<ImportOptions, ExportOptions> {
  id: string // stable id, also used over IPC ('finsight', 'csv', …)
  extensions: string[] // without the dot; the first is used when saving
  labelKey: string // i18n key of the file-dialog filter label
  kind: 'native' | 'interchange' // interchange formats may lose information
  import?: (content: string, options?: ImportOptions) => ImportResult // { tree, errors, warnings }
  export?: (tree: FamilyTree, options?: ExportOptions) => string
}
```

Importers never throw for bad input: they return `errors` (which block the import) and `warnings`
as `Issue`s with i18n codes, like the CSV importer does.

## 2. Write the converter in `src/core/io/<format>/`

Pure TypeScript, no UI text – labels come in through the options. `src/core/io/markdown/export.ts`:

```ts
import { formatFuzzyDate, type DateLanguage } from '../../date/fuzzyDate'
import { displayName, getChildren, getParents, getPartners } from '../../model/tree'
import type { FamilyTree, Person } from '../../model/types'
import { compareText } from '../../text'

export interface MarkdownExportOptions {
  language?: DateLanguage
  /** Translated labels – core code never contains UI text. */
  labels?: { parents: string; partners: string; children: string }
}

const DEFAULT_LABELS = { parents: 'Parents', partners: 'Partners', children: 'Children' }

/** A readable "family book": one section per person, sorted by surname and given names. */
export function exportMarkdown(tree: FamilyTree, options: MarkdownExportOptions = {}): string {
  const language = options.language ?? 'en'
  const labels = options.labels ?? DEFAULT_LABELS
  const name = (p: Person): string => displayName(p) || '?'
  const people = Object.values(tree.persons).sort((a, b) =>
    compareText(`${a.surname} ${a.givenNames}`, `${b.surname} ${b.givenNames}`, language)
  )
  const lines = [`# ${tree.meta.name}`, '']
  for (const person of people) {
    lines.push(`## ${name(person)}`, '')
    const birth = person.birth?.date ? formatFuzzyDate(person.birth.date, language) : ''
    const death = person.death?.date ? formatFuzzyDate(person.death.date, language) : ''
    if (birth || death)
      lines.push(`${birth ? `∗ ${birth}` : ''} ${death ? `† ${death}` : ''}`.trim())
    const list = (label: string, relatives: Person[]): void => {
      if (relatives.length) lines.push(`- **${label}:** ${relatives.map(name).join(', ')}`)
    }
    list(labels.parents, getParents(tree, person.id))
    list(labels.partners, getPartners(tree, person.id))
    list(labels.children, getChildren(tree, person.id))
    if (person.notes) lines.push('', person.notes)
    lines.push('')
  }
  return lines.join('\n')
}
```

## 3. Test it

`src/core/io/markdown/export.test.ts` – `TreeBuilder` from `src/core/test/fixtures.ts` builds small
trees with readable ids:

```ts
import { describe, expect, it } from 'vitest'
import { TreeBuilder } from '../../test/fixtures'
import { exportMarkdown } from './export'

describe('exportMarkdown', () => {
  it('writes one section per person with their family', () => {
    const tree = new TreeBuilder()
      .person('jan', 'Jan', 'male', { birth: { date: { value: '1925', qualifier: 'exact' } } })
      .person('anna', 'Anna', 'female')
      .person('piotr', 'Piotr', 'male')
      .couple('jan', 'anna')
      .child('jan', 'piotr')
      .child('anna', 'piotr').tree
    const md = exportMarkdown(tree)
    expect(md).toContain('# Test')
    expect(md).toContain('## Jan Kowalski\n\n∗ 1925')
    expect(md).toContain('- **Children:** Piotr Kowalski')
    expect(md).toContain('- **Parents:** Jan Kowalski, Anna Kowalski')
  })
})
```

For an importer, add a **round trip** test (export → import → same people and relationships) and
tests for every error and warning code.

## 4. Register it

Add it to `registerBuiltInFormats()` in `src/core/io/formats.ts` (called by both main and the
renderer):

```ts
import { exportMarkdown, type MarkdownExportOptions } from './markdown/export'

if (!getFormat('markdown')) {
  registerFormat<never, MarkdownExportOptions>({
    id: 'markdown',
    extensions: ['md'],
    labelKey: 'files.markdownFilter',
    kind: 'interchange',
    export: (tree, options) => exportMarkdown(tree, options)
  })
}
```

From now on `window.familyInsight.saveFileDialog('markdown', name)` shows a “Markdown” filter and
suggests `<name>.md`, and main allows writing the chosen path. (For an importer, `openFileDialog(id)`
and drag-and-drop accept the new extension too.)

## 5. Call it from the UI

A small service in the renderer, e.g. `src/renderer/src/features/markdown/exportMarkdown.ts`:

```ts
import { exportMarkdown } from '@core/io/markdown/export'
import { resolveLanguage } from '@shared/i18n'
import { toast } from '@renderer/components/ui'
import i18n from '@renderer/i18n'
import { useDocument } from '@renderer/store/document'

const t = (key: string): string => i18n.t(key as never) as unknown as string

/** Asks where to save, then writes the open tree as a Markdown family book. */
export async function exportMarkdownFile(): Promise<void> {
  const tree = useDocument.getState().tree
  if (!tree) return
  const path = await window.familyInsight.saveFileDialog('markdown', tree.meta.name)
  if (!path) return
  const content = exportMarkdown(tree, {
    language: resolveLanguage(i18n.language),
    labels: {
      parents: t('relations.parents'),
      partners: t('relations.partners'),
      children: t('relations.children')
    }
  })
  const result = await window.familyInsight.writeFile(path, content)
  toast(
    result.ok
      ? { message: t('markdown.exported'), tone: 'success' }
      : { message: t(`files.error.${result.error}`), tone: 'error' }
  )
}
```

## 6. Text and menu

- Add `files.markdownFilter` (“Markdown document” / “Dokument Markdown”) and
  `markdown.exported` to **both** locale files ([UI text](./ui-text)).
- Add a menu item (**File → Export → Markdown…**) and an entry in the in-window file menu that call
  `exportMarkdownFile()` – see [Add a menu item or shortcut](./menu).
- Document the format for users (a page in the guide) and, for an interchange format, describe
  exactly what is kept and lost, like the [CSV format reference](../reference/csv-format).
