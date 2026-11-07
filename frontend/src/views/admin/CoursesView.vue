<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminBook, AdminCourse, CourseStatus } from '@/api/types'
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

async function load() {
  loading.value = true
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
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
}

async function loadBooks() {
  try {
    const response = await adminApi.books()
    books.value = response.content
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

function goPage(next: number) {
  page.value = next
  load()
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

async function remove(course: AdminCourse) {
  if (!window.confirm(`确认删除课时「${course.title}」？关联的字幕、收藏和学习记录会一并删除，且无法恢复。`)) return
  try {
    await adminApi.deleteCourse(course.id)
    await load()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
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
      <button class="sl-button sl-button--accent" type="button" @click="router.push('/admin/courses/new')"><Plus :size="17" /> 新建课时</button>
    </header>
    <div class="admin-actions" style="margin-bottom: 16px">
      <select v-model="bookFilter" class="sl-field__control" style="width: 150px" @change="page = 0; load()">
        <option value="">全部课程</option>
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
    <p v-if="error" class="inline-error">{{ error }}</p>
    <div class="admin-card">
      <SlTable :loading="loading" :empty="!courses.length" empty-title="暂无课时" empty-description="还没有课时，点右上角新建">
        <template #head><tr><th>课时</th><th>所属课程</th><th>时长</th><th>状态</th><th>操作</th></tr></template>
        <tr v-for="course in courses" :key="course.id">
          <td><strong>{{ course.title }}</strong><br /><small>{{ course.description }}</small></td>
          <td>{{ course.bookName }}</td>
          <td>{{ Math.round(course.durationMs / 1000) }}s</td>
          <td>
            <span class="sl-badge" :class="{ 'sl-badge--success': course.status === 'PUBLISHED', 'sl-badge--warning': course.status === 'DRAFT' }">
              {{ course.status === 'PUBLISHED' ? '已发布' : course.status === 'DRAFT' ? '草稿' : '已下架' }}
            </span>
          </td>
          <td>
            <div class="admin-actions">
              <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="router.push(`/admin/courses/${course.id}/edit`)">编辑</button>
              <button v-if="course.status !== 'PUBLISHED'" class="sl-button sl-button--secondary sl-button--sm" type="button" @click="publish(course)">发布</button>
              <button v-else class="sl-button sl-button--ghost sl-button--sm" type="button" @click="offline(course)">下架</button>
              <button v-if="course.status !== 'PUBLISHED'" class="sl-button sl-button--danger sl-button--sm" type="button" @click="remove(course)">删除</button>
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
  </section>
</template>
