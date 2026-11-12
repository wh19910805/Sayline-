<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { Dashboard } from '@/api/types'
import SlErrorState from '@/components/ui/SlErrorState.vue'
import SlSkeleton from '@/components/ui/SlSkeleton.vue'
import { formatStudyDuration } from '@/utils/format'

const dashboard = ref<Dashboard | null>(null)
const error = ref('')
const loading = ref(true)

const trend = computed(() => {
  const days = dashboard.value?.studyTrend ?? []
  const max = Math.max(1, ...days.map((day) => day.studyMs))
  return days.map((day) => ({
    ...day,
    label: new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(
      new Date(`${day.date}T00:00:00+08:00`),
    ),
    minutes: Math.round(day.studyMs / 60_000),
    height: Math.max(4, Math.round((day.studyMs / max) * 100)),
  }))
})

const trendSummary = computed(() => {
  const total = trend.value.reduce((sum, day) => sum + day.minutes, 0)
  const best = trend.value.reduce(
    (current, day) => (day.studyMs > current.studyMs ? day : current),
    trend.value[0] ?? { date: '', studyMs: 0, learners: 0, label: '', minutes: 0, height: 0 },
  )
  return `近七日共学习 ${total} 分钟，最高一天为 ${best.minutes} 分钟、${best.learners} 名学习者。`
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    dashboard.value = await adminApi.dashboard()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section>
    <header class="admin-page-head">
      <div>
        <p class="eyebrow">OVERVIEW</p>
        <h1>学习正在发生。</h1>
      </div>
      <span class="sl-badge sl-badge--success">Asia / Shanghai</span>
    </header>
    <SlSkeleton v-if="loading" :rows="7" />
    <SlErrorState
      v-else-if="error"
      :message="error"
      title="看板数据暂时没有加载出来"
      @retry="load"
    />
    <div v-if="dashboard" class="admin-metrics">
      <article class="admin-metric">
        <SlIcon name="group" :size="21" />
        <strong>{{ dashboard.totalLearners }}</strong>
        <span>学习者总数 · 今日活跃 {{ dashboard.activeToday }}</span>
      </article>
      <article class="admin-metric">
        <SlIcon name="book-2" :size="21" />
        <strong>{{ dashboard.totalPublishedCourses }}</strong>
        <span>已发布课时 · {{ dashboard.courseStarts }} 次开始学习</span>
      </article>
      <article class="admin-metric">
        <SlIcon name="line-chart" :size="21" />
        <strong>{{ dashboard.completionRate }}%</strong>
        <span>课时完成率 · {{ dashboard.completedCourses }} 门完成</span>
      </article>
      <article class="admin-metric">
        <SlIcon name="time" :size="21" />
        <strong>{{ formatStudyDuration(dashboard.totalStudyMs) }}</strong>
        <span>累计学习时长</span>
      </article>
    </div>
    <section v-if="dashboard" class="admin-card admin-trend">
      <div class="admin-trend__head">
        <div>
          <p class="eyebrow">LAST 7 DAYS</p>
          <h2>七日学习趋势</h2>
        </div>
        <span>{{ trendSummary }}</span>
      </div>
      <div class="admin-trend__chart" role="img" :aria-label="trendSummary">
        <div
          v-for="day in trend"
          :key="day.date"
          class="admin-trend__day"
          :aria-label="`${day.date}，${day.learners} 名学习者，学习 ${day.minutes} 分钟`"
        >
          <strong>{{ day.minutes }}</strong>
          <div class="admin-trend__track">
            <span :style="{ height: `${day.height}%` }" />
          </div>
          <small>{{ day.label }}</small>
        </div>
      </div>
    </section>
    <div v-if="dashboard" class="admin-card" style="padding: 22px">
      <div class="admin-form-grid">
        <article>
          <p class="eyebrow">DICTATION</p>
          <h2 style="font-family: var(--font-display); font-size: 38px; margin: 8px 0 0">{{ dashboard.dictationAccuracy }}%</h2>
          <p style="color: var(--color-text-tertiary)">全站听写正确率</p>
        </article>
        <article>
          <p class="eyebrow">SPEAKING</p>
          <h2 style="font-family: var(--font-display); font-size: 38px; margin: 8px 0 0">{{ dashboard.speakingCount }}</h2>
          <p style="color: var(--color-text-tertiary)">已完成跟读句次</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-trend {
  padding: 20px;
}

.admin-trend__head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.admin-trend__head h2 {
  margin: 5px 0 0;
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: var(--weight-regular);
}

.admin-trend__head > span {
  max-width: 420px;
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
  line-height: 1.5;
  text-align: right;
}

.admin-trend__chart {
  height: 190px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-top: 20px;
}

.admin-trend__day {
  min-width: 0;
  display: grid;
  grid-template-rows: 18px 1fr 18px;
  justify-items: center;
  gap: 5px;
}

.admin-trend__day strong,
.admin-trend__day small {
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.admin-trend__track {
  width: min(100%, 34px);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  border-radius: 8px 8px 3px 3px;
  background: var(--color-surface-muted);
}

.admin-trend__track span {
  width: 100%;
  border-radius: inherit;
  background: linear-gradient(180deg, var(--color-moss-500), var(--color-ink-700));
}

@media (max-width: 700px) {
  .admin-trend__head {
    align-items: start;
    flex-direction: column;
  }

  .admin-trend__head > span {
    text-align: left;
  }

  .admin-trend__chart {
    gap: 5px;
  }
}
</style>
