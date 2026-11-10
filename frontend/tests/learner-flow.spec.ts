import { ref, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useControlVisibility } from '../src/composables/useControlVisibility'
import { getLetterStates } from '../src/utils/dictation'
import { createVisibleCueTimers } from '../src/utils/visibleCueTimers'

describe('dictation letter states', () => {
  it('marks each typed letter as correct or wrong', () => {
    expect(getLetterStates('mEt', 'met')).toEqual(['correct', 'correct', 'correct'])
    expect(getLetterStates('mat', 'met')).toEqual(['correct', 'wrong', 'correct'])
    expect(getLetterStates('m', 'met')).toEqual(['correct', 'empty', 'empty'])
  })
})

describe('auto hiding player controls', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hides after the delay and stays visible when auto hide is disabled', async () => {
    const autoHide = ref(true)
    const visibility = useControlVisibility({ autoHide, delay: 6_000 })

    visibility.show()
    expect(visibility.visible.value).toBe(true)
    vi.advanceTimersByTime(6_000)
    await nextTick()
    expect(visibility.visible.value).toBe(false)

    autoHide.value = false
    visibility.show()
    vi.advanceTimersByTime(20_000)
    await nextTick()
    expect(visibility.visible.value).toBe(true)
  })
})

describe('read visibility progress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts a cue only after it stays visible for one second', () => {
    const completed: number[] = []
    const tracker = createVisibleCueTimers({ onElapsed: (cueId) => completed.push(cueId) })

    tracker.enter(1)
    vi.advanceTimersByTime(600)
    tracker.leave(1)
    vi.advanceTimersByTime(600)
    expect(completed).toEqual([])

    tracker.enter(2)
    vi.advanceTimersByTime(1_000)
    expect(completed).toEqual([2])

    tracker.enter(2)
    vi.advanceTimersByTime(1_000)
    expect(completed).toEqual([2])
  })
})
