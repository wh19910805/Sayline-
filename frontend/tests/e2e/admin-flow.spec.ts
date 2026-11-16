import { expect, test } from '@playwright/test'

import { mockUserApi } from './mock-api'

test('admin sees dashboard and manages books and lessons', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  await page.goto('/admin')

  await expect(page.getByText('学习正在发生。')).toBeVisible()
  await expect(page.getByText('1284')).toBeVisible()
  await expect(page.getByRole('heading', { name: '七日学习趋势' })).toBeVisible()
  await page.getByRole('link', { name: '书籍管理' }).first().click()
  await expect(page.getByText('会议、协作与真实职场表达')).toBeVisible()
  await expect(page.getByText('抓住重点，适应真实语速')).toBeVisible()
  await page.getByRole('link', { name: '课时管理' }).first().click()
  await expect(page.getByText('Meeting a New Colleague')).toBeVisible()
  await expect(page.getByText('Coffee Chat Basics')).toBeVisible()
})

test('admin lesson table remains usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockUserApi(page, 'ADMIN')
  await page.goto('/admin/courses')

  await expect(page.getByRole('button', { name: '新建课时' })).toBeVisible()
  await expect(page.getByText('Meeting a New Colleague')).toBeVisible()
  await expect(page.locator('.admin-mobile-nav')).toBeVisible()
  const titleBox = await page.getByRole('heading', { name: '课时管理' }).boundingBox()
  expect(titleBox).not.toBeNull()
  expect(titleBox!.height).toBeLessThan(60)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('admin filters books and batch hides selected rows', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  await page.goto('/admin/books')

  await page.getByPlaceholder('搜索书籍名、简介或分类').fill('听力')
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page.getByRole('strong').filter({ hasText: '听力训练' })).toBeVisible()
  await expect(page.locator('.admin-table tbody').getByText('日常口语')).toHaveCount(0)

  await page.getByRole('checkbox', { name: '选择 听力训练' }).check()
  await page.getByRole('button', { name: '批量隐藏' }).click()
  await page.getByRole('button', { name: '确认隐藏' }).click()
  await expect(page.getByRole('cell', { name: '已隐藏' })).toBeVisible()
})

test('admin account can enter the learner experience', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  await page.goto('/')

  await expect(page.locator('.book-slot.is-active .book3d__front')).toBeVisible()
  await expect(page.locator('.admin-sidebar')).toHaveCount(0)
})

test('admin previews and executes a paired batch import', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  await page.route('**/api/v1/admin/imports', async (route) => {
    if (route.request().method() === 'POST') {
      await new Promise((resolve) => setTimeout(resolve, 600))
    }
    return route.fallback()
  })
  await page.goto('/admin/imports')

  await page.getByLabel('目标书籍').selectOption('1')
  await page.getByTestId('import-files').setInputFiles([
    {
      name: '01 Hello.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('ID3 batch audio'),
    },
    {
      name: '01 Hello.srt',
      mimeType: 'application/x-subrip',
      buffer: Buffer.from('1\n00:00:00,000 --> 00:00:02,000\nHello\n'),
    },
    {
      name: '01 Hello.orig.srt',
      mimeType: 'application/x-subrip',
      buffer: Buffer.from('backup subtitle'),
    },
  ])

  await expect(page.getByText(/已自动忽略 1 个/)).toBeVisible()
  await expect(page.getByText('1 组待检查')).toBeVisible()
  await page.getByRole('button', { name: '导入前预览' }).click()
  await expect(page.getByText('1 可导入')).toBeVisible()
  await expect(page.getByRole('cell', { name: /可导入/ })).toBeVisible()

  await page.getByRole('button', { name: '执行导入（1）' }).click()
  await expect(page.locator('progress[aria-label="批量导入进度"]')).toBeVisible()
  await expect(page.getByRole('heading', { name: '任务 #1 已完成' })).toBeVisible()
  await expect(page.getByText('成功 1，跳过 0，失败 0。')).toBeVisible()
  await expect(page.getByText('新建课时').last()).toBeVisible()
})

test('admin filters failed import rows and retries only failures', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  const failedItem = {
    index: 1,
    sourceName: '02 Failed.mp3',
    title: 'Failed Lesson',
    status: 'FAILED',
    reason: null,
    courseId: null,
    courseTitle: null,
    bookTitle: null,
    previousSubtitleObjectKey: null,
    error: '上传文件不存在',
  }
  await page.route('**/api/v1/admin/imports', (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        type: 'CREATE',
        status: 'PARTIAL',
        bookId: 1,
        total: 2,
        success: 1,
        skipped: 0,
        failed: 1,
        createdAt: '2026-11-15T02:00:00Z',
        updatedAt: '2026-11-15T02:00:00Z',
        items: [{
          index: 0,
          sourceName: '01 Ready.mp3',
          title: 'Ready Lesson',
          status: 'CREATED',
          reason: null,
          courseId: 10,
          courseTitle: 'Ready Lesson',
          bookTitle: '职场英语',
          previousSubtitleObjectKey: null,
          error: null,
        }, failedItem],
      }),
    })
  })
  await page.route('**/api/v1/admin/imports/1/retry-failed', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 2,
        type: 'CREATE',
        status: 'FAILED',
        bookId: 1,
        total: 1,
        success: 0,
        skipped: 0,
        failed: 1,
        createdAt: '2026-11-15T02:10:00Z',
        updatedAt: '2026-11-15T02:10:00Z',
        items: [failedItem],
      }),
    }),
  )

  await page.goto('/admin/imports')
  await page.getByLabel('目标书籍').selectOption('1')
  await page.getByTestId('import-files').setInputFiles([
    {
      name: '01 Ready.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('ready audio'),
    },
    {
      name: '01 Ready.srt',
      mimeType: 'application/x-subrip',
      buffer: Buffer.from('1\n00:00:00,000 --> 00:00:02,000\nReady\n准备好。\n'),
    },
    {
      name: '02 Failed.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('failed audio'),
    },
    {
      name: '02 Failed.srt',
      mimeType: 'application/x-subrip',
      buffer: Buffer.from('1\n00:00:00,000 --> 00:00:02,000\nFailed\n失败。\n'),
    },
  ])
  await page.getByRole('button', { name: '导入前预览' }).click()
  await page.getByRole('button', { name: /执行导入/ }).click()
  await expect(page.getByRole('heading', { name: '任务 #1 已完成' })).toBeVisible()

  await page.getByRole('button', { name: /^失败 1$/ }).click()
  await expect(page.getByText('Failed Lesson')).toBeVisible()
  await expect(page.getByText('Ready Lesson')).toHaveCount(0)

  await page.getByRole('button', { name: '只重试失败项' }).click()
  await expect(page.getByRole('heading', { name: '任务 #2 已完成' })).toBeVisible()
})

