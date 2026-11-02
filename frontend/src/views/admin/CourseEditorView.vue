<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ArrowLeft, RefreshCw, Upload } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminCategory } from '@/api/types'
import { COVER_HEIGHT, COVER_WIDTH, generateCoverBlob, renderCover } from '@/utils/coverGenerator'
import { resolveContentType } from '@/utils/uploadContentType'

const route = useRoute()
const router = useRouter()
const courseId = Number(route.params.id)
const editing = Number.isFinite(courseId) && route.params.id !== 'new'
const categories = ref<AdminCategory[]>([])
const error = ref('')
const saving = ref(false)
const generating = ref(false)
const manualCover = ref(false)
const previewEl = ref<HTMLCanvasElement | null>(null)
const uploading = reactive({ COVER: false, AUDIO: false, SUBTITLE: false })
const form = reactive({
  categoryId: 0,
  title: '',
  description: '',
  coverObjectKey: '',
  audioObjectKey: '',
  subtitleObjectKey: '',
  themeColorPrimary: '#4f5b47',
  themeColorSecondary: '#d9b56e',
  durationMs: 0,
  sortOrder: 0,
  resetLearning: false,
})

const currentCategory = computed(() => categories.value.find((category) => category.id === form.categoryId))

const coverHint = computed(() => {
  if (generating.value) return '正在生成封面…'
  if (uploading.COVER) return '上传中…'
  if (form.coverObjectKey) return manualCover.value ? '已上传本地封面' : '已自动生成封面'
  return '输入课程名后自动生成封面，也可上传本地图片'
})

onMounted(async () => {
  try {
    categories.value = await adminApi.categories()
    if (!editing) {
      form.categoryId = categories.value[0]?.id ?? 0
      applyCategoryColors()
      redrawPreview()
      return
    }
    const response = await adminApi.courses({})
    const course = response.content.find((item) => item.id === courseId)
    if (!course) throw new Error('课程不存在')
    Object.assign(form, {
      categoryId: course.categoryId,
      title: course.title,
      description: course.description || '',
      coverObjectKey: course.coverObjectKey || '',
      audioObjectKey: course.audioObjectKey || '',
      subtitleObjectKey: course.subtitleObjectKey || '',
      themeColorPrimary: course.themeColorPrimary || '#4f5b47',
      themeColorSecondary: course.themeColorSecondary || '#d9b56e',
      durationMs: course.durationMs,
      sortOrder: course.sortOrder,
    })
    redrawPreview()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})

function applyCategoryColors() {
  if (editing) return
  const category = categories.value.find((item) => item.id === form.categoryId)
  if (!category) return
  const primary = category.themeColorPrimary
  if (!primary) return
  form.themeColorPrimary = primary
  form.themeColorSecondary = category.themeColorSecondary ?? primary
}

function coverSpec() {
  return {
    title: form.title,
    categoryName: currentCategory.value?.name,
    colorA: form.themeColorPrimary,
    colorB: form.themeColorSecondary,
    coverImageUrl: currentCategory.value?.coverUrl ?? undefined,
  }
}

async function redrawPreview() {
  const canvas = previewEl.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  try {
    await renderCover(ctx, coverSpec())
  } catch {
    // 预览失败可忽略，正式生成时再报错
  }
}

async function generateAndUpload() {
  if (!form.title.trim()) return
  generating.value = true
  error.value = ''
  try {
    const blob = await generateCoverBlob(coverSpec())
    const file = new File([blob], 'cover.png', { type: 'image/png' })
    const presigned = await adminApi.presignUpload({
      kind: 'COVER',
      fileName: file.name,
      contentType: 'image/png',
      sizeBytes: file.size,
    })
    const uploadResponse = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: file,
    })
    if (!uploadResponse.ok) throw new Error('封面生成上传失败')
    form.coverObjectKey = presigned.objectKey
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    generating.value = false
  }
}

let generateTimer: ReturnType<typeof setTimeout> | undefined
function scheduleAutoGenerate() {
  if (manualCover.value || !form.title.trim()) return
  clearTimeout(generateTimer)
  generateTimer = setTimeout(generateAndUpload, 800)
}

function regenerateCover() {
  manualCover.value = false
  clearTimeout(generateTimer)
  generateTimer = setTimeout(generateAndUpload, 0)
}

watch(
  () => [form.title, form.themeColorPrimary, form.themeColorSecondary, form.categoryId],
  () => {
    redrawPreview()
    scheduleAutoGenerate()
  },
)

onBeforeUnmount(() => clearTimeout(generateTimer))

