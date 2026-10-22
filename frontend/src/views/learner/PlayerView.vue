<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from 'vue'
import {
  ArrowLeft,
  BookOpen,
  Captions,
  ChevronDown,
  ChevronUp,
  Headphones,
  Heart,
  Mic,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
} from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type {
  CourseDetail,
  Cue,
  LearningMode,
  LearningSettings,
  LearningState,
} from '@/api/types'
import WordDictation from '@/components/player/WordDictation.vue'
import { useControlVisibility } from '@/composables/useControlVisibility'
import { useCatalogStore } from '@/stores/catalog'
import { formatClock } from '@/utils/format'
import { createVisibleCueTimers } from '@/utils/visibleCueTimers'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const audio = ref<HTMLAudioElement | null>(null)
const course = ref<CourseDetail | null>(null)
const learning = ref<LearningState | null>(null)
const settings = ref<LearningSettings | null>(null)
const mode = ref<LearningMode>('LISTEN')
const activeCueIndex = ref(0)
const playing = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const playbackRate = ref(1)
const error = ref('')
const notice = ref('')
const loading = ref(true)
const modePanel = ref<HTMLElement | null>(null)
const recording = ref(false)
const recordSeconds = ref(0)
const audioRecordingUrl = ref('')
const writeSubmitted = ref(false)
const countdown = ref<number | null>(null)
let mediaRecorder: MediaRecorder | null = null
let recordingStartedAt = 0
let heartbeatTimer: ReturnType<typeof setInterval> | undefined
let progressTimer: ReturnType<typeof setInterval> | undefined
let countdownTimer: ReturnType<typeof setInterval> | undefined
let positionTimer: ReturnType<typeof setInterval> | undefined
let activeSince = performance.now()
const sentActions = new Set<string>()
const transcriptElements = new Map<number, HTMLElement>()
let readObserver: IntersectionObserver | null = null
const readTimers = createVisibleCueTimers({
  onElapsed: (cueId) => markCue(cueId, 'READ'),
})

const autoHide = computed(() => mode.value === 'LISTEN' || mode.value === 'READ')
const visibility = useControlVisibility({ autoHide, delay: 6_000 })

const courseId = computed(() => Number(route.params.courseId))
const activeCue = computed<Cue | null>(() => course.value?.cues[activeCueIndex.value] ?? null)
const modeProgress = computed(() => {
  const key = mode.value.toLowerCase() as 'listen' | 'read' | 'write' | 'speak'
  return learning.value?.modes[key] ?? { progress: 0, confirmed: false }
})
const currentCueProgress = computed(() => {
  const cueId = activeCue.value?.id
  return learning.value?.cues.find((cue) => cue.cueId === cueId)
})
const showChinese = computed(() => {
  if (!settings.value) return true
  return {
    LISTEN: settings.value.showChineseListen,
    READ: settings.value.showChineseRead,
    WRITE: settings.value.showChineseWrite,
    SPEAK: settings.value.showChineseSpeak,
  }[mode.value]
})
const backgroundStyle = computed(() => ({
  '--player-course-a': course.value?.themeColorPrimary || '#53634e',
  '--player-course-b': course.value?.themeColorSecondary || '#1f2a22',
}))
const modes = [
  { value: 'LISTEN' as const, label: '听', icon: Headphones },
  { value: 'READ' as const, label: '读', icon: BookOpen },
  { value: 'WRITE' as const, label: '写', icon: PenLine },
  { value: 'SPEAK' as const, label: '说', icon: Mic },
]

async function loadCourse(showLoader = true) {
  if (showLoader) loading.value = true
  error.value = ''
  try {
    const [detail, state, userSettings] = await Promise.all([
      learnerApi.course(courseId.value),
      learnerApi.learningState(courseId.value),
      learnerApi.settings(),
    ])
    course.value = detail
    learning.value = state
    settings.value = userSettings
    mode.value = state.lastMode || 'LISTEN'
    const savedIndex = detail.cues.findIndex((cue) => cue.id === state.lastCueId)
    activeCueIndex.value = savedIndex >= 0 ? savedIndex : 0
    await nextTick()
    if (mode.value === 'READ') startReadObservation()
    if (audio.value) {
      audio.value.currentTime = Math.max(0, state.lastPositionMs / 1_000)
      audio.value.playbackRate = playbackRate.value
    }
    visibility.show()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    loading.value = false
  }
}

