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

  await page.locator('.book-slot.is-active').click()
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

test('book cover thumbnail is reused across lesson and player navigation', async ({ page }) => {
  const thumbnailUrl = '/covers/work.jpg?thumb=1'
  const fullUrl = '/covers/work.jpg?full=1'
  const coverRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/covers/work.jpg')) coverRequests.push(request.url())
  })

  const lesson = {
    id: 1,
    bookId: 1,
    title: 'Meeting a New Colleague',
    description: '认识新同事',
    categoryId: 1,
    categoryName: '职场英语',
    coverUrl: fullUrl,
    coverThumbnailUrl: thumbnailUrl,
    themeColorPrimary: '#65734f',
    themeColorSecondary: '#9f5e31',
    durationMs: 20_000,
    progress: 20,
    lastCueText: 'Nice to meet you.',
    lastCueSequenceNo: 1,
    remainingDurationMs: 16_000,
    favorite: false,
  }
  await page.route('**/api/v1/books?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: 1,
        title: '职场英语',
        description: '会议、协作与真实职场表达',
        categoryId: 1,
        categoryName: '职场英语',
        coverUrl: fullUrl,
        coverThumbnailUrl: thumbnailUrl,
        themeColorPrimary: '#65734f',
        themeColorSecondary: '#9f5e31',
        lessonCount: 1,
        progress: 20,
        favorite: false,
      }]),
    }),
  )
  await page.route('**/api/v1/books/1', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        title: '职场英语',
        description: '会议、协作与真实职场表达',
        categoryId: 1,
        categoryName: '职场英语',
        coverUrl: fullUrl,
        coverThumbnailUrl: thumbnailUrl,
        themeColorPrimary: '#65734f',
        themeColorSecondary: '#9f5e31',
        lessonCount: 1,
        progress: 20,
        favorite: false,
        lessons: [lesson],
      }),
    }),
  )
  await page.route('**/api/v1/courses/1', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...lesson,
        coverThumbnailUrl: null,
        audioUrl: '/audio/demo.wav',
        cues: [
          {
            id: 1,
            sequenceNo: 1,
            startMs: 0,
            endMs: 3_000,
            englishText: 'Nice to meet you.',
            chineseText: '很高兴认识你。',
          },
        ],
      }),
    }),
  )

  await page.goto('/')
  await page.locator('.book-slot.is-active').click()
  await expect(page.locator('.book-head__cover')).toHaveCSS(
    'background-image',
    /thumb=1/,
  )
  await expect(page.locator('.lesson-row')).toHaveCount(1)
  expect(coverRequests.some((url) => url.includes('full=1'))).toBe(false)

  await page.route('**/covers/work.jpg?full=1', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.continue()
  })
  await page.locator('.lesson-row__main').click()
  await expect(page.locator('.player-cover-backdrop')).toHaveCSS(
    'background-image',
    /thumb=1/,
  )
  await expect(page.locator('.player-identity__cover img')).toHaveAttribute('src', /full=1/)
})

