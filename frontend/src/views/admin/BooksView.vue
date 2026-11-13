<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminBook, AdminCategory } from '@/api/types'
import SlDialog from '@/components/ui/SlDialog.vue'
import SlErrorState from '@/components/ui/SlErrorState.vue'
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
const query = ref('')
const categoryFilter = ref<number | ''>('')
const visibleFilter = ref<'true' | 'false' | ''>('')
const selectedIds = ref<number[]>([])
const deleteTarget = ref<AdminBook | null>(null)
const batchTarget = ref<boolean | null>(null)
const batchSaving = ref(false)
const allSelected = computed(
  () => books.value.length > 0 && selectedIds.value.length === books.value.length,
)
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
  error.value = ''
  try {
    const [bookPage, categoryPage] = await Promise.all([
      adminApi.books({
        categoryId: categoryFilter.value || undefined,
        q: query.value.trim() || undefined,
        visible: visibleFilter.value === '' ? undefined : visibleFilter.value === 'true',
      }),
      adminApi.categories(0, 100),
    ])
    books.value = bookPage.content
    categories.value = categoryPage.content
    selectedIds.value = []
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

function remove(book: AdminBook) {
  deleteTarget.value = book
}

async function confirmRemove() {
  if (!deleteTarget.value) return
  try {
    await adminApi.deleteBook(deleteTarget.value.id)
    deleteTarget.value = null
    await load()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}

function toggleSelection(id: number, checked: boolean) {
  selectedIds.value = checked
    ? [...new Set([...selectedIds.value, id])]
    : selectedIds.value.filter((value) => value !== id)
}

function toggleAll(checked: boolean) {
  selectedIds.value = checked ? books.value.map((book) => book.id) : []
}

async function confirmBatchVisibility() {
  if (!selectedIds.value.length || batchTarget.value === null) return
  batchSaving.value = true
  try {
    await adminApi.batchBookVisibility(selectedIds.value, batchTarget.value)
    batchTarget.value = null
    await load()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    batchSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section>
    <header class="admin-page-head">
      <div><p class="eyebrow">CONTENT LIBRARY</p><h1>书籍管理</h1></div>
      <button class="sl-button sl-button--accent" type="button" @click="openCreate"><SlIcon name="add" :size="17" /> 新建书籍</button>
    </header>
    <div class="admin-actions admin-book-filters">
      <select v-model="categoryFilter" class="sl-field__control" aria-label="按分类筛选" @change="load">
        <option value="">全部分类</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
      </select>
      <select v-model="visibleFilter" class="sl-field__control" aria-label="按显示状态筛选" @change="load">
        <option value="">全部状态</option>
        <option value="true">可见</option>
        <option value="false">已隐藏</option>
      </select>
      <input
        v-model="query"
        class="sl-field__control"
        placeholder="搜索书籍名、简介或分类"
        aria-label="搜索书籍名、简介或分类"
        @keyup.enter="load"
      />
      <button class="sl-button sl-button--secondary" type="button" @click="load">搜索</button>
    </div>
    <div v-if="selectedIds.length" class="admin-batch-bar" aria-live="polite">
      <span>已选择 {{ selectedIds.length }} 本</span>
      <button class="sl-button sl-button--secondary sl-button--sm" type="button" @click="batchTarget = true">批量显示</button>
      <button class="sl-button sl-button--danger sl-button--sm" type="button" @click="batchTarget = false">批量隐藏</button>
    </div>
    <SlErrorState v-if="error" :message="error" title="书籍列表暂时不可用" @retry="load" />
    <div class="admin-card">
      <SlTable :loading="loading" :empty="!books.length" empty-title="暂无书籍" empty-description="还没有书籍，点右上角新建">
        <template #head>
          <tr>
            <th><label class="admin-check"><input type="checkbox" aria-label="选择全部书籍" :checked="allSelected" @change="toggleAll(($event.target as HTMLInputElement).checked)" /></label></th>
            <th>书籍</th><th>分类</th><th>封面</th><th>排序</th><th>状态</th><th>更新时间</th><th>操作</th>
          </tr>
        </template>
        <tr v-for="book in books" :key="book.id">
          <td><label class="admin-check"><input type="checkbox" :aria-label="`选择 ${book.title}`" :checked="selectedIds.includes(book.id)" @change="toggleSelection(book.id, ($event.target as HTMLInputElement).checked)" /></label></td>
          <td><strong>{{ book.title }}</strong><br /><small>{{ book.description }}</small></td>
          <td>{{ book.categoryName }}</td>
          <td>
            <span class="admin-book-cover" :style="book.coverUrl ? { backgroundImage: `url(&quot;${book.coverUrl}&quot;)` } : undefined">
              <SlIcon v-if="!book.coverUrl" name="book-2" :size="16" />
            </span>
          </td>
          <td>{{ book.sortOrder }}</td>
          <td><span class="sl-badge" :class="{ 'sl-badge--warning': !book.visible }">{{ book.visible ? '可见' : '已隐藏' }}</span></td>
          <td>{{ book.updatedAt ? new Date(book.updatedAt).toLocaleDateString('zh-CN') : '暂无' }}</td>
          <td>
            <div class="admin-actions">
              <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="openEdit(book)">编辑</button>
              <details class="admin-row-menu">
                <summary class="sl-button sl-button--secondary sl-button--sm" aria-label="更多书籍操作">更多 <SlIcon name="arrow-down-s" :size="15" /></summary>
                <div class="admin-row-menu__panel">
                  <button type="button" @click="openEdit(book)">调整封面与排序</button>
                  <button class="is-danger" type="button" @click="remove(book)">删除书籍</button>
                </div>
              </details>
            </div>
          </td>
        </tr>
      </SlTable>
    </div>

    <SlDialog
      :open="formOpen"
      :title="editingId ? '编辑书籍' : '新建书籍'"
      eyebrow="BOOK DETAILS"
      description="封面和排序会直接影响学习端书架展示。"
      @close="formOpen = false"
    >
        <form id="book-editor-form" class="admin-form" @submit.prevent="save">
          <div class="admin-form-grid">
            <label class="sl-field">
              <span class="sl-field__label">书籍名</span>
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
        </form>
      <template #actions>
        <button class="sl-button sl-button--secondary" type="button" @click="formOpen = false">取消</button>
        <button class="sl-button sl-button--accent" type="submit" form="book-editor-form" :disabled="saving">保存</button>
      </template>
    </SlDialog>

    <SlDialog
      :open="!!deleteTarget"
      title="删除这本书？"
      eyebrow="DELETE BOOK"
      :description="`将永久删除「${deleteTarget?.title ?? ''}」。书籍下仍有课时时，系统会阻止删除并建议隐藏。`"
      @close="deleteTarget = null"
    >
      <template #actions>
        <button class="sl-button sl-button--secondary" type="button" @click="deleteTarget = null">取消</button>
        <button class="sl-button sl-button--danger" type="button" @click="confirmRemove">确认删除</button>
      </template>
    </SlDialog>

    <SlDialog
      :open="batchTarget !== null"
      :title="batchTarget ? '批量显示书籍？' : '批量隐藏书籍？'"
      eyebrow="BATCH VISIBILITY"
      :description="`将${batchTarget ? '显示' : '隐藏'}已选择的 ${selectedIds.length} 本书籍。学习端的目录会立即更新。`"
      @close="batchTarget = null"
    >
      <template #actions>
        <button class="sl-button sl-button--secondary" type="button" @click="batchTarget = null">取消</button>
        <button class="sl-button" :class="batchTarget ? 'sl-button--accent' : 'sl-button--danger'" type="button" :disabled="batchSaving" @click="confirmBatchVisibility">
          {{ batchSaving ? '处理中…' : batchTarget ? '确认显示' : '确认隐藏' }}
        </button>
      </template>
    </SlDialog>
  </section>
</template>

<style scoped>
.admin-book-cover {
  width: 36px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 5px;
  background: var(--color-surface-muted);
  background-position: center;
  background-size: cover;
  color: var(--color-text-tertiary);
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
