interface NetworkInformationLike {
  saveData?: boolean
  effectiveType?: string
}

export function canPrefetch() {
  const connection = (navigator as Navigator & {
    connection?: NetworkInformationLike
  }).connection
  return !connection?.saveData
    && connection?.effectiveType !== 'slow-2g'
    && connection?.effectiveType !== '2g'
}

export function runWhenIdle(task: () => void) {
  if (!canPrefetch()) return () => undefined

  const requestIdle = window.requestIdleCallback
  if (typeof requestIdle === 'function') {
    const id = requestIdle(task)
    return () => window.cancelIdleCallback(id)
  }

  const id = window.setTimeout(task, 200)
  return () => window.clearTimeout(id)
}
