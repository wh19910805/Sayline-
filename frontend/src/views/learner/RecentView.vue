<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRouter } from 'vue-router'

import AppBottomNav from '@/components/AppBottomNav.vue'
import SlSkeleton from '@/components/ui/SlSkeleton.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { RecentLesson } from '@/api/types'

const router = useRouter()
const lessons = ref<RecentLesson[]>([])
const loading = ref(true)
const error = ref('')

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
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="app-screen recent-screen">
    <div class="mobile-scroll recent-scroll">
      <header class="recent-head">
        <h1>最近</h1>
      </header>

      <p v-if="error" class="inline-error">{{ error }}</p>

      <SlSkeleton v-if="loading" :rows="6" />

      <ul v-else-if="lessons.length" class="recent-list">
        <li v-for="lesson in lessons" :key="lesson.id">
          <button class="recent-item" type="button" @click="openLesson(lesson)">
            <span class="recent-item__cover" :style="[lessonStyle(lesson), coverStyle(lesson)]" />
            <span class="recent-item__body">
              <strong class="recent-item__title">{{ lesson.title }}</strong>
              <span class="recent-item__meta">{{ lesson.bookTitle }}</span>
              <span class="recent-item__progress">
                <span class="recent-item__track">
                  <span class="recent-item__value" :style="{ width: `${lesson.progress}%` }" />
                </span>
              </span>
            </span>
            <span class="recent-item__time">{{ relativeTime(lesson.lastStudiedAt) }}</span>
            <SlIcon name="arrow-right-s" :size="18" class="recent-item__arrow" />
          </button>
        </li>
      </ul>

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
  background:
    radial-gradient(120% 90% at 88% 8%, color-mix(in srgb, var(--ambient-2, #efeeea) 32%, transparent), transparent 55%),
    linear-gradient(165deg,
      color-mix(in srgb, var(--ambient, #f6f5f2) 30%, #ffffff),
      color-mix(in srgb, var(--ambient-2, #efeeea) 32%, #ffffff));
}

.recent-scroll {
  padding: calc(14px + var(--safe-top)) 20px calc(158px + var(--safe-bottom));
}

.recent-head {
  margin-bottom: 18px;
}

.recent-head h1 {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: var(--weight-regular);
}

.recent-loading {
  padding: 40px 0;
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
  text-align: center;
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
  min-height: 88px;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto 18px;
  align-items: center;
  gap: 12px;
  padding: 11px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  text-align: left;
  cursor: pointer;
}

.recent-item__cover {
  width: 72px;
  aspect-ratio: 1.4 / 1;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--lesson-a), var(--lesson-b));
}

.recent-item__body {
  min-width: 0;
  display: grid;
  gap: 5px;
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
  font-size: var(--text-caption);
}

.recent-item__progress {
  height: 4px;
  border-radius: 99px;
  background: var(--color-surface-muted);
  overflow: hidden;
}

.recent-item__track {
  display: block;
  height: 100%;
}

.recent-item__value {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: var(--color-action);
}

.recent-item__time {
  color: var(--color-text-tertiary);
  font-size: 11px;
  white-space: nowrap;
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
</style>
