import type { DefaultTheme } from 'vitepress'

export const developerSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting started',
    items: [
      { text: 'Overview', link: '/developer/' },
      { text: 'Development setup', link: '/developer/setup' },
      { text: 'Scripts', link: '/developer/scripts' },
      { text: 'Workflow and conventions', link: '/developer/workflow' },
      { text: 'Testing', link: '/developer/testing' },
      { text: 'Updating screenshots', link: '/developer/screenshots' },
      { text: 'CI and releases', link: '/developer/ci-releases' }
    ]
  },
  {
    text: 'Architecture',
    items: [
      { text: 'Overview', link: '/developer/architecture' },
      { text: 'Security model', link: '/developer/security' },
      { text: 'Domain model', link: '/developer/domain-model' },
      { text: 'State, undo and saving', link: '/developer/state' },
      { text: 'Tree layout engine', link: '/developer/layout' },
      { text: 'Rendering the tree', link: '/developer/rendering' },
      { text: 'Internationalisation', link: '/developer/i18n' },
      { text: 'Glossary for translators', link: '/developer/i18n-glossary' },
      { text: 'Packaging', link: '/developer/packaging' }
    ]
  },
  {
    text: 'How-to guides',
    items: [
      { text: 'Add or change UI text', link: '/developer/howto/ui-text' },
      { text: 'Add a setting', link: '/developer/howto/setting' },
      { text: 'Add an IPC channel', link: '/developer/howto/ipc' },
      { text: 'Add a menu item or shortcut', link: '/developer/howto/menu' },
      { text: 'Add a field to a person', link: '/developer/howto/person-field' },
      { text: 'Add a file format', link: '/developer/howto/format' },
      { text: 'Add a view mode', link: '/developer/howto/view-mode' },
      { text: 'Add a language', link: '/developer/howto/language' }
    ]
  },
  {
    text: 'Reference',
    items: [
      { text: 'CSV format', link: '/developer/reference/csv-format' },
      { text: 'GEDCOM', link: '/developer/reference/gedcom' },
      { text: '.finsight file format', link: '/developer/reference/file-format' },
      { text: 'Preload API', link: '/developer/reference/preload-api' },
      { text: 'Decision log', link: '/developer/reference/decisions' }
    ]
  }
]

/** Developer pages as `{ slug, title }`, e.g. `{ slug: 'howto/ipc', title: 'Add an IPC channel' }`. */
export function developerPages(): { slug: string; title: string }[] {
  return developerSidebar.flatMap((group) =>
    (group.items ?? []).map((item) => ({
      slug: (item.link ?? '').replace(/^\/developer\/?/, ''),
      title: item.text ?? ''
    }))
  )
}
