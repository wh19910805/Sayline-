import { http } from './index'
import { cacheDelete, cacheDeletePrefix, cacheGet, cacheSet } from './cache'
import type {
  AdminBook,
  AdminCategory,
  AdminCourse,
  AdminUser,
  AuthResponse,
  BookDetail,
  BookSummary,
  Category,
  CourseDetail,
  CourseStatus,
  CourseSummary,
  Dashboard,
  LearningMode,
  LearningSettings,
  LearningState,
  PageResponse,
  PresignResponse,
  Profile,
  RecentLesson,
  ReviewCue,
  SearchResponse,
  StatsResponse,
} from './types'

const TTL_CATALOG = 2 * 60_000
const TTL_DETAIL = 60_000
const TTL_RECENT = 45_000

function withCache<T>(key: string, loader: () => Promise<T>, ttlMs: number): Promise<T> {
  const hit = cacheGet<T>(key)
  if (hit !== undefined) return Promise.resolve(hit)
  return loader().then((data) => {
    cacheSet(key, data, ttlMs)
    return data
  })
}

function invalidateBookCaches(bookId: number) {
  cacheDeletePrefix('books:')
  cacheDelete('favoriteBooks')
  cacheDelete(`book:${bookId}`)
}

// 管理端增删改封面/课程/分类后，清空学习端目录缓存，让重新上传的封面立即生效
function invalidateCatalogCache() {
  cacheDeletePrefix('books:')
  cacheDeletePrefix('book:')
  cacheDelete('categories')
  cacheDelete('favoriteBooks')
  cacheDelete('recentLessons')
  cacheDelete('interests')
}

export const authApi = {
  login: (phone: string, password: string) =>
    http.post<AuthResponse>('/api/v1/auth/login', { phone, password }),
  register: (phone: string, password: string, nickname: string) =>
    http.post<AuthResponse>('/api/v1/auth/register', { phone, password, nickname }),
  me: () => http.get<AuthResponse['user']>('/api/v1/auth/me'),
  logout: () => http.post<void>('/api/v1/auth/logout'),
}

export const learnerApi = {
  categories: () => withCache('categories', () => http.get<Category[]>('/api/v1/categories'), TTL_CATALOG),
  courses: (categoryId?: number, q?: string) => {
    const params = new URLSearchParams({ size: '200' })
    if (categoryId) params.set('categoryId', String(categoryId))
    if (q) params.set('q', q)
    return http.get<PageResponse<CourseSummary>>(`/api/v1/courses?${params}`)
  },
  books: (categoryId?: number, q?: string) =>
    withCache(
      `books:${categoryId ?? 'all'}:${q?.trim() || ''}`,
      () => {
        const params = new URLSearchParams()
        if (categoryId) params.set('categoryId', String(categoryId))
        if (q?.trim()) params.set('q', q.trim())
        const query = params.toString()
        return http.get<BookSummary[]>(`/api/v1/books${query ? `?${query}` : ''}`)
      },
      TTL_CATALOG,
    ),
  search: (q: string, signal?: AbortSignal) =>
    http.get<SearchResponse>(`/api/v1/search?${new URLSearchParams({ q })}`, { signal }),
  book: (bookId: number) => withCache(`book:${bookId}`, () => http.get<BookDetail>(`/api/v1/books/${bookId}`), TTL_DETAIL),
  favoriteBooks: () => withCache('favoriteBooks', () => http.get<BookSummary[]>('/api/v1/favorite-books'), TTL_CATALOG),
  recentLessons: () => withCache('recentLessons', () => http.get<RecentLesson[]>('/api/v1/recent-lessons'), TTL_RECENT),
  reviews: () => http.get<ReviewCue[]>('/api/v1/learning/reviews'),
  favoriteBook: async (bookId: number) => {
    const result = await http.post<{ favorited: boolean }>(`/api/v1/books/${bookId}/favorite`)
    invalidateBookCaches(bookId)
    return result
  },
  unfavoriteBook: async (bookId: number) => {
    await http.delete(`/api/v1/books/${bookId}/favorite`)
    invalidateBookCaches(bookId)
  },
  favorites: () => http.get<PageResponse<CourseSummary>>('/api/v1/favorites?size=50'),
  course: (courseId: number) => http.get<CourseDetail>(`/api/v1/courses/${courseId}`),
  favorite: (courseId: number) => http.post<{ favorited: boolean }>(`/api/v1/courses/${courseId}/favorite`),
  unfavorite: (courseId: number) => http.delete(`/api/v1/courses/${courseId}/favorite`),
  interests: () => withCache('interests', () => http.get<Category[]>('/api/v1/me/interests'), TTL_CATALOG),
  updateInterests: async (categoryIds: number[]) => {
    const result = await http.put<Category[]>('/api/v1/me/interests', { categoryIds })
    cacheDelete('interests')
    return result
  },
  profile: () => http.get<Profile>('/api/v1/me/profile'),
  updateProfile: (payload: { nickname: string; avatarObjectKey?: string | null }) =>
    http.patch<Profile>('/api/v1/me/profile', payload),
  presignAvatar: (payload: { fileName: string; contentType: string; sizeBytes: number }) =>
    http.post<PresignResponse>('/api/v1/uploads/avatar/presign', {
      kind: 'COVER',
      ...payload,
    }),
  settings: () => http.get<LearningSettings>('/api/v1/me/settings'),
  updateSettings: (payload: Partial<LearningSettings>) =>
    http.patch<LearningSettings>('/api/v1/me/settings', payload),
  learningState: (courseId: number) => http.get<LearningState>(`/api/v1/learning/courses/${courseId}`),
  action: (
    courseId: number,
    payload: { cueId: number; mode: LearningMode; durationMs: number; answer?: string },
  ) => http.post<LearningState>(`/api/v1/learning/courses/${courseId}/actions`, payload),
  position: (
    courseId: number,
    payload: { mode: LearningMode; cueId?: number; positionMs: number },
  ) => http.post<LearningState>(`/api/v1/learning/courses/${courseId}/position`, payload),
  confirm: (courseId: number, mode: LearningMode) =>
    http.post<LearningState>(`/api/v1/learning/courses/${courseId}/confirm`, { mode }),
  heartbeat: (courseId: number, activeMs: number) =>
    http.post<{ sessionId: string; sessionActiveMs: number; sessionCounted: boolean }>(
      `/api/v1/learning/courses/${courseId}/heartbeat`,
      { activeMs },
    ),
  stats: (period: 'WEEK' | 'MONTH', date?: string) => {
    const params = new URLSearchParams({ period })
    if (date) params.set('date', date)
    return http.get<StatsResponse>(`/api/v1/learning/stats?${params}`)
  },
}

