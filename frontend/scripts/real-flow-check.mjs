import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = 'http://127.0.0.1:5173'
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const phone = `139${String(Date.now()).slice(-8)}`
const password = 'Sayline123'

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
try {
  const learnerContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const learner = await learnerContext.newPage()
  learner.on('console', (message) => console.log(`[browser:${message.type()}] ${message.text()}`))
  learner.on('requestfailed', (request) =>
    console.log(`[request-failed] ${request.method()} ${request.url()} ${request.failure()?.errorText}`),
  )
  learner.on('response', (response) => {
    if (response.url().includes('/api/v1/auth/')) {
      console.log(`[auth-response] ${response.status()} ${response.url()}`)
    }
  })
  await learner.goto(`${baseUrl}/login`)
  await learner.getByRole('button', { name: /还没有账号/ }).click()
  await learner.getByLabel('手机号').fill(phone)
  await learner.getByLabel('昵称').fill('运行验证用户')
  await learner.getByLabel('密码').fill(password)
  await learner.getByRole('button', { name: '进入 Sayline' }).click()

  try {
    await learner.getByText('选择你感兴趣的').waitFor()
  } catch (error) {
    console.error('Learner URL:', learner.url())
    console.error('Learner body:', (await learner.locator('body').innerText()).slice(0, 1200))
    await learner.screenshot({ path: 'test-results/real-flow-learner-failure.png' })
    throw error
  }
  await learner.locator('.interest-option').first().click()
  await learner.getByRole('button', { name: '完成，开始学习' }).click()
  await learner.locator('[data-test="course-card"]').first().waitFor()
  assert.ok((await learner.locator('[data-test="course-card"]').count()) > 0)

  await learner.locator('[data-test="favorite-button"]').first().click()
  await learner.locator('[data-test="course-card"]').first().click()
  await learner.locator('.player-screen').waitFor()
  await learner.locator('.listen-mode').waitFor()
  const firstCueVisible = await learner
    .getByText("Nice to meet you. I'm Alex from the design team.")
    .isVisible()
    .catch(() => false)
  if (!firstCueVisible) {
    console.error('Player body:', (await learner.locator('.player-screen').innerText()).slice(0, 1600))
    await learner.screenshot({ path: 'test-results/real-flow-player-failure.png' })
  }
  assert.ok(firstCueVisible)
  await learnerContext.close()

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const admin = await adminContext.newPage()
  await admin.goto(`${baseUrl}/admin/login`)
  await admin.getByLabel('手机号').fill('13800138000')
  await admin.getByLabel('密码').fill(password)
  await admin.getByRole('button', { name: '进入管理端' }).click()
  await admin.getByText('学习正在发生。').waitFor()
  await adminContext.close()

  const anonymousContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const anonymous = await anonymousContext.newPage()
  await anonymous.goto(`${baseUrl}/admin/login`)
  await anonymous.getByRole('link', { name: /前往用户学习端/ }).click()
  await anonymous.waitForURL('**/login')
  await anonymousContext.close()

  console.log(JSON.stringify({ learnerPhone: phone, learnerFlow: 'ok', adminFlow: 'ok', learnerEntry: 'ok' }))
} finally {
  await browser.close()
}
