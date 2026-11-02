<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminCourse, CourseStatus } from '@/api/types'

const router = useRouter()
const courses = ref<AdminCourse[]>([])
const statusFilter = ref<CourseStatus | ''>('')
const query = ref('')
const error = ref('')

async function load() {
  try {
    const response = await adminApi.courses({
      status: statusFilter.value || undefined,
      q: query.value.trim() || undefined,
    })
    courses.value = response.content
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
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
  if (!window.confirm(`确认删除课程「${course.title}」？关联的字幕、收藏和学习记录会一并删除，且无法恢复。`)) return
  try {
    await adminApi.deleteCourse(course.id)
    await load()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

onMounted(load)
</script>

<template>
  <section>
    <header class="admin-page-head">
      <div><p class="eyebrow">CONTENT LIBRARY</p><h1>课程管理</h1></div>
      <button class="sl-button sl-button--accent" type="button" @click="router.push('/admin/courses/new')"><Plus :size="17" /> 新建课程</button>
    </header>
    <div class="admin-actions" style="margin-bottom: 16px">
      <select v-model="statusFilter" class="sl-field__control" style="width: 150px" @change="load">
        <option value="">全部状态</option>
        <option value="DRAFT">草稿</option>
        <option value="PUBLISHED">已发布</option>
        <option value="OFFLINE">已下架</option>
      </select>
      <input v-model="query" class="sl-field__control" style="width: min(320px, 100%)" placeholder="搜索课程名" @keyup.enter="load" />
      <button class="sl-button sl-button--secondary" type="button" @click="load">搜索</button>
    </div>
    <p v-if="error" class="inline-error">{{ error }}</p>
    <div class="admin-card">
      <table class="admin-table">
        <thead><tr><th>课程</th><th>分类</th><th>时长</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="course in courses" :key="course.id">
            <td><strong>{{ course.title }}</strong><br /><small>{{ course.description }}</small></td>
            <td>{{ course.categoryName }}</td>
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
        </tbody>
      </table>
      <p v-if="!courses.length" style="padding: 24px; color: var(--color-text-tertiary)">暂无课程</p>
    </div>
  </section>
</template>
