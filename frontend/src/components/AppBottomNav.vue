<script setup lang="ts">
import SlIcon from '@/components/ui/SlIcon.vue'

import ContinueBar from '@/components/ContinueBar.vue'

defineProps<{ value?: 'home' | 'me' }>()
const emit = defineEmits<{ navigate: [value: 'home' | 'me'] }>()
</script>

<template>
  <div class="app-bottom-nav">
    <nav class="sl-bottom-nav sl-bottom-nav--dock" aria-label="主导航">
      <button
        class="sl-bottom-nav__item"
        type="button"
        :aria-current="value === 'home' ? 'page' : undefined"
        @click="emit('navigate', 'home')"
      >
        <SlIcon name="book-2" :size="20" :weight="value === 'home' ? 'fill' : 'line'" />
        学习
      </button>
      <ContinueBar />
      <button
        class="sl-bottom-nav__item"
        type="button"
        :aria-current="value === 'me' ? 'page' : undefined"
        @click="emit('navigate', 'me')"
      >
        <SlIcon name="user" :size="20" :weight="value === 'me' ? 'fill' : 'line'" />
        我的
      </button>
    </nav>
  </div>
</template>
