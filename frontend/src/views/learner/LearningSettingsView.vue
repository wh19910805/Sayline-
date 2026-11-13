<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { LearningSettings } from '@/api/types'

const router = useRouter()
const settings = ref<LearningSettings | null>(null)
const initialSnapshot = ref('')
const error = ref('')
const saved = ref(false)
const saving = ref(false)
const dirty = computed(
  () => !!settings.value && JSON.stringify(settings.value) !== initialSnapshot.value,
)
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
    initialSnapshot.value = JSON.stringify(settings.value)
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})

async function save() {
  if (!settings.value || !dirty.value || saving.value) return
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    settings.value = await learnerApi.updateSettings(settings.value)
    initialSnapshot.value = JSON.stringify(settings.value)
    saved.value = true
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    saving.value = false
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
          <span class="eyebrow settings-section__eyebrow">DAILY PLAN</span>
          <h2>每日学习目标</h2>
          <p>用每天可完成的分钟数衡量进度，范围 1–240 分钟。</p>
          <label class="daily-goal-field">
            <span>每日学习目标（分钟）</span>
            <span class="daily-goal-field__control">
              <input
                v-model.number="settings.dailyGoalMinutes"
                type="number"
                min="1"
                max="240"
                inputmode="numeric"
                aria-label="每日学习目标（分钟）"
              />
              <small>分钟</small>
            </span>
          </label>
        </section>

        <section class="settings-section">
          <span class="eyebrow settings-section__eyebrow">REMINDER</span>
          <h2>学习提醒</h2>
          <p>应用打开时，在设定时间后提醒尚未完成每日目标。</p>
          <label class="sl-switch">
            <span class="sl-switch__label">开启站内提醒</span>
            <input v-model="settings.reminderEnabled" type="checkbox" />
            <span class="sl-switch__track"><span class="sl-switch__thumb" /></span>
          </label>
          <label class="reminder-time">
            <span>提醒时间</span>
            <input
              v-model="settings.reminderTime"
              type="time"
              :disabled="!settings.reminderEnabled"
              aria-label="每日学习提醒时间"
            />
          </label>
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
          <span class="settings-link-row__copy"><strong>学习偏好</strong><small>兴趣分类和默认 Tab</small></span>
          <SlIcon name="arrow-right-s" :size="18" />
        </button>
        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="saved && !dirty" class="inline-success" aria-live="polite">学习设置已保存</p>
      </form>
    </div>
    <div class="settings-save-dock" :class="{ 'is-dirty': dirty }">
      <button
        class="sl-button sl-button--lg sl-button--full learning-settings-save"
        type="button"
        :disabled="!dirty || saving"
        :aria-busy="saving || undefined"
        @click="save"
      >
        {{ saving ? '正在保存…' : dirty ? '保存设置' : '设置已保存' }}
      </button>
    </div>
  </main>
</template>

<style scoped>
.settings-screen {
  background: var(--app-bg);
}

.settings-scroll {
  scroll-padding-bottom: 110px;
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

.settings-link-row__copy {
  width: auto;
  height: auto;
  min-width: 0;
  flex: 1;
  display: grid;
  place-items: initial;
  gap: 4px;
  background: transparent;
}

.settings-link-row strong {
  font-size: var(--text-heading-md);
}

.settings-link-row small {
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
}

.learning-settings-save {
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  box-shadow: none;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.settings-save-dock.is-dirty .learning-settings-save {
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
  padding: 14px 16px calc(12px + var(--safe-bottom));
  border-top: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
  background: color-mix(in srgb, var(--app-bg) 92%, transparent);
  backdrop-filter: blur(16px);
}

.settings-save-dock.is-dirty {
  border-top-color: var(--color-border-strong);
  box-shadow: 0 -10px 30px rgba(26, 26, 24, .07);
}

.daily-goal-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 52px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
}

.daily-goal-field > span:first-child {
  color: var(--color-text-secondary);
  font-size: var(--text-body-sm);
}

.daily-goal-field__control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.daily-goal-field__control input {
  width: 72px;
  min-height: 40px;
  padding: 0 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.daily-goal-field__control small {
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
}

.reminder-time {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
}

.reminder-time input {
  min-height: 40px;
  padding: 0 9px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-elevated);
  color: var(--color-text);
}

.reminder-time input:disabled {
  opacity: .5;
}
</style>
