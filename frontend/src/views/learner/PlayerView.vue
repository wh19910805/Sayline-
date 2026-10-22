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
  BookOpen,
  Captions,
  ChevronDown,
  Ellipsis,
  Headphones,
  Heart,
  Mic,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  RotateCw,
  Square,
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
  ModeState,
} from '@/api/types'
import WordDictation from '@/components/player/WordDictation.vue'
import { useControlVisibility } from '@/composables/useControlVisibility'
import { useCatalogStore } from '@/stores/catalog'
import { formatClock, formatDuration } from '@/utils/format'
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
const lyricsWindow = ref<HTMLElement | null>(null)
const recording = ref(false)
const recordSeconds = ref(0)
const audioRecordingUrl = ref('')
const recordingAudio = ref<HTMLAudioElement | null>(null)
const writeSubmitted = ref(false)
const countdown = ref<number | null>(null)
const chineseOverrides = ref<Record<LearningMode, boolean | null>>({
  LISTEN: null,
  READ: null,
  WRITE: null,
  SPEAK: null,
})
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

const autoHide = ref(true)
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
  const override = chineseOverrides.value[mode.value]
  if (override !== null) return override
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
const playerCoverStyle = computed(() => {
  const primary = course.value?.themeColorPrimary || '#53634e'
  const secondary = course.value?.themeColorSecondary || '#1f2a22'
  const gradient = `linear-gradient(145deg, ${primary}, ${secondary})`
  return {
    backgroundImage: course.value?.coverUrl
      ? `linear-gradient(145deg, rgba(255,255,255,.08), rgba(0,0,0,.24)), url("${course.value.coverUrl}")`
      : gradient,
  }
})
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
    duration.value = detail.durationMs / 1_000
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

function toggleChinese() {
  chineseOverrides.value[mode.value] = !showChinese.value
}

function modeState(value: LearningMode): ModeState {
  const key = value.toLowerCase() as 'listen' | 'read' | 'write' | 'speak'
  return learning.value?.modes[key] ?? { progress: 0, confirmed: false }
}

