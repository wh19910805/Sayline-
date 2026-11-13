<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRouter } from 'vue-router'

import AppBottomNav from '@/components/AppBottomNav.vue'
import SlSkeleton from '@/components/ui/SlSkeleton.vue'
import SlErrorState from '@/components/ui/SlErrorState.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { RecentLesson } from '@/api/types'
import { useScrollMemory } from '@/composables/useScrollMemory'

const router = useRouter()
const recentScroll = ref<HTMLElement | null>(null)
const lessons = ref<RecentLesson[]>([])
const loading = ref(true)
const error = ref('')
const scrollMemory = useScrollMemory(recentScroll, () => 'recent')
const featured = computed(() => lessons.value[0] ?? null)
const history = computed(() => lessons.value.slice(1))

function goTab(value: 'home' | 'me') {
  router.push(value === 'home' ? '/' : '/me')
}

function openLesson(lesson: RecentLesson) {
  router.push(`/learn/${lesson.bookId}/${lesson.id}`)
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return new Date(value).toLocaleDateString('zh-CN')
}

function lessonStyle(lesson: RecentLesson) {
  return {
    '--lesson-a': lesson.themeColorPrimary || '#53634e',
    '--lesson-b': lesson.themeColorSecondary || '#263128',
  }
}

function coverStyle(lesson: RecentLesson) {
  return {
    backgroundImage: lesson.coverUrl
      ? `url("${lesson.coverUrl}")`
      : `linear-gradient(135deg, var(--lesson-a), var(--lesson-b))`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  }
}

