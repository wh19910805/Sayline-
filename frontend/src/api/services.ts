import { http } from './index'
import type {
  AdminCategory,
  AdminCourse,
  AdminUser,
  AuthResponse,
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
  StatsResponse,
} from './types'

export const authApi = {
  login: (phone: string, password: string) =>
    http.post<AuthResponse>('/api/v1/auth/login', { phone, password }),
  register: (phone: string, password: string, nickname: string) =>
    http.post<AuthResponse>('/api/v1/auth/register', { phone, password, nickname }),
  me: () => http.get<AuthResponse['user']>('/api/v1/auth/me'),
  logout: () => http.post<void>('/api/v1/auth/logout'),
}

export const learnerApi = {
  categories: () => http.get<Category[]>('/api/v1/categories'),
  courses: (categoryId?: number, q?: string) => {
    const params = new URLSearchParams({ size: '200' })
    if (categoryId) params.set('categoryId', String(categoryId))
    if (q) params.set('q', q)
    return http.get<PageResponse<CourseSummary>>(`/api/v1/courses?${params}`)
  },
  favorites: () => http.get<PageResponse<CourseSummary>>('/api/v1/favorites?size=50'),
  course: (courseId: number) => http.get<CourseDetail>(`/api/v1/courses/${courseId}`),
  favorite: (courseId: number) => http.post<{ favorited: boolean }>(`/api/v1/courses/${courseId}/favorite`),
  unfavorite: (courseId: number) => http.delete(`/api/v1/courses/${courseId}/favorite`),
  interests: () => http.get<Category[]>('/api/v1/me/interests'),
  updateInterests: (categoryIds: number[]) =>
    http.put<Category[]>('/api/v1/me/interests', { categoryIds }),
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
  saveCategory: (payload: Record<string, unknown>, id?: number) =>
    id
      ? http.patch<AdminCategory>(`/api/v1/admin/categories/${id}`, payload)
      : http.post<AdminCategory>('/api/v1/admin/categories', payload),
  deleteCategory: (id: number) => http.delete(`/api/v1/admin/categories/${id}`),
  courses: (filters: { categoryId?: number; status?: CourseStatus; q?: string; page?: number }) => {
    const params = new URLSearchParams({ size: '20', page: String(filters.page ?? 0) })
    if (filters.categoryId) params.set('categoryId', String(filters.categoryId))
    if (filters.status) params.set('status', filters.status)
    if (filters.q) params.set('q', filters.q)
    return http.get<PageResponse<AdminCourse>>(`/api/v1/admin/courses?${params}`)
  },
  createCourse: (payload: Record<string, unknown>) =>
    http.post<AdminCourse>('/api/v1/admin/courses', payload),
  updateCourse: (id: number, payload: Record<string, unknown>) =>
    http.patch<AdminCourse>(`/api/v1/admin/courses/${id}`, payload),
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