function selectMode(next: LearningMode) {
  if (recording.value) return
  mode.value = next
  writeSubmitted.value = false
  visibility.show()
  learnerApi
    .position(courseId.value, {
      mode: next,
      cueId: activeCue.value?.id,
      positionMs: Math.round(currentTime.value * 1_000),
    })
    .then((state) => {
      learning.value = state
    })
    .catch(() => undefined)
}

function togglePlayback() {
  if (!audio.value) return
  if (audio.value.paused) {
    audio.value.play()
  } else {
    audio.value.pause()
  }
  visibility.show()
}

function seek(seconds: number) {
  if (!audio.value) return
  audio.value.currentTime = Math.min(
    audio.value.duration || duration.value,
    Math.max(0, audio.value.currentTime + seconds),
  )
  visibility.show()
}

function seekToCue(cue: Cue) {
  activeCueIndex.value = course.value?.cues.findIndex((item) => item.id === cue.id) ?? 0
  activeSince = performance.now()
  if (audio.value) {
    audio.value.currentTime = cue.startMs / 1_000
    audio.value.play().catch(() => undefined)
  }
  visibility.show()
}

function replayCue() {
  if (!activeCue.value || !audio.value) return
  audio.value.currentTime = activeCue.value.startMs / 1_000
  audio.value.play().catch(() => undefined)
}

function changeRate() {
  if (!audio.value) return
  audio.value.playbackRate = playbackRate.value
}

function onTimeUpdate() {
  if (!audio.value || !course.value) return
  currentTime.value = audio.value.currentTime
  duration.value = audio.value.duration || course.value.durationMs / 1_000
  let nextIndex = -1
  for (let index = course.value.cues.length - 1; index >= 0; index -= 1) {
    if (audio.value.currentTime * 1_000 >= course.value.cues[index]!.startMs) {
      nextIndex = index
      break
    }
  }
  if (nextIndex >= 0 && nextIndex !== activeCueIndex.value) {
    activeCueIndex.value = nextIndex
    activeSince = performance.now()
    writeSubmitted.value = false
  }
}

function markCurrentCue(actionMode: LearningMode, answer?: string) {
  const cue = activeCue.value
  if (!cue) return
  markCue(cue.id, actionMode, answer)
}

function markCue(cueId: number, actionMode: LearningMode, answer?: string) {
  const cue = course.value?.cues.find((item) => item.id === cueId)
  if (!cue) return
  const key = `${cue.id}-${actionMode}-${answer ?? ''}`
  if (sentActions.has(key)) return
  sentActions.add(key)
  learnerApi
    .action(courseId.value, {
      cueId: cue.id,
      mode: actionMode,
      durationMs: Math.max(0, Math.round(performance.now() - activeSince)),
      answer,
    })
    .then((state) => {
      learning.value = state
    })
    .catch((reason) => {
      sentActions.delete(key)
      notice.value = apiErrorMessage(reason)
    })
}

function savePosition() {
  if (!course.value) return
  learnerApi
    .position(courseId.value, {
      mode: mode.value,
      cueId: activeCue.value?.id,
      positionMs: Math.round(currentTime.value * 1_000),
    })
    .catch(() => undefined)
}

function submitWriting(answer: string) {
  writeSubmitted.value = true
  markCurrentCue('WRITE', answer)
}

async function toggleRecording() {
  visibility.show()
  if (recording.value) {
    mediaRecorder?.stop()
    recording.value = false
    const elapsed = performance.now() - recordingStartedAt
    if (elapsed >= 1_000) {
      markCurrentCue('SPEAK')
    } else {
      notice.value = '录音至少 1 秒才会记入进度'
    }
    return
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    notice.value = '当前浏览器不支持录音，请使用最新版 Chrome 或 Safari'
    return
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const chunks: Blob[] = []
    mediaRecorder = new MediaRecorder(stream)
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data)
    }
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      if (audioRecordingUrl.value) URL.revokeObjectURL(audioRecordingUrl.value)
      audioRecordingUrl.value = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }))
    }
    mediaRecorder.start()
    recordingStartedAt = performance.now()
    recordSeconds.value = 0
    recording.value = true
  } catch {
    notice.value = '麦克风权限未开启，请在浏览器设置中允许访问'
  }
}