function moveCue(offset: number) {
  if (!course.value) return
  const target = Math.min(
    course.value.cues.length - 1,
    Math.max(0, activeCueIndex.value + offset),
  )
  const cue = course.value.cues[target]
  if (cue) seekToCue(cue)
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

function playRecording() {
  recordingAudio.value?.play().catch(() => undefined)
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

watch(activeCueIndex, () => {
  if (mode.value !== 'LISTEN') return
  nextTick(() => {
    lyricsWindow.value
      ?.querySelector<HTMLElement>('.lyric-line.is-active')
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
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
          <ChevronDown :size="22" />
        </button>
        <div class="player-header__title">
          <span>NOW LEARNING</span>
          <strong>逐句播放</strong>
        </div>
        <button class="sl-icon-button" :class="{ 'sl-icon-button--active': course.favorite }" type="button" aria-label="收藏课程" @click.stop="toggleFavorite">
          <Heart :size="20" :fill="course.favorite ? 'currentColor' : 'none'" />
        </button>
      </header>

      <section class="player-identity" @click.stop>
        <div class="player-identity__cover" :style="playerCoverStyle" />
        <div class="player-identity__copy">
          <p class="player-identity__meta">{{ course.categoryName }} · {{ formatDuration(course.durationMs) }}</p>
          <h1>{{ course.title }}</h1>
          <p>{{ course.description || '逐句听、读、写、说' }}</p>
        </div>
        <button class="sl-icon-button" type="button" aria-label="更多课程信息"><Ellipsis :size="21" /></button>
      </section>

      <div class="mode-progress-segments" @click.stop>
        <span
          v-for="item in modes"
          :key="item.value"
          :class="{ 'is-active': mode === item.value, 'is-complete': modeState(item.value).progress === 100 }"
        >
          <i :style="{ width: `${modeState(item.value).progress}%` }" />
        </span>
      </div>

      <section
        ref="modePanel"
        class="player-stage"
        @touchstart.passive="touchStart"
        @touchend="touchEnd"
      >
        <div v-if="mode === 'LISTEN'" class="listen-mode">
          <div ref="lyricsWindow" class="lyrics-window">
            <button
              v-for="(cue, index) in course.cues"
              :key="cue.id"
              class="lyric-line"
              :class="{ 'is-active': index === activeCueIndex, 'is-past': index < activeCueIndex }"
              type="button"
              @click.stop="seekToCue(cue)"
            >
              <strong class="lyric-line__en">{{ cue.englishText }}</strong>
              <span v-if="showChinese" class="lyric-line__zh">{{ cue.chineseText }}</span>
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
          <div class="write-mode__heading">
            <p class="eyebrow">DICTATION · {{ activeCueIndex + 1 }} / {{ course.cues.length }}</p>
            <h1>把听见的写下来</h1>
          </div>
          <div class="write-sentence-card">
            <div class="write-sentence-card__head">
              <span>当前句 · {{ String(activeCueIndex + 1).padStart(2, '0') }}</span>
              <div>
                <button type="button" @click="replayCue"><Volume2 :size="14" /> 听原句</button>
                <button type="button" :aria-pressed="showChinese" @click="toggleChinese">
                  <Captions :size="14" /> 中文
                </button>
              </div>
            </div>
            <p v-if="showChinese" class="write-sentence-card__translation">{{ activeCue.chineseText }}</p>
            <WordDictation
              :key="activeCue.id"
              :sentence="activeCue.englishText"
              :submitted="writeSubmitted || Boolean(currentCueProgress?.written)"
              @submit="submitWriting"
            />
            <span class="write-sentence-card__hint">离开输入区自动提交</span>
          </div>
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
          <div class="speak-mode__heading">
            <div>
              <p class="eyebrow">SHADOWING · {{ activeCueIndex + 1 }} / {{ course.cues.length }}</p>
              <span class="record-state">{{ recording ? '录音中' : audioRecordingUrl ? '已录音' : '未录音' }}</span>
            </div>
            <h1>让这一句从你口中经过</h1>
          </div>
          <div class="speak-current-line">
            <h2>{{ activeCue.englishText }}</h2>
            <p v-if="showChinese">{{ activeCue.chineseText }}</p>
          </div>
          <div class="record-wave" :class="{ 'is-live': recording }" aria-hidden="true">
            <i v-for="index in 11" :key="index" :style="{ animationDelay: `${index * -70}ms` }" />
          </div>
          <div class="record-controls">
            <button class="record-button" :class="{ 'is-recording': recording }" type="button" @click="toggleRecording">
              <Square v-if="recording" :size="22" fill="currentColor" />
              <Mic v-else :size="26" />
            </button>
            <strong>{{ recording ? `${recordSeconds}s · 点击结束` : '点击话筒开始跟读' }}</strong>
            <span>录音仅保留在当前浏览器内存中</span>
          </div>
          <div class="speak-actions">
            <button type="button" @click="replayCue"><Play :size="14" /> 原句</button>
            <audio v-if="audioRecordingUrl" ref="recordingAudio" :src="audioRecordingUrl" controls />
            <button type="button" :disabled="!audioRecordingUrl" @click="playRecording">
              <Play :size="14" /> 我的录音
            </button>
          </div>
          <div class="speak-navigation">
            <button type="button" :disabled="activeCueIndex === 0" @click="moveCue(-1)">上一句</button>
            <button type="button" :disabled="activeCueIndex === course.cues.length - 1" @click="moveCue(1)">下一句</button>
          </div>
        </div>
      </section>

      <div class="player-bottom-ui" :class="{ 'is-hidden': !visibility.visible.value }" @click.stop>
        <div v-if="mode === 'LISTEN' || mode === 'READ'" class="player-control-layer">
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

        <div v-if="modeProgress.progress === 100 && !modeProgress.confirmed" class="player-mode-complete">
          <button class="sl-button sl-button--accent sl-button--sm" type="button" @click="confirmMode">
            完成本环节
          </button>
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
  position: relative;
  overflow: hidden;
  background-position: center;
  background-size: cover;
}

.player-identity__cover::before {
  content: "";
  position: absolute;
  width: 34px;
  height: 34px;
  top: 9px;
  left: 8px;
  border: 1px solid rgba(255, 250, 240, .2);
  border-radius: 50%;
}

.player-identity__cover::after {
  content: "";
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 14px;
  height: 1px;
  background: rgba(255, 250, 240, .48);
}

.player-header__title {
  flex: 1;
}

.player-header__title span {
  color: var(--player-text-muted);
  font-size: 8px;
  letter-spacing: .12em;
}

.player-header__title strong {
  font-size: 11px;
  font-weight: var(--weight-medium);
}

.player-identity__copy {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 2px;
}

.player-identity__copy h1 {
  margin: 0;
}

.player-identity__copy > p:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-progress-segments {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 7px 20px 8px;
}

.mode-progress-segments > span {
  height: 3px;
  overflow: hidden;
  border-radius: 99px;
  background: rgba(255, 250, 240, .18);
}

.mode-progress-segments > span.is-active {
  background: rgba(255, 250, 240, .42);
}

.mode-progress-segments > span i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: rgba(255, 250, 240, .72);
  transition: width var(--duration-base) var(--ease-out);
}

.mode-progress-segments > span.is-active i {
  background: var(--player-active);
}

.mode-progress-segments > span.is-complete i {
  background: var(--color-oat-200);
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

.write-mode {
  gap: 16px;
  padding: 5px 20px 0;
  overflow-y: auto;
}

.write-mode__heading {
  display: grid;
  gap: 5px;
  padding: 4px 2px 2px;
}

.write-mode__heading h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 31px;
  font-weight: var(--weight-regular);
  line-height: 1;
  letter-spacing: -.025em;
}

.write-sentence-card {
  display: grid;
  gap: 20px;
  padding: 14px 15px 13px;
  border: 1px solid rgba(255, 250, 240, .2);
  border-radius: 14px;
  background: rgba(28, 33, 26, .34);
  box-shadow: 0 14px 36px rgba(5, 8, 4, .16);
  backdrop-filter: blur(10px);
}

.write-sentence-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: rgba(255, 250, 240, .72);
  font-size: 10px;
}

.write-sentence-card__head > div {
  display: flex;
  gap: 7px;
}

.write-sentence-card__head button {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 9px;
  border: 1px solid rgba(255, 250, 240, .18);
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 250, 240, .72);
  font-size: 9px;
  cursor: pointer;
}

.write-sentence-card__head button[aria-pressed="true"] {
  border-color: rgba(217, 181, 110, .55);
  color: var(--color-oat-200);
}

.write-sentence-card__translation {
  margin: -8px 0 0;
  color: rgba(255, 250, 240, .72);
  font-size: var(--text-body-sm);
  line-height: 1.6;
}

.write-sentence-card__hint {
  justify-self: end;
  color: rgba(255, 250, 240, .34);
  font-size: 9px;
}

.write-mode :deep(.sl-word-input) {
  row-gap: 18px;
}

.speak-mode {
  padding: 5px 20px 24px;
}

.speak-mode__heading {
  display: grid;
  gap: 6px;
}

.speak-mode__heading > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.speak-mode__heading h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 31px;
  font-weight: var(--weight-regular);
  line-height: 1.02;
  letter-spacing: -.025em;
}

.record-state {
  padding: 5px 9px;
  border: 1px solid rgba(255, 250, 240, .16);
  border-radius: 99px;
  color: rgba(255, 250, 240, .58);
  font-size: 9px;
}

.speak-current-line {
  display: grid;
  gap: 8px;
  margin-top: 16px;
  text-align: left;
}

.speak-current-line h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(27px, 5vw, 42px);
  font-weight: var(--weight-regular);
  line-height: 1.08;
}

