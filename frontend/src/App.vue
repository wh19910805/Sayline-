<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'

import GlobalAudioPlayer from '@/components/GlobalAudioPlayer.vue'
import { useBookEnter } from '@/composables/useBookEnter'
import { useOfflineSync } from '@/composables/useOfflineSync'

const { state } = useBookEnter()
useOfflineSync()

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

function markLeavingLayer(element: Element) {
  const layer = element as HTMLElement
  layer.inert = true
  layer.setAttribute('aria-hidden', 'true')
}

function clearLeavingLayer(element: Element) {
  const layer = element as HTMLElement
  layer.inert = false
  layer.removeAttribute('aria-hidden')
}
</script>

<template>
  <div class="standalone-app">
    <GlobalAudioPlayer />
    <RouterView v-slot="{ Component, route }">
      <Transition
        name="route"
        @before-leave="markLeavingLayer"
        @after-leave="clearLeavingLayer"
      >
        <KeepAlive :include="['PlayerView']">
          <component
            :is="Component"
            :key="route.name === 'player' ? 'player' : route.fullPath"
          />
        </KeepAlive>
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
  z-index: 2;
  transition:
    opacity 180ms var(--ease-out),
    transform 180ms var(--ease-out);
}

.route-leave-active {
  z-index: 1;
  pointer-events: none;
  transition: opacity 120ms var(--ease-in);
}

.route-enter-from {
  opacity: .06;
  transform: translateY(6px);
}

.route-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .route-enter-active,
  .route-leave-active {
    transition: none;
  }

  .route-enter-from {
    opacity: 1;
    transform: none;
  }

  .route-leave-to {
    transform: none;
  }
}
</style>
