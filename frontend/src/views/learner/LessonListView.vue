<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, Check, Heart, Play } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { BookDetail } from '@/api/types'
import { useCatalogStore } from '@/stores/catalog'
import { formatDuration } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()

const bookId = computed(() => Number(route.params.bookId))
const book = ref<BookDetail | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    book.value = await learnerApi.book(bookId.value)
    catalog.enterBook(book.value, book.value.lessons)
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})

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
    '--cover-a': b?.themeColorPrimary || '#53634e',
    '--cover-b': b?.themeColorSecondary || '#263128',
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
        <ArrowLeft :size="21" />
      </button>
      <h1>课时</h1>
      <span />
    </header>

    <div v-if="error" class="inline-error lesson-error">{{ error }}</div>

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
          <Heart :size="20" :fill="book.favorite ? 'currentColor' : 'none'" />
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
          <Check v-if="lessonState(lesson.progress) === 'done'" :size="18" class="lesson-row__check" />
          <Play v-else :size="16" class="lesson-row__play" />
        </button>
        <p v-if="!book.lessons.length" class="lesson-empty">这本书还没有课时。</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.lesson-screen {
  background:
    radial-gradient(circle at 88% 5%, rgba(217, 181, 110, .14), transparent 27%),
    var(--color-bg);
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
  align-items: flex-start;
  padding: 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--cover-a), var(--cover-b));
  color: var(--color-paper-50);
  box-shadow: var(--shadow-float);
}

.book-head__cover {
  width: 88px;
  height: 118px;
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
  gap: 8px;
  margin-top: 22px;
}

.lesson-row {
  display: grid;
  grid-template-columns: 28px 1fr 22px;
  align-items: center;
  gap: 10px;
  padding: 13px 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.lesson-row.is-done {
  border-left: 3px solid var(--color-success);
}

.lesson-row.is-ongoing {
  border-left: 3px solid var(--color-action);
}

.lesson-row__index {
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.lesson-row__copy {
  display: grid;
  gap: 2px;
}

.lesson-row__copy strong {
  font-size: 15px;
  font-weight: var(--weight-semibold);
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

.lesson-empty {
  padding: 30px 0;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 13px;
}
</style>
