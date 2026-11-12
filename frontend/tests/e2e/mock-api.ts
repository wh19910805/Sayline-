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
    bookId: 1,
    title: 'Meeting a New Colleague',
    description: '认识新同事',
    categoryId: 1,
    categoryName: '职场英语',
    coverUrl: '/covers/course-work.jpg',
    themeColorPrimary: '#65734f',
    themeColorSecondary: '#9f5e31',
    durationMs: 20_000,
    progress: 58,
    favorite: false,
  },
  {
    id: 2,
    bookId: 1,
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
    bookId: 2,
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

const books = [
  {
    id: 1,
    title: '职场英语',
    description: '会议、协作与真实职场表达',
    categoryId: 1,
    categoryName: '职场英语',
    coverUrl: '/covers/work.jpg',
    coverThumbnailUrl: '/covers/work.jpg',
    themeColorPrimary: '#65734f',
    themeColorSecondary: '#9f5e31',
    lessonCount: 2,
    progress: 58,
    favorite: false,
  },
  {
    id: 2,
    title: '日常口语',
    description: '闲聊、社交与自然开口',
    categoryId: 2,
    categoryName: '日常口语',
    coverUrl: '/covers/spoken.jpg',
    coverThumbnailUrl: '/covers/spoken.jpg',
    themeColorPrimary: '#8b6651',
    themeColorSecondary: '#42271f',
    lessonCount: 2,
    progress: 24,
    favorite: true,
  },
  {
    id: 3,
    title: '听力训练',
    description: '抓住重点，适应真实语速',
    categoryId: 3,
    categoryName: '听力训练',
    coverUrl: '/covers/listening.jpg',
    coverThumbnailUrl: '/covers/listening.jpg',
    themeColorPrimary: '#517671',
    themeColorSecondary: '#243a38',
    lessonCount: 1,
    progress: 0,
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

const createLearning = (listenProgress: number) => ({
  lastMode: 'LISTEN',
  lastCueId: 1,
  lastPositionMs: 0,
  modes: {
    listen: { progress: listenProgress, confirmed: false },
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
})

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

export async function mockUserApi(
  page: Page,
  role: 'USER' | 'ADMIN',
  options: { listenProgress?: number } = {},
) {
  const learning = createLearning(options.listenProgress ?? 40)
  const adminBookVisibility = new Map(books.map((book) => [book.id, true]))
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
    if (path === '/api/v1/books') {
      const categoryId = Number(url.searchParams.get('categoryId'))
      const q = url.searchParams.get('q')?.toLowerCase()
      const content = books.filter(
        (book) =>
          (!categoryId || book.categoryId === categoryId) &&
          (!q ||
            `${book.title} ${book.description} ${book.categoryName}`
              .toLowerCase()
              .includes(q)),
      )
      return json(route, content)
    }
    if (path === '/api/v1/search') {
      const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
      const matchingBooks = books.filter((book) =>
        `${book.title} ${book.description} ${book.categoryName}`
          .toLowerCase()
          .includes(q),
      )
      const matchingLessons = courses.filter((course) =>
        `${course.title} ${course.description} ${course.categoryName}`
          .toLowerCase()
          .includes(q),
      )
      const matchingCues = cues
        .filter((cue) =>
          `${cue.englishText} ${cue.chineseText}`.toLowerCase().includes(q),
        )
        .map((cue) => {
          const course = courses[0]!
          return {
            cueId: cue.id,
            courseId: course.id,
            bookId: 1,
            courseTitle: course.title,
            bookTitle: books[0]!.title,
            sequenceNo: cue.sequenceNo,
            startMs: cue.startMs,
            englishText: cue.englishText,
            chineseText: cue.chineseText,
          }
        })
      return json(route, {
        books: matchingBooks,
        lessons: matchingLessons,
        cues: matchingCues,
      })
    }
    if (/^\/api\/v1\/books\/\d+$/.test(path)) {
      const id = Number(path.split('/').at(-1))
      const book = books.find((b) => b.id === id) ?? books[0]
      const lessons = courses
        .filter((c) => c.categoryId === book.categoryId)
        .map((c) => ({ ...c, bookId: book.id, bookName: book.title }))
      return json(route, { ...book, lessons })
    }
    if (path === '/api/v1/favorite-books') {
      return json(route, books.filter((book) => book.favorite))
    }
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
      const settings = {
        fontScale: 1,
        subtitleColor: '#FFFAF0',
        playbackRate: 1,
        showChineseListen: true,
        showChineseRead: true,
        showChineseWrite: true,
        showChineseSpeak: true,
        dailyGoalMinutes: 15,
        defaultCategoryId: 1,
      }
      const payload =
        request.method() === 'PATCH'
          ? (request.postDataJSON() as Partial<typeof settings>)
          : {}
      return json(route, { ...settings, ...payload })
    }
    if (path === '/api/v1/learning/reviews') {
      return json(route, [
        {
          bookId: 1,
          courseId: 1,
          cueId: 3,
          bookTitle: '职场英语',
          courseTitle: 'Meeting a New Colleague',
          sequenceNo: 3,
          englishText: 'Could we move the meeting to Friday morning?',
          chineseText: '我们能把会议改到周五上午吗？',
          lastAnswer: 'Could we move the meeting to Friday?',
          wrongCount: 2,
          lastWrongAt: '2026-11-12T02:00:00Z',
        },
      ])
    }
    if (path === '/api/v1/learning/stats') {
      if (url.searchParams.get('period') === 'MONTH') {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        const daysInMonth = new Date(year, month, 0).getDate()
        const pad = (n: number) => String(n).padStart(2, '0')
        const activeMinutes: Record<number, number> = {
          1: 8, 3: 16, 6: 42, 10: 64, 14: 48, 18: 12, 20: 39, 22: 58,
        }
        activeMinutes[now.getDate()] = 30
        const days = Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1
          const minutes = activeMinutes[day] ?? 0
          return {
            date: `${year}-${pad(month)}-${pad(day)}`,
            active: minutes > 0,
            sessions: minutes > 0 ? (minutes >= 40 ? 2 : 1) : 0,
            studyMs: minutes * 60_000,
          }
        })
        return json(route, {
          rangeStart: `${year}-${pad(month)}-01`,
          rangeEnd: `${year}-${pad(month)}-${pad(daysInMonth)}`,
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
      const today = new Date()
      const weekday = (today.getDay() + 6) % 7
      const monday = new Date(today)
      monday.setHours(12, 0, 0, 0)
      monday.setDate(today.getDate() - weekday)
      const pad = (value: number) => String(value).padStart(2, '0')
      const localDate = (date: Date) =>
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday)
        date.setDate(monday.getDate() + index)
        const dateValue = localDate(date)
        const minutes =
          dateValue === localDate(today) ? 15 : [12, 0, 36, 24, 0, 48][index] ?? 0
        return {
          date: dateValue,
          active: minutes > 0,
          sessions: minutes > 0 ? 1 : 0,
          studyMs: minutes * 60_000,
        }
      })
      return json(route, {
        rangeStart: days[0]!.date,
        rangeEnd: days[6]!.date,
        days,
        summary: {
          studyDays: days.filter((day) => day.active).length,
          sessions: days.filter((day) => day.active).length,
          studyMs: days.reduce((total, day) => total + day.studyMs, 0),
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
        studyTrend: [
          { date: '2026-11-06', studyMs: 3_300_000, learners: 41 },
          { date: '2026-11-07', studyMs: 4_020_000, learners: 52 },
          { date: '2026-11-08', studyMs: 2_880_000, learners: 35 },
          { date: '2026-11-09', studyMs: 5_460_000, learners: 67 },
          { date: '2026-11-10', studyMs: 4_740_000, learners: 59 },
          { date: '2026-11-11', studyMs: 6_120_000, learners: 73 },
          { date: '2026-11-12', studyMs: 5_100_000, learners: 64 },
        ],
      })
    }
    if (path === '/api/v1/admin/categories') {
      const content = categories.map((category, index) => ({
        ...category,
        coverObjectKey: category.coverUrl,
        sortOrder: index + 1,
        visible: true,
      }))
      return json(route, {
        content,
        page: 0,
        size: 20,
        totalElements: content.length,
        totalPages: 1,
      })
    }
    if (path === '/api/v1/admin/books') {
      const categoryId = Number(url.searchParams.get('categoryId'))
      const q = url.searchParams.get('q')?.trim().toLowerCase()
      const visible = url.searchParams.get('visible')
      const content = books
        .map((book, index) => ({
          ...book,
          coverObjectKey: book.coverUrl,
          sortOrder: index + 1,
          visible: adminBookVisibility.get(book.id) ?? true,
        }))
        .filter(
          (book) =>
            (!categoryId || book.categoryId === categoryId) &&
            (!q ||
              `${book.title} ${book.description} ${book.categoryName}`
                .toLowerCase()
                .includes(q)) &&
            (visible === null || String(book.visible) === visible),
        )
      return json(route, { content, page: 0, size: 50, totalElements: content.length, totalPages: 1 })
    }
    if (path === '/api/v1/admin/books/batch-visibility') {
      const payload = request.postDataJSON() as { bookIds: number[]; visible: boolean }
      payload.bookIds.forEach((id) => adminBookVisibility.set(id, payload.visible))
      return route.fulfill({ status: 200 })
    }
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
