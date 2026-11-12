<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SlIcon from '@/components/ui/SlIcon.vue'

import { useRecentLesson } from '@/composables/useRecentLesson'
import type { RecentLesson } from '@/api/types'

const router = useRouter()
const route = useRoute()
const { state, load } = useRecentLesson()
const lesson = computed(() => state.lesson)
const isRecent = computed(() => route.path === '/recent')

onMounted(() => {
  load()
})

function play() {
  if (!lesson.value) return
  router.push(`/learn/${lesson.value.bookId}/${lesson.value.id}`)
}

function list() {
  router.push('/recent')
}

function coverStyle(item: RecentLesson) {
  return {
    background: item.coverUrl
      ? `url("${item.coverUrl}") center / cover no-repeat`
      : `linear-gradient(135deg, ${item.themeColorPrimary || '#53634e'}, ${item.themeColorSecondary || '#263128'})`,
  }
}

function ringStyle(item: RecentLesson) {
  return { '--progress': `${Math.round(item.progress * 3.6)}deg` }
}
</script>

<template>
  <transition name="continue-dock">
    <div v-if="lesson" class="continue-group">
      <span class="continue-dock__label">继续学习</span>
      <button
        class="continue-dock__cover"
        type="button"
        :title="`${lesson.title} · ${lesson.bookTitle}`"
        aria-label="播放最近课程"
        :style="ringStyle(lesson)"
        @click="play"
      >
        <span class="continue-dock__cover-img" :style="coverStyle(lesson)" />
        <span class="continue-dock__play">
          <SlIcon name="play" :size="18" weight="fill" />
        </span>
      </button>
      <button
        class="continue-dock__list"
        type="button"
        :title="`最近播放列表`"
        aria-label="最近播放列表"
        @click="list"
      >
        <SlIcon name="refresh" :size="22" :weight="isRecent ? 'fill' : 'line'" />
      </button>
    </div>
  </transition>
</template>

<style scoped>
.continue-group {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px 4px 4px;
  border: 1px solid rgba(26, 26, 24, .08);
  border-radius: 999px;
  background: color-mix(in srgb, #ffffff 82%, transparent);
  backdrop-filter: blur(18px);
  box-shadow: 0 4px 16px rgba(26, 26, 24, .08);
}

.continue-dock__label {
  padding: 0 2px 0 4px;
  color: var(--color-text-secondary);
  font-size: 10px;
  font-weight: var(--weight-semibold);
  white-space: nowrap;
}

.continue-dock__cover {
  position: relative;
  width: var(--touch-target);
  height: var(--touch-target);
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: conic-gradient(var(--color-action) var(--progress, 0deg), rgba(26, 26, 24, .1) 0deg);
  cursor: pointer;
}

.continue-dock__cover-img {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.continue-dock__cover::before {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: rgba(26, 26, 24, .34);
  z-index: 1;
  pointer-events: none;
}

.continue-dock__play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, .55));
  z-index: 2;
}

.continue-dock__list {
  width: var(--touch-target);
  height: var(--touch-target);
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-text);
  cursor: pointer;
}

.continue-dock-enter-active,
.continue-dock-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out);
}

.continue-dock-enter-from,
.continue-dock-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
