<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ArrowLeft, Upload } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminCategory } from '@/api/types'

const route = useRoute()
const router = useRouter()
const courseId = Number(route.params.id)
const editing = Number.isFinite(courseId) && route.params.id !== 'new'
const categories = ref<AdminCategory[]>([])
const error = ref('')
const saving = ref(false)
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

onMounted(async () => {
  try {
    categories.value = await adminApi.categories()
    if (!editing) {
      form.categoryId = categories.value[0]?.id ?? 0
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
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})

async function upload(kind: 'COVER' | 'AUDIO' | 'SUBTITLE', event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading[kind] = true
  error.value = ''
  try {
    const presigned = await adminApi.presignUpload({
      kind,
      fileName: file.name,
      contentType: file.type || (kind === 'SUBTITLE' ? 'text/plain' : 'application/octet-stream'),
      sizeBytes: file.size,
    })
    const uploadResponse = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!uploadResponse.ok) throw new Error('文件上传失败')
    if (kind === 'COVER') form.coverObjectKey = presigned.objectKey
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
        <label class="admin-upload">
          <strong><Upload :size="15" /> 封面图片</strong>
          <input type="file" accept="image/jpeg,image/png,image/webp" @change="upload('COVER', $event)" />
          <span>{{ uploading.COVER ? '上传中…' : form.coverObjectKey || 'JPG / PNG / WebP，最大 5 MB' }}</span>
        </label>
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
