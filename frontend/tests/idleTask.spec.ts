import { afterEach, describe, expect, it, vi } from 'vitest'

import { canPrefetch, runWhenIdle } from '../src/utils/idleTask'

describe('idle prefetch scheduling', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: undefined,
    })
  })

  it('falls back to a 200ms timer when requestIdleCallback is unavailable', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: undefined,
    })
    const task = vi.fn()

    runWhenIdle(task)
    vi.advanceTimersByTime(199)
    expect(task).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(task).toHaveBeenCalledOnce()
  })

  it('skips prefetch on data saver and slow connections', () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: true, effectiveType: '4g' },
    })
    expect(canPrefetch()).toBe(false)

    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: false, effectiveType: '2g' },
    })
    expect(canPrefetch()).toBe(false)
  })

  it('allows prefetch on an unconstrained connection', () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: false, effectiveType: '4g' },
    })
    expect(canPrefetch()).toBe(true)
  })
})