async function upload(kind: 'COVER' | 'AUDIO' | 'SUBTITLE', event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading[kind] = true
  error.value = ''
  try {
    const contentType = resolveContentType(file, kind)
    const presigned = await adminApi.presignUpload({
      kind,
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
    if (kind === 'COVER') {
      form.coverObjectKey = presigned.objectKey
      manualCover.value = true
    }
    if (kind === 'AUDIO') form.audioObjectKey = presigned.objectKey
    if (kind === 'SUBTITLE') form.subtitleObjectKey = presigned.objectKey
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    uploading[kind] = false
  }
}

async function save(publishAfter = false) {
  saving.value = true
  error.value = ''
  try {
    const course = editing
      ? await adminApi.updateCourse(courseId, form)
      : await adminApi.createCourse(form)
    if (publishAfter) await adminApi.publishCourse(course.id)
    await router.replace('/admin/courses')
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <header class="admin-page-head">
      <div>
        <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="router.push('/admin/courses')"><ArrowLeft :size="16" /> 返回课程</button>
        <p class="eyebrow" style="margin-top: 16px">COURSE EDITOR</p>
        <h1>{{ editing ? '编辑课程' : '新建课程' }}</h1>
      </div>
    </header>
    <p v-if="error" class="inline-error">{{ error }}</p>
    <form class="admin-form" @submit.prevent="save(false)">
      <div class="admin-form-grid">
        <label class="sl-field">
          <span class="sl-field__label">课程名称</span>
          <input v-model="form.title" class="sl-field__control" required maxlength="120" />
        </label>
        <label class="sl-field">
          <span class="sl-field__label">所属分类</span>
          <select v-model.number="form.categoryId" class="sl-field__control" required @change="applyCategoryColors">
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
          </select>
        </label>
      </div>
      <label class="sl-field">
        <span class="sl-field__label">简介</span>
        <textarea v-model="form.description" class="sl-field__control" />
      </label>

      <div class="admin-form-grid">
        <div class="admin-cover">
          <canvas ref="previewEl" :width="COVER_WIDTH" :height="COVER_HEIGHT" class="admin-cover__preview" />
          <div class="admin-cover__row">
            <label class="admin-upload admin-upload--sm">
              <strong><Upload :size="14" /> 上传图片</strong>
              <input type="file" accept="image/jpeg,image/png,image/webp" @change="upload('COVER', $event)" />
            </label>
            <button class="sl-button sl-button--secondary sl-button--sm" type="button" :disabled="generating || !form.title.trim()" @click="regenerateCover">
              <RefreshCw :size="14" /> 重新生成
            </button>
          </div>
          <p class="admin-cover__hint">{{ coverHint }}</p>
        </div>
        <label class="admin-upload">
          <strong><Upload :size="15" /> 课程音频</strong>
          <input type="file" accept="audio/mpeg,audio/mp4,audio/aac,audio/x-m4a" @change="upload('AUDIO', $event)" />
          <span>{{ uploading.AUDIO ? '上传中…' : form.audioObjectKey || 'MP3 / M4A / AAC，最大 100 MB' }}</span>
        </label>
      </div>
      <label class="admin-upload">
        <strong><Upload :size="15" /> 双语字幕</strong>
        <input type="file" accept=".srt,.vtt,text/plain,text/vtt" @change="upload('SUBTITLE', $event)" />
        <span>{{ uploading.SUBTITLE ? '上传中…' : form.subtitleObjectKey || 'SRT / VTT，每条包含英文与中文两行' }}</span>
      </label>

      <div class="admin-form-grid">
        <label class="sl-field"><span class="sl-field__label">主色</span><input v-model="form.themeColorPrimary" class="sl-field__control" type="color" /></label>
        <label class="sl-field"><span class="sl-field__label">辅助色</span><input v-model="form.themeColorSecondary" class="sl-field__control" type="color" /></label>
        <label class="sl-field"><span class="sl-field__label">时长（毫秒）</span><input v-model.number="form.durationMs" class="sl-field__control" type="number" min="0" /></label>
        <label class="sl-field"><span class="sl-field__label">排序</span><input v-model.number="form.sortOrder" class="sl-field__control" type="number" min="0" /></label>
      </div>
      <label v-if="editing" class="sl-checkbox">
        <input v-model="form.resetLearning" type="checkbox" />
        替换音频或字幕时确认重置已有学习进度
      </label>
      <div class="admin-actions">
        <button class="sl-button sl-button--secondary" type="submit" :disabled="saving">保存草稿</button>
        <button class="sl-button sl-button--accent" type="button" :disabled="saving" @click="save(true)">保存并发布</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.admin-cover {
  display: grid;
  gap: 10px;
  align-content: start;
}

.admin-cover__preview {
  width: min(200px, 100%);
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-md);
  object-fit: cover;
  display: block;
  box-shadow: 0 6px 20px rgba(23, 26, 22, 0.14);
}

.admin-cover__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.admin-cover__hint {
  margin: 0;
  font-size: var(--text-caption);
  color: var(--color-text-tertiary);
}

.admin-upload--sm {
  min-height: 0;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border-style: solid;
  background: transparent;
  cursor: pointer;
}

.admin-upload--sm strong {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
</style>
