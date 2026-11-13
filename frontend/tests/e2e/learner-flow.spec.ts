import { expect, test } from '@playwright/test'

import { mockUserApi } from './mock-api'

test.beforeEach(async ({ page }) => {
  await mockUserApi(page, 'USER')
})

test('learner browses books, favorites one and opens a lesson', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('[data-test="category-tab"]')).toHaveCount(3)
  await expect(page.locator('.book3d')).toHaveCount(1)
  await expect(page.locator('.book-selection-card')).toContainText('职场英语')

  await page.locator('.book3d').first().click()
  await expect(page).toHaveURL(/\/learn\/\d+$/)
  await expect(page.locator('.lesson-row')).toHaveCount(2)

  const favorite = page.locator('.book-head__favorite')
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')

  await page.locator('.lesson-row').first().click()
  await expect(page.locator('.player-screen')).toBeVisible()
  await expect(page.getByText("Nice to meet you. I'm Alex from the design team.")).toBeVisible()
})

test('home category underline is centered under its label', async ({ page }) => {
  await page.goto('/')
  const tab = page.locator('[data-test="category-tab"]').first()
  const indicator = await tab.evaluate((element) => {
    const style = getComputedStyle(element, '::after')
    const range = document.createRange()
    range.selectNodeContents(element)
    const tabBox = element.getBoundingClientRect()
    const textBox = range.getBoundingClientRect()
    return {
      left: parseFloat(style.left),
      width: parseFloat(style.width),
      transform: style.transform,
      tabLeft: tabBox.left,
      textCenter: textBox.left + textBox.width / 2,
    }
  })

  const translateX = Number(indicator.transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+)/)?.[1] ?? 0)
  const indicatorCenter = indicator.tabLeft + indicator.left + indicator.width / 2 + translateX
  expect(indicator.width).toBe(24)
  expect(Math.abs(indicatorCenter - indicator.textCenter)).toBeLessThan(1)
})

test('display and interface typography use one sans-serif family', async ({ page }) => {
  await page.goto('/')
  const fonts = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement)
    return {
      display: style.getPropertyValue('--font-display'),
      ui: style.getPropertyValue('--font-ui'),
    }
  })

  expect(fonts.display).toContain('Manrope')
  expect(fonts.display).not.toContain('Instrument')
  expect(fonts.ui).toContain('Manrope')
})

test('book shelf supports Space keyboard activation', async ({ page }) => {
  await page.goto('/')
  const book = page.locator('.book-slot').first()
  await book.focus()
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(/\/learn\/\d+$/)
})

test('learner writes a sentence and controls auto-hide', async ({ page }) => {
  await page.goto('/learn/1/1')
  await expect(page.locator('.player-screen')).toBeVisible()

  await page.locator('[aria-label="写"]').click()
  await expect(page.locator('.write-mode')).toBeVisible()
  await expect(page.locator('.write-mode .mode-copy')).toHaveCount(0)
  await expect(page.locator('.write-current')).toBeVisible()
  await expect(page.locator('.sl-word-input input')).toHaveCount(10)

  const words = ['Nice', 'to', 'meet', 'you', "I'm", 'Alex', 'from', 'the', 'design', 'team']
  await page.locator('.sl-word-input input').first().fill(words[0])
  await expect(page.locator('.sl-word-input__mirror .is-correct')).not.toHaveCount(0)
  for (let i = 1; i < words.length; i++) {
    await page.locator('.sl-word-input input').nth(i).fill(words[i])
  }
  await expect(page.locator('.write-current__label')).toContainText('02')

  await page.locator('[aria-label="听"]').click()
  await page.waitForTimeout(6_300)
  await expect(page.locator('.player-bottom-ui')).toHaveClass(/is-hidden/)
  await page.locator('.player-stage').click({ position: { x: 360, y: 400 } })
  await expect(page.locator('.player-bottom-ui')).not.toHaveClass(/is-hidden/)
})

test('write mode exposes clear input, submit, error and retry states', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.locator('[aria-label="写"]').click()
  const firstWord = page.locator('.sl-word-input__word').first()
  const submit = page.getByRole('button', { name: '提交本句' })

  await expect(firstWord).toHaveClass(/is-empty/)
  await expect(submit).toBeDisabled()

  await page.locator('.sl-word-input input').first().fill('Ni')
  await expect(firstWord).toHaveClass(/is-filling/)
  await expect(submit).toBeEnabled()

  await submit.click()
  await expect(page.locator('.dictation-feedback')).toHaveClass(/is-wrong/)
  await expect(page.getByRole('button', { name: '重新填写' })).toBeVisible()
  const retry = await page.getByRole('button', { name: '重新填写' }).boundingBox()
  const skip = await page.getByRole('button', { name: '跳过本句' }).boundingBox()
  expect(Math.abs((retry?.y ?? 0) - (skip?.y ?? 0))).toBeLessThan(8)

  await page.getByRole('button', { name: '重新填写' }).click()
  await expect(page.locator('.sl-word-input input').first()).toBeEnabled()
  await expect(page.locator('.sl-word-input input').first()).toHaveValue('')
})