test('motion continuity keeps route layers visible and measure the book handoff', async ({ page }) => {
  await page.goto('/')
  await page.locator('.book-slot.is-active').waitFor()
  await page.evaluate(() => {
    const samples = {
      maxScreens: 0,
      blankSamples: 0,
      inertSeen: false,
    }
    const startedAt = performance.now()
    const sample = () => {
      const allScreens = Array.from(document.querySelectorAll<HTMLElement>('.app-screen'))
      const screens = allScreens.filter((element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number.parseFloat(style.opacity) > 0.01
          && rect.width > 0
          && rect.height > 0
      })
      samples.maxScreens = Math.max(samples.maxScreens, allScreens.length)
      if (screens.length === 0) samples.blankSamples += 1
      if (screens.some((element) => element.inert || element.getAttribute('aria-hidden') === 'true')) {
        samples.inertSeen = true
      }
      if (performance.now() - startedAt < 1_200) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
    ;(window as Window & { __motionSamples?: typeof samples }).__motionSamples = samples
  })

  await page.locator('.book-slot.is-active').click()
  await expect(page.locator('.lesson-row').first()).toBeVisible()
  await expect.poll(() => page.evaluate(() =>
    performance.getEntriesByName('learner-home-to-lesson').length,
  )).toBeGreaterThan(0)

  const measure = await page.evaluate(() => {
    const entry = performance.getEntriesByName('learner-home-to-lesson').at(-1) as PerformanceMeasure | undefined
    return entry?.duration ?? Number.POSITIVE_INFINITY
  })
  const samples = await page.evaluate(() =>
    (window as Window & {
      __motionSamples?: { maxScreens: number; blankSamples: number; inertSeen: boolean }
    }).__motionSamples,
  )
  expect(measure).toBeLessThan(900)
  expect(samples?.maxScreens).toBeGreaterThanOrEqual(2)
  expect(samples?.blankSamples).toBe(0)
  expect(samples?.inertSeen).toBe(true)
})

test('home shows a skeleton before delayed catalog data resolves', async ({ page }) => {
  const delay = async <T>(route: import('@playwright/test').Route, body: T) => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  }
  await page.route('**/api/v1/me/interests', (route) => delay(route, []))
  await page.route('**/api/v1/categories', (route) => delay(route, []))
  await page.route('**/api/v1/me/settings', (route) => delay(route, {
    fontScale: 1,
    subtitleColor: '#FFFAF0',
    playbackRate: 1,
    showChineseListen: true,
    showChineseRead: true,
    showChineseWrite: true,
    showChineseSpeak: true,
    dailyGoalMinutes: 15,
    reminderEnabled: true,
    reminderTime: '20:00',
    defaultCategoryId: null,
  }))
  await page.route('**/api/v1/books?*', (route) => delay(route, []))

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.sl-skeleton')).toBeVisible()
  await expect(page.locator('.sl-empty')).toHaveCount(0)
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
  const book = page.locator('.book-slot.is-active')
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

test('write mode auto-validates completed answers and offers retry only after errors', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.locator('[aria-label="写"]').click()
  const firstWord = page.locator('.sl-word-input__word').first()
  const submit = page.getByRole('button', { name: '提交本句' })

  await expect(firstWord).toHaveClass(/is-empty/)
  await expect(submit).toHaveCount(0)
  await expect(page.getByRole('button', { name: '跳过' })).toBeVisible()

  await page.locator('.sl-word-input input').first().fill('Ni')
  await expect(firstWord).toHaveClass(/is-filling/)
  await expect(page.locator('.dictation-feedback')).toHaveCount(0)

  const words = ['Nice', 'to', 'meet', 'you', "I'm", 'Alex', 'from', 'the', 'design', 'team']
  for (let index = 1; index < words.length; index++) {
    await page.locator('.sl-word-input input').nth(index).fill(words[index]!)
  }
  await page.waitForTimeout(450)
  await expect(page.locator('.dictation-feedback')).toHaveCount(0)
  await expect(page.locator('.sl-word-input input').last()).toBeEnabled()
  await page.locator('.sl-word-input input').last().evaluate((element) => element.blur())

  await expect(page.locator('.dictation-feedback')).toHaveClass(/is-wrong/)
  await expect(page.getByRole('button', { name: '重新填写' })).toBeVisible()
  const retry = await page.getByRole('button', { name: '重新填写' }).boundingBox()
  const skip = await page.getByRole('button', { name: '跳过' }).boundingBox()
  expect(retry?.y ?? 0).toBeGreaterThan(skip?.y ?? 0)

  await page.getByRole('button', { name: '重新填写' }).click()
  await expect(page.locator('.sl-word-input input').first()).toBeEnabled()
  await expect(page.locator('.sl-word-input input').first()).toHaveValue('')
  await expect(page.locator('.dictation-feedback')).toHaveCount(0)
})

test('write mode names incorrect words and adds a second-attempt hint', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.locator('[aria-label="写"]').click()
  const words = ['Nice', 'to', 'meet', 'you', "I'm", 'Alex', 'from', 'the', 'design', 'team']
  await page.locator('.sl-word-input input').first().fill('Ni')
  for (let index = 1; index < words.length; index++) {
    await page.locator('.sl-word-input input').nth(index).fill(words[index]!)
  }
  await page.locator('.sl-word-input input').last().evaluate((element) => element.blur())

  await expect(page.locator('.dictation-feedback')).toContainText('第 1 个单词需要修改')

  await page.getByRole('button', { name: '重新填写' }).click()
  await page.locator('.sl-word-input input').first().fill('Nx')
  for (let index = 1; index < words.length; index++) {
    await page.locator('.sl-word-input input').nth(index).fill(words[index]!)
  }
  await page.locator('.sl-word-input input').last().evaluate((element) => element.blur())

  await expect(page.locator('.dictation-feedback')).toContainText('首字母 N，共 4 个字母')
})

test('write mode does not submit an incomplete sentence when toggling English', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.locator('[aria-label="写"]').click()
  const firstInput = page.locator('.sl-word-input input').first()
  await firstInput.fill('Nice')

  await page.getByRole('button', { name: '英' }).click()
  await page.waitForTimeout(100)

  await expect(page.locator('.dictation-feedback')).toHaveCount(0)
  await expect(firstInput).toBeEnabled()
})

test('write mode focuses the first word after advancing to the next sentence', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.locator('[aria-label="写"]').click()
  const words = ['Nice', 'to', 'meet', 'you', "I'm", 'Alex', 'from', 'the', 'design', 'team']
  for (let index = 0; index < words.length; index++) {
    await page.locator('.sl-word-input input').nth(index).fill(words[index]!)
  }

  await expect(page.locator('.write-current__translation')).toContainText(
    '我也很高兴认识你，我这周刚入职。',
  )
  const firstWord = page.locator('.sl-word-input input').first()
  await expect(firstWord).toBeFocused()
  await expect(firstWord).toHaveValue('')
})

test('write mode stays on the next sentence after its audio finishes', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.locator('[aria-label="写"]').click()
  const words = ['Nice', 'to', 'meet', 'you', "I'm", 'Alex', 'from', 'the', 'design', 'team']
  for (let index = 0; index < words.length; index++) {
    await page.locator('.sl-word-input input').nth(index).fill(words[index]!)
  }

  await expect(page.locator('.write-current__label')).toContainText('02')
  const audio = page.locator('audio')
  await expect.poll(() => audio.evaluate(
    (element) => (element as HTMLAudioElement).currentTime,
  )).toBeGreaterThan(3.1)
  await audio.evaluate((element) => {
    const player = element as HTMLAudioElement
    player.currentTime = 6.95
    void player.play()
  })
  await expect.poll(() => audio.evaluate(
    (element) => (element as HTMLAudioElement).paused,
  )).toBe(true)
  await page.waitForTimeout(100)

  await expect(page.locator('.write-current__label')).toContainText('02')
  await expect(page.locator('.sl-word-input input').first()).toHaveValue('')
})

