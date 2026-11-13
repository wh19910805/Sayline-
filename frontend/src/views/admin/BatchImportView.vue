<script setup lang="ts">
import SparkMD5 from 'spark-md5'
import { computed, onMounted, ref } from 'vue'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type {
  AdminBook,
  ImportItem,
  ImportItemStatus,
  ImportItemView,
  ImportJob,
  ImportPreview,
  ImportType,
} from '@/api/types'
import SlDialog from '@/components/ui/SlDialog.vue'
import SlErrorState from '@/components/ui/SlErrorState.vue'
import SlIcon from '@/components/ui/SlIcon.vue'

interface ImportRow {
  key: string
  sourceName: string
  title: string
  audio?: File
  subtitle?: File
  durationMs: number
}

const type = ref<ImportType>('CREATE')
const bookId = ref<number | ''>('')
const rows = ref<ImportRow[]>([])
const preview = ref<ImportPreview | null>(null)
const result = ref<ImportJob | null>(null)
const jobs = ref<ImportJob[]>([])
const books = ref<AdminBook[]>([])
const rollbackTarget = ref<ImportJob | null>(null)
const error = ref('')
const loading = ref(false)
const preparing = ref(false)
const executing = ref(false)
const progressText = ref('')
const ignoredCount = ref(0)

const readyCount = computed(() => preview.value?.ready ?? 0)
const canExecute = computed(
  () =>
    !!preview.value &&
    readyCount.value > 0 &&
    (type.value === 'SUBTITLE' || bookId.value !== '') &&
    !executing.value,
)

const statusLabel: Record<ImportItemStatus, string> = {
  READY: '可导入',
  DUPLICATE: '已跳过',
  INVALID: '需修复',
  UNCHANGED: '无变化',
  CREATED: '已创建',
  UPDATED: '已更新',
  FAILED: '失败',
}

const statusIcon: Record<ImportItemStatus, string> = {
  READY: 'check',
  DUPLICATE: 'history',
  INVALID: 'close',
  UNCHANGED: 'time',
  CREATED: 'check',
  UPDATED: 'check',
  FAILED: 'close',
}

function fileKey(file: File) {
  const path = file.webkitRelativePath || file.name
  return path.replace(/\.(mp3|srt)$/i, '').toLowerCase()
}

function displayName(file: File) {
  return (file.webkitRelativePath || file.name).replace(/\.(mp3|srt)$/i, '')
}

function baseTitle(file: File) {
  return file.name.replace(/\.(mp3|srt)$/i, '').trim()
}

function hashFile(file: File) {
  return file.arrayBuffer().then((buffer) => SparkMD5.ArrayBuffer.hash(buffer))
}

function audioDuration(file: File) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    const timeout = window.setTimeout(() => finish(0), 2_000)
    const finish = (durationMs: number) => {
      window.clearTimeout(timeout)
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(durationMs) ? Math.round(durationMs) : 0)
    }
    audio.addEventListener('loadedmetadata', () => finish(audio.duration * 1000), { once: true })
    audio.addEventListener('error', () => finish(0), { once: true })
    audio.src = url
  })
}

async function chooseFiles(event: Event) {
  const selected = [...((event.target as HTMLInputElement).files ?? [])]
  const accepted = selected.filter((file) => {
    const relativePath = (file.webkitRelativePath || file.name).replaceAll('\\', '/')
    if (!/\.(mp3|srt)$/i.test(file.name)) return false
    if (relativePath.split('/').some((segment) => segment.startsWith('.'))) return false
    return !/\.(orig|zh|en)\.srt$/i.test(file.name)
  })
  ignoredCount.value = selected.length - accepted.length
  const grouped = new Map<string, ImportRow>()
  for (const file of accepted) {
    const key = fileKey(file)
    const row = grouped.get(key) ?? {
      key,
      sourceName: displayName(file),
      title: baseTitle(file),
      durationMs: 0,
    }
    if (/\.mp3$/i.test(file.name)) row.audio = file
    if (/\.srt$/i.test(file.name)) row.subtitle = file
    grouped.set(key, row)
  }
  rows.value = [...grouped.values()].sort((a, b) => a.sourceName.localeCompare(b.sourceName, 'zh-CN'))
  preview.value = null
  result.value = null
  error.value = ''
  ;(event.target as HTMLInputElement).value = ''
  await Promise.all(
    rows.value.map(async (row) => {
      row.durationMs = row.audio ? await audioDuration(row.audio) : 0
    }),
  )
}

