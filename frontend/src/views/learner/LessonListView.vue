<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRoute, useRouter } from 'vue-router'

import SlSkeleton from '@/components/ui/SlSkeleton.vue'
import SlErrorState from '@/components/ui/SlErrorState.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { BookDetail, CourseSummary } from '@/api/types'
import { useCatalogStore } from '@/stores/catalog'
import { setAmbient, syncThemeColor } from '@/composables/useAmbient'
import { useBookEnter } from '@/composables/useBookEnter'
import { useScrollMemory } from '@/composables/useScrollMemory'
import { usePlayerSession } from '@/composables/usePlayerSession'
import { formatDuration } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const { settle } = useBookEnter()
const playerSession = usePlayerSession()

const bookId = computed(() => Number(route.params.bookId))
const lessonScroll = ref<HTMLElement | null>(null)
const book = ref<BookDetail | null>(null)
const error = ref('')
const loading = ref(true)
const filter = ref<'ALL' | 'UNSTARTED' | 'ONGOING' | 'COMPLETED'>('ALL')
const scrollMemory = useScrollMemory(lessonScroll, () => `lessons:${bookId.value}`)
const filterState = { UNSTARTED: 'todo', ONGOING: 'ongoing', COMPLETED: 'done' } as const
const filteredLessons = computed(() => {
  const lessons = book.value?.lessons ?? []
  const activeFilter = filter.value
  if (activeFilter === 'ALL') return lessons
  return lessons.filter(
    (lesson) => lessonState(lesson.progress) === filterState[activeFilter],
  )
})
const continueLesson = computed<CourseSummary | null>(() => {
  const lessons = book.value?.lessons ?? []
  return lessons.find((lesson) => lesson.progress > 0 && lesson.progress < 100)
    ?? lessons.find((lesson) => lesson.progress === 0)
    ?? lessons.at(-1)
    ?? null
})
const activePlaybackLesson = computed(() => {
  if (!playerSession.state.active || playerSession.state.bookId !== bookId.value) return null
  return book.value?.lessons.find((lesson) => lesson.id === playerSession.state.courseId) ?? null
})
const resumeTarget = computed(() => activePlaybackLesson.value ?? continueLesson.value)
const isPlaying = computed(() => !!activePlaybackLesson.value && playerSession.state.playing)

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
    await scrollMemory.restore()
    scrollMemory.attach()
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