test('write mode keeps the app inside the visible viewport when the keyboard opens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const viewport = new EventTarget() as EventTarget & {
      height: number
      width: number
      offsetTop: number
      offsetLeft: number
    }
    Object.defineProperties(viewport, {
      height: { value: window.innerHeight, writable: true },
      width: { value: window.innerWidth, writable: true },
      offsetTop: { value: 0, writable: true },
      offsetLeft: { value: 0, writable: true },
    })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    })
  })

  await page.goto('/learn/1/1')
  await page.locator('[aria-label="写"]').click()
  await page.locator('.sl-word-input input').first().focus()

  await page.evaluate(() => {
    const viewport = window.visualViewport as VisualViewport & { height: number }
    viewport.height = 520
    viewport.dispatchEvent(new Event('resize'))
  })

  await expect.poll(() =>
    page.locator('.standalone-app').evaluate((element) => element.getBoundingClientRect().height),
  ).toBe(520)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test('keyboard focus keeps sentence context and scrolls only the write transcript', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const viewport = new EventTarget() as EventTarget & {
      height: number
      width: number
      offsetTop: number
      offsetLeft: number
    }
    Object.defineProperties(viewport, {
      height: { value: window.innerHeight, writable: true },
      width: { value: window.innerWidth, writable: true },
      offsetTop: { value: 0, writable: true },
      offsetLeft: { value: 0, writable: true },
    })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    })
  })

  await page.goto('/learn/1/1')
  await page.locator('[aria-label="写"]').click()
  const sentenceActions = page.locator('.write-current__actions')
  await expect(sentenceActions.locator('button')).toHaveCount(3)
  await expect(sentenceActions.locator('button').nth(0)).toHaveText(/播放|暂停/)
  await expect(sentenceActions.locator('button').nth(1)).toHaveText('中')
  await expect(sentenceActions.locator('button').nth(2)).toHaveText('英')
  await expect(page.locator('.write-skip-button')).toHaveText('跳过')
  for (const button of await sentenceActions.locator('button').all()) {
    await expect(button).toHaveCSS('white-space', 'nowrap')
  }
  await expect(page.locator('.write-skip-button')).toHaveCSS('white-space', 'nowrap')
  await page.locator('.write-context-row[data-cue-id="3"]').click()
  const firstInput = page.locator('.write-current .sl-word-input input').first()
  await firstInput.focus()
  await page.evaluate(() => {
    const viewport = window.visualViewport as VisualViewport & { height: number }
    viewport.height = 430
    viewport.dispatchEvent(new Event('resize'))
  })

  const player = page.locator('.player-screen')
  await expect(player).toHaveClass(/keyboard-focus/)
  await expect(page.locator('.player-header__title')).toContainText('输入中')
  await expect(page.locator('.keyboard-focus-done')).toHaveText('收起键盘')
  await expect(page.locator('.player-mode-switch')).toBeHidden()
  await expect(sentenceActions).toBeVisible()
  await expect(page.locator('.dictation-actions')).toHaveCount(0)
  const skipButton = page.locator('.write-current__head').getByRole('button', { name: '跳过' })
  await expect(skipButton).toBeVisible()
  const skipBox = await skipButton.boundingBox()
  expect(skipBox?.width ?? 0).toBeGreaterThanOrEqual(44)
  expect(skipBox?.height ?? 0).toBeGreaterThanOrEqual(44)

  await page.waitForTimeout(100)
  const contextVisibility = await page.evaluate(() => {
    const container = document.querySelector<HTMLElement>('.write-transcript')!.getBoundingClientRect()
    const current = document.querySelector<HTMLElement>('.write-current')!.getBoundingClientRect()
    const rows = Array.from(document.querySelectorAll<HTMLElement>('.write-context-row'))
      .map((row) => row.getBoundingClientRect())
      .filter((rect) => rect.bottom > container.top && rect.top < container.bottom)
    return {
      before: rows.filter((rect) => rect.bottom <= current.top).length,
      after: rows.filter((rect) => rect.top >= current.bottom).length,
    }
  })
  expect(contextVisibility.before).toBeGreaterThan(0)
  expect(contextVisibility.after).toBeGreaterThan(0)

  const inputs = page.locator('.write-current .sl-word-input input')
  const words = ['Could', 'we', 'move', 'the', 'meeting', 'to', 'Friday', 'morning']
  await inputs.first().fill(words[0]!)
  await inputs.first().press('Space')
  await expect(inputs.nth(1)).toBeFocused()
  await expect(player).toHaveClass(/keyboard-focus/)

  for (let index = 1; index < words.length; index += 1) {
    await inputs.nth(index).fill(words[index]!)
  }
  await expect(page.locator('.player-header__title')).toContainText('第 04 句')
  await expect(player).toHaveClass(/keyboard-focus/)

  await inputs.last().focus()
  const inputClearance = await page.evaluate(() => {
    const input = document.querySelectorAll<HTMLElement>('.write-current .sl-word-input input')
    const lastInput = input[input.length - 1]!.getBoundingClientRect()
    const transcript = document.querySelector<HTMLElement>('.write-transcript')!.getBoundingClientRect()
    return transcript.bottom - lastInput.bottom
  })
  expect(inputClearance).toBeGreaterThan(0)

  const transcript = page.locator('.write-transcript')
  const maxScroll = await transcript.evaluate((element) => {
    element.scrollTop = element.scrollHeight
    return element.scrollHeight - element.clientHeight
  })
  expect(maxScroll).toBeGreaterThan(0)
  await firstInput.focus()
  await expect.poll(() => transcript.evaluate((element) => element.scrollTop)).toBeLessThan(maxScroll)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)

  await page.locator('.keyboard-focus-done').click()
  await page.evaluate(() => {
    const viewport = window.visualViewport as VisualViewport & { height: number }
    viewport.height = 844
    viewport.dispatchEvent(new Event('resize'))
  })
  await expect(player).not.toHaveClass(/keyboard-focus/)
  await expect(page.locator('.player-header__actions')).toBeVisible()
  await expect(page.locator('.player-mode-switch')).toBeVisible()
})

