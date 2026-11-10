<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminBook, AdminCategory } from '@/api/types'
import SlTable from '@/components/ui/SlTable.vue'
import { resolveContentType } from '@/utils/uploadContentType'

const books = ref<AdminBook[]>([])
const categories = ref<AdminCategory[]>([])
const error = ref('')
const loading = ref(false)
const saving = ref(false)
const formOpen = ref(false)
const editingId = ref<number | null>(null)
const uploading = ref(false)
const form = reactive({
  categoryId: 0,
  title: '',
  description: '',
  coverObjectKey: '',
  themeColorPrimary: '#4f5b47',
  themeColorSecondary: '#8f8e88',
  sortOrder: 0,
  visible: true,
})

async function load() {
  loading.value = true
  try {
    const [bookPage, categoryPage] = await Promise.all([
      adminApi.books(),
      adminApi.categories(0, 100),
    ])
    books.value = bookPage.content
    categories.value = categoryPage.content
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    categoryId: categories.value[0]?.id ?? 0,
    title: '',
    description: '',
    coverObjectKey: '',
    themeColorPrimary: '#4f5b47',
    themeColorSecondary: '#8f8e88',
    sortOrder: 0,
    visible: true,
  })
  formOpen.value = true
}

function openEdit(book: AdminBook) {
  editingId.value = book.id
  Object.assign(form, {
    categoryId: book.categoryId,
    title: book.title,
    description: book.description || '',
    coverObjectKey: book.coverObjectKey || '',
    themeColorPrimary: book.themeColorPrimary || '#4f5b47',
    themeColorSecondary: book.themeColorSecondary || '#8f8e88',
    sortOrder: book.sortOrder,
    visible: book.visible,
  })
  formOpen.value = true
}

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const contentType = resolveContentType(file, 'COVER')
    const presigned = await adminApi.presignUpload({
      kind: 'COVER',
      fileName: file.name,
      contentType,
      sizeBytes: file.size,
    })
    const uploadResponse = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    })
    if (!uploadResponse.ok) throw new Error('封面上传失败')
    form.coverObjectKey = presigned.objectKey
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    uploading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    await adminApi.saveBook({ ...form }, editingId.value ?? undefined)
    formOpen.value = false
    await load()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    saving.value = false
  }
}

async function remove(book: AdminBook) {
  if (!window.confirm(`确认删除课程「${book.title}」？`)) return
  try {
    await adminApi.deleteBook(book.id)
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
      <button class="sl-button sl-button--accent" type="button" @click="openCreate"><SlIcon name="add" :size="17" /> 新建课程</button>
    </header>
    <p v-if="error" class="inline-error">{{ error }}</p>
    <div class="admin-card">
      <SlTable :loading="loading" :empty="!books.length" empty-title="暂无课程" empty-description="还没有课程，点右上角新建">
        <template #head><tr><th>课程名</th><th>分类</th><th>排序</th><th>状态</th><th>操作</th></tr></template>
        <tr v-for="book in books" :key="book.id">
          <td><strong>{{ book.title }}</strong><br /><small>{{ book.description }}</small></td>
          <td>{{ book.categoryName }}</td>
          <td>{{ book.sortOrder }}</td>
          <td><span class="sl-badge" :class="{ 'sl-badge--warning': !book.visible }">{{ book.visible ? '可见' : '已隐藏' }}</span></td>
          <td>
            <div class="admin-actions">
              <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="openEdit(book)">编辑</button>
              <button class="sl-button sl-button--danger sl-button--sm" type="button" @click="remove(book)">删除</button>
            </div>
          </td>
        </tr>
      </SlTable>
    </div>

    <div v-if="formOpen" class="admin-modal">
      <div class="admin-modal__card">
        <header><h2>{{ editingId ? '编辑课程' : '新建课程' }}</h2><button class="sl-icon-button" type="button" aria-label="关闭" @click="formOpen = false">×</button></header>
        <form class="admin-form" @submit.prevent="save">
          <div class="admin-form-grid">
            <label class="sl-field">
              <span class="sl-field__label">课程名</span>
              <input v-model="form.title" class="sl-field__control" required maxlength="120" />
            </label>
            <label class="sl-field">
              <span class="sl-field__label">所属分类</span>
              <select v-model.number="form.categoryId" class="sl-field__control" required>
                <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
              </select>
            </label>
          </div>
          <label class="sl-field">
            <span class="sl-field__label">简介</span>
            <textarea v-model="form.description" class="sl-field__control" />
          </label>
          <div class="admin-form-grid">
            <label class="sl-field"><span class="sl-field__label">主色</span><input v-model="form.themeColorPrimary" class="sl-field__control" type="color" /></label>
            <label class="sl-field"><span class="sl-field__label">辅助色</span><input v-model="form.themeColorSecondary" class="sl-field__control" type="color" /></label>
            <label class="sl-field"><span class="sl-field__label">排序</span><input v-model.number="form.sortOrder" class="sl-field__control" type="number" min="0" /></label>
            <label class="sl-checkbox" style="align-self: end"><input v-model="form.visible" type="checkbox" /> 可见</label>
          </div>
          <label class="admin-upload">
            <strong><SlIcon name="upload-2" :size="15" /> 封面</strong>
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="upload" />
            <span>{{ uploading ? '上传中…' : form.coverObjectKey || 'JPG / PNG / WebP' }}</span>
          </label>
          <div class="admin-actions">
            <button class="sl-button sl-button--secondary" type="button" @click="formOpen = false">取消</button>
            <button class="sl-button sl-button--accent" type="submit" :disabled="saving">保存</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
