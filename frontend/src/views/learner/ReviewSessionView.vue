<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SlErrorState from '@/components/ui/SlErrorState.vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import SlSkeleton from '@/components/ui/SlSkeleton.vue'
import WordDictation from '@/components/player/WordDictation.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { CourseDetail, Cue, ReviewCue } from '@/api/types'

const route = useRoute()
const router = useRouter()
const queue = ref<ReviewCue[]>([])
const position = ref(0)
const course = ref<CourseDetail | null>(null)
const cue = ref<Cue | null>(null)
const audioUrl = ref('')
const audio = ref<HTMLAudioElement | null>(null)
const loading = ref(true)
const error = ref('')
const answerError = ref('')
const submitted = ref(false)
const submitting = ref(false)
const playing = ref(false)
const skipped = ref(0)
const courseCache = new Map<number, CourseDetail>()
let advanceTimer: ReturnType<typeof setTimeout> | undefined
let loadGeneration = 0

const currentReview = computed(() => queue.value[position.value] ?? null)
const finished = computed(() => queue.value.length > 0 && position.value >= queue.value.length)
const masteredCount = computed(() => Math.max(0, position.value - skipped.value))
const progressLabel = computed(() => {
  const current = Math.min(position.value + 1, queue.value.length)
  return `${current} / ${queue.value.length}`
})

function stopAudio() {
  if (!audio.value) return
  audio.value.pause()
  audio.value.currentTime = 0
}

async function loadCurrentCue() {
  const review = currentReview.value
  if (!review) {
    stopAudio()
    loading.value = false
    return
  }

  const generation = ++loadGeneration
  loading.value = true
  error.value = ''
  answerError.value = ''
  submitted.value = false
  course.value = null
  cue.value = null
  audioUrl.value = ''
  stopAudio()

  try {
    let detail = courseCache.get(review.courseId)
    if (!detail) {
      detail = await learnerApi.course(review.courseId)
      courseCache.set(review.courseId, detail)
    }
    const nextCue = detail.cues.find((item) => item.id === review.cueId)
    if (!nextCue) throw new Error('当前错句已不在课时中')
    if (generation !== loadGeneration) return
    course.value = detail
    cue.value = nextCue
    audioUrl.value = detail.audioUrl ?? ''
    await nextTick()
  } catch (reason) {
    if (generation === loadGeneration) {
      error.value = reason instanceof Error && !('status' in reason)
        ? reason.message
        : apiErrorMessage(reason)
    }
  } finally {
    if (generation === loadGeneration) loading.value = false
  }
}