test('write mode plays the selected sentence when switching lines', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.locator('[aria-label="写"]').click()
  await page.locator('audio').evaluate((element) => {
    ;(element as HTMLAudioElement).pause()
  })

  await page.locator('.write-context-row[data-cue-id="3"]').click()
  await page.waitForTimeout(100)
  await expect(page.locator('.write-current__label')).toContainText('03')
  await expect(page.locator('.write-current__translation')).toContainText(
    '我们能把会议改到周五上午吗？',
  )
  await expect.poll(() => page.locator('audio').evaluate(
    (element) => (element as HTMLAudioElement).paused,
  )).toBe(false)
  const currentTime = await page.locator('audio').evaluate(
    (element) => (element as HTMLAudioElement).currentTime,
  )
  expect(currentTime).toBeGreaterThanOrEqual(7)
})

test('playing the current writing sentence keeps its transcript position stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const longCues = Array.from({ length: 54 }, (_, index) => ({
    id: index + 1,
    sequenceNo: index + 1,
    startMs: index * 4_000,
    endMs: (index + 1) * 4_000,
    englishText: `Practice sentence number ${index + 1}.`,
    chineseText: `第 ${index + 1} 句练习。`,
  }))
  await page.route('**/api/v1/courses/1', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        bookId: 1,
        title: 'Long writing practice',
        categoryId: 1,
        categoryName: '职场英语',
        durationMs: 216_000,
        progress: 0,
        favorite: false,
        themeColorPrimary: '#7b637d',
        themeColorSecondary: '#383b52',
        audioUrl: '/audio/demo.wav',
        cues: longCues,
      }),
    }),
  )

  await page.goto('/learn/1/1?cue=21&mode=WRITE')
  await expect(page.locator('.write-current__label')).toContainText('21')
  await page.locator('audio').evaluate((element) => {
    ;(element as HTMLAudioElement).pause()
  })

  const before = await page.locator('.write-transcript').evaluate((container) => {
    const active = container.querySelector<HTMLElement>('.write-current')!
    return {
      scrollTop: container.scrollTop,
      activeTop: active.getBoundingClientRect().top,
      activeBottom: active.getBoundingClientRect().bottom,
      containerTop: container.getBoundingClientRect().top,
      containerBottom: container.getBoundingClientRect().bottom,
    }
  })
  expect(before.activeTop).toBeGreaterThanOrEqual(before.containerTop)
  expect(before.activeBottom).toBeLessThanOrEqual(before.containerBottom)

  await page.locator('.write-current__actions button').first().click()
  await page.waitForTimeout(300)

  const after = await page.locator('.write-transcript').evaluate((container) => {
    const active = container.querySelector<HTMLElement>('.write-current')!
    return {
      scrollTop: container.scrollTop,
      activeTop: active.getBoundingClientRect().top,
      activeBottom: active.getBoundingClientRect().bottom,
      containerTop: container.getBoundingClientRect().top,
      containerBottom: container.getBoundingClientRect().bottom,
    }
  })
  expect(Math.abs(after.scrollTop - before.scrollTop)).toBeLessThanOrEqual(1)
  expect(after.activeTop).toBeGreaterThanOrEqual(after.containerTop)
  expect(after.activeBottom).toBeLessThanOrEqual(after.containerBottom)
})

test('read completion and speaking states describe what the app actually checks', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.locator('[aria-label="读"]').click()
  await page.locator('.read-mode').waitFor()

  await expect(page.getByText(/停留 2 秒/)).toBeVisible()
  await expect(page.locator('.read-row-status').first()).toBeVisible()

  await page.locator('[aria-label="说"]').click()
  await page.locator('.speak-mode').waitFor()
  await expect(page.getByText('本句待录音')).toBeVisible()
  await expect(page.getByText('本句待跟读')).toHaveCount(0)
})

