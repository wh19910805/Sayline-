import { expect, test } from '@playwright/test'

import { mockUserApi } from './mock-api'

test('player uses the published course cover on every cover surface', async ({ page }) => {
  await mockUserApi(page, 'USER')
  await page.goto('/learn/1/1')
  await expect(page.locator('.player-header')).toBeVisible()

  await expect(page.locator('.player-identity__cover')).toHaveCSS(
    'background-image',
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
