import { expect, test } from '@playwright/test'

import { mockUserApi } from './mock-api'

test.beforeEach(async ({ page }) => {
  await mockUserApi(page, 'USER')
})

test('3D book faces stay visible under prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const activeBook = page.locator('.book-slot.is-active')
  await expect(activeBook.locator('.book3d__front')).toBeVisible()

  // 关键回归：reduced-motion 下不能把书压成 transform:none（否则封面/封底高度为 0）
  await expect(activeBook.locator('.book3d')).not.toHaveCSS('transform', 'none')

  const coverHeight = await activeBook.locator('.book3d__front').evaluate(
    (cover) => cover.getBoundingClientRect().height,
  )
  expect(coverHeight).toBeGreaterThan(0)
})

test('book shelf renders the default category book and opens its lessons', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.book3d')).toHaveCount(1)
  await expect(page.locator('.book3d__back')).toHaveCount(0)
  await expect(page.locator('.book-selection-card').getByText('职场英语')).toBeVisible()
  await expect(page.locator('.book-selection-card')).toContainText('2 课时')
  await expect(page.locator('.book-selection-card')).not.toContainText('当前书籍')
  await expect(page.locator('.book-selection-card')).not.toContainText('尚未开始')
  await expect(page.locator('.book-selection-card__progress')).toHaveCount(0)
  await expect(page.locator('.book-selection-card__cover-frame img')).toHaveAttribute('src', /work\.jpg/)
  await expect(page.locator('.book3d__front').first()).toBeVisible()
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

  await page.locator('.book-slot.is-active').click()
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

  const focusCover = page.locator('.book-slot.is-active .book3d__front')
  await expect(focusCover).toHaveCSS('background-image', /work-thumb\.jpg/)
  await expect(focusCover).not.toHaveCSS('background-image', /work-full\.jpg/)
})

test('active shelf book presents its full width 3D face at the shelf center', async ({ page }) => {
  await page.route('**/api/v1/books?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          title: '第一本',
          categoryId: 1,
          categoryName: '职场英语',
          coverUrl: '/covers/work.jpg',
          coverThumbnailUrl: '/covers/work-thumb.jpg',
          lessonCount: 2,
          progress: 20,
          favorite: false,
        },
        {
          id: 2,
          title: '第二本',
          categoryId: 1,
          categoryName: '职场英语',
          coverUrl: '/covers/spoken.jpg',
          coverThumbnailUrl: '/covers/spoken-thumb.jpg',
          lessonCount: 2,
          progress: 0,
          favorite: false,
        },
        {
          id: 3,
          title: '第三本',
          categoryId: 1,
          categoryName: '职场英语',
          coverUrl: '/covers/listening.jpg',
          coverThumbnailUrl: '/covers/listening-thumb.jpg',
          lessonCount: 2,
          progress: 0,
          favorite: false,
        },
      ]),
    }),
  )
  await page.goto('/')

  const active = page.locator('.book-slot.is-active')
  await expect(active.locator('.book3d__front')).toBeVisible()
  await expect(active.locator('.book3d__front')).toHaveCSS('background-image', /work-thumb\.jpg/)

  const neighbor = page.locator('.book-slot').nth(1)
  await expect(neighbor.locator('.book3d__front')).toHaveCSS('opacity', '0')
  await expect(neighbor.locator('.book3d__spine')).toHaveCSS('opacity', '1')

  const metrics = await page.evaluate(() => {
    const front = document.querySelector('.book-slot.is-active .book3d__front')!
    const neighborSpine = document.querySelectorAll('.book-slot')[1]!.querySelector('.book3d__spine')!
    return {
      frontWidth: Number.parseFloat(getComputedStyle(front).width),
      spineWidth: Number.parseFloat(getComputedStyle(neighborSpine).width),
    }
  })

  expect(metrics.frontWidth).toBeCloseTo(metrics.spineWidth, 0)
  await expect.poll(() => page.evaluate(() => {
    const rect = document.querySelector('.book-slot.is-active .book3d__front')!.getBoundingClientRect()
    const anchor = Math.min(720, Math.max(280, window.innerHeight * 0.48))
    return Math.abs(rect.top + rect.height / 2 - anchor)
  })).toBeLessThan(8)
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

test('centered focus book does not expand or insert blank rows into the spine list', async ({ page }) => {
  await page.setViewportSize({ width: 607, height: 1349 })
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

  const slotHeights = await page.locator('.book-slot').evaluateAll((elements) => {
    const active = elements.find((element) => element.classList.contains('is-active'))!
    const neighbor = elements.find((element) => !element.classList.contains('is-active'))!
    return {
      active: active.getBoundingClientRect().height,
      neighbor: neighbor.getBoundingClientRect().height,
    }
  })

  expect(slotHeights.active).toBeGreaterThan(slotHeights.neighbor)

  await page.mouse.move(300, 700)
  await page.mouse.wheel(0, 240)
  await expect(page.locator('.book-selection-card')).toContainText('第二本')

  const neighborMetrics = await page.evaluate(() => {
    const slots = Array.from(document.querySelectorAll<HTMLElement>('.book-slot'))
    const activeIndex = slots.findIndex((slot) => slot.classList.contains('is-active'))
    const activeCover = slots[activeIndex]!.querySelector<HTMLElement>('.book3d__front')!
      .getBoundingClientRect()
    const previousFaces = Array.from(
      slots[activeIndex - 1]!.querySelectorAll<HTMLElement>('.book3d__top, .book3d__bottom'),
      (face) => face.getBoundingClientRect(),
    )
    const nextTitle = slots[activeIndex + 1]!.querySelector<HTMLElement>('.book3d__spine')!
      .getBoundingClientRect()
    return {
      previousCoverHeight: Math.max(...previousFaces.map((face) => face.height)),
      nextTitleHeight: nextTitle.height,
      topGap: activeCover.top - Math.max(...previousFaces.map((face) => face.bottom)),
      bottomGap: nextTitle.top - activeCover.bottom,
    }
  })
  expect(neighborMetrics.previousCoverHeight).toBeGreaterThan(100)
  expect(neighborMetrics.nextTitleHeight).toBeGreaterThan(20)
  expect(Math.abs(neighborMetrics.topGap - neighborMetrics.bottomGap)).toBeLessThan(12)

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