test('mode transitions overlap without moving the mode navigation', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.locator('.listen-mode').waitFor()
  const navBefore = await page.locator('.player-mode-switch').boundingBox()
  await page.evaluate(() => {
    const samples = { maxPanels: 0, leavingInteractive: false }
    const startedAt = performance.now()
    const sample = () => {
      const panels = Array.from(document.querySelectorAll<HTMLElement>('.listen-mode, .read-mode, .write-mode, .speak-mode'))
        .filter((element) => {
          const style = getComputedStyle(element)
          const rect = element.getBoundingClientRect()
          return style.display !== 'none'
            && Number.parseFloat(style.opacity) > 0.01
            && rect.width > 0
            && rect.height > 0
        })
      samples.maxPanels = Math.max(samples.maxPanels, panels.length)
      if (panels.some((element) => getComputedStyle(element).pointerEvents !== 'none')) {
        const leaving = panels
          .map((element) => element.closest<HTMLElement>('.mode-panel-leave-active'))
          .find(Boolean)
        if (leaving && getComputedStyle(leaving).pointerEvents !== 'none') samples.leavingInteractive = true
      }
      if (performance.now() - startedAt < 600) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
    ;(window as Window & { __modeSamples?: typeof samples }).__modeSamples = samples
  })

  await page.locator('[aria-label="读"]').click()
  await expect(page.locator('.read-mode')).toBeVisible()
  await expect.poll(() => page.evaluate(() =>
    performance.getEntriesByName('learner-mode-transition').length,
  )).toBeGreaterThan(0)
  expect(await page.evaluate(() => {
    const entry = performance.getEntriesByName('learner-mode-transition').at(-1) as PerformanceMeasure | undefined
    return entry?.duration ?? Number.POSITIVE_INFINITY
  })).toBeLessThan(200)
  const navAfter = await page.locator('.player-mode-switch').boundingBox()
  expect(navAfter?.x).toBeCloseTo(navBefore?.x ?? 0, 1)
  expect(navAfter?.y).toBeCloseTo(navBefore?.y ?? 0, 1)
  await expect.poll(() => page.evaluate(() =>
    (window as Window & { __modeSamples?: { maxPanels: number } }).__modeSamples?.maxPanels ?? 0,
  )).toBeGreaterThanOrEqual(2)
  expect(await page.evaluate(() =>
    (window as Window & { __modeSamples?: { leavingInteractive: boolean } }).__modeSamples?.leavingInteractive,
  )).toBe(false)
})

test('reduced motion removes route and mode choreography', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('.book-slot.is-active').waitFor()
  await page.locator('.book-slot.is-active').click()
  await expect(page.locator('.lesson-row').first()).toBeVisible()
  await expect(page.locator('.book-enter')).toHaveCount(0)

  await page.locator('.lesson-row').first().click()
  await page.locator('.listen-mode').waitFor()
  const modeDuration = await page.locator('.listen-mode').evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  )
  expect(modeDuration.split(',').every((value) => Number.parseFloat(value) === 0)).toBe(true)
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
  await expect(page.getByText('本句待录音')).toBeVisible()
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

test('continuous mode prefetches the next lesson before the current audio ends', async ({ page }) => {
  const nextLessonRequests: string[] = []
  page.on('request', (request) => {
    if (/\/api\/v1\/courses\/2(?:\?|$)/.test(request.url())) {
      nextLessonRequests.push(request.url())
    }
  })

  await page.goto('/learn/1/1')
  await page.getByRole('button', { name: '播放模式：学习' }).click()
  await expect(page.getByRole('button', { name: '播放模式：连播' })).toBeVisible()
  await page.locator('audio').evaluate((element) => (element as HTMLAudioElement).pause())

  await expect.poll(() => nextLessonRequests.length, { timeout: 2_000 }).toBeGreaterThan(0)
})

test('leaving the player keeps playback state on the lesson page', async ({ page }) => {
  const invalidLearningRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/learning/courses/NaN')) {
      invalidLearningRequests.push(request.url())
    }
  })
  await page.goto('/')
  await page.locator('.book-slot.is-active').click()
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
  await page.locator('.book-slot.is-active').click()
  await page.locator('.lesson-row').first().click()
  await page.getByRole('button', { name: '返回' }).click()
  await expect(page).toHaveURL(/\/learn\/1$/)
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

test('profile save does not overlap phone update controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/me/profile')

  const save = await page.locator('.profile-save').boundingBox()
  const update = await page.getByRole('button', { name: '更新手机号' }).boundingBox()
  expect(save).not.toBeNull()
  expect(update).not.toBeNull()
  expect(
    save!.y + save!.height <= update!.y ||
    update!.y + update!.height <= save!.y,
  ).toBe(true)
})

