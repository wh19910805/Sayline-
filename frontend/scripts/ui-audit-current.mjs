import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const baseUrl = 'http://127.0.0.1:5173'
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const outputDir = fileURLToPath(new URL('../audit/current/', import.meta.url))
const phone = `137${String(Date.now()).slice(-8)}`
const password = 'Sayline123'

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

try {
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await mobileContext.newPage()

  await page.goto(`${baseUrl}/login`)
  await page.locator('.login-panel').waitFor()
  await page.screenshot({ path: `${outputDir}01-login-mobile.png` })

  await page.getByRole('button', { name: /还没有账号/ }).click()
  await page.getByLabel('手机号').fill(phone)
  await page.getByLabel('昵称').fill('界面审计')
  await page.getByLabel('密码').fill(password)
  await page.getByRole('button', { name: '进入 Sayline' }).click()
  await page.getByText('选择你感兴趣的').waitFor()

  await page.locator('.interest-option').nth(0).click()
  await page.locator('.interest-option').nth(1).click()
  await page.screenshot({ path: `${outputDir}02-interests-mobile.png` })
  await page.getByRole('button', { name: '完成，开始学习' }).click()
  await page.locator('[data-test="course-card"]').first().waitFor()
  await page.screenshot({ path: `${outputDir}03-home-mobile.png` })

  await page.locator('[data-test="favorite-button"]').first().click()
  await page.getByRole('tab', { name: /我喜欢/ }).click()
  await page.locator('[data-test="course-card"]').first().waitFor()
  await page.screenshot({ path: `${outputDir}04-favorites-mobile.png` })

  await page.locator('[data-test="course-card"]').first().click()
  await page.locator('.listen-mode').waitFor()
  await page.screenshot({ path: `${outputDir}05-player-listen-mobile.png` })
  await page.locator('[aria-label="写"]').click()
  await page.screenshot({ path: `${outputDir}06-player-write-mobile.png` })
  await page.locator('[aria-label="说"]').click()
  await page.screenshot({ path: `${outputDir}07-player-speak-mobile.png` })

  await page.goto(`${baseUrl}/me`)
  await page.locator('.profile-card').waitFor()
  await page.getByText('2 个兴趣分类', { exact: false }).waitFor()
  await page.waitForFunction(
    () => document.querySelector('.profile-card h2')?.textContent?.trim() !== '学习者',
  )
  await page.screenshot({ path: `${outputDir}08-me-mobile.png` })
  await page.goto(`${baseUrl}/me/learning`)
  await page.locator('.settings-form').waitFor()
  await page.screenshot({ path: `${outputDir}09-settings-mobile.png` })
  await page.goto(`${baseUrl}/me/profile`)
  await page.getByRole('heading', { name: '个人信息' }).waitFor()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${outputDir}10-profile-settings-mobile.png` })
  await page.goto(`${baseUrl}/preferences`)
  await page.getByRole('heading', { name: '学习偏好' }).waitFor()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${outputDir}11-preferences-mobile.png` })
  await mobileContext.close()

  const tabletContext = await browser.newContext({ viewport: { width: 834, height: 1112 } })
  const tablet = await tabletContext.newPage()
  await loginUser(tablet)
  await tablet.screenshot({ path: `${outputDir}12-home-tablet.png` })
  await tabletContext.close()

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const desktop = await desktopContext.newPage()
  await loginUser(desktop)
  await desktop.screenshot({ path: `${outputDir}13-home-desktop.png` })
  await desktopContext.close()

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const admin = await adminContext.newPage()
  await admin.goto(`${baseUrl}/admin/login`)
  await admin.getByLabel('手机号').fill('13800138000')
  await admin.getByLabel('密码').fill(password)
  await admin.getByRole('button', { name: '进入管理端' }).click()
  await admin.getByText('学习正在发生。').waitFor()
  await admin.screenshot({ path: `${outputDir}14-admin-dashboard.png` })
  await admin.goto(`${baseUrl}/admin/courses`)
  await admin.getByRole('heading', { name: '课程管理' }).waitFor()
  await admin.screenshot({ path: `${outputDir}15-admin-courses.png` })
  await adminContext.close()

  console.log(JSON.stringify({ phone, outputDir }))
} finally {
  await browser.close()
}

async function loginUser(page) {
  await page.goto(`${baseUrl}/login`)
  await page.getByLabel('手机号').fill(phone)
  await page.getByLabel('密码').fill(password)
  await page.getByRole('button', { name: '进入 Sayline' }).click()
  await page.locator('[data-test="course-card"]').first().waitFor()
}
