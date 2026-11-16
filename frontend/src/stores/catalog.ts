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
  const loading = ref(true)
  let interestsResolved = false
  let booksGeneration = 0

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
      const rememberedCategory = sessionStorage.getItem('sayline:home-category')
      if (rememberedCategory === 'favorite') {
        selectedCategoryId.value = 'favorite'
      } else if (rememberedCategory) {
        const categoryId = Number(rememberedCategory)
        if (saved.some((item) => item.id === categoryId)) {
          selectedCategoryId.value = categoryId
        }
      }
      interestsResolved = true
    }
    return saved
  }

  async function fetchBooks(categoryId: number | 'favorite') {
    return categoryId === 'favorite'
      ? learnerApi.favoriteBooks()
      : learnerApi.books(categoryId)
  }

  async function loadBooks() {
    const generation = ++booksGeneration
    const categoryId = selectedCategoryId.value
    loading.value = true
    try {
      const result = await fetchBooks(categoryId)
      if (generation === booksGeneration && categoryId === selectedCategoryId.value) {
        books.value = result
      }
    } finally {
      if (generation === booksGeneration) loading.value = false
    }
  }

  async function loadHome() {
    loading.value = true
    const remembered = sessionStorage.getItem('sayline:home-category')
    const provisionalCategory = remembered === 'favorite'
      ? 'favorite'
      : remembered && Number.isSafeInteger(Number(remembered))
        ? Number(remembered)
        : null
    const provisionalBooks = provisionalCategory === null
      ? null
      : fetchBooks(provisionalCategory).catch(() => null)

    const saved = await loadInterests()
    if (provisionalCategory !== null && provisionalBooks) {
      const result = await provisionalBooks
      if (result && provisionalCategory === selectedCategoryId.value) {
        books.value = result
        loading.value = false
        return saved
      }
    }
    await loadBooks()
    return saved
  }

  async function selectCategory(value: number | 'favorite') {
    selectedCategoryId.value = value
    sessionStorage.setItem('sayline:home-category', String(value))
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
    loadHome,
    loadBooks,
    selectCategory,
    toggleBookFavorite,
    enterBook,
  }
})
