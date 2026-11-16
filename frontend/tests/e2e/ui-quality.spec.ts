import { expect, test } from '@playwright/test'

import { mockUserApi } from './mock-api'

test.use({ viewport: { width: 390, height: 844 } })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'sayline:ambient',
      JSON.stringify({ primary: '#7b637d', secondary: '#383b52', cover: null }),
    )
  })
  await mockUserApi(page, 'USER')
})

async function expectTouchTargets(
  page: import('@playwright/test').Page,
  selectors: string[],
) {
  for (const selector of selectors) {
    const targets = page.locator(selector)
    const count = await targets.count()
    expect(count, selector).toBeGreaterThan(0)
    for (let index = 0; index < count; index += 1) {
      const box = await targets.nth(index).boundingBox()
      expect(box?.width ?? 0, `${selector} width`).toBeGreaterThanOrEqual(43.5)
      expect(box?.height ?? 0, `${selector} height`).toBeGreaterThanOrEqual(43.5)
    }
  }
}

test('primary learner controls meet the mobile touch target baseline', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.home-screen')).toBeVisible()
  await expectTouchTargets(page, ['.home-search-toggle', '.sl-tab'])

  await page.goto('/learn/1')
  await expect(page.locator('.book-head')).toBeVisible()
  await expectTouchTargets(page, ['.book-head__favorite'])

  await page.goto('/learn/1/1')
  await expect(page.locator('.player-header')).toBeVisible()
  await expectTouchTargets(page, [
    '.player-header__actions button',
    '.player-mode-switch__item',
    '.speed-select',
    '.transport-round',
    '.transport-skip',
  ])
  await page.locator('[aria-label="写"]').click()
  await expect(page.locator('.write-current')).toBeVisible()
  await expectTouchTargets(page, ['.write-current__actions button', '.write-skip-button'])
  await page.locator('[aria-label="读"]').click()
  await expectTouchTargets(page, ['.translation-toggle'])
  await page.locator('[aria-label="说"]').click()
  await page.getByRole('button', { name: '开始录音' }).waitFor()
  await expectTouchTargets(page, ['.record-button'])

  await page.goto('/me')
  await expect(page.locator('.profile-card')).toBeVisible()
  await expectTouchTargets(page, ['.sl-tabs--pill .sl-tab'])

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
})

test('admin mobile actions meet the touch target baseline', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  await page.goto('/admin/categories')

  await expect(page.locator('.admin-mobile-nav')).toBeVisible()
  await page.locator('.admin-table').waitFor()
  await expectTouchTargets(page, ['.admin-mobile-nav a', '.admin-table .sl-icon-button'])
})

test('player supporting text meets readability baselines', async ({ page }) => {
  await page.goto('/learn/1/1')
  await expect(page.locator('.audio-deck__times')).toBeVisible()

  const styles = await page.evaluate(() => {
    const read = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector)!
      const style = getComputedStyle(element)
      return {
        fontSize: Number.parseFloat(style.fontSize),
        color: style.color,
      }
    }
    return {
      time: read('.audio-deck__times'),
      header: read('.player-header__title span'),
      status: read('.player-header__title strong'),
      speed: read('.speed-select'),
      mode: read('.player-mode-switch__item:not(.is-active)'),
    }
  })

  expect(styles.time.fontSize).toBeGreaterThanOrEqual(12)
  expect(styles.header.fontSize).toBeGreaterThanOrEqual(12)
  expect(styles.status.fontSize).toBeGreaterThanOrEqual(12)
  expect(styles.speed.fontSize).toBeGreaterThanOrEqual(12)
  expect(styles.mode.fontSize).toBeGreaterThanOrEqual(12)
  expect(styles.time.color).not.toContain('0.38')
})

test('learner auxiliary links and settings controls meet mobile baselines', async ({ browser }) => {
  const publicContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const publicPage = await publicContext.newPage()
  await publicPage.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'UNAUTHORIZED', status: 401, detail: '请先登录' }),
    }),
  )
  await publicPage.goto('/login')
  await expect(publicPage.locator('.login-panel')).toBeVisible()
  const helperSizes = await publicPage.evaluate(() =>
    ['.login-register', '.login-forgot', '.login-footnote']
      .map((selector) => Number.parseFloat(getComputedStyle(document.querySelector(selector)!).fontSize)),
  )
  expect(Math.min(...helperSizes)).toBeGreaterThanOrEqual(12)
  await publicContext.close()

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await mockUserApi(page, 'USER')
  await page.goto('/me/learning')
  await expect(page.locator('.settings-section-nav')).toBeVisible()
  await expectTouchTargets(page, ['.settings-section-nav button'])

  await page.goto('/learn/1/1')
  await expect(page.locator('.audio-deck__range')).toBeVisible()
  await expectTouchTargets(page, ['.audio-deck__range'])
  await context.close()
})

test('admin mobile controls keep full hit areas and expose every navigation item', async ({ page }) => {
  await mockUserApi(page, 'ADMIN')
  await page.goto('/admin/courses')
  await expect(page.locator('.admin-mobile-nav')).toBeVisible()

  await expectTouchTargets(page, ['.admin-table .admin-check:visible', '.admin-mobile-nav a'])
  const navFits = await page.locator('.admin-mobile-nav').evaluate(
    (element) => element.scrollWidth <= element.clientWidth + 1,
  )
  expect(navFits).toBe(true)
})
