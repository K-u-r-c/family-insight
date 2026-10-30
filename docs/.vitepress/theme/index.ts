import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import '@fontsource-variable/inter/index.css'
import '@fontsource-variable/source-serif-4/index.css'
import './custom.css'
import HomeShowcase from './components/HomeShowcase.vue'
import Screenshot from './components/Screenshot.vue'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-after': () => h(HomeShowcase) }),
  enhanceApp({ app }) {
    app.component('Screenshot', Screenshot)
  }
} satisfies Theme
