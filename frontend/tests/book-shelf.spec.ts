import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import BookShelf from '../src/components/course/BookShelf.vue'

function book(id: number, title: string) {
  return {
    id,
    title,
    description: '',
    categoryId: 1,
    categoryName: '职场英语',
    lessonCount: 3,
    progress: 20,
    favorite: false,
  }
}

describe('BookShelf active book card', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('shows only the card for the centered book', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const wrapper = mount(BookShelf, {
      attachTo: document.body,
      props: { books: [book(1, '第一本'), book(2, '第二本'), book(3, '第三本')] },
    })
    await nextTick()

    expect(wrapper.findAll('.book3d')).toHaveLength(3)
    expect(wrapper.findAll('.book-selection-card')).toHaveLength(1)
    expect(wrapper.find('.book-selection-card').text()).toContain('第一本')

    wrapper.unmount()
  })
})
