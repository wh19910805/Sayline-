import { shallowRef } from 'vue'

interface AudioHandlers {
  play: () => void
  pause: () => void
  timeupdate: () => void
  ended: () => void
}

const element = shallowRef<HTMLAudioElement | null>(null)
const handlers = new Set<AudioHandlers>()
let currentSource = ''
let detachElement: (() => void) | null = null

function emit(type: keyof AudioHandlers) {
  for (const handler of handlers) handler[type]()
}

function attachGlobalAudio(audio: HTMLAudioElement | null) {
  detachElement?.()
  detachElement = null
  element.value = audio
  if (!audio) return

  const onPlay = () => emit('play')
  const onPause = () => emit('pause')
  const onTimeUpdate = () => emit('timeupdate')
  const onEnded = () => emit('ended')
  audio.addEventListener('play', onPlay)
  audio.addEventListener('pause', onPause)
  audio.addEventListener('timeupdate', onTimeUpdate)
  audio.addEventListener('ended', onEnded)
  if (currentSource) audio.src = currentSource
  detachElement = () => {
    audio.removeEventListener('play', onPlay)
    audio.removeEventListener('pause', onPause)
    audio.removeEventListener('timeupdate', onTimeUpdate)
    audio.removeEventListener('ended', onEnded)
  }
}

function setAudioSource(source?: string | null) {
  const nextSource = source || ''
  if (nextSource === currentSource) return
  currentSource = nextSource
  if (!element.value) return
  element.value.src = nextSource
  element.value.load()
}

function subscribeAudio(handler: AudioHandlers) {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

export function useGlobalAudio() {
  return {
    element,
    setSource: setAudioSource,
    subscribe: subscribeAudio,
  }
}

export function mountGlobalAudio(audio: HTMLAudioElement | null) {
  attachGlobalAudio(audio)
}