test('player controls follow the approved proportions', async ({ page }) => {
  await page.goto('/learn/1/1')
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
  await expect(page.getByRole('menu')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toBeHidden()
  await speedButton.click()
  await page.getByRole('menuitem', { name: '1.25×' }).click()
  await expect(speedButton).toContainText('1.25×')
  await expect(page.locator('audio')).toHaveJSProperty('playbackRate', 1.25)
})

test('player uses a bottom mode switch and a unified speak workbench', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.locator('.player-screen').waitFor()

  const railItems = page.locator('.player-mode-switch__item')
  await expect(railItems).toHaveCount(4)
  const first = await railItems.first().boundingBox()
  const second = await railItems.nth(1).boundingBox()
  expect(first?.width ?? 0).toBeGreaterThanOrEqual(43.5)
  expect(second?.x ?? 0).toBeGreaterThan(first?.x ?? 0)

  await page.locator('[aria-label="说"]').click()
  const workbench = page.locator('.speak-workbench')
  await expect(workbench).toBeVisible()
  await expect(workbench.getByRole('button', { name: '听原句' })).toBeVisible()
  await expect(workbench.getByRole('button', { name: '开始录音' })).toBeVisible()
  await expect(workbench.getByRole('button', { name: '听自己' })).toBeDisabled()
  await expect(workbench.getByRole('button', { name: '下一句' })).toBeVisible()
  await expect(page.getByText('本句待跟读')).toBeVisible()
})

test('player identity groups actions and avoids repeated course metadata', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/learn/1/1')

  await expect(page.locator('.player-header__actions')).toBeVisible()
  await expect(page.locator('.player-identity').getByText('认识新同事')).toHaveCount(0)
  await expect(page.locator('.player-identity h1')).toContainText('已完成')
})

test('playback modes expose distinct icons and visible labels', async ({ page }) => {
  await page.goto('/learn/1/1')
  const mode = page.locator('.playback-mode-button')

  await expect(mode).toHaveAttribute('data-mode', 'study')
  await expect(mode).toContainText('学习')
  const studyIcon = await mode.locator('svg').innerHTML()

  await mode.click()
  await expect(mode).toHaveAttribute('data-mode', 'sequential')
  await expect(mode).toContainText('连播')
  expect(await mode.locator('svg').innerHTML()).not.toBe(studyIcon)

  await mode.click()
  await expect(mode).toHaveAttribute('data-mode', 'loop')
  await expect(mode).toContainText('循环')
})

test('continuous and loop modes listen and advance lessons', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.getByRole('button', { name: '播放模式：学习' }).click()
  await expect(page.getByRole('button', { name: '播放模式：连播' })).toBeVisible()

  await page.locator('[aria-label="读"]').click()
  await expect(page.locator('.read-mode .playback-mode-button')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '隐藏中文翻译' })).toBeVisible()

  await page.locator('[aria-label="听"]').click()
  await expect(page.getByRole('tab', { name: '听' })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: '播放模式：学习' }).click()
  await expect(page.getByRole('button', { name: '播放模式：连播' })).toBeVisible()

  await page.locator('audio').dispatchEvent('ended')
  await expect(page).toHaveURL(/\/learn\/1\/2$/)

  await page.goto('/learn/1/2')
  await page.getByRole('button', { name: '播放模式：学习' }).click()
  await page.getByRole('button', { name: '播放模式：连播' }).click()
  await expect(page.getByRole('button', { name: '播放模式：循环' })).toBeVisible()
  await page.locator('audio').dispatchEvent('ended')
  await expect(page).toHaveURL(/\/learn\/1\/1$/)
})

