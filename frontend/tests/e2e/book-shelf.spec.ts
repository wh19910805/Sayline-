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
  await expect(page.locator('.book-selection-card').getByText('职场英语')).toBeVisible()
  await expect(page.locator('.book-selection-card')).toContainText('2 课时')
  await expect(page.locator('.book-selection-card')).not.toContainText('当前书籍')
  await expect(page.locator('.book-selection-card')).not.toContainText('尚未开始')
  await expect(page.locator('.book-selection-card__progress')).toHaveCount(0)
  await expect(page.locator('.book-selection-card__cover-frame img')).toHaveAttribute('src', /work\.jpg/)
  const firstBook = await page.locator('.book3d').first().boundingBox()
  expect(firstBook?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(220)
  const coverBox = await page.locator('.book-selection-card__cover-frame').boundingBox()
  expect((coverBox?.width ?? 0) / (coverBox?.height ?? 1)).toBeCloseTo(1.4, 1)
  await expect(page.locator('.book-selection-card')).toHaveCSS(
    'backdrop-filter',
    /blur\(22px\)/,
  )
  expect(
    await page.locator('.book-selection-card').evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toMatch(/0\.8|80%/)
  expect(await page.locator('.book-selection-card').evaluate((element) => {
    const radius = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius)
    return radius >= element.getBoundingClientRect().height / 2 - 1
  })).toBe(true)
  expect(await page.locator('.book-selection-card__cover-frame').evaluate((element) => {
    const radius = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius)
    return radius >= element.getBoundingClientRect().height / 2 - 1
  })).toBe(true)

  await page.locator('.book3d').first().click()
  await expect(page).toHaveURL(/\/learn\/\d+/)
})

test('current book card disables learning when no lessons are published', async ({ page }) => {
  await page.route('**/api/v1/books?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: 1,
        title: '慢速听力·跟读训练',
        categoryId: 1,
        categoryName: '职场英语',
        coverUrl: '/covers/work.jpg',
        lessonCount: 0,
        progress: 0,
        favorite: false,
      }]),
    }),
  )
  await page.goto('/')

  const card = page.locator('.book-selection-card')
  await expect(card).toContainText('0 课时')
  await expect(card).not.toContainText('尚未开始')
  await expect(card.getByRole('button', { name: /内容准备中/ })).toBeDisabled()
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
  await page.route('**/api/v1/books?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: 1,
        title: '职场英语',
        categoryId: 1,
        categoryName: '职场英语',
        coverUrl: '/covers/work-full.jpg',
        coverThumbnailUrl: '/covers/work-thumb.jpg',
        lessonCount: 2,
        progress: 20,
        favorite: false,
      }]),
    }),
  )
  await page.goto('/')

  const topFace = page.locator('.book3d__top').first()
  await expect(topFace).toHaveCSS('background-image', /work-thumb\.jpg/)
  await expect(topFace).not.toHaveCSS('background-image', /work-full\.jpg/)
})

test('current book card falls back to the original cover', async ({ page }) => {
  await page.route('**/covers/missing-thumb.jpg', (route) => route.fulfill({ status: 404 }))
  await page.route('**/api/v1/books?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: 1,
        title: '职场英语',
        categoryId: 1,
        categoryName: '职场英语',
        coverUrl: '/covers/work.jpg',
        coverThumbnailUrl: '/covers/missing-thumb.jpg',
        lessonCount: 2,
        progress: 20,
        favorite: false,
      }]),
    }),
  )
  await page.goto('/')

  await expect(page.locator('.book-selection-card__cover-frame img')).toHaveAttribute(
    'src',
    /work\.jpg/,
  )
})

test('adjacent books keep a compact gap', async ({ page }) => {
  await page.route('**/api/v1/books?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, title: '第一本', categoryId: 1, categoryName: '职场英语', lessonCount: 3, progress: 20, favorite: false },
        { id: 2, title: '第二本', categoryId: 1, categoryName: '职场英语', lessonCount: 4, progress: 0, favorite: false },
        { id: 3, title: '第三本', categoryId: 1, categoryName: '职场英语', lessonCount: 5, progress: 0, favorite: false },
      ]),
    }),
  )
  await page.goto('/')
  await expect(page.locator('.book-slot')).toHaveCount(3)

  const metrics = await page.locator('.book-slot').evaluateAll((slots) => {
    const rects = slots.map((slot) => slot.getBoundingClientRect())
    return rects.slice(1).map((rect, index) => rect.top - rects[index].bottom)
  })

  expect(metrics.every((gap) => gap <= 10)).toBe(true)

  const card = page.locator('.book-selection-card')
  await expect(card.locator('.book-selection-card__cover-fallback')).toBeVisible()
  const scroller = page.locator('.home-scroll')
  expect(await scroller.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
  await scroller.evaluate((element) => {
    element.scrollTop = 0
    element.dispatchEvent(new Event('scroll'))
  })
  await expect(card).toContainText('第一本')

  await scroller.evaluate((element) => {
    element.scrollTop = element.scrollHeight
    element.dispatchEvent(new Event('scroll'))
  })
  await expect(card).toContainText('第三本')

  const cardBox = await card.boundingBox()
  const navBox = await page.locator('.app-bottom-nav').boundingBox()
  expect((cardBox?.y ?? 0) + (cardBox?.height ?? 0)).toBeLessThanOrEqual(navBox?.y ?? 0)
})
