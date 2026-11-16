import { reactive } from 'vue'

export interface BookEnterPayload {
  coverUrl: string | null
  primary: string
  secondary: string
}

const state = reactive({
  active: false,
  shown: false,
  leaving: false,
  settling: false,
  coverUrl: '',
  primary: '#4f4e49',
  secondary: '#8f8e88',
  settleTx: 0,
  settleTy: 0,
  settleScale: 1,
})

let timers: ReturnType<typeof setTimeout>[] = []
let settleAttempts = 0
let navigationGeneration = 0

function clearTimers() {
  for (const timer of timers) clearTimeout(timer)
  timers = []
}

function reset() {
  state.active = false
  state.shown = false
  state.leaving = false
  state.settling = false
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    timers.push(setTimeout(resolve, milliseconds))
  })
}

async function waitForCover(url: string | null) {
  if (!url) return
  const image = new Image()
  image.src = url
  try {
    await Promise.race([
      image.decode(),
      wait(220),
    ])
  } catch {
    // Keep the branded gradient fallback when decoding fails.
  }
}

export function useBookEnter() {
  function enter(payload: BookEnterPayload, navigate: () => void | Promise<unknown>) {
    clearTimers()
    const generation = ++navigationGeneration

    // 尊重系统「减少动态效果」设置，直接跳转
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reset()
      void navigate()
      return
    }

    state.coverUrl = payload.coverUrl || ''
    state.primary = payload.primary
    state.secondary = payload.secondary
    state.leaving = false
    state.settling = false
    state.shown = false
    state.active = true
    settleAttempts = 0

    requestAnimationFrame(() => {
      if (generation === navigationGeneration) state.shown = true
    })

    void Promise.all([
      waitForCover(payload.coverUrl),
      wait(180),
    ]).then(() => {
      if (generation === navigationGeneration) void navigate()
    })
  }

  // 课时列表封面缩略图就位后调用：把全屏遮罩收进缩略图
  function settle() {
    if (!state.active || state.settling) return
    const target = document.querySelector('.book-head__cover')
    if (!target) {
      settleAttempts += 1
      if (settleAttempts > 6) {
        state.leaving = true
        timers.push(setTimeout(reset, 180))
      } else {
        timers.push(setTimeout(settle, 40))
      }
      return
    }
    const rect = target.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    state.settleTx = rect.left + rect.width / 2 - vw / 2
    state.settleTy = rect.top + rect.height / 2 - vh / 2
    state.settleScale = rect.width / vw
    state.settling = true
    timers.push(setTimeout(reset, 200))
  }

  return { state, enter, settle }
}
