import { createHttpClient } from './http'
import type { AuthResponse } from './types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export const http = createHttpClient({
  baseUrl: apiBaseUrl,
  refreshAccessToken: async () => {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) return null
    const data = (await response.json()) as AuthResponse
    return data.accessToken
  },
})
