<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminBook, AdminCourse, CourseStatus } from '@/api/types'
import SlDialog from '@/components/ui/SlDialog.vue'
import SlErrorState from '@/components/ui/SlErrorState.vue'
import SlTable from '@/components/ui/SlTable.vue'

const router = useRouter()
const courses = ref<AdminCourse[]>([])
const books = ref<AdminBook[]>([])
const bookFilter = ref<number | ''>('')
const statusFilter = ref<CourseStatus | ''>('')
const query = ref('')
const page = ref(0)
const totalPages = ref(1)
const totalElements = ref(0)
const error = ref('')
const loading = ref(false)
const deleteTarget = ref<AdminCourse | null>(null)
const selectedIds = ref<number[]>([])
const batchTarget = ref<'PUBLISHED' | 'OFFLINE' | null>(null)
const batchSaving = ref(false)
const allSelected = computed(
  () => courses.value.length > 0 && courses.value.every((course) => selectedIds.value.includes(course.id)),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await adminApi.courses({
      bookId: bookFilter.value || undefined,
      status: statusFilter.value || undefined,
      q: query.value.trim() || undefined,
      page: page.value,
    })
    courses.value = response.content
    totalPages.value = response.totalPages
    totalElements.value = response.totalElements
    selectedIds.value = []
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
}

