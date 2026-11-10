<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRoute, useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { adminApi } from '@/api/services'
import type { AdminBook } from '@/api/types'
import { resolveContentType } from '@/utils/uploadContentType'

const route = useRoute()
const router = useRouter()
const courseId = Number(route.params.id)
const editing = Number.isFinite(courseId) && route.params.id !== 'new'
const books = ref<AdminBook[]>([])
const error = ref('')
const saving = ref(false)
const uploading = reactive({ AUDIO: false, SUBTITLE: false })
const form = reactive({
  bookId: 0,
  title: '',
  audioObjectKey: '',
  subtitleObjectKey: '',
  durationMs: 0,
  sortOrder: 0,
  resetLearning: false,
})

onMounted(async () => {
  try {
    const bookPage = await adminApi.books()
    books.value = bookPage.content
    if (!editing) {
      form.bookId = books.value[0]?.id ?? 0
      return
    }
    const course = await adminApi.course(courseId)
    Object.assign(form, {
      bookId: course.bookId,
      title: course.title,
      audioObjectKey: course.audioObjectKey || '',
      subtitleObjectKey: course.subtitleObjectKey || '',
      durationMs: course.durationMs,
      sortOrder: course.sortOrder,
    })
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})

async function upload(kind: 'AUDIO' | 'SUBTITLE', event: Event) {
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
        <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="router.push('/admin/courses')"><SlIcon name="arrow-left" :size="16" /> 返回课时</button>
        <p class="eyebrow" style="margin-top: 16px">LESSON EDITOR</p>
        <h1>{{ editing ? '编辑课时' : '新建课时' }}</h1>
      </div>
    </header>
    <p v-if="error" class="inline-error">{{ error }}</p>
    <form class="admin-form" @submit.prevent="save(false)">
      <div class="admin-form-grid">
        <label class="sl-field">
          <span class="sl-field__label">所属课程</span>
          <select v-model.number="form.bookId" class="sl-field__control" required>
            <option v-for="book in books" :key="book.id" :value="book.id">{{ book.title }}</option>
          </select>
        </label>
        <label class="sl-field">
          <span class="sl-field__label">课时标题</span>
          <input v-model="form.title" class="sl-field__control" required maxlength="120" />
        </label>
      </div>

      <label class="admin-upload">
        <strong><SlIcon name="upload-2" :size="15" /> 课程音频</strong>
        <input type="file" accept="audio/mpeg,audio/mp4,audio/aac,audio/x-m4a" hidden @change="upload('AUDIO', $event)" />
        <span>{{ uploading.AUDIO ? '上传中…' : form.audioObjectKey || 'MP3 / M4A / AAC，最大 100 MB' }}</span>
      </label>
      <label class="admin-upload">
        <strong><SlIcon name="upload-2" :size="15" /> 双语字幕</strong>
        <input type="file" accept=".srt,.vtt,text/plain,text/vtt" hidden @change="upload('SUBTITLE', $event)" />
        <span>{{ uploading.SUBTITLE ? '上传中…' : form.subtitleObjectKey || 'SRT / VTT，每条包含英文与中文两行' }}</span>
      </label>

      <div class="admin-form-grid">
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
