import { decodeText } from '../../file/encoding'
import { decodeAnsel } from './ansel'

/** Character sets GEDCOM files come in. */
export const GEDCOM_ENCODINGS = [
  'utf-8',
  'utf-16le',
  'utf-16be',
  'ansel',
  'ascii',
  'windows-1252',
  'windows-1250',
  'windows-1251'
] as const
export type GedcomEncoding = (typeof GEDCOM_ENCODINGS)[number]

export interface DetectedEncoding {
  encoding: GedcomEncoding
  /** Value of `HEAD.CHAR`, if the file declares one. */
  declared?: string
  /** How it was decided. */
  by: 'bom' | 'declaration' | 'content' | 'default'
}

const startsWith = (b: Uint8Array, ...prefix: number[]): boolean =>
  prefix.every((v, i) => b[i] === v)

function isValidUtf8(bytes: Uint8Array): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return true
  } catch {
    return false
  }
}

/** Maps a `HEAD.CHAR` value to an encoding (`UNICODE` needs the byte order from elsewhere). */
function fromDeclaration(value: string, utf16: GedcomEncoding): GedcomEncoding | undefined {
  const v = value.trim().toUpperCase().replace(/[\s_]/g, '-')
  if (v === 'UTF-8' || v === 'UTF8') return 'utf-8'
  if (v === 'UNICODE' || v === 'UTF-16') return utf16
  if (v === 'ANSEL') return 'ansel'
  if (v === 'ASCII') return 'ascii'
  if (['WINDOWS-1252', 'CP1252', 'IBMPC', 'IBM-WINDOWS', 'LATIN1', 'ISO-8859-1'].includes(v))
    return 'windows-1252'
  if (['WINDOWS-1250', 'CP1250', 'ISO-8859-2'].includes(v)) return 'windows-1250'
  if (['WINDOWS-1251', 'CP1251'].includes(v)) return 'windows-1251'
  return undefined
}

/**
 * Detects the character set: a byte-order mark wins, then the `1 CHAR` declaration in the
 * header, then the content (valid UTF-8); GEDCOM 7 is always UTF-8.
 */
export function detectGedcomEncoding(bytes: Uint8Array): DetectedEncoding {
  if (startsWith(bytes, 0xef, 0xbb, 0xbf)) return { encoding: 'utf-8', by: 'bom' }
  if (startsWith(bytes, 0xff, 0xfe)) return { encoding: 'utf-16le', by: 'bom' }
  if (startsWith(bytes, 0xfe, 0xff)) return { encoding: 'utf-16be', by: 'bom' }
  // UTF-16 without a BOM: "0 HEAD" with zero bytes in between.
  if (bytes[0] === 0x30 && bytes[1] === 0x00) return { encoding: 'utf-16le', by: 'content' }
  if (bytes[0] === 0x00 && bytes[1] === 0x30) return { encoding: 'utf-16be', by: 'content' }
  // The header is ASCII in every 8-bit encoding.
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 4096))
  const declared = /^\s*1\s+CHAR\s+(\S[^\r\n]*)/m.exec(head)?.[1]?.trim()
  const version = /^\s*2\s+VERS\s+(\S+)/m.exec(head.slice(head.search(/1\s+GEDC/)))?.[1]
  if (version?.startsWith('7')) return { encoding: 'utf-8', declared, by: 'declaration' }
  if (declared) {
    const encoding = fromDeclaration(declared, 'utf-16le')
    // Some programs declare ANSEL or ANSI but write UTF-8 anyway.
    if (encoding && encoding !== 'utf-8' && hasMultibyte(bytes) && isValidUtf8(bytes)) {
      return { encoding: 'utf-8', declared, by: 'content' }
    }
    if (encoding) return { encoding, declared, by: 'declaration' }
    // "ANSI" is the writer's Windows code page: tell 1250, 1251 and 1252 apart by the letters.
    if (declared.trim().toUpperCase() === 'ANSI' && !isValidUtf8(bytes)) {
      return { encoding: decodeText(bytes).encoding as GedcomEncoding, declared, by: 'content' }
    }
    if (declared.trim().toUpperCase() === 'ANSI') {
      return { encoding: 'windows-1252', declared, by: 'declaration' }
    }
  }
  if (isValidUtf8(bytes))
    return { encoding: 'utf-8', declared, by: declared ? 'content' : 'default' }
  return { encoding: 'ansel', declared, by: 'default' }
}

/** Whether the bytes contain UTF-8 multi-byte sequences (and not just ASCII). */
function hasMultibyte(bytes: Uint8Array): boolean {
  for (let i = 0; i < bytes.length - 1; i++) {
    if ((bytes[i]! & 0xe0) === 0xc0 && (bytes[i + 1]! & 0xc0) === 0x80) return true
  }
  return false
}

/** Decodes GEDCOM bytes, detecting the encoding unless one is given. BOMs are dropped. */
export function decodeGedcom(
  bytes: Uint8Array,
  override?: GedcomEncoding
): { text: string; detected: DetectedEncoding } {
  const detected = override
    ? { encoding: override, by: 'declaration' as const }
    : detectGedcomEncoding(bytes)
  let text: string
  switch (detected.encoding) {
    case 'ansel':
      text = decodeAnsel(bytes)
      break
    case 'ascii':
      text = new TextDecoder('windows-1252').decode(bytes)
      break
    default:
      text = new TextDecoder(detected.encoding).decode(bytes)
  }
  return { text: text.replace(/^\uFEFF/, ''), detected }
}