async function confirmMode() {
  try {
    const state = await learnerApi.confirm(courseId.value, mode.value)
    learning.value = state
    notice.value = '本环节已完成'
    if (state.completed) beginAutoNext()
  } catch (reason) {
    notice.value = apiErrorMessage(reason)
  }
}

function beginAutoNext() {
  countdown.value = 3
  countdownTimer = setInterval(() => {
    if (countdown.value === null) return
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdown.value = null
      moveCourse(1)
    }
  }, 1_000)
}

function cancelAutoNext() {
  if (countdownTimer) clearInterval(countdownTimer)
  countdown.value = null
}

function moveCourse(direction: 1 | -1) {
  const ids = catalog.currentListIds.length
    ? catalog.currentListIds
    : course.value
      ? [course.value.id]
      : []
  const index = ids.indexOf(courseId.value)
  const target = index + direction
  if (target < 0) {
    notice.value = '已经是第一门课程'
    return
  }
  if (target >= ids.length) {
    notice.value = '本列表已学完'
    return
  }
  savePosition()
  router.replace(`/learn/${ids[target]}`)
}

async function toggleFavorite() {
  if (!course.value) return
  try {
    if (course.value.favorite) await learnerApi.unfavorite(course.value.id)
    else await learnerApi.favorite(course.value.id)
    course.value.favorite = !course.value.favorite
    notice.value = course.value.favorite ? '已加入我喜欢' : '已从我喜欢移除'
  } catch (reason) {
    notice.value = apiErrorMessage(reason)
  }
}

function tickLearning() {
  if (!course.value) return
  const elapsed = performance.now() - activeSince
  if (
    mode.value === 'READ' &&
    !readObserver &&
    elapsed >= 1_000 &&
    document.visibilityState === 'visible'
  ) {
    markCurrentCue('READ')
  }
  if (
    mode.value === 'LISTEN' &&
    playing.value &&
    elapsed >= 1_000 &&
    document.visibilityState === 'visible'
  ) {
    markCurrentCue('LISTEN')
  }
  if (recording.value) recordSeconds.value = Math.floor((performance.now() - recordingStartedAt) / 1_000)
}

function setTranscriptElement(
  cueId: number,
  element: Element | ComponentPublicInstance | null,
) {
  if (element instanceof HTMLElement) {
    transcriptElements.set(cueId, element)
  } else {
    transcriptElements.delete(cueId)
  }
}

function stopReadObservation() {
  readObserver?.disconnect()
  readObserver = null
  readTimers.reset()
}

function startReadObservation() {
  stopReadObservation()
  if (mode.value !== 'READ' || typeof IntersectionObserver === 'undefined') return

  readObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement
        const cueId = Number(element.dataset.cueId)
        if (
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.55 &&
          document.visibilityState === 'visible'
        ) {
          readTimers.enter(cueId)
        } else {
          readTimers.leave(cueId)
        }
      }
    },
    { threshold: [0.55] },
  )

  nextTick(() => {
    transcriptElements.forEach((element) => readObserver?.observe(element))
  })
}

let touchStartY = 0
function touchStart(event: TouchEvent) {
  touchStartY = event.touches[0]?.clientY ?? 0
}
function touchEnd(event: TouchEvent) {
  if (recording.value || mode.value === 'WRITE') return
  const delta = (event.changedTouches[0]?.clientY ?? touchStartY) - touchStartY
  if (Math.abs(delta) < 70) return
  moveCourse(delta < 0 ? 1 : -1)
}

watch(
  () => route.params.courseId,
  () => loadCourse(),
)

watch(mode, () => {
  activeSince = performance.now()
  writeSubmitted.value = false
  if (mode.value === 'READ') {
    startReadObservation()
  } else {
    stopReadObservation()
  }
})

