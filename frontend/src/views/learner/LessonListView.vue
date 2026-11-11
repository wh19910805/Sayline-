<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRoute, useRouter } from 'vue-router'

import SlSkeleton from '@/components/ui/SlSkeleton.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { BookDetail } from '@/api/types'
import { useCatalogStore } from '@/stores/catalog'
import { setAmbient, syncThemeColor } from '@/composables/useAmbient'
import { useBookEnter } from '@/composables/useBookEnter'
import { formatDuration } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const { settle } = useBookEnter()

const bookId = computed(() => Number(route.params.bookId))
const book = ref<BookDetail | null>(null)
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const detail = await learnerApi.book(bookId.value)
    book.value = detail
    catalog.enterBook(detail, detail.lessons)
    applyAmbient(detail)
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
    await nextTick()
    settle()
  }
})

function applyAmbient(book: BookDetail) {
  if (book.themeColorPrimary) {
    setAmbient(book.themeColorPrimary, book.themeColorSecondary || book.themeColorPrimary, book.coverUrl || null)
  }
  syncThemeColor()
}

async function toggleFavorite() {
  if (!book.value) return
  if (book.value.favorite) {
    await learnerApi.unfavoriteBook(book.value.id)
  } else {
    await learnerApi.favoriteBook(book.value.id)
  }
  book.value.favorite = !book.value.favorite
}

function openLesson(lessonId: number) {
  router.push(`/learn/${bookId.value}/${lessonId}`)
}

function coverStyle() {
  const b = book.value
  return {
    '--cover-a': b?.spineColor || b?.themeColorPrimary || '#4f4e49',
  }
}

function coverImageStyle() {
  const url = book.value?.coverUrl
  return url
    ? { backgroundImage: `url("${url}")`, backgroundPosition: 'center', backgroundSize: 'cover' }
    : undefined
}

function lessonState(progress: number) {
  if (progress >= 100) return 'done'
  if (progress > 0) return 'ongoing'
  return 'todo'
}
</script>

<template>
  <main class="app-screen lesson-screen">
    <header class="settings-header">
      <button class="sl-icon-button" type="button" aria-label="返回" @click="router.back()">
        <SlIcon name="arrow-left" :size="21" />
      </button>
      <h1>课时</h1>
      <span />
    </header>

    <div v-if="error" class="inline-error lesson-error">{{ error }}</div>

    <div v-else-if="loading" class="lesson-scroll">
      <SlSkeleton :rows="6" />
    </div>

    <div v-else-if="book" class="lesson-scroll">
      <section class="book-head" :style="coverStyle()">
        <span class="book-head__cover cover-art" :style="coverImageStyle()" />
        <div class="book-head__copy">
          <span class="eyebrow">{{ book.categoryName }}</span>
          <h2>{{ book.title }}</h2>
          <p>{{ book.description || '逐句听、读、写、说' }}</p>
          <div class="book-head__meta">
            <span>{{ book.lessonCount }} 课时</span>
            <span>已完成 {{ Math.round((book.progress / 100) * book.lessonCount) }} / {{ book.lessonCount }}</span>
          </div>
          <div class="sl-progress sl-progress--light book-head__progress">
            <div class="sl-progress__track">
              <span class="sl-progress__value" :style="{ width: `${book.progress}%` }" />
            </div>
          </div>
        </div>
        <button
          class="book-head__favorite"
          type="button"
          :aria-pressed="book.favorite"
          :aria-label="book.favorite ? '取消收藏' : '收藏这本书'"
          @click="toggleFavorite"
        >
          <SlIcon name="heart" :size="20" :weight="book.favorite ? 'fill' : 'line'" />
        </button>
      </section>

      <section class="lesson-list">
        <button
          v-for="(lesson, index) in book.lessons"
          :key="lesson.id"
          class="lesson-row"
          :class="`is-${lessonState(lesson.progress)}`"
          type="button"
          @click="openLesson(lesson.id)"
        >
          <span class="lesson-row__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="lesson-row__copy">
            <strong>{{ lesson.title }}</strong>
            <span>{{ formatDuration(lesson.durationMs) }} · {{ lessonState(lesson.progress) === 'done' ? '已完成' : lessonState(lesson.progress) === 'ongoing' ? '进行中' : '未开始' }}</span>
          </span>
          <SlIcon name="check" v-if="lessonState(lesson.progress) === 'done'" :size="18" class="lesson-row__check" />
          <SlIcon name="play" v-else :size="16" class="lesson-row__play" />
        </button>
        <p v-if="!book.lessons.length" class="lesson-empty">这本书还没有课时。</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.lesson-screen {
  background:
    radial-gradient(120% 90% at 88% 8%, color-mix(in srgb, var(--ambient-2, #efeeea) 32%, transparent), transparent 55%),
    linear-gradient(165deg,
      color-mix(in srgb, var(--ambient, #f6f5f2) 30%, #ffffff),
      color-mix(in srgb, var(--ambient-2, #efeeea) 32%, #ffffff));
}

.lesson-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 20px 32px;
}

.lesson-error {
  padding: 0 20px;
}

.book-head {
  position: relative;
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--cover-a), color-mix(in srgb, var(--cover-a) 42%, #0b0b0a));
  color: var(--color-paper-50);
  box-shadow: var(--shadow-float);
}

.book-head__cover {
  width: 96px;
  aspect-ratio: 1.4 / 1;
  flex: 0 0 auto;
  border-radius: 6px;
  background: rgba(0, 0, 0, .22);
}

.book-head__copy {
  flex: 1;
  min-width: 0;
}

.book-head__copy h2 {
  margin: 4px 0 6px;
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.1;
  letter-spacing: -.02em;
}

.book-head__copy p {
  margin: 0;
  opacity: .8;
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-head__meta {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  font-size: 11px;
  opacity: .85;
}

.book-head__progress {
  margin-top: 10px;
}

.book-head__favorite {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 250, 240, .16);
  color: var(--color-paper-50);
  cursor: pointer;
}

.book-head__favorite[aria-pressed='true'] {
  color: var(--color-favorite);
  background: rgba(255, 250, 240, .28);
}

.lesson-list {
  display: grid;
  margin-top: 12px;
}

.lesson-row {
  display: grid;
  grid-template-columns: 32px 1fr 24px;
  align-items: center;
  gap: 12px;
  padding: 15px 2px;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}

.lesson-row:last-child {
  border-bottom: 0;
}

.lesson-row:active {
  background: var(--color-surface-muted);
}

.lesson-row__index {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.lesson-row.is-done .lesson-row__index {
  color: var(--color-success);
}

.lesson-row.is-ongoing .lesson-row__index {
  color: var(--color-action);
}

.lesson-row__copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.lesson-row__copy strong {
  overflow: hidden;
  font-size: 15px;
  font-weight: var(--weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lesson-row.is-done .lesson-row__copy strong {
  color: var(--color-text-secondary);
}

.lesson-row__copy span {
  color: var(--color-text-secondary);
  font-size: 11px;
}

.lesson-row__check {
  color: var(--color-success);
}

.lesson-row__play {
  color: var(--color-text-tertiary);
}

.lesson-row.is-ongoing .lesson-row__play {
  color: var(--color-action);
}

.lesson-empty {
  padding: 30px 0;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 13px;
}
</style>
