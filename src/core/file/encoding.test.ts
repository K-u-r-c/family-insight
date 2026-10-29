import { describe, expect, it } from 'vitest'
import { decodeText } from './encoding'

describe('decodeText', () => {
  it('decodes UTF-8 and strips the BOM', () => {
    const bytes = new TextEncoder().encode('\uFEFFZażółć gęślą jaźń')
    expect(decodeText(bytes)).toEqual({ text: 'Zażółć gęślą jaźń', encoding: 'utf-8' })
  })

  it('falls back to Windows-1250 for legacy Polish files', () => {
    // "Łódź;Żółć" in Windows-1250
    const bytes = new Uint8Array([0xa3, 0xf3, 0x64, 0x9f, 0x3b, 0xaf, 0xf3, 0xb3, 0xe6])
    expect(decodeText(bytes)).toEqual({ text: 'Łódź;Żółć', encoding: 'windows-1250' })
  })
})
