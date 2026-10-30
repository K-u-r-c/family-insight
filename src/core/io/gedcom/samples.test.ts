import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { importCsv } from '../csv/import'
import { concatChunks } from '../../file/zip'
import { exportGedcom } from './export'
import { decodeGedcom } from './encoding'
import { readGedzip, writeGedzip } from './gedzip'
import { importGedcom } from './import'
import { parseGedcom } from './parser'

/**
 * The sample family as GEDCOM files for the documentation (`docs/public/samples/`). Run with
 * `UPDATE_GEDCOM_SAMPLES=1` to regenerate them; normally the checked-in files are re-imported.
 */
const DIR = join(__dirname, '../../../../docs/public/samples')
const sample = () =>
  importCsv(readFileSync(join(__dirname, '../../../../resources/samples/example-en.csv'), 'utf8'), {
    name: 'Sample family'
  }).tree

describe('GEDCOM sample files', () => {
  for (const version of ['5.5.1', '7.0'] as const) {
    const file = join(DIR, `sample-family-${version}.ged`)
    it(`sample-family-${version}.ged re-imports with every person and family`, () => {
      const tree = sample()
      if (process.env.UPDATE_GEDCOM_SAMPLES || !existsSync(file)) {
        mkdirSync(DIR, { recursive: true })
        writeFileSync(file, exportGedcom(tree, { version, date: new Date('2026-10-30') }).text)
      }
      const { text, detected } = decodeGedcom(new Uint8Array(readFileSync(file)))
      expect(detected.encoding).toBe('utf-8')
      const doc = parseGedcom(text)
      expect(doc.version).toBe(version === '7.0' ? '7.0' : '5.5.1')
      expect(doc.warnings).toEqual([])
      const result = importGedcom(doc)
      expect(result.warnings).toEqual([])
      expect(result.summary.unsupported).toEqual({})
      expect(result.summary.people).toBe(Object.keys(tree.persons).length)
      expect(Object.keys(result.tree.relationships)).toHaveLength(
        Object.keys(tree.relationships).length
      )
    })
  }

  it('packs and reads a GEDZIP with media', () => {
    const zip = concatChunks(
      writeGedzip('0 HEAD\n0 TRLR\n', [
        { path: 'media/a.jpg', bytes: Uint8Array.from([0xff, 0xd8, 0xff]) },
        { path: 'media/a.jpg', bytes: Uint8Array.from([1]) }
      ])
    )
    const read = readGedzip(zip)!
    expect([...read.files.keys()]).toEqual(['media/a.jpg'])
  })
})
