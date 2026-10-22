import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue'

interface Options {
  autoHide: Ref<boolean>
  delay?: number
}

export function useControlVisibility({ autoHide, delay = 6_000 }: Options) {
  const visible = ref(true)
  let timer: ReturnType<typeof setTimeout> | undefined

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  function scheduleHide() {
    clearTimer()
    if (!autoHide.value) return
    timer = setTimeout(() => {
      visible.value = false
    }, delay)
  }

  function show() {
    visible.value = true
    scheduleHide()
  }

  function hide() {
    clearTimer()
    visible.value = false
  }

  function toggle() {
    if (visible.value) {
      hide()
    } else {
      show()
    }
  }

  watch(autoHide, (enabled) => {
    if (enabled) {
      scheduleHide()
    } else {
      clearTimer()
      visible.value = true
    }
  })

  if (getCurrentScope()) {
    onScopeDispose(clearTimer)
  }

  return { visible, show, hide, toggle }
}
