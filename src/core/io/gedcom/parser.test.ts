import { describe, expect, it } from 'vitest'
import { concatChunks, writeZip } from '../../file/zip'
import { decodeAnsel } from './ansel'
import { decodeGedcom, detectGedcomEncoding } from './encoding'
import { readGedzip } from './gedzip'
import { child, node, parseGedcom, value, writeGedcom } from './parser'

const enc = new TextEncoder()
const HEAD = (char: string, vers = '5.5.1') =>
  `0 HEAD\n1 GEDC\n2 VERS ${vers}\n2 FORM LINEAGE-LINKED\n1 CHAR ${char}\n`

describe('GEDCOM grammar', () => {
  it('parses levels, xrefs, tags and values into a record tree', () => {
    const doc = parseGedcom(
      `${HEAD('UTF-8')}0 @I1@ INDI\n1 NAME Jan /Kowalski/\n2 GIVN Jan\n1 BIRT\n2 DATE 4 NOV 1925\n2 PLAC Łódź\n1 FAMS @F1@\n0 TRLR\n`
    )
    expect(doc.version).toBe('5.5.1')
    expect(doc.warnings).toEqual([])
    const indi = doc.records[1]!
    expect(indi).toMatchObject({ level: 0, xref: '@I1@', tag: 'INDI', line: 6 })
    expect(value(indi, 'NAME')).toBe('Jan /Kowalski/')
    expect(value(child(indi, 'BIRT'), 'PLAC')).toBe('Łódź')
    expect(value(indi, 'FAMS')).toBe('@F1@')
  })

  it('joins CONT and CONC, keeps spaces and accepts any line ending and indentation', () => {
    const text =
      '0 HEAD\r\n0 @N1@ NOTE First line\r1 CONT second \n1 CONC line\r\n  1 CONT\n1 CONT fourth\n0 TRLR'
    const doc = parseGedcom(text)
    expect(doc.records[1]!.value).toBe('First line\nsecond line\n\nfourth')
  })

  it('unescapes @@ (everywhere in 5.5.1, only at the start in 7.0)', () => {
    const v5 = parseGedcom(`${HEAD('UTF-8')}0 @N1@ NOTE mail: jan@@example.org\n0 TRLR\n`)
    expect(v5.records[1]!.value).toBe('mail: jan@example.org')
    const v7 = parseGedcom(`0 HEAD\n1 GEDC\n2 VERS 7.0\n0 @N1@ SNOTE @@home and a@@b\n0 TRLR\n`)
    expect(v7.version).toBe('7.0')
    expect(v7.records[1]!.value).toBe('@home and a@@b')
  })

  it('turns malformed input into warnings with line numbers, never errors', () => {
    const doc = parseGedcom(
      '0 HEAD\nthis is not gedcom\n3 DEEP jump\n1 CONC orphan?\n0 @I1@ INDI\n'
    )
    expect(doc.warnings.map((w) => [w.line, w.code])).toEqual([
      [2, 'malformed-line'],
      [3, 'level-jump'],
      [6, 'missing-trailer']
    ])
    // The jumping line is attached one level below its parent.
    expect(doc.records[0]!.children[0]).toMatchObject({ tag: 'DEEP', level: 1 })
    expect(parseGedcom('').warnings.map((w) => w.code)).toEqual(['missing-head', 'missing-trailer'])
    expect(parseGedcom('1 CONT x\n').warnings[0]!.code).toBe('orphan-continuation')
  })
})

describe('GEDCOM writer', () => {
  it('round-trips text → nodes → text', () => {
    const text = `${HEAD('UTF-8')}0 @I1@ INDI\n1 NAME Anna /Nowak/\n1 NOTE Line one\n2 CONT Line two\n0 TRLR\n`
    expect(writeGedcom(parseGedcom(text).records)).toBe(text)
  })

  it('splits long values with CONC (not at spaces) and new lines with CONT; escapes @', () => {
    const long = 'Lorem ipsum dolor sit amet '.repeat(20).trim()
    const out = writeGedcom([node('NOTE', `${long}\nmail jan@x.pl`, [], '@N1@')], {
      maxLineLength: 80
    })
    const lines = out.trimEnd().split('\n')
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(80)
    for (const line of lines.filter((l) => l.startsWith('1 CONC'))) {
      expect(line.startsWith('1 CONC  ')).toBe(false)
    }
    expect(lines.at(-1)).toBe('1 CONT mail jan@@x.pl')
    expect(parseGedcom(`0 HEAD\n${out}0 TRLR\n`).records[1]!.value).toBe(`${long}\nmail jan@x.pl`)
  })

  it('writes GEDCOM 7 without CONC and escapes only a leading @', () => {
    const out = writeGedcom([node('NOTE', '@start a@b '.repeat(40), [], '@N1@')], {
      version7: true
    })
    expect(out.split('\n').filter(Boolean)).toHaveLength(1)
    expect(out.startsWith('0 @N1@ NOTE @@start a@b')).toBe(true)
  })
})

/** Encodes text as Windows-1252/1250 for the few characters the fixtures need. */
const singleByte = (text: string, table: Record<string, number>): Uint8Array =>
  Uint8Array.from([...text].map((c) => table[c] ?? c.charCodeAt(0)))

