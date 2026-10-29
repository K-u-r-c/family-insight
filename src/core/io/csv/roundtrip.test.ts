import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { serializeFuzzyDate } from '../../date/fuzzyDate'
import { getParentLinks, getPartners } from '../../model/tree'
import type { FamilyTree, Person } from '../../model/types'
import { exportCsv, type Delimiter } from './export'
import { importCsv } from './import'
import { csvTemplate } from './template'
import type { HeaderLanguage } from './columns'

const NOW = new Date('2026-01-01T00:00:00Z')
const SAMPLES = join(__dirname, '../../../../resources/samples')

/** Id-independent description of everything the CSV format can represent. */
function canonical(tree: FamilyTree): string[] {
  const key = (p: Person): string =>
    [p.givenNames, p.surname, p.birth?.date ? serializeFuzzyDate(p.birth.date) : ''].join('/')
  return Object.values(tree.persons)
    .map((p) =>
      JSON.stringify({
        key: key(p),
        birthSurname: p.birthSurname ?? '',
        sex: p.sex,
        birth: p.birth?.place ?? '',
        death: [p.death?.date ? serializeFuzzyDate(p.death.date) : '', p.death?.place ?? ''],
        living: p.living ?? null,
        notes: p.notes ?? '',
        parents: getParentLinks(tree, p.id)
          .filter((r) => r.kind === 'biological')
          .map((r) => key(tree.persons[r.parentId]!))
          .sort(),
        partners: getPartners(tree, p.id).map(key).sort()
      })
    )
    .sort()
}

const sample = (name: string): string => readFileSync(join(SAMPLES, name), 'utf8')

describe('CSV round trip', () => {
  const base = importCsv(sample('example-en.csv'), { now: NOW }).tree

  for (const delimiter of [',', ';'] as Delimiter[]) {
    for (const headerLanguage of ['en', 'pl'] as HeaderLanguage[]) {
      it(`import(export(tree)) keeps every CSV field (${delimiter} / ${headerLanguage})`, () => {
        const csv = exportCsv(base, { delimiter, headerLanguage })
        const back = importCsv(csv, { now: NOW })
        expect(back.errors).toEqual([])
        expect(back.delimiter).toBe(delimiter)
        expect(canonical(back.tree)).toEqual(canonical(base))
      })
    }
  }

  it('is stable: exporting the re-imported tree gives the same text', () => {
    const csv = exportCsv(base, { delimiter: ';', headerLanguage: 'pl' })
    expect(
      exportCsv(importCsv(csv, { now: NOW }).tree, { delimiter: ';', headerLanguage: 'pl' })
    ).toBe(csv)
  })
})

describe('sample files', () => {
  it.each(['example-en.csv', 'example-pl.csv'])(
    '%s imports with zero errors and warnings',
    (name) => {
      const r = importCsv(sample(name), { now: NOW })
      expect(r.errors).toEqual([])
      expect(r.warnings).toEqual([])
      expect(r.stats.people).toBe(25)
    }
  )

  it('English and Polish samples describe the same family', () => {
    const en = importCsv(sample('example-en.csv'), { now: NOW }).tree
    const pl = importCsv(sample('example-pl.csv'), { now: NOW }).tree
    expect(canonical(pl)).toEqual(canonical(en))
  })
})

describe('csvTemplate', () => {
  it('is a header-only file that imports cleanly', () => {
    const pl = csvTemplate('pl')
    expect(pl.split('\r\n')[0]).toContain('imiona;nazwisko')
    expect(csvTemplate('en').split('\r\n')[0]).toContain('id,given_names,surname')
    const r = importCsv(pl, { now: NOW })
    expect(r.errors).toEqual([])
    expect(r.stats.people).toBe(0)
  })
})
