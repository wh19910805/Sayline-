<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import SlErrorState from '@/components/ui/SlErrorState.vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import SlSkeleton from '@/components/ui/SlSkeleton.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { ReviewCue } from '@/api/types'

const router = useRouter()
const reviews = ref<ReviewCue[]>([])
const loading = ref(true)
const error = ref('')
const showUnmasteredOnly = ref(true)
const sortByWrongCount = ref(true)

const pendingCount = computed(
  () => reviews.value.filter((review) => review.status !== 'MASTERED').length,
)
const masteredCount = computed(
  () => reviews.value.filter((review) => review.status === 'MASTERED').length,
)
const displayedReviews = computed(() => {
  const items = showUnmasteredOnly.value
    ? reviews.value.filter((review) => review.status !== 'MASTERED')
    : [...reviews.value]
  return items.sort((a, b) => sortByWrongCount.value
    ? b.wrongCount - a.wrongCount
    : Date.parse(b.lastWrongAt) - Date.parse(a.lastWrongAt))
})

async function loadReviews() {
  loading.value = true
  error.value = ''
  try {
    reviews.value = await learnerApi.reviews(true)
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
}

async function updateReviewState(review: ReviewCue, status: ReviewCue['status']) {
  const nextReviewAt = status === 'SNOOZED'
    ? new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString()
    : undefined
  try {
    await learnerApi.updateReview(review.cueId, { status, nextReviewAt })
    reviews.value = reviews.value.map((item) =>
      item.cueId === review.cueId
        ? { ...item, status, nextReviewAt: nextReviewAt ?? null, due: status !== 'SNOOZED' }
        : item,
    )
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

function reviewDueLabel(review: ReviewCue) {
  if (review.status === 'MASTERED') return '已掌握'
  if (review.status === 'SNOOZED' && review.nextReviewAt) {
    return `复习到期 · ${new Date(review.nextReviewAt).toLocaleDateString('zh-CN')}`
  }
  return `错 ${review.wrongCount} 次 · 建议今天复习`
}

function openReview(review: ReviewCue) {
  router.push(`/learn/${review.bookId}/${review.courseId}?cue=${review.cueId}&mode=WRITE`)
}

onMounted(loadReviews)
</script>

<template>
  <main class="app-screen review-screen">
    <header class="settings-header">
      <button class="sl-icon-button" type="button" aria-label="返回" @click="router.back()">
        <SlIcon name="arrow-left" :size="21" />
      </button>
      <h1>错句复习</h1>
      <span class="review-header-count">{{ pendingCount }} 句</span>
    </header>

    <div class="review-scroll">
      <section class="review-overview">
        <div>
          <p class="eyebrow">REVIEW QUEUE</p>
          <h2>{{ pendingCount }} 句待复习</h2>
          <p>错误越多的句子越靠前。打开句子后会直接进入对应的写作位置。</p>
        </div>
        <span v-if="masteredCount" class="review-mastered-count">{{ masteredCount }} 已掌握</span>
      </section>

      <div class="review-controls" role="group" aria-label="复习队列筛选">
        <button
          type="button"
          :aria-pressed="showUnmasteredOnly"
          @click="showUnmasteredOnly = !showUnmasteredOnly"
        >
          <SlIcon name="check" :size="15" />
          只看未掌握
        </button>
        <button
          type="button"
          :aria-pressed="sortByWrongCount"
          @click="sortByWrongCount = !sortByWrongCount"
        >
          <SlIcon name="line-chart" :size="15" />
          按错误次数
        </button>
      </div>

      <SlSkeleton v-if="loading" :rows="7" />
      <SlErrorState
        v-else-if="error"
        :message="error"
        title="复习队列暂时不可用"
        @retry="loadReviews"
      />
      <div v-else-if="displayedReviews.length" class="review-list">
        <article
          v-for="review in displayedReviews"
          :key="`${review.courseId}-${review.cueId}`"
          class="review-item"
        >
          <button
            class="review-item__open"
            type="button"
            :aria-label="`复习 ${review.englishText}`"
            @click="openReview(review)"
          >
            <span class="review-item__count">{{ review.wrongCount }}</span>
            <span class="review-item__copy">
              <strong lang="en">{{ review.englishText }}</strong>
              <span lang="zh">{{ review.chineseText }}</span>
              <small>{{ review.bookTitle }} · {{ review.courseTitle }} · 第 {{ review.sequenceNo }} 句</small>
            </span>
            <SlIcon name="arrow-right-s" :size="18" />
          </button>
          <div class="review-item__footer">
            <span>{{ reviewDueLabel(review) }}</span>
            <div class="review-item__actions">
              <button
                type="button"
                :disabled="review.status === 'MASTERED'"
                @click="updateReviewState(review, 'MASTERED')"
              >
                <SlIcon name="check" :size="16" />
                已掌握
              </button>
              <button
                type="button"
                :disabled="review.status === 'SNOOZED'"
                @click="updateReviewState(review, 'SNOOZED')"
              >
                <SlIcon name="time" :size="16" />
                稍后复习
              </button>
            </div>
          </div>
        </article>
      </div>
      <p v-else class="review-empty">
        {{ reviews.length ? '当前筛选下没有待复习内容。' : '最近没有错句。继续学习后，错句会自动出现在这里。' }}
      </p>
    </div>
  </main>
</template>

<style scoped>
.review-screen {
  background: var(--app-bg);
}

.review-header-count {
  min-width: 48px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  text-align: right;
  white-space: nowrap;
}

.review-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px calc(28px + var(--safe-bottom));
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.review-scroll::-webkit-scrollbar {
  display: none;
}

.review-overview {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 92% 12%, var(--color-warning-soft), transparent 46%),
    var(--color-bg-elevated);
}

.review-overview h2 {
  margin: 5px 0 7px;
  font-family: var(--font-display);
  font-size: 27px;
  font-weight: var(--weight-regular);
}

.review-overview p:last-child {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.review-mastered-count {
  flex: 0 0 auto;
  padding: 6px 9px;
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success);
  font-size: 10px;
  font-weight: var(--weight-semibold);
  white-space: nowrap;
}

.review-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 12px 0;
}

.review-controls button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 11px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.review-controls button[aria-pressed="true"] {
  border-color: var(--color-ink-900);
  background: var(--color-ink-900);
  color: var(--color-paper-50);
}

.review-list {
  display: grid;
  gap: 9px;
}

.review-item {
  padding: 10px 12px 9px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  box-shadow: 0 5px 16px rgba(26, 26, 24, .04);
}

.review-item__open {
  width: 100%;
  min-height: 70px;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 20px;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.review-item__count {
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-warning-soft);
  color: var(--color-warning);
  font-size: 11px;
  font-weight: var(--weight-bold);
}

.review-item__copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.review-item__copy strong,
.review-item__copy > span,
.review-item__copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-item__copy strong {
  font-size: 14px;
}

.review-item__copy > span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.review-item__copy small {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.review-item__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 5px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

.review-item__footer > span {
  color: var(--color-text-tertiary);
  font-size: 10px;
  white-space: nowrap;
}

.review-item__actions {
  display: flex;
  gap: 6px;
}

.review-item__actions button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 9px;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: 11px;
  cursor: pointer;
}

.review-item__actions button:disabled {
  opacity: .45;
  cursor: default;
}

.review-empty {
  padding: 42px 12px;
  color: var(--color-text-tertiary);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 420px) {
  .review-item__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .review-item__actions {
    width: 100%;
  }

  .review-item__actions button {
    flex: 1;
    justify-content: center;
  }
}
</style>
