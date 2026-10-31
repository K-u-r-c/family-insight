import { readFileSync } from 'node:fs'
import { defineConfig, type DefaultTheme, type MarkdownRenderer } from 'vitepress'
import { developerSidebar } from './developer.mjs'
import { SITE_LANGUAGES, siteText } from './siteLocales'

const REPO = 'https://github.com/K-u-r-c/family-insight'
const DOWNLOAD = `${REPO}/releases/latest`
export const SITE_URL = 'https://k-u-r-c.github.io/family-insight/'

const SCREENSHOTS = new Set(
  Object.keys(JSON.parse(readFileSync(new URL('./screenshots.json', import.meta.url), 'utf8')))
)

/** Fails the build when a page uses a <Screenshot> that `npm run docs:screenshots` doesn't make. */
/** Renders ```mermaid blocks with the <Mermaid> component (drawn in the browser). */
function mermaidFences(md: MarkdownRenderer): void {
  const fence = md.renderer.rules.fence!
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    if (token.info.trim() === 'mermaid') {
      return `<Mermaid code="${encodeURIComponent(token.content)}" />`
    }
    return fence(tokens, idx, options, env, self)
  }
}

function checkScreenshots(md: MarkdownRenderer): void {
  md.core.ruler.push('fi-screenshots', (state) => {
    const texts = state.tokens.flatMap((t) => [
      t.content,
      ...(t.children ?? []).map((c) => c.content)
    ])
    for (const text of texts) {
      for (const [, name] of text.matchAll(/<Screenshot\s[^>]*name="([^"]+)"/g)) {
        if (name && !SCREENSHOTS.has(name)) {
          throw new Error(`Unknown screenshot "${name}" in ${state.env.relativePath ?? 'a page'}`)
        }
      }
    }
  })
}

/** User guide sidebar. Page slugs are the same in every language so the switcher keeps the page. */
function guideSidebar(code: string, prefix: string): DefaultTheme.SidebarItem[] {
  const p = `${prefix}/guide/`
  const t = (english: string): string => siteText(code, `sidebar.${english}`)
  const group = (title: string, items: [string, string][]): DefaultTheme.SidebarItem => ({
    text: t(title),
    items: items.map(([text, page]) => ({
      text: text === 'GEDCOM' ? text : t(text),
      link: `${p}${page}`
    }))
  })
  return [
    group('Getting started', [
      ['Introduction', ''],
      ['Installation', 'install'],
      ['Your first family tree', 'first-tree'],
      ['The main window', 'main-window'],
      ['The sample family', 'sample-family']
    ]),
    group('People and relationships', [
      ['Adding people', 'people'],
      ['Editing a person', 'editing'],
      ['Life events', 'events'],
      ['Relationships', 'relationships'],
      ['Sources', 'sources'],
      ['Photos and documents', 'media'],
      ['Places', 'places'],
      ['Map', 'map'],
      ['Deleting and undoing', 'undo']
    ]),
    group('Exploring the tree', [
      ['Navigating the tree', 'navigation'],
      ['View modes', 'view-modes'],
      ['Finding people', 'search'],
      ['Details and timeline', 'timeline'],
      ['Statistics', 'statistics']
    ]),
    group('Files, CSV and printing', [
      ['Saving and opening', 'files'],
      ['Import from CSV', 'csv-import'],
      ['Export to CSV', 'csv-export'],
      ['GEDCOM', 'gedcom'],
      ['Images, PDF and printing', 'export-print']
    ]),
    group('Help', [
      ['Settings', 'settings'],
      ['Updates', 'updates'],
      ['Keyboard shortcuts', 'shortcuts'],
      ['FAQ', 'faq'],
      ['Troubleshooting', 'troubleshooting'],
      ['Glossary', 'glossary']
    ])
  ]
}

