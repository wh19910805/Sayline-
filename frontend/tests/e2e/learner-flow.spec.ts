import { expect, test } from '@playwright/test'

import { mockUserApi } from './mock-api'

test.beforeEach(async ({ page }) => {
  await mockUserApi(page, 'USER')
})

test('learner browses, favorites and opens a course', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('[data-test="category-tab"]')).toHaveCount(4)
  await expect(page.locator('.continue-card')).toBeVisible()
  await expect(page.getByRole('heading', { name: '为你准备' })).toBeVisible()
  await expect(page.locator('[data-test="category-card"]')).toBeVisible()
  await expect(page.locator('[data-test="course-card"]')).toHaveCount(2)
  await expect(page.locator('.feed-open')).toHaveCount(0)

  const favorite = page.locator('[data-test="favorite-button"]').first()
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')

  await page.locator('[data-test="course-card"]').first().click()
  await expect(page.locator('.player-screen')).toBeVisible()
  await expect(page.getByText("Nice to meet you. I'm Alex from the design team.")).toBeVisible()
})

test('learner writes a sentence and controls auto-hide', async ({ page }) => {
  await page.goto('/learn/1')
  await expect(page.locator('.player-screen')).toBeVisible()

  await page.locator('[aria-label="写"]').click()
  await expect(page.locator('.write-mode__heading')).toBeVisible()
  await expect(page.locator('.write-sentence-card')).toBeVisible()
  await expect(page.locator('.sl-word-input input')).toHaveCount(10)
  await page.locator('.sl-word-input input').first().fill('Nice')
  await expect(page.locator('.sl-word-input__mirror .is-correct')).not.toHaveCount(0)

  await page.locator('.player-identity h1').click()
  await expect(page.locator('.dictation-feedback')).toBeVisible()

  await page.locator('[aria-label="听"]').click()
  await page.waitForTimeout(6_300)
  await expect(page.locator('.player-bottom-ui')).toHaveClass(/is-hidden/)
  await page.locator('.player-stage').click({ position: { x: 360, y: 400 } })
  await expect(page.locator('.player-bottom-ui')).not.toHaveClass(/is-hidden/)
})

test('learner report has no horizontal overflow on mobile', async ({ page }) => {
  await page.goto('/me')
  await expect(page.locator('.profile-card')).toBeVisible()
  await expect(page.getByText('本周学习节奏')).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})