export const adminApi = {
  dashboard: () => http.get<Dashboard>('/api/v1/admin/dashboard'),
  categories: (page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    return http.get<PageResponse<AdminCategory>>(`/api/v1/admin/categories?${params}`)
  },
  saveCategory: async (payload: Record<string, unknown>, id?: number) => {
    const result = id
      ? await http.patch<AdminCategory>(`/api/v1/admin/categories/${id}`, payload)
      : await http.post<AdminCategory>('/api/v1/admin/categories', payload)
    invalidateCatalogCache()
    return result
  },
  deleteCategory: (id: number) => http.delete(`/api/v1/admin/categories/${id}`),
  books: (filters: { categoryId?: number; q?: string; visible?: boolean } = {}) => {
    const params = new URLSearchParams({ size: '50' })
    if (filters.categoryId) params.set('categoryId', String(filters.categoryId))
    if (filters.q?.trim()) params.set('q', filters.q.trim())
    if (filters.visible !== undefined) params.set('visible', String(filters.visible))
    return http.get<PageResponse<AdminBook>>(`/api/v1/admin/books?${params}`)
  },
  saveBook: async (payload: Record<string, unknown>, id?: number) => {
    const result = id
      ? await http.patch<AdminBook>(`/api/v1/admin/books/${id}`, payload)
      : await http.post<AdminBook>('/api/v1/admin/books', payload)
    invalidateCatalogCache()
    return result
  },
  deleteBook: (id: number) => http.delete(`/api/v1/admin/books/${id}`),
  batchBookVisibility: async (bookIds: number[], visible: boolean) => {
    await http.patch<void>('/api/v1/admin/books/batch-visibility', { bookIds, visible })
    invalidateCatalogCache()
  },
  courses: (filters: { bookId?: number; status?: CourseStatus; q?: string; page?: number }) => {
    const params = new URLSearchParams({ size: '20', page: String(filters.page ?? 0) })
    if (filters.bookId) params.set('bookId', String(filters.bookId))
    if (filters.status) params.set('status', filters.status)
    if (filters.q) params.set('q', filters.q)
    return http.get<PageResponse<AdminCourse>>(`/api/v1/admin/courses?${params}`)
  },
  course: (courseId: number) => http.get<AdminCourse>(`/api/v1/admin/courses/${courseId}`),
  createCourse: async (payload: Record<string, unknown>) => {
    const result = await http.post<AdminCourse>('/api/v1/admin/courses', payload)
    invalidateCatalogCache()
    return result
  },
  updateCourse: async (id: number, payload: Record<string, unknown>) => {
    const result = await http.patch<AdminCourse>(`/api/v1/admin/courses/${id}`, payload)
    invalidateCatalogCache()
    return result
  },
  publishCourse: (id: number) => http.post<AdminCourse>(`/api/v1/admin/courses/${id}/publish`),
  offlineCourse: (id: number) => http.post<AdminCourse>(`/api/v1/admin/courses/${id}/offline`),
  deleteCourse: (id: number) => http.delete<void>(`/api/v1/admin/courses/${id}`),
  users: (q?: string) => {
    const params = new URLSearchParams({ size: '50' })
    if (q) params.set('q', q)
    return http.get<PageResponse<AdminUser>>(`/api/v1/admin/users?${params}`)
  },
  setUserStatus: (id: number, status: 'ENABLED' | 'DISABLED') =>
    http.patch<AdminUser>(`/api/v1/admin/users/${id}/status`, { status }),
  presignUpload: (payload: {
    kind: 'COVER' | 'AUDIO' | 'SUBTITLE'
    fileName: string
    contentType: string
    sizeBytes: number
  }) => http.post<PresignResponse>('/api/v1/admin/uploads/presign', payload),
}
