import type { LearningMode } from '@/api/types'

const STORAGE_KEY = 'sayline:offline-mutations'
const MAX_MUTATIONS = 200

export type OfflineMutation =
  | {
      id: string
      at: number
      type: 'action'
      courseId: number
      payload: {
        cueId: number
        mode: LearningMode
        durationMs: number
        answer?: string
      }
    }
  | {
      id: string
      at: number
      type: 'position'
      courseId: number
      payload: {
        mode: LearningMode
        cueId?: number
        positionMs: number
      }
    }
  | {
      id: string
      at: number
      type: 'confirm'
      courseId: number
      payload: {
        mode: LearningMode
        playbackCompleted: boolean
      }
    }

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
type PendingMutation = DistributiveOmit<OfflineMutation, 'id' | 'at'>

function mutationKey(mutation: OfflineMutation | PendingMutation) {
  if (mutation.type === 'action') {
    return `action:${mutation.courseId}:${mutation.payload.cueId}:${mutation.payload.mode}`
  }
  if (mutation.type === 'position') {
    return `position:${mutation.courseId}:${mutation.payload.mode}`
  }
  return `confirm:${mutation.courseId}:${mutation.payload.mode}`
}

export function readOfflineMutations(): OfflineMutation[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? value as OfflineMutation[] : []
  } catch {
    return []
  }
}

function writeOfflineMutations(mutations: OfflineMutation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mutations.slice(-MAX_MUTATIONS)))
}

export function enqueueOfflineMutation(mutation: PendingMutation) {
  const key = mutationKey(mutation)
  const queue = readOfflineMutations().filter((item) => mutationKey(item) !== key)
  queue.push({
    ...mutation,
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    at: Date.now(),
  } as OfflineMutation)
  writeOfflineMutations(queue)
}

export function removeOfflineMutation(id: string) {
  writeOfflineMutations(readOfflineMutations().filter((mutation) => mutation.id !== id))
}

export function clearOfflineMutations() {
  localStorage.removeItem(STORAGE_KEY)
}