test('leaving the player keeps playback state on the lesson page', async ({ page }) => {
  const invalidLearningRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/learning/courses/NaN')) {
      invalidLearningRequests.push(request.url())
    }
  })
  await page.goto('/')
  await page.locator('.book3d').first().click()
  await page.locator('.lesson-row').first().click()
  await page.locator('audio').evaluate((element) => {
    ;(window as Window & { __testAudio?: HTMLAudioElement }).__testAudio = element as HTMLAudioElement
  })
  await page.locator('.audio-play').click()
  await expect
    .poll(() => page.evaluate(
      () => (window as Window & { __testAudio?: HTMLAudioElement }).__testAudio?.paused,
    ))
    .toBe(false)
  await page.getByRole('button', { name: '返回' }).click()

  await expect(page).toHaveURL(/\/learn\/1$/)
  await expect(page.locator('.continue-lesson')).toContainText('正在播放')
  expect(await page.evaluate(
    () => (window as Window & { __testAudio?: HTMLAudioElement }).__testAudio?.paused,
  )).toBe(false)
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('.continue-dock__cover')).toHaveAttribute(
    'aria-label',
    /打开当前课时/,
  )
  await expect(page.locator('.continue-dock__art img')).toHaveAttribute('src', /work\.jpg/)
  await expect(page.locator('.continue-dock__progress')).toHaveCount(0)
  await expect(page.locator('.continue-dock__toggle-icon')).toHaveCSS(
    'background-image',
    /conic-gradient/,
  )
  await expect(page.locator('.continue-dock__label')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '最近播放列表' }).locator('svg')).toBeVisible()
  expect(await page.locator('.continue-group').evaluate((element) => {
    const radius = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius)
    return radius >= element.getBoundingClientRect().height / 2 - 1
  })).toBe(true)
  const toggle = page.locator('.continue-dock__toggle')
  await expect(toggle).toHaveAttribute('aria-label', /暂停/)
  await toggle.click()
  await expect(page).toHaveURL(/\/$/)
  await expect(toggle).toHaveAttribute('aria-label', /继续播放/)
  expect(await page.evaluate(
    () => (window as Window & { __testAudio?: HTMLAudioElement }).__testAudio?.paused,
  )).toBe(true)
  expect(invalidLearningRequests).toEqual([])
})

test('selected playlist icon uses the same circular size as playback control', async ({ page }) => {
  await page.goto('/recent')

  const list = page.locator('.continue-dock__list')
  const listIcon = list.locator('.continue-dock__list-icon')
  const toggleIcon = page.locator('.continue-dock__toggle-icon')
  const cover = page.locator('.continue-dock__art')
  const group = page.locator('.continue-group')
  const groupBox = await group.boundingBox()
  const listBox = await listIcon.boundingBox()
  const toggleBox = await toggleIcon.boundingBox()
  const coverBox = await cover.boundingBox()

  await expect(list).toHaveClass(/is-active/)
  expect(Math.round(listBox?.width ?? 0)).toBe(Math.round(toggleBox?.width ?? 0))
  expect(Math.round(listBox?.height ?? 0)).toBe(Math.round(toggleBox?.height ?? 0))
  expect(Math.round(coverBox?.width ?? 0)).toBe(Math.round(toggleBox?.width ?? 0))
  expect(Math.round(coverBox?.height ?? 0)).toBe(Math.round(toggleBox?.height ?? 0))
  await expect(cover).toHaveCSS('border-radius', '50%')
  await expect(cover).toHaveCSS('border-top-width', '0px')
  await expect(listIcon).toHaveCSS('border-radius', '50%')
  await expect(listIcon).not.toHaveCSS('background-color', 'rgb(26, 26, 24)')
  expect(Math.abs(
    ((coverBox?.x ?? 0) - (groupBox?.x ?? 0))
    - (((groupBox?.x ?? 0) + (groupBox?.width ?? 0)) - ((listBox?.x ?? 0) + (listBox?.width ?? 0))),
  )).toBeLessThanOrEqual(1)
})

test('mini player falls back to the book cover when course artwork is missing', async ({ page }) => {
  await page.route('**/api/v1/courses/1', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        bookId: 1,
        title: 'Meeting a New Colleague',
        description: '认识新同事',
        categoryId: 1,
        categoryName: '职场英语',
        coverUrl: null,
        audioUrl: '/audio/demo.wav',
        themeColorPrimary: '#65734f',
        themeColorSecondary: '#9f5e31',
        durationMs: 20_000,
        favorite: false,
        cues: [{
          id: 1,
          sequenceNo: 1,
          startMs: 0,
          endMs: 3_000,
          englishText: "Nice to meet you. I'm Alex from the design team.",
          chineseText: '很高兴认识你，我是设计团队的 Alex。',
        }],
      }),
    }),
  )
  await page.goto('/')
  await page.locator('.book3d').first().click()
  await page.locator('.lesson-row').first().click()
  await page.getByRole('button', { name: '返回' }).click()
  await page.goBack()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('.book-shelf')).toBeVisible()
  await expect(page.locator('.continue-dock__art img')).toHaveAttribute('src', /work\.jpg/)
})

