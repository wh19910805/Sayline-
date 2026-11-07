import { expect, test } from '@playwright/test'

import { mockUserApi } from './mock-api'

test('admin sees dashboard and manages books and lessons', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  await page.goto('/admin')

  await expect(page.getByText('学习正在发生。')).toBeVisible()
  await expect(page.getByText('1284')).toBeVisible()
  await page.getByRole('link', { name: '课程管理' }).first().click()
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

test('admin account can enter the learner experience', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  await page.goto('/')

  await expect(page.locator('.book3d').first()).toBeVisible()
  await expect(page.locator('.admin-sidebar')).toHaveCount(0)
})
