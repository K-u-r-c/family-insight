export const TEXT_ENCODINGS = ['utf-8', 'windows-1250', 'windows-1251', 'windows-1252'] as const
export type TextEncodingName = (typeof TEXT_ENCODINGS)[number]

/** Languages whose alphabets contain each accented letter (lower case). */
const LANGUAGES_OF: Record<string, string> = (() => {
  const groups: Record<string, string> = {
    pl: 'ąćęłńóśźż',
    cs: 'áčďéěíňóřšťúůýž',
    sk: 'áäčďéíĺľňóôŕšťúýž',
    hu: 'áéíóöőúüű',
    hr: 'čćđšž',
    ro: 'ăâîșțşţ',
    de: 'äöüß',
    fr: 'àâçéèêëîïôùûüÿœæ',
    es: 'áéíñóúü',
    it: 'àèéìíîòóùú',
    pt: 'áâãàçéêíóôõú',
    nl: 'éëïöü',
    nordic: 'åæøäöé',
    tr: 'çğıöşü',
    cyr: 'абвгдеёжзийклмнопрстуфхцчшщъыьэюяєіїўґ'
  }
  const out: Record<string, string> = {}
  for (const [lang, letters] of Object.entries(groups)) {
    for (const c of letters) out[c] = (out[c] ?? '') + ` ${lang}`
  }
  return out
})()

const LATIN_LANGUAGES = 'pl cs sk hu hr ro de fr es it pt nl nordic tr'.split(' ')

/**
 * How plausible decoded text is: the accented letters one language can explain (a file is
 * usually in one language), minus words no language explains – a wrong code page mixes
 * alphabets (Latin with Cyrillic, Czech č with French è) or puts symbols inside words.
 */
function plausibility(text: string): number {
  const perLanguage = new Map<string, number>()
  let broken = 0
  for (const word of text
    .toLowerCase()
    .match(/[\p{L}\p{M}\u0080-\u00bf\u2010-\u203a\u20ac\u2122]+/gu) ?? []) {
    let possible: string[] | null = null
    let accented = 0
    let bad = false
    for (const c of word) {
      let langs: string[]
      if (/[a-z]/.test(c)) langs = LATIN_LANGUAGES
      else if (LANGUAGES_OF[c]) {
        langs = LANGUAGES_OF[c]!.trim().split(' ')
        accented++
      } else {
        bad = true
        break
      }
      possible = possible ? possible.filter((l) => langs.includes(l)) : langs
    }
    if (bad || !possible?.length) {
      broken++
      continue
    }
    if (!accented) continue
    for (const lang of possible) perLanguage.set(lang, (perLanguage.get(lang) ?? 0) + accented)
  }
  return Math.max(0, ...perLanguage.values()) - 3 * broken
}

/** Code page Excel uses for "CSV" files in each UI language. */
const PREFERRED: Record<string, Exclude<TextEncodingName, 'utf-8'>> = {
  pl: 'windows-1250',
  ru: 'windows-1251'
}

/**
 * Decodes file bytes: UTF-8 (BOM stripped) when valid; otherwise the legacy Windows code page
 * whose letters fit the text best – 1250 (Central European), 1251 (Cyrillic) or 1252 (Western)
 * – with the UI language deciding close calls. `encoding` forces a code page.
 */
export function decodeText(
  bytes: Uint8Array,
  options: { language?: string; encoding?: TextEncodingName } = {}
): { text: string; encoding: TextEncodingName } {
  const decode = (enc: TextEncodingName): string =>
    new TextDecoder(enc, { fatal: false }).decode(bytes).replace(/^\uFEFF/, '')
  if (options.encoding) return { text: decode(options.encoding), encoding: options.encoding }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return { text: text.replace(/^\uFEFF/, ''), encoding: 'utf-8' }
  } catch {
    // not UTF-8
  }
  const preferred = PREFERRED[options.language ?? ''] ?? 'windows-1252'
  const candidates = (['windows-1250', 'windows-1251', 'windows-1252'] as const).map((enc) => {
    const text = decode(enc)
    return { enc, text, score: plausibility(text) + (enc === preferred ? 0.5 : 0) }
  })
  candidates.sort((a, b) => b.score - a.score)
  return { text: candidates[0]!.text, encoding: candidates[0]!.enc }
}