onMounted(async () => {
  try {
    lessons.value = await learnerApi.recentLessons()
    await scrollMemory.restore()
    scrollMemory.attach()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="app-screen recent-screen">
    <div ref="recentScroll" class="mobile-scroll recent-scroll">
      <header class="recent-head">
        <div>
          <p class="eyebrow">LISTENING HISTORY</p>
          <h1>最近学习</h1>
        </div>
        <span v-if="lessons.length">{{ lessons.length }} 个课时</span>
      </header>

      <SlErrorState
        v-if="error"
        :message="error"
        title="最近学习暂时没有加载出来"
        @retry="router.go(0)"
      />

      <SlSkeleton v-else-if="loading" :rows="6" />

      <template v-else-if="featured">
        <button
          class="recent-featured"
          type="button"
          :style="lessonStyle(featured)"
          @click="openLesson(featured)"
        >
          <span class="recent-featured__cover" :style="coverStyle(featured)" />
          <span class="recent-featured__copy">
            <span class="recent-featured__eyebrow">上次学习 · {{ relativeTime(featured.lastStudiedAt) }}</span>
            <strong>{{ featured.title }}</strong>
            <small>{{ featured.bookTitle }}</small>
            <span class="recent-featured__footer">
              <span class="recent-featured__progress">
                <span><i :style="{ width: `${featured.progress}%` }" /></span>
                <em>{{ featured.progress }}%</em>
              </span>
              <span class="recent-featured__action">
                继续学习
                <SlIcon name="play" :size="15" weight="fill" />
              </span>
            </span>
          </span>
        </button>

        <section v-if="history.length" class="recent-history">
          <div class="recent-history__head">
            <h2>更早学习</h2>
            <span>{{ history.length }} 个课时</span>
          </div>
          <ul class="recent-list">
            <li v-for="lesson in history" :key="lesson.id">
              <button class="recent-item" type="button" @click="openLesson(lesson)">
                <span class="recent-item__cover" :style="[lessonStyle(lesson), coverStyle(lesson)]" />
                <span class="recent-item__body">
                  <strong class="recent-item__title">{{ lesson.title }}</strong>
                  <span class="recent-item__meta">{{ lesson.bookTitle }} · {{ relativeTime(lesson.lastStudiedAt) }}</span>
                  <span class="recent-item__progress">
                    <span class="recent-item__value" :style="{ width: `${lesson.progress}%` }" />
                  </span>
                </span>
                <span class="recent-item__percent">{{ lesson.progress }}%</span>
                <SlIcon name="arrow-right-s" :size="18" class="recent-item__arrow" />
              </button>
            </li>
          </ul>
        </section>
      </template>

      <div v-else class="recent-empty">
        <span class="recent-empty__icon"><SlIcon name="history" :size="26" /></span>
        <h2>还没有学习记录</h2>
        <p>开始学习一课后，最近学过的课时会出现在这里。</p>
        <button class="sl-button sl-button--accent" type="button" @click="router.push('/')">去学习</button>
      </div>
    </div>

    <AppBottomNav @navigate="goTab" />
  </main>
</template>

<style scoped>
.recent-screen {
  background: var(--app-bg);
}

.recent-scroll {
  padding: calc(14px + var(--safe-top)) 20px calc(158px + var(--safe-bottom));
}

.recent-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.recent-head h1 {
  margin: 5px 0 0;
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: var(--weight-regular);
}

.recent-head > span {
  color: var(--color-text-tertiary);
  font-size: 12px;
  white-space: nowrap;
}

.recent-featured {
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: 94px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 14px;
  overflow: hidden;
  border: 0;
  border-radius: 18px;
  background:
    radial-gradient(circle at 86% 12%, rgba(255,255,255,.12), transparent 32%),
    linear-gradient(135deg, var(--lesson-a), var(--lesson-b));
  color: var(--color-paper-50);
  text-align: left;
  box-shadow: var(--shadow-float);
  cursor: pointer;
}

.recent-featured__cover {
  width: 94px;
  aspect-ratio: 7 / 5;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, .22);
}

.recent-featured__copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.recent-featured__eyebrow,
.recent-featured__copy small {
  color: rgba(255, 250, 240, .72);
  font-size: 11px;
}

.recent-featured__copy > strong {
  overflow: hidden;
  display: -webkit-box;
  font-size: 19px;
  font-weight: var(--weight-semibold);
  line-height: 1.28;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.recent-featured__progress {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.recent-featured__footer {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 3px;
}

.recent-featured__footer .recent-featured__progress {
  flex: 1;
}

.recent-featured__progress > span {
  height: 4px;
  overflow: hidden;
  border-radius: 99px;
  background: rgba(255, 250, 240, .2);
}

.recent-featured__progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: rgba(255, 250, 240, .9);
}

.recent-featured__progress em {
  font-size: 10px;
  font-style: normal;
  font-variant-numeric: tabular-nums;
}

.recent-featured__action {
  flex: 0 0 auto;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 11px;
  border-radius: 999px;
  background: rgba(255, 250, 240, .94);
  color: var(--color-ink-900);
  font-size: 11px;
  font-weight: var(--weight-semibold);
  white-space: nowrap;
}

.recent-history {
  margin-top: 22px;
}

.recent-history__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.recent-history__head h2 {
  margin: 0;
  font-size: 14px;
}

.recent-history__head span {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.recent-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.recent-item {
  width: 100%;
  min-height: 72px;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto 18px;
  align-items: center;
  gap: 10px;
  padding: 10px 2px;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  border-radius: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

@media (hover: hover) {
  .recent-item:hover {
    box-shadow: var(--shadow-card);
    transform: translateY(-1px);
  }
}

.recent-item:active {
  transform: scale(.985);
}

.recent-item__cover {
  width: 52px;
  aspect-ratio: 1 / 1;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--lesson-a), var(--lesson-b));
}

.recent-item__body {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.recent-item__title {
  overflow: hidden;
  color: var(--color-text);
  font-size: 15px;
  font-weight: var(--weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-item__meta {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.recent-item__progress {
  height: 3px;
  overflow: hidden;
  border-radius: 99px;
  background: var(--color-surface-muted);
}

.recent-item__value {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: var(--color-action);
}

.recent-item__percent {
  color: var(--color-text-secondary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.recent-item__arrow {
  color: var(--color-text-tertiary);
}

.recent-empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 60px 20px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.recent-empty__icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-text-tertiary);
}

.recent-empty h2 {
  margin: 6px 0 0;
  color: var(--color-text);
  font-size: 17px;
}

.recent-empty p {
  margin: 0 0 8px;
  font-size: var(--text-caption);
  line-height: 1.6;
}

@media (max-width: 360px) {
  .recent-featured {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .recent-featured__cover {
    width: 72px;
  }

  .recent-featured__copy {
    padding-right: 0;
    padding-bottom: 0;
  }
}
</style>