async function loadReviews() {
  loading.value = true
  error.value = ''
  try {
    const pending = await learnerApi.reviews(false)
    const requested = Number(route.query.start)
    const startIndex = pending.findIndex((item) => item.cueId === requested)
    queue.value = startIndex > 0
      ? [...pending.slice(startIndex), ...pending.slice(0, startIndex)]
      : pending
    position.value = 0
    skipped.value = 0
    await loadCurrentCue()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
}

function playCurrentCue() {
  if (!audio.value || !cue.value) return
  const start = cue.value.startMs / 1_000
  const end = cue.value.endMs / 1_000
  if (audio.value.currentTime < start || audio.value.currentTime >= end) {
    audio.value.currentTime = start
  }
  void audio.value.play().catch(() => {
    answerError.value = '浏览器阻止了播放，请再次点击播放本句'
  })
}

function toggleAudio() {
  if (!audio.value) return
  if (playing.value) {
    audio.value.pause()
  } else {
    playCurrentCue()
  }
}

function stopAtCueEnd() {
  if (!audio.value || !cue.value) return
  if (audio.value.currentTime >= cue.value.endMs / 1_000) {
    audio.value.pause()
    audio.value.currentTime = cue.value.endMs / 1_000
  }
}

function advance(skippedCurrent = false) {
  if (submitting.value) return
  if (advanceTimer) {
    clearTimeout(advanceTimer)
    advanceTimer = undefined
  }
  if (skippedCurrent) skipped.value += 1
  submitted.value = false
  answerError.value = ''
  position.value += 1
  void loadCurrentCue()
}

function scheduleAdvance() {
  if (advanceTimer) clearTimeout(advanceTimer)
  advanceTimer = setTimeout(() => advance(), 650)
}

async function submitAnswer(answer: string) {
  const review = currentReview.value
  if (!review || submitting.value || submitted.value) return
  submitted.value = true
  submitting.value = true
  answerError.value = ''
  try {
    const result = await learnerApi.submitReviewAttempt(review.cueId, answer)
    if (result.correct) scheduleAdvance()
  } catch (reason) {
    submitted.value = false
    answerError.value = apiErrorMessage(reason)
  } finally {
    submitting.value = false
  }
}

async function completeAnswer(answer: string) {
  const review = currentReview.value
  if (!review || submitting.value || submitted.value) return
  submitted.value = true
  submitting.value = true
  answerError.value = ''
  try {
    const result = await learnerApi.submitReviewAttempt(review.cueId, answer)
    if (!result.correct) {
      submitted.value = false
      answerError.value = '答案校验未通过，请重新填写'
      return
    }
    scheduleAdvance()
  } catch (reason) {
    submitted.value = false
    answerError.value = apiErrorMessage(reason)
  } finally {
    submitting.value = false
  }
}

function retryAnswer() {
  submitted.value = false
  answerError.value = ''
}

function finish() {
  void router.replace('/me/reviews')
}

function retry() {
  if (queue.value.length) void loadCurrentCue()
  else void loadReviews()
}

onMounted(loadReviews)
onBeforeUnmount(() => {
  if (advanceTimer) clearTimeout(advanceTimer)
  stopAudio()
})
</script>

<template>
  <main class="app-screen review-session">
    <header class="settings-header">
      <button class="sl-icon-button" type="button" aria-label="返回" @click="router.back()">
        <SlIcon name="arrow-left" :size="21" />
      </button>
      <h1>错句复习</h1>
      <span v-if="queue.length" class="review-session__progress">{{ progressLabel }}</span>
    </header>

    <div class="review-session__scroll">
      <SlSkeleton v-if="loading" :rows="7" />
      <SlErrorState
        v-else-if="error"
        :message="error"
        title="当前错句暂时无法加载"
        @retry="retry"
      />

      <template v-else-if="currentReview && cue">
        <section class="review-session__prompt">
          <div class="review-session__meta">
            <span>第 {{ currentReview.sequenceNo }} 句</span>
            <span>错 {{ currentReview.wrongCount }} 次</span>
          </div>
          <p class="eyebrow">{{ currentReview.bookTitle }} · {{ currentReview.courseTitle }}</p>
          <h2 lang="zh">{{ currentReview.chineseText }}</h2>
          <button
            class="review-session__audio"
            type="button"
            :disabled="!audioUrl"
            :aria-label="playing ? '暂停本句' : '播放本句'"
            @click="toggleAudio"
          >
            <SlIcon :name="playing ? 'pause' : 'play'" :size="22" weight="fill" />
            <span>{{ audioUrl ? (playing ? '暂停本句' : '播放本句') : '暂无本句音频' }}</span>
          </button>
        </section>

        <section class="review-session__workbench">
          <div class="review-session__workbench-head">
            <div>
              <p class="eyebrow">TYPE WHAT YOU HEAR</p>
              <h2>写出英文句子</h2>
            </div>
            <span>{{ course?.title }}</span>
          </div>

          <WordDictation
            :key="currentReview.cueId"
            :sentence="currentReview.englishText"
            :submitted="submitted"
            @submit="submitAnswer"
            @complete="completeAnswer"
            @retry="retryAnswer"
          />

          <p v-if="answerError" class="inline-error" role="alert">{{ answerError }}</p>

          <div class="review-session__actions">
            <button
              class="sl-button sl-button--secondary"
              type="button"
              :disabled="submitting"
              @click="advance(true)"
            >
              <SlIcon name="skip-forward" :size="18" />
              跳过本句
            </button>
            <span>跳过不会标记为已掌握</span>
          </div>
        </section>
      </template>

      <section v-else-if="finished || !queue.length" class="review-session__complete">
        <div class="review-session__complete-mark">
          <SlIcon name="check" :size="34" />
        </div>
        <p class="eyebrow">REVIEW SESSION</p>
        <h1>本轮复习完成</h1>
        <p v-if="queue.length">
          写对 {{ masteredCount }} 句<template v-if="skipped">，跳过 {{ skipped }} 句</template>。
          跳过的错句会继续留在复习列表中。
        </p>
        <p v-else>当前没有待复习错句，继续学习后新的错句会自动出现在这里。</p>
        <button class="sl-button sl-button--accent" type="button" @click="finish">
          返回错句列表
        </button>
      </section>

      <audio
        ref="audio"
        :src="audioUrl || undefined"
        preload="metadata"
        @play="playing = true"
        @pause="playing = false"
        @ended="playing = false"
        @timeupdate="stopAtCueEnd"
      />
    </div>
  </main>
</template>

<style scoped>
.review-session {
  background:
    radial-gradient(circle at 82% 12%, var(--color-warning-soft), transparent 34%),
    var(--app-bg);
}

.review-session__progress {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.review-session__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 20px calc(28px + var(--safe-bottom));
  scrollbar-width: none;
}

.review-session__scroll::-webkit-scrollbar {
  display: none;
}

.review-session__prompt,
.review-session__workbench {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-elevated) 94%, transparent);
  box-shadow: 0 18px 44px rgba(26, 26, 24, .07);
}

