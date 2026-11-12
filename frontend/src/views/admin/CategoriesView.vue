<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminCategory } from '@/api/types'
import SlButton from '@/components/ui/SlButton.vue'
import SlDialog from '@/components/ui/SlDialog.vue'
import SlErrorState from '@/components/ui/SlErrorState.vue'
import SlField from '@/components/ui/SlField.vue'
import SlSwitch from '@/components/ui/SlSwitch.vue'
import SlTable from '@/components/ui/SlTable.vue'
import { resolveContentType } from '@/utils/uploadContentType'

const categories = ref<AdminCategory[]>([])
const page = ref(0)
const totalPages = ref(1)
const totalElements = ref(0)
const editingId = ref<number | null>(null)
const formOpen = ref(false)
const error = ref('')
const loading = ref(false)
const uploading = ref(false)
const deleteTarget = ref<AdminCategory | null>(null)
const form = reactive({
  name: '',
  description: '',
  coverObjectKey: '',
  themeColorPrimary: '#425c51',
  themeColorSecondary: '#a6c4b8',
  sortOrder: 0,
  visible: true,
})

interface CategoryColor {
  primary: string
  secondary: string
  label: string
}

const categoryPalette: CategoryColor[] = [
  { primary: '#425c51', secondary: '#a6c4b8', label: '墨青' },
  { primary: '#8a4e38', secondary: '#d7a593', label: '陶土' },
  { primary: '#546543', secondary: '#b5c7a3', label: '苔绿' },
  { primary: '#7f6539', secondary: '#d4bd96', label: '赭金' },
  { primary: '#704259', secondary: '#cb9fb5', label: '李子' },
  { primary: '#7d553b', secondary: '#d3af97', label: '锈橙' },
  { primary: '#6c6d40', secondary: '#cacb9f', label: '橄榄' },
  { primary: '#456346', secondary: '#a5c5a6', label: '松绿' },
]