export default defineConfig({
  title: 'Family Insight',
  base: '/family-insight/',
  cleanUrls: true,
  lastUpdated: true,
  // The legacy files only redirect users of v1.0.0, whose Help menu links to them on GitHub.
  srcExclude: ['user-guide.*.md', 'CSV_FORMAT.md', '.screenshots/**'],
  sitemap: { hostname: SITE_URL },
  // Open Graph / social preview for every page.
  transformHead({ pageData, siteData }) {
    const path = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
    const language =
      SITE_LANGUAGES.find(
        (l) => l.prefix && pageData.relativePath.startsWith(`${l.prefix.slice(1)}/`)
      ) ?? SITE_LANGUAGES[0]!
    const locale = language.prefix ? language.code : 'root'
    const title = pageData.title ? `${pageData.title} | Family Insight` : 'Family Insight'
    const description =
      (pageData.frontmatter.description as string | undefined) ??
      siteData.locales[locale]?.description ??
      siteData.description
    return [
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: 'Family Insight' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: `${SITE_URL}${path}` }],
      ['meta', { property: 'og:image', content: `${SITE_URL}og-image.png` }],
      ['meta', { property: 'og:locale', content: language.og }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }]
    ]
  },
  markdown: {
    // The "default" GitHub themes meet WCAG AA contrast on the site's code backgrounds.
    theme: { light: 'github-light-default', dark: 'github-dark-default' },
    config: (md) => {
      checkScreenshots(md)
      mermaidFences(md)
    }
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/family-insight/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#2f7350' }]
  ],
  themeConfig: {
    logo: { src: '/logo.svg', alt: '' },
    socialLinks: [{ icon: 'github', link: REPO }],
    search: {
      provider: 'local',
      options: {
        locales: Object.fromEntries(
          SITE_LANGUAGES.filter((l) => l.prefix).map((l) => {
            const t = (key: string): string => siteText(l.code, `search.${key}`)
            return [
              l.code,
              {
                translations: {
                  button: { buttonText: t('buttonText'), buttonAriaLabel: t('buttonText') },
                  modal: {
                    displayDetails: t('displayDetails'),
                    resetButtonTitle: t('resetButtonTitle'),
                    backButtonTitle: t('backButtonTitle'),
                    noResultsText: t('noResultsText'),
                    footer: {
                      selectText: t('selectText'),
                      selectKeyAriaLabel: 'Enter',
                      navigateText: t('navigateText'),
                      navigateUpKeyAriaLabel: t('navigateUpKeyAriaLabel'),
                      navigateDownKeyAriaLabel: t('navigateDownKeyAriaLabel'),
                      closeText: t('closeText'),
                      closeKeyAriaLabel: 'Esc'
                    }
                  }
                }
              }
            ]
          })
        )
      }
    }
  },
  locales: Object.fromEntries(
    SITE_LANGUAGES.map((l) => {
      const t = (key: string): string => siteText(l.code, key)
      const config = {
        label: l.label,
        lang: l.code,
        link: `${l.prefix}/`,
        description: t('description'),
        themeConfig: {
          nav: [
            {
              text: t('nav.guide'),
              link: `${l.prefix}/guide/`,
              activeMatch: `^${l.prefix}/guide/`
            },
            {
              text: t('nav.developers'),
              link: `${l.prefix}/developer/`,
              activeMatch: `^${l.prefix}/developer/`
            },
            { text: t('nav.download'), link: DOWNLOAD }
          ],
          sidebar: {
            [`${l.prefix}/guide/`]: guideSidebar(l.code, l.prefix),
            [`${l.prefix}/developer/`]: developerSidebar
          },
          editLink: { pattern: `${REPO}/edit/main/docs/:path`, text: t('editLink') },
          footer: { message: t('footer.message'), copyright: t('footer.copyright') },
          outline: { label: t('outline') },
          docFooter: { prev: t('docFooter.prev'), next: t('docFooter.next') },
          lastUpdated: { text: t('lastUpdated') },
          darkModeSwitchLabel: t('darkModeSwitchLabel'),
          lightModeSwitchTitle: t('lightModeSwitchTitle'),
          darkModeSwitchTitle: t('darkModeSwitchTitle'),
          sidebarMenuLabel: t('sidebarMenuLabel'),
          returnToTopLabel: t('returnToTopLabel'),
          langMenuLabel: t('langMenuLabel'),
          skipToContentLabel: t('skipToContentLabel'),
          notFound: {
            title: t('notFound.title'),
            quote: t('notFound.quote'),
            linkLabel: t('notFound.linkLabel'),
            linkText: t('notFound.linkText')
          }
        }
      }
      return [l.prefix ? l.code : 'root', config]
    })
  )
})
