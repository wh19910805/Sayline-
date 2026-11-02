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
  await expect(favorite).toHaveCSS('color', 'rgb(255, 217, 223)')

  await page.locator('[data-test="course-card"]').first().click()
  await expect(page.locator('.player-screen')).toBeVisible()
  await expect(page.getByText("Nice to meet you. I'm Alex from the design team.")).toBeVisible()
})

test('learner writes a sentence and controls auto-hide', async ({ page }) => {
  await page.goto('/learn/1')
  await expect(page.locator('.player-screen')).toBeVisible()

  await page.locator('[aria-label="写"]').click()
  await expect(page.locator('.write-mode .mode-copy')).toBeVisible()
  await expect(page.locator('.write-current')).toBeVisible()
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

test('player controls follow the approved proportions', async ({ page }) => {
  await page.goto('/learn/1')
  await page.locator('.player-screen').waitFor()
  await page.locator('[aria-label="听"]').click()
  await page.locator('.listen-mode').waitFor()

  const deckWidth = (await page.locator('.audio-deck').boundingBox())?.width ?? 0
  const rangeWidth = (await page.locator('.audio-deck__range').boundingBox())?.width ?? 0
  expect(rangeWidth / deckWidth).toBeGreaterThan(0.95)

  const playStyle = await page.locator('.audio-play').evaluate((element) => {
    const style = getComputedStyle(element)
    return { borderRadius: style.borderRadius, background: style.backgroundColor, width: element.clientWidth }
  })
  expect(parseFloat(playStyle.borderRadius)).toBeGreaterThanOrEqual(27)
  expect(playStyle.background).not.toBe('rgba(0, 0, 0, 0)')
  expect(playStyle.width).toBeGreaterThanOrEqual(54)

  const speedButton = page.getByRole('button', { name: /播放速度/ })
  await expect(speedButton).toBeVisible()
  await speedButton.click()
  await page.getByRole('menuitem', { name: '1.25×' }).click()
  await expect(speedButton).toContainText('1.25×')
  await expect(page.locator('audio')).toHaveJSProperty('playbackRate', 1.25)
})

test('read transcript fades into the player controls', async ({ page }) => {
  await page.goto('/learn/1')
  await page.locator('[aria-label="读"]').click()
  await expect(page.locator('.read-mode')).toBeVisible()

  const mask = await page.locator('.transcript-list').evaluate(
    (element) => getComputedStyle(element).maskImage,
  )
  expect(mask).toContain('linear-gradient')
  await expect(page.locator('.player-bottom-ui')).toBeVisible()
})

test('the end of the course list stays silent', async ({ page }) => {
  await page.goto('/learn/1')
  await page.locator('.listen-mode').waitFor()
  await page.evaluate(() => {
    const target = document.querySelector('.player-stage')
    if (!target) return
    const start = new Touch({
      identifier: 1,
      target,
      clientX: 200,
      clientY: 700,
      pageX: 200,
      pageY: 700,
      screenX: 200,
      screenY: 700,
    })
    const end = new Touch({
      identifier: 1,
      target,
      clientX: 200,
      clientY: 450,
      pageX: 200,
      pageY: 450,
      screenX: 200,
      screenY: 450,
    })
    target.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [start], changedTouches: [start] }))
    target.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [end] }))
  })

  await expect(page.getByText('本列表已学完', { exact: true })).toHaveCount(0)
  await expect(page.locator('.player-notice')).toHaveCount(0)
})

test('completed mode advances after a three second prompt', async ({ page }) => {
  await mockUserApi(page, 'USER', { listenProgress: 100 })
  await page.goto('/learn/1')

  const prompt = page.locator('.mode-transition-prompt')
  await expect(prompt).toContainText('3 秒后进入读模式')
  await expect(prompt).toContainText('2 秒后进入读模式', { timeout: 2_500 })
  await expect(page.getByRole('tab', { name: '读' })).toHaveAttribute(
    'aria-selected',
    'true',
    { timeout: 5_000 },
  )
})

test('completion prompt follows the player layout', async ({ page }) => {
  await mockUserApi(page, 'USER', { listenProgress: 100 })
  await page.goto('/learn/1')
  const prompt = page.locator('.mode-transition-prompt')
  await expect(prompt).toBeVisible()

  const controls = await page.locator('.audio-deck__controls').boundingBox()
  const action = await prompt.boundingBox()
  const modeDock = await page.locator('.player-mode-dock').boundingBox()
  expect(action?.y ?? 0).toBeGreaterThan(controls?.y ?? 0)
  expect(action?.y ?? 0).toBeLessThan(modeDock?.y ?? 0)
})

test('learner report has no horizontal overflow on mobile', async ({ page }) => {
  await page.goto('/me')
  await expect(page.locator('.profile-card')).toBeVisible()
  await expect(page.getByText('本周学习节奏')).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('learner month view shows calendar heat levels, today and legend', async ({ page }) => {
  await page.goto('/me')
  await page.getByRole('button', { name: '本月' }).click()
  await page.waitForTimeout(1_700)

  await expect(page.getByRole('heading', { name: '十月学习记录' })).toBeVisible()
  await expect(page.locator('.month-day.level-1')).toHaveCount(4)
  await expect(page.locator('.month-day.level-2')).toHaveCount(6)
  await expect(page.locator('.month-day.level-3')).toHaveCount(2)
  await expect(page.locator('.month-day.is-today')).toHaveCount(1)
  await expect(page.locator('.report-card__legend i')).toHaveCount(4)
})
