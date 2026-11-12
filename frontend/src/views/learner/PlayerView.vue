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
import SlIcon from '@/components/ui/SlIcon.vue'
import { useRoute, useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/http'
import { cacheDelete } from '@/api/cache'
import { learnerApi } from '@/api/services'
import { setAmbient, setThemeColor, syncThemeColor } from '@/composables/useAmbient'
import type {
  BookDetail,
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
const bookInfo = ref<BookDetail | null>(null)
const learning = ref<LearningState | null>(null)
const settings = ref<LearningSettings | null>(null)
const mode = ref<LearningMode>('LISTEN')
const activeCueIndex = ref(0)
const playing = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const playbackRate = ref(1)
const speedMenuOpen = ref(false)
const error = ref('')
const notice = ref('')
const loading = ref(true)
const modePanel = ref<HTMLElement | null>(null)
const lyricsWindow = ref<HTMLElement | null>(null)
const writeTranscript = ref<HTMLElement | null>(null)
const recording = ref(false)
const recordSeconds = ref(0)
const audioRecordingUrl = ref('')
const recordingAudio = ref<HTMLAudioElement | null>(null)
const writeSubmitted = ref(false)
const showEnglishWrite = ref(false)
const countdown = ref<number | null>(null)
const modeCountdown = ref<number | null>(null)
const pendingMode = ref<LearningMode | null>(null)
const sentenceStopMs = ref<number | null>(null)
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
let suppressRouteReload = false
let modeCountdownTimer: ReturnType<typeof setInterval> | undefined
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

const courseId = ref(Number(route.params.lessonId))
const playMode = ref<'single' | 'sequential' | 'loop'>('single')
const activeCue = computed<Cue | null>(() => course.value?.cues[activeCueIndex.value] ?? null)
const modeProgress = computed(() => {
  const key = mode.value.toLowerCase() as 'listen' | 'read' | 'write' | 'speak'
  return learning.value?.modes[key] ?? { progress: 0, confirmed: false }
})
const canConfirm = computed(() => modeProgress.value.progress >= 100)
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

function mixWithBlack(hex: string, amount: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return '#1a1a18'
  const channel = (offset: number) =>
    Math.round(parseInt(hex.slice(offset, offset + 2), 16) * (1 - amount))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

const playerSurface = computed(() => {
  const base = course.value?.themeColorSecondary || course.value?.themeColorPrimary || '#1a1a18'
  return mixWithBlack(base, 0.45)
})
const backgroundStyle = computed(() => ({
  '--player-course-a': course.value?.themeColorPrimary || '#53634e',
  '--player-course-b': course.value?.themeColorSecondary || '#1f2a22',
  '--player-surface': playerSurface.value,
}))
const audioProgress = computed(() =>
  duration.value > 0 ? Math.min(100, (currentTime.value / duration.value) * 100) : 0,
)
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
const coverBackdropStyle = computed(() => ({
  backgroundImage: course.value?.coverUrl ? `url("${course.value.coverUrl}")` : undefined,
}))
const modes = [
  { value: 'LISTEN' as const, label: '听', icon: 'headphone' },
  { value: 'READ' as const, label: '读', icon: 'book-read' },
  { value: 'WRITE' as const, label: '写', icon: 'pencil' },
  { value: 'SPEAK' as const, label: '说', icon: 'mic' },
]
const pendingModeLabel = computed(
  () => modes.find((item) => item.value === pendingMode.value)?.label ?? '',
)

async function loadCourse(showLoader = true) {
  if (showLoader) loading.value = true
  error.value = ''
  try {
    const [detail, state, userSettings, book] = await Promise.all([
      learnerApi.course(courseId.value),
      learnerApi.learningState(courseId.value),
      learnerApi.settings(),
      learnerApi.book(Number(route.params.bookId)).catch(() => null),
    ])
    bookInfo.value = book
    course.value = detail
    updateMediaSession()
    if (detail.themeColorPrimary) {
      setAmbient(detail.themeColorPrimary, detail.themeColorSecondary || detail.themeColorPrimary, detail.coverUrl || null)
      setThemeColor(playerSurface.value)
    }
    learning.value = state
    settings.value = userSettings
    playbackRate.value = userSettings.playbackRate ?? 1
    duration.value = detail.durationMs / 1_000
    mode.value = state.lastMode || 'LISTEN'
    autoHide.value = mode.value === 'LISTEN' || mode.value === 'READ'
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
  sentenceStopMs.value = null
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
    sentenceStopMs.value = null
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
    sentenceStopMs.value = mode.value === 'LISTEN' ? null : cue.endMs
    audio.value.play().catch(() => undefined)
  }
  visibility.show()
}

function replayCue() {
  if (!activeCue.value || !audio.value) return
  audio.value.currentTime = activeCue.value.startMs / 1_000
  sentenceStopMs.value = activeCue.value.endMs
  audio.value.play().catch(() => undefined)
}

function toggleCuePlayback() {
  if (!audio.value) return
  if (!audio.value.paused) {
    audio.value.pause()
    return
  }
  replayCue()
}

function changeRate() {
  if (!audio.value) return
  audio.value.playbackRate = playbackRate.value
}

function toggleSpeedMenu() {
  speedMenuOpen.value = !speedMenuOpen.value
  visibility.show()
}

function chooseRate(rate: number) {
  playbackRate.value = rate
  speedMenuOpen.value = false
  changeRate()
}

function handleSurfaceClick() {
  speedMenuOpen.value = false
  visibility.show()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !speedMenuOpen.value) return
  speedMenuOpen.value = false
  visibility.show()
}

function onTimeUpdate() {
  if (!audio.value || !course.value) return
  currentTime.value = audio.value.currentTime
  duration.value = audio.value.duration || course.value.durationMs / 1_000
  if (
    sentenceStopMs.value !== null &&
    audio.value.currentTime * 1_000 >= sentenceStopMs.value
  ) {
    audio.value.pause()
    sentenceStopMs.value = null
    return
  }
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

function recordWriting(cueId: number, answer: string) {
  markCue(cueId, 'WRITE', answer)
}

function submitWriting(cueId: number, answer: string) {
  writeSubmitted.value = true
  markCue(cueId, 'WRITE', answer)
}

function selectCue(index: number) {
  if (recording.value) return
  activeCueIndex.value = index
  writeSubmitted.value = false
  nextTick(scrollWriteToCurrent)
}

function handleDictationComplete(cueId: number, answer: string) {
  if (writeSubmitted.value) return
  submitWriting(cueId, answer)
  if (activeCueIndex.value < (course.value?.cues.length ?? 0) - 1) {
    writeSubmitted.value = false
    moveCue(1)
  }
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

function nextUnconfirmedMode(state: LearningState, current: LearningMode): LearningMode | null {
  const order: LearningMode[] = ['LISTEN', 'READ', 'WRITE', 'SPEAK']
  const currentIndex = order.indexOf(current)
  for (let step = 1; step < order.length; step += 1) {
    const candidate = order[(currentIndex + step) % order.length]
    const key = candidate.toLowerCase() as 'listen' | 'read' | 'write' | 'speak'
    if (!state.modes[key].confirmed) return candidate
  }
  return null
}

function cancelModeAdvance() {
  if (modeCountdownTimer) clearInterval(modeCountdownTimer)
  modeCountdownTimer = undefined
  modeCountdown.value = null
  pendingMode.value = null
}

function beginModeAdvance() {
  if (!learning.value || learning.value.completed || modeCountdown.value !== null || countdown.value !== null) {
    return
  }
  const nextMode = nextUnconfirmedMode(learning.value, mode.value)
  if (!nextMode) return

  pendingMode.value = nextMode
  modeCountdown.value = 3
  modeCountdownTimer = setInterval(() => {
    if (modeCountdown.value === null) return
    modeCountdown.value -= 1
    if (modeCountdown.value <= 0) {
      const target = pendingMode.value
      cancelModeAdvance()
      if (target) finishModeAdvance(target)
    }
  }, 1_000)
}

async function finishModeAdvance(target: LearningMode | null) {
  try {
    const completedMode = mode.value
    const state = await learnerApi.confirm(courseId.value, completedMode)
    learning.value = state
    if (state.completed) beginAutoNext()
    else if (target) selectMode(target)
  } catch (reason) {
    notice.value = apiErrorMessage(reason)
  }
}

async function confirmMode() {
  cancelModeAdvance()
  const target = learning.value ? nextUnconfirmedMode(learning.value, mode.value) : null
  await finishModeAdvance(target)
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

const playModeLabel = computed(() =>
  playMode.value === 'single' ? '单播' : playMode.value === 'sequential' ? '连播' : '循环',
)

function cyclePlayMode() {
  playMode.value =
    playMode.value === 'single' ? 'sequential' : playMode.value === 'sequential' ? 'loop' : 'single'
}

function moveCourse(direction: 1 | -1, fromStart = false, loop = false) {
  const ids = catalog.currentLessonIds.length
    ? catalog.currentLessonIds
    : course.value
      ? [course.value.id]
      : []
  const index = ids.indexOf(courseId.value)
  let target = index + direction
  if (target < 0) {
    if (loop) target = ids.length - 1
    else {
      notice.value = '已经是第一门课程'
      return
    }
  }
  if (target >= ids.length) {
    if (loop) target = 0
    else return
  }
  savePosition()
  const nextId = ids[target]
  suppressRouteReload = true
  courseId.value = nextId
  router.replace(`/learn/${route.params.bookId}/${nextId}`)
  void loadCourse(false).then(() => {
    if (fromStart && audio.value) {
      audio.value.currentTime = 0
    }
    audio.value?.play().catch(() => undefined)
  })
}

function onEnded() {
  playing.value = false
  if (mode.value !== 'LISTEN') return
  if (playMode.value === 'single') return
  moveCourse(1, true, playMode.value === 'loop')
}

function updateMediaSession() {
  if (!('mediaSession' in navigator) || !course.value) return
  const cover = course.value.coverUrl
  navigator.mediaSession.metadata = new MediaMetadata({
    title: course.value.title,
    artist: bookInfo.value?.title || course.value.categoryName || 'Sayline 逐句英语',
    album: 'Sayline 逐句英语',
    artwork: cover ? [{ src: cover, sizes: '512x512', type: coverMimeType(cover) }] : [],
  })
}

function coverMimeType(url: string): string {
  const path = url.split('?')[0]?.toLowerCase() ?? ''
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

function setupMediaSession() {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.setActionHandler('play', () => {
    audio.value?.play().catch(() => undefined)
  })
  navigator.mediaSession.setActionHandler('pause', () => {
    audio.value?.pause()
  })
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    moveCourse(1)
  })
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    moveCourse(-1)
  })
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

function scrollWriteToCurrent() {
  const container = writeTranscript.value
  const current = container?.querySelector<HTMLElement>('.write-current')
  if (!container || !current) return
  container.scrollTop = Math.max(0, current.offsetTop - container.clientHeight * 0.16)
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
  () => route.params.lessonId,
  (value) => {
    if (suppressRouteReload) {
      suppressRouteReload = false
      return
    }
    const id = Number(value)
    if (id === courseId.value) return
    courseId.value = id
    loadCourse()
  },
)

watch(mode, () => {
  cancelModeAdvance()
  activeSince = performance.now()
  writeSubmitted.value = false
  autoHide.value = mode.value === 'LISTEN' || mode.value === 'READ'
  if (mode.value === 'READ') {
    startReadObservation()
  } else {
    stopReadObservation()
  }
  if (mode.value === 'WRITE') {
    nextTick(scrollWriteToCurrent)
  }
})

watch(
  () => [mode.value, modeProgress.value.progress, modeProgress.value.confirmed] as const,
  ([, progress, confirmed]) => {
    if (progress >= 100 && !confirmed) {
      beginModeAdvance()
    } else {
      cancelModeAdvance()
    }
  },
)

watch(activeCueIndex, () => {
  if (mode.value === 'LISTEN') {
    nextTick(() => {
      const container = lyricsWindow.value
      const active = container?.querySelector<HTMLElement>('.lyric-line.is-active')
      if (!container || !active) return
      container.scrollTo({
        top: Math.max(0, active.offsetTop - container.clientHeight * 0.42),
        behavior: 'smooth',
      })
    })
  } else if (mode.value === 'WRITE') {
    nextTick(scrollWriteToCurrent)
  }
})

watch(
  () => course.value?.themeColorPrimary,
  (color) => {
    if (!color) return
    setAmbient(color, course.value?.themeColorSecondary || color)
    setThemeColor(playerSurface.value)
  },
)

onMounted(async () => {
  setThemeColor('#1a1a18')
  window.addEventListener('keydown', handleKeydown)
  setupMediaSession()
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
  window.removeEventListener('keydown', handleKeydown)
  clearInterval(heartbeatTimer)
  clearInterval(progressTimer)
  clearInterval(positionTimer)
  clearInterval(countdownTimer)
  clearInterval(modeCountdownTimer)
  stopReadObservation()
  mediaRecorder?.stream?.getTracks().forEach((track) => track.stop())
  if (audioRecordingUrl.value) URL.revokeObjectURL(audioRecordingUrl.value)
  cacheDelete('recentLessons')
  syncThemeColor()
})
</script>

<template>
  <main
    class="app-screen player-screen"
    :class="[`player-mode-${mode.toLowerCase()}`, { 'controls-visible': visibility.visible.value }]"
    :style="backgroundStyle"
    @click="handleSurfaceClick"
  >
    <div v-if="course?.coverUrl" class="player-cover-backdrop" :key="course.id" :style="coverBackdropStyle" aria-hidden="true" />
    <div class="player-atmosphere" aria-hidden="true" />
    <div class="player-overlay" aria-hidden="true" />
    <div class="player-top-surface" aria-hidden="true" />

    <div v-if="loading" class="player-loading-skeleton" aria-hidden="true">
      <span class="skeleton-bar" style="width: 34%" />
      <span class="skeleton-bar" style="width: 72%" />
      <span class="skeleton-bar" style="width: 58%" />
      <span class="skeleton-bar" style="width: 46%" />
    </div>
    <template v-else-if="course && learning && settings">
      <header class="player-header" @click.stop>
        <button class="sl-icon-button" type="button" aria-label="返回" @click="router.back()">
          <SlIcon name="arrow-down-s" :size="22" />
        </button>
        <div class="player-header__title">
          <span>{{ bookInfo?.title || course.categoryName || 'NOW LEARNING' }}</span>
          <strong>{{ course.title }}</strong>
        </div>
        <button class="sl-icon-button" :class="{ 'sl-icon-button--active': course.favorite }" type="button" aria-label="收藏课程" @click.stop="toggleFavorite">
          <SlIcon name="heart" :size="20" :weight="course.favorite ? 'fill' : 'line'" />
        </button>
      </header>

      <section class="player-identity" @click.stop>
        <div class="player-identity__cover" :style="playerCoverStyle" />
        <div class="player-identity__copy">
          <p class="player-identity__meta">{{ bookInfo?.title || course.categoryName }} · {{ formatDuration(course.durationMs) }}</p>
          <h1>{{ course.title }}</h1>
          <p>{{ course.description || '逐句听、读、写、说' }}</p>
        </div>
        <button
          class="sl-icon-button player-more play-mode-toggle"
          :class="{ 'is-on': playMode !== 'single', 'is-loop': playMode === 'loop' }"
          type="button"
          :aria-label="`播放模式：${playModeLabel}`"
          :title="`播放模式：${playModeLabel}`"
          @click="cyclePlayMode"
        >
          <SlIcon name="repeat" :size="20" :weight="playMode === 'single' ? 'line' : 'fill'" />
        </button>
      </section>

      <div class="mode-progress-strip" @click.stop>
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
          <div class="read-mode__head">
            <div>
              <p class="eyebrow">双语原文</p>
              <h2>逐句原文</h2>
            </div>
            <button class="translation-toggle" type="button" @click.stop="toggleChinese">
              {{ showChinese ? '隐藏中文' : '显示中文' }}
            </button>
          </div>
          <div class="transcript-list">
            <button
              v-for="(cue, index) in course.cues"
              :key="cue.id"
              :ref="(element) => setTranscriptElement(cue.id, element)"
              :data-cue-id="cue.id"
              class="transcript-row"
              :class="{ 'is-active': index === activeCueIndex }"
              type="button"
              @click.stop="seekToCue(cue)"
            >
              <span class="transcript-row__index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="transcript-row__copy">
                <strong lang="en">{{ cue.englishText }}</strong>
                <span v-if="showChinese" lang="zh">{{ cue.chineseText }}</span>
              </span>
              <SlIcon name="play" :size="16" />
            </button>
          </div>
        </div>

        <div v-else-if="mode === 'WRITE' && activeCue" class="write-mode" @click.stop>
          <div class="mode-copy">
            <div>
              <p class="eyebrow">听写 · {{ activeCueIndex + 1 }}/{{ course.cues.length }}</p>
              <h2>把听见的写下来</h2>
            </div>
          </div>
          <div ref="writeTranscript" class="write-transcript">
            <template v-for="(cue, index) in course.cues" :key="cue.id">
              <div
                v-if="index !== activeCueIndex"
                class="write-context-row"
                :class="index < activeCueIndex ? 'is-before' : 'is-after'"
                role="button"
                tabindex="0"
                @click="selectCue(index)"
                @keydown.enter="selectCue(index)"
              >
                <span>{{ String(index + 1).padStart(2, '0') }}</span>
                <div>
                  <p lang="en">{{ cue.englishText }}</p>
                  <small v-if="showChinese" lang="zh">{{ cue.chineseText }}</small>
                </div>
              </div>
              <section v-else class="write-current">
                <div class="write-current__head">
                  <span class="write-current__label">当前句 · {{ String(index + 1).padStart(2, '0') }}</span>
                  <div class="write-current__actions">
                    <button type="button" :aria-label="playing ? '暂停当前句' : '播放当前句'" @click.stop="replayCue">
                      <SlIcon name="pause" v-if="playing" :size="17" weight="fill" />
                      <SlIcon name="play" v-else :size="17" weight="fill" />
                      <span>{{ playing ? '暂停' : '听原句' }}</span>
                    </button>
                    <button
                      type="button"
                      :aria-pressed="showChinese"
                      :class="{ 'is-active': showChinese }"
                      @click.stop="toggleChinese"
                    >
                      <SlIcon name="closed-captioning" :size="17" />
                      <span>中文</span>
                    </button>
                    <button
                      type="button"
                      :aria-pressed="showEnglishWrite"
                      :class="{ 'is-active': showEnglishWrite }"
                      @click.stop="showEnglishWrite = !showEnglishWrite"
                    >
                      <SlIcon name="book-open" :size="17" />
                      <span>英文</span>
                    </button>
                  </div>
                </div>
                <p class="write-current__translation" :class="{ 'is-hidden': !showChinese }">
                  {{ showChinese ? cue.chineseText : '中文翻译已隐藏' }}
                </p>
                <p v-if="showEnglishWrite" class="write-current__english" lang="en">
                  {{ cue.englishText }}
                </p>
                <div class="word-input-card">
                  <div class="word-input-card__head">
                    <span>逐词填写</span>
                    <small>离开输入区自动提交</small>
                  </div>
                  <WordDictation
                    :key="cue.id"
                    :sentence="cue.englishText"
                    :submitted="writeSubmitted"
                    @submit="(answer) => recordWriting(cue.id, answer)"
                    @complete="(answer) => handleDictationComplete(cue.id, answer)"
                  />
                </div>
                <button
                  class="skip-link"
                  type="button"
                  @click.stop="moveCue(1)"
                >
                  暂时跳过这一句
                </button>
              </section>
            </template>
          </div>
        </div>

        <div v-else-if="mode === 'SPEAK' && activeCue" class="speak-mode" @click.stop>
          <div class="mode-copy">
            <div>
              <p class="eyebrow">跟读 · {{ activeCueIndex + 1 }}/{{ course.cues.length }}</p>
              <h2>让这一句从你口中经过</h2>
            </div>
            <span class="record-state">{{ recording ? '录音中' : audioRecordingUrl ? '已录音' : '未录音' }}</span>
          </div>
          <div class="speak-quote">
            <span lang="en">{{ activeCue.englishText }}</span>
            <small v-if="showChinese" lang="zh">{{ activeCue.chineseText }}</small>
          </div>
          <div class="record-stage">
            <div class="record-wave" :class="{ 'is-live': recording }" aria-hidden="true">
              <i
                v-for="(height, index) in [18, 29, 42, 34, 52, 28, 44, 23, 35, 20]"
                :key="index"
                :style="{ height: `${height}px` }"
              />
            </div>
            <button class="record-button" :class="{ 'is-recording': recording }" type="button" @click="toggleRecording">
              <SlIcon name="stop" v-if="recording" :size="22" />
              <SlIcon name="mic" v-else :size="26" />
            </button>
            <p>{{ recording ? `正在录音 · ${recordSeconds}s` : audioRecordingUrl ? '可以回听刚才的跟读' : '点击后跟读当前句' }}</p>
          </div>
          <div class="voice-compare">
            <button type="button" @click="replayCue"><SlIcon name="play" :size="14" /> 原句</button>
            <audio v-if="audioRecordingUrl" ref="recordingAudio" :src="audioRecordingUrl" controls />
            <button type="button" :disabled="!audioRecordingUrl" @click="playRecording">
              <SlIcon name="play" :size="14" /> 我的录音
            </button>
          </div>
          <div class="mode-actions mode-actions--row">
            <button
              class="sl-button sl-button--secondary"
              type="button"
              :disabled="activeCueIndex === 0"
              @click="moveCue(-1)"
            >
              上一句
            </button>
            <button
              class="sl-button sl-button--accent"
              type="button"
              :disabled="activeCueIndex === course.cues.length - 1"
              @click="moveCue(1)"
            >
              下一句
            </button>
          </div>
        </div>
      </section>

      <div class="player-bottom-ui" :class="{ 'is-hidden': !visibility.visible.value }" @click.stop>
        <div v-if="mode === 'LISTEN'" class="player-control-layer">
          <div class="audio-deck">
            <div class="audio-deck__times">
              <span>{{ formatClock(currentTime * 1_000) }}</span>
              <div class="audio-deck__speed">
                <button
                  class="speed-select"
                  type="button"
                  aria-label="播放速度"
                  :aria-expanded="speedMenuOpen"
                  @click.stop="toggleSpeedMenu"
                >
                  {{ playbackRate.toFixed(2).replace(/0$/, '') }}×
                </button>
                <Transition name="speed-menu">
                  <div v-if="speedMenuOpen" class="speed-menu" role="menu" @click.stop>
                    <button
                      v-for="rate in [0.25, 0.5, 0.75, 1, 1.25, 1.5]"
                      :key="rate"
                      type="button"
                      role="menuitem"
                      :aria-current="playbackRate === rate"
                      @click="chooseRate(rate)"
                    >
                      {{ rate }}×
                    </button>
                  </div>
                </Transition>
              </div>
              <span>{{ formatClock(duration * 1_000) }}</span>
            </div>
            <input
              class="audio-deck__range"
              type="range"
              min="0"
              :max="Math.max(duration, 1)"
              step="0.05"
              :value="currentTime"
              :style="{ '--range-progress': `${audioProgress}%` }"
              aria-label="播放进度"
              @input="(event) => { if (audio) audio.currentTime = Number((event.target as HTMLInputElement).value) }"
            />
            <div class="audio-deck__controls">
              <button class="sl-icon-button transport-round" type="button" aria-label="后退 15 秒" @click="seek(-15)">
                <SlIcon name="replay-15" :size="28" />
              </button>
              <button class="sl-icon-button transport-skip" type="button" aria-label="上一句" @click="moveCue(-1)">
                <SlIcon name="skip-back" :size="27" weight="fill" />
              </button>
              <button class="audio-play" type="button" :aria-label="playing ? '暂停' : '播放'" @click="togglePlayback">
                <SlIcon name="pause" v-if="playing" :size="28" weight="fill" />
                <SlIcon name="play" v-else :size="28" weight="fill" />
              </button>
              <button class="sl-icon-button transport-skip" type="button" aria-label="下一句" @click="moveCue(1)">
                <SlIcon name="skip-forward" :size="27" weight="fill" />
              </button>
              <button class="sl-icon-button transport-round" type="button" aria-label="前进 15 秒" @click="seek(15)">
                <SlIcon name="forward-15" :size="28" />
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="mode === 'READ'" class="player-control-layer">
          <div class="audio-deck">
            <div class="audio-deck__controls audio-deck__controls--read">
              <button class="sl-icon-button transport-skip" type="button" aria-label="上一句" @click="moveCue(-1)">
                <SlIcon name="skip-back" :size="27" weight="fill" />
              </button>
              <button class="audio-play" type="button" :aria-label="playing ? '暂停本句' : '播放本句'" @click="toggleCuePlayback">
                <SlIcon name="pause" v-if="playing" :size="28" weight="fill" />
                <SlIcon name="play" v-else :size="28" weight="fill" />
              </button>
              <button class="sl-icon-button transport-skip" type="button" aria-label="下一句" @click="moveCue(1)">
                <SlIcon name="skip-forward" :size="27" weight="fill" />
              </button>
            </div>
          </div>
        </div>

        <div class="player-complete-row">
          <span
            v-if="modeCountdown !== null && pendingMode"
            class="mode-transition-prompt"
            role="status"
            aria-live="polite"
          >
            {{ modeCountdown }} 秒后进入{{ pendingModeLabel }}模式
          </span>
          <button
            v-else
            class="sl-button sl-button--sm player-complete-button"
            type="button"
            :disabled="!canConfirm || modeProgress.confirmed"
            @click="confirmMode"
          >
            {{ modeProgress.confirmed ? '已完成' : '完成本环节' }}
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
              <SlIcon :name="item.icon" :size="22" />
              <span class="sl-mode__label">{{ item.label }}</span>
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
        @ended="onEnded"
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
.player-screen {
  overflow: clip;
  transition: --player-course-a 700ms var(--ease-out), --player-course-b 700ms var(--ease-out);
}

.player-cover-backdrop {
  position: absolute;
  z-index: 0;
  top: var(--safe-top);
  right: -10%;
  bottom: -10%;
  left: -10%;
  background-position: center;
  background-size: cover;
  filter: blur(48px) saturate(1.15);
  opacity: 0;
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 64px);
  mask-image: linear-gradient(to bottom, transparent, #000 64px);
  pointer-events: none;
  animation: cover-backdrop-in 900ms var(--ease-out) forwards;
}

@keyframes cover-backdrop-in {
  from {
    opacity: 0;
  }
  to {
    opacity: .55;
  }
}

.player-loading-skeleton {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 28px 20px;
}

.skeleton-bar {
  height: 15px;
  border-radius: 8px;
  background: rgba(255, 250, 240, .14);
  animation: skeleton-pulse 1.2s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: .45; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-bar { animation: none; }
}

.player-atmosphere {
  background:
    radial-gradient(circle at 82% 22%, color-mix(in srgb, var(--player-course-b) 45%, transparent), transparent 55%),
    linear-gradient(165deg, color-mix(in srgb, var(--player-course-a) 65%, transparent), color-mix(in srgb, var(--player-course-b) 40%, transparent));
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
  font-size: 10px;
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

.player-control-layer {
  padding: 9px 25px 0;
}

.audio-deck {
  padding: 0;
}

.audio-deck__times {
  width: 100%;
  grid-template-columns: 1fr auto 1fr;
  color: rgba(255, 250, 240, .38);
  font-size: 10px;
  line-height: 1;
}

.audio-deck__times span:last-child {
  text-align: right;
}

.audio-deck__range {
  width: 100%;
  height: 12px;
  display: block;
  margin: 5px 0 12px;
  padding: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.audio-deck__range::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 99px;
  background: linear-gradient(
    90deg,
    rgba(255, 250, 240, .84) 0 var(--range-progress),
    rgba(255, 250, 240, .18) var(--range-progress) 100%
  );
}

.audio-deck__range::-webkit-slider-thumb {
  width: 8px;
  height: 8px;
  margin-top: -2.5px;
  appearance: none;
  border: 0;
  border-radius: 50%;
  background: var(--player-text);
}

.audio-deck__range::-moz-range-track {
  height: 3px;
  border-radius: 99px;
  background: rgba(255, 250, 240, .18);
}

.audio-deck__range::-moz-range-progress {
  height: 3px;
  border-radius: 99px;
  background: rgba(255, 250, 240, .84);
}

.audio-deck__range::-moz-range-thumb {
  width: 8px;
  height: 8px;
  border: 0;
  border-radius: 50%;
  background: var(--player-text);
}

.audio-deck__range:focus-visible {
  outline: 2px solid rgba(0, 120, 212, .9);
  outline-offset: 4px;
}

.audio-deck__controls {
  display: grid;
  grid-template-columns: 44px 44px 58px 44px 44px;
  justify-content: space-between;
  align-items: center;
  gap: 0;
  padding: 0;
}

.audio-deck__controls--read {
  grid-template-columns: 44px 58px 44px;
}

.audio-deck__controls .sl-icon-button {
  width: var(--touch-target);
  height: var(--touch-target);
  color: rgba(255, 250, 240, .78);
}

.audio-play {
  width: 58px;
  height: 58px;
}

.speed-select:focus-visible {
  outline: 2px solid rgba(255, 250, 240, .72);
  outline-offset: 3px;
}

.audio-deck__speed {
  position: relative;
  width: 58px;
}

.speed-select {
  width: 58px;
  height: var(--touch-target);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 99px;
  background: rgba(255, 250, 240, .1);
  color: rgba(255, 250, 240, .68);
  font: var(--weight-medium) 11px/1 var(--font-ui);
  cursor: pointer;
}

.speed-menu {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  z-index: 8;
  width: 68px;
  display: grid;
  gap: 2px;
  padding: 5px;
  border: 1px solid rgba(255, 250, 240, .16);
  border-radius: 12px;
  background: rgba(26, 26, 24, .96);
  box-shadow: 0 12px 28px rgba(0, 0, 0, .28);
  backdrop-filter: blur(14px);
  transform: translate(-50%, 0) scale(1);
  transform-origin: 50% 100%;
}

.speed-menu-enter-active,
.speed-menu-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.speed-menu-enter-from,
.speed-menu-leave-to {
  opacity: 0;
  transform: translate(-50%, 4px) scale(.96);
}

.speed-menu button {
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 250, 240, .66);
  font: var(--weight-medium) 11px/1 var(--font-ui);
  cursor: pointer;
}

.speed-menu button:hover,
.speed-menu button[aria-current="true"] {
  background: rgba(255, 250, 240, .1);
  color: #fffaf0;
}

.player-mode-dock {
  padding: 6px 24px calc(12px + var(--safe-bottom));
}

.player-mode-dock .sl-mode-switch {
  gap: 0;
}

.player-mode-dock .sl-mode {
  min-height: 48px;
}

.player-mode-dock .sl-mode[aria-selected="true"]::after {
  bottom: 1px;
  width: 14px;
  height: 2px;
}

.player-mode-dock .sl-mode > svg {
  transform: none;
}

.player-stage {
  min-height: 0;
  flex: 1;
  padding-bottom: 150px;
  transition: padding-bottom var(--duration-base) var(--ease-out);
}

.player-mode-read .player-stage {
  padding-bottom: 130px;
}

.player-mode-write .player-stage,
.player-mode-speak .player-stage {
  padding-bottom: 110px;
}

.player-screen:not(.controls-visible) .player-stage {
  padding-bottom: 40px;
}

.write-mode {
  gap: 12px;
  padding: 8px 0 4px;
  overflow: hidden;
}

.read-mode,
.write-mode,
.speak-mode {
  margin-inline: 7px;
}

.mode-copy h2,
.read-mode__head h2 {
  font-size: 22px;
}

.speak-mode .mode-copy h2 {
  font-size: clamp(18px, 5.5vw, 22px);
  white-space: nowrap;
}

.transcript-list {
  gap: 8px;
  -webkit-mask-image: linear-gradient(
    to bottom,
    #000 0,
    #000 64%,
    rgba(0, 0, 0, .72) 74%,
    transparent 86%
  );
  mask-image: linear-gradient(
    to bottom,
    #000 0,
    #000 64%,
    rgba(0, 0, 0, .72) 74%,
    transparent 86%
  );
  overscroll-behavior: contain;
}

.transcript-row {
  padding: 14px 12px;
}

.write-current > .skip-link {
  width: 100%;
  text-align: center;
}

.write-mode :deep(.sl-word-input) {
  row-gap: 18px;
}

.speak-mode {
  padding: 8px 0 4px;
}

.record-state {
  padding: 5px 9px;
  border: 1px solid rgba(255, 250, 240, .16);
  border-radius: 99px;
  color: rgba(255, 250, 240, .58);
  font-size: 11px;
}

.record-wave {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 0;
  opacity: .45;
}

.record-wave i {
  width: 3px;
  border-radius: 99px;
  background: rgba(255, 250, 240, .56);
}

.record-wave.is-live i {
  opacity: 1;
  background: var(--player-active);
  animation: voice-pulse 760ms var(--ease-in-out) infinite alternate;
}

.record-wave.is-live i:nth-child(2n) {
  animation-delay: 120ms;
}

.record-wave.is-live i:nth-child(3n) {
  animation-delay: 220ms;
}

@keyframes voice-pulse {
  to { transform: scaleY(.46); opacity: .5; }
}

.record-button {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255,250,240,.94);
  color: var(--color-ink-900);
  box-shadow: 0 14px 34px rgba(0,0,0,.24);
  cursor: pointer;
}

.record-button.is-recording {
  background: var(--color-ember-500);
  color: white;
  animation: record-breathe 1.2s var(--ease-in-out) infinite alternate;
}

.speak-quote span {
  font-size: calc(20px * var(--caption-scale, 1));
}

@keyframes record-breathe {
  to { box-shadow: 0 0 0 11px rgba(26,26,24,.16), 0 14px 34px rgba(0,0,0,.24); }
}

.voice-compare audio {
  grid-column: 1 / -1;
  width: 100%;
  height: 34px;
}

.player-complete-row {
  width: min(100%, 680px);
  display: flex;
  justify-content: flex-end;
  margin: 0 auto;
  padding: 4px 25px 2px;
}

.player-complete-button {
  min-height: 44px;
  padding: 0 15px;
  border: 0;
  background: rgba(255, 250, 240, .68);
  color: var(--color-ink-900);
  font-size: 11px;
}

.player-complete-button:disabled {
  opacity: .55;
}

.mode-transition-prompt {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  padding: 0 15px;
  border: 1px solid rgba(255, 250, 240, .14);
  border-radius: 99px;
  background: rgba(255, 250, 240, .08);
  color: rgba(255, 250, 240, .68);
  font-size: 11px;
  animation: mode-prompt-in 180ms var(--ease-out);
}

@keyframes mode-prompt-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
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

</style>
