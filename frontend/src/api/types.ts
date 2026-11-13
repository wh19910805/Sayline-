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
  bookId: number
  title: string
  description?: string | null
  categoryId: number
  categoryName: string
  coverUrl?: string | null
  coverThumbnailUrl?: string | null
  themeColorPrimary?: string | null
  themeColorSecondary?: string | null
  durationMs: number
  progress: number
  lastCueText?: string | null
  lastCueSequenceNo?: number
  remainingDurationMs?: number
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

export interface BookSummary {
  id: number
  title: string
  description?: string | null
  categoryId: number
  categoryName: string
  coverUrl?: string | null
  coverThumbnailUrl?: string | null
  themeColorPrimary?: string | null
  themeColorSecondary?: string | null
  spineColor?: string | null
  lessonCount: number
  progress: number
  favorite: boolean
}

export interface BookDetail extends BookSummary {
  lessons: CourseSummary[]
}

export interface RecentLesson {
  id: number
  bookId: number
  title: string
  bookTitle: string
  coverUrl?: string | null
  themeColorPrimary?: string | null
  themeColorSecondary?: string | null
  progress: number
  lastStudiedAt: string
}

export interface CueSearchResult {
  cueId: number
  courseId: number
  bookId: number
  courseTitle: string
  bookTitle: string
  sequenceNo: number
  startMs: number
  englishText: string
  chineseText: string
}

export interface SearchResponse {
  books: BookSummary[]
  lessons: CourseSummary[]
  cues: CueSearchResult[]
}

export interface ReviewCue {
  bookId: number
  courseId: number
  cueId: number
  bookTitle: string
  courseTitle: string
  sequenceNo: number
  englishText: string
  chineseText: string
  lastAnswer: string
  wrongCount: number
  lastWrongAt: string
  status: 'LEARNING' | 'MASTERED' | 'SNOOZED'
  nextReviewAt?: string | null
  due: boolean
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

export interface SessionInfo {
  id: string
  userAgent?: string | null
  ipAddress?: string | null
  createdAt: string
  lastUsedAt?: string | null
  expiresAt: string
  current: boolean
}

export interface PasswordResetToken {
  token: string
  expiresAt: string
}

export interface LearningSettings {
  fontScale: number
  subtitleColor: string
  playbackRate: number
  showChineseListen: boolean
  showChineseRead: boolean
  showChineseWrite: boolean
  showChineseSpeak: boolean
  dailyGoalMinutes: number
  reminderEnabled: boolean
  reminderTime: string
  defaultCategoryId?: number | null
}

export interface AdminCategory extends Category {
  coverObjectKey?: string | null
  sortOrder: number
  visible: boolean
}

export interface AdminBook {
  id: number
  categoryId: number
  categoryName: string
  title: string
  description?: string | null
  coverObjectKey?: string | null
  coverUrl?: string | null
  themeColorPrimary?: string | null
  themeColorSecondary?: string | null
  sortOrder: number
  visible: boolean
  updatedAt: string
}

export interface AdminCourse {
  id: number
  bookId: number
  bookName: string
  categoryId: number
  categoryName: string
  title: string
  description?: string | null
  coverObjectKey?: string | null
  coverUrl?: string | null
  audioObjectKey?: string | null
  subtitleObjectKey?: string | null
  themeColorPrimary?: string | null
  themeColorSecondary?: string | null
  durationMs: number
  sortOrder: number
  status: CourseStatus
  publishedAt?: string | null
  updatedAt: string
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
  activeYesterday: number
  totalPublishedCourses: number
  courseStarts: number
  completedCourses: number
  completionRate: number
  totalStudyMs: number
  thisWeekStudyMs: number
  previousWeekStudyMs: number
  dictationAccuracy: number
  speakingCount: number
  studyTrend: Array<{
    date: string
    studyMs: number
    learners: number
  }>
}

export interface PresignResponse {
  uploadUrl: string
  objectKey: string
  expiresAt: string
}

export type ImportType = 'CREATE' | 'SUBTITLE'
export type ImportStatus = 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'ROLLED_BACK'
export type ImportItemStatus =
  | 'READY'
  | 'DUPLICATE'
  | 'INVALID'
  | 'UNCHANGED'
  | 'CREATED'
  | 'UPDATED'
  | 'FAILED'

export interface ImportItem {
  sourceName: string
  title: string
  audioMd5?: string | null
  subtitleMd5?: string | null
  audioObjectKey?: string | null
  subtitleObjectKey?: string | null
  courseId?: number | null
  durationMs: number
}

export interface ImportItemView {
  index: number
  sourceName: string
  title: string
  status: ImportItemStatus
  reason?: string | null
  courseId?: number | null
  courseTitle?: string | null
  bookTitle?: string | null
  previousSubtitleObjectKey?: string | null
  error?: string | null
}

export interface ImportPreview {
  total: number
  ready: number
  skipped: number
  invalid: number
  items: ImportItemView[]
}

export interface ImportJob {
  id: number
  type: ImportType
  status: ImportStatus
  bookId?: number | null
  total: number
  success: number
  skipped: number
  failed: number
  createdAt: string
  updatedAt: string
  items: ImportItemView[]
}

export interface ContentHealth {
  publishedCourses: number
  missingMediaCourses: number
  missingSubtitleCourses: number
  duplicateAudioGroups: number
  orphanObjectCount: number
  issues: Array<{
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
    type: string
    message: string
    entityId?: number | null
  }>
  failedImports: Array<{
    id: number
    type: ImportType
    status: ImportStatus
    failed: number
    createdAt: string
  }>
  auditLogs: Array<{
    id: number
    actorId?: number | null
    action: string
    entityType: string
    entityId?: string | null
    detail?: string | null
    createdAt: string
  }>
}
