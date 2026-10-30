import { describe, expect, it } from 'vitest'
import { decodeText, type TextEncodingName } from './encoding'

/** Encodes text in a single-byte Windows code page (Node's TextEncoder only writes UTF-8). */
function encode(text: string, encoding: Exclude<TextEncodingName, 'utf-8'>): Uint8Array {
  const decoder = new TextDecoder(encoding)
  const byteOf = new Map<string, number>()
  for (let b = 0; b < 256; b++) byteOf.set(decoder.decode(new Uint8Array([b])), b)
  return new Uint8Array(
    [...text].map((c) => {
      const b = byteOf.get(c)
      if (b === undefined) throw new Error(`${c} is not in ${encoding}`)
      return b
    })
  )
}

const SAMPLES = {
  pl: 'id;imiona;nazwisko;miejsce_urodzenia\np1;Józef;Kowalski;Łódź\np2;Małgorzata;Żółkiewska;Gdańsk\n',
  cs: 'id;jméno;příjmení\np1;Jiří;Dvořák\np2;Růžena;Šťastná\n',
  ru: 'id;имя;фамилия;место_рождения\np1;Иван Петрович;Иванов;Москва\np2;Алёна;Щукина;Санкт-Петербург\n',
  de: 'id;vornamen;nachname;geburtsort\np1;Jürgen;Müller;Köln\np2;Gisela;Weiß;Düsseldorf\n',
  fr: 'id;prénoms;nom;lieu_de_naissance\np1;François;Lefèvre;Besançon\np2;Hélène;Bœuf;Orléans\n',
  es: 'id;nombres;apellidos;lugar_de_nacimiento\np1;José;Núñez García;Logroño\np2;María;Peña;Cádiz\n'
}

describe('decodeText', () => {
  it('decodes UTF-8 and strips the BOM', () => {
    const bytes = new TextEncoder().encode('﻿Zażółć gęślą jaźń')
    expect(decodeText(bytes)).toEqual({ text: 'Zażółć gęślą jaźń', encoding: 'utf-8' })
  })

  it('falls back to Windows-1250 for legacy Polish files', () => {
    // "Łódź;Żółć" in Windows-1250
    const bytes = new Uint8Array([0xa3, 0xf3, 0x64, 0x9f, 0x3b, 0xaf, 0xf3, 0xb3, 0xe6])
    expect(decodeText(bytes)).toEqual({ text: 'Łódź;Żółć', encoding: 'windows-1250' })
  })

  const cases: [keyof typeof SAMPLES, Exclude<TextEncodingName, 'utf-8'>][] = [
    ['pl', 'windows-1250'],
    ['cs', 'windows-1250'],
    ['ru', 'windows-1251'],
    ['de', 'windows-1252'],
    ['fr', 'windows-1252'],
    ['es', 'windows-1252']
  ]
  it.each(cases)('detects %s text in %s whatever the UI language', (sample, encoding) => {
    const bytes = encode(SAMPLES[sample], encoding)
    expect(decodeText(bytes, { language: 'en' })).toEqual({ text: SAMPLES[sample], encoding })
    // German letters have the same bytes in 1250 and 1252, so either code page is right there.
    for (const language of ['pl', 'ru', 'de', 'fr']) {
      expect(decodeText(bytes, { language }).text, `${sample} with UI ${language}`).toBe(
        SAMPLES[sample]
      )
    }
  })

  it('lets the UI language decide when the text fits several code pages', () => {
    // "Müller" is the same in Windows-1250 and Windows-1252.
    const bytes = encode('id;name\np1;Müller\n', 'windows-1252')
    expect(decodeText(bytes, { language: 'pl' }).encoding).toBe('windows-1250')
    expect(decodeText(bytes, { language: 'de' }).encoding).toBe('windows-1252')
    expect(decodeText(bytes).text).toBe('id;name\np1;Müller\n')
  })

  it('decodes with a chosen code page', () => {
    const bytes = encode(SAMPLES.ru, 'windows-1251')
    expect(decodeText(bytes, { encoding: 'windows-1252' }).encoding).toBe('windows-1252')
    expect(decodeText(bytes, { encoding: 'windows-1251' }).text).toBe(SAMPLES.ru)
    expect(decodeText(new TextEncoder().encode('﻿a;b'), { encoding: 'utf-8' }).text).toBe('a;b')
  })
})
