import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const baseUrl = 'http://127.0.0.1:5173'
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const outputDir = fileURLToPath(new URL('../artifacts/visual/', import.meta.url))
await mkdir(outputDir, { recursive: true })

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
  ['Meeting a New Colleague', 1, '职场英语', '/covers/work.jpg', '#65734f', '#9f5e31', false],
  ['Coffee Chat Basics', 2, '日常口语', '/covers/spoken.jpg', '#8b6651', '#42271f', true],
  ['Get the Main Point', 3, '听力训练', '/covers/listening.jpg', '#517671', '#243a38', false],
  ['Email Follow-up', 1, '职场英语', '/covers/work.jpg', '#94633c', '#3e2a1c', true],
  ['Small Talk at Lunch', 2, '日常口语', '/covers/spoken.jpg', '#8b6651', '#42271f', false],
  ['Listening at Work', 3, '听力训练', '/covers/listening.jpg', '#46664b', '#1e2921', false],
].map(([title, categoryId, categoryName, coverUrl, themeColorPrimary, themeColorSecondary, favorite], index) => ({
  id: index + 1,
  title,
  description: '一句一句听清楚，再把真实表达说出来。',
  categoryId,
  categoryName,
  coverUrl,
  themeColorPrimary,
  themeColorSecondary,
  durationMs: 20_000,
  favorite,
}))

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
  cues: [
    { cueId: 1, heard: true, read: true, written: false, spoken: false },
    { cueId: 2, heard: true, read: false, written: false, spoken: false },
    { cueId: 3, heard: false, read: false, written: false, spoken: false },
    { cueId: 4, heard: false, read: false, written: false, spoken: false },
    { cueId: 5, heard: false, read: false, written: false, spoken: false },
  ],
  completed: false,
}

function json(body, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

async function installApiMocks(page, state) {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const method = route.request().method()

    if (path === '/api/v1/auth/me') {
      return route.fulfill(json({
        id: state.role === 'ADMIN' ? 99 : 1,
        phone: state.role === 'ADMIN' ? '13900000000' : '13800138000',
        nickname: state.role === 'ADMIN' ? 'Sayline Admin' : '林禾',
        role: state.role,
        avatarUrl: null,
      }))
    }
    if (path === '/api/v1/me/interests') return route.fulfill(json(categories))
    if (path === '/api/v1/categories') return route.fulfill(json(categories))
    if (path === '/api/v1/courses') {
      const q = url.searchParams.get('q')?.toLowerCase()
      const categoryId = Number(url.searchParams.get('categoryId'))
      const content = courses.filter((course) =>
        (!categoryId || course.categoryId === categoryId) &&
        (!q || `${course.title} ${course.categoryName}`.toLowerCase().includes(q)),
      )
      return route.fulfill(json({ content, page: 0, size: 50, totalElements: content.length, totalPages: 1 }))
    }
    if (path === '/api/v1/favorites') {
      const content = courses.filter((course) => course.favorite)
      return route.fulfill(json({ content, page: 0, size: 50, totalElements: content.length, totalPages: 1 }))
    }
    if (/^\/api\/v1\/courses\/\d+$/.test(path)) {
      const id = Number(path.split('/').at(-1))
      const course = courses.find((item) => item.id === id) ?? courses[0]
      return route.fulfill(json({
        ...course,
        audioUrl: '/audio/demo.wav',
        cues,
      }))
    }
    if (/\/favorite$/.test(path)) return route.fulfill(json({ favorited: method === 'POST' }))
    if (path === '/api/v1/me/profile') {
      return route.fulfill(json({ id: 1, phone: '13800138000', nickname: '林禾', avatarUrl: null }))
    }
    if (path === '/api/v1/me/settings') {
      return route.fulfill(json({
        fontScale: 1,
        subtitleColor: '#FFFAF0',
        showChineseListen: true,
        showChineseRead: true,
        showChineseWrite: true,
        showChineseSpeak: true,
        defaultCategoryId: 1,
      }))
    }
    if (path === '/api/v1/learning/stats') {
      return route.fulfill(json({
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
      }))
    }
    if (/^\/api\/v1\/learning\/courses\/\d+$/.test(path)) return route.fulfill(json(learning))
    if (/\/learning\/courses\/\d+\/(actions|position|confirm)$/.test(path)) return route.fulfill(json(learning))
    if (/\/learning\/courses\/\d+\/heartbeat$/.test(path)) {
      return route.fulfill(json({ sessionId: 'preview', sessionActiveMs: 15_000, sessionCounted: false }))
    }
    if (path === '/api/v1/admin/dashboard') {
      return route.fulfill(json({
        totalLearners: 1284,
        activeToday: 236,
        totalPublishedCourses: 42,
        courseStarts: 3180,
        completedCourses: 1726,
        completionRate: 54,
        totalStudyMs: 74_520_000,
        dictationAccuracy: 83,
        speakingCount: 9642,
      }))
    }
    if (path === '/api/v1/admin/categories') return route.fulfill(json(categories))
    if (path === '/api/v1/admin/courses') {
      const content = courses.slice(0, 4).map((course) => ({
        ...course,
        status: course.id === 2 ? 'DRAFT' : 'PUBLISHED',
        sortOrder: course.id,
      }))
      return route.fulfill(json({ content, page: 0, size: 50, totalElements: content.length, totalPages: 1 }))
    }
    if (path === '/api/v1/admin/users') {
      return route.fulfill(json({
        content: [
          { id: 1, phone: '13800138000', nickname: '林禾', role: 'USER', status: 'ENABLED', createdAt: '2026-10-01T08:00:00Z', lastLoginAt: '2026-10-22T02:00:00Z' },
          { id: 2, phone: '13800138001', nickname: 'Mia', role: 'USER', status: 'DISABLED', createdAt: '2026-10-02T08:00:00Z', lastLoginAt: '2026-10-20T02:00:00Z' },
        ],
        page: 0,
        size: 50,
        totalElements: 2,
        totalPages: 1,
      }))
    }
    return route.fulfill(json({ code: 'PREVIEW_MOCK_MISS', status: 404, detail: path }, 404))
  })
}