.speak-current-line > p:last-child {
  margin: 0;
  color: var(--player-text-muted);
}

.record-wave {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
}

.record-wave i {
  width: 2px;
  height: 18px;
  border-radius: 99px;
  background: rgba(255, 250, 240, .34);
}

.record-wave i:nth-child(2n) {
  height: 30px;
}

.record-wave i:nth-child(3n) {
  height: 42px;
}

.record-wave i:nth-child(5n) {
  height: 52px;
}

.record-wave.is-live i {
  background: var(--player-active);
  animation: wave-live .8s ease-in-out infinite alternate;
}

@keyframes wave-live {
  to { transform: scaleY(2.1); }
}

.record-controls {
  display: grid;
  justify-items: center;
  gap: 10px;
  margin-top: 5px;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.speak-actions audio {
  grid-column: 1 / -1;
  width: 100%;
  height: 34px;
}

.speak-actions button,
.speak-navigation button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid rgba(255, 250, 240, .17);
  border-radius: 10px;
  background: rgba(255, 255, 255, .04);
  color: rgba(255, 250, 240, .72);
  font-size: 11px;
  cursor: pointer;
}

.speak-actions button:disabled,
.speak-navigation button:disabled {
  opacity: .35;
  cursor: default;
}

.speak-navigation {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
}

.speak-navigation button {
  min-height: 46px;
  border-radius: 99px;
  font-size: 13px;
}

.player-mode-complete {
  width: min(100%, 680px);
  display: flex;
  justify-content: flex-end;
  margin: 0 auto;
  padding: 4px 22px 2px;
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
  .mode-progress-segments {
    width: min(100%, 820px);
    margin-inline: auto;
  }
}
</style>