async function buildItems() {
  return Promise.all(
    rows.value.map(async (row): Promise<ImportItem> => ({
      sourceName: row.sourceName,
      title: row.title,
      audioMd5: row.audio ? await hashFile(row.audio) : null,
      subtitleMd5: row.subtitle ? await hashFile(row.subtitle) : null,
      audioObjectKey: null,
      subtitleObjectKey: null,
      courseId: null,
      durationMs: row.durationMs,
    })),
  )
}

async function runPreview() {
  if (!rows.value.length) {
    error.value = '请先选择包含 MP3 和 SRT 的文件夹'
    return
  }
  if (type.value === 'CREATE' && bookId.value === '') {
    error.value = '新建课时前请选择目标书籍'
    return
  }
  preparing.value = true
  error.value = ''
  result.value = null
  try {
    progressText.value = '正在计算文件校验值…'
    const items = await buildItems()
    progressText.value = '正在检查同名课时与重复音频…'
    preview.value = await adminApi.previewImport({
      type: type.value,
      bookId: bookId.value || null,
      items,
    })
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    preparing.value = false
    progressText.value = ''
  }
}

function contentType(file: File) {
  return /\.mp3$/i.test(file.name) ? 'audio/mpeg' : 'application/x-subrip'
}

async function upload(file: File, kind: 'AUDIO' | 'SUBTITLE') {
  const mime = contentType(file)
  const presigned = await adminApi.presignUpload({
    kind,
    fileName: file.name,
    contentType: mime,
    sizeBytes: file.size,
  })
  const response = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mime },
    body: file,
  })
  if (!response.ok) throw new Error(`${file.name} 上传失败`)
  return presigned.objectKey
}

async function execute() {
  if (!preview.value || !canExecute.value) return
  executing.value = true
  error.value = ''
  try {
    const items = await buildItems()
    const previewItems = preview.value.items
    const readyIndexes = new Set(
      previewItems
        .filter((item) => item.status === 'READY')
        .map((item) => item.index),
    )
    let completed = 0
    for (const index of readyIndexes) {
      const row = rows.value[index]
      const item = items[index]
      if (!row || !item) continue
      if (type.value === 'SUBTITLE') {
        item.courseId = previewItems[index]?.courseId ?? null
      }
      progressText.value = `正在上传 ${++completed} / ${readyIndexes.size}：${row.title}`
      if (type.value === 'CREATE' && row.audio) {
        item.audioObjectKey = await upload(row.audio, 'AUDIO')
      }
      if (row.subtitle) {
        item.subtitleObjectKey = await upload(row.subtitle, 'SUBTITLE')
      }
    }
    progressText.value = '正在写入课程…'
    result.value = await adminApi.executeImport({
      type: type.value,
      bookId: bookId.value || null,
      resetLearning: type.value === 'SUBTITLE',
      items,
    })
    preview.value = null
    await loadJobs()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    executing.value = false
    progressText.value = ''
  }
}