async function createPage(browser, viewport, role = 'USER') {
  const context = await browser.newContext({ viewport, locale: 'zh-CN' })
  const page = await context.newPage()
  const state = { role }
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await installApiMocks(page, state)
  return { context, page, state, errors }
}

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
const results = []

try {
  const mobile = await createPage(browser, { width: 390, height: 844 })
  await mobile.page.goto(baseUrl)
  await mobile.page.waitForSelector('[data-test="course-card"]')
  await mobile.page.screenshot({ path: `${outputDir}/home-mobile.png` })
  results.push({
    view: 'home-mobile',
    overflow: await mobile.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  })

  await mobile.page.locator('[data-test="course-card"]').first().click()
  await mobile.page.waitForSelector('.player-screen')
  await mobile.page.waitForTimeout(500)
  await mobile.page.screenshot({ path: `${outputDir}/player-listen-mobile.png` })
  await mobile.page.waitForTimeout(6_200)
  const controlsHidden = await mobile.page.locator('.player-bottom-ui').evaluate((node) =>
    node.classList.contains('is-hidden'),
  )
  await mobile.page.screenshot({ path: `${outputDir}/player-immersive-mobile.png` })
  results.push({ view: 'player-immersive-mobile', controlsHidden })

  await mobile.page.locator('.player-stage').click({ position: { x: 370, y: 420 } })
  const controlsRestored = await mobile.page.locator('.player-bottom-ui').evaluate((node) =>
    !node.classList.contains('is-hidden'),
  )
  results.push({ view: 'player-controls-restored', controlsRestored })
  await mobile.page.locator('[aria-label="写"]').click()
  await mobile.page.screenshot({ path: `${outputDir}/player-write-mobile.png` })
  await mobile.page.goto(`${baseUrl}/me`)
  await mobile.page.waitForSelector('.profile-card')
  await mobile.page.screenshot({ path: `${outputDir}/me-mobile.png` })
  results.push({
    view: 'me-mobile',
    overflow: await mobile.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  })
  await mobile.context.close()

  const tablet = await createPage(browser, { width: 834, height: 1112 })
  await tablet.page.goto(baseUrl)
  await tablet.page.waitForSelector('[data-test="course-card"]')
  await tablet.page.screenshot({ path: `${outputDir}/home-tablet.png` })
  results.push({
    view: 'home-tablet',
    overflow: await tablet.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    columns: await tablet.page.locator('.course-feed').evaluate((node) => getComputedStyle(node).columnCount),
  })
  await tablet.context.close()

  const desktop = await createPage(browser, { width: 1440, height: 1000 })
  await desktop.page.goto(baseUrl)
  await desktop.page.waitForSelector('[data-test="course-card"]')
  await desktop.page.screenshot({ path: `${outputDir}/home-desktop.png` })
  results.push({
    view: 'home-desktop',
    overflow: await desktop.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    columns: await desktop.page.locator('.course-feed').evaluate((node) => getComputedStyle(node).columnCount),
  })
  await desktop.context.close()

  const adminDesktop = await createPage(browser, { width: 1440, height: 1000 }, 'ADMIN')
  await adminDesktop.page.goto(`${baseUrl}/admin`)
  await adminDesktop.page.waitForSelector('.admin-metrics')
  await adminDesktop.page.screenshot({ path: `${outputDir}/admin-desktop.png` })
  await adminDesktop.context.close()

  const adminMobile = await createPage(browser, { width: 390, height: 844 }, 'ADMIN')
  await adminMobile.page.goto(`${baseUrl}/admin/courses`)
  await adminMobile.page.waitForSelector('.admin-card')
  await adminMobile.page.screenshot({ path: `${outputDir}/admin-mobile.png` })
  results.push({
    view: 'admin-mobile',
    overflow: await adminMobile.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  })
  await adminMobile.context.close()
} finally {
  await browser.close()
}

console.log(JSON.stringify(results, null, 2))