test('profile editing has a local save action before security settings', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/me/profile')

  const saveProfile = page.getByRole('button', { name: '保存个人资料' })
  const newPhone = page.getByLabel('新手机号')
  await expect(saveProfile).toBeVisible()
  const [saveBox, phoneBox] = await Promise.all([
    saveProfile.boundingBox(),
    newPhone.boundingBox(),
  ])
  expect(saveBox).not.toBeNull()
  expect(phoneBox).not.toBeNull()
  expect(saveBox!.y).toBeLessThan(phoneBox!.y)
  expect(saveBox!.y + saveBox!.height).toBeLessThanOrEqual(844)
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

test('learner sees daily goal progress and can start a missed sentence review', async ({ page }) => {
  await page.goto('/me')

  await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
  await expect(page.getByText('15 / 15 分钟')).toBeVisible()
  await expect(page.getByRole('heading', { name: '错句复习' })).toBeVisible()
  await page.getByRole('button', { name: /查看全部错句/ }).click()
  await expect(page).toHaveURL(/\/me\/reviews$/)

  await page.getByRole('button', { name: '开始复习第 3 句' }).click()
  await expect(page).toHaveURL(/\/me\/reviews\/session\?start=3$/)
  await expect(page.locator('.review-session__prompt')).toContainText('我们能把会议改到周五上午吗？')
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

  await expect(page.locator('.settings-save-dock')).toHaveCount(0)

  await page.getByLabel('每日学习目标（分钟）').fill('30')
  const save = page.locator('.learning-settings-save')
  await expect(save).toBeEnabled()
  await save.click()
  await expect(page.locator('.settings-save-toast')).toBeVisible()
  await expect(page.locator('.inline-success')).toContainText('学习设置已保存')
  await expect(page.locator('.settings-save-dock')).toHaveCount(0)
})

test('learning settings save dock appears only for unsaved changes', async ({ page }) => {
  await page.goto('/me/learning')
  await expect(page.locator('.settings-form')).toBeVisible()
  await expect(page.locator('.settings-save-dock')).toHaveCount(0)

  await page.getByRole('button', { name: '大', exact: true }).click()
  await expect(page.locator('.settings-save-dock')).toBeVisible()

  await page.locator('.learning-settings-save').click()
  await expect(page.locator('.settings-save-toast')).toBeVisible()
  await expect(page.locator('.settings-save-dock')).toHaveCount(0)
})

test('learning settings save confirmation stays visible in the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/me/learning')
  await page.getByRole('button', { name: '大', exact: true }).click()
  await page.locator('.learning-settings-save').evaluate((element) => (element as HTMLButtonElement).click())

  const confirmation = page.locator('.settings-save-toast')
  await expect(confirmation).toBeVisible()
  const box = await confirmation.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(844)
})

test('learning settings exposes section navigation and a live subtitle preview', async ({ page }) => {
  await page.goto('/me/learning')
  const nav = page.getByRole('navigation', { name: '设置分组' })
  await expect(nav).toBeVisible()
  await expect(page.locator('.subtitle-preview')).toContainText('Nice to meet you.')

  const preview = page.locator('.subtitle-preview__english')
  const initialSize = await preview.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  )
  await page.getByRole('button', { name: '大', exact: true }).click()
  const largerSize = await preview.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  )
  expect(largerSize).toBeGreaterThan(initialSize)

  await nav.getByRole('button', { name: '提醒' }).click()
  await expect(page.locator('#settings-reminder')).toBeVisible()
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

test('goal and weekly completion remain stable when switching report periods', async ({ page }) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  const toDateKey = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  const today = new Date()
  const todayKey = toDateKey(today)
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return {
      date: toDateKey(date),
      active: true,
      sessions: 1,
      studyMs: (toDateKey(date) === todayKey ? 20 : 10) * 60_000,
    }
  })
  const year = Number(todayKey.slice(0, 4))
  const month = Number(todayKey.slice(5, 7))
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const date = `${year}-${pad(month)}-${pad(day)}`
    const minutes = date === todayKey ? 30 : day <= 10 ? 10 : 0
    return {
      date,
      active: minutes > 0,
      sessions: minutes > 0 ? 1 : 0,
      studyMs: minutes * 60_000,
    }
  })
  const stats = (days: typeof weekDays) => ({
    rangeStart: days[0]!.date,
    rangeEnd: days[days.length - 1]!.date,
    days,
    summary: {
      studyDays: days.filter((day) => day.active).length,
      sessions: days.filter((day) => day.active).length,
      studyMs: days.reduce((total, day) => total + day.studyMs, 0),
      dictationAccuracy: 86,
      speakingCount: 24,
    },
  })
  await page.unroute('**/api/v1/learning/stats*')
  await page.route('**/api/v1/learning/stats*', (route) => {
    const period = new URL(route.request().url()).searchParams.get('period')
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(period === 'MONTH' ? stats(monthDays) : stats(weekDays)),
    })
  })

  await page.goto('/me')
  const dailyGoal = page.locator('.daily-goal-card')
  await expect(dailyGoal).toContainText('20 / 15 分钟')
  await expect(dailyGoal.getByRole('button', { name: '调整目标' })).toBeVisible()
  await expect(page.locator('.review-section').getByRole('button', { name: '调整目标' })).toHaveCount(0)
  const weeklyCompletion = await page.locator('.daily-goal-card__week').innerText()

  await page.getByRole('button', { name: '本月' }).click()
  await expect(page.locator('.month-heatmap')).toBeVisible()
  await expect(dailyGoal).toContainText('20 / 15 分钟')
  await expect(page.locator('.daily-goal-card__week')).toHaveText(weeklyCompletion)
})

