import type { Page, Route } from '@playwright/test'

const categories = [
  {
    id: 1,
    name: '职场英语',
    description: '会议、协作与真实职场表达',
    coverUrl: '/covers/work.jpg',
    themeColorPrimary: '#65734f',
    themeColorSecondary: '#9f5e31',
  },
  {
    id: 2,
    name: '日常口语',
    description: '闲聊、社交与自然开口',
    coverUrl: '/covers/spoken.jpg',
    themeColorPrimary: '#8b6651',
    themeColorSecondary: '#42271f',
  },
  {
    id: 3,
    name: '听力训练',
    description: '抓住重点，适应真实语速',
    coverUrl: '/covers/listening.jpg',
    themeColorPrimary: '#517671',
    themeColorSecondary: '#243a38',
  },
]

const courses = [
  {
    id: 1,
    title: 'Meeting a New Colleague',
    description: '认识新同事',
    categoryId: 1,
    categoryName: '职场英语',
    coverUrl: '/covers/work.jpg',
    themeColorPrimary: '#65734f',
    themeColorSecondary: '#9f5e31',
    durationMs: 20_000,
    progress: 58,
    favorite: false,
  },
  {
    id: 2,
    title: 'Email Follow-up',
    description: '跟进邮件',
    categoryId: 1,
    categoryName: '职场英语',
    coverUrl: '/covers/work.jpg',
    themeColorPrimary: '#94633c',
    themeColorSecondary: '#3e2a1c',
    durationMs: 20_000,
    progress: 81,
    favorite: true,
  },
  {
    id: 3,
    title: 'Coffee Chat Basics',
    description: '咖啡闲聊',
    categoryId: 2,
    categoryName: '日常口语',
    coverUrl: '/covers/spoken.jpg',
    themeColorPrimary: '#8b6651',
    themeColorSecondary: '#42271f',
    durationMs: 20_000,
    progress: 24,
    favorite: false,
  },
]

const cues = [
  [1, 0, 3_000, "Nice to meet you. I'm Alex from the design team.", '很高兴认识你，我是设计团队的 Alex。'],
  [2, 3_000, 7_000, 'Nice to meet you too. I just joined this week.', '我也很高兴认识你，我这周刚入职。'],
  [3, 7_000, 11_000, 'Could we move the meeting to Friday morning?', '我们能把会议改到周五上午吗？'],
  [4, 11_000, 15_000, 'Friday works for me. How about ten thirty?', '周五我可以。十点半怎么样？'],
  [5, 15_000, 19_000, "That's perfect. I'll send a calendar invite.", '太好了，我会发一个日历邀请。'],
].map(([id, startMs, endMs, englishText, chineseText]) => ({
  id,
  sequenceNo: id,
  startMs,
  endMs,
  englishText,
  chineseText,
}))

