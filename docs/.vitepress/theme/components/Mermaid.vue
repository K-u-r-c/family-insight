<script setup lang="ts">
/**
 * Renders a ```mermaid code block in the browser, in the site's colours, and again when the
 * theme changes. Mermaid is loaded only on pages that have diagrams.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{ code: string }>()
const { isDark, lang } = useData()
const svg = ref('')
/** Width of the diagram at 100 %, for the enlarged view. */
const naturalWidth = ref(0)
const zoom = ref<HTMLDialogElement>()
const labels = computed(() =>
  lang.value.startsWith('pl')
    ? { open: 'Powiększ diagram', close: 'Zamknij' }
    : { open: 'Enlarge the diagram', close: 'Close' }
)
const source = decodeURIComponent(props.code)

const LIGHT = {
  background: '#fdfcfa',
  primaryColor: '#e2efe7',
  primaryBorderColor: '#2f7350',
  primaryTextColor: '#23201c',
  secondaryColor: '#e3ebf6',
  secondaryBorderColor: '#3f6fae',
  tertiaryColor: '#f6f4f0',
  tertiaryBorderColor: '#cbc3b6',
  lineColor: '#7d766c',
  textColor: '#23201c',
  noteBkgColor: '#fbf0d9',
  noteBorderColor: '#94650d',
  noteTextColor: '#23201c',
  actorTextColor: '#23201c',
  signalTextColor: '#23201c'
}
const DARK = {
  background: '#161513',
  primaryColor: '#233729',
  primaryBorderColor: '#6cb68a',
  primaryTextColor: '#f2eee8',
  secondaryColor: '#232f40',
  secondaryBorderColor: '#86aae2',
  tertiaryColor: '#22201d',
  tertiaryBorderColor: '#4d4842',
  lineColor: '#a59d92',
  textColor: '#f2eee8',
  noteBkgColor: '#3a2f17',
  noteBorderColor: '#e2b553',
  noteTextColor: '#f2eee8',
  actorTextColor: '#f2eee8',
  signalTextColor: '#f2eee8'
}

let renders = 0
async function render(): Promise<void> {
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: "'Inter Variable', system-ui, sans-serif",
    themeVariables: { ...(isDark.value ? DARK : LIGHT), fontSize: '15px' },
    // Plain SVG text is measured reliably; diagrams scale to the column and can be enlarged.
    flowchart: { htmlLabels: false },
    htmlLabels: false
  })
  const id = `fi-mermaid-${Math.random().toString(36).slice(2)}-${renders++}`
  svg.value = (await mermaid.render(id, source)).svg
  naturalWidth.value = Number(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+)/.exec(svg.value)?.[1] ?? 0)
}

onMounted(render)
watch(isDark, render)
</script>

<template>
  <div class="fi-mermaid">
    <button
      v-if="svg"
      type="button"
      class="fi-mermaid__open"
      :aria-label="labels.open"
      @click="zoom?.showModal()"
      v-html="svg"
    />
    <pre v-else class="fi-mermaid__source">{{ source }}</pre>
    <dialog ref="zoom" class="fi-mermaid__zoom" @click="zoom?.close()">
      <div class="fi-mermaid__full" :style="{ width: `${naturalWidth}px` }" v-html="svg" />
      <button type="button" class="fi-mermaid__close" @click.stop="zoom?.close()">
        {{ labels.close }} <kbd>Esc</kbd>
      </button>
    </dialog>
  </div>
</template>

<style scoped>
.fi-mermaid {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-alt);
  overflow-x: auto;
  text-align: center;
}

.fi-mermaid__open {
  display: block;
  width: 100%;
  padding: 0;
  background: none;
  cursor: zoom-in;
}

.fi-mermaid__open:focus-visible {
  outline: 3px solid var(--vp-c-brand-1);
  outline-offset: 4px;
}

.fi-mermaid__open :deep(svg) {
  max-width: 100%;
  height: auto;
}

.fi-mermaid__zoom {
  max-width: 96vw;
  max-height: 96vh;
  padding: 24px;
  border: 0;
  border-radius: 12px;
  background: var(--vp-c-bg-alt);
  box-shadow: var(--fi-shadow);
  overflow: auto;
  cursor: zoom-out;
}

.fi-mermaid__zoom::backdrop {
  background: rgb(0 0 0 / 70%);
}

.fi-mermaid__full :deep(svg) {
  width: 100% !important;
  max-width: none !important;
  height: auto;
}

.fi-mermaid__close {
  position: fixed;
  top: 16px;
  right: 16px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 600;
  box-shadow: var(--fi-shadow);
}

.fi-mermaid__source {
  margin: 0;
  color: var(--vp-c-text-3);
  font-size: 13px;
  text-align: left;
}
</style>
