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

function issueLink(type: string) {
  if (type.includes('MISSING')) {
    return { to: '/admin/courses?media=MISSING', label: '查看缺失媒体课时' }
  }
  if (type.includes('DUPLICATE')) {
    return { to: '/admin/courses?media=COMPLETE', label: '查看相关课时' }
  }
  return null
}

function issueLabel(type: string) {
  return {
    MISSING_MEDIA: '缺失媒体',
    MISSING_SUBTITLE: '缺失字幕',
    DUPLICATE_AUDIO: '重复音频',
    ORPHAN_MEDIA: '孤立媒体对象',
  }[type] ?? '其他内容问题'
}

function severityLabel(severity: string) {
  return {
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
  }[severity] ?? severity
}

function auditActionLabel(action: string) {
  return {
    BATCH_CONTENT_IMPORT: '批量内容导入',
    RETRY_FAILED_IMPORT: '重试失败导入',
    CREATE_COURSE: '创建课时',
    UPDATE_COURSE: '更新课时',
    PUBLISH_COURSE: '发布课时',
    OFFLINE_COURSE: '下架课时',
    UPDATE_USER_STATUS: '更新用户状态',
  }[action] ?? '管理操作'
}

function auditEntityLabel(entityType: string) {
  return {
    CONTENT_IMPORT_JOB: '导入任务',
    COURSE: '课时',
    BOOK: '书籍',
    USER: '用户',
  }[entityType] ?? '内容'
}

function auditDetailLabel(detail: string | null | undefined) {
  if (!detail) return '无附加信息'
  return detail.replace(/success=(\d+)/g, '成功 $1 项').replace(/failed=(\d+)/g, '失败 $1 项')
}

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
            <span>{{ severityLabel(issue.severity) }}</span>
            <div>
              <strong>{{ issueLabel(issue.type) }}</strong>
              <p>{{ issue.message }}</p>
              <RouterLink v-if="issueLink(issue.type)" :to="issueLink(issue.type)!.to">
                {{ issueLink(issue.type)!.label }}
              </RouterLink>
              <details v-else-if="issue.type === 'ORPHAN_MEDIA'" class="issue-details">
                <summary>查看处理说明</summary>
                <p>请在对象存储控制台核对未被课程引用的对象；当前版本不提供自动删除。</p>
              </details>
            </div>
          </article>
        </div>
        <p v-else class="operations-empty">当前没有发现媒体、字幕或存储异常。</p>
      </section>
      <section class="admin-card operations-panel">
        <div class="operations-panel__head"><div><p class="eyebrow">IMPORT ALERTS</p><h2>近期导入失败</h2></div></div>
        <div v-if="health.failedImports.length" class="audit-list">
          <article v-for="job in health.failedImports" :key="job.id">
            <div>
              <strong>任务 #{{ job.id }} · {{ job.type === 'CREATE' ? '新建课时' : '重传字幕' }}</strong>
              <span>{{ job.failed }} 项失败 · {{ new Date(job.createdAt).toLocaleString('zh-CN') }}</span>
            </div>
            <RouterLink :to="'/admin/imports'">查看任务 #{{ job.id }}</RouterLink>
          </article>
        </div>
        <p v-else class="operations-empty">近期没有失败或部分成功的导入任务。</p>
      </section>
      <section class="admin-card operations-panel">
        <div class="operations-panel__head"><div><p class="eyebrow">AUDIT TRAIL</p><h2>管理操作审计</h2></div><span>最近 {{ health.auditLogs.length }} 条</span></div>
        <div v-if="health.auditLogs.length" class="audit-list">
          <article v-for="log in health.auditLogs" :key="log.id">
            <strong>{{ auditActionLabel(log.action) }} · {{ auditEntityLabel(log.entityType) }} #{{ log.entityId || '—' }}</strong>
            <span>{{ auditDetailLabel(log.detail) }} · {{ new Date(log.createdAt).toLocaleString('zh-CN') }}</span>
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

.issue-list a,
.audit-list a {
  margin-top: 6px;
  color: var(--color-text);
  font-size: 12px;
  font-weight: var(--weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.issue-details {
  margin-top: 7px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.issue-details summary {
  color: var(--color-text);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.issue-details p {
  margin-top: 7px;
}

.audit-list article {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
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