async function loadJobs() {
  try {
    jobs.value = (await adminApi.imports()).content
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

async function confirmRollback() {
  if (!rollbackTarget.value) return
  loading.value = true
  try {
    const updated = await adminApi.rollbackImport(rollbackTarget.value.id)
    jobs.value = jobs.value.map((job) => (job.id === updated.id ? updated : job))
    if (result.value?.id === updated.id) result.value = updated
    rollbackTarget.value = null
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
}

function reset() {
  rows.value = []
  preview.value = null
  result.value = null
  error.value = ''
}

function reportReason(item: ImportItemView) {
  return item.error || item.reason || (item.courseTitle ? `匹配：${item.courseTitle}` : '等待执行')
}

onMounted(async () => {
  try {
    books.value = (await adminApi.books()).content
    await loadJobs()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})
</script>

<template>
  <section class="batch-import">
    <header class="admin-page-head">
      <div>
        <p class="eyebrow">BATCH CONTENT</p>
        <h1>批量导入</h1>
        <p class="batch-import__lead">自动配对同目录的 MP3 与 SRT，预览后再写入课程。</p>
      </div>
    </header>

    <SlErrorState v-if="error" :message="error" title="导入流程暂时中断" @retry="runPreview" />

    <div class="admin-card batch-import__panel">
      <div class="import-step">
        <span class="import-step__number">1</span>
        <div>
          <h2>选择任务</h2>
          <p>字幕重传会替换现有版本；新建课时会在检查通过后直接发布。</p>
        </div>
      </div>
      <div class="import-options">
        <label class="import-choice" :class="{ 'is-selected': type === 'CREATE' }">
          <input v-model="type" type="radio" value="CREATE" name="import-type" @change="preview = null; result = null" />
          <strong>新建课时</strong>
          <span>按书名、课时名和音频 MD5 去重</span>
        </label>
        <label class="import-choice" :class="{ 'is-selected': type === 'SUBTITLE' }">
          <input v-model="type" type="radio" value="SUBTITLE" name="import-type" @change="preview = null; result = null" />
          <strong>批量重传字幕</strong>
          <span>按音频 MD5 匹配课时，未变化字幕自动跳过</span>
        </label>
        <label v-if="type === 'CREATE'" class="import-book">
          <span>目标书籍</span>
          <select v-model="bookId" class="sl-field__control" @change="preview = null">
            <option value="">请选择书籍</option>
            <option v-for="book in books" :key="book.id" :value="book.id">{{ book.title }}</option>
          </select>
        </label>
      </div>
    </div>

    <div class="admin-card batch-import__panel">
      <div class="import-step">
        <span class="import-step__number">2</span>
        <div>
          <h2>配对文件</h2>
          <p>优先选择整个文件夹；也可多选文件。文件名相同即视为一组。</p>
        </div>
      </div>
      <div class="import-pickers">
        <label class="sl-button sl-button--secondary import-picker">
          <SlIcon name="upload-2" :size="18" />
          选择文件夹
          <input type="file" multiple webkitdirectory accept=".mp3,.srt" @change="chooseFiles" />
        </label>
        <label class="sl-button sl-button--ghost import-picker">
          <SlIcon name="add" :size="18" />
          选择文件
          <input type="file" multiple data-testid="import-files" accept=".mp3,.srt" @change="chooseFiles" />
        </label>
        <button v-if="rows.length" class="sl-button sl-button--ghost" type="button" @click="reset">清空</button>
      </div>
      <p v-if="ignoredCount" class="import-filter-note">
        已自动忽略 {{ ignoredCount }} 个隐藏目录、说明文件或 .orig/.zh/.en 辅助字幕。
      </p>

      <div v-if="rows.length" class="pair-summary" aria-live="polite">
        <span><SlIcon name="headphone" :size="17" /> {{ rows.filter((row) => row.audio).length }} 个 MP3</span>
        <span><SlIcon name="closed-captioning" :size="17" /> {{ rows.filter((row) => row.subtitle).length }} 个 SRT</span>
        <span>{{ rows.length }} 组待检查</span>
      </div>
      <div v-if="rows.length" class="pair-list">
        <div v-for="row in rows" :key="row.key" class="pair-row">
          <strong>{{ row.title }}</strong>
          <span :class="{ 'is-missing': !row.audio }"><SlIcon :name="row.audio ? 'check' : 'close'" :size="15" /> MP3</span>
          <span :class="{ 'is-missing': !row.subtitle }"><SlIcon :name="row.subtitle ? 'check' : 'close'" :size="15" /> SRT</span>
          <small>{{ row.sourceName }}</small>
        </div>
      </div>

      <div class="import-submit">
        <button class="sl-button sl-button--accent" type="button" :disabled="!rows.length || preparing" @click="runPreview">
          <SlIcon name="search" :size="17" />
          {{ preparing ? '正在检查…' : '导入前预览' }}
        </button>
        <span aria-live="polite">{{ progressText }}</span>
      </div>
    </div>

    <div v-if="preview" class="admin-card batch-import__panel">
      <div class="import-step">
        <span class="import-step__number">3</span>
        <div>
          <h2>确认预览</h2>
          <p>只有标记为“可导入”的项目会上传并写入。</p>
        </div>
      </div>
      <div class="preview-summary" aria-label="导入预览汇总">
        <strong>{{ preview.ready }} 可导入</strong>
        <span>{{ preview.skipped }} 跳过</span>
        <span>{{ preview.invalid }} 需修复</span>
      </div>
      <div class="import-report" role="table" aria-label="导入预览明细">
        <div class="import-report__head" role="row">
          <span role="columnheader">文件 / 课时</span>
          <span role="columnheader">状态</span>
          <span role="columnheader">检查结果</span>
        </div>
        <div v-for="item in preview.items" :key="item.index" class="import-report__row" role="row">
          <span role="cell">
            <strong>{{ item.title }}</strong>
            <small>{{ item.sourceName }}</small>
          </span>
          <span role="cell">
            <span class="import-status" :class="`is-${item.status.toLowerCase()}`">
              <SlIcon :name="statusIcon[item.status]" :size="15" />
              {{ statusLabel[item.status] }}
            </span>
          </span>
          <span role="cell">{{ reportReason(item) }}</span>
        </div>
      </div>
      <div class="import-execute">
        <button class="sl-button sl-button--accent" type="button" :disabled="!canExecute" @click="execute">
          <SlIcon name="upload-2" :size="17" />
          {{ executing ? '正在执行导入…' : `执行导入（${readyCount}）` }}
        </button>
      </div>
    </div>

    <div v-if="result" class="admin-card batch-import__panel import-result" aria-live="polite">
      <div>
        <p class="eyebrow">IMPORT RESULT</p>
        <h2>任务 #{{ result.id }} 已完成</h2>
        <p>成功 {{ result.success }}，跳过 {{ result.skipped }}，失败 {{ result.failed }}。</p>
      </div>
      <div class="import-report" role="table" aria-label="导入执行结果">
        <div v-for="item in result.items" :key="item.index" class="import-report__row" role="row">
          <span role="cell"><strong>{{ item.title }}</strong><small>{{ item.sourceName }}</small></span>
          <span role="cell">
            <span class="import-status" :class="`is-${item.status.toLowerCase()}`">
              <SlIcon :name="statusIcon[item.status]" :size="15" />
              {{ statusLabel[item.status] }}
            </span>
          </span>
          <span role="cell">{{ reportReason(item) }}</span>
        </div>
      </div>
    </div>

    <section class="import-history">
      <div class="import-history__head">
        <div><p class="eyebrow">JOB HISTORY</p><h2>导入记录</h2></div>
        <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="loadJobs">刷新</button>
      </div>
      <div v-if="!jobs.length" class="admin-card import-history__empty">还没有批量导入记录。</div>
      <article v-for="job in jobs" v-else :key="job.id" class="admin-card import-job">
        <div>
          <strong>#{{ job.id }} · {{ job.type === 'CREATE' ? '新建课时' : '重传字幕' }}</strong>
          <p>{{ new Date(job.createdAt).toLocaleString('zh-CN') }} · 成功 {{ job.success }} / 跳过 {{ job.skipped }} / 失败 {{ job.failed }}</p>
        </div>
        <span class="import-status" :class="job.status === 'ROLLED_BACK' ? 'is-invalid' : 'is-ready'">{{ job.status === 'ROLLED_BACK' ? '已回滚' : '已完成' }}</span>
        <button
          v-if="job.status !== 'ROLLED_BACK' && job.success > 0"
          class="sl-button sl-button--ghost sl-button--sm"
          type="button"
          @click="rollbackTarget = job"
        >
          回滚
        </button>
      </article>
    </section>

    <SlDialog
      :open="!!rollbackTarget"
      title="回滚这次导入？"
      eyebrow="ROLLBACK IMPORT"
      :description="`将撤销任务 #${rollbackTarget?.id ?? ''} 中成功导入的内容。新建的课时会被删除，字幕会恢复到导入前版本。`"
      @close="rollbackTarget = null"
    >
      <template #actions>
        <button class="sl-button sl-button--secondary" type="button" @click="rollbackTarget = null">取消</button>
        <button class="sl-button sl-button--danger" type="button" :disabled="loading" @click="confirmRollback">
          {{ loading ? '正在回滚…' : '确认回滚' }}
        </button>
      </template>
    </SlDialog>
  </section>
</template>

<style scoped>
.batch-import {
  display: grid;
  gap: 18px;
}

.batch-import__lead {
  max-width: 60ch;
  margin: 8px 0 0;
  color: var(--color-text-secondary);
}

.batch-import__panel {
  display: grid;
  gap: 18px;
}

.import-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.import-step h2,
.import-history h2,
.import-result h2 {
  margin: 0;
  font-size: 20px;
}

.import-step p,
.import-result p {
  margin: 5px 0 0;
  color: var(--color-text-secondary);
}

.import-step__number {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--color-ink-900);
  color: var(--color-surface);
  font-weight: 700;
}

.import-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.import-choice {
  position: relative;
  display: grid;
  gap: 5px;
  min-height: 84px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.import-choice.is-selected {
  border-color: var(--color-action);
  background: color-mix(in srgb, var(--color-action) 7%, var(--color-surface));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-action) 16%, transparent);
}

.import-choice input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.import-choice span {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.import-choice:has(input:focus-visible) {
  outline: 2px solid var(--color-action);
  outline-offset: 3px;
}

.import-book {
  grid-column: 1 / -1;
  display: grid;
  gap: 7px;
  max-width: 420px;
  font-weight: 600;
}

.import-book select {
  min-height: 44px;
}

.import-pickers,
.import-submit,
.import-execute,
.pair-summary,
.preview-summary,
.import-history__head,
.import-job {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.import-filter-note {
  margin: -6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.import-picker {
  position: relative;
  min-height: 44px;
  cursor: pointer;
}

.import-picker input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.pair-summary,
.preview-summary {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
}

.pair-summary span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pair-list,
.import-report {
  display: grid;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.pair-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) auto auto minmax(140px, 1fr);
  align-items: center;
  gap: 14px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--color-border);
}

.pair-row:last-child,
.import-report__row:last-child {
  border-bottom: 0;
}

.pair-row span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-success);
  font-weight: 650;
}

.pair-row span.is-missing,
.import-status.is-invalid,
.import-status.is-failed {
  color: var(--color-danger);
}

.pair-row small {
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}

.import-report__head,
.import-report__row {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) 140px minmax(180px, 1fr);
  gap: 16px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
}

