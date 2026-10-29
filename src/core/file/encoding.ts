export type TextEncodingName = 'utf-8' | 'windows-1250'

/**
 * Decodes file bytes: UTF-8 (BOM stripped) when valid, otherwise Windows-1250, the legacy
 * encoding Polish Excel uses for "CSV" exports.
 */
export function decodeText(bytes: Uint8Array): { text: string; encoding: TextEncodingName } {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return { text: text.replace(/^\uFEFF/, ''), encoding: 'utf-8' }
  } catch {
    return { text: new TextDecoder('windows-1250').decode(bytes), encoding: 'windows-1250' }
  }
}
