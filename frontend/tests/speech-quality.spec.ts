import { describe, expect, it } from 'vitest'

import { assessSpeechRecording } from '@/utils/speechQuality'

describe('assessSpeechRecording', () => {
  it('rejects recordings shorter than one second', () => {
    expect(assessSpeechRecording({ durationMs: 800, peakLevel: 0.2 })).toBe('too-short')
  })

  it('rejects recordings with near-silent input', () => {
    expect(assessSpeechRecording({ durationMs: 1_200, peakLevel: 0.005 })).toBe('too-quiet')
  })

  it('accepts audible recordings of sufficient duration', () => {
    expect(assessSpeechRecording({ durationMs: 1_200, peakLevel: 0.08 })).toBe('ready')
  })
})
