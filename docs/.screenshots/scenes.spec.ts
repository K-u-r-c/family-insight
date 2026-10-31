/*
 * Documentation screenshots. Every scene runs in a fresh app session per language and theme,
 * brings the app into the described state and captures it as its last step.
 * Regenerate with `npm run docs:screenshots` (add `-- -g <scene>` for a single scene).
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, type Locator } from '@playwright/test'
import { Resvg } from '@resvg/resvg-js'
import { mockDialogs, tempDir } from '../../e2e/app'
import { startTileServer } from '../../e2e/tileServer'
import { scene, type Session, type ShotOptions, type StartOptions } from './shoot'

const ROOT = join(__dirname, '..', '..')
const FIXTURE = join(ROOT, 'e2e', 'fixtures', 'kowalscy.finsight')
const SAMPLE_CSV = (lang: string): string =>
  join(ROOT, 'resources', 'samples', `example-${lang === 'pl' ? 'pl' : 'en'}.csv`)
/**
 * Matches an accessible name that starts with `text` (the app may append a date). The padding
 * the pseudo-locale adds at the end of a message is dropped, since the app's text continues there.
 */
const startsWith = (text: string): RegExp =>
  new RegExp(`^${text.replace(/ ·+$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
/** A fixed moment, so dates shown in dialogs don't change between runs. */
const FIXED_TIME = '2026-10-29T18:42:00.000Z'

// ---------------------------------------------------------------------------------------------
// Helpers

function canvas({ page, t }: Session): Locator {
  return page.getByRole('application', { name: t('tree.canvasLabel') })
}

function card(s: Session, name: string): Locator {
  return canvas(s).getByRole('button', { name: new RegExp(`^${name}`) })
}

/** The details/editor panel on the right. */
function panel({ page }: Session): Locator {
  return page
    .locator('section[aria-label]')
    .filter({ has: page.getByRole('heading') })
    .last()
}

function dialog(s: Session): Locator {
  return s.page.getByRole('dialog')
}

function menu(s: Session): Locator {
  return s.page.getByRole('menu')
}

/** A dialog on a plain background. */
function dialogShot(s: Session, extra: ShotOptions = {}): ShotOptions {
  return { clip: dialog(s), pad: 24, isolate: true, ...extra }
}

async function openSample(s: Session): Promise<void> {
  await s.page.getByRole('button', { name: s.t('welcome.trySample') }).click()
  await canvas(s).waitFor()
  await s.page.waitForTimeout(600)
}

async function select(s: Session, name: string): Promise<void> {
  await card(s, name).click()
  await s.page.getByRole('heading', { name, exact: true }).waitFor()
  await s.page.waitForTimeout(500)
}

/** 100 % zoom, centred on the selected person, so cards are readable. */
async function zoomToSelected(s: Session): Promise<void> {
  await s.page.getByTitle(s.t('tree.resetZoom')).click()
  await s.page.getByRole('button', { name: s.t('tree.centerSelected') }).click()
  await s.page.waitForTimeout(700)
}

async function setRoot(s: Session, name: string): Promise<void> {
  await card(s, name).click({ button: 'right' })
  const item = menu(s).getByRole('menuitem', { name: s.t('tree.setRoot') })
  await menu(s).waitFor()
  if (await item.isVisible()) await item.click()
  else await s.page.keyboard.press('Escape') // already the root person
}

async function closePanel(s: Session): Promise<void> {
  await panel(s)
    .getByRole('button', { name: s.t('common.close') })
    .click()
  await s.page.waitForTimeout(400)
}

async function menuAction(s: Session, action: string): Promise<void> {
  await s.app.evaluate(({ BrowserWindow }, a) => {
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', a)
  }, action)
}

/** Moves the pointer away so no hover effect or tooltip ends up in the picture. */
async function parkMouse(s: Session): Promise<void> {
  await s.page.mouse.move(1279, 799)
}

/** A drawn, clearly fictional portrait for the photo cropper. */
function portrait(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100">
    <defs>
      <radialGradient id="bg" cx="0.5" cy="0.35" r="0.8">
        <stop offset="0" stop-color="#e9dcc4"/><stop offset="1" stop-color="#9c8566"/>
      </radialGradient>
      <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4b5a6a"/><stop offset="1" stop-color="#2c3540"/>
      </linearGradient>
    </defs>
    <rect width="900" height="1100" fill="url(#bg)"/>
    <path d="M150 1100 C170 820 300 740 450 740 C600 740 730 820 750 1100 Z" fill="url(#coat)"/>
    <path d="M390 740 L450 860 L510 740 Z" fill="#f4efe6"/>
    <rect x="405" y="640" width="90" height="120" rx="40" fill="#d9b393"/>
    <ellipse cx="450" cy="520" rx="150" ry="180" fill="#e5c3a3"/>
    <path d="M300 500 C290 340 380 300 450 300 C540 300 615 350 600 500 C580 420 520 390 450 395 C380 390 320 420 300 500 Z" fill="#6b4a33"/>
    <ellipse cx="395" cy="525" rx="14" ry="10" fill="#3b2b20"/>
    <ellipse cx="505" cy="525" rx="14" ry="10" fill="#3b2b20"/>
    <path d="M405 610 C430 630 470 630 495 610" stroke="#9b5f4a" stroke-width="9" fill="none" stroke-linecap="round"/>
  </svg>`
  const file = join(tempDir(), 'portrait.png')
  writeFileSync(file, new Resvg(svg).render().asPng())
  return file
}

