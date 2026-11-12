import { expect, test } from '@playwright/test'

import { mockUserApi } from './mock-api'

const ambient = {
  primary: '#7b637d',
  secondary: '#383b52',
  cover: null,
}

test.use({ viewport: { width: 390, height: 844 } })

async function surfaceColors(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const screen = document.querySelector<HTMLElement>('.app-screen')
    return {
      themeColor: meta?.content ?? '',
      html: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      standalone: getComputedStyle(document.querySelector('.standalone-app')!).backgroundColor,
      screen: screen ? getComputedStyle(screen).backgroundColor : '',
      playerSurface: screen ? getComputedStyle(screen).getPropertyValue('--player-surface').trim() : '',
    }
  })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((value) => {
    localStorage.setItem('sayline:ambient', JSON.stringify(value))
  }, ambient)
  await mockUserApi(page, 'USER')
})

test('home surface matches the system theme color', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.home-screen')).toBeVisible()
  await page.waitForTimeout(600)

  const colors = await surfaceColors(page)
  expect(colors.themeColor).toBe('#d7d0d8')
  expect(colors.html).toBe('rgb(215, 208, 216)')
  expect(colors.body).toBe('rgb(215, 208, 216)')
  expect(colors.standalone).toBe('rgb(215, 208, 216)')
  expect(colors.screen).toBe('rgb(215, 208, 216)')
})

test('lesson surface keeps the system theme color in sync', async ({ page }) => {
  await page.goto('/learn/1')
  await expect(page.locator('.lesson-screen .book-head')).toBeVisible()
  await page.waitForTimeout(600)

  const colors = await surfaceColors(page)
  expect(colors.themeColor).toBe(colors.themeColor.toLowerCase())
  expect(colors.html).toBe(colors.screen)
  expect(colors.body).toBe(colors.screen)
  expect(colors.standalone).toBe(colors.screen)
})

test('shared learner surfaces use the same ambient color', async ({ page }) => {
  const routes = [
    ['/recent', '.recent-screen'],
    ['/me', '.me-screen'],
    ['/me/learning', '.settings-screen'],
    ['/preferences', '.preferences-screen'],
  ] as const

  for (const [path, selector] of routes) {
    await page.goto(path)
    await expect(page.locator(selector)).toBeVisible()
    await page.waitForTimeout(600)
    const colors = await surfaceColors(page)
    expect(colors.html, path).toBe(colors.screen)
    expect(colors.body, path).toBe(colors.screen)
    expect(colors.standalone, path).toBe(colors.screen)
  }
})

test('player surface uses the same dark color as its system theme', async ({ page }) => {
  await page.goto('/learn/1/1')
  await expect(page.locator('.player-screen .player-header')).toBeVisible()
  await page.waitForTimeout(600)

  const colors = await surfaceColors(page)
  const topSurface = page.locator('.player-top-surface')
  await expect(topSurface).toHaveCount(1)
  const topSurfaceColor = await topSurface.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  )

  expect(colors.playerSurface).toBe(colors.themeColor)
  expect(colors.html).toBe(colors.screen)
  expect(colors.body).toBe(colors.screen)
  expect(colors.standalone).toBe(colors.screen)
  expect(topSurfaceColor).toBe(colors.screen)
})
