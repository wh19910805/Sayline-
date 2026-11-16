import type { User } from '@/api/types'

const STORAGE_KEY = 'sayline:offline-user'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000

interface OfflineIdentity {
  user: User
  savedAt: number
}

export function rememberOfflineIdentity(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, savedAt: Date.now() }))
}

export function readOfflineIdentity(now = Date.now()): User | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '') as OfflineIdentity
    if (!saved.user || now - saved.savedAt > MAX_AGE_MS) {
      clearOfflineIdentity()
      return null
    }
    return saved.user
  } catch {
    return null
  }
}

export function clearOfflineIdentity() {
  localStorage.removeItem(STORAGE_KEY)
}
