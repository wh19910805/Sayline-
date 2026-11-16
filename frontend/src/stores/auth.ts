import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { http } from '@/api'
import { clearAllCaches } from '@/api/cache'
import { authApi } from '@/api/services'
import { clearAmbient } from '@/composables/useAmbient'
import type { AuthResponse, User } from '@/api/types'
import {
  clearOfflineIdentity,
  readOfflineIdentity,
  rememberOfflineIdentity,
} from '@/utils/offlineSession'
import { clearOfflineMutations } from '@/utils/offlineMutationQueue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const ready = ref(false)
  const loading = ref(false)
  const offline = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value))
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isOffline = computed(() => offline.value)

  function acceptSession(response: AuthResponse) {
    clearUserState()
    user.value = response.user
    accessToken.value = response.accessToken
    http.setAccessToken(response.accessToken)
    rememberOfflineIdentity(response.user)
    offline.value = false
    ready.value = true
  }

  async function login(phone: string, password: string) {
    loading.value = true
    try {
      acceptSession(await authApi.login(phone, password))
      return user.value
    } finally {
      loading.value = false
    }
  }

  async function register(phone: string, password: string, nickname: string) {
    loading.value = true
    try {
      acceptSession(await authApi.register(phone, password, nickname))
      return user.value
    } finally {
      loading.value = false
    }
  }

  async function restore() {
    if (ready.value) return user.value
    loading.value = true
    try {
      const current = await authApi.me()
      user.value = { ...current }
      accessToken.value = http.getAccessToken()
      rememberOfflineIdentity(user.value)
      offline.value = false
      return user.value
    } catch (reason) {
      const cachedUser = reason instanceof TypeError ? readOfflineIdentity() : null
      if (cachedUser) {
        user.value = cachedUser
        accessToken.value = null
        http.setAccessToken(null)
        offline.value = true
        return cachedUser
      }
      user.value = null
      accessToken.value = null
      http.setAccessToken(null)
      offline.value = false
      return null
    } finally {
      loading.value = false
      ready.value = true
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clearUserState()
      user.value = null
      accessToken.value = null
      http.setAccessToken(null)
      offline.value = false
    }
  }

  function clearUserState() {
    clearAllCaches()
    clearAmbient()
    clearOfflineIdentity()
    clearOfflineMutations()
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_USER_CACHE' })
  }

  function markOnline() {
    offline.value = false
  }

  return {
    user,
    accessToken,
    ready,
    loading,
    isAuthenticated,
    isAdmin,
    isOffline,
    login,
    register,
    restore,
    logout,
    markOnline,
  }
})
