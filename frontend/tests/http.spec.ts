import { describe, expect, it, vi } from 'vitest'

import { ApiError, apiErrorMessage, createHttpClient } from '../src/api/http'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('http client', () => {
  it('attaches the current access token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const client = createHttpClient({
      baseUrl: 'http://api.test',
      fetchImpl: fetchMock,
      refreshAccessToken: vi.fn(),
    })
    client.setAccessToken('access-1')

    await client.get('/api/v1/courses')

    const [, options] = fetchMock.mock.calls[0]
    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer access-1')
  })

  it('refreshes once and retries a request after 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ code: 'UNAUTHORIZED' }, 401))
      .mockResolvedValueOnce(jsonResponse({ content: [] }))
    const refreshAccessToken = vi.fn().mockResolvedValue('access-2')
    const client = createHttpClient({
      baseUrl: 'http://api.test',
      fetchImpl: fetchMock,
      refreshAccessToken,
    })
    client.setAccessToken('expired')

    const result = await client.get<{ content: unknown[] }>('/api/v1/courses')

    expect(result.content).toEqual([])
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    const [, retryOptions] = fetchMock.mock.calls[1]
    expect(new Headers(retryOptions.headers).get('Authorization')).toBe('Bearer access-2')
  })

  it('clears the session when refresh fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ code: 'UNAUTHORIZED', detail: '请先登录' }, 401),
    )
    const client = createHttpClient({
      baseUrl: 'http://api.test',
      fetchImpl: fetchMock,
      refreshAccessToken: vi.fn().mockResolvedValue(null),
    })
    client.setAccessToken('expired')

    await expect(client.get('/api/v1/me/profile')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
    expect(client.getAccessToken()).toBeNull()
  })

  it('maps stable API errors to readable Chinese messages', () => {
    expect(apiErrorMessage(new ApiError(401, 'UNAUTHORIZED', '请先登录'))).toBe('请先登录')
    expect(apiErrorMessage(new ApiError(409, 'PHONE_ALREADY_REGISTERED', '该手机号已注册'))).toBe(
      '该手机号已注册',
    )
    expect(apiErrorMessage(new TypeError('Failed to fetch'))).toBe('网络连接失败，请检查网络后重试')
  })
})
