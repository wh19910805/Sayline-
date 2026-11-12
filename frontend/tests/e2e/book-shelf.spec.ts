import { expect, test } from '@playwright/test'

import { mockUserApi } from './mock-api'

test.beforeEach(async ({ page }) => {
  await mockUserApi(page, 'USER')
})

test('3D book faces stay visible under prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const first = page.locator('.book3d').first()
  await expect(first).toBeVisible()

  // 关键回归：reduced-motion 下不能把书压成 transform:none（否则封面/封底高度为 0）
  await expect(first).not.toHaveCSS('transform', 'none')

  const faceHeights = await first.evaluate((book) => {
    const top = book.querySelector('.book3d__top')
    const bottom = book.querySelector('.book3d__bottom')
    return [
      top?.getBoundingClientRect().height ?? 0,
      bottom?.getBoundingClientRect().height ?? 0,
    ]
  })

  expect(faceHeights[0] + faceHeights[1]).toBeGreaterThan(0)
})

test('book shelf renders the default category book and opens its lessons', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.book3d')).toHaveCount(1)
  await expect(page.getByText('职场英语')).toBeVisible()

  await page.locator('.book3d').first().click()
  await expect(page).toHaveURL(/\/learn\/\d+/)
})

test('unified search finds subtitle text and opens the matching cue', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '搜索课程' }).click()
  await page.getByRole('searchbox', { name: '搜索书籍、课时和字幕' }).fill('Friday')

  await expect(page.getByRole('heading', { name: '字幕' })).toBeVisible()
  await page.getByRole('button', { name: /Could we move the meeting to Friday morning/ }).click()

  await expect(page).toHaveURL(/\/learn\/1\/1\?cue=3&mode=WRITE/)
  await expect(page.locator('.write-current__translation')).toContainText(
    '我们能把会议改到周五上午吗？',
  )
})

test('bookshelf uses uploaded cover thumbnails', async ({ page }) => {
  await page.goto('/')

  const topFace = page.locator('.book3d__top').first()
  await expect(topFace).toHaveCSS('background-image', /work\.jpg/)
})