test('read transcript fades into the player controls', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.locator('[aria-label="读"]').click()
  await expect(page.locator('.read-mode')).toBeVisible()
  await expect(page.locator('.read-mode .playback-mode-button')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /中文翻译/ })).toBeVisible()
  await expect(page.getByText('逐句原文')).toHaveCount(0)
  await expect(page.locator('.read-mode__head')).toHaveCount(0)

  const identity = await page.locator('.player-identity').boundingBox()
  const transcript = await page.locator('.transcript-row').first().boundingBox()
  expect((transcript?.y ?? 0) - ((identity?.y ?? 0) + (identity?.height ?? 0))).toBeLessThanOrEqual(8)

  const mask = await page.locator('.transcript-list').evaluate(
    (element) => getComputedStyle(element).maskImage,
  )
  expect(mask).toContain('linear-gradient')
  await expect(page.locator('.player-bottom-ui')).toBeVisible()
})

test('the end of the course list stays silent', async ({ page }) => {
  await page.goto('/learn/1/1')
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
  await page.goto('/learn/1/1')

  const prompt = page.locator('.player-transition-status')
  await expect(prompt).toContainText(/[123] 秒后进入读模式/)
  await expect(page.getByRole('tab', { name: '读' })).toHaveAttribute(
    'aria-selected',
    'true',
    { timeout: 5_000 },
  )
})

test('finishing listen audio enters read automatically without a complete button', async ({ page }) => {
  await mockUserApi(page, 'USER', { listenProgress: 40 })
  await page.goto('/learn/1/1')

  await expect(page.locator('.listen-mode')).toBeVisible()
  await expect(page.getByRole('button', { name: '完成本环节' })).toHaveCount(0)
  await page.locator('audio').dispatchEvent('ended')
  await expect(page.getByRole('tab', { name: '读' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.locator('.player-notice')).toHaveCount(0)
})

test('completion prompt follows the player layout', async ({ page }) => {
  await mockUserApi(page, 'USER', { listenProgress: 100 })
  await page.goto('/learn/1/1')
  const prompt = page.locator('.player-transition-status')
  await expect(prompt).toBeVisible()

  const controls = await page.locator('.audio-deck__controls').boundingBox()
  const action = await prompt.boundingBox()
  expect(action?.y ?? 0).toBeGreaterThan(controls?.y ?? 0)
})

test('learner report has no horizontal overflow on mobile', async ({ page }) => {
  await page.goto('/me')
  await expect(page.locator('.profile-card')).toBeVisible()
  await expect(page.getByText('本周学习节奏')).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('recent learning uses a featured layout and compact history rows', async ({ page }) => {
  await page.goto('/recent')
  await expect(page.locator('.recent-featured')).toBeVisible()
  await expect(page.locator('.recent-featured').getByText('继续学习')).toBeVisible()
  await expect(page.locator('.recent-history')).toBeVisible()
  const featured = await page.locator('.recent-featured').boundingBox()
  const cover = await page.locator('.recent-featured__cover').boundingBox()
  const action = await page.locator('.recent-featured__action').boundingBox()
  const progress = await page.locator('.recent-featured__progress').boundingBox()
  expect(featured?.height ?? 0).toBeLessThanOrEqual(145)
  expect((cover?.width ?? 0) / (cover?.height ?? 1)).toBeCloseTo(1.4, 1)
  expect(
    Math.abs(
      ((action?.y ?? 0) + (action?.height ?? 0) / 2)
      - ((progress?.y ?? 0) + (progress?.height ?? 0) / 2),
    ),
  ).toBeLessThanOrEqual(1)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('logout button does not wrap on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/me')
  const logout = page.getByRole('button', { name: '退出登录' })
  await expect(logout).toBeVisible()
  const style = await logout.evaluate((element) => getComputedStyle(element).whiteSpace)
  expect(style).toBe('nowrap')
})

test('home restores the selected category and scroll position after navigation', async ({ page }) => {
  await page.route('**/api/v1/books?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(Array.from({ length: 4 }, (_, index) => ({
        id: index + 1,
        title: `口语书籍 ${index + 1}`,
        categoryId: 2,
        categoryName: '日常口语',
        coverUrl: '/covers/spoken.jpg',
        lessonCount: 4,
        progress: 0,
        favorite: false,
      }))),
    }),
  )
  await page.goto('/')
  await page.getByRole('tab', { name: '口语' }).click()
  await expect(page.locator('.book3d')).toHaveCount(4)
  await page.locator('.home-scroll').evaluate((element) => {
    element.scrollTop = element.scrollHeight
    element.dispatchEvent(new Event('scroll'))
  })

  await page.getByRole('button', { name: '我的' }).click()
  await expect(page.locator('.me-screen')).toBeVisible()
  await page.getByRole('button', { name: '学习', exact: true }).click()

  await expect(page.getByRole('tab', { name: '口语' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect
    .poll(() => page.locator('.home-scroll').evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
})

test('learner sees daily goal progress and can retry a missed sentence', async ({ page }) => {
  await page.goto('/me')

  await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
  await expect(page.getByText('15 / 15 分钟')).toBeVisible()
  await expect(page.getByRole('heading', { name: '错句复习' })).toBeVisible()

  await page.getByRole('button', { name: /Could we move the meeting to Friday morning/ }).click()
  await expect(page).toHaveURL(/\/learn\/1\/1\?cue=3&mode=WRITE/)
  await expect(page.locator('.write-current__translation')).toContainText(
    '我们能把会议改到周五上午吗？',
  )
})

test('lesson list offers a continue CTA and progress filters', async ({ page }) => {
  await page.goto('/learn/1')

  await expect(page.locator('.continue-lesson')).toBeVisible()
  await page.getByRole('button', { name: '进行中', exact: true }).click()
  await expect(page.locator('.lesson-row')).toHaveCount(2)
  await page.getByRole('button', { name: '未开始', exact: true }).click()
  await expect(page.getByText('当前筛选下没有课时。')).toBeVisible()
})

test('lesson rows keep their action inline and compact on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/learn/1')

  const row = page.locator('.lesson-row').first()
  const cta = row.locator('.lesson-row__cta')
  const rowBox = await row.boundingBox()
  const ctaBox = await cta.boundingBox()

  expect(rowBox?.height ?? 999).toBeLessThanOrEqual(96)
  expect(ctaBox?.y ?? 0).toBeGreaterThanOrEqual(rowBox?.y ?? 0)
  expect((ctaBox?.y ?? 0) + (ctaBox?.height ?? 0)).toBeLessThanOrEqual(
    (rowBox?.y ?? 0) + (rowBox?.height ?? 0) + 1,
  )
})

