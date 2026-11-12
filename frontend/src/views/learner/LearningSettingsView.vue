<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
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
const speeds = [
  { value: 0.25, label: '0.25×' },
  { value: 0.5, label: '0.5×' },
  { value: 0.75, label: '0.75×' },
  { value: 1, label: '1×' },
  { value: 1.25, label: '1.25×' },
  { value: 1.5, label: '1.5×' },
]

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
      <button class="sl-icon-button" type="button" aria-label="返回" @click="router.back()"><SlIcon name="arrow-left" :size="21" /></button>
      <h1>学习设置</h1>
      <span />
    </header>
    <div v-if="settings" class="settings-scroll">
      <form class="settings-form settings-form--editorial" @submit.prevent="save">
        <section class="settings-section">
          <span class="eyebrow settings-section__eyebrow">TYPE SCALE</span>
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
          <span class="eyebrow settings-section__eyebrow">CAPTION COLOR</span>
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
          <span class="eyebrow settings-section__eyebrow">PLAYBACK SPEED</span>
          <h2>播放速度</h2>
          <p>设置后对所有课程的听、读、写、说音频生效。</p>
          <div class="choice-row">
            <button
              v-for="speed in speeds"
              :key="speed.value"
              type="button"
              :aria-pressed="settings.playbackRate === speed.value"
              @click="settings.playbackRate = speed.value"
            >
              {{ speed.label }}
            </button>
          </div>
        </section>

        <section class="settings-section">
          <span class="eyebrow settings-section__eyebrow">TRANSLATION</span>
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
          <SlIcon name="arrow-right-s" :size="18" />
        </button>
        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="saved" class="inline-success">学习设置已保存</p>
      </form>
    </div>
    <div class="settings-save-dock">
      <button class="sl-button sl-button--lg sl-button--full learning-settings-save" type="button" @click="save">
        保存设置
      </button>
    </div>
  </main>
</template>

<style scoped>
.settings-screen {
  background: var(--app-bg);
}

.settings-form--editorial {
  gap: 0;
  padding: 8px 0 110px;
}

.settings-section {
  gap: 11px;
  padding: 25px 4px;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  border-radius: 0;
  background: transparent;
}

.settings-section__eyebrow {
  margin-bottom: -4px;
}

.settings-section h2 {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: var(--weight-regular);
  line-height: 1.05;
  letter-spacing: -.025em;
}

.choice-row {
  padding: 4px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
}

.choice-row button {
  border-color: transparent;
  background: transparent;
}

.choice-row button[aria-pressed="true"] {
  border-color: var(--color-border);
  background: var(--color-bg-elevated);
  box-shadow: 0 3px 10px rgba(30, 35, 27, .05);
}

.color-row {
  gap: 18px;
  padding: 3px 0;
}

.color-choice {
  width: 44px;
  height: 44px;
  min-height: 44px;
  border-color: rgba(25, 30, 23, .18);
}

.settings-link-row {
  width: 100%;
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 4px;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.settings-link-row > span {
  display: grid;
  gap: 4px;
}

.settings-link-row strong {
  font-size: var(--text-heading-md);
}

.settings-link-row small {
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
}

.learning-settings-save {
  background: var(--color-ink-900);
  color: var(--color-paper-50);
  box-shadow: var(--shadow-float);
}

.settings-save-dock {
  position: absolute;
  z-index: 8;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 18px 16px calc(12px + var(--safe-bottom));
  background: linear-gradient(180deg, transparent, var(--color-bg) 42%);
}
</style>
