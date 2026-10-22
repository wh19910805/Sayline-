interface Options {
  onElapsed: (cueId: number) => void
  delay?: number
}

export function createVisibleCueTimers({ onElapsed, delay = 1_000 }: Options) {
  const timers = new Map<number, ReturnType<typeof setTimeout>>()
  const elapsed = new Set<number>()

  function enter(cueId: number) {
    if (elapsed.has(cueId) || timers.has(cueId)) return
    timers.set(
      cueId,
      setTimeout(() => {
        timers.delete(cueId)
        elapsed.add(cueId)
        onElapsed(cueId)
      }, delay),
    )
  }

  function leave(cueId: number) {
    const timer = timers.get(cueId)
    if (timer) clearTimeout(timer)
    timers.delete(cueId)
  }

  function reset() {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    elapsed.clear()
  }

  return { enter, leave, reset }
}
