import { onBeforeUnmount, onMounted, ref } from 'vue'

import { learnerApi } from '@/api/services'
import { useAuthStore } from '@/stores/auth'
import {
  readOfflineMutations,
  removeOfflineMutation,
  type OfflineMutation,
} from '@/utils/offlineMutationQueue'

async function submitMutation(mutation: OfflineMutation) {
  if (mutation.type === 'action') {
    await learnerApi.action(mutation.courseId, mutation.payload)
    return
  }
  if (mutation.type === 'position') {
    await learnerApi.position(mutation.courseId, mutation.payload)
    return
  }
  await learnerApi.confirm(
    mutation.courseId,
    mutation.payload.mode,
    mutation.payload.playbackCompleted,
  )
}

export function useOfflineSync() {
  const auth = useAuthStore()
  const syncing = ref(false)

  async function sync() {
    if (syncing.value || !auth.isAuthenticated) return
    syncing.value = true
    try {
      for (const mutation of readOfflineMutations()) {
        try {
          await submitMutation(mutation)
          removeOfflineMutation(mutation.id)
          auth.markOnline()
        } catch {
          break
        }
      }
    } finally {
      syncing.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('online', sync)
    void sync()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', sync)
  })

  return { syncing, sync }
}
