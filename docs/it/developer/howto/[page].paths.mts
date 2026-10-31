import { developerPages } from '../../../.vitepress/developer.mjs'

// The developer docs are English only. These placeholders keep the language switcher
// working and point to the English page.
export default {
  paths() {
    return developerPages()
      .filter((page) => page.slug !== '' && /^howto\/[^/]+$/.test(page.slug))
      .map((page) => ({
        params: { page: page.slug.split('/').pop(), slug: page.slug, title: page.title }
      }))
  }
}
