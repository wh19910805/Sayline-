import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { learnerApi } from '@/api/services'
import type { Category, CourseSummary } from '@/api/types'

export const useCatalogStore = defineStore('catalog', () => {
  const interests = ref<Category[]>([])
  const allCategories = ref<Category[]>([])
  const courses = ref<CourseSummary[]>([])
  const selectedCategoryId = ref<number | 'favorite'>('favorite')
  const currentListIds = ref<number[]>([])
  const loading = ref(false)
  let interestsResolved = false

  const favoriteCount = computed(() => courses.value.filter((course) => course.favorite).length)
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

  async function loadCourses(query = '') {
    loading.value = true
    try {
      const response =
        selectedCategoryId.value === 'favorite'
          ? await learnerApi.favorites()
          : await learnerApi.courses(
              selectedCategoryId.value,
              query || undefined,
            )
      if (selectedCategoryId.value === 'favorite') {
        const favoriteIds = new Set(response.content.map((course) => course.id))
        courses.value = courses.value.map((course) => ({
          ...course,
          favorite: favoriteIds.has(course.id) || course.favorite,
        }))
      } else {
        courses.value = response.content
      }
      currentListIds.value = response.content.map((course) => course.id)
    } finally {
      loading.value = false
    }
  }

  async function selectCategory(value: number | 'favorite') {
    selectedCategoryId.value = value
    await loadCourses()
  }

  async function toggleFavorite(courseId: number) {
    const course = courses.value.find((item) => item.id === courseId)
    if (!course) return
    if (course.favorite) {
      await learnerApi.unfavorite(courseId)
    } else {
      await learnerApi.favorite(courseId)
    }
    course.favorite = !course.favorite
    if (selectedCategoryId.value === 'favorite' && !course.favorite) {
      courses.value = courses.value.filter((item) => item.id !== courseId)
    }
  }

  return {
    interests,
    allCategories,
    courses,
    selectedCategoryId,
    selectedCategory,
    currentListIds,
    favoriteCount,
    loading,
    loadInterests,
    loadCourses,
    selectCategory,
    toggleFavorite,
  }
})
