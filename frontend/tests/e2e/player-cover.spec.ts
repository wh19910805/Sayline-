import { expect, test } from '@playwright/test'

import { mockUserApi } from './mock-api'

test('player uses the published course cover on every cover surface', async ({ page }) => {
  await mockUserApi(page, 'USER')
  await page.goto('/learn/1/1')
  await expect(page.locator('.player-header')).toBeVisible()

  await expect(page.locator('.player-identity__cover img')).toHaveAttribute(
    'src',
    /course-work\.jpg/,
  )
  await expect(page.locator('.player-cover-backdrop')).toHaveCSS(
    'background-image',
    /course-work\.jpg/,
  )

  const ambientCover = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ambient-cover'),
  )
  expect(ambientCover).toContain('/covers/course-work.jpg')
  expect(ambientCover).not.toContain('/covers/work.jpg')
})

test('player falls back when the course cover fails to load', async ({ page }) => {
  await mockUserApi(page, 'USER')
  await page.route('**/covers/course-work.jpg', (route) => route.fulfill({ status: 404 }))
  await page.route('**/covers/work.jpg', (route) => route.fulfill({ status: 404 }))
  await page.goto('/learn/1/1')
  await expect(page.locator('.player-header')).toBeVisible()

  await expect(page.locator('.player-identity__cover-fallback')).toBeVisible()
  await expect(page.locator('.player-identity__cover-fallback')).toContainText('M')
  await expect(page.locator('.player-cover-backdrop')).toHaveCount(0)
})
