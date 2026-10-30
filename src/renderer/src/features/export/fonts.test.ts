import { describe, expect, it } from 'vitest'
import { coversText } from './fonts'

describe('font subsets for exports', () => {
  it('picks the subsets whose characters appear in the text', () => {
    const latin = 'U+0000-00FF,U+0131,U+0152-0153'
    const latinExt = 'U+0100-02BA,U+1E00-1E9F'
    const cyrillic = 'U+0301,U+0400-045F,U+0490-0491'
    expect(coversText(latin, 'Jan Kowalski')).toBe(true)
    expect(coversText(latinExt, 'Jan Kowalski')).toBe(false)
    expect(coversText(latinExt, 'Łódź')).toBe(true)
    expect(coversText(cyrillic, 'Иван Петров')).toBe(true)
    expect(coversText(cyrillic, 'Łódź')).toBe(false)
    expect(coversText('U+4??', 'Ж')).toBe(true)
    expect(coversText('', 'anything')).toBe(true)
  })
})