const learning = {
  lastMode: 'LISTEN',
  lastCueId: 1,
  lastPositionMs: 0,
  modes: {
    listen: { progress: 40, confirmed: false },
    read: { progress: 20, confirmed: false },
    write: { progress: 0, confirmed: false },
    speak: { progress: 0, confirmed: false },
  },
  cues: cues.map((cue, index) => ({
    cueId: cue.id,
    heard: index < 2,
    read: index < 1,
    written: false,
    spoken: false,
  })),
  completed: false,
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

export async function mockUserApi(page: Page, role: 'USER' | 'ADMIN') {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (path === '/api/v1/auth/me') {
      return json(route, {
        id: role === 'ADMIN' ? 99 : 1,
        phone: role === 'ADMIN' ? '13900000000' : '13800138000',
        nickname: role === 'ADMIN' ? 'Sayline Admin' : '林禾',
        role,
        avatarUrl: null,
      })
    }
    if (path === '/api/v1/me/interests') return json(route, categories)
    if (path === '/api/v1/categories') return json(route, categories)
    if (path === '/api/v1/courses') {
      const q = url.searchParams.get('q')?.toLowerCase()
      const categoryId = Number(url.searchParams.get('categoryId'))
      const content = courses.filter(
        (course) =>
          (!categoryId || course.categoryId === categoryId) &&
          (!q || `${course.title} ${course.categoryName}`.toLowerCase().includes(q)),
      )
      return json(route, { content, page: 0, size: 50, totalElements: content.length, totalPages: 1 })
    }
    if (path === '/api/v1/favorites') {
      const content = courses.filter((course) => course.favorite)
      return json(route, { content, page: 0, size: 50, totalElements: content.length, totalPages: 1 })
    }
    if (/^\/api\/v1\/courses\/\d+$/.test(path)) {
      const id = Number(path.split('/').at(-1))
      const course = courses.find((item) => item.id === id) ?? courses[0]
      return json(route, { ...course, audioUrl: '/audio/demo.wav', cues })
    }
    if (/\/favorite$/.test(path)) {
      return json(route, { favorited: request.method() === 'POST' })
    }
    if (path === '/api/v1/me/profile') {
      return json(route, { id: 1, phone: '13800138000', nickname: '林禾', avatarUrl: null })
    }
    if (path === '/api/v1/me/settings') {
      return json(route, {
        fontScale: 1,
        subtitleColor: '#FFFAF0',
        showChineseListen: true,
        showChineseRead: true,
        showChineseWrite: true,
        showChineseSpeak: true,
        defaultCategoryId: 1,
      })
    }
    if (path === '/api/v1/learning/stats') {
      if (url.searchParams.get('period') === 'MONTH') {
        const activeMinutes: Record<number, number> = {
          1: 8, 3: 16, 6: 42, 7: 25, 10: 64, 11: 19, 14: 48, 17: 31, 18: 12, 20: 39, 21: 58, 22: 26,
        }
        const days = Array.from({ length: 31 }, (_, index) => {
          const day = index + 1
          const minutes = activeMinutes[day] ?? 0
          return {
            date: `2026-10-${String(day).padStart(2, '0')}`,
            active: minutes > 0,
            sessions: minutes > 0 ? (minutes >= 40 ? 2 : 1) : 0,
            studyMs: minutes * 60_000,
          }
        })
        return json(route, {
          rangeStart: '2026-10-01',
          rangeEnd: '2026-10-31',
          days,
          summary: {
            studyDays: 12,
            sessions: 16,
            studyMs: 22_140_000,
            dictationAccuracy: 86,
            speakingCount: 24,
          },
        })
      }
      await new Promise((resolve) => setTimeout(resolve, 1_500))
      return json(route, {
        rangeStart: '2026-10-19',
        rangeEnd: '2026-10-25',
        days: [
          { date: '2026-10-19', active: true, sessions: 1, studyMs: 2_280_000 },
          { date: '2026-10-20', active: false, sessions: 0, studyMs: 0 },
          { date: '2026-10-21', active: true, sessions: 2, studyMs: 4_320_000 },
          { date: '2026-10-22', active: true, sessions: 1, studyMs: 3_060_000 },
          { date: '2026-10-23', active: false, sessions: 0, studyMs: 0 },
          { date: '2026-10-24', active: true, sessions: 2, studyMs: 5_760_000 },
          { date: '2026-10-25', active: false, sessions: 0, studyMs: 0 },
        ],
        summary: {
          studyDays: 4,
          sessions: 6,
          studyMs: 15_420_000,
          dictationAccuracy: 86,
          speakingCount: 24,
        },
      })
    }
    if (/^\/api\/v1\/learning\/courses\/\d+$/.test(path)) return json(route, learning)
    if (/\/learning\/courses\/\d+\/(actions|position|confirm)$/.test(path)) return json(route, learning)
    if (/\/learning\/courses\/\d+\/heartbeat$/.test(path)) {
      return json(route, { sessionId: 'e2e', sessionActiveMs: 15_000, sessionCounted: false })
    }
    if (path === '/api/v1/admin/dashboard') {
      return json(route, {
        totalLearners: 1284,
        activeToday: 236,
        totalPublishedCourses: 42,
        courseStarts: 3180,
        completedCourses: 1726,
        completionRate: 54,
        totalStudyMs: 74_520_000,
        dictationAccuracy: 83,
        speakingCount: 9642,
      })
    }
    if (path === '/api/v1/admin/categories') return json(route, categories)
    if (path === '/api/v1/admin/courses') {
      const content = courses.map((course) => ({
        ...course,
        status: course.id === 2 ? 'DRAFT' : 'PUBLISHED',
        sortOrder: course.id,
      }))
      return json(route, { content, page: 0, size: 50, totalElements: content.length, totalPages: 1 })
    }
    if (path === '/api/v1/admin/users') {
      return json(route, {
        content: [
          {
            id: 1,
            phone: '13800138000',
            nickname: '林禾',
            role: 'USER',
            status: 'ENABLED',
            createdAt: '2026-10-01T08:00:00Z',
            lastLoginAt: '2026-10-22T02:00:00Z',
          },
        ],
        page: 0,
        size: 50,
        totalElements: 1,
        totalPages: 1,
      })
    }
    return json(route, { code: 'E2E_MOCK_MISS', status: 404, detail: path }, 404)
  })
}
