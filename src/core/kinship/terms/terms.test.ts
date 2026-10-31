import { describe, expect, it } from 'vitest'
import { english } from './en'
import { polish } from './pl'
import { namerTable, type Table } from './table'

const EN: Table = {
  f: ['father', 'mother'],
  m: ['mother', 'father'],
  gf: ['grandfather', 'grandmother'],
  mgm: ['grandmother', 'grandfather'],
  ggf: ['great-grandfather', 'great-grandmother'],
  gggf: ['great-great-grandfather', 'great-great-grandmother'],
  son: ['son', 'daughter'],
  gs: ['grandson', 'granddaughter'],
  ggs: ['great-grandson', 'great-granddaughter'],
  ad: ['adopted daughter', 'adopted son'],
  br: ['brother', 'sister'],
  hb: ['half-brother', 'half-sister'],
  u: ['uncle', 'aunt'],
  mt: ['aunt', 'uncle'],
  hs: ['half-aunt', 'half-uncle'],
  gu: ['great-uncle', 'great-aunt'],
  nep: ['nephew', 'niece'],
  gnep: ['grandnephew', 'grandniece'],
  c1: ['first cousin', 'first cousin'],
  mc: ['first cousin', 'first cousin'],
  c1d: ['first cousin once removed', 'first cousin once removed'],
  gu1: ['first cousin once removed', 'first cousin once removed'],
  sc2: ['second cousin', 'second cousin'],
  sc3: ['second cousin once removed', 'second cousin once removed'],
  h: ['husband', 'wife'],
  hf: ['father-in-law', 'mother-in-law'],
  hm: ['mother-in-law', 'father-in-law'],
  hbr: ['brother-in-law', 'sister-in-law'],
  sil: ['sister-in-law', 'brother-in-law'],
  dil: ['daughter-in-law', 'son-in-law'],
  hbrw: ['co-sister-in-law', 'co-brother-in-law'],
  sm: ['stepmother', 'stepfather'],
  sb: ['stepbrother', 'stepsister']
}

const PL: Table = {
  f: ['ojciec', 'matka'],
  m: ['matka', 'ojciec'],
  gf: ['dziadek', 'babcia'],
  mgm: ['babcia', 'dziadek'],
  ggf: ['pradziadek', 'prababcia'],
  gggf: ['prapradziadek', 'praprababcia'],
  son: ['syn', 'córka'],
  gs: ['wnuk', 'wnuczka'],
  ggs: ['prawnuk', 'prawnuczka'],
  ad: ['córka adopcyjna', 'syn adopcyjny'],
  br: ['brat', 'siostra'],
  hb: ['brat przyrodni', 'siostra przyrodnia'],
  u: ['stryj', 'ciotka'],
  mt: ['ciotka', 'wuj'],
  hs: ['ciotka przyrodnia', 'stryj przyrodni'],
  gu: ['stryjeczny dziadek', 'cioteczna babcia'],
  nep: ['bratanek', 'bratanica'],
  gnep: ['wnuk brata', 'wnuczka brata'],
  c1: ['brat stryjeczny', 'siostra stryjeczna'],
  mc: ['brat cioteczny', 'siostra cioteczna'],
  c1d: ['kuzynka (o pokolenie młodsza)', 'kuzyn (o pokolenie młodszy)'],
  gu1: ['kuzyn (o pokolenie starszy)', 'kuzynka (o pokolenie starsza)'],
  sc2: ['kuzyn w drugiej linii', 'kuzynka w drugiej linii'],
  sc3: [
    'kuzynka w drugiej linii (o pokolenie młodsza)',
    'kuzyn w drugiej linii (o pokolenie młodszy)'
  ],
  h: ['mąż', 'żona'],
  hf: ['teść (świekr)', 'teściowa (świekra)'],
  hm: ['teściowa (świekra)', 'teść (świekr)'],
  hbr: ['szwagier', 'szwagierka'],
  sil: ['bratowa', 'szwagier'],
  dil: ['synowa', 'zięć'],
  hbrw: ['szwagierka', 'szwagier'],
  sm: ['macocha', 'ojczym'],
  sb: ['brat przybrany', 'siostra przybrana']
}

namerTable('en', english, EN)
namerTable('pl', polish, PL)

describe('sentences', () => {
  it('put the name of the relationship between the two names', () => {
    expect(english.sentence('Maria', 'Anna', { term: 'aunt', gender: 'n' })).toBe(
      'Anna is the aunt of Maria.'
    )
    expect(polish.sentence('Maria', 'Anna', { term: 'ciotka', gender: 'f' })).toBe(
      'Anna to ciotka osoby Maria.'
    )
  })

  it('end with the phrase relative to the first person in every language', async () => {
    const { SUPPORTED_LANGUAGES } = await import('../../../shared/i18n')
    const { kinshipLanguage } = await import('./index')
    for (const language of SUPPORTED_LANGUAGES) {
      const lang = kinshipLanguage(language)
      const t = { term: 'x', gender: 'f' } as const
      expect(lang.sentence('Anna', 'Ewa', t), language).toMatch(
        new RegExp(`^Ewa .*${lang.phrase('Anna', t).replace(/[()]/g, '\\$&')}\\.$`)
      )
    }
    expect(english.phrase('Maria', { term: 'aunt', gender: 'n' })).toBe('the aunt of Maria')
  })
})

describe('kinshipLanguage', () => {
  it('has names for every app language', async () => {
    const { SUPPORTED_LANGUAGES } = await import('../../../shared/i18n')
    const { kinshipLanguage } = await import('./index')
    for (const language of SUPPORTED_LANGUAGES) {
      expect(kinshipLanguage(language), language).toBeDefined()
    }
    expect(kinshipLanguage('xx')).toBe(english)
    expect(kinshipLanguage('de')).not.toBe(english)
  })
})
