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

const startCourse = computed(
  () => catalog.courses.find((course) => course.progress > 0) ?? catalog.courses[0] ?? null,
)

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
  const category = catalog.selectedCategory
  const primary = category?.themeColorPrimary || course.themeColorPrimary || '#53634e'
  const secondary = category?.themeColorSecondary || course.themeColorSecondary || '#263128'
  return {
    '--card-a': primary,
    '--card-b': secondary,
    '--cover-a': primary,
    '--cover-b': secondary,
  }
}

function coverImageStyle(course: CourseSummary) {
  return {
    backgroundImage: course.coverUrl ? `url("${course.coverUrl}")` : undefined,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
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
        <template #lead>
          <label v-if="searchOpen" class="home-search-bar">
            <Search :size="18" />
            <input v-model="searchTerm" autofocus type="search" placeholder="搜索课程或分类" />
            <span>{{ searchResults ? `${searchResults.length} 个结果` : '键入关键词' }}</span>
          </label>

          <p v-if="error" class="inline-error">{{ error }}</p>

          <button
            v-if="startCourse && !searchOpen && catalog.selectedCategoryId !== 'favorite'"
            class="continue-card"
            type="button"
            :style="startStyle(startCourse)"
            @click="openCourse(startCourse)"
          >
            <span class="continue-card__cover cover-art" :style="coverImageStyle(startCourse)" />
            <span class="continue-card__body">
              <span class="continue-card__head">
                <span>{{ startCourse.progress > 0 ? '继续上次学习' : '开始第一课' }}</span>
                <span>{{ formatDuration(startCourse.durationMs) }}</span>
              </span>
              <h2>{{ startCourse.title }}</h2>
              <p>{{ startCourse.categoryName }} · {{ startCourse.description || '逐句听、读、写、说' }}</p>
              <span class="sl-progress sl-progress--light continue-card__progress">
                <span class="sl-progress__track">
                  <span class="sl-progress__value" :style="{ width: `${startCourse.progress}%` }" />
                </span>
              </span>
              <span class="continue-card__play"><Play :size="17" fill="currentColor" /></span>
            </span>
          </button>
        </template>
      </HomeFeed>
    </div>

    <AppBottomNav value="home" @navigate="(value) => router.push(value === 'home' ? '/' : '/me')" />
  </main>
</template>
