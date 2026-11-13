<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { ContentHealth } from '@/api/types'
import SlErrorState from '@/components/ui/SlErrorState.vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import SlSkeleton from '@/components/ui/SlSkeleton.vue'

const health = ref<ContentHealth | null>(null)
const loading = ref(true)
const error = ref('')
const highIssues = computed(
  () => health.value?.issues.filter((issue) => issue.severity === 'HIGH').length ?? 0,
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    health.value = await adminApi.contentHealth()
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
      <div><p class="eyebrow">OPERATIONS</p><h1>内容与运营监控</h1></div>
      <button class="sl-button sl-button--secondary" type="button" @click="load">重新检查</button>
    </header>
    <SlSkeleton v-if="loading" :rows="8" />
    <SlErrorState v-else-if="error" :message="error" title="监控数据暂时不可用" @retry="load" />
    <template v-else-if="health">
      <div class="health-metrics">
        <article><SlIcon name="book-2" :size="20" /><strong>{{ health.publishedCourses }}</strong><span>已发布课时</span></article>
        <article :class="{ 'is-alert': highIssues }"><SlIcon name="task" :size="20" /><strong>{{ highIssues }}</strong><span>高优先级问题</span></article>
        <article><SlIcon name="headphone" :size="20" /><strong>{{ health.duplicateAudioGroups }}</strong><span>重复音频组</span></article>
        <article><SlIcon name="upload-2" :size="20" /><strong>{{ health.orphanObjectCount }}</strong><span>孤立媒体对象</span></article>
      </div>
      <section class="admin-card operations-panel">
        <div class="operations-panel__head"><div><p class="eyebrow">CONTENT HEALTH</p><h2>巡检问题</h2></div><span>{{ health.issues.length }} 项</span></div>
        <div v-if="health.issues.length" class="issue-list">
          <article v-for="(issue, index) in health.issues" :key="`${issue.type}-${index}`" :class="`is-${issue.severity.toLowerCase()}`">
            <span>{{ issue.severity }}</span>
            <div><strong>{{ issue.type }}</strong><p>{{ issue.message }}</p></div>
          </article>
        </div>
        <p v-else class="operations-empty">当前没有发现媒体、字幕或存储异常。</p>
      </section>
      <section class="admin-card operations-panel">
        <div class="operations-panel__head"><div><p class="eyebrow">IMPORT ALERTS</p><h2>近期导入失败</h2></div></div>
        <div v-if="health.failedImports.length" class="audit-list">
          <article v-for="job in health.failedImports" :key="job.id">
            <strong>任务 #{{ job.id }} · {{ job.type === 'CREATE' ? '新建课时' : '重传字幕' }}</strong>
            <span>{{ job.failed }} 项失败 · {{ new Date(job.createdAt).toLocaleString('zh-CN') }}</span>
          </article>
        </div>
        <p v-else class="operations-empty">近期没有失败或部分成功的导入任务。</p>
      </section>
      <section class="admin-card operations-panel">
        <div class="operations-panel__head"><div><p class="eyebrow">AUDIT TRAIL</p><h2>管理操作审计</h2></div><span>最近 {{ health.auditLogs.length }} 条</span></div>
        <div v-if="health.auditLogs.length" class="audit-list">
          <article v-for="log in health.auditLogs" :key="log.id">
            <strong>{{ log.action }} · {{ log.entityType }} #{{ log.entityId || '—' }}</strong>
            <span>{{ log.detail || '无附加信息' }} · {{ new Date(log.createdAt).toLocaleString('zh-CN') }}</span>
          </article>
        </div>
        <p v-else class="operations-empty">还没有管理操作记录。</p>
      </section>
    </template>
  </section>
</template>

<style scoped>
.health-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.health-metrics article {
  display: grid;
  gap: 7px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.health-metrics strong {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: var(--weight-regular);
}

.health-metrics span,
.operations-panel__head > span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.health-metrics article.is-alert {
  border-color: color-mix(in srgb, var(--color-danger) 36%, var(--color-border));
  color: var(--color-danger);
}

.operations-panel {
  display: grid;
  gap: 14px;
  padding: 20px;
  margin-bottom: 16px;
}

.operations-panel__head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.operations-panel h2 {
  margin: 5px 0 0;
  font-family: var(--font-display);
  font-size: 27px;
  font-weight: var(--weight-regular);
}

.issue-list,
.audit-list {
  display: grid;
  gap: 8px;
}

.issue-list article {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 10px;
  padding: 10px;
  border-left: 3px solid var(--color-warning);
  background: var(--color-surface-muted);
}

.issue-list article.is-high {
  border-left-color: var(--color-danger);
}

.issue-list article > span,
.audit-list span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.issue-list p {
  margin: 3px 0 0;
  color: var(--color-text-secondary);
}

.audit-list article {
  display: grid;
  gap: 4px;
  padding: 10px 0;
  border-top: 1px solid var(--color-border);
}

.operations-empty {
  margin: 0;
  color: var(--color-text-secondary);
}

@media (max-width: 760px) {
  .health-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
