/**
 * Update policy, shared by main and renderer: which builds can update themselves, version
 * comparison, when to check and which versions to offer.
 */

/** How the app was installed. */
export type UpdateTarget = 'nsis' | 'portable' | 'appimage' | 'deb' | 'mac' | 'dev'

/**
 * `auto`: download and install in place (Windows installer, AppImage). `notify`: point to the
 * release page (portable exe, deb, unsigned macOS builds can't replace themselves). `none`: not
 * a packaged build.
 */
export type UpdateSupport = 'auto' | 'notify' | 'none'

export function updateSupport(target: UpdateTarget): UpdateSupport {
  if (target === 'nsis' || target === 'appimage') return 'auto'
  if (target === 'dev') return 'none'
  return 'notify'
}

export const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000
export const FIRST_CHECK_DELAY_MS = 10_000

interface Semver {
  core: number[]
  pre: (string | number)[]
}

function parse(version: string): Semver | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(
    version.trim()
  )
  if (!m) return null
  return {
    core: [Number(m[1]), Number(m[2]), Number(m[3])],
    pre: m[4] ? m[4].split('.').map((p) => (/^\d+$/.test(p) ? Number(p) : p)) : []
  }
}

/** Semantic version comparison: negative if `a` < `b`, 0 if equal, positive if newer. */
export function compareVersions(a: string, b: string): number {
  const x = parse(a)
  const y = parse(b)
  if (!x || !y) return 0
  for (let i = 0; i < 3; i++) {
    const d = x.core[i]! - y.core[i]!
    if (d) return d
  }
  // A release is newer than its pre-releases (1.1.0 > 1.1.0-beta.2).
  if (!x.pre.length || !y.pre.length) return y.pre.length - x.pre.length
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const p = x.pre[i]
    const q = y.pre[i]
    if (p === undefined) return -1
    if (q === undefined) return 1
    if (p === q) continue
    if (typeof p === 'number' && typeof q === 'number') return p - q
    if (typeof p === 'number') return -1
    if (typeof q === 'number') return 1
    return p < q ? -1 : 1
  }
  return 0
}

export const isValidVersion = (v: unknown): v is string =>
  typeof v === 'string' && parse(v) !== null

/** Whether an automatic check is due (never checked, or the interval has passed). */
export function isCheckDue(
  lastCheck: string | undefined,
  now: Date,
  interval = CHECK_INTERVAL_MS
): boolean {
  if (!lastCheck) return true
  const last = Date.parse(lastCheck)
  return Number.isNaN(last) || now.getTime() - last >= interval || last > now.getTime()
}

/**
 * Whether to tell the user about `latest`: it must be newer than the running version and not
 * the version they chose to skip (manual checks always show it).
 */
export function shouldOffer(
  current: string,
  latest: string,
  skipped: string | undefined,
  manual = false
): boolean {
  if (compareVersions(latest, current) <= 0) return false
  return manual || !skipped || compareVersions(latest, skipped) !== 0
}
