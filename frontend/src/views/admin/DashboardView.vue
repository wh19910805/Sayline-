<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { Dashboard } from '@/api/types'
import { formatStudyDuration } from '@/utils/format'

const dashboard = ref<Dashboard | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    dashboard.value = await adminApi.dashboard()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})
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
    <p v-if="error" class="inline-error">{{ error }}</p>
    <div v-if="dashboard" class="admin-metrics">
      <article class="admin-metric">
        <SlIcon name="group" :size="21" />
        <strong>{{ dashboard.totalLearners }}</strong>
        <span>学习者总数 · 今日活跃 {{ dashboard.activeToday }}</span>
      </article>
      <article class="admin-metric">
        <SlIcon name="book-2" :size="21" />
        <strong>{{ dashboard.totalPublishedCourses }}</strong>
        <span>已发布课程 · {{ dashboard.courseStarts }} 次开始学习</span>
      </article>
      <article class="admin-metric">
        <SlIcon name="line-chart" :size="21" />
        <strong>{{ dashboard.completionRate }}%</strong>
        <span>课程完成率 · {{ dashboard.completedCourses }} 门完成</span>
      </article>
      <article class="admin-metric">
        <SlIcon name="time" :size="21" />
        <strong>{{ formatStudyDuration(dashboard.totalStudyMs) }}</strong>
        <span>累计学习时长</span>
      </article>
    </div>
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
