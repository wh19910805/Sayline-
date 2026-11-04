<script setup lang="ts">
import { computed } from 'vue'
import { Clock3, Heart } from 'lucide-vue-next'

import type { Category, CourseSummary } from '@/api/types'

const props = defineProps<{
  categories: Category[]
  courses: CourseSummary[]
  selectedCategoryId: number | 'favorite'
  favoriteCount?: number
  searchResults?: CourseSummary[] | null
}>()

const emit = defineEmits<{
  select: [value: number | 'favorite']
  openCourse: [course: CourseSummary]
  toggleFavorite: [courseId: number]
}>()

const currentCategory = computed(() =>
  props.categories.find((category) => category.id === props.selectedCategoryId),
)

const visibleCourses = computed(() => {
  if (props.searchResults) {
    return props.searchResults
  }
  if (props.selectedCategoryId === 'favorite') {
    return props.courses.filter((course) => course.favorite)
  }
  return props.courses.filter((course) => course.categoryId === props.selectedCategoryId)
})

const sectionTitle = computed(() => {
  if (props.searchResults) return '搜索结果'
  return props.selectedCategoryId === 'favorite' ? '我喜欢' : '为你准备'
})

function durationLabel(milliseconds: number) {
  const seconds = Math.max(0, Math.round(milliseconds / 1_000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function tabLabel(name: string) {
  return name.replace(/日常|英语|训练/g, '') || name
}

function coverStyle(course: CourseSummary) {
  return {
    '--card-color-a': course.themeColorPrimary || '#53634e',
    '--card-color-b': course.themeColorSecondary || '#263128',
  }
}

function categoryStyle(category: Category) {
  return {
    '--category-card-a': category.themeColorPrimary || '#53634e',
    '--category-card-b': category.themeColorSecondary || '#263128',
  }
}

function categoryImageStyle(category: Category) {
  return {
    backgroundImage: category.coverUrl ? `url("${category.coverUrl}")` : undefined,
  }
}
</script>

<template>
  <section class="home-feed">
    <div class="home-tabs-row">
      <div class="sl-tabs home-tabs" role="tablist" aria-label="课程分类">
        <button
          v-for="category in categories"
          :key="category.id"
          class="sl-tab"
          type="button"
          role="tab"
          data-test="category-tab"
          :aria-selected="selectedCategoryId === category.id"
          @click="emit('select', category.id)"
        >
          {{ tabLabel(category.name) }}
        </button>
        <button
          class="sl-tab"
          type="button"
          role="tab"
          data-test="category-tab"
          :aria-selected="selectedCategoryId === 'favorite'"
          @click="emit('select', 'favorite')"
        >
          我喜欢
          <span v-if="favoriteCount" class="home-tabs__count">{{ favoriteCount }}</span>
        </button>
      </div>
      <slot name="action" />
    </div>

    <slot name="lead" />

    <div class="section-heading">
      <h2>{{ sectionTitle }}</h2>
      <span class="section-count">{{ visibleCourses.length }} 门</span>
    </div>

    <div v-if="visibleCourses.length" class="course-feed">
      <article
        v-if="currentCategory && !searchResults"
        class="sl-category-card home-category-card"
        data-test="category-card"
        :style="categoryStyle(currentCategory)"
      >
        <div class="sl-category-card__image" :style="categoryImageStyle(currentCategory)" />
        <div class="sl-category-card__shade" />
        <div class="sl-category-card__top">
          <span>{{ visibleCourses.length }} 门课程</span>
        </div>
        <div class="sl-category-card__copy">
          <h2>{{ currentCategory.name }}</h2>
          <span>{{ currentCategory.description || '一句一句，听得更清楚' }}</span>
          <i />
        </div>
      </article>

      <article
        v-for="course in visibleCourses"
        :key="course.id"
        class="sl-course-card sl-course-card--feed"
        data-test="course-card"
        tabindex="0"
        @click="emit('openCourse', course)"
        @keydown.enter="emit('openCourse', course)"
      >
        <div class="sl-course-card__feed-cover-wrap">
          <div class="sl-course-card__feed-cover" :style="coverStyle(course)">
            <img v-if="course.coverUrl" :src="course.coverUrl" loading="lazy" decoding="async" alt="" />
          </div>
          <span class="sl-course-card__duration">
            <Clock3 :size="11" />
            {{ durationLabel(course.durationMs) }}
          </span>
          <button
            class="sl-course-card__favorite sl-course-card__favorite--feed"
            type="button"
            data-test="favorite-button"
            :aria-label="course.favorite ? '取消收藏' : '收藏课程'"
            :aria-pressed="course.favorite"
            @click.stop="emit('toggleFavorite', course.id)"
          >
            <Heart :size="18" :fill="course.favorite ? 'currentColor' : 'none'" />
          </button>
        </div>
        <div class="sl-course-card__feed-body">
          <h3 class="sl-course-card__title">{{ course.title }}</h3>
          <p class="sl-course-card__meta">{{ course.categoryName }}</p>
          <div class="sl-progress sl-course-card__progress">
            <div class="sl-progress__track">
              <span class="sl-progress__value" :style="{ width: `${course.progress}%` }" />
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="favorite-empty">
      <span class="favorite-empty__icon"><Heart :size="24" /></span>
      <h3>
        {{
          searchResults
            ? '没有找到相关课程'
            : selectedCategoryId === 'favorite'
              ? '还没有收藏课程'
              : '这个分类还在准备中'
        }}
      </h3>
      <p>
        {{
          searchResults
            ? '换一个关键词试试，或关闭搜索返回分类。'
            : selectedCategoryId === 'favorite'
            ? '在课程列表点亮爱心，喜欢的内容会留在这里。'
            : '管理员发布课程后会出现在这里。'
        }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.home-feed {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sl-course-card__feed-cover {
  position: relative;
}

.sl-course-card__feed-cover img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-tabs {
  min-width: 0;
  flex: 1;
}

.home-tabs-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 -20px;
  padding: calc(18px + var(--safe-top)) 20px 0;
  border-bottom: 1px solid var(--color-border);
}

.home-tabs__count {
  margin-left: 5px;
  color: var(--color-action);
  font-size: 10px;
}

.home-category-card {
  background-position: center;
  background-size: cover;
}

@media (min-width: 768px) {
  .home-tabs-row {
    margin-inline: 0;
    padding-inline: 0;
  }
}

@media (min-width: 1200px) {
  .home-tabs-row {
    width: min(calc(100% - 96px), 1180px);
    margin-inline: auto;
    padding-inline: 0;
  }
}
</style>
