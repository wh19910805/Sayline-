export type SpeechRecordingQuality = 'ready' | 'too-short' | 'too-quiet'

export function assessSpeechRecording(input: {
  durationMs: number
  peakLevel: number
}): SpeechRecordingQuality {
  if (input.durationMs < 1_000) return 'too-short'
  if (input.peakLevel < 0.015) return 'too-quiet'
  return 'ready'
}
