import { reactive } from 'vue'

import type { LearningMode } from '@/api/types'

export type PlaybackMode = 'study' | 'sequential' | 'loop'

const state = reactive({
  active: false,
  courseId: null as number | null,
  bookId: null as number | null,
  title: '',
  bookTitle: '',
  coverUrl: null as string | null,
  playing: false,
  currentTime: 0,
  duration: 0,
  mode: 'LISTEN' as LearningMode,
  playMode: 'study' as PlaybackMode,
})

let toggleHandler: (() => void) | null = null

function update(patch: Partial<typeof state>) {
  Object.assign(state, patch)
}

function registerToggleHandler(handler: (() => void) | null) {
  toggleHandler = handler
}

function togglePlayback() {
  toggleHandler?.()
}

function clear() {
  toggleHandler = null
  Object.assign(state, {
    active: false,
    courseId: null,
    bookId: null,
    title: '',
    bookTitle: '',
    coverUrl: null,
    playing: false,
    currentTime: 0,
    duration: 0,
    mode: 'LISTEN',
    playMode: 'study',
  })
}

export function usePlayerSession() {
  return { state, update, registerToggleHandler, togglePlayback, clear }
}