onMounted(async () => {
  await loadCourse()
  heartbeatTimer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      learnerApi.heartbeat(courseId.value, 15_000).catch(() => undefined)
    }
  }, 15_000)
  progressTimer = setInterval(tickLearning, 500)
  positionTimer = setInterval(savePosition, 10_000)
})

onBeforeUnmount(() => {
  clearInterval(heartbeatTimer)
  clearInterval(progressTimer)
  clearInterval(positionTimer)
  clearInterval(countdownTimer)
  stopReadObservation()
  mediaRecorder?.stream?.getTracks().forEach((track) => track.stop())
  if (audioRecordingUrl.value) URL.revokeObjectURL(audioRecordingUrl.value)
})
</script>

<template>
  <main
    class="app-screen player-screen"
    :class="{ 'controls-visible': visibility.visible.value }"
    :style="backgroundStyle"
    @click="visibility.show()"
  >
    <div class="player-atmosphere" aria-hidden="true" />
    <div class="player-overlay" aria-hidden="true" />

    <div v-if="loading" class="page-loading">正在准备这一课…</div>
    <template v-else-if="course && learning && settings">
      <header class="player-header" @click.stop>
        <button class="sl-icon-button" type="button" aria-label="返回首页" @click="router.push('/')">
          <ArrowLeft :size="21" />
        </button>
        <div class="player-header__title">
          <strong>{{ course.title }}</strong>
          <span>{{ course.categoryName }}</span>
        </div>
        <button class="sl-icon-button" :class="{ 'sl-icon-button--active': course.favorite }" type="button" aria-label="收藏课程" @click.stop="toggleFavorite">
          <Heart :size="20" :fill="course.favorite ? 'currentColor' : 'none'" />
        </button>
      </header>

      <section class="player-identity" @click.stop>
        <div class="player-identity__cover" :style="{ backgroundImage: course.coverUrl ? `url('${course.coverUrl}')` : undefined }" />
        <div>
          <p class="eyebrow">{{ mode === 'LISTEN' ? 'LISTEN' : mode === 'READ' ? 'READ' : mode === 'WRITE' ? 'DICTATION' : 'SPEAK' }}</p>
          <h1>{{ course.title }}</h1>
          <span>{{ activeCueIndex + 1 }} / {{ course.cues.length }}</span>
        </div>
      </section>

      <section
        ref="modePanel"
        class="player-stage"
        @touchstart.passive="touchStart"
        @touchend="touchEnd"
      >
        <div v-if="mode === 'LISTEN'" class="listen-mode">
          <div class="lyrics-window">
            <button
              v-for="(cue, index) in course.cues"
              :key="cue.id"
              class="lyric-line"
              :class="{ 'is-active': index === activeCueIndex, 'is-past': index < activeCueIndex }"
              type="button"
              @click.stop="seekToCue(cue)"
            >
              <strong>{{ cue.englishText }}</strong>
              <span v-if="showChinese">{{ cue.chineseText }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="mode === 'READ'" class="read-mode">
          <div class="transcript-list">
            <button
              v-for="(cue, index) in course.cues"
              :key="cue.id"
              :ref="(element) => setTranscriptElement(cue.id, element)"
              :data-cue-id="cue.id"
              class="transcript-line"
              :class="{ 'is-active': index === activeCueIndex }"
              type="button"
              @click.stop="seekToCue(cue)"
            >
              <span class="transcript-line__time">{{ formatClock(cue.startMs) }}</span>
              <span class="transcript-line__copy">
                <strong>{{ cue.englishText }}</strong>
                <span v-if="showChinese">{{ cue.chineseText }}</span>
              </span>
            </button>
          </div>
        </div>

        <div v-else-if="mode === 'WRITE' && activeCue" class="write-mode" @click.stop>
          <div class="write-current-line">
            <button class="sl-icon-button" type="button" aria-label="播放当前句" @click="replayCue"><Volume2 :size="20" /></button>
            <p v-if="showChinese">{{ activeCue.chineseText }}</p>
            <span>{{ activeCueIndex + 1 }} / {{ course.cues.length }}</span>
          </div>
          <WordDictation
            :key="activeCue.id"
            :sentence="activeCue.englishText"
            :submitted="writeSubmitted || Boolean(currentCueProgress?.written)"
            @submit="submitWriting"
          />
          <div class="write-context">
            <button
              v-for="(cue, index) in course.cues"
              :key="cue.id"
              type="button"
              :class="{ 'is-active': index === activeCueIndex }"
              @click.stop="seekToCue(cue)"
            >
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <strong>{{ cue.englishText }}</strong>
            </button>
          </div>
        </div>

        <div v-else-if="mode === 'SPEAK' && activeCue" class="speak-mode" @click.stop>
          <div class="speak-current-line">
            <p class="eyebrow">SHADOW THIS LINE</p>
            <h2>{{ activeCue.englishText }}</h2>
            <p v-if="showChinese">{{ activeCue.chineseText }}</p>
          </div>
          <div class="record-controls">
            <button class="record-button" :class="{ 'is-recording': recording }" type="button" @click="toggleRecording">
              <Mic :size="26" />
            </button>
            <strong>{{ recording ? `录音中 ${recordSeconds}s` : '点击开始跟读' }}</strong>
            <span>录音只保留在当前浏览器内存中</span>
          </div>
          <div class="speak-actions">
            <button class="sl-button sl-button--secondary sl-button--sm" type="button" @click="replayCue"><Volume2 :size="16" /> 听原句</button>
            <audio v-if="audioRecordingUrl" :src="audioRecordingUrl" controls />
          </div>
        </div>
      </section>

      <div class="mode-progress-strip" @click.stop>
        <span>{{ modeProgress.progress }}%</span>
        <div class="sl-progress sl-progress--light">
          <div class="sl-progress__track"><span class="sl-progress__value" :style="{ width: `${modeProgress.progress}%` }" /></div>
        </div>
        <button
          v-if="modeProgress.progress === 100 && !modeProgress.confirmed"
          class="sl-button sl-button--accent sl-button--sm"
          type="button"
          @click="confirmMode"
        >
          完成本环节
        </button>
        <span v-else-if="modeProgress.confirmed" class="sl-badge sl-badge--success">已确认</span>
      </div>

      <div class="player-bottom-ui" :class="{ 'is-hidden': !visibility.visible.value }" @click.stop>
        <div class="player-control-layer">
          <div class="audio-deck">
            <div class="audio-deck__times">
              <span>{{ formatClock(currentTime * 1_000) }}</span>
              <span>{{ formatClock(duration * 1_000) }}</span>
            </div>
            <input
              class="audio-deck__range"
              type="range"
              min="0"
              :max="Math.max(duration, 1)"
              step="0.05"
              :value="currentTime"
              aria-label="播放进度"
              @input="(event) => { if (audio) audio.currentTime = Number((event.target as HTMLInputElement).value) }"
            />
            <div class="audio-deck__controls">
              <button class="sl-icon-button" type="button" aria-label="后退 15 秒" @click="seek(-15)"><RotateCcw :size="22" /></button>
              <button class="sl-icon-button" type="button" aria-label="重听当前句" @click="replayCue"><Volume2 :size="22" /></button>
              <button class="audio-deck__play" type="button" :aria-label="playing ? '暂停' : '播放'" @click="togglePlayback">
                <Pause v-if="playing" :size="25" fill="currentColor" />
                <Play v-else :size="25" fill="currentColor" />
              </button>
              <button class="sl-icon-button" type="button" aria-label="前进 15 秒" @click="seek(15)"><RotateCw :size="22" /></button>
              <select v-model="playbackRate" class="speed-select" aria-label="播放速度" @change="changeRate">
                <option :value="0.75">0.75×</option>
                <option :value="1">1×</option>
                <option :value="1.25">1.25×</option>
                <option :value="1.5">1.5×</option>
              </select>
            </div>
          </div>
        </div>

        <div class="player-mode-dock">
          <div class="sl-mode-switch sl-mode-switch--icon-only">
            <button
              v-for="item in modes"
              :key="item.value"
              class="sl-mode"
              type="button"
              role="tab"
              :aria-label="item.label"
              :aria-selected="mode === item.value"
              @click="selectMode(item.value)"
            >
              <component :is="item.icon" :size="22" />
            </button>
          </div>
        </div>
      </div>

      <audio
        ref="audio"
        :src="course.audioUrl || undefined"
        preload="metadata"
        @play="playing = true"
        @pause="playing = false"
        @timeupdate="onTimeUpdate"
        @ended="playing = false"
      />

      <div v-if="countdown !== null" class="player-complete-row" @click.stop>
        <span>本课已完成，{{ countdown }} 秒后进入下一课</span>
        <button class="sl-button sl-button--ghost sl-button--sm" type="button" @click="cancelAutoNext">取消</button>
      </div>

      <div v-if="notice" class="player-notice" @click.stop>
        <span>{{ notice }}</span>
        <button type="button" @click="notice = ''">关闭</button>
      </div>
    </template>

    <div v-else class="page-error">{{ error || '课程不存在' }}</div>
  </main>
</template>

<style scoped>
.player-atmosphere {
  background:
    radial-gradient(circle at 26% 8%, color-mix(in srgb, var(--player-course-a) 86%, transparent), transparent 38%),
    radial-gradient(circle at 82% 38%, color-mix(in srgb, var(--player-course-b) 78%, transparent), transparent 48%),
    linear-gradient(170deg, #20261e, #111510);
}

.player-identity__cover {
  background-position: center;
  background-size: cover;
}

.player-header__title {
  flex: 1;
}

.player-header__title span {
  color: var(--player-text-muted);
  font-size: 9px;
  letter-spacing: .12em;
}

.speed-select {
  min-width: 58px;
  height: 36px;
  padding: 0 7px;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 99px;
  background: rgba(20,24,18,.4);
  color: var(--player-text);
}

.player-stage {
  min-height: 0;
  flex: 1;
  padding-bottom: 150px;
}

.write-context {
  display: grid;
  gap: 2px;
  margin-top: 24px;
  max-height: 160px;
  overflow-y: auto;
}

.write-context button {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 8px;
  padding: 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(255,250,240,.48);
  text-align: left;
}

.write-context button.is-active {
  background: rgba(255,255,255,.08);
  color: var(--player-text);
}

.write-current-line {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
}

.write-current-line p {
  margin: 0;
  color: var(--player-text-muted);
  font-size: var(--text-body-sm);
}

.write-current-line > span {
  color: var(--player-text-muted);
  font-size: var(--text-caption);
}

.write-mode :deep(.sl-word-input) {
  row-gap: 22px;
}

.speak-current-line {
  display: grid;
  gap: 12px;
  text-align: center;
}

.speak-current-line h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(32px, 5vw, 56px);
  font-weight: var(--weight-regular);
  line-height: 1.08;
}

.speak-current-line > p:last-child {
  margin: 0;
  color: var(--player-text-muted);
}

.record-controls {
  display: grid;
  justify-items: center;
  gap: 10px;
  margin-top: 36px;
  color: var(--player-text);
}

.record-button {
  width: 78px;
  height: 78px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255,255,255,.24);
  border-radius: 50%;
  background: rgba(255,250,240,.12);
  color: var(--player-text);
  cursor: pointer;
}

.record-button.is-recording {
  background: var(--color-danger);
  animation: record-pulse 1.2s ease-in-out infinite;
}

@keyframes record-pulse {
  50% { transform: scale(1.05); }
}

.record-controls span {
  color: var(--player-text-muted);
  font-size: var(--text-caption);
}

.speak-actions {
  display: grid;
  justify-items: center;
  gap: 14px;
  margin-top: 28px;
}

.speak-actions audio {
  width: min(100%, 360px);
}

.mode-progress-strip {
  display: grid;
  grid-template-columns: auto minmax(80px, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 7px 20px;
  color: var(--player-text-muted);
  font-size: var(--text-caption);
}

.player-notice {
  position: absolute;
  z-index: 30;
  right: 18px;
  bottom: 190px;
  left: 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 15px;
  border-radius: 12px;
  background: rgba(20,24,18,.9);
  color: var(--player-text);
  backdrop-filter: blur(14px);
}

.player-notice button {
  border: 0;
  background: transparent;
  color: var(--player-active);
}

@media (min-width: 768px) {
  .mode-progress-strip {
    width: min(100%, 820px);
    margin-inline: auto;
  }
}
</style>