test('learning settings show a dirty-aware daily goal save state', async ({ page }) => {
  await page.goto('/me/learning')

  const save = page.locator('.learning-settings-save')
  await expect(save).toBeDisabled()

  await page.getByLabel('每日学习目标（分钟）').fill('30')
  await expect(save).toBeEnabled()
  await save.click()
  await expect(page.getByText('学习设置已保存')).toBeVisible()
  await expect(save).toBeDisabled()
})

test('weekly report exposes minutes and a screen-reader summary', async ({ page }) => {
  await page.goto('/me')

  await expect(page.locator('.week-day').first()).toHaveAttribute(
    'aria-label',
    /学习 \d+ 分钟/,
  )
  await expect(page.getByText(/本周共 \d+ 分钟/)).toBeVisible()
  await expect(page.locator('.week-day__value').first()).toBeVisible()
})

test('learner month view shows calendar heat levels, today and legend', async ({ page }) => {
  await page.goto('/me')
  await page.getByRole('button', { name: '本月' }).click()
  await page.waitForTimeout(1_700)

  await expect(page.getByRole('heading', { name: /学习记录$/ })).toBeVisible()
  await expect(page.locator('.month-day.level-1').first()).toBeVisible()
  await expect(page.locator('.month-day.level-2').first()).toBeVisible()
  await expect(page.locator('.month-day.level-3').first()).toBeVisible()
  await expect(page.locator('.month-day.is-today')).toHaveCount(1)
  await expect(page.locator('.report-card__legend i')).toHaveCount(4)
})

test('global search shows scope, suggestions and keyboard result selection', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '搜索课程' }).click()
  await expect(page.getByText('全站搜索')).toBeVisible()
  await expect(page.getByText('热门搜索')).toBeVisible()

  const input = page.getByRole('searchbox', { name: '搜索书籍、课时和字幕' })
  await input.fill('coffee')
  await expect(page.locator('mark').first()).toBeVisible()
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/learn\/2\/3/)
})

test('review queue can mark a sentence as mastered', async ({ page }) => {
  await page.goto('/me')
  await expect(page.getByRole('button', { name: '只看未掌握' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '已掌握' }).click()
  await expect(page.getByText('当前筛选下没有待复习内容。')).toBeVisible()
})

test('offline lesson manager explains storage and empty state', async ({ page }) => {
  await page.goto('/me/offline')
  await expect(page.getByRole('heading', { name: '离线课程' })).toBeVisible()
  await expect(page.getByText('本机离线空间')).toBeVisible()
  await expect(page.getByText('还没有离线课程')).toBeVisible()
})
