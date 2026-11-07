import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { learnerApi } from '@/api/services'
import type { BookSummary, Category, CourseSummary } from '@/api/types'

export const useCatalogStore = defineStore('catalog', () => {
  const interests = ref<Category[]>([])
  const allCategories = ref<Category[]>([])
  const books = ref<BookSummary[]>([])
  const selectedCategoryId = ref<number | 'favorite'>('favorite')
  const currentBookId = ref<number | null>(null)
  const currentLessonIds = ref<number[]>([])
  const loading = ref(false)
  let interestsResolved = false

  const selectedCategory = computed(() =>
    interests.value.find((category) => category.id === selectedCategoryId.value),
  )

  async function loadInterests() {
    const [saved, categories, settings] = await Promise.all([
      learnerApi.interests(),
      learnerApi.categories(),
      learnerApi.settings(),
    ])
    interests.value = saved.length ? saved : categories
    allCategories.value = categories
    if (!interestsResolved) {
      if (!saved.length) {
        selectedCategoryId.value = categories[0]?.id ?? 'favorite'
      } else {
        const defaultCategory = saved.find((item) => item.id === settings.defaultCategoryId)
        selectedCategoryId.value = defaultCategory?.id ?? saved[0]!.id
      }
      interestsResolved = true
    }
    return saved
  }

  async function loadBooks() {
    loading.value = true
    try {
      books.value = selectedCategoryId.value === 'favorite'
        ? await learnerApi.favoriteBooks()
        : await learnerApi.books(selectedCategoryId.value)
    } finally {
      loading.value = false
    }
  }

  async function selectCategory(value: number | 'favorite') {
    selectedCategoryId.value = value
    await loadBooks()
  }

  async function toggleBookFavorite(bookId: number) {
    const book = books.value.find((item) => item.id === bookId)
    if (!book) return
    if (book.favorite) {
      await learnerApi.unfavoriteBook(bookId)
    } else {
      await learnerApi.favoriteBook(bookId)
    }
    book.favorite = !book.favorite
    if (selectedCategoryId.value === 'favorite' && !book.favorite) {
      books.value = books.value.filter((item) => item.id !== bookId)
    }
  }

  function enterBook(book: BookSummary, lessons: CourseSummary[]) {
    currentBookId.value = book.id
    currentLessonIds.value = lessons.map((lesson) => lesson.id)
  }

  return {
    interests,
    allCategories,
    books,
    selectedCategoryId,
    selectedCategory,
    currentBookId,
    currentLessonIds,
    loading,
    loadInterests,
    loadBooks,
    selectCategory,
    toggleBookFavorite,
    enterBook,
  }
})
