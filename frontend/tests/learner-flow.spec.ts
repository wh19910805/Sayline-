import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import HomeFeed from '../src/components/course/HomeFeed.vue'
import { useControlVisibility } from '../src/composables/useControlVisibility'
import { getLetterStates } from '../src/utils/dictation'

const categories = [
  { id: 1, name: '职场', description: '真实职场表达' },
  { id: 2, name: '口语', description: '自然开口' },
]

const courses = [
  {
    id: 11,
    title: 'Meeting a New Colleague',
    description: '',
    categoryId: 1,
    categoryName: '职场',
    durationMs: 90_000,
    favorite: false,
    themeColorPrimary: '#4f5b47',
    themeColorSecondary: '#9f5e31',
  },
  {
    id: 12,
    title: 'Coffee Chat Basics',
    description: '',
    categoryId: 2,
    categoryName: '口语',
    durationMs: 70_000,
    favorite: true,
    themeColorPrimary: '#436b83',
    themeColorSecondary: '#1b3346',
  },
]

describe('learner experience', () => {
  it('shows selected interests plus favorites and opens a course without triggering favorite', async () => {
    const wrapper = mount(HomeFeed, {
      props: {
        categories,
        courses,
        selectedCategoryId: 1,
      },
    })

    expect(wrapper.findAll('[data-test="category-tab"]')).toHaveLength(3)
    expect(wrapper.find('[data-test="category-card"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="course-card"]')).toHaveLength(1)

    await wrapper.findAll('[data-test="category-tab"]')[1]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[2]])

    const favorite = wrapper.find('[data-test="favorite-button"]')
    await favorite.trigger('click')
    expect(wrapper.emitted('toggleFavorite')).toEqual([[11]])
    expect(wrapper.emitted('openCourse')).toBeUndefined()

    await wrapper.find('[data-test="course-card"]').trigger('click')
    expect(wrapper.emitted('openCourse')).toEqual([[courses[0]]])
  })

  it('marks each typed letter as correct or wrong', () => {
    expect(getLetterStates('mEt', 'met')).toEqual(['correct', 'correct', 'correct'])
    expect(getLetterStates('mat', 'met')).toEqual(['correct', 'wrong', 'correct'])
    expect(getLetterStates('m', 'met')).toEqual(['correct', 'empty', 'empty'])
  })
})

describe('auto hiding player controls', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hides after the delay and stays visible when auto hide is disabled', async () => {
    const autoHide = ref(true)
    const visibility = useControlVisibility({ autoHide, delay: 6_000 })

    visibility.show()
    expect(visibility.visible.value).toBe(true)
    vi.advanceTimersByTime(6_000)
    await nextTick()
    expect(visibility.visible.value).toBe(false)

    autoHide.value = false
    visibility.show()
    vi.advanceTimersByTime(20_000)
    await nextTick()
    expect(visibility.visible.value).toBe(true)
  })
})
