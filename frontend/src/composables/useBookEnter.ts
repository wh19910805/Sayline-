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
  coverUrl: '',
  primary: '#53634e',
  secondary: '#263128',
})

let timers: ReturnType<typeof setTimeout>[] = []

function clearTimers() {
  for (const timer of timers) clearTimeout(timer)
  timers = []
}

function reset() {
  state.active = false
  state.shown = false
  state.leaving = false
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
    state.shown = false
    state.active = true

    // 预解码封面图，避免放大时图片解码导致的停顿
    if (payload.coverUrl) {
      const image = new Image()
      image.src = payload.coverUrl
    }

    // 等遮罩完成首次绘制（全屏图层栅格化）后再开始放大，避免起步掉帧
    timers.push(setTimeout(() => { state.shown = true }, 50))
    // 等封面完全铺满（放大动画结束）后再切路由，避免路由切换与放大动画叠加导致卡顿
    timers.push(setTimeout(async () => {
      await navigate()
      await new Promise((resolve) => setTimeout(resolve, 30))
      state.leaving = true
      timers.push(setTimeout(reset, 180))
    }, 410))
  }

  return { state, enter }
}