test('personal center puts learning progress before settings shortcuts', async ({ page }) => {
  await page.goto('/me')
  await expect(page.locator('.profile-card')).toBeVisible()
  const order = await page.locator('.me-scroll').evaluate((root) => {
    const selectors = [
      '.daily-goal-card',
      '.review-section',
      '.study-summary-line',
      '.settings-shortcuts',
    ]
    return selectors.map((selector) =>
      Array.from(root.children).indexOf(root.querySelector(selector) as Element),
    )
  })
  expect(order).toEqual([...order].sort((a, b) => a - b))
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
  await page.goto('/me/reviews')
  await expect(page.getByRole('button', { name: '只看未掌握' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '已掌握' }).click()
  await expect(page.getByText('当前筛选下没有待复习内容。')).toBeVisible()
})

test('review queue lives on a secondary page and scrolls large error sets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const reviews = Array.from({ length: 18 }, (_, index) => ({
    bookId: 1,
    courseId: 1,
    cueId: index + 1,
    bookTitle: '职场英语',
    courseTitle: 'Meeting a New Colleague',
    sequenceNo: index + 1,
    englishText: `Review sentence number ${index + 1}.`,
    chineseText: `第 ${index + 1} 个复习句。`,
    lastAnswer: `Review sentence ${index + 1}.`,
    wrongCount: 18 - index,
    lastWrongAt: '2026-11-12T02:00:00Z',
    status: 'LEARNING',
    nextReviewAt: null,
    due: true,
  }))
  await page.route('**/api/v1/learning/reviews*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(reviews),
    }),
  )

  await page.goto('/me')
  await expect(page.locator('.review-list')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /查看全部错句/ })).toContainText('18')
  await page.getByRole('button', { name: /查看全部错句/ }).click()
  await expect(page).toHaveURL(/\/me\/reviews$/)
  await expect(page.locator('.review-item')).toHaveCount(18)

  const metrics = await page.locator('.review-scroll').evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    horizontalOverflow: element.scrollWidth > element.clientWidth,
  }))
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)
  expect(metrics.horizontalOverflow).toBe(false)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
})

test('review session advances across courses and keeps skipped cues pending', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const reviews = [
    {
      bookId: 1,
      courseId: 1,
      cueId: 101,
      bookTitle: '职场英语',
      courseTitle: '安排会议',
      sequenceNo: 1,
      englishText: 'Could we move the meeting to Friday morning?',
      chineseText: '我们能把会议改到周五上午吗？',
      lastAnswer: 'Could we move the meeting to Friday?',
      wrongCount: 3,
      lastWrongAt: '2026-11-12T02:00:00Z',
      status: 'LEARNING',
      nextReviewAt: null,
      due: true,
    },
    {
      bookId: 2,
      courseId: 2,
      cueId: 202,
      bookTitle: '日常沟通',
      courseTitle: '发送报告',
      sequenceNo: 4,
      englishText: 'I will send the report today',
      chineseText: '我今天会发送报告。',
      lastAnswer: 'I will send report today',
      wrongCount: 1,
      lastWrongAt: '2026-11-11T02:00:00Z',
      status: 'LEARNING',
      nextReviewAt: null,
      due: true,
    },
  ]
  const attempts: Array<{ cueId: number; answer: string }> = []

  await page.route('**/api/v1/learning/reviews?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(reviews),
    }),
  )
  await page.route('**/api/v1/learning/reviews/*/attempts', async (route) => {
    const cueId = Number(route.request().url().match(/reviews\/(\d+)\/attempts/)?.[1])
    const answer = (route.request().postDataJSON() as { answer: string }).answer
    attempts.push({ cueId, answer })
    const review = reviews.find((item) => item.cueId === cueId)!
    const expected = review.englishText.replace(/[^a-zA-Z0-9'\s]/g, '').trim()
    const correct = answer === expected
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        correct,
        status: correct ? 'MASTERED' : 'LEARNING',
      }),
    })
  })
  await page.route(/\/api\/v1\/courses\/(\d+)$/, (route) => {
    const courseId = Number(route.request().url().split('/').at(-1))
    const cue = reviews.find((item) => item.courseId === courseId)!
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: courseId,
        audioUrl: `/audio/course-${courseId}.wav`,
        cues: [{
          id: cue.cueId,
          sequenceNo: cue.sequenceNo,
          startMs: 0,
          endMs: 3_000,
          englishText: cue.englishText,
          chineseText: cue.chineseText,
        }],
      }),
    })
  })

  await page.goto('/me/reviews')
  const firstReview = page.locator('.review-item').first()
  await expect(firstReview).toContainText('我们能把会议改到周五上午吗？')
  await expect(firstReview).not.toContainText('Could we move the meeting')
  await firstReview.locator('.review-item__open').click()

  await expect(page).toHaveURL(/\/me\/reviews\/session\?start=101$/)
  await expect(page.getByRole('heading', { name: '错句复习' })).toBeVisible()
  await expect(page.locator('.review-session__progress')).toContainText('1 / 2')

  const firstWords = ['Could', 'we', 'move', 'the', 'meeting', 'to', 'Friday', 'morning']
  for (let index = 0; index < firstWords.length - 1; index += 1) {
    await page.locator('.review-session .sl-word-input input').nth(index).fill(firstWords[index]!)
  }
  await page.locator('.review-session .sl-word-input input').last().fill('evening')
  await page.locator('.review-session .sl-word-input input').last().evaluate((element) => element.blur())
  await expect(page.locator('.dictation-feedback')).toHaveClass(/is-wrong/)
  await expect(page.getByText('我们能把会议改到周五上午吗？')).toBeVisible()
  expect(attempts).toHaveLength(1)

  await page.getByRole('button', { name: '重新填写' }).click()
  for (let index = 0; index < firstWords.length; index += 1) {
    await page.locator('.review-session .sl-word-input input').nth(index).fill(firstWords[index]!)
  }

  await expect(page.getByText('我今天会发送报告。')).toBeVisible()
  expect(attempts).toEqual([
    {
      cueId: 101,
      answer: 'Could we move the meeting to Friday evening',
    },
    {
      cueId: 101,
      answer: 'Could we move the meeting to Friday morning',
    },
  ])
  await expect(page).toHaveURL(/\/me\/reviews\/session\?start=101$/)

  await page.getByRole('button', { name: '跳过本句' }).click()
  await expect(page.getByRole('heading', { name: '本轮复习完成' })).toBeVisible()
  expect(attempts).toHaveLength(2)
})

