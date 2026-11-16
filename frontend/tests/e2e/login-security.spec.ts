import { expect, test } from '@playwright/test'

test('login form does not prefill real credentials', async ({ page }) => {
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'UNAUTHORIZED', status: 401, detail: '请先登录' }),
    }),
  )
  await page.goto('/login')
  await expect(page.getByLabel('手机号')).toHaveValue('')
  await expect(page.locator('input[autocomplete="current-password"]')).toHaveValue('')

  for (const selector of ['.password-field__toggle', '.login-register']) {
    const box = await page.locator(selector).boundingBox()
    expect(box?.width ?? 0, selector).toBeGreaterThanOrEqual(43.5)
    expect(box?.height ?? 0, selector).toBeGreaterThanOrEqual(43.5)
  }
})

test('login exposes public legal documents', async ({ page }) => {
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'UNAUTHORIZED', status: 401, detail: '请先登录' }),
    }),
  )

  await page.goto('/login')
  await expect(page.getByRole('link', { name: '用户协议' })).toHaveAttribute('href', '/terms')
  await expect(page.getByRole('link', { name: '隐私政策' })).toHaveAttribute('href', '/privacy')

  await page.goto('/terms')
  await expect(page.getByRole('heading', { name: '用户协议' })).toBeVisible()
  await expect(page.getByText('正式文本待法务审核')).toBeVisible()

  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: '隐私政策' })).toBeVisible()
  await expect(page.getByText('正式文本待法务审核')).toBeVisible()
})
