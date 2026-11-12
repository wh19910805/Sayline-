import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { http } from '@/api'
import { clearAllCaches } from '@/api/cache'
import { authApi } from '@/api/services'
import { clearAmbient } from '@/composables/useAmbient'
import type { AuthResponse, User } from '@/api/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const ready = ref(false)
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value))
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  function acceptSession(response: AuthResponse) {
    clearUserState()
    user.value = response.user
    accessToken.value = response.accessToken
    http.setAccessToken(response.accessToken)
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
      return user.value
    } catch {
      user.value = null
      accessToken.value = null
      http.setAccessToken(null)
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
    }
  }

  function clearUserState() {
    clearAllCaches()
    clearAmbient()
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_USER_CACHE' })
  }

  return {
    user,
    accessToken,
    ready,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    restore,
    logout,
  }
})
