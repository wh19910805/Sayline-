<script setup lang="ts">
import { House, UserRound } from 'lucide-vue-next'

defineProps<{ value: 'home' | 'me' }>()
const emit = defineEmits<{ navigate: [value: 'home' | 'me'] }>()
</script>

<template>
  <div class="app-bottom-nav">
    <nav class="sl-bottom-nav" aria-label="主导航">
      <button
        class="sl-bottom-nav__item"
        type="button"
        :aria-current="value === 'home' ? 'page' : undefined"
        @click="emit('navigate', 'home')"
      >
        <House :size="20" />
        学习
      </button>
      <button
        class="sl-bottom-nav__item"
        type="button"
        :aria-current="value === 'me' ? 'page' : undefined"
        @click="emit('navigate', 'me')"
      >
        <UserRound :size="20" />
        我的
      </button>
    </nav>
  </div>
</template>
