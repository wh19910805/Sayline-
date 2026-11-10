<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'

import { useBookEnter } from '@/composables/useBookEnter'

const { state } = useBookEnter()

const enterStyle = computed(() => ({
  background: state.coverUrl
    ? `url("${state.coverUrl}") center / cover no-repeat`
    : `linear-gradient(150deg, ${state.primary}, ${state.secondary})`,
}))
</script>

<template>
  <div class="standalone-app">
    <RouterView />
    <div
      v-if="state.active"
      class="book-enter"
      :class="{ 'is-shown': state.shown, 'is-leaving': state.leaving }"
      :style="enterStyle"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.book-enter {
  position: fixed;
  inset: 0;
  z-index: 2000;
  transform: scale(0.55);
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
  transition: transform var(--duration-slow) var(--ease-out), opacity var(--duration-slow) var(--ease-out);
}

.book-enter.is-shown {
  transform: scale(1);
  opacity: 1;
}

.book-enter.is-leaving {
  transform: scale(1.02);
  opacity: 0;
  transition: transform var(--duration-fast) var(--ease-in-out), opacity var(--duration-fast) var(--ease-in-out);
}
</style>