function hslToHex(h: number, s: number, l: number) {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

function nextAvailableColor(): CategoryColor {
  const used = new Set(categories.value.map((c) => (c.themeColorPrimary || '').toUpperCase()))
  for (const preset of categoryPalette) {
    if (!used.has(preset.primary.toUpperCase())) return preset
  }
  // 8 个预设用完：黄金角分布在暖色弧 [330°,160°] 内，避开冷色，20+ 也不出暖色域
  const warmStart = 330
  const warmSpan = 190 // 330° -> 160°（经 0°）
  const offset = Math.round(((categories.value.length - categoryPalette.length) * 137.5) % warmSpan)
  const hue = (warmStart + offset) % 360
  return {
    primary: hslToHex(hue, 30, 34),
    secondary: hslToHex(hue, 34, 71),
    label: '自动',
  }
}

async function load() {
  loading.value = true
  try {
    const response = await adminApi.categories(page.value)
    categories.value = response.content
    totalPages.value = response.totalPages
    totalElements.value = response.totalElements
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
}

function goPage(next: number) {
  page.value = next
  load()
}

function openCreate() {
  editingId.value = null
  const color = nextAvailableColor()
  Object.assign(form, {
    name: '',
    description: '',
    coverObjectKey: '',
    themeColorPrimary: color.primary,
    themeColorSecondary: color.secondary,
    sortOrder: totalElements.value,
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
    themeColorSecondary: category.themeColorSecondary || '#8f8e88',
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

function remove(category: AdminCategory) {
  deleteTarget.value = category
}

async function confirmRemove() {
  if (!deleteTarget.value) return
  try {
    await adminApi.deleteCategory(deleteTarget.value.id)
    deleteTarget.value = null
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
      <button class="sl-button sl-button--accent" type="button" @click="openCreate"><SlIcon name="add" :size="17" /> 新建分类</button>
    </header>
    <SlErrorState v-if="error" :message="error" title="分类列表暂时不可用" @retry="load" />
    <div class="admin-card">
      <SlTable :loading="loading" :empty="!categories.length" empty-title="暂无分类" empty-description="还没有分类，点右上角新建">
        <template #head><tr><th>排序</th><th>分类</th><th>颜色</th><th>状态</th><th>操作</th></tr></template>
        <tr v-for="category in categories" :key="category.id">
          <td>{{ category.sortOrder }}</td>
          <td><strong>{{ category.name }}</strong><br /><small>{{ category.description }}</small></td>
          <td>
            <span :style="{ display: 'inline-block', width: '28px', height: '18px', borderRadius: '6px', background: `linear-gradient(90deg, ${category.themeColorPrimary}, ${category.themeColorSecondary})` }" />
          </td>
          <td><span class="sl-badge" :class="{ 'sl-badge--success': category.visible }">{{ category.visible ? '显示' : '隐藏' }}</span></td>
          <td>
            <button class="sl-icon-button" type="button" aria-label="编辑" @click="openEdit(category)"><SlIcon name="pencil" :size="16" /></button>
            <button class="sl-icon-button" type="button" aria-label="删除" @click="remove(category)"><SlIcon name="delete-bin" :size="16" /></button>
          </td>
        </tr>
      </SlTable>
    </div>

    <div class="admin-pagination">
      <button class="sl-button sl-button--secondary sl-button--sm" type="button" :disabled="page === 0" @click="goPage(page - 1)">上一页</button>
      <span>第 {{ page + 1 }} / {{ totalPages }} 页 · 共 {{ totalElements }} 个</span>
      <button class="sl-button sl-button--secondary sl-button--sm" type="button" :disabled="page >= totalPages - 1" @click="goPage(page + 1)">下一页</button>
    </div>

    <SlDialog :open="formOpen" :title="editingId ? '编辑分类' : '新建分类'" :eyebrow="editingId ? 'EDIT CATEGORY' : 'NEW CATEGORY'" @close="formOpen = false">
      <form class="admin-form" id="category-form" @submit.prevent="save">
        <SlField label="分类名称"><input v-model="form.name" class="sl-field__control" required /></SlField>
        <SlField label="简介"><input v-model="form.description" class="sl-field__control" /></SlField>
        <label class="admin-upload">
          <strong><SlIcon name="upload-2" :size="15" /> 分类封面</strong>
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="uploadCover" />
          <span>{{ uploading ? '上传中…' : form.coverObjectKey || 'JPG / PNG / WebP，最大 5 MB（可选，用作课程封面背景）' }}</span>
        </label>
        <div class="category-palette">
          <button
            v-for="preset in categoryPalette"
            :key="preset.primary"
            type="button"
            class="category-palette__swatch"
            :class="{ 'is-active': form.themeColorPrimary === preset.primary }"
            :style="{ background: `linear-gradient(90deg, ${preset.primary}, ${preset.secondary})` }"
            :title="preset.label"
            :aria-label="`选择 ${preset.label} 配色`"
            @click="form.themeColorPrimary = preset.primary; form.themeColorSecondary = preset.secondary"
          />
        </div>
        <div class="admin-form-grid">
          <SlField label="主色"><input v-model="form.themeColorPrimary" class="sl-field__control" type="color" /></SlField>
          <SlField label="辅助色"><input v-model="form.themeColorSecondary" class="sl-field__control" type="color" /></SlField>
        </div>
        <div class="admin-form-grid">
          <SlField label="排序"><input v-model.number="form.sortOrder" class="sl-field__control" type="number" min="0" /></SlField>
          <SlSwitch v-model="form.visible" label="在首页显示" />
        </div>
      </form>
      <template #actions>
        <SlButton variant="ghost" @click="formOpen = false">取消</SlButton>
        <SlButton variant="accent" type="submit" form="category-form">保存</SlButton>
      </template>
    </SlDialog>

    <SlDialog
      :open="!!deleteTarget"
      title="删除这个分类？"
      eyebrow="DELETE CATEGORY"
      :description="`将删除「${deleteTarget?.name ?? ''}」。分类下仍有书籍时，系统会阻止删除并建议隐藏。`"
      @close="deleteTarget = null"
    >
      <template #actions>
        <SlButton variant="ghost" @click="deleteTarget = null">取消</SlButton>
        <SlButton variant="danger" @click="confirmRemove">确认删除</SlButton>
      </template>
    </SlDialog>
  </section>
</template>
