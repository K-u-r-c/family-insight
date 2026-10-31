<script setup lang="ts">
/**
 * Keyboard shortcuts rendered from the same definitions as the app's cheat sheet
 * (src/shared/shortcuts.ts), so the guide can't drift from the program.
 */
import { computed } from 'vue'
import { useData } from 'vitepress'
import { formatShortcut, SHORTCUT_GROUPS } from '../../../../src/shared/shortcuts'
import { LOCALES } from '../../../../src/shared/i18n'
import { siteLanguage, siteText } from '../../siteLocales'

const { lang } = useData()
const code = computed(() => siteLanguage(lang.value))
// The app's own texts in the page's language (every site language is an app language).
const messages = computed(
  () =>
    (LOCALES as Record<string, { translation: Record<string, unknown> }>)[code.value]
      ?.translation ?? LOCALES.en.translation
)
const t = (key: string): string =>
  String(
    key
      .split('.')
      .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], messages.value) ??
      key
  )
const headers = computed(() => ({
  action: siteText(code.value, 'theme.action'),
  other: 'Windows / Linux',
  mac: 'macOS'
}))
</script>

<template>
  <div v-for="group in SHORTCUT_GROUPS" :key="group.titleKey" class="fi-shortcuts">
    <h3 :id="group.titleKey.replace('.', '-')" tabindex="-1">{{ t(group.titleKey) }}</h3>
    <table>
      <thead>
        <tr>
          <th>{{ headers.action }}</th>
          <th>{{ headers.other }}</th>
          <th>{{ headers.mac }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in group.items" :key="item.labelKey">
          <td>{{ t(item.labelKey) }}</td>
          <td v-for="mac in [false, true]" :key="String(mac)">
            <template v-for="(key, i) in item.keys" :key="key">
              <span v-if="i > 0"> / </span><kbd>{{ formatShortcut(key, mac) }}</kbd>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.fi-shortcuts table {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.fi-shortcuts th:first-child {
  width: 46%;
}
</style>