describe('GEDCOM encodings', () => {
  it('decodes ANSEL with combining marks before the letter (Polish and German)', () => {
    // Ł ó d ź: Ł = A1, ó = E2 6F, ź = E2 7A; ą = F1 61; ż = E7 7A; ü = E8 75; ß = CF
    const bytes = Uint8Array.from([
      0xa1, 0xe2, 0x6f, 0x64, 0xe2, 0x7a, 0x20, 0xf1, 0x61, 0xe7, 0x7a, 0x20, 0x4d, 0xe8, 0x75,
      0x6c, 0x6c, 0x65, 0x72, 0x20, 0x53, 0x74, 0x72, 0x61, 0xcf, 0x65, 0x20, 0xb1
    ])
    expect(decodeAnsel(bytes)).toBe('Łódź ąż Müller Straße ł')
  })

  it('detects ANSEL files and decodes them', () => {
    const body = enc.encode(`${HEAD('ANSEL', '5.5')}0 @I1@ INDI\n1 NAME Ma`)
    const name = Uint8Array.from([0xb1, 0x67, 0x6f, 0x72, 0x7a, 0x61, 0x74, 0x61]) // ł = B1
    const bytes = new Uint8Array([...body, ...name, ...enc.encode(' /Pi')])
    const { text, detected } = decodeGedcom(
      new Uint8Array([
        ...bytes,
        ...Uint8Array.from([0xe2, 0x6e]),
        ...enc.encode('kowska/\n0 TRLR\n')
      ])
    )
    expect(detected).toMatchObject({ encoding: 'ansel', declared: 'ANSEL', by: 'declaration' })
    expect(text).toContain('Małgorzata /Pińkowska/')
  })

  it('handles BOMs and UTF-16 in both byte orders', () => {
    const text = `${HEAD('UNICODE')}0 @I1@ INDI\n1 NAME Zoë /Żak/\n0 TRLR\n`
    const le = new Uint8Array([
      0xff,
      0xfe,
      ...new Uint8Array(Uint16Array.from(text, (c) => c.charCodeAt(0)).buffer)
    ])
    expect(decodeGedcom(le)).toMatchObject({ text, detected: { encoding: 'utf-16le', by: 'bom' } })
    const be = new Uint8Array(le.length - 2)
    for (let i = 2; i < le.length; i += 2) {
      be[i - 2] = le[i + 1]!
      be[i - 1] = le[i]!
    }
    expect(decodeGedcom(be)).toMatchObject({
      text,
      detected: { encoding: 'utf-16be', by: 'content' }
    })
    const bom8 = new Uint8Array([0xef, 0xbb, 0xbf, ...enc.encode(text.replace('UNICODE', 'UTF-8'))])
    expect(decodeGedcom(bom8).detected.by).toBe('bom')
    expect(decodeGedcom(bom8).text.startsWith('0 HEAD')).toBe(true)
  })

  it('decodes ANSI (Windows-1252) and Windows-1250 files', () => {
    const german = singleByte(`${HEAD('ANSI')}0 @I1@ INDI\n1 NAME Jörg /Müller/\n0 TRLR\n`, {
      ö: 0xf6,
      ü: 0xfc
    })
    expect(decodeGedcom(german)).toMatchObject({ detected: { encoding: 'windows-1252' } })
    expect(decodeGedcom(german).text).toContain('Jörg /Müller/')
    const polish = singleByte(
      `${HEAD('WINDOWS-1250')}0 @I1@ INDI\n1 NAME Łucja /Gąska/\n0 TRLR\n`,
      {
        Ł: 0xa3,
        ą: 0xb9
      }
    )
    expect(decodeGedcom(polish).text).toContain('Łucja /Gąska/')
  })

  it('trusts the content when a file declares ANSEL but is UTF-8, and defaults sensibly', () => {
    const mislabelled = enc.encode(`${HEAD('ANSEL')}0 @I1@ INDI\n1 NAME Łucja /Gąska/\n0 TRLR\n`)
    expect(detectGedcomEncoding(mislabelled)).toMatchObject({ encoding: 'utf-8', by: 'content' })
    const v7 = enc.encode('0 HEAD\n1 GEDC\n2 VERS 7.0\n0 TRLR\n')
    expect(detectGedcomEncoding(v7).encoding).toBe('utf-8')
    expect(detectGedcomEncoding(enc.encode('0 HEAD\n0 TRLR\n')).encoding).toBe('utf-8')
    expect(decodeGedcom(mislabelled, 'windows-1252').text).toContain('Å')
  })
})

describe('GEDZIP', () => {
  it('reads gedcom.ged and the media of a .gdz', () => {
    const zip = concatChunks(
      writeZip([
        { name: 'gedcom.ged', data: enc.encode('0 HEAD\n0 TRLR\n') },
        { name: 'photos/jan.jpg', data: Uint8Array.from([0xff, 0xd8, 0xff]) }
      ])
    )
    const gdz = readGedzip(zip)!
    expect(new TextDecoder().decode(gdz.gedcom)).toBe('0 HEAD\n0 TRLR\n')
    expect([...gdz.files.keys()]).toEqual(['photos/jan.jpg'])
    expect(readGedzip(enc.encode('0 HEAD'))).toBeNull()
  })
})

describe('GEDCOM performance', () => {
  it('parses 50 000 individuals in under 2 seconds', () => {
    const parts = [HEAD('UTF-8')]
    for (let i = 1; i <= 50_000; i++) {
      parts.push(
        `0 @I${i}@ INDI\n1 NAME Jan${i} /Kowalski/\n1 SEX M\n1 BIRT\n2 DATE 12 MAR 18${i % 100}\n2 PLAC Łódź\n1 FAMC @F${i}@\n1 NOTE A note\n2 CONT on two lines\n`
      )
    }
    parts.push('0 TRLR\n')
    const text = parts.join('')
    const start = performance.now()
    const doc = parseGedcom(text)
    const ms = performance.now() - start
    console.info(
      `Parsed ${doc.records.length - 2} individuals (${(text.length / 1e6).toFixed(1)} MB) in ${ms.toFixed(0)} ms`
    )
    expect(doc.records).toHaveLength(50_002)
    expect(ms).toBeLessThan(2000)
  })
})