test('admin course table groups destructive actions and supports batch status', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  await page.goto('/admin/courses')

  await expect(page.getByText('音频、字幕完整').first()).toBeVisible()
  await page.getByRole('checkbox', { name: '选择 Meeting a New Colleague' }).check()
  await page.getByRole('button', { name: '批量下架' }).click()
  await page.getByRole('button', { name: '确认下架' }).click()
  await expect(page.locator('.admin-batch-bar')).toHaveCount(0)

  await page.locator('.admin-row-menu summary').nth(1).click()
  await expect(page.getByRole('button', { name: '删除课时' }).first()).toBeVisible()
})

test('admin operations page reports content health and audit activity', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  await page.goto('/admin/operations')

  await expect(page.getByRole('heading', { name: '内容与运营监控' })).toBeVisible()
  await expect(page.locator('.health-metrics')).toContainText('孤立媒体对象')
  await expect(page.locator('.issue-list')).toContainText('孤立媒体对象')
  await expect(page.locator('.issue-list')).not.toContainText('ORPHAN_MEDIA')
  await expect(page.getByText('查看处理说明')).toBeVisible()
  await expect(page.locator('.audit-list')).toContainText('批量内容导入')
  await expect(page.locator('.audit-list')).not.toContainText('BATCH_CONTENT_IMPORT')
})

test('admin operations issues link to actionable admin views', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  await page.route('**/api/v1/admin/content-health', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        publishedCourses: 12,
        missingMediaCourses: 2,
        missingSubtitleCourses: 1,
        duplicateAudioGroups: 1,
        orphanObjectCount: 0,
        issues: [{
          severity: 'HIGH',
          type: 'MISSING_MEDIA',
          message: '有 2 个课时缺少媒体',
          entityId: null,
        }],
        failedImports: [{
          id: 9,
          type: 'CREATE',
          status: 'PARTIAL',
          failed: 1,
          createdAt: '2026-11-15T02:00:00Z',
        }],
        auditLogs: [],
      }),
    }),
  )

  await page.goto('/admin/operations')
  await expect(page.getByRole('link', { name: '查看缺失媒体课时' })).toHaveAttribute(
    'href',
    '/admin/courses?media=MISSING',
  )
  await expect(page.getByRole('link', { name: /查看任务 #9/ })).toHaveAttribute(
    'href',
    '/admin/imports',
  )
})

test('admin filters lessons by media state and sorts the server query', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  let lastMedia = ''
  let lastSort = ''
  const rows = [
    {
      id: 1, bookId: 1, bookName: '职场英语', categoryId: 1, categoryName: '职场英语',
      title: 'Complete Lesson', description: '', coverUrl: '/covers/work.jpg',
      audioObjectKey: 'audio/1.mp3', subtitleObjectKey: 'subtitles/1.srt',
      themeColorPrimary: '#65734f', themeColorSecondary: '#9f5e31',
      durationMs: 20_000, sortOrder: 1, status: 'PUBLISHED',
      updatedAt: '2026-11-12T08:00:00Z',
    },
    {
      id: 2, bookId: 1, bookName: '职场英语', categoryId: 1, categoryName: '职场英语',
      title: 'Missing Media Lesson', description: '', coverUrl: null,
      audioObjectKey: null, subtitleObjectKey: null,
      themeColorPrimary: '#65734f', themeColorSecondary: '#9f5e31',
      durationMs: 20_000, sortOrder: 2, status: 'DRAFT',
      updatedAt: '2026-11-13T08:00:00Z',
    },
  ]
  await page.route('**/api/v1/admin/courses?*', (route) => {
    const url = new URL(route.request().url())
    lastMedia = url.searchParams.get('media') ?? ''
    lastSort = url.searchParams.get('sort') ?? ''
    const content = lastMedia === 'MISSING'
      ? rows.filter((row) => !row.audioObjectKey || !row.subtitleObjectKey)
      : rows
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1 }),
    })
  })

  await page.goto('/admin/courses')
  await page.getByLabel('按媒体状态筛选').selectOption('MISSING')
  await expect(page.getByText('Missing Media Lesson')).toBeVisible()
  await expect(page.getByText('Complete Lesson')).toHaveCount(0)
  expect(lastMedia).toBe('MISSING')

  await page.getByLabel('课时排序').selectOption('updatedAt,desc')
  await expect.poll(() => lastSort).toBe('updatedAt,desc')
})
