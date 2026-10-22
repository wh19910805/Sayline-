export type FetchLike = typeof fetch

interface ApiErrorBody {
  code?: string
  status?: number
  detail?: string
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface HttpClientOptions {
  baseUrl?: string
  fetchImpl?: FetchLike
  refreshAccessToken: () => Promise<string | null>
}

export interface HttpClient {
  get<T>(path: string, options?: RequestInit): Promise<T>
  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T>
  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T>
  put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T>
  delete<T = void>(path: string, options?: RequestInit): Promise<T>
  setAccessToken(token: string | null): void
  getAccessToken(): string | null
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const baseUrl = (options.baseUrl ?? '').replace(/\/$/, '')
  const fetchImpl = options.fetchImpl ?? fetch
  let accessToken: string | null = null
  let refreshPromise: Promise<string | null> | null = null

  async function parseBody(response: Response): Promise<unknown> {
    if (response.status === 204) return undefined
    const text = await response.text()
    if (!text) return undefined
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  function toApiError(response: Response, body: unknown): ApiError {
    const payload = typeof body === 'object' && body !== null ? (body as ApiErrorBody) : {}
    return new ApiError(
      response.status,
      payload.code ?? `HTTP_${response.status}`,
      payload.detail ?? `请求失败（${response.status}）`,
    )
  }

  async function execute<T>(
    path: string,
    requestOptions: RequestInit = {},
    canRetry = true,
  ): Promise<T> {
    const headers = new Headers(requestOptions.headers)
    if (requestOptions.body && !(requestOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...requestOptions,
      headers,
      credentials: 'include',
    })
    const body = await parseBody(response)

    if (response.status === 401 && canRetry) {
      try {
        refreshPromise ??= options.refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const refreshedToken = await refreshPromise
        if (refreshedToken) {
          accessToken = refreshedToken
          return execute<T>(path, requestOptions, false)
        }
      } catch {
        accessToken = null
        throw toApiError(response, body)
      }
      accessToken = null
      throw toApiError(response, body)
    }

    if (!response.ok) {
      throw toApiError(response, body)
    }
    return body as T
  }

  function withJson(method: string, body?: unknown, requestOptions: RequestInit = {}): RequestInit {
    return {
      ...requestOptions,
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    }
  }

  return {
    get: (path, requestOptions) => execute(path, requestOptions),
    post: (path, body, requestOptions) => execute(path, withJson('POST', body, requestOptions)),
    patch: (path, body, requestOptions) => execute(path, withJson('PATCH', body, requestOptions)),
    put: (path, body, requestOptions) => execute(path, withJson('PUT', body, requestOptions)),
    delete: (path, requestOptions) => execute(path, { ...requestOptions, method: 'DELETE' }),
    setAccessToken: (token) => {
      accessToken = token
    },
    getAccessToken: () => accessToken,
  }
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof TypeError) {
    return '网络连接失败，请检查网络后重试'
  }
  return '出现未知错误，请稍后重试'
}
