import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import '@fontsource-variable/inter/index.css'
import '@fontsource-variable/source-serif-4/index.css'
import './custom.css'

export default {
  extends: DefaultTheme
} satisfies Theme
