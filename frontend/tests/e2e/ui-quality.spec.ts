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
    '.player-more',
    '.speed-select',
    '.transport-round',
    '.transport-skip',
    '.player-mode-dock .sl-mode',
  ])
  await page.locator('[aria-label="写"]').click()
  await expect(page.locator('.write-current')).toBeVisible()
  await expectTouchTargets(page, ['.write-current__actions button', '.skip-link'])
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
