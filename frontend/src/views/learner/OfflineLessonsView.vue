<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRouter } from 'vue-router'

import SlErrorState from '@/components/ui/SlErrorState.vue'
import { apiErrorMessage } from '@/api/http'
import {
  listOfflineCourses,
  removeOfflineCourse,
  storageEstimate,
  type OfflineCourse,
} from '@/utils/offlineCourse'

const router = useRouter()
const courses = ref<OfflineCourse[]>([])
const usage = ref(0)
const quota = ref(0)
const error = ref('')
const loading = ref(true)
const usedPercent = computed(() => quota.value ? Math.min(100, usage.value / quota.value * 100) : 0)

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(0, Math.round(value / 1024))} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [records, estimate] = await Promise.all([listOfflineCourses(), storageEstimate()])
    courses.value = records.sort(
      (a, b) => Date.parse(b.downloadedAt) - Date.parse(a.downloadedAt),
    )
    usage.value = estimate.usage
    quota.value = estimate.quota
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
}

async function remove(record: OfflineCourse) {
  try {
    await removeOfflineCourse(record.id)
    courses.value = courses.value.filter((item) => item.id !== record.id)
    const estimate = await storageEstimate()
    usage.value = estimate.usage
    quota.value = estimate.quota
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

onMounted(load)
</script>

<template>
  <main class="app-screen settings-screen">
    <header class="settings-header">
      <button class="sl-icon-button" type="button" aria-label="返回" @click="router.back()">
        <SlIcon name="arrow-left" :size="21" />
      </button>
      <h1>离线课程</h1>
      <span />
    </header>
    <div class="offline-scroll">
      <SlErrorState v-if="error" :message="error" title="离线课程暂时不可用" @retry="load" />
      <section class="offline-storage" aria-label="离线存储空间">
        <div><strong>本机离线空间</strong><span>{{ formatBytes(usage) }} / {{ formatBytes(quota) }}</span></div>
        <div class="offline-storage__track"><span :style="{ width: `${usedPercent}%` }" /></div>
        <p>音频和字幕仅保存在当前设备。删除浏览器站点数据会一并清除。</p>
      </section>
      <div v-if="loading" class="offline-empty">正在读取已下载课程…</div>
      <div v-else-if="!courses.length" class="offline-empty">
        <SlIcon name="arrow-down" :size="28" />
        <strong>还没有离线课程</strong>
        <p>在播放器顶部点击下载，即可保存音频与字幕。</p>
      </div>
      <section v-else class="offline-list">
        <article v-for="record in courses" :key="record.id">
          <span class="offline-list__cover" :style="record.course.coverUrl ? { backgroundImage: `url(&quot;${record.course.coverUrl}&quot;)` } : undefined" />
          <div>
            <strong>{{ record.course.title }}</strong>
            <small>{{ formatBytes(record.sizeBytes) }} · {{ new Date(record.downloadedAt).toLocaleDateString('zh-CN') }}</small>
          </div>
          <button class="sl-button sl-button--accent sl-button--sm" type="button" @click="router.push(`/learn/${record.course.bookId}/${record.id}`)">离线学习</button>
          <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="remove(record)">删除</button>
        </article>
      </section>
    </div>
  </main>
</template>

<style scoped>
.offline-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 10px 20px 32px;
}

.offline-storage {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.offline-storage > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.offline-storage span,
.offline-storage p {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.offline-storage p {
  margin: 9px 0 0;
  line-height: 1.5;
}

.offline-storage__track {
  height: 8px;
  overflow: hidden;
  margin-top: 12px;
  border-radius: 99px;
  background: var(--color-surface-muted);
}

.offline-storage__track span {
  display: block;
  height: 100%;
  background: var(--color-ink-700);
}

.offline-list {
  display: grid;
  gap: 9px;
}

.offline-list article {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.offline-list__cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--color-moss-500), var(--color-ink-700));
  background-position: center;
  background-size: cover;
}

.offline-list article > div {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.offline-list small {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.offline-empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: var(--color-text-secondary);
  text-align: center;
}

.offline-empty p {
  margin: 0;
}

@media (max-width: 520px) {
  .offline-list article {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .offline-list article button {
    grid-column: span 1;
  }
}
</style>
