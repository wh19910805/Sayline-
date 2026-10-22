<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Search, Play, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import AppBottomNav from '@/components/AppBottomNav.vue'
import HomeFeed from '@/components/course/HomeFeed.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { CourseSummary } from '@/api/types'
import { useCatalogStore } from '@/stores/catalog'
import { formatDuration } from '@/utils/format'

const router = useRouter()
const catalog = useCatalogStore()
const searchOpen = ref(false)
const searchTerm = ref('')
const searchResults = ref<CourseSummary[] | null>(null)
const error = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined

const startCourse = computed(() => catalog.courses[0] ?? null)

onMounted(async () => {
  try {
    await catalog.loadInterests()
    await catalog.loadCourses()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  }
})

watch(searchTerm, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  if (!value.trim()) {
    searchResults.value = null
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      const response = await learnerApi.courses(undefined, value.trim())
      searchResults.value = response.content
    } catch (reason) {
      error.value = apiErrorMessage(reason)
    }
  }, 260)
})

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (!searchOpen.value) {
    searchTerm.value = ''
    searchResults.value = null
  }
}

function openCourse(course: CourseSummary) {
  catalog.currentListIds = searchResults.value
    ? searchResults.value.map((item) => item.id)
    : catalog.courses
        .filter((item) =>
          catalog.selectedCategoryId === 'favorite'
            ? item.favorite
            : item.categoryId === catalog.selectedCategoryId,
        )
        .map((item) => item.id)
  router.push(`/learn/${course.id}`)
}

function startStyle(course: CourseSummary) {
  return {
    '--card-a': course.themeColorPrimary || '#53634e',
    '--card-b': course.themeColorSecondary || '#263128',
    backgroundImage: course.coverUrl ? `url("${course.coverUrl}")` : undefined,
  }
}
</script>

<template>
  <main class="app-screen home-screen">
    <div class="home-scroll learner-home-scroll">
      <HomeFeed
        :categories="catalog.interests"
        :courses="catalog.courses"
        :selected-category-id="catalog.selectedCategoryId"
        :favorite-count="catalog.favoriteCount"
        :search-results="searchResults"
        @select="catalog.selectCategory"
        @open-course="openCourse"
        @toggle-favorite="catalog.toggleFavorite"
      >
        <template #action>
          <button class="sl-icon-button home-search-toggle" type="button" :aria-label="searchOpen ? '关闭搜索' : '搜索课程'" @click="toggleSearch">
            <X v-if="searchOpen" :size="20" />
            <Search v-else :size="20" />
          </button>
        </template>
      </HomeFeed>

      <label v-if="searchOpen" class="home-search-bar">
        <Search :size="18" />
        <input v-model="searchTerm" autofocus type="search" placeholder="搜索课程或分类" />
        <span>{{ searchResults ? `${searchResults.length} 个结果` : '键入关键词' }}</span>
      </label>

      <p v-if="error" class="inline-error">{{ error }}</p>

      <button
        v-if="startCourse && !searchOpen"
        class="home-start-card"
        type="button"
        @click="openCourse(startCourse)"
      >
        <span class="home-start-card__art" :style="startStyle(startCourse)" />
        <span class="home-start-card__body">
          <small>{{ startCourse.categoryName }} · {{ formatDuration(startCourse.durationMs) }}</small>
          <h2>{{ startCourse.title }}</h2>
          <p>{{ startCourse.description || '听一句，读一句，再把它写下来。' }}</p>
          <span class="home-start-card__play"><Play :size="17" fill="currentColor" /></span>
        </span>
      </button>
    </div>

    <AppBottomNav value="home" @navigate="(value) => router.push(value === 'home' ? '/' : '/me')" />
  </main>
</template>

<style scoped>
.home-search-bar {
  margin-top: 16px;
}

.home-start-card {
  order: -1;
}
</style>