/** Drawn, clearly fictional "old photos", a letter and a PDF for the media library. */
function mediaFiles(): string[] {
  const dir = tempDir()
  const png = (name: string, svg: string): string => {
    const file = join(dir, name)
    writeFileSync(file, new Resvg(svg).render().asPng())
    return file
  }
  const sepia = `<defs><radialGradient id="v" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.6" stop-color="#d8c3a0"/><stop offset="1" stop-color="#8f7552"/></radialGradient></defs>`
  const wedding = png(
    'wedding-1950.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">${sepia}
      <rect width="1200" height="900" fill="url(#v)"/>
      <path d="M380 900 V380 A220 220 0 0 1 820 380 V900 Z" fill="#b39a76"/>
      <path d="M440 900 V400 A160 160 0 0 1 760 400 V900 Z" fill="#6f5a41"/>
      <circle cx="530" cy="420" r="46" fill="#e9d8bd"/><path d="M470 900 L500 500 H560 L590 900 Z" fill="#3b3128"/>
      <circle cx="670" cy="430" r="44" fill="#e9d8bd"/><path d="M600 900 C610 640 640 510 670 500 C700 510 730 640 750 900 Z" fill="#f4ecdd"/>
      <path d="M630 400 C640 340 700 340 712 400 C740 470 600 470 630 400 Z" fill="#f8f2e6" opacity="0.8"/>
    </svg>`
  )
  const house = png(
    'house.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="760">${sepia}
      <rect width="1000" height="760" fill="url(#v)"/><rect y="560" width="1000" height="200" fill="#9c8462"/>
      <rect x="260" y="330" width="480" height="260" fill="#c9b08a"/><path d="M220 340 L500 150 L780 340 Z" fill="#6b5640"/>
      <rect x="450" y="450" width="90" height="140" fill="#4e3f30"/>
      <rect x="310" y="390" width="90" height="80" fill="#efe3cc"/><rect x="600" y="390" width="90" height="80" fill="#efe3cc"/>
    </svg>`
  )
  const lines = Array.from({ length: 14 }, (_, i) => {
    const y = 170 + i * 52
    return `<path d="M110 ${y} q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 ${i % 3 ? 0 : -6}" stroke="#3d4f73" stroke-width="4" fill="none" opacity="0.8"/>`
  }).join('')
  const letter = png(
    'letter-1946.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000">
      <rect width="800" height="1000" fill="#efe6d2"/>
      <path d="M110 110 q30 -18 60 0 t60 0" stroke="#3d4f73" stroke-width="5" fill="none"/>${lines}</svg>`
  )
  const stream = 'BT /F1 22 Tf 40 120 Td (Akt urodzenia / Birth certificate) Tj ET'
  const pdf = join(dir, 'birth-certificate.pdf')
  writeFileSync(
    pdf,
    [
      '%PDF-1.4',
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 420 300]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj',
      `4 0 obj<</Length ${stream.length}>>stream`,
      stream,
      'endstream endobj',
      '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj',
      'trailer<</Root 1 0 R>>',
      '%%EOF'
    ].join('\n')
  )
  return [wedding, house, letter, pdf]
}

/** Adds photos and documents to Jan Kowalski's gallery (through the picker) and describes them. */
async function addJanMedia(s: Session): Promise<void> {
  const { page, t } = s
  await select(s, 'Jan Kowalski')
  await mockDialogs(s.app, { open: mediaFiles() })
  await panel(s)
    .getByRole('region', { name: t('media.gallery') })
    .getByRole('button', { name: t('media.add') })
    .click()
  await panel(s)
    .getByRole('region', { name: t('media.gallery') })
    .locator('img')
    .nth(2)
    .waitFor()
  const pl = s.variant.lang === 'pl'
  const info: Record<string, Record<string, unknown>> = {
    'wedding-1950.png': {
      title: pl ? 'Ślub Jana i Anny' : 'Wedding of Jan and Anna',
      date: { value: '1950-06', qualifier: 'exact' },
      place: 'Łódź',
      description: pl
        ? 'Przed kościołem św. Józefa, zaraz po ceremonii.'
        : 'In front of St Joseph’s church, just after the ceremony.'
    },
    'house.png': {
      title: pl ? 'Dom rodzinny przy ul. Piotrkowskiej' : 'The family house on Piotrkowska Street',
      date: { value: '1960', qualifier: 'about' },
      place: 'Łódź'
    },
    'letter-1946.png': {
      title: pl ? 'List Anny do siostry' : 'Letter from Anna to her sister',
      date: { value: '1946-03', qualifier: 'exact' }
    },
    'birth-certificate.pdf': {
      title: pl ? 'Akt urodzenia Jana' : 'Jan’s birth certificate',
      date: { value: '1925-11-04', qualifier: 'exact' },
      place: 'Łódź'
    }
  }
  await page.evaluate((info) => {
    type Tree = {
      persons: Record<
        string,
        { id: string; givenNames: string; surname: string; mediaIds?: string[] }
      >
      media: Record<string, { id: string; fileName: string }>
    }
    const store = (
      window as unknown as {
        __familyInsight: {
          useDocument: { getState: () => { tree: Tree; dispatch: (cmd: unknown) => void } }
        }
      }
    ).__familyInsight.useDocument
    store.getState().dispatch({
      label: 'history.editMedia',
      run: (tree: Tree) => {
        const media = Object.fromEntries(
          Object.entries(tree.media).map(([id, m]) => [id, { ...m, ...info[m.fileName] }])
        )
        const wedding = Object.values(tree.media).find((m) => m.fileName === 'wedding-1950.png')!
        const persons = Object.fromEntries(
          Object.entries(tree.persons).map(([id, p]) =>
            `${p.givenNames} ${p.surname}` === 'Anna Kowalska'
              ? [id, { ...p, mediaIds: [wedding.id] }]
              : [id, p]
          )
        )
        return { tree: { ...tree, media, persons }, result: undefined }
      }
    })
  }, info)
}

/** Life events of Jan Kowalski in the sample family (texts in the screenshot's language). */
function janEvents(lang: string): Record<string, unknown>[] {
  const pl = lang === 'pl'
  const d = (value: string) => ({ value, qualifier: 'exact' })
  return [
    { id: 'ev1', type: 'baptism', date: d('1925-11-22'), place: 'Łódź' },
    {
      id: 'ev2',
      type: 'military-service',
      date: d('1944'),
      endDate: d('1945'),
      description: pl ? '1. Armia Wojska Polskiego' : '1st Polish Army'
    },
    {
      id: 'ev3',
      type: 'education',
      date: d('1946'),
      endDate: d('1951'),
      place: 'Łódź',
      description: pl ? 'Politechnika Łódzka' : 'Lodz University of Technology'
    },
    {
      id: 'ev4',
      type: 'occupation',
      date: d('1951'),
      endDate: d('1990'),
      description: pl ? 'Inżynier mostowy' : 'Bridge engineer'
    },
    {
      id: 'ev5',
      type: 'burial',
      date: d('2001-07-04'),
      place: 'Łódź',
      description: pl ? 'Stary Cmentarz' : 'Old Cemetery'
    }
  ]
}

/** Gives a person life events through the store (test hook), as one undoable change. */
async function setEvents(
  s: Session,
  name: string,
  events: Record<string, unknown>[]
): Promise<void> {
  await s.page.evaluate(
    ({ name, events }) => {
      const store = (
        window as unknown as {
          __familyInsight: {
            useDocument: {
              getState: () => {
                tree: {
                  persons: Record<string, { id: string; givenNames: string; surname: string }>
                }
                dispatch: (cmd: unknown) => void
              }
            }
          }
        }
      ).__familyInsight.useDocument
      const { tree, dispatch } = store.getState()
      const person = Object.values(tree.persons).find(
        (p) => `${p.givenNames} ${p.surname}` === name
      )!
      dispatch({
        label: 'history.addEvent',
        run: (t: typeof tree) => ({
          tree: { ...t, persons: { ...t.persons, [person.id]: { ...person, events } } },
          result: undefined
        })
      })
    },
    { name, events }
  )
}

/** Sources, a repository and citations for Jan Kowalski in the sample family. */
async function addSampleSources(s: Session): Promise<void> {
  const pl = s.variant.lang === 'pl'
  await s.page.evaluate(
    ({ pl }) => {
      type Tree = {
        persons: Record<string, { id: string; givenNames: string; surname: string; birth?: object }>
        relationships: Record<
          string,
          { id: string; type: string; partnerIds?: string[]; start?: object }
        >
        sources: object
        repositories: object
      }
      const store = (
        window as unknown as {
          __familyInsight: {
            useDocument: { getState: () => { tree: Tree; dispatch: (cmd: unknown) => void } }
          }
        }
      ).__familyInsight.useDocument
      const { tree, dispatch } = store.getState()
      const find = (name: string) =>
        Object.values(tree.persons).find((p) => `${p.givenNames} ${p.surname}` === name)!
      const jan = find('Jan Kowalski')
      const anna = find('Anna Kowalska')
      const marriage = Object.values(tree.relationships).find(
        (r) =>
          r.type === 'partnership' &&
          r.partnerIds!.includes(jan.id) &&
          r.partnerIds!.includes(anna.id)
      )!
      const sources = {
        s1: {
          id: 's1',
          title: pl
            ? 'Księga urodzeń parafii św. Józefa w Łodzi 1925'
            : 'Register of births, St Joseph’s parish, Łódź 1925',
          repositoryId: 'r1',
          callNumber: '1234/56'
        },
        s2: {
          id: 's2',
          title: pl ? 'Spis powszechny 1931' : 'Census 1931',
          author: pl ? 'GUS' : 'Central Statistical Office'
        },
        s3: {
          id: 's3',
          title: pl ? 'List Anny do siostry, 1946' : 'Letter from Anna to her sister, 1946'
        }
      }
      const repositories = {
        r1: {
          id: 'r1',
          name: pl ? 'Archiwum Państwowe w Łodzi' : 'State Archive in Łódź',
          url: 'https://www.lodz.ap.gov.pl'
        }
      }
      dispatch({
        label: 'history.addCitation',
        run: (t: Tree) => ({
          tree: {
            ...t,
            sources,
            repositories,
            persons: {
              ...t.persons,
              [jan.id]: {
                ...jan,
                citations: [{ id: 'c2', sourceId: 's2', page: '12', quality: 'secondary' }],
                birth: {
                  ...jan.birth,
                  citations: [
                    {
                      id: 'c1',
                      sourceId: 's1',
                      page: pl ? 'akt 345' : 'entry 345',
                      quality: 'primary',
                      text: pl
                        ? 'Jan, syn Józefa Kowalskiego i Marii z Nowaków, urodzony 4 listopada 1925 r.'
                        : 'Jan, son of Józef Kowalski and Maria née Nowak, born on 4 November 1925.'
                    }
                  ]
                }
              }
            },
            relationships: {
              ...t.relationships,
              [marriage.id]: {
                ...marriage,
                citations: [{ id: 'c3', sourceId: 's3', quality: 'questionable' }]
              }
            }
          },
          result: undefined
        })
      })
    },
    { pl }
  )
}

// ---------------------------------------------------------------------------------------------
// Getting started

scene('welcome', async ({ page, t }) => {
  await page.getByRole('heading', { name: t('welcome.title') }).waitFor()
})

scene('welcome-annotated', async ({ page, t }) => {
  await page.getByRole('heading', { name: t('welcome.title') }).waitFor()
  return {
    steps: [
      { target: page.getByRole('button', { name: t('welcome.newTree') }), badge: 'left' },
      { target: page.getByRole('button', { name: t('welcome.openTree') }), badge: 'left' },
      { target: page.getByRole('button', { name: t('welcome.importCsv') }), badge: 'left' },
      { target: page.getByRole('button', { name: t('welcome.importGedcom') }), badge: 'left' },
      { target: page.getByRole('button', { name: t('welcome.trySample') }), badge: 'left' }
    ]
  }
})

scene(
  'welcome-recent',
  async ({ page, t }) => {
    await page.getByRole('heading', { name: t('welcome.recent') }).waitFor()
  },
  ({ lang }) => {
    // A fixed folder, so the paths in the picture are the same on every run.
    const dir = join(tmpdir(), 'family-insight-docs', 'Documents')
    mkdirSync(dir, { recursive: true })
    const existing = lang === 'pl' ? 'Kowalscy' : 'Kowalski family'
    const missing = lang === 'pl' ? 'Rodzina Nowaków' : 'Nowak family'
    copyFileSync(FIXTURE, join(dir, `${existing}.finsight`))
    const ago = (hours: number): string => new Date(Date.now() - hours * 3_600_000).toISOString()
    return {
      settings: {
        recentFiles: [
          { path: join(dir, `${existing}.finsight`), name: existing, openedAt: ago(2) },
          { path: join(dir, `${missing}.finsight`), name: missing, openedAt: ago(72) }
        ]
      }
    }
  }
)

scene('new-tree', async (s) => {
  await s.page.getByRole('button', { name: s.t('welcome.newTree') }).click()
  const d = dialog(s)
  await d.getByRole('textbox').fill(s.t('welcome.sampleName'))
  return dialogShot(s, {
    steps: [
      { target: d.getByRole('textbox'), badge: 'above' },
      { target: d.getByRole('button', { name: s.t('welcome.create') }), badge: 'above' }
    ]
  })
})

scene('first-person', async (s) => {
  const { page, t } = s
  await page.getByRole('button', { name: t('welcome.newTree') }).click()
  await dialog(s).getByRole('textbox').fill(t('welcome.sampleName'))
  await dialog(s)
    .getByRole('button', { name: t('welcome.create') })
    .click()
  const given = page.getByLabel(t('person.givenNames'))
  await given.waitFor()
  await given.fill('Anna')
  const surname = page.getByLabel(t('person.surname'), { exact: true })
  await surname.fill('Kowalska')
  const birth = page.getByLabel(t('person.birthDate'))
  await birth.fill('1990')
  await birth.blur()
  return {
    steps: [
      { target: given, badge: 'left' },
      { target: surname, badge: 'left' },
      { target: birth, badge: 'above' }
    ]
  }
})

/** Fills the open person editor and closes it with Done. */
async function fillPerson(
  s: Session,
  person: { given: string; surname?: string; sex?: 'female' | 'male'; born?: string }
): Promise<void> {
  const { page, t } = s
  await page.getByLabel(t('person.givenNames')).fill(person.given)
  if (person.surname !== undefined) {
    await page.getByLabel(t('person.surname'), { exact: true }).fill(person.surname)
  }
  if (person.sex) await page.getByRole('radio', { name: t(`sex.${person.sex}`) }).click()
  if (person.born) await page.getByLabel(t('person.birthDate')).fill(person.born)
  await page.getByRole('button', { name: t('common.done') }).click()
  await page.waitForTimeout(400)
}

async function addRelative(s: Session, role: string): Promise<void> {
  await panel(s)
    .getByRole('button', { name: s.t(`relations.add.${role}`), exact: true })
    .first()
    .click()
  await s.page.getByLabel(s.t('person.givenNames')).waitFor()
  await s.page.waitForTimeout(400)
}

/** The tutorial from "Your first family tree": you, your parents, your partner and child. */
async function buildFirstTree(s: Session, until: 'father' | 'done'): Promise<void> {
  const { page, t } = s
  await page.getByRole('button', { name: t('welcome.newTree') }).click()
  await dialog(s).getByRole('textbox').fill(s.t('tree.untitled'))
  await dialog(s)
    .getByRole('button', { name: t('welcome.create') })
    .click()
  await page.getByLabel(t('person.givenNames')).waitFor()
  await fillPerson(s, { given: 'Anna', surname: 'Kowalska', sex: 'female', born: '1990' })
  await addRelative(s, 'father')
  if (until === 'father') return
  await fillPerson(s, { given: 'Jan', born: '~1960' })
  await select(s, 'Anna Kowalska')
  await addRelative(s, 'mother')
  await fillPerson(s, { given: 'Maria', surname: 'Kowalska', born: '1962' })
  await select(s, 'Anna Kowalska')
  await addRelative(s, 'partner')
  await fillPerson(s, { given: 'Tomasz', surname: 'Nowak', born: '1988' })
  await select(s, 'Anna Kowalska')
  await addRelative(s, 'child')
  await fillPerson(s, { given: 'Zofia', born: '2020' })
  await select(s, 'Anna Kowalska')
}

scene('tutorial-father', async (s) => {
  await buildFirstTree(s, 'father')
  await parkMouse(s)
  return {
    steps: [
      { target: s.page.getByLabel(s.t('person.givenNames')), badge: 'left' },
      { target: s.page.getByLabel(s.t('person.surname'), { exact: true }), badge: 'left' }
    ]
  }
})

scene('tutorial-result', async (s) => {
  await buildFirstTree(s, 'done')
  await s.page.getByRole('button', { name: s.t('tree.fit') }).click()
  await s.page.waitForTimeout(600)
  await parkMouse(s)
})

scene('workspace', async (s) => {
  await openSample(s)
  await select(s, 'Piotr Kowalski')
  await parkMouse(s)
})

scene('workspace-tour', async (s) => {
  const { page, t } = s
  await openSample(s)
  await select(s, 'Piotr Kowalski')
  await parkMouse(s)
  return {
    steps: [
      page.getByRole('button', { name: t('menu.file') }),
      page.getByRole('button', { name: t('workspace.addPerson') }),
      page.getByRole('radiogroup', { name: t('view.mode') }),
      page.getByRole('searchbox', { name: t('common.search') }),
      page.getByRole('listbox', { name: t('people.title') }),
      panel(s),
      page.getByRole('img', { name: t('tree.minimap') }),
      page.getByRole('toolbar', { name: t('tree.zoomControls') })
    ]
  }
})

scene('empty-tree', async (s) => {
  const { page, t } = s
  await page.getByRole('button', { name: t('welcome.newTree') }).click()
  await dialog(s)
    .getByRole('button', { name: t('welcome.create') })
    .click()
  await page.getByLabel(t('person.givenNames')).waitFor()
  // Delete the automatically added first person to show the empty state.
  await panel(s)
    .getByRole('button', { name: t('person.delete') })
    .click()
  await dialog(s)
    .getByRole('button', { name: t('common.delete') })
    .click()
  await page.getByRole('button', { name: t('tree.addFirst') }).waitFor()
  await parkMouse(s)
})

// ---------------------------------------------------------------------------------------------
// People and relationships

scene('person-details', async (s) => {
  await openSample(s)
  await select(s, 'Piotr Kowalski')
  await parkMouse(s)
  return { clip: panel(s), pad: 0 }
})

scene('family-section', async (s) => {
  await openSample(s)
  // Married into the family, so her parents are missing and every "add" button shows.
  await select(s, 'Katarzyna Kowalska')
  const p = panel(s)
  const add = (key: string): Locator =>
    p.getByRole('button', { name: s.t(`relations.add.${key}`), exact: true }).first()
  await parkMouse(s)
  return {
    clip: p,
    pad: 0,
    steps: [
      add('father'),
      { target: add('mother'), badge: 'right' },
      { target: add('partner'), badge: 'right' },
      { target: add('child'), badge: 'right' },
      {
        target: p.getByRole('button', { name: s.t('relations.linkExisting') }).first(),
        badge: 'left'
      }
    ]
  }
})

scene('link-existing', async (s) => {
  await openSample(s)
  await select(s, 'Piotr Kowalski')
  await panel(s)
    .getByRole('button', { name: s.t('relations.linkExisting') })
    .first()
    .click()
  await dialog(s).waitFor()
  return dialogShot(s)
})

scene('which-parent', async (s) => {
  await openSample(s)
  await select(s, 'Piotr Kowalski')
  await panel(s)
    .getByRole('button', { name: s.t('relations.add.child'), exact: true })
    .first()
    .click()
  await dialog(s).waitFor()
  return dialogShot(s)
})

scene('card-menu', async (s) => {
  await openSample(s)
  await select(s, 'Ewa Lis')
  await zoomToSelected(s)
  await card(s, 'Ewa Lis').click({ button: 'right' })
  await menu(s).waitFor()
  return { clip: [card(s, 'Ewa Lis'), menu(s)], pad: 24 }
})

scene('person-editor', async (s) => {
  const { page, t } = s
  await openSample(s)
  await select(s, 'Piotr Kowalski')
  await panel(s)
    .getByRole('button', { name: t('common.edit') })
    .click()
  await page.getByLabel(t('person.givenNames')).waitFor()
  await parkMouse(s)
  return { clip: panel(s), pad: 0 }
})

scene('date-field', async (s) => {
  const { page, t } = s
  await openSample(s)
  await select(s, 'Piotr Kowalski')
  await panel(s)
    .getByRole('button', { name: t('common.edit') })
    .click()
  const date = page.getByLabel(t('person.birthDate'))
  await date.fill('~1955')
  const group = page.getByRole('group', { name: t('person.birth') })
  return {
    clip: group,
    pad: 12,
    steps: [
      { target: date, badge: 'above' },
      { target: page.getByLabel(t('person.dateQualifier')).first(), badge: 'left' }
    ]
  }
})

scene('photo-crop', async (s) => {
  const { page, t } = s
  await openSample(s)
  await select(s, 'Piotr Kowalski')
  await panel(s)
    .getByRole('button', { name: t('common.edit') })
    .click()
  await mockDialogs(s.app, { open: portrait() })
  await page.getByRole('button', { name: t('photo.add') }).click()
  await dialog(s).waitFor()
  return dialogShot(s, { settle: 1200 })
})

scene('relation-options', async (s) => {
  await openSample(s)
  await select(s, 'Piotr Kowalski')
  const name = 'Magdalena Nowicka'
  const row = panel(s).getByRole('button', { name, exact: true }).first()
  await panel(s)
    .getByRole('button', { name: s.t('relations.options', { name }) })
    .click()
  await menu(s).waitFor()
  return { clip: [row, menu(s)], pad: 16 }
})

scene('parent-kind', async (s) => {
  await openSample(s)
  await select(s, 'Piotr Kowalski')
  const name = 'Jan Kowalski'
  const row = panel(s).getByRole('button', { name, exact: true }).first()
  await panel(s)
    .getByRole('button', { name: s.t('relations.options', { name }) })
    .click()
  await menu(s).waitFor()
  return { clip: [row, menu(s)], pad: 16 }
})

scene('remarriage', async (s) => {
  const { page, t } = s
  await openSample(s)
  // Piotr's two marriages: his descendants one generation deep, fitted to the window.
  await setRoot(s, 'Piotr Kowalski')
  await page.getByRole('radio', { name: t('view.descendants'), exact: true }).click()
  await page.getByLabel(t('view.depth')).selectOption('1')
  await page.getByRole('button', { name: t('workspace.hideSidebar') }).click()
  if (await panel(s).isVisible()) await closePanel(s)
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: t('tree.fit') }).click()
  await page.waitForTimeout(900)
  await page.waitForTimeout(900)
  await parkMouse(s)
})

scene('partnership-dialog', async (s) => {
  await openSample(s)
  await select(s, 'Piotr Kowalski')
  await panel(s)
    .getByRole('button', { name: s.t('relations.options', { name: 'Katarzyna Kowalska' }) })
    .click()
  await menu(s)
    .getByRole('menuitem', { name: s.t('relations.editPartnership') })
    .click()
  await dialog(s).waitFor()
  return dialogShot(s)
})

scene('delete-confirm', async (s) => {
  await openSample(s)
  await select(s, 'Lena Kowalska')
  await panel(s)
    .getByRole('button', { name: s.t('person.delete') })
    .click()
  await dialog(s).waitFor()
  return dialogShot(s)
})

scene('events-editor', async (s) => {
  const { page, t } = s
  await openSample(s)
  await setEvents(s, 'Jan Kowalski', janEvents(s.variant.lang))
  await select(s, 'Jan Kowalski')
  await panel(s)
    .getByRole('button', { name: t('common.edit') })
    .click()
  const name = t('events.type.military-service')
  await panel(s)
    .getByRole('button', { name: t('events.edit', { name }) })
    .click()
  const legend = panel(s).getByText(t('events.title'), { exact: true })
  await legend.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await parkMouse(s)
  return {
    clip: panel(s),
    pad: 0,
    steps: [
      {
        target: panel(s).getByRole('button', { name: t('events.edit', { name }) }),
        badge: 'above'
      },
      {
        target: panel(s).getByRole('button', { name: t('events.moveUp', { name }) }),
        badge: 'above'
      },
      { target: panel(s).getByLabel(t('events.endDate')), badge: 'above' }
    ]
  }
})

scene('events-menu', async (s) => {
  const { t } = s
  await openSample(s)
  await select(s, 'Lena Kowalska')
  await panel(s)
    .getByRole('button', { name: t('common.edit') })
    .click()
  const add = panel(s).getByRole('button', { name: t('events.add') })
  await add.scrollIntoViewIfNeeded()
  await add.click()
  await menu(s).waitFor()
  return { clip: [add, menu(s)], pad: 16 }
})

scene('events-details', async (s) => {
  const { t } = s
  await openSample(s)
  await setEvents(s, 'Jan Kowalski', janEvents(s.variant.lang))
  await select(s, 'Jan Kowalski')
  await panel(s)
    .getByRole('heading', { name: t('timeline.title') })
    .scrollIntoViewIfNeeded()
  await parkMouse(s)
  return { clip: panel(s), pad: 0 }
})

scene('sources-manager', async (s) => {
  await openSample(s)
  await addSampleSources(s)
  await menuAction(s, 'edit:sources')
  await dialog(s).waitFor()
  await dialog(s)
    .getByRole('button', { name: /^(Register of births|Księga urodzeń)/ })
    .click()
  return dialogShot(s)
})

scene('citations-dialog', async (s) => {
  const { t } = s
  await openSample(s)
  await addSampleSources(s)
  await select(s, 'Jan Kowalski')
  await panel(s)
    .getByRole('button', { name: t('common.edit') })
    .click()
  await panel(s)
    .getByRole('button', {
      name: startsWith(t('sources.citeTitle', { fact: 'Jan Kowalski – ' + t('timeline.birth') }))
    })
    .click()
  await dialog(s).waitFor()
  return dialogShot(s)
})

scene('cite-buttons', async (s) => {
  const { t } = s
  await openSample(s)
  await addSampleSources(s)
  await select(s, 'Jan Kowalski')
  await panel(s)
    .getByRole('button', { name: t('common.edit') })
    .click()
  const birth = panel(s).getByRole('button', {
    name: startsWith(t('sources.citeTitle', { fact: 'Jan Kowalski – ' + t('timeline.birth') }))
  })
  await birth.scrollIntoViewIfNeeded()
  await parkMouse(s)
  return { clip: panel(s), pad: 0, steps: [{ target: birth, badge: 'right' }] }
})

scene('sources-details', async (s) => {
  const { t } = s
  await openSample(s)
  await addSampleSources(s)
  await select(s, 'Jan Kowalski')
  const heading = panel(s).getByRole('heading', { name: t('timeline.title') })
  await heading.evaluate((h) => h.scrollIntoView({ block: 'start' }))
  await s.page.waitForTimeout(300)
  await parkMouse(s)
  const marker = panel(s).locator('[data-type="birth"]').getByRole('button')
  return { clip: panel(s), pad: 0, steps: [{ target: marker, badge: 'right' }] }
})

// ---------------------------------------------------------------------------------------------
// Photos and documents

scene('media-gallery', async (s) => {
  const { t } = s
  await openSample(s)
  await addJanMedia(s)
  const gallery = panel(s).getByRole('region', { name: t('media.gallery') })
  await gallery.evaluate((g) => g.scrollIntoView({ block: 'center' }))
  await s.page.waitForTimeout(300)
  await parkMouse(s)
  return {
    clip: panel(s),
    pad: 0,
    steps: [
      { target: gallery.getByRole('button', { name: t('media.add') }), badge: 'left' },
      { target: gallery.getByRole('listitem').first().getByRole('button').last(), badge: 'right' }
    ]
  }
})

scene('media-viewer', async (s) => {
  const { page, t } = s
  await openSample(s)
  await addJanMedia(s)
  const title = s.variant.lang === 'pl' ? 'Ślub Jana i Anny' : 'Wedding of Jan and Anna'
  await panel(s)
    .getByRole('button', { name: t('media.open', { title }) })
    .click()
  await page.getByRole('dialog', { name: title }).getByRole('img').waitFor()
  await parkMouse(s)
  return { settle: 800 }
})

scene('media-details', async (s) => {
  const { t } = s
  await openSample(s)
  await addJanMedia(s)
  const title = s.variant.lang === 'pl' ? 'Ślub Jana i Anny' : 'Wedding of Jan and Anna'
  await panel(s)
    .getByRole('button', { name: t('media.actions', { title }) })
    .click()
  await menu(s)
    .getByRole('menuitem', { name: t('media.editDetails') })
    .click()
  await dialog(s).waitFor()
  return dialogShot(s, {
    steps: [
      { target: dialog(s).getByRole('button', { name: t('media.addPerson') }), badge: 'right' }
    ]
  })
})

scene('source-scans', async (s) => {
  const { page, t } = s
  await openSample(s)
  await addSampleSources(s)
  await addJanMedia(s)
  await page.evaluate(() => {
    type Tree = {
      media: Record<string, { id: string; fileName: string }>
      sources: Record<string, { id: string; mediaIds?: string[] }>
    }
    const store = (
      window as unknown as {
        __familyInsight: {
          useDocument: { getState: () => { dispatch: (cmd: unknown) => void } }
        }
      }
    ).__familyInsight.useDocument
    store.getState().dispatch({
      label: 'history.editSource',
      run: (tree: Tree) => {
        const pdf = Object.values(tree.media).find((m) => m.fileName === 'birth-certificate.pdf')!
        const sources = { ...tree.sources, s1: { ...tree.sources.s1!, mediaIds: [pdf.id] } }
        return { tree: { ...tree, sources }, result: undefined }
      }
    })
  })
  await menuAction(s, 'edit:sources')
  await dialog(s).waitFor()
  await dialog(s)
    .getByRole('button')
    .filter({ hasText: s.variant.lang === 'pl' ? 'Księga' : 'Register' })
    .first()
    .click()
  const strip = dialog(s)
    .getByRole('group', { name: t('media.scans') })
    .first()
  await strip.evaluate((g) => g.scrollIntoView({ block: 'center' }))
  return dialogShot(s, { steps: [{ target: strip, badge: 'left' }] })
})

// ---------------------------------------------------------------------------------------------
// Places

/** Gives a few places of the sample family coordinates (the rest stay without). */
async function locateSamplePlaces(s: Session): Promise<void> {
  await s.page.evaluate(() => {
    const store = (
      window as unknown as {
        __familyInsight: { useDocument: { getState: () => { dispatch: (cmd: unknown) => void } } }
      }
    ).__familyInsight.useDocument
    store.getState().dispatch({
      label: 'history.setPlace',
      run: (tree: { places: object }) => ({
        tree: {
          ...tree,
          places: {
            ...tree.places,
            lodz: { lat: 51.7592, lon: 19.456, source: 'geocoded', displayName: 'Łódź, Poland' },
            warszawa: { lat: 52.2297, lon: 21.0118, source: 'manual' }
          }
        },
        result: undefined
      })
    })
  })
}

scene('places-manager', async (s) => {
  const { t } = s
  await openSample(s)
  await locateSamplePlaces(s)
  await menuAction(s, 'edit:places')
  await dialog(s).waitFor()
  await dialog(s).getByRole('button', { name: /^Łódź/ }).click()
  return dialogShot(s, {
    steps: [{ target: dialog(s).getByRole('button', { name: t('places.lookup') }), badge: 'right' }]
  })
})

scene('places-consent', async (s) => {
  const { page, t } = s
  await openSample(s)
  await menuAction(s, 'edit:places')
  await dialog(s).waitFor()
  await dialog(s).getByRole('button', { name: /^Łódź/ }).click()
  await dialog(s)
    .getByRole('button', { name: t('places.lookup') })
    .click()
  const question = page
    .getByRole('alertdialog')
    .or(page.getByRole('dialog', { name: t('places.consentTitle') }))
  await question.first().waitFor()
  return { clip: question.first(), pad: 24, settle: 600 }
})

// ---------------------------------------------------------------------------------------------
// Map

/** Local tile server, so the map screenshots never depend on the internet. */
let tileServer: Awaited<ReturnType<typeof startTileServer>> | null = null
test.beforeAll(async () => {
  tileServer = await startTileServer()
})
test.afterAll(async () => {
  await tileServer?.close()
})
const onlineMap = (): StartOptions => ({
  settings: {
    onlineMaps: true,
    mapTileUrl: tileServer!.url,
    panels: { sidebarOpen: false, sidebarWidth: 280, detailsWidth: 380 }
  }
})

/** Coordinates for the places of the sample family. */
async function locateAllSamplePlaces(s: Session): Promise<void> {
  await s.page.evaluate(() => {
    const store = (
      window as unknown as {
        __familyInsight: { useDocument: { getState: () => { dispatch: (cmd: unknown) => void } } }
      }
    ).__familyInsight.useDocument
    const at = (lat: number, lon: number) => ({ lat, lon, source: 'manual' })
    store.getState().dispatch({
      label: 'history.setPlace',
      run: (tree: { places: object }) => ({
        tree: {
          ...tree,
          places: {
            lodz: at(51.7592, 19.456),
            poznan: at(52.4064, 16.9252),
            gdansk: at(54.352, 18.6466),
            krakow: at(50.0619, 19.9369),
            gniezno: at(52.535, 17.5826),
            sopot: at(54.4418, 18.5601),
            warszawa: at(52.2297, 21.0118)
          }
        },
        result: undefined
      })
    })
  })
}

async function openMap(s: Session): Promise<void> {
  await s.page.getByRole('radio', { name: s.t('map.title') }).click()
  await s.page.getByTestId('map').waitFor()
}

scene(
  'map-overview',
  async (s) => {
    const { page, t } = s
    await openSample(s)
    await locateAllSamplePlaces(s)
    await openMap(s)
    await page.locator('img.leaflet-tile-loaded').first().waitFor()
    const marker = page.getByRole('button', { name: /^(Łódź|Lodz)/ }).first()
    await marker.click()
    const panel = page.getByRole('complementary', { name: t('map.panel') })
    // Picking a person from the place selects them: details open, their path is drawn.
    await panel.getByRole('button', { name: 'Józef Kowalski' }).first().click()
    await page.waitForTimeout(800)
    await parkMouse(s)
    return {
      settle: 1200,
      steps: [
        { target: panel.getByRole('heading', { name: t('map.show') }), badge: 'right' },
        { target: marker, badge: 'right' },
        { target: panel.getByRole('heading', { name: t('map.legend') }), badge: 'right' }
      ]
    }
  },
  onlineMap
)

scene('map-offline', async (s) => {
  const { page } = s
  await openSample(s)
  await locateAllSamplePlaces(s)
  await openMap(s)
  const notice = page.getByRole('status').filter({ hasText: s.t('map.offline') })
  await notice.waitFor()
  await parkMouse(s)
  return { clip: notice, pad: 24 }
})

// ---------------------------------------------------------------------------------------------
// GEDCOM

scene('gedcom-import', async (s) => {
  const file = join(tempDir(), 'myheritage.ged')
  copyFileSync(join(__dirname, '../../src/core/io/gedcom/fixtures/myheritage.ged'), file)
  await mockDialogs(s.app, { open: file })
  await menuAction(s, 'file:import-gedcom')
  await dialog(s).waitFor()
  return dialogShot(s)
})

scene('gedcom-export', async (s) => {
  await openSample(s)
  await menuAction(s, 'file:export-gedcom')
  await dialog(s).waitFor()
  return dialogShot(s)
})

// ---------------------------------------------------------------------------------------------
// Updates

/** Pretends the updater found version 1.2.0 (the updater itself is off in this test build). */
async function fakeUpdate(s: Session): Promise<void> {
  const pl = s.variant.lang === 'pl'
  const notes = pl
    ? '## Nowości\n\n- **Relacje pokrewieństwa** – jak są ze sobą spokrewnieni?\n- Program po niemiecku, francusku, hiszpańsku, włosku, portugalsku i rosyjsku\n\n## Poprawki\n\n- Szybsze otwieranie dużych drzew'
    : '## New\n\n- **How are they related?** – the relationship between any two people\n- The app in German, French, Spanish, Italian, Portuguese and Russian\n\n## Fixed\n\n- Large trees open faster'
  await s.app.evaluate(({ BrowserWindow }, notes) => {
    BrowserWindow.getAllWindows()[0]!.webContents.send('updates:status', {
      state: 'available',
      support: 'auto',
      version: '1.2.0',
      notes
    })
  }, notes)
}

scene('update-available', async (s) => {
  const { page, t } = s
  await openSample(s)
  await fakeUpdate(s)
  const notice = page.getByRole('status', { name: t('updates.title') })
  await notice.waitFor()
  await parkMouse(s)
  return { clip: notice, pad: 24 }
})

scene('update-notes', async (s) => {
  const { page, t } = s
  await openSample(s)
  await fakeUpdate(s)
  await page.getByRole('button', { name: t('updates.releaseNotes') }).click()
  await dialog(s).waitFor()
  return dialogShot(s)
})

// ---------------------------------------------------------------------------------------------
// Exploring the tree

scene('view-controls', async (s) => {
  const { page, t } = s
  await openSample(s)
  const group = page.getByRole('radiogroup', { name: t('view.mode') })
  const mode = (key: string): Locator => page.getByRole('radio', { name: t(key), exact: true })
  return {
    clip: group,
    pad: 40,
    steps: ['view.family', 'view.ancestors', 'view.descendants', 'view.hourglass'].map((key) => ({
      target: mode(key),
      badge: 'above' as const
    }))
  }
})

// The view follows the root person (🏠) when there is one, otherwise the selected person.
for (const [mode, person] of [
  ['ancestors', 'Lena Kowalska'],
  ['descendants', 'Jan Kowalski'],
  ['hourglass', 'Jakub Kowalski']
] as const) {
  scene(`view-${mode}`, async (s) => {
    await openSample(s)
    await setRoot(s, person)
    await select(s, person)
    await closePanel(s)
    await s.page.getByRole('radio', { name: s.t(`view.${mode}`), exact: true }).click()
    await s.page.waitForTimeout(500)
    await s.page.getByRole('button', { name: s.t('tree.fit') }).click()
    await s.page.waitForTimeout(800)
    await parkMouse(s)
  })
}

scene('collapse-branch', async (s) => {
  await openSample(s)
  const name = 'Tadeusz Wiśniewski'
  await select(s, name)
  await zoomToSelected(s)
  await card(s, name).hover()
  const toggle = canvas(s).getByRole('button', { name: s.t('tree.collapse', { name }) })
  await toggle.waitFor()
  return { clip: [card(s, name), toggle], pad: 70, steps: [{ target: toggle, badge: 'right' }] }
})

scene('canvas-controls', async (s) => {
  const { page, t } = s
  await openSample(s)
  const controls = page.getByRole('toolbar', { name: t('tree.zoomControls') })
  const above = (target: Locator): { target: Locator; badge: 'above' } => ({
    target,
    badge: 'above'
  })
  return {
    clip: controls,
    pad: 40,
    steps: [
      above(page.getByRole('button', { name: t('tree.zoomOut') })),
      above(page.getByTitle(t('tree.resetZoom'))),
      above(page.getByRole('button', { name: t('tree.zoomIn') })),
      above(page.getByRole('button', { name: t('tree.fit') })),
      above(page.getByRole('button', { name: t('tree.centerSelected') })),
      above(page.getByRole('button', { name: t('tree.minimap') }))
    ]
  }
})

scene('search', async (s) => {
  const { page, t } = s
  await openSample(s)
  await page.getByRole('searchbox', { name: t('common.search') }).fill('lodz')
  await page.waitForTimeout(600)
})

scene('people-sort', async (s) => {
  await openSample(s)
  const button = s.page.getByRole('button', { name: s.t('people.sort') })
  await button.click()
  await menu(s).waitFor()
  return { clip: [button, menu(s)], pad: 16 }
})

scene('timeline', async (s) => {
  await openSample(s)
  await select(s, 'Anna Kowalska')
  const life = panel(s).getByRole('heading', { name: s.t('timeline.title') })
  await life.scrollIntoViewIfNeeded()
  await parkMouse(s)
  return { clip: panel(s), pad: 0 }
})

scene('statistics', async (s) => {
  await openSample(s)
  await s.page.getByRole('button', { name: s.t('stats.title') }).click()
  await dialog(s).waitFor()
  return dialogShot(s, { settle: 1200 })
})

/** Opens the relationship calculator for Michał Kowalski in relation to Aleksandra Lis. */
async function openRelationship(s: Session): Promise<void> {
  const { page, t } = s
  await openSample(s)
  await select(s, 'Michał Kowalski')
  await page.getByRole('button', { name: t('kinship.title') }).click()
  await dialog(s).waitFor()
  await page.getByRole('button', { name: t('kinship.reference') }).click()
  const picker = page.getByRole('dialog', { name: t('kinship.reference') })
  await picker.getByRole('searchbox').fill('Aleksandra')
  await picker.getByRole('option', { name: /Aleksandra Lis/ }).click()
  await page.getByTestId('kinship-sentence').filter({ hasText: 'Aleksandra Lis' }).waitFor()
}

scene('relationship', async (s) => {
  await openRelationship(s)
  await parkMouse(s)
  return dialogShot(s)
})

scene('relationship-path', async (s) => {
  await openRelationship(s)
  await s.page.getByRole('button', { name: s.t('kinship.showOnTree') }).click()
  await canvas(s).locator('[data-on-path]').first().waitFor()
  await s.page.waitForTimeout(900)
  await parkMouse(s)
})

scene('root-relationship', async (s) => {
  const { t } = s
  await openSample(s)
  await card(s, 'Piotr Kowalski').click({ button: 'right' })
  await menu(s)
    .getByRole('menuitem', { name: t('tree.setRoot') })
    .click()
  await select(s, 'Lena Kowalska')
  const line = panel(s)
    .getByRole('button', { name: /Piotr Kowalski/ })
    .first()
  await line.waitFor()
  await parkMouse(s)
  const edit = panel(s).getByRole('button', { name: t('common.edit') })
  return { clip: [panel(s).getByRole('heading', { name: 'Lena Kowalska' }), line, edit], pad: 24 }
})

scene('shortcuts', async (s) => {
  await openSample(s)
  await menuAction(s, 'help:shortcuts')
  await dialog(s).waitFor()
  return dialogShot(s)
})

scene('about', async (s) => {
  await menuAction(s, 'help:about')
  await dialog(s).waitFor()
  return dialogShot(s)
})

// ---------------------------------------------------------------------------------------------
// Files, CSV and printing

scene('file-menu', async (s) => {
  await openSample(s)
  const button = s.page.getByRole('button', { name: s.t('menu.file') })
  await button.click()
  await menu(s).waitFor()
  return { clip: [button, menu(s)], pad: 16 }
})

scene('settings-menu', async (s) => {
  await openSample(s)
  const button = s.page.getByRole('button', { name: s.t('settings.title') })
  await button.click()
  await menu(s).waitFor()
  return { clip: [button, menu(s)], pad: 16 }
})

scene(
  'tapestry-tree',
  async (s) => {
    await openSample(s)
    await s.page.getByRole('button', { name: s.t('tree.fit') }).click()
    await s.page.waitForTimeout(1200)
    await parkMouse(s)
  },
  { settings: { style: 'tapestry' } }
)

scene('guided-tour', async (s) => {
  await openSample(s)
  await s.app.evaluate(({ Menu }) => Menu.getApplicationMenu()!.getMenuItemById('tour')!.click())
  await s.page.locator('[data-tour-overlay] [role="dialog"]').waitFor()
  await s.page.waitForTimeout(800)
  await parkMouse(s)
})

scene('unsaved-status', async (s) => {
  await openSample(s)
  await setRoot(s, 'Lena Kowalska')
  const status = s.page.getByText(s.t('workspace.unsaved'))
  await status.waitFor()
  await parkMouse(s)
  return {
    clip: status,
    pad: 14,
    steps: [{ target: status, badge: 'left' }]
  }
})

scene(
  'recovery',
  async (s) => {
    await dialog(s).waitFor()
    return dialogShot(s)
  },
  {
    prepare: (userData) => {
      mkdirSync(join(userData, 'recovery'))
      const id = '3f2c1a9e-1b7d-4a55-9a51-6f3e0c8d2b11'
      writeFileSync(
        join(userData, 'recovery', `${id}.json`),
        JSON.stringify({
          id,
          originalPath: null,
          name: 'Kowalscy',
          savedAt: FIXED_TIME,
          content: readFileSync(FIXTURE, 'utf8')
        })
      )
    }
  }
)

scene('csv-import', async (s) => {
  await mockDialogs(s.app, { open: SAMPLE_CSV(s.variant.lang) })
  await s.page.getByRole('button', { name: s.t('welcome.importCsv') }).click()
  await dialog(s).waitFor()
  return dialogShot(s)
})

scene('csv-import-columns', async (s) => {
  await mockDialogs(s.app, { open: SAMPLE_CSV(s.variant.lang) })
  await s.page.getByRole('button', { name: s.t('welcome.importCsv') }).click()
  const heading = dialog(s).getByRole('heading', { name: s.t('csv.columnsTitle') })
  await heading.scrollIntoViewIfNeeded()
  const table = dialog(s).getByRole('table').first()
  return { clip: [heading, table], pad: 16, isolate: true }
})

scene('csv-import-errors', async (s) => {
  const file = join(tempDir(), s.variant.lang === 'pl' ? 'rodzina.csv' : 'family.csv')
  const csv =
    s.variant.lang === 'pl'
      ? 'id;imiona;nazwisko;data_urodzenia;ojciec_id\np1;Jan;Kowalski;1925;\np2;Piotr;Kowalski;1955;p1\np2;Ewa;Lis;12.13.1952;\np4;Marek;Lis;1983;p9\n'
      : 'id,given_names,surname,birth_date,father_id\np1,Jan,Kowalski,1925,\np2,Piotr,Kowalski,1955,p1\np2,Ewa,Lis,1952-13-12,\np4,Marek,Lis,1983,p9\n'
  writeFileSync(file, csv)
  await mockDialogs(s.app, { open: file })
  await s.page.getByRole('button', { name: s.t('welcome.importCsv') }).click()
  await dialog(s).waitFor()
  return dialogShot(s)
})

scene('csv-export', async (s) => {
  await openSample(s)
  await menuAction(s, 'file:export-csv')
  await dialog(s).waitFor()
  return dialogShot(s)
})

scene('export-image', async (s) => {
  await openSample(s)
  await menuAction(s, 'file:export-image')
  await dialog(s).waitFor()
  return dialogShot(s)
})
