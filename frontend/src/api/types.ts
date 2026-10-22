export type UserRole = 'USER' | 'ADMIN'
export type UserStatus = 'ENABLED' | 'DISABLED'
export type LearningMode = 'LISTEN' | 'READ' | 'WRITE' | 'SPEAK'
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE'

export interface User {
  id: number
  phone: string
  nickname: string
  role: UserRole
  avatarUrl?: string | null
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  user: User
}

export interface Category {
  id: number
  name: string
  description?: string | null
  coverUrl?: string | null
  themeColorPrimary?: string | null
  themeColorSecondary?: string | null
}

export interface CourseSummary {
  id: number
  title: string
  description?: string | null
  categoryId: number
  categoryName: string
  coverUrl?: string | null
  themeColorPrimary?: string | null
  themeColorSecondary?: string | null
  durationMs: number
  progress: number
  favorite: boolean
}

export interface Cue {
  id: number
  sequenceNo: number
  startMs: number
  endMs: number
  englishText: string
  chineseText: string
}

export interface CourseDetail extends Omit<CourseSummary, 'description'> {
  description?: string | null
  audioUrl?: string | null
  cues: Cue[]
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ModeState {
  progress: number
  confirmed: boolean
}

export interface LearningState {
  lastMode: LearningMode
  lastCueId?: number | null
  lastPositionMs: number
  modes: Record<'listen' | 'read' | 'write' | 'speak', ModeState>
  cues: Array<{
    cueId: number
    heard: boolean
    read: boolean
    written: boolean
    spoken: boolean
  }>
  completed: boolean
}

export interface StatsDay {
  date: string
  active: boolean
  sessions: number
  studyMs: number
}

export interface StatsResponse {
  rangeStart: string
  rangeEnd: string
  days: StatsDay[]
  summary: {
    studyDays: number
    sessions: number
    studyMs: number
    dictationAccuracy: number
    speakingCount: number
  }
}

export interface Profile {
  id: number
  phone: string
  nickname: string
  avatarUrl?: string | null
}

export interface LearningSettings {
  fontScale: number
  subtitleColor: string
  showChineseListen: boolean
  showChineseRead: boolean
  showChineseWrite: boolean
  showChineseSpeak: boolean
  defaultCategoryId?: number | null
}

export interface AdminCategory extends Category {
  coverObjectKey?: string | null
  sortOrder: number
  visible: boolean
}

export interface AdminCourse {
  id: number
  categoryId: number
  categoryName: string
  title: string
  description?: string | null
  coverObjectKey?: string | null
  audioObjectKey?: string | null
  subtitleObjectKey?: string | null
  themeColorPrimary?: string | null
  themeColorSecondary?: string | null
  durationMs: number
  sortOrder: number
  status: CourseStatus
  publishedAt?: string | null
}

export interface AdminUser {
  id: number
  phone: string
  nickname: string
  role: UserRole
  status: UserStatus
  createdAt: string
  lastLoginAt?: string | null
}

export interface Dashboard {
  totalLearners: number
  activeToday: number
  totalPublishedCourses: number
  courseStarts: number
  completedCourses: number
  completionRate: number
  totalStudyMs: number
  dictationAccuracy: number
  speakingCount: number
}

export interface PresignResponse {
  uploadUrl: string
  objectKey: string
  expiresAt: string
}
