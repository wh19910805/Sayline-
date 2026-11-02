<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, Trash2, Upload } from 'lucide-vue-next'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminCategory } from '@/api/types'
import { resolveContentType } from '@/utils/uploadContentType'

const categories = ref<AdminCategory[]>([])
const editingId = ref<number | null>(null)
const formOpen = ref(false)
const error = ref('')
const uploading = ref(false)
const form = reactive({
  name: '',
  description: '',
  coverObjectKey: '',
  themeColorPrimary: '#4f5b47',
  themeColorSecondary: '#d9b56e',
  sortOrder: 0,
  visible: true,
})

async function load() {
  try {
    categories.value = await adminApi.categories()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    name: '',
    description: '',
    coverObjectKey: '',
    themeColorPrimary: '#4f5b47',
    themeColorSecondary: '#d9b56e',
    sortOrder: categories.value.length,
    visible: true,
  })
  formOpen.value = true
}

function openEdit(category: AdminCategory) {
  editingId.value = category.id
  Object.assign(form, {
    name: category.name,
    description: category.description || '',
    coverObjectKey: category.coverObjectKey || '',
    themeColorPrimary: category.themeColorPrimary || '#4f5b47',
    themeColorSecondary: category.themeColorSecondary || '#d9b56e',
    sortOrder: category.sortOrder,
    visible: category.visible,
  })
  formOpen.value = true
}

async function save() {
  error.value = ''
  try {
    await adminApi.saveCategory(form, editingId.value ?? undefined)
    formOpen.value = false
    await load()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

async function uploadCover(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  error.value = ''
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
    if (!uploadResponse.ok) throw new Error('文件上传失败')
    form.coverObjectKey = presigned.objectKey
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    uploading.value = false
  }
}

async function remove(category: AdminCategory) {
  if (!window.confirm(`确定删除“${category.name}”吗？有关联课程时只能隐藏。`)) return
  try {
    await adminApi.deleteCategory(category.id)
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
      <div><p class="eyebrow">CONTENT STRUCTURE</p><h1>课程分类</h1></div>
      <button class="sl-button sl-button--accent" type="button" @click="openCreate"><Plus :size="17" /> 新建分类</button>
    </header>
    <p v-if="error" class="inline-error">{{ error }}</p>
    <div class="admin-card">
      <table class="admin-table">
        <thead><tr><th>排序</th><th>分类</th><th>颜色</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id">
            <td>{{ category.sortOrder }}</td>
            <td><strong>{{ category.name }}</strong><br /><small>{{ category.description }}</small></td>
            <td>
              <span :style="{ display: 'inline-block', width: '28px', height: '18px', borderRadius: '6px', background: `linear-gradient(90deg, ${category.themeColorPrimary}, ${category.themeColorSecondary})` }" />
            </td>
            <td><span class="sl-badge" :class="{ 'sl-badge--success': category.visible }">{{ category.visible ? '显示' : '隐藏' }}</span></td>
            <td>
              <button class="sl-icon-button" type="button" aria-label="编辑" @click="openEdit(category)"><Pencil :size="16" /></button>
              <button class="sl-icon-button" type="button" aria-label="删除" @click="remove(category)"><Trash2 :size="16" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="formOpen" class="sl-dialog-backdrop" @click.self="formOpen = false">
      <form class="sl-dialog" @submit.prevent="save">
        <p class="sl-dialog__eyebrow">{{ editingId ? 'EDIT CATEGORY' : 'NEW CATEGORY' }}</p>
        <h2 class="sl-dialog__title">{{ editingId ? '编辑分类' : '新建分类' }}</h2>
        <div class="sl-dialog__body admin-form">
          <label class="sl-field"><span class="sl-field__label">分类名称</span><input v-model="form.name" class="sl-field__control" required /></label>
          <label class="sl-field"><span class="sl-field__label">简介</span><input v-model="form.description" class="sl-field__control" /></label>
          <label class="admin-upload">
            <strong><Upload :size="15" /> 分类封面</strong>
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="uploadCover" />
            <span>{{ uploading ? '上传中…' : form.coverObjectKey || 'JPG / PNG / WebP，最大 5 MB（可选，用作课程封面背景）' }}</span>
          </label>
          <div class="admin-form-grid">
            <label class="sl-field"><span class="sl-field__label">主色</span><input v-model="form.themeColorPrimary" class="sl-field__control" type="color" /></label>
            <label class="sl-field"><span class="sl-field__label">辅助色</span><input v-model="form.themeColorSecondary" class="sl-field__control" type="color" /></label>
          </div>
          <div class="admin-form-grid">
            <label class="sl-field"><span class="sl-field__label">排序</span><input v-model.number="form.sortOrder" class="sl-field__control" type="number" min="0" /></label>
            <label class="sl-switch"><span class="sl-switch__label">在首页显示</span><input v-model="form.visible" type="checkbox" /><span class="sl-switch__track"><span class="sl-switch__thumb" /></span></label>
          </div>
        </div>
        <div class="sl-dialog__actions">
          <button class="sl-button sl-button--ghost" type="button" @click="formOpen = false">取消</button>
          <button class="sl-button sl-button--accent" type="submit">保存</button>
        </div>
      </form>
    </div>
  </section>
</template>
