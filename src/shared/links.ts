/**
 * Web addresses the app links to (menus, About dialog, CSV help). Defined once and opened in the
 * default browser – main uses `shell.openExternal`, the renderer `window.open`, which main hands
 * to the browser for `https://` URLs.
 */
export const PROJECT_URL = 'https://github.com/K-u-r-c/family-insight'
export const ISSUES_URL = `${PROJECT_URL}/issues/new/choose`
export const LICENSE_URL = `${PROJECT_URL}/blob/main/LICENSE`
export const DOCS_URL = 'https://k-u-r-c.github.io/family-insight/'

/** A page of the user guide in the given UI language, e.g. `guideUrl('pl', 'csv-import')`. */
export function guideUrl(language: string, page = ''): string {
  return `${DOCS_URL}${language === 'pl' ? 'pl/' : ''}guide/${page}`
}