.import-report__head {
  background: var(--color-surface-muted);
  font-weight: 700;
}

.import-report__row > span:first-child {
  display: grid;
  gap: 3px;
}

.import-report__row small {
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}

.import-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  min-height: 28px;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--color-surface-muted);
  font-size: 13px;
  font-weight: 700;
}

.import-status.is-ready,
.import-status.is-created,
.import-status.is-updated {
  color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 11%, var(--color-surface));
}

.import-status.is-duplicate,
.import-status.is-unchanged {
  color: var(--color-text-secondary);
}

.import-submit {
  justify-content: space-between;
}

.import-submit span {
  color: var(--color-text-secondary);
}

.import-execute {
  justify-content: flex-end;
}

.import-result {
  border-color: color-mix(in srgb, var(--color-success) 36%, var(--color-border));
}

.import-history {
  display: grid;
  gap: 10px;
}

.import-history__head,
.import-job {
  justify-content: space-between;
}

.import-history__empty {
  color: var(--color-text-secondary);
}

.import-job p {
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

@media (max-width: 760px) {
  .import-options {
    grid-template-columns: 1fr;
  }

  .pair-row {
    grid-template-columns: 1fr auto auto;
  }

  .pair-row small {
    grid-column: 1 / -1;
  }

  .import-report__head {
    display: none;
  }

  .import-report__row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