.review-session__prompt {
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.review-session__prompt::after {
  content: "";
  position: absolute;
  top: -72px;
  right: -52px;
  width: 180px;
  height: 180px;
  border: 1px solid color-mix(in srgb, var(--color-warning) 22%, transparent);
  border-radius: 50%;
  pointer-events: none;
}

.review-session__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.review-session__meta span:last-child {
  color: var(--color-warning);
  font-weight: var(--weight-semibold);
}

.review-session__prompt h2 {
  position: relative;
  z-index: 1;
  max-width: 560px;
  margin: 10px 0 20px;
  font-family: var(--font-display);
  font-size: clamp(30px, 8vw, 46px);
  font-weight: var(--weight-regular);
  line-height: 1.18;
}

.review-session__audio {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 0 16px;
  border: 1px solid color-mix(in srgb, var(--color-ink-900) 14%, transparent);
  border-radius: 999px;
  background: var(--color-ink-900);
  color: var(--color-paper-50);
  font: var(--weight-semibold) 12px/1 var(--font-ui);
  cursor: pointer;
}

.review-session__audio:disabled {
  opacity: .45;
  cursor: default;
}

.review-session__workbench {
  margin-top: 12px;
  padding: 18px;
}

.review-session__workbench-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.review-session__workbench-head h2 {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: var(--weight-regular);
}

.review-session__workbench-head > span {
  max-width: 46%;
  overflow: hidden;
  color: var(--color-text-tertiary);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-session__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.review-session__actions button {
  flex: 0 0 auto;
}

.review-session__actions > span {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.review-session__complete {
  max-width: 520px;
  margin: clamp(46px, 12vh, 110px) auto 0;
  text-align: center;
}

.review-session__complete-mark {
  width: 70px;
  height: 70px;
  display: grid;
  place-items: center;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: var(--color-success-soft);
  color: var(--color-success);
}

.review-session__complete h1 {
  margin: 8px 0 12px;
  font-family: var(--font-display);
  font-size: clamp(34px, 9vw, 48px);
  font-weight: var(--weight-regular);
}

.review-session__complete > p:not(.eyebrow) {
  margin: 0 auto 24px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 520px) {
  .review-session__scroll {
    padding-right: 14px;
    padding-left: 14px;
  }

  .review-session__prompt,
  .review-session__workbench {
    border-radius: 16px;
  }

  .review-session__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .review-session__actions button {
    width: 100%;
  }
}
</style>