test('offline lesson manager explains storage and empty state', async ({ page }) => {
  await page.goto('/me/offline')
  await expect(page.getByRole('heading', { name: '离线课程' })).toBeVisible()
  await expect(page.getByText('本机离线空间')).toBeVisible()
  await expect(page.getByText('还没有离线课程')).toBeVisible()
})

test('learner downloads a course and sees it in offline storage', async ({ page }) => {
  await page.goto('/learn/1/1')
  await page.getByRole('button', { name: '下载本课时供离线学习' }).click()

  await expect(page.getByRole('button', { name: '已下载本课时' })).toBeVisible()
  await page.goto('/me/offline')
  await expect(page.getByText('Meeting a New Colleague')).toBeVisible()
})

test('offline course layout keeps actions clear on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/learn/1/1')
  await page.getByRole('button', { name: '下载本课时供离线学习' }).click()
  await expect(page.getByRole('button', { name: '已下载本课时' })).toBeVisible()
  await page.goto('/me/offline')

  const card = page.locator('.offline-list article').first()
  const cover = card.locator('.offline-list__cover')
  const primary = card.getByRole('button', { name: '离线学习' })
  const remove = card.getByRole('button', { name: '删除' })
  const [cardBox, coverBox, primaryBox, removeBox] = await Promise.all([
    card.boundingBox(),
    cover.boundingBox(),
    primary.boundingBox(),
    remove.boundingBox(),
  ])

  expect(cardBox).not.toBeNull()
  expect(coverBox).not.toBeNull()
  expect(primaryBox).not.toBeNull()
  expect(removeBox).not.toBeNull()
  expect(primaryBox!.width).toBeGreaterThan(80)
  expect(primaryBox!.height).toBeGreaterThanOrEqual(43.5)
  expect(removeBox!.height).toBeGreaterThanOrEqual(43.5)
  expect(primaryBox!.y).toBeGreaterThanOrEqual(coverBox!.y + coverBox!.height)
  expect(primaryBox!.x).toBeGreaterThanOrEqual(cardBox!.x)
  expect(primaryBox!.x + primaryBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width)
  expect(removeBox!.x).toBeGreaterThan(primaryBox!.x)
})

test('downloaded course opens after an API-disconnected cold start', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await mockUserApi(page, 'USER')

  await page.goto('/learn/1/1')
  await page.getByRole('button', { name: '下载本课时供离线学习' }).click()
  await expect(page.getByRole('button', { name: '已下载本课时' })).toBeVisible()
  await page.close()

  const offlinePage = await context.newPage()
  await offlinePage.route('**/api/v1/**', (route) => route.abort('internetdisconnected'))
  await offlinePage.goto('/learn/1/1')

  await expect(offlinePage).toHaveURL(/\/learn\/1\/1/)
  await expect(offlinePage.locator('.player-screen')).toBeVisible()
  await expect(offlinePage.getByText('当前离线，已加载已下载的音频和字幕')).toBeVisible()
  await context.close()
})

test('offline learning action syncs after reconnection', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await mockUserApi(page, 'USER')

  await page.goto('/learn/1/1')
  await page.getByRole('button', { name: '下载本课时供离线学习' }).click()
  await expect(page.getByRole('button', { name: '已下载本课时' })).toBeVisible()
  await page.close()

  const offlinePage = await context.newPage()
  let apiDown = true
  const syncedActions: Array<Record<string, unknown>> = []
  await offlinePage.route('**/api/v1/**', (route) => route.abort('internetdisconnected'))
  await offlinePage.route('**/api/v1/learning/courses/1/actions', (route) => {
    if (apiDown) return route.abort('internetdisconnected')
    syncedActions.push(route.request().postDataJSON() as Record<string, unknown>)
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        lastMode: 'WRITE',
        lastPositionMs: 0,
        modes: {
          listen: { progress: 0, confirmed: false },
          read: { progress: 0, confirmed: false },
          write: { progress: 0, confirmed: false },
          speak: { progress: 0, confirmed: false },
        },
        cues: [{ cueId: 1, heard: false, read: false, written: false, spoken: false }],
        completed: false,
      }),
    })
  })

  await offlinePage.goto('/learn/1/1')
  await offlinePage.locator('[aria-label="写"]').click()
  const words = ['Ni', 'to', 'meet', 'you', "I'm", 'Alex', 'from', 'the', 'design', 'team']
  for (let index = 0; index < words.length; index++) {
    await offlinePage.locator('.sl-word-input input').nth(index).fill(words[index]!)
  }
  await offlinePage.locator('.sl-word-input input').last().evaluate((element) => element.blur())
  await expect(offlinePage.locator('.dictation-feedback')).toBeVisible()

  apiDown = false
  await offlinePage.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect.poll(() => syncedActions.length).toBe(1)
  expect(syncedActions[0]).toMatchObject({ cueId: 1, mode: 'WRITE' })
  expect(String(syncedActions[0]?.answer).trim()).toBe(
    "Ni to meet you I'm Alex from the design team",
  )
  await context.close()
})
