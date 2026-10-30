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

  it('accepts GEDCOM files (they open the import)', () => {
    expect(pathFromArgv(['app', '/home/a/rodzina.GED'])).toBe('/home/a/rodzina.GED')
    expect(pathFromArgv(['app', '/home/a/rodzina.gdz'])).toBe('/home/a/rodzina.gdz')
  })

  it('ignores flags, other files and the executable itself', () => {
    expect(pathFromArgv(['tree.finsight'])).toBeNull()
    expect(pathFromArgv(['app', '--inspect', 'notes.txt'])).toBeNull()
  })
})
