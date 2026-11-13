<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SlIcon from '@/components/ui/SlIcon.vue'

import { useRecentLesson } from '@/composables/useRecentLesson'
import { usePlayerSession } from '@/composables/usePlayerSession'

const router = useRouter()
const route = useRoute()
const { state, load } = useRecentLesson()
const playerSession = usePlayerSession()
const lesson = computed(() => state.lesson)
const isRecent = computed(() => route.path === '/recent')
const playbackActive = computed(() => playerSession.state.active && !!playerSession.state.courseId)
const playing = computed(() => playbackActive.value && playerSession.state.playing)
const displayTitle = computed(() => playbackActive.value ? playerSession.state.title : lesson.value?.title ?? '')
const failedCovers = ref<string[]>([])
const openLabel = computed(() => {
  if (playbackActive.value) {
    return `打开当前课时：${displayTitle.value}`
  }
  return displayTitle.value ? `继续学习：${displayTitle.value}` : '继续学习'
})
const primaryLabel = computed(() => {
  if (playbackActive.value) {
    return `${playing.value ? '暂停' : '继续播放'}：${displayTitle.value}`
  }
  return displayTitle.value ? `开始学习：${displayTitle.value}` : '开始学习'
})
const displayProgress = computed(() => {
  if (playbackActive.value && playerSession.state.duration > 0) {
    return Math.min(100, Math.round(playerSession.state.currentTime / playerSession.state.duration * 100))
  }
  return lesson.value?.progress ?? 0
})
const coverCandidates = computed(() =>
  [...new Set([
    playbackActive.value ? playerSession.state.coverUrl : null,
    lesson.value?.coverUrl,
  ].filter((url): url is string => Boolean(url)))],
)
const displayCover = computed(
  () => coverCandidates.value.find((url) => !failedCovers.value.includes(url)) ?? null,
)
const hasLesson = computed(() => playbackActive.value || !!lesson.value)

onMounted(() => {
  load()
})

watch(() => playerSession.state.courseId, () => {
  failedCovers.value = []
})

function openPlayer() {
  if (playbackActive.value && playerSession.state.bookId && playerSession.state.courseId) {
    router.push(`/learn/${playerSession.state.bookId}/${playerSession.state.courseId}`)
    return
  }
  if (!lesson.value) return
  router.push(`/learn/${lesson.value.bookId}/${lesson.value.id}`)
}

function togglePrimary() {
  if (playbackActive.value) {
    playerSession.togglePlayback()
    return
  }
  openPlayer()
}

function onCoverError() {
  if (!displayCover.value) return
  failedCovers.value = [...new Set([...failedCovers.value, displayCover.value])]
}

function list() {
  router.push('/recent')
}

function dockStyle() {
  return { '--dock-progress': `${displayProgress.value}%` }
}
</script>

<template>
  <transition name="continue-dock">
    <div
      v-if="hasLesson"
      class="continue-group"
      :data-playing="playing ? 'true' : 'false'"
      :style="dockStyle()"
    >
      <button class="continue-dock__cover" type="button" :title="displayTitle" :aria-label="openLabel" @click="openPlayer">
        <span class="continue-dock__art">
          <span v-if="!displayCover" class="continue-dock__fallback">
            <SlIcon name="book-open" :size="16" />
          </span>
          <img
            v-else
            :src="displayCover"
            alt=""
            @error="onCoverError"
          />
        </span>
      </button>
      <button
        class="continue-dock__toggle"
        type="button"
        :aria-label="primaryLabel"
        :aria-pressed="playing"
        @click="togglePrimary"
      >
        <span class="continue-dock__toggle-icon">
          <SlIcon :name="playing ? 'pause' : 'play'" :size="18" weight="fill" />
        </span>
      </button>
      <span class="continue-dock__divider" aria-hidden="true" />
      <button
        class="continue-dock__list"
        :class="{ 'is-active': isRecent }"
        type="button"
        title="最近播放列表"
        aria-label="最近播放列表"
        @click="list"
      >
        <span class="continue-dock__list-icon">
          <SlIcon name="play-list" :size="20" />
        </span>
      </button>
    </div>
  </transition>
</template>

<style scoped>
.continue-group {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0;
  min-height: 48px;
  padding: 2px 4px;
  border: 1px solid rgba(26, 26, 24, .07);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-surface-muted) 86%, transparent);
  transition:
    background var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.continue-group[data-playing="true"] {
  border-color: rgba(26, 26, 24, .1);
  background: color-mix(in srgb, var(--color-surface-muted) 96%, white);
}

.continue-dock__cover {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 11px;
  background: transparent;
  cursor: pointer;
  touch-action: manipulation;
}

.continue-dock__cover:active .continue-dock__art {
  transform: scale(.96);
}

.continue-dock__art {
  position: relative;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  overflow: hidden;
  border: 0;
  border-radius: 50%;
  background: linear-gradient(145deg, #555550, #1a1a18);
  box-shadow: 0 1px 4px rgba(26, 26, 24, .12);
  transition: transform var(--duration-fast) var(--ease-out);
}

.continue-dock__art img,
.continue-dock__fallback {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.continue-dock__fallback {
  display: grid;
  place-items: center;
  color: rgba(255, 250, 240, .82);
}

.continue-dock__toggle {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  touch-action: manipulation;
}

.continue-dock__toggle-icon {
  position: relative;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(
    var(--color-text) var(--dock-progress, 0%),
    rgba(26, 26, 24, .12) 0
  );
  color: var(--color-text);
  transition:
    color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.continue-dock__toggle-icon::before {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-surface-muted) 88%, white);
}

.continue-dock__toggle-icon :deep(.sl-icon) {
  position: relative;
  z-index: 1;
}

.continue-group[data-playing="true"] .continue-dock__toggle-icon {
  color: var(--color-bg-elevated);
}

.continue-group[data-playing="true"] .continue-dock__toggle-icon::before {
  background: var(--color-text);
}

.continue-dock__toggle:active .continue-dock__toggle-icon {
  transform: scale(.94);
}

.continue-dock__divider {
  width: 1px;
  height: 16px;
  margin: 0 2px;
  background: rgba(26, 26, 24, .1);
}

.continue-dock__list {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.continue-dock__list:active {
  transform: scale(.94);
}

.continue-dock__list.is-active {
  color: var(--color-text);
}

.continue-dock__list-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  transition:
    color var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out);
}

.continue-dock__list.is-active .continue-dock__list-icon {
  background: color-mix(in srgb, var(--color-text) 9%, transparent);
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
