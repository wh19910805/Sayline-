<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowLeft, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { LearningSettings } from '@/api/types'

const router = useRouter()
const settings = ref<LearningSettings | null>(null)
const error = ref('')
const saved = ref(false)
const sizes = [
  { value: 0.9, label: '小' },
  { value: 1, label: '标准' },
  { value: 1.12, label: '大' },
]
const colors = ['#FFFAF0', '#F0D398', '#CCE5D0', '#D8E9F2']

onMounted(async () => {
  try {
    settings.value = await learnerApi.settings()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})

async function save() {
  if (!settings.value) return
  saved.value = false
  try {
    settings.value = await learnerApi.updateSettings(settings.value)
    saved.value = true
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
}
</script>

<template>
  <main class="app-screen settings-screen">
    <header class="settings-header">
      <button class="sl-icon-button" type="button" aria-label="返回" @click="router.back()"><ArrowLeft :size="21" /></button>
      <h1>学习设置</h1>
      <span />
    </header>
    <div v-if="settings" class="settings-scroll">
      <form class="settings-form" @submit.prevent="save">
        <section class="settings-section">
          <h2>字幕字号</h2>
          <p>调整播放器里英文与中文的显示比例。</p>
          <div class="choice-row">
            <button
              v-for="size in sizes"
              :key="size.value"
              type="button"
              :aria-pressed="settings.fontScale === size.value"
              @click="settings.fontScale = size.value"
            >
              {{ size.label }}
            </button>
          </div>
        </section>

        <section class="settings-section">
          <h2>字幕颜色</h2>
          <p>课程背景会随封面变化，建议选择高对比度颜色。</p>
          <div class="color-row">
            <button
              v-for="color in colors"
              :key="color"
              class="color-choice"
              type="button"
              :aria-label="`选择 ${color}`"
              :aria-pressed="settings.subtitleColor.toUpperCase() === color"
              :style="{ '--swatch': color }"
              @click="settings.subtitleColor = color"
            />
          </div>
        </section>

        <section class="settings-section">
          <h2>中文翻译</h2>
          <label class="sl-switch">
            <span class="sl-switch__label">听模式显示中文</span>
            <input v-model="settings.showChineseListen" type="checkbox" />
            <span class="sl-switch__track"><span class="sl-switch__thumb" /></span>
          </label>
          <label class="sl-switch">
            <span class="sl-switch__label">读模式显示中文</span>
            <input v-model="settings.showChineseRead" type="checkbox" />
            <span class="sl-switch__track"><span class="sl-switch__thumb" /></span>
          </label>
          <label class="sl-switch">
            <span class="sl-switch__label">写模式显示中文</span>
            <input v-model="settings.showChineseWrite" type="checkbox" />
            <span class="sl-switch__track"><span class="sl-switch__thumb" /></span>
          </label>
          <label class="sl-switch">
            <span class="sl-switch__label">说模式显示中文</span>
            <input v-model="settings.showChineseSpeak" type="checkbox" />
            <span class="sl-switch__track"><span class="sl-switch__thumb" /></span>
          </label>
        </section>

        <button class="settings-link-row" type="button" @click="router.push('/preferences')">
          <span><strong>学习偏好</strong><small>兴趣分类和默认 Tab</small></span>
          <ChevronRight :size="18" />
        </button>
        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="saved" class="inline-success">学习设置已保存</p>
        <button class="sl-button sl-button--accent sl-button--lg sl-button--full" type="submit">保存设置</button>
      </form>
    </div>
  </main>
</template>
