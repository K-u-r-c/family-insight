import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import '@fontsource-variable/inter/index.css'
import '@fontsource-variable/source-serif-4/index.css'
import './custom.css'
import HomeShowcase from './components/HomeShowcase.vue'
import Mermaid from './components/Mermaid.vue'
import Screenshot from './components/Screenshot.vue'
import ShortcutTable from './components/ShortcutTable.vue'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-after': () => h(HomeShowcase) }),
  enhanceApp({ app }) {
    app.component('Mermaid', Mermaid)
    app.component('Screenshot', Screenshot)
    app.component('ShortcutTable', ShortcutTable)
  }
} satisfies Theme
