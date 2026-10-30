<script setup lang="ts">
/** The app's main window under the home page hero. */
import { computed } from 'vue'
import { useData } from 'vitepress'
import Screenshot from './Screenshot.vue'

const { lang } = useData()
const alt = computed(() =>
  lang.value.startsWith('pl')
    ? 'Okno Family Insight z drzewem czterech pokoleń i szczegółami wybranej osoby'
    : 'Family Insight showing a four-generation family tree and the details of one person'
)
</script>

<template>
  <div class="fi-showcase">
    <Screenshot name="workspace" :alt="alt" />
  </div>
</template>

<style scoped>
.fi-showcase {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px 16px;
}

@media (min-width: 640px) {
  .fi-showcase {
    padding: 0 48px 24px;
  }
}

@media (min-width: 960px) {
  .fi-showcase {
    padding: 0 64px 32px;
  }
}

.fi-showcase :deep(.fi-shot__open) {
  margin: 0 auto;
  border-radius: 14px;
  box-shadow: var(--fi-shadow);
}
</style>
