<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Captions, ChevronRight, Mic, PenLine, Settings2, UserRound } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import AppBottomNav from '@/components/AppBottomNav.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { Profile, StatsResponse } from '@/api/types'
import { useCatalogStore } from '@/stores/catalog'
import { formatStudyDuration, maskPhone } from '@/utils/format'

const router = useRouter()
const catalog = useCatalogStore()
const period = ref<'WEEK' | 'MONTH'>('WEEK')
const profile = ref<Profile | null>(null)
const stats = ref<StatsResponse | null>(null)
const settings = ref<Awaited<ReturnType<typeof learnerApi.settings>> | null>(null)
const error = ref('')

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
  return (stats.value?.days ?? []).map((day, index) => ({
    ...day,
    label: labels[index] ?? '',
    minutes: Math.round(day.studyMs / 60_000),
  }))
})

const maxMinutes = computed(() => Math.max(...weekDays.value.map((day) => day.minutes), 1))

interface CalendarCell {
  key: string
  empty: boolean
  day?: number
  minutes?: number
}

const monthCells = computed<CalendarCell[]>(() => {
  if (!stats.value) return []
  const [year, month] = stats.value.rangeStart.split('-').map(Number)
  const firstWeekday = (new Date(year!, month! - 1, 1).getDay() + 6) % 7
  return [
    ...Array.from({ length: firstWeekday }, (_, index): CalendarCell => ({ key: `empty-${index}`, empty: true })),
    ...stats.value.days.map((day) => ({
      key: day.date,
      empty: false,
      day: Number(day.date.slice(-2)),
      minutes: Math.round(day.studyMs / 60_000),
    })),
  ]
})

async function loadStats() {
  stats.value = await learnerApi.stats(period.value)
}

onMounted(async () => {
  try {
    await catalog.loadInterests()
    ;[profile.value, settings.value] = await Promise.all([learnerApi.profile(), learnerApi.settings()])
    await loadStats()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})

async function changePeriod(next: 'WEEK' | 'MONTH') {
  period.value = next
  await loadStats()
}
</script>

<template>
  <main class="app-screen me-screen">
    <div class="me-scroll">
      <button class="profile-card" type="button" @click="router.push('/me/profile')">
        <span class="profile-card__avatar">
          <img v-if="profile?.avatarUrl" :src="profile.avatarUrl" alt="" />
          <template v-else>{{ profile?.nickname?.slice(0, 1) || 'S' }}</template>
        </span>
        <span class="profile-card__copy">
          <span>PERSONAL PROFILE</span>
          <h2>{{ profile?.nickname || '学习者' }}</h2>
          <p>{{ profile ? maskPhone(profile.phone) : '' }}</p>
        </span>
        <span class="profile-card__edit">
          <PenLine :size="14" />
          编辑资料
        </span>
      </button>

      <section class="settings-shortcuts">
        <button type="button" @click="router.push('/me/profile')">
          <span class="settings-shortcuts__icon"><UserRound :size="18" /></span>
          <span><strong>个人资料</strong><small>头像、昵称和手机号</small></span>
          <ChevronRight :size="18" />
        </button>
        <button type="button" @click="router.push('/me/learning')">
          <span class="settings-shortcuts__icon"><Captions :size="18" /></span>
          <span><strong>学习设置</strong><small>字幕字号、颜色、翻译显示</small></span>
          <span class="settings-shortcuts__meta">{{ translationCount }}/4 中文</span>
          <ChevronRight :size="18" />
        </button>
        <button type="button" @click="router.push('/preferences')">
          <span class="settings-shortcuts__icon"><Settings2 :size="18" /></span>
          <span>
            <strong>学习偏好</strong>
            <small>{{ catalog.interests.length }} 个兴趣分类 · 默认：{{ catalog.interests[0]?.name || '待设置' }}</small>
          </span>
          <ChevronRight :size="18" />
        </button>
      </section>

      <p v-if="error" class="inline-error">{{ error }}</p>

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
            <p class="eyebrow">{{ period === 'WEEK' ? 'THIS WEEK' : 'THIS MONTH' }}</p>
            <h2>{{ period === 'WEEK' ? '本周学习节奏' : '本月学习记录' }}</h2>
          </div>
          <span class="sl-badge sl-badge--success">Asia / Shanghai</span>
        </div>
        <div v-if="period === 'WEEK'" class="week-chart" aria-label="本周学习时长">
          <div v-for="day in weekDays" :key="day.date" class="week-day">
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
        <div v-else class="month-heatmap">
          <span v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day" class="month-weekday">{{ day }}</span>
          <span
            v-for="cell in monthCells"
            :key="cell.key"
            class="month-day"
            :class="cell.empty ? 'is-empty' : `level-${cell.minutes ? (cell.minutes < 20 ? 1 : cell.minutes < 50 ? 2 : 3) : 0}`"
          >
            {{ cell.empty ? '' : cell.day }}
          </span>
        </div>
      </section>

      <section class="skill-summary">
        <article>
          <span class="skill-summary__icon"><PenLine :size="19" /></span>
          <div><strong>{{ stats?.summary.dictationAccuracy || 0 }}%</strong><span>听写正确率</span></div>
          <p>按全部听写尝试计算</p>
        </article>
        <article>
          <span class="skill-summary__icon"><Mic :size="19" /></span>
          <div><strong>{{ stats?.summary.speakingCount || 0 }}</strong><span>跟读次数</span></div>
          <p>每次至少 1 秒</p>
        </article>
      </section>
    </div>
    <AppBottomNav value="me" @navigate="(value) => router.push(value === 'home' ? '/' : '/me')" />
  </main>
</template>
