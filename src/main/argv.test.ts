import { describe, expect, it } from 'vitest'
import { pathFromArgv } from './argv'

describe('pathFromArgv', () => {
  it('finds a tree file among arguments', () => {
    expect(
      pathFromArgv(['/opt/app/family-insight', '--no-sandbox', '/home/a/Rodzina.finsight'])
    ).toBe('/home/a/Rodzina.finsight')
    expect(pathFromArgv(['app', 'C:\\Users\\a\\Drzewo.FINSIGHT'])).toBe(
      'C:\\Users\\a\\Drzewo.FINSIGHT'
    )
  })

  it('accepts file:// URLs from desktop launchers', () => {
    if (process.platform === 'win32') {
      expect(pathFromArgv(['app', 'file:///C:/Users/a/Moja%20rodzina.finsight'])).toBe(
        'C:\\Users\\a\\Moja rodzina.finsight'
      )
    } else {
      expect(pathFromArgv(['app', 'file:///home/a/Moja%20rodzina.finsight'])).toBe(
        '/home/a/Moja rodzina.finsight'
      )
    }
  })

  it('ignores flags, other files and the executable itself', () => {
    expect(pathFromArgv(['tree.finsight'])).toBeNull()
    expect(pathFromArgv(['app', '--inspect', 'notes.txt'])).toBeNull()
  })
})
