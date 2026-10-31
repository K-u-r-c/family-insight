---
search: false
prev: false
next: false
editLink: false
lastUpdated: false
---

# {{ $params.title }}

::: info Эта страница на английском
Документация для разработчиков доступна только на английском языке, как и исходный код и описания изменений в репозитории.
:::

<a class="fi-button" :href="withBase('/developer/' + $params.slug)">Открыть «{{ $params.title }}» (EN) →</a>

<script setup>
import { withBase } from 'vitepress'
</script>
