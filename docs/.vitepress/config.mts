import { readFileSync } from 'node:fs'
import { defineConfig, type DefaultTheme, type MarkdownRenderer } from 'vitepress'
import { developerSidebar } from './developer.mjs'

const REPO = 'https://github.com/K-u-r-c/family-insight'
const DOWNLOAD = `${REPO}/releases/latest`
export const SITE_URL = 'https://k-u-r-c.github.io/family-insight/'

type Locale = 'en' | 'pl'

const SCREENSHOTS = new Set(
  Object.keys(JSON.parse(readFileSync(new URL('./screenshots.json', import.meta.url), 'utf8')))
)

/** Fails the build when a page uses a <Screenshot> that `npm run docs:screenshots` doesn't make. */
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

/** User guide sidebar. Page slugs are the same in both languages so the switcher keeps the page. */
function guideSidebar(locale: Locale): DefaultTheme.SidebarItem[] {
  const p = locale === 'pl' ? '/pl/guide/' : '/guide/'
  const pl = locale === 'pl'
  return [
    {
      text: pl ? 'Pierwsze kroki' : 'Getting started',
      items: [
        { text: pl ? 'Wprowadzenie' : 'Introduction', link: p },
        { text: pl ? 'Instalacja' : 'Installation', link: `${p}install` },
        { text: pl ? 'Twoje pierwsze drzewo' : 'Your first family tree', link: `${p}first-tree` },
        { text: pl ? 'Okno programu' : 'The main window', link: `${p}main-window` },
        { text: pl ? 'Przykładowa rodzina' : 'The sample family', link: `${p}sample-family` }
      ]
    },
    {
      text: pl ? 'Osoby i relacje' : 'People and relationships',
      items: [
        { text: pl ? 'Dodawanie osób' : 'Adding people', link: `${p}people` },
        { text: pl ? 'Edycja osoby' : 'Editing a person', link: `${p}editing` },
        { text: pl ? 'Relacje' : 'Relationships', link: `${p}relationships` },
        { text: pl ? 'Usuwanie i cofanie' : 'Deleting and undoing', link: `${p}undo` }
      ]
    },
    {
      text: pl ? 'Przeglądanie drzewa' : 'Exploring the tree',
      items: [
        { text: pl ? 'Poruszanie się po drzewie' : 'Navigating the tree', link: `${p}navigation` },
        { text: pl ? 'Tryby widoku' : 'View modes', link: `${p}view-modes` },
        { text: pl ? 'Wyszukiwanie' : 'Finding people', link: `${p}search` },
        { text: pl ? 'Szczegóły i oś życia' : 'Details and timeline', link: `${p}timeline` },
        { text: pl ? 'Statystyki' : 'Statistics', link: `${p}statistics` }
      ]
    },
    {
      text: pl ? 'Pliki, CSV i druk' : 'Files, CSV and printing',
      items: [
        { text: pl ? 'Zapisywanie i otwieranie' : 'Saving and opening', link: `${p}files` },
        { text: pl ? 'Import z CSV' : 'Import from CSV', link: `${p}csv-import` },
        { text: pl ? 'Eksport do CSV' : 'Export to CSV', link: `${p}csv-export` },
        { text: pl ? 'Obrazy, PDF i druk' : 'Images, PDF and printing', link: `${p}export-print` }
      ]
    },
    {
      text: pl ? 'Pomoc' : 'Help',
      items: [
        { text: pl ? 'Ustawienia' : 'Settings', link: `${p}settings` },
        { text: pl ? 'Skróty klawiszowe' : 'Keyboard shortcuts', link: `${p}shortcuts` },
        { text: pl ? 'Najczęstsze pytania' : 'FAQ', link: `${p}faq` },
        { text: pl ? 'Rozwiązywanie problemów' : 'Troubleshooting', link: `${p}troubleshooting` },
        { text: pl ? 'Słowniczek' : 'Glossary', link: `${p}glossary` }
      ]
    }
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
  markdown: { config: checkScreenshots },
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
        locales: {
          pl: {
            translations: {
              button: { buttonText: 'Szukaj', buttonAriaLabel: 'Szukaj' },
              modal: {
                displayDetails: 'Pokaż szczegóły',
                resetButtonTitle: 'Wyczyść',
                backButtonTitle: 'Zamknij wyszukiwanie',
                noResultsText: 'Brak wyników dla',
                footer: {
                  selectText: 'wybierz',
                  selectKeyAriaLabel: 'Enter',
                  navigateText: 'przejdź',
                  navigateUpKeyAriaLabel: 'strzałka w górę',
                  navigateDownKeyAriaLabel: 'strzałka w dół',
                  closeText: 'zamknij',
                  closeKeyAriaLabel: 'Esc'
                }
              }
            }
          }
        }
      }
    }
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      description: 'A beautiful, simple family tree editor for Windows, macOS and Linux.',
      themeConfig: {
        nav: [
          { text: 'User guide', link: '/guide/', activeMatch: '^/guide/' },
          { text: 'Developers', link: '/developer/', activeMatch: '^/developer/' },
          { text: 'Download', link: DOWNLOAD }
        ],
        sidebar: { '/guide/': guideSidebar('en'), '/developer/': developerSidebar },
        editLink: { pattern: `${REPO}/edit/main/docs/:path`, text: 'Edit this page on GitHub' },
        footer: {
          message: 'Released under the MIT licence.',
          copyright: 'Family Insight – your family history stays on your computer.'
        }
      }
    },
    pl: {
      label: 'Polski',
      lang: 'pl',
      link: '/pl/',
      description:
        'Piękny i prosty program do tworzenia drzewa genealogicznego na Windows, macOS i Linux.',
      themeConfig: {
        nav: [
          { text: 'Poradnik', link: '/pl/guide/', activeMatch: '^/pl/guide/' },
          { text: 'Dla programistów', link: '/pl/developer/', activeMatch: '^/pl/developer/' },
          { text: 'Pobierz', link: DOWNLOAD }
        ],
        sidebar: { '/pl/guide/': guideSidebar('pl'), '/pl/developer/': developerSidebar },
        editLink: { pattern: `${REPO}/edit/main/docs/:path`, text: 'Edytuj tę stronę na GitHubie' },
        footer: {
          message: 'Udostępniane na licencji MIT.',
          copyright: 'Family Insight – historia Twojej rodziny zostaje na Twoim komputerze.'
        },
        outline: { label: 'Na tej stronie' },
        docFooter: { prev: 'Poprzednia', next: 'Następna' },
        lastUpdated: { text: 'Ostatnia zmiana' },
        darkModeSwitchLabel: 'Motyw',
        lightModeSwitchTitle: 'Włącz jasny motyw',
        darkModeSwitchTitle: 'Włącz ciemny motyw',
        sidebarMenuLabel: 'Menu',
        returnToTopLabel: 'Wróć na górę',
        langMenuLabel: 'Zmień język',
        skipToContentLabel: 'Przejdź do treści',
        notFound: {
          title: 'NIE ZNALEZIONO STRONY',
          quote: 'Tej gałęzi nie ma w naszym drzewie.',
          linkLabel: 'Przejdź do strony głównej',
          linkText: 'Strona główna'
        }
      }
    }
  }
})
