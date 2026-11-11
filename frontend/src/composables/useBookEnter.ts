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

export function useBookEnter() {
  function enter(payload: BookEnterPayload, navigate: () => void | Promise<unknown>) {
    clearTimers()

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

    // 预解码封面图，避免放大时图片解码导致的停顿
    if (payload.coverUrl) {
      const image = new Image()
      image.src = payload.coverUrl
    }

    // 等遮罩完成首次绘制后再开始放大，避免起步掉帧
    timers.push(setTimeout(() => { state.shown = true }, 50))
    // 放大结束后切路由；课时列表在遮罩下加载，缩略图就位后再收进卡片
    timers.push(setTimeout(() => { void navigate() }, 410))
  }

  // 课时列表封面缩略图就位后调用：把全屏遮罩收进缩略图
  function settle() {
    if (!state.active || state.settling) return
    const target = document.querySelector('.book-head__cover')
    if (!target) {
      settleAttempts += 1
      if (settleAttempts > 20) {
        state.leaving = true
        timers.push(setTimeout(reset, 200))
      } else {
        timers.push(setTimeout(settle, 80))
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
    timers.push(setTimeout(reset, 240))
  }

  return { state, enter, settle }
}
