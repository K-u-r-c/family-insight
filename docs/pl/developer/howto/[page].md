---
search: false
prev: false
next: false
editLink: false
lastUpdated: false
---

# {{ $params.title }}

::: info Ta strona jest po angielsku
Dokumentacja dla programistów jest dostępna tylko po angielsku, tak jak kod źródłowy i opisy
zmian w repozytorium.
:::

<a class="fi-button" :href="withBase('/developer/' + $params.slug)">Otwórz stronę „{{ $params.title }}” (EN) →</a>

<script setup>
import { withBase } from 'vitepress'
</script>
