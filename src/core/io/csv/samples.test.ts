import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { importCsv } from './import'

const root = join(__dirname, '..', '..', '..', '..')

describe('sample CSV files', () => {
  for (const lang of ['en', 'pl']) {
    const name = `example-${lang}.csv`

    it(`${name} imports without problems`, () => {
      const result = importCsv(readFileSync(join(root, 'resources', 'samples', name), 'utf8'))
      expect(result.errors).toEqual([])
      expect(Object.keys(result.tree.persons)).toHaveLength(25)
    })

    it(`the documentation offers the same ${name}`, () => {
      // docs/public/samples is what the user guide links to for download.
      expect(readFileSync(join(root, 'docs', 'public', 'samples', name))).toEqual(
        readFileSync(join(root, 'resources', 'samples', name))
      )
    })
  }
})