async function loadBooks() {
  try {
    books.value = (await adminApi.books()).content
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

function goPage(next: number) {
  page.value = next
  load()
}

function toggleAll() {
  selectedIds.value = allSelected.value ? [] : courses.value.map((course) => course.id)
}

function toggleCourse(id: number) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((value) => value !== id)
    : [...selectedIds.value, id]
}

async function publish(course: AdminCourse) {
  try {
    await adminApi.publishCourse(course.id)
    await load()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

async function offline(course: AdminCourse) {
  try {
    await adminApi.offlineCourse(course.id)
    await load()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

function remove(course: AdminCourse) {
  deleteTarget.value = course
}

async function confirmRemove() {
  if (!deleteTarget.value) return
  try {
    await adminApi.deleteCourse(deleteTarget.value.id)
    deleteTarget.value = null
    await load()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

async function confirmBatchStatus() {
  if (!batchTarget.value || !selectedIds.value.length) return
  batchSaving.value = true
  try {
    await adminApi.batchCourseStatus(selectedIds.value, batchTarget.value)
    batchTarget.value = null
    await load()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    batchSaving.value = false
  }
}

function mediaLabel(course: AdminCourse) {
  if (course.audioObjectKey && course.subtitleObjectKey) return '音频、字幕完整'
  if (!course.audioObjectKey && !course.subtitleObjectKey) return '缺少音频和字幕'
  return course.audioObjectKey ? '缺少字幕' : '缺少音频'
}

function dateLabel(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('zh-CN') : '暂无'
}

onMounted(() => {
  loadBooks()
  load()
})
</script>

<template>
  <section>
    <header class="admin-page-head">
      <div><p class="eyebrow">CONTENT LIBRARY</p><h1>课时管理</h1></div>
      <div class="admin-actions">
        <button class="sl-button sl-button--secondary" type="button" @click="router.push('/admin/imports')">
          <SlIcon name="upload-2" :size="17" /> 批量导入
        </button>
        <button class="sl-button sl-button--accent" type="button" @click="router.push('/admin/courses/new')">
          <SlIcon name="add" :size="17" /> 新建课时
        </button>
      </div>
    </header>
    <div class="admin-actions" style="margin-bottom: 16px">
      <select v-model="bookFilter" class="sl-field__control" style="width: 150px" @change="page = 0; load()">
        <option value="">全部书籍</option>
        <option v-for="book in books" :key="book.id" :value="book.id">{{ book.title }}</option>
      </select>
      <select v-model="statusFilter" class="sl-field__control" style="width: 150px" @change="page = 0; load()">
        <option value="">全部状态</option>
        <option value="DRAFT">草稿</option>
        <option value="PUBLISHED">已发布</option>
        <option value="OFFLINE">已下架</option>
      </select>
      <input v-model="query" class="sl-field__control" style="width: min(320px, 100%)" placeholder="搜索课时名" @keyup.enter="page = 0; load()" />
      <button class="sl-button sl-button--secondary" type="button" @click="page = 0; load()">搜索</button>
    </div>
    <div v-if="selectedIds.length" class="admin-batch-bar" aria-live="polite">
      <strong>已选择 {{ selectedIds.length }} 个课时</strong>
      <button class="sl-button sl-button--secondary sl-button--sm" type="button" @click="batchTarget = 'PUBLISHED'">批量发布</button>
      <button class="sl-button sl-button--danger sl-button--sm" type="button" @click="batchTarget = 'OFFLINE'">批量下架</button>
    </div>
    <SlErrorState v-if="error" :message="error" title="课时列表暂时不可用" @retry="load" />
    <div class="admin-card">
      <SlTable :loading="loading" :empty="!courses.length" empty-title="暂无课时" empty-description="批量导入多节课程，或点右上角新建">
        <template #head>
          <tr>
            <th><input type="checkbox" :checked="allSelected" aria-label="选择全部课时" @change="toggleAll" /></th>
            <th>课时</th>
            <th>媒体</th>
            <th>状态</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </template>
        <tr v-for="course in courses" :key="course.id">
          <td><input type="checkbox" :checked="selectedIds.includes(course.id)" :aria-label="`选择 ${course.title}`" @change="toggleCourse(course.id)" /></td>
          <td>
            <div class="admin-course-cell">
              <span
                class="admin-course-cover"
                :style="course.coverUrl ? { backgroundImage: `url(&quot;${course.coverUrl}&quot;)` } : undefined"
              />
              <span><strong>{{ course.title }}</strong><small>{{ course.bookName }} · {{ Math.round(course.durationMs / 1000) }} 秒</small></span>
            </div>
          </td>
          <td>
            <span class="media-state" :class="{ 'is-incomplete': !course.audioObjectKey || !course.subtitleObjectKey }">
              <SlIcon :name="course.audioObjectKey && course.subtitleObjectKey ? 'check' : 'close'" :size="14" />
              {{ mediaLabel(course) }}
            </span>
          </td>
          <td>
            <span class="sl-badge" :class="{ 'sl-badge--success': course.status === 'PUBLISHED', 'sl-badge--warning': course.status === 'DRAFT' }">
              {{ course.status === 'PUBLISHED' ? '已发布' : course.status === 'DRAFT' ? '草稿' : '已下架' }}
            </span>
          </td>
          <td>{{ dateLabel(course.updatedAt) }}</td>
          <td>
            <div class="admin-actions">
              <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="router.push(`/admin/courses/${course.id}/edit`)">编辑</button>
              <details class="admin-row-menu">
                <summary class="sl-button sl-button--secondary sl-button--sm" aria-label="更多课时操作">
                  更多 <SlIcon name="arrow-down-s" :size="15" />
                </summary>
                <div class="admin-row-menu__panel">
                  <button v-if="course.status !== 'PUBLISHED'" type="button" @click="publish(course)">发布课时</button>
                  <button v-else type="button" @click="offline(course)">下架课时</button>
                  <button type="button" @click="router.push(`/admin/courses/${course.id}/edit`)">调整排序与媒体</button>
                  <button v-if="course.status !== 'PUBLISHED'" class="is-danger" type="button" @click="remove(course)">删除课时</button>
                </div>
              </details>
            </div>
          </td>
        </tr>
      </SlTable>
    </div>

    <div class="admin-pagination">
      <button class="sl-button sl-button--secondary sl-button--sm" type="button" :disabled="page === 0" @click="goPage(page - 1)">上一页</button>
      <span>第 {{ page + 1 }} / {{ totalPages }} 页 · 共 {{ totalElements }} 个</span>
      <button class="sl-button sl-button--secondary sl-button--sm" type="button" :disabled="page >= totalPages - 1" @click="goPage(page + 1)">下一页</button>
    </div>

    <SlDialog
      :open="!!deleteTarget"
      title="删除这个课时？"
      eyebrow="DELETE LESSON"
      :description="`将永久删除「${deleteTarget?.title ?? ''}」及其字幕、收藏和学习记录，且无法恢复。已发布课时需先下架。`"
      @close="deleteTarget = null"
    >
      <template #actions>
        <button class="sl-button sl-button--secondary" type="button" @click="deleteTarget = null">取消</button>
        <button class="sl-button sl-button--danger" type="button" @click="confirmRemove">确认删除</button>
      </template>
    </SlDialog>
    <SlDialog
      :open="batchTarget !== null"
      :title="batchTarget === 'PUBLISHED' ? '批量发布课时？' : '批量下架课时？'"
      eyebrow="BATCH COURSE STATUS"
      :description="`将${batchTarget === 'PUBLISHED' ? '发布' : '下架'}已选择的 ${selectedIds.length} 个课时。媒体不完整的课时不会被发布。`"
      @close="batchTarget = null"
    >
      <template #actions>
        <button class="sl-button sl-button--secondary" type="button" @click="batchTarget = null">取消</button>
        <button class="sl-button" :class="batchTarget === 'PUBLISHED' ? 'sl-button--accent' : 'sl-button--danger'" type="button" :disabled="batchSaving" @click="confirmBatchStatus">
          {{ batchSaving ? '处理中…' : batchTarget === 'PUBLISHED' ? '确认发布' : '确认下架' }}
        </button>
      </template>
    </SlDialog>
  </section>
</template>

<style scoped>
.admin-course-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.admin-course-cover {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 7px;
  background: linear-gradient(135deg, var(--color-moss-500), var(--color-ink-700));
  background-position: center;
  background-size: cover;
}

.admin-course-cell > span:last-child {
  display: grid;
  gap: 3px;
}

.admin-course-cell small {
  color: var(--color-text-tertiary);
}

.media-state {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-success);
  font-size: 12px;
}

.media-state.is-incomplete {
  color: var(--color-danger);
}

.admin-row-menu {
  position: relative;
}

.admin-row-menu summary {
  list-style: none;
  cursor: pointer;
}

.admin-row-menu summary::-webkit-details-marker {
  display: none;
}

.admin-row-menu__panel {
  position: absolute;
  z-index: 20;
  right: 0;
  top: calc(100% + 6px);
  min-width: 160px;
  display: grid;
  padding: 5px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-float);
}

.admin-row-menu__panel button {
  min-height: 44px;
  padding: 0 11px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.admin-row-menu__panel button:hover,
.admin-row-menu__panel button:focus-visible {
  background: var(--color-surface-muted);
}

.admin-row-menu__panel .is-danger {
  color: var(--color-danger);
}
</style>
