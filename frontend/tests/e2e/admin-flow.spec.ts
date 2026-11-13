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

  await expect(page.locator('.book3d').first()).toBeVisible()
  await expect(page.locator('.admin-sidebar')).toHaveCount(0)
})

test('admin previews and executes a paired batch import', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
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
  await expect(page.getByRole('heading', { name: '任务 #1 已完成' })).toBeVisible()
  await expect(page.getByText('成功 1，跳过 0，失败 0。')).toBeVisible()
  await expect(page.getByText('新建课时').last()).toBeVisible()
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
  await expect(page.getByText('孤立媒体对象')).toBeVisible()
  await expect(page.getByText('ORPHAN_MEDIA')).toBeVisible()
  await expect(page.getByText(/BATCH_CONTENT_IMPORT/)).toBeVisible()
})
