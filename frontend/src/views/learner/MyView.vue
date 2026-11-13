<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRouter } from 'vue-router'

import AppBottomNav from '@/components/AppBottomNav.vue'
import SlDialog from '@/components/ui/SlDialog.vue'
import SlErrorState from '@/components/ui/SlErrorState.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { Profile, ReviewCue, StatsResponse } from '@/api/types'
import { useScrollMemory } from '@/composables/useScrollMemory'
import { useCatalogStore } from '@/stores/catalog'
import { useAuthStore } from '@/stores/auth'
import { formatStudyDuration, maskPhone } from '@/utils/format'

const router = useRouter()
const catalog = useCatalogStore()
const auth = useAuthStore()
const savedPeriod = sessionStorage.getItem('sayline:report-period')
const period = ref<'WEEK' | 'MONTH'>(savedPeriod === 'MONTH' ? 'MONTH' : 'WEEK')
const meScroll = ref<HTMLElement | null>(null)
const profile = ref<Profile | null>(null)
const stats = ref<StatsResponse | null>(null)
const settings = ref<Awaited<ReturnType<typeof learnerApi.settings>> | null>(null)
const reviews = ref<ReviewCue[]>([])
const reviewLoading = ref(false)
const reviewError = ref('')
const showUnmasteredOnly = ref(true)
const sortByWrongCount = ref(true)
const error = ref('')
let latestStatsRequest = 0
const statsLoading = ref(false)
const logoutOpen = ref(false)
const scrollMemory = useScrollMemory(meScroll, () => `me:${period.value}`)

const translationCount = computed(() =>
  settings.value
    ? [
        settings.value.showChineseListen,
        settings.value.showChineseRead,
        settings.value.showChineseWrite,
        settings.value.showChineseSpeak,
      ].filter(Boolean).length
    : 0,
)

const weekDays = computed(() => {
  const labels = ['一', '二', '三', '四', '五', '六', '日']
  const today = shanghaiDate()
  return (stats.value?.days ?? []).map((day, index) => ({
    ...day,
    label: labels[index] ?? '',
    minutes: Math.round(day.studyMs / 60_000),
    today: day.date === today,
  }))
})

