<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'

import { useBookEnter } from '@/composables/useBookEnter'

const { state } = useBookEnter()

const fallbackStyle = computed(() => ({
  background: `linear-gradient(150deg, ${state.primary}, ${state.secondary})`,
}))

const overlayStyle = computed(() => {
  if (state.settling) {
    return { transform: `translate(${state.settleTx}px, ${state.settleTy}px) scale(${state.settleScale})` }
  }
  if (state.shown) {
    return { transform: 'rotate(0deg) scale(1)' }
  }
  return { transform: 'rotate(90deg) scale(0.55)' }
})
</script>

<template>
  <div class="standalone-app">
    <RouterView v-slot="{ Component, route }">
      <Transition name="route" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
    <div
      v-if="state.active"
      class="book-enter"
      :class="{ 'is-shown': state.shown, 'is-settling': state.settling, 'is-leaving': state.leaving }"
      :style="[fallbackStyle, overlayStyle]"
      aria-hidden="true"
    >
      <img v-if="state.coverUrl" class="book-enter__img" :src="state.coverUrl" alt="" />
    </div>
  </div>
</template>

<style scoped>
.book-enter {
  position: fixed;
  inset: 0;
  z-index: 2000;
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
  transition: transform var(--duration-slow) var(--ease-out), opacity var(--duration-slow) var(--ease-out);
}

.book-enter__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.book-enter.is-shown {
  opacity: 1;
}

.book-enter.is-settling {
  opacity: 0;
  transition: transform var(--duration-base) var(--ease-in-out), opacity var(--duration-base) var(--ease-in-out);
}

.book-enter.is-leaving {
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-in-out);
}

.route-enter-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.route-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-in),
    transform var(--duration-fast) var(--ease-in);
}

.route-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(.995);
}

.route-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(.998);
}
</style>
