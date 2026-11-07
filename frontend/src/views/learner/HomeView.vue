<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Heart, Search, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import AppBottomNav from '@/components/AppBottomNav.vue'
import BookShelf from '@/components/course/BookShelf.vue'
import SlEmpty from '@/components/ui/SlEmpty.vue'
import { apiErrorMessage } from '@/api/http'
import { learnerApi } from '@/api/services'
import type { BookSummary } from '@/api/types'
import { useCatalogStore } from '@/stores/catalog'

const router = useRouter()
const catalog = useCatalogStore()
const searchOpen = ref(false)
const searchTerm = ref('')
const searchResults = ref<BookSummary[] | null>(null)
const error = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined

const visibleBooks = computed(() => searchResults.value ?? catalog.books)

const emptyState = computed(() => {
  if (searchResults.value) {
    return { title: '没有找到相关书籍', description: '换一个关键词试试，或关闭搜索返回分类。' }
  }
  if (catalog.selectedCategoryId === 'favorite') {
    return { title: '还没有收藏的书', description: '点亮书上的爱心，喜欢的书会留在这里。' }
  }
  return { title: '这个分类还在准备中', description: '管理员发布书籍后会出现在这里。' }
})

onMounted(async () => {
  try {
    await catalog.loadInterests()
    await catalog.loadBooks()
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
      searchResults.value = await learnerApi.books()
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

function openBook(book: BookSummary) {
  router.push(`/learn/${book.id}`)
}

function goTab(value: 'home' | 'recent' | 'me') {
  router.push(value === 'home' ? '/' : value === 'recent' ? '/recent' : '/me')
}

function bookStyle(book: BookSummary) {
  return {
    '--book-a': book.themeColorPrimary || '#53634e',
    '--book-b': book.themeColorSecondary || '#263128',
  }
}

function coverImageStyle(book: BookSummary) {
  return book.coverUrl
    ? { backgroundImage: `url("${book.coverUrl}")`, backgroundPosition: 'center', backgroundSize: 'cover' }
    : undefined
}

function tabLabel(name: string) {
  return name.replace(/日常|英语|训练/g, '') || name
}
</script>

<template>
  <main class="app-screen home-screen">
    <div class="home-scroll learner-home-scroll">
      <div class="home-tabs-row">
        <div class="sl-tabs home-tabs" role="tablist" aria-label="课程分类">
          <button
            v-for="category in catalog.interests"
            :key="category.id"
            class="sl-tab"
            type="button"
            role="tab"
            data-test="category-tab"
            :aria-selected="catalog.selectedCategoryId === category.id"
            @click="catalog.selectCategory(category.id)"
          >
            {{ tabLabel(category.name) }}
          </button>
          <button
            class="sl-tab"
            type="button"
            role="tab"
            :aria-selected="catalog.selectedCategoryId === 'favorite'"
            @click="catalog.selectCategory('favorite')"
          >
            我喜欢
          </button>
        </div>
        <button class="sl-icon-button home-search-toggle" type="button" :aria-label="searchOpen ? '关闭搜索' : '搜索课程'" @click="toggleSearch">
          <X v-if="searchOpen" :size="20" />
          <Search v-else :size="20" />
        </button>
      </div>

      <label v-if="searchOpen" class="home-search-bar">
        <Search :size="18" />
        <input v-model="searchTerm" autofocus type="search" placeholder="搜索书籍或分类" />
        <span>{{ searchResults ? `${searchResults.length} 本` : '键入关键词' }}</span>
      </label>

      <p v-if="error" class="inline-error">{{ error }}</p>

      <BookShelf
        v-if="visibleBooks.length"
        :books="visibleBooks"
        @open="openBook"
      />

      <div v-else>
        <SlEmpty :title="emptyState.title" :description="emptyState.description">
          <template #icon><Heart :size="24" /></template>
        </SlEmpty>
      </div>
    </div>

    <AppBottomNav value="home" @navigate="goTab" />
  </main>
</template>

<style scoped>
.home-tabs-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 -20px;
  padding: calc(18px + var(--safe-top)) 20px 0;
  border-bottom: 1px solid var(--color-border);
  z-index: 1000;
}

.home-tabs {
  min-width: 0;
  flex: 1;
}

.home-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-elevated);
}

.home-search-bar input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  outline: none;
}

.home-search-bar span {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  padding-top: 18px;
}

.book-card {
  position: relative;
  display: grid;
  gap: 10px;
  padding: 0 0 12px;
  border: 0;
  border-radius: 12px;
  background: var(--color-bg-elevated);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-float);
}

.book-card__cover {
  display: grid;
  place-items: center;
  aspect-ratio: 3 / 4;
  border-radius: 12px 12px 0 0;
  background: linear-gradient(135deg, var(--book-a), var(--book-b));
  color: rgba(255, 250, 240, .7);
}

.book-card__body {
  display: grid;
  gap: 5px;
  padding: 0 12px;
}

.book-card__title {
  font-size: 14px;
  font-weight: var(--weight-semibold);
  line-height: 1.3;
}

.book-card__meta {
  color: var(--color-text-secondary);
  font-size: 11px;
}

.book-card__progress {
  margin-top: 2px;
}

.book-card__heart {
  position: absolute;
  top: 8px;
  right: 8px;
  color: rgba(255, 250, 240, .9);
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, .4));
}

@media (min-width: 768px) {
  .home-tabs-row {
    margin-inline: 0;
    padding-inline: 0;
  }

  .book-grid {
    grid-template-columns: repeat(4, 1fr);
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