const maxMinutes = computed(() => Math.max(...weekDays.value.map((day) => day.minutes), 1))
const weekSummary = computed(() => {
  const total = weekDays.value.reduce((sum, day) => sum + day.minutes, 0)
  const active = weekDays.value.filter((day) => day.minutes > 0)
  const best = Math.max(0, ...weekDays.value.map((day) => day.minutes))
  return `本周共 ${total} 分钟，${active.length} 天有学习，单日最高 ${best} 分钟。`
})
const todayMinutes = computed(() => {
  const today = shanghaiDate()
  return weekDays.value.find((day) => day.date === today)?.minutes ?? 0
})
const dailyGoalMinutes = computed(() => settings.value?.dailyGoalMinutes || 15)
const dailyGoalPercent = computed(() =>
  Math.min(100, Math.round((todayMinutes.value / dailyGoalMinutes.value) * 100)),
)
const dailyGoalRemaining = computed(() =>
  Math.max(0, dailyGoalMinutes.value - todayMinutes.value),
)
const streakDays = computed(() => {
  const byDate = new Map((stats.value?.days ?? []).map((day) => [day.date, day]))
  const cursor = new Date(`${shanghaiDate()}T12:00:00+08:00`)
  if ((byDate.get(shanghaiDate())?.studyMs ?? 0) === 0) cursor.setDate(cursor.getDate() - 1)
  let count = 0
  while (true) {
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(cursor)
    if ((byDate.get(date)?.studyMs ?? 0) === 0) break
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
})
const weeklyGoalPercent = computed(() => {
  const studyMs = (stats.value?.days ?? [])
    .slice(-7)
    .reduce((total, day) => total + day.studyMs, 0)
  return Math.min(100, Math.round(studyMs / (dailyGoalMinutes.value * 7 * 60_000) * 100))
})
const reminderDismissed = ref(localStorage.getItem('sayline:reminder-dismissed') === shanghaiDate())
const reminderDue = computed(() => {
  if (!settings.value?.reminderEnabled || dailyGoalRemaining.value === 0 || reminderDismissed.value) {
    return false
  }
  const reminderTime = settings.value.reminderTime?.slice(0, 5) || '20:00'
  const now = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
  return now >= reminderTime
})
const pendingReviewCount = computed(
  () => reviews.value.filter((review) => review.status !== 'MASTERED').length,
)
const displayedReviews = computed(() => {
  const items = showUnmasteredOnly.value
    ? reviews.value.filter((review) => review.status !== 'MASTERED')
    : [...reviews.value]
  return items.sort((a, b) => sortByWrongCount.value
    ? b.wrongCount - a.wrongCount
    : Date.parse(b.lastWrongAt) - Date.parse(a.lastWrongAt))
})

interface CalendarCell {
  key: string
  empty: boolean
  day?: number
  minutes?: number
  date?: string
  today?: boolean
}

const monthCells = computed<CalendarCell[]>(() => {
  if (!stats.value) return []
  const [year, month] = stats.value.rangeStart.split('-').map(Number)
  const firstWeekday = (new Date(year!, month! - 1, 1).getDay() + 6) % 7
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return [
    ...Array.from({ length: firstWeekday }, (_, index): CalendarCell => ({ key: `empty-${index}`, empty: true })),
    ...stats.value.days.map((day) => ({
      key: day.date,
      empty: false,
      day: Number(day.date.slice(-2)),
      minutes: Math.round(day.studyMs / 60_000),
      date: day.date,
      today: day.date === today,
    })),
  ]
})

const monthTitle = computed(() => {
  if (!stats.value) return '本月'
  return new Intl.DateTimeFormat('zh-CN', { month: 'long' }).format(
    new Date(`${stats.value.rangeStart}T00:00:00+08:00`),
  )
})

function monthDayClass(cell: CalendarCell) {
  if (cell.empty) return 'is-empty'
  const level = cell.minutes
    ? cell.minutes < 20
      ? 1
      : cell.minutes < 50
        ? 2
        : 3
    : 0
  return [`level-${level}`, { 'is-today': cell.today }]
}

async function loadStats() {
  const request = ++latestStatsRequest
  statsLoading.value = true
  try {
    const response = await learnerApi.stats(period.value)
    if (request === latestStatsRequest) {
      stats.value = response
    }
  } finally {
    if (request === latestStatsRequest) {
      statsLoading.value = false
    }
  }
}

onMounted(async () => {
  try {
    await catalog.loadInterests()
    ;[profile.value, settings.value] = await Promise.all([learnerApi.profile(), learnerApi.settings()])
    await loadStats()
    await scrollMemory.restore()
    scrollMemory.attach()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
  void loadReviews()
})

function goTab(value: 'home' | 'me') {
  router.push(value === 'home' ? '/' : '/me')
}

async function changePeriod(next: 'WEEK' | 'MONTH') {
  if (next === period.value && stats.value) return
  period.value = next
  sessionStorage.setItem('sayline:report-period', next)
  error.value = ''
  const request = ++latestStatsRequest
  statsLoading.value = true
  try {
    const response = await learnerApi.stats(next)
    if (request === latestStatsRequest) {
      stats.value = response
    }
  } catch (reason) {
    if (request === latestStatsRequest) {
      error.value = apiErrorMessage(reason)
    }
  } finally {
    if (request === latestStatsRequest) {
      statsLoading.value = false
    }
  }
}

async function loadReviews() {
  reviewLoading.value = true
  reviewError.value = ''
  try {
    reviews.value = await learnerApi.reviews(true)
  } catch (reason) {
    reviewError.value = apiErrorMessage(reason)
  } finally {
    reviewLoading.value = false
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
    reviewError.value = apiErrorMessage(reason)
  }
}

function reviewDueLabel(review: ReviewCue) {
  if (review.status === 'MASTERED') return '已掌握'
  if (review.status === 'SNOOZED' && review.nextReviewAt) {
    return `复习到期 · ${new Date(review.nextReviewAt).toLocaleDateString('zh-CN')}`
  }
  return `错 ${review.wrongCount} 次 · 建议今天复习`
}

function dismissReminder() {
  reminderDismissed.value = true
  localStorage.setItem('sayline:reminder-dismissed', shanghaiDate())
}

function openReview(review: ReviewCue) {
  router.push(`/learn/${review.bookId}/${review.courseId}?cue=${review.cueId}&mode=WRITE`)
}

function shanghaiDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

async function logout() {
  await auth.logout()
  await router.replace('/login')
}
</script>

<template>
  <main class="app-screen me-screen">
    <div ref="meScroll" class="me-scroll">
      <button class="profile-card" type="button" @click="router.push('/me/profile')">
        <span class="profile-card__avatar">
          <img v-if="profile?.avatarUrl" :src="profile.avatarUrl" alt="" />
          <template v-else>{{ profile?.nickname?.slice(0, 1) || 'S' }}</template>
        </span>
        <span class="profile-card__copy">
          <span>个人资料</span>
          <h2>{{ profile?.nickname || '学习者' }}</h2>
          <p>{{ profile ? maskPhone(profile.phone) : '' }}</p>
        </span>
        <span class="profile-card__edit">
          <SlIcon name="pen-nib" :size="14" />
          编辑资料
        </span>
      </button>

      <div v-if="reminderDue" class="study-reminder" role="status">
        <span><SlIcon name="time" :size="18" /> 今天还差 {{ dailyGoalRemaining }} 分钟完成目标。</span>
        <button type="button" @click="router.push('/me/learning')">去学习</button>
        <button type="button" aria-label="关闭今日提醒" @click="dismissReminder"><SlIcon name="close" :size="16" /></button>
      </div>

      <section class="settings-shortcuts">
        <div class="profile-insights" aria-label="学习概览">
          <span><strong>{{ dailyGoalPercent }}%</strong><small>今日目标</small></span>
          <span><strong>{{ streakDays }} 天</strong><small>连续学习</small></span>
          <span><strong>{{ pendingReviewCount }}</strong><small>待复习</small></span>
        </div>
        <button type="button" @click="router.push('/me/learning')">
          <span class="settings-shortcuts__icon"><SlIcon name="closed-captioning" :size="18" /></span>
          <span><strong>学习设置</strong><small>字幕字号、颜色、翻译显示</small></span>
          <span class="settings-shortcuts__meta">{{ translationCount }}/4 中文</span>
          <SlIcon name="arrow-right-s" :size="18" />
        </button>
        <button type="button" @click="router.push('/me/offline')">
          <span class="settings-shortcuts__icon"><SlIcon name="arrow-down" :size="18" /></span>
          <span><strong>离线课程</strong><small>管理已下载音频、字幕和存储空间</small></span>
          <SlIcon name="arrow-right-s" :size="18" />
        </button>
        <button type="button" @click="router.push('/preferences')">
          <span class="settings-shortcuts__icon"><SlIcon name="settings-3" :size="18" /></span>
          <span>
            <strong>学习偏好</strong>
            <small>{{ catalog.interests.length }} 个兴趣分类 · 默认：{{ catalog.interests[0]?.name || '待设置' }}</small>
          </span>
          <SlIcon name="arrow-right-s" :size="18" />
        </button>
      </section>

      <section class="daily-goal-card" aria-label="今日学习目标">
        <div class="daily-goal-card__head">
          <div>
            <p class="eyebrow">TODAY</p>
            <h2>今日目标</h2>
          </div>
          <strong>{{ todayMinutes }} / {{ dailyGoalMinutes }} 分钟</strong>
        </div>
        <div
          class="daily-goal-card__track"
          role="progressbar"
          aria-label="今日学习目标进度"
          :aria-valuenow="todayMinutes"
          aria-valuemin="0"
          :aria-valuemax="dailyGoalMinutes"
        >
          <span :style="{ width: `${dailyGoalPercent}%` }" />
        </div>
        <p>
          {{ dailyGoalRemaining > 0 ? `再学 ${dailyGoalRemaining} 分钟即可完成今天的目标。` : '今天的目标已完成，继续保持。' }}
        </p>
        <small class="daily-goal-card__week">本周目标完成率 {{ weeklyGoalPercent }}%</small>
      </section>

      <section class="review-section">
        <div class="review-section__head">
          <div>
            <p class="eyebrow">REVIEW</p>
            <h2>错句复习</h2>
          </div>
          <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="router.push('/me/learning')">
            调整目标
          </button>
        </div>
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
        <div v-if="reviewLoading" class="review-loading">正在整理最近错句…</div>
        <SlErrorState
          v-else-if="reviewError"
          :message="reviewError"
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
                <small>{{ review.bookTitle }} · {{ reviewDueLabel(review) }}</small>
              </span>
              <SlIcon name="arrow-right-s" :size="18" />
            </button>
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
          </article>
        </div>
        <p v-else class="review-empty">
          {{ reviews.length ? '当前筛选下没有待复习内容。' : '最近没有错句。继续学习后，错句会自动出现在这里。' }}
        </p>
      </section>

      <SlErrorState
        v-if="error"
        :message="error"
        title="学习数据暂时没有加载出来"
        @retry="router.go(0)"
      />

      <div class="study-summary-line">
        <span>学习统计</span>
        <em>{{ stats?.summary.studyDays || 0 }} 天有学习</em>
      </div>

      <div class="period-switch">
        <div class="sl-tabs sl-tabs--pill">
          <button class="sl-tab" type="button" :aria-selected="period === 'WEEK'" @click="changePeriod('WEEK')">本周</button>
          <button class="sl-tab" type="button" :aria-selected="period === 'MONTH'" @click="changePeriod('MONTH')">本月</button>
        </div>
      </div>

      <section class="report-summary">
        <article class="sl-stat-tile"><strong class="sl-stat-tile__value">{{ stats?.summary.studyDays || 0 }}</strong><span class="sl-stat-tile__label">学习天数</span></article>
        <article class="sl-stat-tile"><strong class="sl-stat-tile__value">{{ stats?.summary.sessions || 0 }}</strong><span class="sl-stat-tile__label">学习次数</span></article>
        <article class="sl-stat-tile"><strong class="sl-stat-tile__value">{{ formatStudyDuration(stats?.summary.studyMs || 0) }}</strong><span class="sl-stat-tile__label">学习时长</span></article>
      </section>

      <section class="report-card">
        <div class="report-card__head">
          <div>
            <p class="eyebrow">{{ period === 'WEEK' ? '本周' : '本月' }}</p>
            <h2>{{ period === 'WEEK' ? '本周学习节奏' : `${monthTitle}学习记录` }}</h2>
          </div>
          <span
            class="sl-badge"
            :class="stats?.summary.studyDays ? 'sl-badge--success' : ''"
          >
            {{ stats?.summary.studyDays ? '有学习' : '待开始' }}
          </span>
        </div>
        <div
          v-if="!statsLoading && period === 'WEEK'"
          class="week-chart"
          role="img"
          :aria-label="weekSummary"
        >
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="week-day"
            :class="{ 'is-today': day.today }"
            :aria-label="`星期${day.label}，学习 ${day.minutes} 分钟`"
          >
            <span class="week-day__value">{{ day.minutes }}</span>
            <div class="week-day__track">
              <span
                class="week-day__bar"
                :class="{ 'has-study': day.minutes > 0 }"
                :style="{ height: `${day.minutes ? Math.max(14, (day.minutes / maxMinutes) * 100) : 3}%` }"
              />
            </div>
            <span>{{ day.label }}</span>
          </div>
        </div>
        <div v-else-if="!statsLoading" class="month-heatmap">
          <span v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day" class="month-weekday">{{ day }}</span>
          <span
            v-for="cell in monthCells"
            :key="cell.key"
            class="month-day"
            :class="monthDayClass(cell)"
            :aria-label="cell.empty ? undefined : `${cell.day} 日，学习 ${cell.minutes || 0} 分钟`"
          >
            {{ cell.empty ? '' : cell.day }}
          </span>
        </div>
        <div v-if="statsLoading" class="report-loading">正在整理学习记录…</div>
        <p v-if="!statsLoading && period === 'WEEK'" class="report-card__summary">
          {{ weekSummary }}
        </p>
        <div class="report-card__legend">
          <template v-if="period === 'MONTH'">
            <span>少</span>
            <i class="legend-0" />
            <i class="legend-1" />
            <i class="legend-2" />
            <i class="legend-3" />
            <span>多</span>
          </template>
          <span v-else-if="stats">{{ stats.rangeStart }} — {{ stats.rangeEnd }}</span>
        </div>
      </section>

      <section class="skill-summary">
        <article>
          <span class="skill-summary__icon"><SlIcon name="pencil" :size="19" /></span>
          <div><strong>{{ stats?.summary.dictationAccuracy || 0 }}%</strong><span>听写正确率</span></div>
          <p>按全部听写尝试计算</p>
        </article>
        <article>
          <span class="skill-summary__icon"><SlIcon name="chat-3" :size="19" /></span>
          <div><strong>{{ stats?.summary.speakingCount || 0 }}</strong><span>跟读次数</span></div>
          <p>每次至少 1 秒</p>
        </article>
      </section>

      <section class="account-session">
        <div>
          <strong>账号与安全</strong>
          <span>退出后会清理本机用户缓存，不会删除学习记录。</span>
        </div>
        <button class="sl-button sl-button--ghost" type="button" @click="logoutOpen = true">
          退出登录
        </button>
      </section>
    </div>
    <AppBottomNav value="me" @navigate="goTab" />

    <SlDialog
      :open="logoutOpen"
      title="退出登录？"
      eyebrow="ACCOUNT"
      description="退出后会移除本机缓存的收藏、最近学习和播放状态。"
      @close="logoutOpen = false"
    >
      <template #actions>
        <button class="sl-button sl-button--secondary" type="button" @click="logoutOpen = false">取消</button>
        <button class="sl-button sl-button--danger" type="button" @click="logout">确认退出</button>
      </template>
    </SlDialog>
  </main>
</template>

<style scoped>
.month-heatmap {
  width: min(100%, 440px);
  grid-auto-rows: 30px;
  gap: 6px 9px;
  margin: 14px auto 0;
}

.month-weekday {
  align-self: end;
  padding-bottom: 0;
  font-size: 10px;
}

.month-day {
  width: 30px;
  height: 30px;
  aspect-ratio: auto;
  justify-self: center;
  border-radius: 7px;
  font-size: 10px;
}

.report-card__legend {
  min-height: 24px;
  margin-top: 8px;
}

.report-loading {
  min-height: 210px;
  display: grid;
  place-items: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
}

.account-session {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 28px 0 10px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.account-session > div {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 5px;
}

.account-session > button {
  flex: 0 0 auto;
  white-space: nowrap;
}

.account-session strong {
  font-size: var(--text-body-sm);
}

.account-session span {
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
  line-height: 1.5;
}

.daily-goal-card,
.review-section {
  margin-top: 14px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.daily-goal-card__head,
.review-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.daily-goal-card h2,
.review-section h2 {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: var(--weight-regular);
}

.daily-goal-card__head > strong {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.daily-goal-card__track {
  height: 7px;
  overflow: hidden;
  margin-top: 15px;
  border-radius: 99px;
  background: var(--color-surface-muted);
}

.daily-goal-card__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-moss-500), var(--color-action));
}

.study-reminder {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0;
  padding: 11px 13px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-warning-soft);
  color: var(--color-text);
  font-size: 13px;
}

.study-reminder span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.study-reminder button {
  min-height: 44px;
  padding: 0 9px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
}

.study-reminder span + button {
  margin-left: auto;
}

.daily-goal-card p,
.review-empty {
  margin: 9px 0 0;
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
  line-height: 1.5;
}

.daily-goal-card__week {
  display: block;
  margin-top: 5px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.review-list {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.review-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 13px;
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

.review-item {
  width: 100%;
  display: grid;
  gap: 6px;
  padding: 9px 4px;
  border-top: 1px solid var(--color-border);
}

.review-item__open {
  min-height: 64px;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.review-item__actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
}

.review-item__actions button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 11px;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.review-item__actions button:disabled {
  opacity: .45;
  cursor: default;
}

.review-item__count {
  width: 28px;
  height: 28px;
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
  gap: 4px;
}

.review-item__copy strong,
.review-item__copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-item__copy strong {
  font-size: 13px;
}

.review-item__copy small {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.review-loading {
  padding: 24px 0 10px;
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
}

.report-card__summary {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-caption);
  line-height: 1.5;
}
</style>