function openResume() {
  const target = activePlaybackLesson.value ?? continueLesson.value
  if (target) openLesson(target.id)
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

function resumeLabel(lesson: CourseSummary) {
  if (lesson.progress >= 100) return '再学一次'
  if (lesson.progress > 0) return '继续学习'
  return '开始学习'
}

function resumeShortLabel(lesson: CourseSummary) {
  if (lesson.id === playerSession.state.courseId && isPlaying.value) return '播放中'
  if (lesson.progress >= 100) return '再学'
  if (lesson.progress > 0) return '继续'
  return '开始'
}

function remainingLabel(lesson: CourseSummary) {
  const remaining = lesson.remainingDurationMs
    ?? Math.round(lesson.durationMs * Math.max(0, 100 - lesson.progress) / 100)
  return `预计剩余 ${formatDuration(remaining)}`
}

function lessonHint(lesson: CourseSummary) {
  if (lesson.progress >= 100) return '四个学习环节已完成'
  if (lesson.progress > 0) return lesson.lastCueText || '从上次学习的位置继续'
  return '从第 1 句开始'
}

function lessonMeta(lesson: CourseSummary) {
  if (lesson.progress >= 100) return `${formatDuration(lesson.durationMs)} · 已完成`
  if (lesson.progress > 0) return `${remainingLabel(lesson)} · ${lesson.progress}%`
  return `${formatDuration(lesson.durationMs)} · 未开始`
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

    <SlErrorState
      v-if="error"
      class="lesson-error"
      :message="error"
      title="课时列表暂时没有加载出来"
      @retry="router.go(0)"
    />

    <div v-else-if="loading" class="lesson-scroll">
      <SlSkeleton :rows="6" />
    </div>

    <div v-else-if="book" ref="lessonScroll" class="lesson-scroll">
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

      <button
        v-if="resumeTarget"
        class="continue-lesson"
        :class="{ 'is-playing': isPlaying }"
        type="button"
        :aria-label="`${isPlaying ? '正在播放' : resumeLabel(resumeTarget)}：${resumeTarget.title}`"
        @click="openResume"
      >
        <span class="continue-lesson__copy">
          <span class="continue-lesson__eyebrow">
            {{ isPlaying ? '正在播放' : activePlaybackLesson && !playerSession.state.playing ? '已暂停' : resumeLabel(resumeTarget) }}
          </span>
          <strong>{{ resumeTarget.title }}</strong>
          <span class="continue-lesson__sentence" lang="en">
            {{ resumeTarget.lastCueText || (isPlaying ? '音频正在后台播放' : '从第一句开始') }}
          </span>
          <span class="continue-lesson__meta">
            <span>{{ resumeTarget.progress }}%</span>
            <span>{{ remainingLabel(resumeTarget) }}</span>
          </span>
        </span>
        <SlIcon
          class="continue-lesson__arrow"
          :name="isPlaying ? 'pause' : 'arrow-right-s'"
          :size="18"
          weight="fill"
        />
      </button>

      <section class="lesson-list">
        <div class="lesson-filters" role="group" aria-label="筛选课时">
          <button
            v-for="item in [
              ['ALL', '全部'],
              ['UNSTARTED', '未开始'],
              ['ONGOING', '进行中'],
              ['COMPLETED', '已完成'],
            ] as const"
            :key="item[0]"
            type="button"
            :aria-pressed="filter === item[0]"
            @click="filter = item[0]"
          >
            {{ item[1] }}
          </button>
        </div>
        <article
          v-for="(lesson, index) in filteredLessons"
          :key="lesson.id"
          class="lesson-row"
          :class="[`is-${lessonState(lesson.progress)}`, { 'is-playing': lesson.id === playerSession.state.courseId && isPlaying }]"
        >
          <button class="lesson-row__main" type="button" @click="openLesson(lesson.id)">
            <span class="lesson-row__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="lesson-row__copy">
              <strong>{{ lesson.title }}</strong>
              <span class="lesson-row__sentence" :lang="lesson.progress > 0 && lesson.progress < 100 && lesson.lastCueText ? 'en' : undefined">
                {{ lessonHint(lesson) }}
              </span>
              <span>{{ lessonMeta(lesson) }}</span>
            </span>
          </button>
          <button
            class="lesson-row__cta"
            type="button"
            :aria-label="`${resumeLabel(lesson)}：${lesson.title}`"
            @click="openLesson(lesson.id)"
          >
            {{ resumeShortLabel(lesson) }}
            <SlIcon :name="lesson.id === playerSession.state.courseId && isPlaying ? 'pause' : 'arrow-right-s'" :size="15" />
          </button>
        </article>
        <p v-if="!book.lessons.length" class="lesson-empty">这本书还没有课时。</p>
        <p v-else-if="!filteredLessons.length" class="lesson-empty">当前筛选下没有课时。</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.lesson-screen {
  background: var(--app-bg);
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
  width: var(--touch-target);
  height: var(--touch-target);
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

.book-head__favorite:active {
  transform: scale(.94);
}

.lesson-list {
  display: grid;
  margin-top: 12px;
}

.continue-lesson {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px 14px;
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  box-shadow: 0 8px 24px rgba(26, 26, 24, .06);
  cursor: pointer;
}

.continue-lesson__copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.continue-lesson__eyebrow {
  color: var(--color-action);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
}

.continue-lesson.is-playing {
  border-color: color-mix(in srgb, var(--color-action) 42%, var(--color-border));
  box-shadow: 0 10px 28px rgba(26, 26, 24, .1);
}

.continue-lesson.is-playing .continue-lesson__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.continue-lesson.is-playing .continue-lesson__eyebrow::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-action);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-action) 14%, transparent);
}

.continue-lesson strong {
  font-size: 17px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.continue-lesson__sentence {
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.continue-lesson__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 1px;
  color: var(--color-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.continue-lesson__arrow {
  color: var(--color-text-secondary);
}

.lesson-filters {
  display: flex;
  gap: 5px;
  padding: 5px;
  margin: 6px 0 4px;
  border-radius: 11px;
  background: var(--color-surface-muted);
}

.lesson-filters button {
  flex: 1;
  min-height: 44px;
  padding: 0 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.lesson-filters button[aria-pressed="true"] {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(26, 26, 24, .06);
}

.lesson-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 8px;
  padding-inline: 4px;
  border-bottom: 1px solid var(--color-border);
  border-radius: 10px;
  transition: background var(--duration-fast) var(--ease-out);
}

.lesson-row:last-child {
  border-bottom: 0;
}

.lesson-row:hover,
.lesson-row:focus-within {
  background: color-mix(in srgb, var(--color-surface) 64%, transparent);
}

.lesson-row.is-playing {
  background: color-mix(in srgb, var(--color-action) 7%, transparent);
}

.lesson-row__main {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 76px;
  padding: 13px 2px;
  border: 0;
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.lesson-row__main:active {
  opacity: .72;
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

.lesson-row__copy .lesson-row__sentence {
  overflow: hidden;
  color: var(--color-text-tertiary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lesson-row__cta {
  align-self: center;
  min-height: 44px;
  min-width: 72px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.lesson-row.is-ongoing .lesson-row__cta {
  border-color: var(--color-ink-900);
  background: var(--color-ink-900);
  color: var(--color-paper-50);
}

.lesson-row__cta:active {
  transform: scale(.97);
}

.lesson-empty {
  padding: 30px 0;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

</style>
